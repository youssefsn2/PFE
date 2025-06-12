import { useEffect, useRef } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from '../context/AuthContext';

const useChatWebSocket = (onMessage: (msg: any) => void) => {
    const clientRef = useRef<Client | null>(null);
    const { token } = useAuth();

    useEffect(() => {
        if (!token) {
            console.log('❌ Pas de token disponible');
            return;
        }

        console.log('🔌 Initialisation de la connexion WebSocket...');

        const client = new Client({
            // ✅ Configuration SockJS avec token dans l'URL
            webSocketFactory: () => {
                console.log('🔗 Création d\'une nouvelle connexion SockJS...');
                return new SockJS(`http://localhost:8080/ws?token=${token}`);
            },

            // ✅ Headers de connexion (optionnel, le token est déjà dans l'URL)
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },

            debug: (str) => {
                console.log('[STOMP DEBUG]:', str);
            },

            // ✅ Configuration de reconnexion
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,

            onConnect: (frame) => {
                console.log('✅ WebSocket connecté avec succès');
                console.log('📋 Frame de connexion:', frame);

                // ✅ Souscription aux messages privés
                try {
                    const subscription = client.subscribe('/user/queue/messages', (message: IMessage) => {
                        try {
                            console.log('📥 Message brut reçu:', message);
                            console.log('📥 Corps du message:', message.body);

                            const body = JSON.parse(message.body);
                            console.log('📥 Message parsé:', body);

                            onMessage(body);
                        } catch (e) {
                            console.error('❌ Erreur lors du parsing du message WebSocket', e);
                            console.error('❌ Message brut:', message.body);
                        }
                    });

                    console.log('✅ Souscription créée:', subscription.id);
                } catch (e) {
                    console.error('❌ Erreur lors de la souscription:', e);
                }
            },

            onStompError: (frame) => {
                console.error('❌ Erreur STOMP:', frame.headers['message']);
                console.error('❌ Corps de l\'erreur:', frame.body);
                console.error('❌ Headers complets:', frame.headers);
            },

            onWebSocketClose: (event) => {
                console.warn('🔌 WebSocket fermé');
                console.warn('🔌 Code:', event.code);
                console.warn('🔌 Raison:', event.reason);
            },

            onWebSocketError: (event) => {
                console.error('❌ Erreur WebSocket:', event);
            },

            onDisconnect: (frame) => {
                console.warn('🔌 WebSocket déconnecté');
                console.warn('📋 Frame de déconnexion:', frame);
            }
        });

        // ✅ Activation du client
        try {
            client.activate();
            clientRef.current = client;
            console.log('🚀 Client WebSocket activé');
        } catch (e) {
            console.error('❌ Erreur lors de l\'activation du client:', e);
        }

        // ✅ Nettoyage lors du démontage
        return () => {
            if (clientRef.current && clientRef.current.connected) {
                console.log('🔌 Déconnexion du WebSocket...');
                clientRef.current.deactivate();
                clientRef.current = null;
            }
        };
    }, [token, onMessage]); // ✅ Ajout d'onMessage dans les dépendances

    return clientRef.current;
};

export default useChatWebSocket;