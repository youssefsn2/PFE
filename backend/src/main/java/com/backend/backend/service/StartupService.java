package com.backend.backend.service;

import com.backend.backend.model.Preferences;
import com.backend.backend.model.UniteTemperature;
import com.backend.backend.model.User;
import com.backend.backend.repository.PreferencesRepository;
import com.backend.backend.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StartupService {

    private final UserRepository userRepository;
    private final PreferencesRepository preferencesRepository;

    public StartupService(UserRepository userRepository, PreferencesRepository preferencesRepository) {
        this.userRepository = userRepository;
        this.preferencesRepository = preferencesRepository;
    }

    @PostConstruct
    public void initPreferencesForExistingUsers() {
        List<User> users = userRepository.findAll();

        for (User user : users) {
            if (preferencesRepository.findByUser(user).isEmpty()) {

                Preferences prefs = new Preferences();
                prefs.setUser(user);

                // 🛡️ Initialisation manuelle de TOUS les champs obligatoires
                prefs.setUniteTemperature(UniteTemperature.CELSIUS);
                prefs.setNotificationsActives(true);
                prefs.setSeuilAqi(100f);   // AQI modéré
                prefs.setSeuilPm10(50f);   // µg/m³
                prefs.setSeuilPm25(25f);   // µg/m³
                prefs.setSeuilNo2(200f);   // µg/m³
                prefs.setSeuilO3(180f);    // µg/m³
                prefs.setSeuilCo(10f);     // ppm

                preferencesRepository.save(prefs);
                System.out.println("✅ Préférences créées pour : " + user.getEmail());
            } else {
                System.out.println("ℹ️ Préférences déjà existantes pour : " + user.getEmail());
            }
        }
    }
}
