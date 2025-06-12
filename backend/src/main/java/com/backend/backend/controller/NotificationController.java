// src/main/java/com/backend/backend/controller/NotificationController.java
package com.backend.backend.controller;

import com.backend.backend.model.Notification;
import com.backend.backend.model.User;
import com.backend.backend.repository.NotificationRepository;
import com.backend.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Autowired
    public NotificationController(NotificationRepository notificationRepository,
                                  UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<Notification>> getUserNotifications(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        List<Notification> notifications = notificationRepository.findByUserOrderByTimestampDesc(user);
        return ResponseEntity.ok(notifications);
    }
}
