package com.backend.backend.repository;

import com.backend.backend.model.ChatMessage;
import com.backend.backend.model.ChatGroup;
import com.backend.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findBySenderAndRecipient(User sender, User recipient);
    List<ChatMessage> findByGroup(ChatGroup group);
    List<ChatMessage> findByRecipientAndReadFalse(User recipient);
    List<ChatMessage> findBySenderIdAndRecipientIdOrRecipientIdAndSenderIdOrderByTimestampAsc(Long s1, Long r1, Long s2, Long r2);

    List<ChatMessage> findByGroupIdOrderByTimestampAsc(Long groupId);

    List<ChatMessage> findByRecipientIdAndSenderIdAndReadFalse(Long recipientId, Long senderId);

    List<ChatMessage> findByGroupIdAndRecipientIdAndReadFalse(Long groupId, Long userId);

    long countByRecipientIdAndSenderIdAndReadFalse(Long recipientId, Long senderId);

    long countByGroupIdAndRecipientIdAndReadFalse(Long groupId, Long recipientId);
}
