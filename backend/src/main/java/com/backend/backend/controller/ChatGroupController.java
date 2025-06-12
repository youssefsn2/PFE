package com.backend.backend.controller;

import com.backend.backend.model.ChatGroup;
import com.backend.backend.service.ChatGroupService;
import org.apache.tomcat.util.net.openssl.ciphers.Authentication;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
public class ChatGroupController {

    @Autowired
    private ChatGroupService chatGroupService;
    @GetMapping
    public ResponseEntity<List<ChatGroup>> getGroupsOfAuthenticatedUser() {
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        List<ChatGroup> userGroups = chatGroupService.getGroupsForUser(currentEmail);
        return ResponseEntity.ok(userGroups);
    }

    // 🔹 Créer un nouveau groupe
    @PostMapping
    public ResponseEntity<ChatGroup> createGroup(@RequestBody GroupRequest request) {
        ChatGroup group = chatGroupService.createGroup(
                request.getName(), request.getDepartment(), request.getCity(), request.getOcp(), request.getUserIds());
        return ResponseEntity.ok(group);
    }

    // 🔹 Ajouter un utilisateur à un groupe
    @PutMapping("/{groupId}/add-user/{userId}")
    public ResponseEntity<ChatGroup> addUserToGroup(@PathVariable Long groupId, @PathVariable Long userId) {
        return ResponseEntity.ok(chatGroupService.addUserToGroup(groupId, userId));
    }


    // DTO interne
    public static class GroupRequest {
        private String name;
        private String department;
        private String city;
        private String ocp;
        private List<Long> userIds;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }

        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }

        public String getOcp() { return ocp; }
        public void setOcp(String ocp) { this.ocp = ocp; }

        public List<Long> getUserIds() { return userIds; }
        public void setUserIds(List<Long> userIds) { this.userIds = userIds; }
    }
}
