package com.backend.backend.service;

import com.backend.backend.model.AirQuality;
import com.backend.backend.model.Preferences;
import com.backend.backend.model.User;
import com.backend.backend.repository.AirQualityRepository;
import com.backend.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AirQualityService {

    private final RestTemplate restTemplate;
    private final AirQualityRepository airQualityRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Autowired
    public AirQualityService(
            RestTemplate restTemplate,
            AirQualityRepository airQualityRepository,
            UserRepository userRepository,
            NotificationService notificationService
    ) {
        this.restTemplate = restTemplate;
        this.airQualityRepository = airQualityRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public Map<String, Object> getLiveAirQualityAndSave() {
        String url = "http://localhost:5001/api/capteurs";
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> liveData = response.getBody();
                System.out.println("📱 Données live reçues de Flask : " + liveData);

                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                if (authentication == null || !authentication.isAuthenticated()) {
                    System.out.println("⚠ Aucun utilisateur authentifié, données non enregistrées.");
                    return liveData;
                }

                String userEmail = authentication.getName();
                Optional<User> userOpt = userRepository.findByEmail(userEmail);
                if (userOpt.isEmpty()) {
                    System.out.println("❌ Utilisateur introuvable : " + userEmail);
                    return liveData;
                }

                User user = userOpt.get();
                Preferences prefs = user.getPreferences();

                AirQuality data = new AirQuality();
                data.setPm25(getDoubleValue(liveData.get("pm25")));
                data.setPm10(getDoubleValue(liveData.get("pm10")));
                data.setNo2(getDoubleValue(liveData.get("no2")));
                data.setO3(getDoubleValue(liveData.get("o3")));
                data.setCo(getDoubleValue(liveData.get("co")));
                data.setAqi(getIntegerValue(liveData.get("aqi")));
                data.setTimestamp(LocalDateTime.now());
                data.setUser(user);

                airQualityRepository.save(data);
                System.out.println("✅ Données enregistrées pour : " + user.getEmail());

                // 🔔 Notifications selon préférences utilisateur
                if (prefs.isNotificationsActives()) {
                    if (data.getAqi() > prefs.getSeuilAqi()) {
                        notificationService.sendPollutionAlert(user.getId(), data.getAqi());
                    }
                    if (data.getPm10() > prefs.getSeuilPm10()) {
                        notificationService.sendPM10Alert(user.getId(), data.getPm10());
                    }
                    if (data.getPm25() > prefs.getSeuilPm25()) {
                        notificationService.sendAlert(user.getId(), "pm25", "PM2.5 élevé : " + data.getPm25());
                    }
                    if (data.getNo2() > prefs.getSeuilNo2()) {
                        notificationService.sendNO2Alert(user.getId(), data.getNo2());
                    }
                    if (data.getO3() > prefs.getSeuilO3()) {
                        notificationService.sendAlert(user.getId(), "o3", "O3 élevé : " + data.getO3());
                    }
                    if (data.getCo() > prefs.getSeuilCo()) {
                        notificationService.sendAlert(user.getId(), "co", "CO élevé : " + data.getCo());
                    }
                }

                return liveData;

            } else {
                System.out.println("❌ Erreur lors de la récupération des données live !");
                return null;
            }

        } catch (Exception e) {
            System.out.println("❌ Erreur de connexion à Flask : " + e.getMessage());
            return null;
        }
    }

    public AirQuality getLatestAirQuality(User user) {
        return airQualityRepository.findFirstByUserOrderByTimestampDesc(user);
    }

    public List<AirQuality> getAirQualityHistoryForUser(User user) {
        return airQualityRepository.findAllByUserOrderByTimestampDesc(user);
    }

    private double getDoubleValue(Object value) {
        return value instanceof Number ? ((Number) value).doubleValue() : Double.parseDouble(value.toString());
    }

    private int getIntegerValue(Object value) {
        return value instanceof Number ? ((Number) value).intValue() : Integer.parseInt(value.toString());
    }

}
