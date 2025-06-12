package com.backend.backend.service;

import com.backend.backend.model.AirQuality;
import com.backend.backend.model.Message;
import com.backend.backend.model.User;
import com.backend.backend.repository.MessageRepository;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class AssistantService {

    private final MeteoService meteoService;
    private final AirQualityService airQualityService;
    private final GroqChatService groqChatService;
    private final MessageRepository messageRepository;

    public AssistantService(MeteoService meteoService,
                            AirQualityService airQualityService,
                            GroqChatService groqChatService,
                            MessageRepository messageRepository) {
        this.meteoService = meteoService;
        this.airQualityService = airQualityService;
        this.groqChatService = groqChatService;
        this.messageRepository = messageRepository;
    }

    public String ask(String question, User user) throws IOException {
        // 1. Sauvegarder la question utilisateur
        Message userMessage = new Message();
        userMessage.setRole("user");
        userMessage.setContent(question);
        userMessage.setTimestamp(LocalDateTime.now());
        userMessage.setUser(user);
        messageRepository.save(userMessage);

        // 2. Récupérer tout l'historique trié
        List<Message> history = messageRepository.findByUserOrderByTimestampAsc(user);

        // 3. Obtenir météo + pollution
        Map<String, Object> meteo = meteoService.getMeteoActuelle(user);
        AirQuality air = airQualityService.getLatestAirQuality(user);

        // 4. Créer la liste des messages à envoyer à l'IA
        List<Map<String, String>> messages = new ArrayList<>();

        // Message système en tête
        messages.add(Map.of(
                "role", "system",
                "content", String.format("""
                        Contexte environnemental de l'utilisateur OCP :
                        - Lieu : %s
                        - Température : %s°C
                        - Humidité : %s%%
                        - Vent : %s km/h

                        Qualité de l'air :
                        - AQI : %s | PM2.5 : %s | PM10 : %s | NO2 : %s | O3 : %s | CO : %s

                        Tu es un assistant expert en environnement, climat, santé.
                        Réponds toujours clairement, avec des recommandations utiles.
                        """,
                        meteo.getOrDefault("ville", "inconnu"),
                        meteo.getOrDefault("temperature", "N/A"),
                        meteo.getOrDefault("humidite", "N/A"),
                        meteo.getOrDefault("vent", "N/A"),
                        air.getAqi(), air.getPm25(), air.getPm10(),
                        air.getNo2(), air.getO3(), air.getCo()
                )
        ));

        // Ajouter l'historique de discussion
        for (Message msg : history) {
            messages.add(Map.of(
                    "role", msg.getRole(),
                    "content", msg.getContent()
            ));
        }

        // 5. Appel à Groq
        String reply = groqChatService.askWithHistory(messages);

        // 6. Sauvegarder la réponse
        Message assistantMessage = new Message();
        assistantMessage.setRole("assistant");
        assistantMessage.setContent(reply);
        assistantMessage.setTimestamp(LocalDateTime.now());
        assistantMessage.setUser(user);
        messageRepository.save(assistantMessage);

        return reply;
    }
}
