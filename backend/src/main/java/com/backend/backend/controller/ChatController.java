package com.backend.backend.controller;

import com.backend.backend.model.Message;
import com.backend.backend.model.User;
import com.backend.backend.repository.MessageRepository;
import com.backend.backend.repository.UserRepository;
import com.backend.backend.service.AssistantService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final AssistantService assistantService;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;

    public ChatController(AssistantService assistantService, UserRepository userRepository, MessageRepository messageRepository) {
        this.assistantService = assistantService;
        this.userRepository = userRepository;
        this.messageRepository = messageRepository;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, String> payload) throws IOException {
        String question = payload.get("message");
        User user = getCurrentUser();
        String response = assistantService.ask(question, user);
        return ResponseEntity.ok(Map.of("response", response));
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : " + email));
    }
    @GetMapping("/history")
    public ResponseEntity<List<Map<String, String>>> getHistory(Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : " + principal.getName()));

        List<Map<String, String>> result = messageRepository.findByUserOrderByTimestampAsc(user).stream()
                .map(msg -> Map.of("role", msg.getRole(), "content", msg.getContent()))
                .toList();

        return ResponseEntity.ok(result);
    }

}
