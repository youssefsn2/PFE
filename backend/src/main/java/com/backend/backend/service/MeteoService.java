package com.backend.backend.service;

import com.backend.backend.model.Meteo;
import com.backend.backend.model.User;
import com.backend.backend.repository.MeteoRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class MeteoService {

    @Value("${weather.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final MeteoRepository meteoRepository;

    public MeteoService(RestTemplate restTemplate, MeteoRepository meteoRepository) {
        this.restTemplate = restTemplate;
        this.meteoRepository = meteoRepository;
    }

    // ✅ Météo actuelle de l'utilisateur avec sauvegarde en base
    public Map<String, Object> getMeteoActuelle(User user) {
        // ✅ Fixed: Add missing "=" in URL
        String url = "https://api.openweathermap.org/data/2.5/weather?lat=" + user.getLatitude()
                + "&lon=" + user.getLongitude() + "&appid" + apiKey + "&units=metric";

        System.out.println("🌍 URL envoyée à OpenWeather : " + url);

        Map<String, Object> response = (Map<String, Object>) restTemplate.getForObject(url, Object.class);

        // Sauvegarder en base de données
        if (response != null) {
            sauvegarderMeteoActuelle(user, response);
        }

        return response;
    }

    // ✅ Prévision météo sur 5 jours avec sauvegarde en base
    public Map<String, Object> getPrevision5Jours(User user) {
        // ✅ Fixed: Add missing "=" in URL
        String url = "https://api.openweathermap.org/data/2.5/forecast?lat=" + user.getLatitude()
                + "&lon=" + user.getLongitude() + "&appid" + apiKey + "&units=metric";

        Map<String, Object> response = (Map<String, Object>) restTemplate.getForObject(url, Object.class);

        // Sauvegarder en base de données
        if (response != null) {
            sauvegarderPrevisions(user, response);
        }

        return response;
    }

    // ✅ Fixed: Handle multiple results properly
    public Optional<Meteo> getMeteoActuelleFromDB(User user) {
        try {
            // Solution 1: Use the fixed query with LIMIT 1
            return meteoRepository.findLatestMeteoActuelleByUser(user.getId());
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la récupération de la météo actuelle : " + e.getMessage());

            // Fallback: Use alternative method
            List<Meteo> meteoList = meteoRepository.findAllMeteoActuelleByUserOrderByDateDesc(user);
            if (!meteoList.isEmpty()) {
                return Optional.of(meteoList.get(0));
            }
            return Optional.empty();
        }
    }

    // ✅ Alternative method using Pageable
    public Optional<Meteo> getMeteoActuelleFromDBWithPageable(User user) {
        Pageable pageable = PageRequest.of(0, 1); // Get only the first result
        List<Meteo> meteoList = meteoRepository.findLatestMeteoActuelleByUserWithLimit(user, pageable);
        return meteoList.isEmpty() ? Optional.empty() : Optional.of(meteoList.get(0));
    }

    // ✅ Récupérer les prévisions depuis la base de données
    public List<Meteo> getPrevisionsFromDB(User user) {
        return meteoRepository.findPrevisionsMeteoByUser(user);
    }

    // ✅ Enhanced: Clean old current weather data before saving new one
    private void sauvegarderMeteoActuelle(User user, Map<String, Object> meteoData) {
        try {
            // Clean old current weather data for this user (keep only last 24 hours)
            LocalDateTime cutoffTime = LocalDateTime.now().minusHours(24);
            meteoRepository.deleteOldCurrentWeatherForUser(user, cutoffTime);

            Map<String, Object> main = (Map<String, Object>) meteoData.get("main");
            Map<String, Object> wind = (Map<String, Object>) meteoData.get("wind");
            List<Map<String, Object>> weather = (List<Map<String, Object>>) meteoData.get("weather");
            Map<String, Object> sys = (Map<String, Object>) meteoData.get("sys");
            Map<String, Object> coord = (Map<String, Object>) meteoData.get("coord");

            if (main != null && weather != null && !weather.isEmpty()) {
                Meteo meteo = new Meteo();
                meteo.setUser(user);
                meteo.setTemperature(Double.parseDouble(main.get("temp").toString()));
                meteo.setTemperatureRessentie(Double.parseDouble(main.get("feels_like").toString()));
                meteo.setHumidite(Integer.parseInt(main.get("humidity").toString()));
                meteo.setPression(Double.parseDouble(main.get("pressure").toString()));
                meteo.setDescription(weather.get(0).get("description").toString());
                meteo.setIcone(weather.get(0).get("icon").toString());
                meteo.setVitesseVent(wind != null ? Double.parseDouble(wind.get("speed").toString()) : 0.0);
                meteo.setDirectionVent(wind != null && wind.get("deg") != null ?
                        Integer.parseInt(wind.get("deg").toString()) : null);
                meteo.setLatitude(coord != null ? Double.parseDouble(coord.get("lat").toString()) : user.getLatitude());
                meteo.setLongitude(coord != null ? Double.parseDouble(coord.get("lon").toString()) : user.getLongitude());
                meteo.setVille(meteoData.get("name").toString());
                meteo.setPays(sys != null ? sys.get("country").toString() : "");
                meteo.setDateCreation(LocalDateTime.now());
                meteo.setTypeMeteo(Meteo.TypeMeteo.ACTUELLE);

                meteoRepository.save(meteo);
                System.out.println("✅ Météo actuelle sauvegardée pour l'utilisateur : " + user.getEmail());

                // Debug: Count current weather records
                long count = meteoRepository.countCurrentWeatherByUser(user);
                System.out.println("📊 Nombre de météos actuelles pour " + user.getEmail() + " : " + count);
            }
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la sauvegarde de la météo actuelle : " + e.getMessage());
            e.printStackTrace();
        }
    }

    // ✅ Sauvegarder les prévisions en base
    private void sauvegarderPrevisions(User user, Map<String, Object> previsionData) {
        try {
            List<Map<String, Object>> list = (List<Map<String, Object>>) previsionData.get("list");
            Map<String, Object> city = (Map<String, Object>) previsionData.get("city");
            Map<String, Object> coord = city != null ? (Map<String, Object>) city.get("coord") : null;

            if (list != null) {
                // Supprimer les anciennes prévisions de cet utilisateur
                List<Meteo> anciennesPrevisions = meteoRepository.findPrevisionsMeteoByUser(user);
                meteoRepository.deleteAll(anciennesPrevisions);

                for (Map<String, Object> item : list) {
                    Map<String, Object> main = (Map<String, Object>) item.get("main");
                    Map<String, Object> wind = (Map<String, Object>) item.get("wind");
                    List<Map<String, Object>> weather = (List<Map<String, Object>>) item.get("weather");
                    String dtTxt = item.get("dt_txt").toString();

                    if (main != null && weather != null && !weather.isEmpty()) {
                        Meteo meteo = new Meteo();
                        meteo.setUser(user);
                        meteo.setTemperature(Double.parseDouble(main.get("temp").toString()));
                        meteo.setTemperatureRessentie(Double.parseDouble(main.get("feels_like").toString()));
                        meteo.setHumidite(Integer.parseInt(main.get("humidity").toString()));
                        meteo.setPression(Double.parseDouble(main.get("pressure").toString()));
                        meteo.setDescription(weather.get(0).get("description").toString());
                        meteo.setIcone(weather.get(0).get("icon").toString());
                        meteo.setVitesseVent(wind != null ? Double.parseDouble(wind.get("speed").toString()) : 0.0);
                        meteo.setDirectionVent(wind != null && wind.get("deg") != null ?
                                Integer.parseInt(wind.get("deg").toString()) : null);
                        meteo.setLatitude(coord != null ? Double.parseDouble(coord.get("lat").toString()) : user.getLatitude());
                        meteo.setLongitude(coord != null ? Double.parseDouble(coord.get("lon").toString()) : user.getLongitude());
                        meteo.setVille(city != null ? city.get("name").toString() : "");
                        meteo.setPays(city != null ? city.get("country").toString() : "");
                        meteo.setDateCreation(LocalDateTime.now());
                        meteo.setDatePrevision(LocalDateTime.parse(dtTxt, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
                        meteo.setTypeMeteo(Meteo.TypeMeteo.PREVISION);

                        meteoRepository.save(meteo);
                    }
                }
                System.out.println("✅ Prévisions sauvegardées pour l'utilisateur : " + user.getEmail());
            }
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la sauvegarde des prévisions : " + e.getMessage());
            e.printStackTrace();
        }
    }

    // ✅ Enhanced: Clean old data with better logic
    public void nettoyerAnciennesDonnees() {
        try {
            LocalDateTime dateLimit = LocalDateTime.now().minusDays(7);
            meteoRepository.deleteOldMeteoData(dateLimit);
            System.out.println("🧹 Anciennes données météo supprimées (plus de 7 jours)");
        } catch (Exception e) {
            System.err.println("❌ Erreur lors du nettoyage des données : " + e.getMessage());
        }
    }

    // ✅ Obtenir l'historique météo d'un utilisateur
    public List<Meteo> getHistoriqueMeteo(User user, LocalDateTime dateDebut, LocalDateTime dateFin) {
        return meteoRepository.findMeteoByUserAndDateRange(user, dateDebut, dateFin);
    }
}