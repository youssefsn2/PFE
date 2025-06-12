package com.backend.backend.repository;

import com.backend.backend.model.ChatGroup;
import com.backend.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatGroupRepository extends JpaRepository<ChatGroup, Long> {
    List<ChatGroup> findByNameContainingIgnoreCase(String name);
    List<ChatGroup> findAllByMembersContaining(User user);


}
