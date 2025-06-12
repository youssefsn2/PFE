package com.backend.backend.controller;

import com.backend.backend.model.Role;
import com.backend.backend.model.RoleType;
import com.backend.backend.model.User;
import com.backend.backend.repository.RoleRepository;
import com.backend.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasAuthority('ROLE_ADMIN')") // ✅ Seul l'admin peut accéder
public class AdminController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminController(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ✅ 1️⃣ Lister tous les utilisateurs
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    // ✅ 2️⃣ Voir un utilisateur par ID
    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        Optional<User> user = userRepository.findById(id);
        return user.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User updatedUser) {
        return userRepository.findById(id)
                .map(user -> {
                    // Mise à jour des champs
                    if (updatedUser.getEmail() != null) {
                        user.setEmail(updatedUser.getEmail());
                    }
                    if (updatedUser.getFirstName() != null) {
                        user.setFirstName(updatedUser.getFirstName());
                    }
                    if (updatedUser.getLastName() != null) {
                        user.setLastName(updatedUser.getLastName());
                    }

                    // Mise à jour et encodage du mot de passe si fourni
                    if (updatedUser.getPassword() != null && !updatedUser.getPassword().isEmpty()) {
                        // Encodage du mot de passe avec passwordEncoder
                        user.setPassword(passwordEncoder.encode(updatedUser.getPassword()));
                    }

                    // Conserver les coordonnées existantes
                    // (pas besoin de les modifier car elles ne sont pas modifiables dans l'interface)

                    // Mise à jour du rôle si fourni
                    if (updatedUser.getRole() != null && updatedUser.getRole().getName() != null) {
                        Optional<Role> role = roleRepository.findByName(updatedUser.getRole().getName());
                        role.ifPresent(user::setRole);
                    }

                    userRepository.save(user);
                    return ResponseEntity.ok("Utilisateur mis à jour avec succès !");
                }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ✅ 4️⃣ Supprimer un utilisateur
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return ResponseEntity.ok("Utilisateur supprimé avec succès !");
        }
        return ResponseEntity.notFound().build();
    }



    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody User newUser) {
        if (userRepository.existsByEmail(newUser.getEmail())) {
            return ResponseEntity.badRequest().body("❌ Cet email est déjà utilisé.");
        }

        if (newUser.getPassword() == null || newUser.getPassword().isEmpty()) {
            return ResponseEntity.badRequest().body("❌ Le mot de passe est requis.");
        }

        // Encodage du mot de passe
        newUser.setPassword(passwordEncoder.encode(newUser.getPassword()));

        // Récupération et validation du rôle
        if (newUser.getRole() != null && newUser.getRole().getName() != null) {
            Optional<Role> role = roleRepository.findByName(newUser.getRole().getName());
            if (role.isEmpty()) {
                return ResponseEntity.badRequest().body("❌ Rôle invalide.");
            }
            newUser.setRole(role.get());
        } else {
            return ResponseEntity.badRequest().body("❌ Rôle requis.");
        }

        // Sauvegarde de l'utilisateur
        User saved = userRepository.save(newUser);
        return ResponseEntity.ok(saved);
    }

}
