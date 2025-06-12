package com.backend.backend.websocket;

import com.backend.backend.model.ChatMessage;
import com.backend.backend.payload.ChatMessagePayload;
import com.backend.backend.service.ChatMessageService;
import com.backend.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class ChatWebSocketController {

    @Autowired
    private ChatMessageService chatMessageService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    public void send(ChatMessagePayload payload, Principal principal) {
        try {
            String senderEmail = principal.getName();
            System.out.println("📤 Message reçu de: " + senderEmail);
            System.out.println("📝 Contenu: " + payload.getContent());

            ChatMessage savedMessage;

            var senderOpt = userRepository.findByEmail(senderEmail);
            if (senderOpt.isEmpty()) {
                System.out.println("❌ Expéditeur introuvable: " + senderEmail);
                throw new RuntimeException("Expéditeur introuvable");
            }
            var sender = senderOpt.get();

            // Message privé
            if (payload.getRecipientId() != null) {
                System.out.println("💬 Message privé vers: " + payload.getRecipientId());

                var recipientOpt = userRepository.findById(payload.getRecipientId());
                if (recipientOpt.isEmpty()) {
                    System.out.println("❌ Destinataire introuvable: " + payload.getRecipientId());
                    throw new RuntimeException("Destinataire introuvable");
                }
                var recipient = recipientOpt.get();

                savedMessage = chatMessageService.sendPrivateMessage(
                        sender,
                        payload.getRecipientId(),
                        payload.getContent()
                );

                System.out.println("✅ Message sauvegardé avec ID: " + savedMessage.getId());

                // ✅ Envoie au destinataire
                messagingTemplate.convertAndSendToUser(
                        recipient.getEmail(),
                        "/queue/messages",
                        savedMessage
                );
                System.out.println("📨 Message envoyé au destinataire: " + recipient.getEmail());

                // ✅ Envoie aussi à l'expéditeur pour confirmation
                messagingTemplate.convertAndSendToUser(
                        sender.getEmail(),
                        "/queue/messages",
                        savedMessage
                );
                System.out.println("📨 Message envoyé à l'expéditeur: " + sender.getEmail());
            }

            // Message de groupe
            else if (payload.getGroupId() != null) {
                System.out.println("👥 Message de groupe vers: " + payload.getGroupId());

                savedMessage = chatMessageService.sendGroupMessage(
                        sender,
                        payload.getGroupId(),
                        payload.getContent()
                );

                System.out.println("✅ Message de groupe sauvegardé avec ID: " + savedMessage.getId());
                System.out.println("👥 Membres du groupe: " + savedMessage.getGroup().getMembers().size());

                // ✅ Envoie à tous les membres du groupe
                savedMessage.getGroup().getMembers().forEach(member -> {
                    messagingTemplate.convertAndSendToUser(
                            member.getEmail(),
                            "/queue/messages",
                            savedMessage
                    );
                    System.out.println("📨 Message envoyé au membre: " + member.getEmail());
                });
            } else {
                System.out.println("❌ Ni recipientId ni groupId spécifié");
                throw new RuntimeException("Destinataire ou groupe requis");
            }

        } catch (Exception e) {
            System.out.println("❌ Erreur lors de l'envoi du message: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}