package com.backend.backend.service;

import com.backend.backend.model.ChatGroup;
import com.backend.backend.model.ChatMessage;
import com.backend.backend.model.User;
import com.backend.backend.repository.ChatGroupRepository;
import com.backend.backend.repository.ChatMessageRepository;
import com.backend.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ChatMessageService {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChatGroupRepository chatGroupRepository;

    public ChatMessage sendPrivateMessage(User sender, Long recipientId, String content) {
        Optional<User> recipient = userRepository.findById(recipientId);
        if (recipient.isPresent()) {
            ChatMessage message = new ChatMessage(sender, recipient.get(), null, content);
            return chatMessageRepository.save(message);
        }
        throw new RuntimeException("Recipient not found");
    }

    public ChatMessage sendGroupMessage(User sender, Long groupId, String content) {
        Optional<ChatGroup> group = chatGroupRepository.findById(groupId);
        if (group.isPresent()) {
            ChatMessage message = new ChatMessage(sender, null, group.get(), content);
            return chatMessageRepository.save(message);
        }
        throw new RuntimeException("Group not found");
    }

    public List<ChatMessage> getPrivateMessages(User sender, User recipient) {
        return chatMessageRepository.findBySenderAndRecipient(sender, recipient);
    }

    public List<ChatMessage> getGroupMessages(Long groupId) {
        Optional<ChatGroup> group = chatGroupRepository.findById(groupId);
        if (group.isPresent()) {
            return chatMessageRepository.findByGroup(group.get());
        }
        throw new RuntimeException("Group not found");
    }

    public List<ChatMessage> getUnreadMessages(User recipient) {
        return chatMessageRepository.findByRecipientAndReadFalse(recipient);
    }
}
