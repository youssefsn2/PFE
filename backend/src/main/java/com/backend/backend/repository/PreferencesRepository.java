package com.backend.backend.repository;

import com.backend.backend.model.Preferences;
import com.backend.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PreferencesRepository extends JpaRepository<Preferences, Long> {

    // Trouver les préférences associées à un utilisateur
    Optional<Preferences> findByUser(User user);

    // Ou avec ID utilisateur directement
    Optional<Preferences> findByUserId(Long userId);
}
