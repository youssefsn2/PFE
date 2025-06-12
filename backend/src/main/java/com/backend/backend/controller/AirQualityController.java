package com.backend.backend.controller;

import com.backend.backend.model.AirQuality;
import com.backend.backend.model.User;
import com.backend.backend.repository.UserRepository;
import com.backend.backend.service.AirQualityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/air")
public class AirQualityController {

    private final AirQualityService airQualityService;
    private final UserRepository userRepository;

    @Autowired
    public AirQualityController(AirQualityService airQualityService, UserRepository userRepository) {
        this.airQualityService = airQualityService;
        this.userRepository = userRepository;
    }

    /**
     * ✅ 1️⃣ Récupère les données live depuis Flask + enregistre si utilisateur connecté
     */
    @GetMapping("/live")
    public ResponseEntity<?> getLiveAirQuality() {
        Map<String, Object> liveData = airQualityService.getLiveAirQualityAndSave();
        if (liveData != null) {
            return ResponseEntity.ok(liveData);
        } else {
            return ResponseEntity.status(500).body("Erreur lors de la récupération des données live.");
        }
    }

    /**
     * ✅ 2️⃣ Récupère l'historique des données enregistrées pour l'utilisateur connecté
     */
    @GetMapping("/history")
    public ResponseEntity<?> getUserAirQualityHistory() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("Utilisateur non authentifié.");
        }

        String userEmail = authentication.getName();
        Optional<User> userOpt = userRepository.findByEmail(userEmail);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Utilisateur introuvable.");
        }

        User user = userOpt.get();
        List<AirQuality> history = airQualityService.getAirQualityHistoryForUser(user);

        return ResponseEntity.ok(history);
    }
}
