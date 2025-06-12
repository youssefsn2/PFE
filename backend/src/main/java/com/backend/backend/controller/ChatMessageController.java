package com.backend.backend.controller;

import com.backend.backend.model.ChatMessage;
import com.backend.backend.model.User;
import com.backend.backend.repository.UserRepository;
import com.backend.backend.service.ChatMessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class ChatMessageController {

    @Autowired
    private ChatMessageService chatMessageService;

    @Autowired
    private UserRepository userRepository;

    // 🔹 Envoyer un message privé
    @PostMapping("/private/{recipientId}")
    public ResponseEntity<ChatMessage> sendPrivateMessage(Principal principal,
                                                          @PathVariable Long recipientId,
                                                          @RequestBody String content) {

        User sender = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur expéditeur introuvable"));

        ChatMessage message = chatMessageService.sendPrivateMessage(sender, recipientId, content);
        return ResponseEntity.ok(message);
    }

    // 🔹 Envoyer un message à un groupe
    @PostMapping("/group/{groupId}")
    public ResponseEntity<ChatMessage> sendGroupMessage(Principal principal,
                                                        @PathVariable Long groupId,
                                                        @RequestBody String content) {

        User sender = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur expéditeur introuvable"));

        ChatMessage message = chatMessageService.sendGroupMessage(sender, groupId, content);
        return ResponseEntity.ok(message);
    }

    // 🔹 Récupérer les messages privés entre deux utilisateurs
    @GetMapping("/private/{userId}")
    public ResponseEntity<List<ChatMessage>> getPrivateMessages(Principal principal,
                                                                @PathVariable Long userId) {

        User sender = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        User recipient = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Destinataire introuvable"));

        return ResponseEntity.ok(chatMessageService.getPrivateMessages(sender, recipient));
    }

    // 🔹 Récupérer les messages d’un groupe
    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<ChatMessage>> getGroupMessages(@PathVariable Long groupId) {
        return ResponseEntity.ok(chatMessageService.getGroupMessages(groupId));
    }
}
