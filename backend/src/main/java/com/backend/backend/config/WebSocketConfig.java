package com.backend.backend.config;

import com.backend.backend.security.JwtUtil;
import com.backend.backend.service.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;


import java.util.Map;
import java.util.List;


@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // le client s’abonne ici
        config.enableSimpleBroker("/topic");

        // les messages envoyés par le client vont dans /app/*
        config.enableSimpleBroker("/topic", "/queue");

        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .addInterceptors(new HandshakeInterceptor() {
                    @Override
                    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
                        try {
                            String uri = request.getURI().toString();
                            if (uri.contains("token=")) {
                                String token = uri.substring(uri.indexOf("token=") + 6);
                                if (token.contains("&")) {
                                    token = token.substring(0, token.indexOf("&"));
                                }

                                String email = jwtUtil.extractUsername(token);
                                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                                if (jwtUtil.validateToken(token, userDetails)) {
                                    UsernamePasswordAuthenticationToken auth =
                                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                                    SecurityContextHolder.getContext().setAuthentication(auth);

                                    // ⛳️ Très important : mettre dans les attributs pour récupération via Principal
                                    attributes.put("user", auth);
                                }
                            }
                        } catch (Exception e) {
                            System.out.println("Erreur d’authentification WebSocket : " + e.getMessage());
                        }
                        return true;
                    }

                    @Override
                    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                               WebSocketHandler wsHandler, Exception exception) {}
                })
                .setHandshakeHandler(new DefaultHandshakeHandler() {
                    @Override
                    protected Principal determineUser(ServerHttpRequest request,
                                                      WebSocketHandler wsHandler,
                                                      Map<String, Object> attributes) {
                        // ✅ C'est ici qu'on lie les attributs au Principal
                        return (Principal) attributes.get("user");
                    }
                })
                .setAllowedOriginPatterns("http://localhost:*")
                // ❌ évite ".setAllowedOrigins("*")"
                .withSockJS();
    }



}
