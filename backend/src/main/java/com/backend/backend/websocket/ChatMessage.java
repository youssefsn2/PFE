package com.backend.backend.websocket;

public class ChatMessage {
    private String content;
    private String sender;
    private String role;

    public ChatMessage() {}

    public ChatMessage(String content, String sender, String role) {
        this.content = content;
        this.sender = sender;
        this.role = role;
    }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
