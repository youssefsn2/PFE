package com.backend.backend.service;

import com.backend.backend.model.ChatGroup;
import com.backend.backend.model.User;
import com.backend.backend.repository.ChatGroupRepository;
import com.backend.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ChatGroupService {

    @Autowired
    private ChatGroupRepository chatGroupRepository;

    @Autowired
    private UserRepository userRepository;

    public ChatGroup createGroup(String name, String department, String city, String ocp, List<Long> userIds) {
        ChatGroup group = new ChatGroup();
        group.setName(name);
        group.setDepartment(department);
        group.setCity(city);
        group.setOcp(ocp);

        List<User> members = userRepository.findAllById(userIds);
        group.setMembers(members);

        return chatGroupRepository.save(group);
    }
    public List<ChatGroup> getGroupsForUser(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Utilisateur non trouvé : " + email);
        }
        return chatGroupRepository.findAllByMembersContaining(userOpt.get());
    }
    public ChatGroup addUserToGroup(Long groupId, Long userId) {
        Optional<ChatGroup> optionalGroup = chatGroupRepository.findById(groupId);
        Optional<User> optionalUser = userRepository.findById(userId);

        if (optionalGroup.isPresent() && optionalUser.isPresent()) {
            ChatGroup group = optionalGroup.get();
            User user = optionalUser.get();

            group.getMembers().add(user);
            return chatGroupRepository.save(group);
        }

        throw new RuntimeException("Group or user not found.");
    }

    public List<ChatGroup> getAllGroups() {
        return chatGroupRepository.findAll();
    }

    public Optional<ChatGroup> getGroupById(Long id) {
        return chatGroupRepository.findById(id);
    }
}
