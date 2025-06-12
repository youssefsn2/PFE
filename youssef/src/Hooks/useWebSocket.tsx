// src/hooks/useWebSocket.tsx
import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const useWebSocket = (
    userId: string | undefined,
    onMessage: (msg: any) => void
) => {
    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
        if (!userId) return; // ✅ protège contre undefined

        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            reconnectDelay: 5000,
            debug: () => {},
            onConnect: () => {
                client.subscribe(`/topic/alert/${userId}`, (message) => {
                    try {
                        const payload = JSON.parse(message.body);
                        onMessage(payload);
                    } catch (err) {
                        console.error("Erreur de parsing WebSocket", err);
                    }
                });
            },
            onStompError: (frame) => {
                console.error('WebSocket error:', frame.headers['message']);
            },
        });

        client.activate();
        clientRef.current = client;

        return () => {
            client.deactivate();
        };
    }, [userId]);
};

export default useWebSocket;