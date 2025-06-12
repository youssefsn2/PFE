package com.backend.backend.controller;

import com.backend.backend.model.Preferences;
import com.backend.backend.model.Role;
import com.backend.backend.model.RoleType;
import com.backend.backend.model.User;
import com.backend.backend.repository.PreferencesRepository;
import com.backend.backend.repository.RoleRepository;
import com.backend.backend.repository.UserRepository;
import com.backend.backend.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PreferencesRepository preferencesRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(AuthenticationManager authenticationManager,
                          UserRepository userRepository,
                          RoleRepository roleRepository,
                          PreferencesRepository preferencesRepository,
                          PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.preferencesRepository = preferencesRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody User user) {
        System.out.println("➡️ Tentative d'inscription pour : " + user.getEmail());

        if (userRepository.existsByEmail(user.getEmail())) {
            return ResponseEntity.badRequest().body("❌ Email déjà utilisé !");
        }

        if (isBlank(user.getEmail()) || isBlank(user.getPassword()) ||
                isBlank(user.getFirstName()) || isBlank(user.getLastName())) {
            return ResponseEntity.badRequest().body("❌ Tous les champs sont obligatoires !");
        }

        if (user.getLatitude() == 0.0 || user.getLongitude() == 0.0) {
            return ResponseEntity.badRequest().body("❌ Latitude et longitude sont obligatoires !");
        }

        Role userRole = roleRepository.findByName(RoleType.ROLE_INGENIEUR)
                .orElseGet(() -> roleRepository.save(new Role(RoleType.ROLE_INGENIEUR)));

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole(userRole);

        User savedUser = userRepository.save(user);

        // ✅ Créer et sauvegarder les préférences par défaut
        Preferences preferences = new Preferences();
        preferences.setUser(savedUser);
        preferencesRepository.save(preferences);

        System.out.println("✅ Utilisateur enregistré avec succès : " + user.getEmail());
        return ResponseEntity.ok("✅ Utilisateur enregistré avec succès !");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user) {
        System.out.println("➡️ Tentative de connexion pour : " + user.getEmail());

        User existingUser = userRepository.findByEmail(user.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!passwordEncoder.matches(user.getPassword(), existingUser.getPassword())) {
            return ResponseEntity.badRequest().body("Mot de passe incorrect !");
        }

        String token = jwtUtil.generateToken(existingUser);
        System.out.println("✅ Connexion réussie, token généré : " + token);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("email", existingUser.getEmail());
        response.put("role", existingUser.getRole().getName());
        response.put("name", existingUser.getFirstName() + " " + existingUser.getLastName());
        response.put("id", existingUser.getId());

        return ResponseEntity.ok(response);
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
