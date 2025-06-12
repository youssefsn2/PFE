package com.backend.backend.controller;

import com.backend.backend.model.Meteo;
import com.backend.backend.model.User;
import com.backend.backend.repository.UserRepository;
import com.backend.backend.service.MeteoService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/meteo")
public class MeteoController {

    private final MeteoService meteoService;
    private final UserRepository userRepository;

    public MeteoController(MeteoService meteoService, UserRepository userRepository) {
        this.meteoService = meteoService;
        this.userRepository = userRepository;
    }

    // ✅ Météo actuelle de l'utilisateur (API + sauvegarde en base)
    @GetMapping("/actuelle")
    public ResponseEntity<?> getMeteoActuelle() {
        User user = getAuthenticatedUser();
        Map<String, Object> meteo = meteoService.getMeteoActuelle(user);
        return ResponseEntity.ok(meteo);
    }

    // ✅ Prévision météo sur 5 jours (API + sauvegarde en base)
    @GetMapping("/prevision")
    public ResponseEntity<?> getPrevisionMeteo() {
        User user = getAuthenticatedUser();
        Map<String, Object> prevision = meteoService.getPrevision5Jours(user);
        return ResponseEntity.ok(prevision);
    }

    // ✅ Récupérer la dernière météo actuelle depuis la base de données
    @GetMapping("/actuelle/db")
    public ResponseEntity<?> getMeteoActuelleFromDB() {
        User user = getAuthenticatedUser();
        Optional<Meteo> meteo = meteoService.getMeteoActuelleFromDB(user);

        if (meteo.isPresent()) {
            return ResponseEntity.ok(meteo.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // ✅ Récupérer les prévisions depuis la base de données
    @GetMapping("/previsions/db")
    public ResponseEntity<?> getPrevisionsFromDB() {
        User user = getAuthenticatedUser();
        List<Meteo> previsions = meteoService.getPrevisionsFromDB(user);
        return ResponseEntity.ok(previsions);
    }

    // ✅ Récupérer l'historique météo pour une période donnée
    @GetMapping("/historique")
    public ResponseEntity<?> getHistoriqueMeteo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateDebut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFin) {

        User user = getAuthenticatedUser();
        List<Meteo> historique = meteoService.getHistoriqueMeteo(user, dateDebut, dateFin);
        return ResponseEntity.ok(historique);
    }

    // ✅ Comparaison entre météo actuelle et prévision
    @GetMapping("/comparaison")
    public ResponseEntity<?> comparerMeteo() {
        User user = getAuthenticatedUser();
        Map<String, Object> meteoActuelle = meteoService.getMeteoActuelle(user);
        Map<String, Object> prevision5Jours = meteoService.getPrevision5Jours(user);

        List<Map<String, Object>> listePrevisions = (List<Map<String, Object>>) prevision5Jours.get("list");

        if (listePrevisions == null || listePrevisions.isEmpty()) {
            return ResponseEntity.badRequest().body("Erreur : Aucune prévision disponible.");
        }

        Map<String, Object> previsionJour1 = listePrevisions.get(0);

        if (meteoActuelle.get("main") == null || previsionJour1.get("main") == null) {
            return ResponseEntity.badRequest().body("Erreur : Données météo incomplètes.");
        }

        double tempActuelle = Double.parseDouble(((Map<String, Object>) meteoActuelle.get("main")).get("temp").toString());
        double tempPrevue = Double.parseDouble(((Map<String, Object>) previsionJour1.get("main")).get("temp").toString());
        String ville = (String) meteoActuelle.get("name");
        return ResponseEntity.ok(Map.of(
                "temp_actuelle", tempActuelle,
                "temp_prev", tempPrevue,
                "difference", tempActuelle - tempPrevue,
                "ville", ville // 👈 Ajout de la ville ici

        ));
    }

    // ✅ Comparaison basée sur les données de la base de données
    @GetMapping("/comparaison/db")
    public ResponseEntity<?> comparerMeteoFromDB() {
        User user = getAuthenticatedUser();
        Optional<Meteo> meteoActuelle = meteoService.getMeteoActuelleFromDB(user);
        List<Meteo> previsions = meteoService.getPrevisionsFromDB(user);

        if (meteoActuelle.isEmpty()) {
            return ResponseEntity.badRequest().body("Erreur : Aucune météo actuelle disponible en base.");
        }

        if (previsions.isEmpty()) {
            return ResponseEntity.badRequest().body("Erreur : Aucune prévision disponible en base.");
        }

        Meteo meteoAct = meteoActuelle.get();
        Meteo premierePrevision = previsions.get(0);

        return ResponseEntity.ok(Map.of(
                "temp_actuelle", meteoAct.getTemperature(),
                "temp_prev", premierePrevision.getTemperature(),
                "difference", meteoAct.getTemperature() - premierePrevision.getTemperature(),
                "date_actuelle", meteoAct.getDateCreation(),
                "date_prevision", premierePrevision.getDatePrevision(),
                "ville", meteoAct.getVille() // ✅ ICI : ajout du champ "ville"


        ));
    }

    // ✅ Nettoyer les anciennes données (endpoint administratif)
    @DeleteMapping("/nettoyer")
    public ResponseEntity<?> nettoyerAnciennesDonnees() {
        meteoService.nettoyerAnciennesDonnees();
        return ResponseEntity.ok(Map.of("message", "Anciennes données supprimées avec succès"));
    }

    // ✅ Récupérer l'utilisateur authentifié
    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé !"));
    }
}