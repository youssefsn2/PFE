package com.backend.backend.service;

import com.backend.backend.model.Role;
import com.backend.backend.model.RoleType;
import com.backend.backend.model.User;
import com.backend.backend.repository.RoleRepository;
import com.backend.backend.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class DatabaseInitializer {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseInitializer(RoleRepository roleRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostConstruct
    public void initializeDatabase() {
        // Parcourir tous les rôles définis dans RoleType
        for (RoleType roleType : RoleType.values()) {

            // Vérifier si le rôle existe, sinon le créer
            Role role = roleRepository.findByName(roleType).orElseGet(() -> {
                Role newRole = new Role();
                newRole.setName(roleType);
                roleRepository.save(newRole);
                System.out.println("✅ Rôle " + roleType + " créé.");
                return newRole;
            });

            // Créer un utilisateur pour ce rôle
            String roleName = roleType.name().toLowerCase().replace("role_", ""); // admin, ingenieur, technicien
            String email = roleName + "@" + roleName + ".com";
            String password = roleName + "123";

            Optional<User> existingUser = userRepository.findByEmail(email);
            if (existingUser.isEmpty()) {
                User newUser = new User();
                newUser.setEmail(email);
                newUser.setPassword(passwordEncoder.encode(password));
                newUser.setFirstName(capitalize(roleName)); // Prénom = Admin, Ingenieur, etc.
                newUser.setLastName("Système");              // Nom = Système
                newUser.setLatitude(34.0209);
                newUser.setLongitude(-6.8416);
                newUser.setRole(role);

                userRepository.save(newUser);
                System.out.println("✅ Utilisateur pour " + roleType + " créé.");
                System.out.println("   📧 Email : " + email);
                System.out.println("   🔐 Mot de passe : " + password);
            } else {
                System.out.println("ℹ️ L’utilisateur " + email + " existe déjà.");
            }
        }
    }

    // Fonction pour mettre la première lettre en majuscule
    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }
}
