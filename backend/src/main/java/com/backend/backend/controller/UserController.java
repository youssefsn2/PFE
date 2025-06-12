package com.backend.backend.controller;

import com.backend.backend.model.Preferences;
import com.backend.backend.model.User;
import com.backend.backend.repository.PreferencesRepository;
import com.backend.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/user")
public class UserController {

    private final UserRepository userRepository;
    private final PreferencesRepository preferencesRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository, PreferencesRepository preferencesRepository,  PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.preferencesRepository = preferencesRepository;
        this.passwordEncoder = passwordEncoder;
    }
    @PutMapping("/password")
    public ResponseEntity<?> updatePassword(@RequestBody Map<String, String> payload) {
        User user = getAuthenticatedUser();

        String currentPassword = payload.get("currentPassword");
        String newPassword = payload.get("newPassword");

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return ResponseEntity.badRequest().body("Mot de passe actuel incorrect !");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return ResponseEntity.ok("Mot de passe mis à jour avec succès !");
    }

    // ✅ Récupérer les préférences de l'utilisateur

    @PutMapping("/update-location")
    public ResponseEntity<?> updateLocation(@RequestBody Map<String, Double> coords) {
        User user = getAuthenticatedUser();
        user.setLatitude(coords.get("latitude"));
        user.setLongitude(coords.get("longitude"));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Localisation mise à jour"));
    }

    @PutMapping("/preferences")
    public ResponseEntity<?> updatePreferences(@RequestBody Preferences updatedPrefs) {
        User user = getAuthenticatedUser();

        Preferences prefs = preferencesRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Préférences introuvables pour l'utilisateur"));

        prefs.setUniteTemperature(updatedPrefs.getUniteTemperature());
        prefs.setNotificationsActives(updatedPrefs.isNotificationsActives());
        prefs.setSeuilAqi(updatedPrefs.getSeuilAqi());
        prefs.setSeuilPm10(updatedPrefs.getSeuilPm10());
        prefs.setSeuilPm25(updatedPrefs.getSeuilPm25());
        prefs.setSeuilNo2(updatedPrefs.getSeuilNo2());
        prefs.setSeuilO3(updatedPrefs.getSeuilO3());
        prefs.setSeuilCo(updatedPrefs.getSeuilCo());

        preferencesRepository.save(prefs);

        return ResponseEntity.ok("✅ Préférences mises à jour !");
    }
    @GetMapping("/preferences")
    public ResponseEntity<?> getPreferences() {
        User user = getAuthenticatedUser();

        Preferences prefs = preferencesRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Préférences introuvables pour l'utilisateur"));

        return ResponseEntity.ok(prefs);
    }


    @PutMapping("/update-info")
    public ResponseEntity<?> updateUserInfo(@RequestBody Map<String, String> payload) {
        User user = getAuthenticatedUser();

        String firstName = payload.get("firstName");
        String lastName = payload.get("lastName");
        String currentPassword = payload.get("currentPassword"); // requis si tu veux changer le mot de passe
        String newPassword = payload.get("newPassword");         // nouveau mot de passe

        // ✅ Mise à jour prénom et nom si fournis
        if (firstName != null && !firstName.isBlank()) {
            user.setFirstName(firstName);
        }
        if (lastName != null && !lastName.isBlank()) {
            user.setLastName(lastName);
        }

        // ✅ Mise à jour du mot de passe si un nouveau est fourni
        if (newPassword != null && !newPassword.isBlank()) {
            if (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPassword())) {
                return ResponseEntity.badRequest().body("Mot de passe actuel incorrect !");
            }
            user.setPassword(passwordEncoder.encode(newPassword));
        }

        userRepository.save(user);
        return ResponseEntity.ok("✅ Informations mises à jour !");
    }


    // ✅ Fonction pour récupérer l'utilisateur authentifié
    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé !"));
    }


    @PostMapping("/fcm-token")
    public ResponseEntity<?> saveFcmToken(@RequestBody Map<String, String> body) {
        String fcmToken = body.get("fcmToken");

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) return ResponseEntity.status(404).body("Utilisateur introuvable");

        User user = userOpt.get();

        userRepository.save(user);

        return ResponseEntity.ok("✅ Token FCM enregistré !");
    }




}
