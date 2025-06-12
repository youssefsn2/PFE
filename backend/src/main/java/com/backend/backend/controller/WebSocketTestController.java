package com.backend.backend.controller;

import com.backend.backend.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// Controller de test dans Spring Boot
@RestController
@RequestMapping("/test")
public class WebSocketTestController {

    private final NotificationService notificationService;

    public WebSocketTestController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendTestAlert(@RequestParam Long userId) {
        notificationService.sendAlert(userId, "test", "🔔 Ceci est une alerte de test !");
        return ResponseEntity.ok("Notification envoyée !");
    }
}

