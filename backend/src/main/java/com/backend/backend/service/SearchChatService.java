package com.backend.backend.service;

import com.backend.backend.model.ChatGroup;
import com.backend.backend.model.ChatMessage;
import com.backend.backend.model.User;
import com.backend.backend.repository.ChatGroupRepository;
import com.backend.backend.repository.ChatMessageRepository;
import com.backend.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SearchChatService {

    private final UserRepository userRepository;
    private final ChatGroupRepository chatGroupRepository;
    private final ChatMessageRepository chatMessageRepository;

    // 🧱 Constructeur manuel pour injection de dépendances
    public SearchChatService(UserRepository userRepository,
                             ChatGroupRepository chatGroupRepository,
                             ChatMessageRepository chatMessageRepository) {
        this.userRepository = userRepository;
        this.chatGroupRepository = chatGroupRepository;
        this.chatMessageRepository = chatMessageRepository;
    }

    public List<User> searchUsers(String query) {
        return userRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                query, query, query
        );
    }


    // 🔍 Rechercher des groupes
    public List<ChatGroup> searchGroups(String keyword) {
        return chatGroupRepository.findByNameContainingIgnoreCase(keyword);
    }

    // 💬 Obtenir les messages privés triés par date
    public List<ChatMessage> getPrivateMessages(Long currentUserId, Long otherUserId) {
        return chatMessageRepository.findBySenderIdAndRecipientIdOrRecipientIdAndSenderIdOrderByTimestampAsc(
                currentUserId, otherUserId, currentUserId, otherUserId
        );
    }

    // 💬 Obtenir les messages de groupe triés par date
    public List<ChatMessage> getGroupMessages(Long groupId) {
        return chatMessageRepository.findByGroupIdOrderByTimestampAsc(groupId);
    }

    // ✅ Marquer les messages privés comme lus
    public void markPrivateMessagesAsRead(Long recipientId, Long senderId) {
        List<ChatMessage> unreadMessages = chatMessageRepository.findByRecipientIdAndSenderIdAndReadFalse(recipientId, senderId);
        for (ChatMessage msg : unreadMessages) {
            msg.setRead(true);
        }
        chatMessageRepository.saveAll(unreadMessages);
    }

    // ✅ Marquer les messages de groupe comme lus
    public void markGroupMessagesAsRead(Long groupId, Long userId) {
        List<ChatMessage> unreadMessages = chatMessageRepository.findByGroupIdAndRecipientIdAndReadFalse(groupId, userId);
        for (ChatMessage msg : unreadMessages) {
            msg.setRead(true);
        }
        chatMessageRepository.saveAll(unreadMessages);
    }

    // 🔴 Compter les messages privés non lus
    public long countUnreadPrivateMessages(Long recipientId, Long senderId) {
        return chatMessageRepository.countByRecipientIdAndSenderIdAndReadFalse(recipientId, senderId);
    }

    // 🔴 Compter les messages de groupe non lus
    public long countUnreadGroupMessages(Long groupId, Long userId) {
        return chatMessageRepository.countByGroupIdAndRecipientIdAndReadFalse(groupId, userId);
    }
}
