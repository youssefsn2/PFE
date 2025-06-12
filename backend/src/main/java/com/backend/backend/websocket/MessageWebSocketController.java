package com.backend.backend.websocket;

import com.backend.backend.model.Message;
import com.backend.backend.model.User;
import com.backend.backend.model.AirQuality;
import com.backend.backend.repository.MessageRepository;
import com.backend.backend.repository.UserRepository;
import com.backend.backend.service.AssistantService;
import com.backend.backend.service.MeteoService;
import com.backend.backend.service.AirQualityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.io.IOException;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Controller
public class MessageWebSocketController {

    @Autowired
    private AssistantService assistantService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private MeteoService meteoService;

    @Autowired
    private AirQualityService airQualityService;

    @MessageMapping("/chat")
    public void handleChat(ChatMessage chatMessage, Principal principal) throws IOException {
        String email = principal.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : " + email));

        // Sauvegarder la question utilisateur
        Message userMessage = new Message(chatMessage.getRole(), chatMessage.getContent(), user);
        userMessage.setTimestamp(LocalDateTime.now());
        messageRepository.save(userMessage);

        // ➕ Infos météo et pollution
        Map<String, Object> meteo = meteoService.getMeteoActuelle(user);
        AirQuality air = airQualityService.getLatestAirQuality(user);

        // ➤ Envoyer au client le message "system" de contexte
        messagingTemplate.convertAndSendToUser(
                email,
                "/topic/messages",
                Map.of(
                        "role", "system",
                        "content", String.format("""
                            📍 Contexte environnemental :
                            - Lieu : %s
                            - Température : %s°C
                            - Humidité : %s%%
                            - Vent : %s km/h

                            🌫 Qualité de l'air :
                            - AQI : %s
                            - PM2.5 : %s
                            - PM10 : %s
                            - NO2 : %s
                            - O3 : %s
                            - CO : %s
                            """,
                                meteo.getOrDefault("ville", "inconnu"),
                                meteo.getOrDefault("temperature", "N/A"),
                                meteo.getOrDefault("humidite", "N/A"),
                                meteo.getOrDefault("vent", "N/A"),
                                air.getAqi(), air.getPm25(), air.getPm10(),
                                air.getNo2(), air.getO3(), air.getCo()
                        )
                )
        );

        // Appeler l'assistant
        String response = assistantService.ask(chatMessage.getContent(), user);

        // Sauvegarder la réponse
        Message reply = new Message("assistant", response, user);
        reply.setTimestamp(LocalDateTime.now());
        messageRepository.save(reply);

        // Répondre via WebSocket
        messagingTemplate.convertAndSendToUser(
                email,
                "/topic/messages",
                Map.of("role", "assistant", "content", response)
        );
    }
}
