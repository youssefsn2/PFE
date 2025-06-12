package com.backend.backend.service;

import com.backend.backend.model.Preferences;
import com.backend.backend.model.UniteTemperature;
import com.backend.backend.model.User;
import com.backend.backend.repository.PreferencesRepository;
import com.backend.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class PreferencesService {

    private final PreferencesRepository preferencesRepository;
    private final UserRepository userRepository;

    @Autowired
    public PreferencesService(PreferencesRepository preferencesRepository, UserRepository userRepository) {
        this.preferencesRepository = preferencesRepository;
        this.userRepository = userRepository;
    }

    /**
     * Obtenir les préférences par utilisateur
     */
    public Optional<Preferences> getPreferencesForUser(Long userId) {
        return preferencesRepository.findByUserId(userId);
    }

    /**
     * Créer des préférences avec les seuils par défaut si elles n’existent pas
     */
    @Transactional
    public Preferences createDefaultPreferencesIfAbsent(User user) {
        return preferencesRepository.findByUser(user).orElseGet(() -> {
            Preferences prefs = new Preferences();
            prefs.setUser(user);
            return preferencesRepository.save(prefs);
        });
    }

    /**
     * Modifier toutes les préférences
     */
    @Transactional
    public Preferences updatePreferences(Long userId, Preferences updatedPrefs) {
        return preferencesRepository.findByUserId(userId).map(prefs -> {
            prefs.setUniteTemperature(updatedPrefs.getUniteTemperature());
            prefs.setNotificationsActives(updatedPrefs.isNotificationsActives());

            prefs.setSeuilAqi(updatedPrefs.getSeuilAqi());
            prefs.setSeuilPm10(updatedPrefs.getSeuilPm10());
            prefs.setSeuilPm25(updatedPrefs.getSeuilPm25());
            prefs.setSeuilNo2(updatedPrefs.getSeuilNo2());
            prefs.setSeuilO3(updatedPrefs.getSeuilO3());
            prefs.setSeuilCo(updatedPrefs.getSeuilCo());

            return preferencesRepository.save(prefs);
        }).orElseThrow(() -> new RuntimeException("⚠️ Préférences introuvables pour l'utilisateur ID " + userId));
    }
}
