package com.backend.backend.payload;

public class ChatMessagePayload {
    private Long recipientId; // null si message de groupe
    private Long groupId;     // null si message privé
    private String content;

    // Getters et Setters
    public Long getRecipientId() { return recipientId; }
    public void setRecipientId(Long recipientId) { this.recipientId = recipientId; }

    public Long getGroupId() { return groupId; }
    public void setGroupId(Long groupId) { this.groupId = groupId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
