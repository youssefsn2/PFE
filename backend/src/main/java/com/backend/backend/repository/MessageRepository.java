// Étape 2 : Créer un repository pour accéder aux messages
package com.backend.backend.repository;

import com.backend.backend.model.Message;
import com.backend.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByUserOrderByTimestampAsc(User user);
}
