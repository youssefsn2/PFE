package com.backend.backend.service;

import com.backend.backend.model.Notification;
import com.backend.backend.model.Preferences;
import com.backend.backend.model.User;
import com.backend.backend.repository.NotificationRepository;
import com.backend.backend.repository.UserRepository;
import com.backend.backend.repository.PreferencesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final PreferencesRepository preferencesRepository;

    @Autowired
    public NotificationService(SimpMessagingTemplate messagingTemplate,
                               NotificationRepository notificationRepository,
                               UserRepository userRepository,
                               PreferencesRepository preferencesRepository) {
        this.messagingTemplate = messagingTemplate;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.preferencesRepository = preferencesRepository;
    }

    // 🔔 Envoi WebSocket + enregistrement en base
    public void sendAlert(Long userId, String type, String message) {
        LocalDateTime now = LocalDateTime.now();

        // Récupération utilisateur et ses préférences
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        Preferences prefs = preferencesRepository.findByUser(user).orElse(null);
        if (prefs == null || !prefs.isNotificationsActives()) return;

        // 📡 Envoi en temps réel via WebSocket
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", type);
        payload.put("message", message);
        payload.put("timestamp", now.toString());

        messagingTemplate.convertAndSend("/topic/alert/" + userId, payload);

        // 💾 Enregistrement DB
        Notification notif = new Notification(type, message, now, user);
        notificationRepository.save(notif);
    }

    // 🌫 AQI élevé
    public void sendPollutionAlert(Long userId, int aqi) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        Preferences prefs = preferencesRepository.findByUser(user).orElse(null);
        if (prefs == null || !prefs.isNotificationsActives()) return;

        if (aqi > prefs.getSeuilAqi()) {
            sendAlert(userId, "pollution", "⚠️ Indice AQI élevé détecté : " + aqi);
        }
    }

    // 🌪 PM10
    public void sendPM10Alert(Long userId, double value) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        Preferences prefs = preferencesRepository.findByUser(user).orElse(null);
        if (prefs == null || !prefs.isNotificationsActives()) return;

        if (value > prefs.getSeuilPm10()) {
            sendAlert(userId, "pm10", "🌪 Particules PM10 élevées : " + value + " µg/m³");
        }
    }

    // 🌫 PM2.5
    public void sendPM25Alert(Long userId, double value) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        Preferences prefs = preferencesRepository.findByUser(user).orElse(null);
        if (prefs == null || !prefs.isNotificationsActives()) return;

        if (value > prefs.getSeuilPm25()) {
            sendAlert(userId, "pm25", "🌫 Particules PM2.5 élevées : " + value + " µg/m³");
        }
    }

    // 🧪 NO2
    public void sendNO2Alert(Long userId, double value) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        Preferences prefs = preferencesRepository.findByUser(user).orElse(null);
        if (prefs == null || !prefs.isNotificationsActives()) return;

        if (value > prefs.getSeuilNo2()) {
            sendAlert(userId, "no2", "🧪 Dioxyde d'azote élevé : " + value + " µg/m³");
        }
    }

    // 🌬 O3
    public void sendO3Alert(Long userId, double value) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        Preferences prefs = preferencesRepository.findByUser(user).orElse(null);
        if (prefs == null || !prefs.isNotificationsActives()) return;

        if (value > prefs.getSeuilO3()) {
            sendAlert(userId, "o3", "🌬 Ozone élevé : " + value + " µg/m³");
        }
    }

    // 🛢 CO
    public void sendCOAlert(Long userId, double value) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        Preferences prefs = preferencesRepository.findByUser(user).orElse(null);
        if (prefs == null || !prefs.isNotificationsActives()) return;

        if (value > prefs.getSeuilCo()) {
            sendAlert(userId, "co", "🛢 Monoxyde de carbone élevé : " + value + " ppm");
        }
    }

    // 📉 Capteur déconnecté
    public void sendSensorDisconnected(Long userId, String capteur) {
        sendAlert(userId, "capteur", "🚫 Capteur déconnecté : " + capteur);
    }

    // 🛠 Erreur système
    public void sendSystemError(Long userId, String message) {
        sendAlert(userId, "systeme", "💥 Erreur système : " + message);
    }
}
