package com.backend.backend.controller;

import com.backend.backend.model.ChatGroup;
import com.backend.backend.model.ChatMessage;
import com.backend.backend.model.User;
import com.backend.backend.repository.UserRepository;
import com.backend.backend.service.SearchChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/chatt")
public class SearchChatController {

    private final SearchChatService searchChatService;
    private final UserRepository userRepository;

    @Autowired
    public SearchChatController(SearchChatService searchChatService, UserRepository userRepository) {
        this.searchChatService = searchChatService;
        this.userRepository = userRepository;
    }

    // 🔍 Rechercher des utilisateurs par nom, prénom ou email
    @GetMapping("/search/users")
    public List<User> searchUsers(@RequestParam("query") String query) {
        return searchChatService.searchUsers(query);
    }

    // 🔍 Rechercher des groupes par nom
    @GetMapping("/search/groups")
    public List<ChatGroup> searchGroups(@RequestParam("query") String query) {
        return searchChatService.searchGroups(query);
    }

    // 💬 Récupérer l’historique des messages privés entre deux utilisateurs
    @GetMapping("/messages/private")
    public List<ChatMessage> getPrivateMessages(@RequestParam Long userId, Principal principal) {
        User currentUser = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        return searchChatService.getPrivateMessages(currentUser.getId(), userId);
    }

    // 💬 Récupérer les messages d’un groupe
    @GetMapping("/messages/group")
    public List<ChatMessage> getGroupMessages(@RequestParam Long groupId) {
        return searchChatService.getGroupMessages(groupId);
    }

    // ✅ Marquer les messages privés comme lus
    @PostMapping("/messages/private/mark-read")
    public void markPrivateMessagesAsRead(@RequestParam Long userId, Principal principal) {
        User currentUser = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        searchChatService.markPrivateMessagesAsRead(currentUser.getId(), userId);
    }

    // ✅ Marquer les messages de groupe comme lus
    @PostMapping("/messages/group/mark-read")
    public void markGroupMessagesAsRead(@RequestParam Long groupId, Principal principal) {
        User currentUser = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        searchChatService.markGroupMessagesAsRead(groupId, currentUser.getId());
    }

    // 🔴 Nombre de messages privés non lus
    @GetMapping("/messages/private/unread-count")
    public long countUnreadPrivateMessages(@RequestParam Long userId, Principal principal) {
        User currentUser = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        return searchChatService.countUnreadPrivateMessages(currentUser.getId(), userId);
    }

    // 🔴 Nombre de messages de groupe non lus
    @GetMapping("/messages/group/unread-count")
    public long countUnreadGroupMessages(@RequestParam Long groupId, Principal principal) {
        User currentUser = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        return searchChatService.countUnreadGroupMessages(groupId, currentUser.getId());
    }
}
