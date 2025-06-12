package com.backend.backend.repository;

import com.backend.backend.model.RoleType;
import com.backend.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findFirstByRole_Name(RoleType roleName);

    // ✅ Recherche par prénom, nom ou email (insensible à la casse)
    List<User> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String firstName, String lastName, String email
    );
}
