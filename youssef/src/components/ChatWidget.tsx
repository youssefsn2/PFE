import React, { useEffect, useRef, useState, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { CompatClient, Stomp } from '@stomp/stompjs';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Message {
    content: string;
    sender?: string;
    role: 'user' | 'assistant';
    timestamp?: string;
    id?: string;
}

interface ChatWidgetProps {
    className?: string;
    position?: 'bottom-right' | 'bottom-left';
}

const ChatWidget: React.FC<ChatWidgetProps> = ({
                                                   className = '',
                                                   position = 'bottom-right'
                                               }) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const stompClient = useRef<CompatClient | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const retryAttempts = useRef<number>(0);

    const { token } = useAuth();

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleConnectionError = useCallback((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion inconnue';
        console.error('❌ Erreur WebSocket :', errorMessage);
        setIsConnected(false);
        setError('Connexion perdue. Tentative de reconnexion...');

        // Tentative de reconnexion avec backoff exponentiel
        if (retryAttempts.current < 5) {
            const delay = Math.pow(2, retryAttempts.current) * 1000;
            reconnectTimeoutRef.current = setTimeout(() => {
                retryAttempts.current++;
                initializeWebSocket();
            }, delay);
        } else {
            setError('Impossible de se connecter au serveur. Veuillez actualiser la page.');
        }
    }, []);

    const initializeWebSocket = useCallback(() => {
        if (!token) return;

        try {
            const socket = new SockJS(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/ws?token=${token}`);
            const client = Stomp.over(socket);

            // Configuration du client STOMP
            client.configure({
                connectHeaders: {
                    Authorization: `Bearer ${token}`
                },
                onConnect: () => {
                    console.log('✅ WebSocket connecté');
                    setIsConnected(true);
                    setError(null);
                    retryAttempts.current = 0;

                    // Souscription aux messages
                    client.subscribe('/user/topic/messages', (message) => {
                        try {
                            const receivedMessage: Message = JSON.parse(message.body);
                            setMessages(prev => [...prev, receivedMessage]);
                            setIsTyping(false);
                        } catch (parseError) {
                            console.error('Erreur lors du parsing du message :', parseError);
                        }
                    });

                    // Souscription aux indicateurs de frappe
                    client.subscribe('/user/topic/typing', (message) => {
                        const typingStatus = JSON.parse(message.body);
                        setIsTyping(typingStatus.isTyping);
                    });
                },
                onStompError: handleConnectionError,
                onWebSocketError: handleConnectionError,
                onDisconnect: () => {
                    console.log('WebSocket déconnecté');
                    setIsConnected(false);
                },
                debug: (str) => {
                    if (process.env.NODE_ENV === 'development') {
                        console.log('STOMP Debug:', str);
                    }
                }
            });

            stompClient.current = client;
            client.activate();

        } catch (error) {
            handleConnectionError(error);
        }
    }, [token, handleConnectionError]);

    // Initialisation de la connexion WebSocket
    useEffect(() => {
        initializeWebSocket();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (stompClient.current) {
                stompClient.current.deactivate();
            }
        };
    }, [initializeWebSocket]);

    // Chargement de l'historique des messages
    const loadMessageHistory = useCallback(async () => {
        if (!token || messages.length > 0) return;

        setIsLoading(true);
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/chat/history`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 10000
                }
            );
            setMessages(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement de l\'historique :', error);
            setError('Impossible de charger l\'historique des messages');
        } finally {
            setIsLoading(false);
        }
    }, [token, messages.length]);

    useEffect(() => {
        if (isOpen) {
            loadMessageHistory();
        }
    }, [isOpen, loadMessageHistory]);

    const sendMessage = useCallback(async () => {
        const trimmedInput = input.trim();
        if (!trimmedInput || !stompClient.current?.connected) return;

        const message: Message = {
            content: trimmedInput,
            role: 'user',
            timestamp: new Date().toISOString(),
            id: `user-${Date.now()}`
        };

        try {
            // Ajout du message à l'interface utilisateur
            setMessages(prev => [...prev, message]);
            setInput('');
            setIsTyping(true);

            // Envoi du message via WebSocket
            stompClient.current.publish({
                destination: '/app/chat',
                body: JSON.stringify(message)
            });

        } catch (error) {
            console.error('Erreur lors de l\'envoi du message :', error);
            setError('Erreur lors de l\'envoi du message');
            setIsTyping(false);
        }
    }, [input]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }, [sendMessage]);

    const toggleChat = useCallback(() => {
        setIsOpen(prev => !prev);
        if (error) setError(null);
    }, [error]);

    const positionClasses = position === 'bottom-right'
        ? 'fixed bottom-4 right-4'
        : 'fixed bottom-4 left-4';

    return (
        <div className={`${positionClasses} z-50 ${className}`}>
            {/* Bouton d'ouverture/fermeture */}
            <button
                onClick={toggleChat}
                className={`
                    w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 
                    text-white flex items-center justify-center shadow-lg
                    hover:from-blue-600 hover:to-blue-700 
                    transition-all duration-300 transform hover:scale-105
                    ${!isConnected ? 'opacity-75' : ''}
                `}
                aria-label={isOpen ? "Fermer le chat" : "Ouvrir le chat"}
            >
                {isOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                )}
                {!isConnected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                )}
            </button>

            {/* Interface de chat */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 w-96 h-[600px] bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col overflow-hidden">
                    {/* En-tête */}
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                🤖
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Assistant IA</h3>
                                <p className="text-xs opacity-90">
                                    {isConnected ? 'En ligne' : 'Hors ligne'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-6 h-6 flex items-center justify-center hover:bg-white hover:bg-opacity-20 rounded"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Zone des messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {isLoading && (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {messages.map((message, index) => (
                            <div
                                key={message.id || index}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`
                                        max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm
                                        ${message.role === 'user'
                                        ? 'bg-blue-500 text-white rounded-br-sm'
                                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
                                    }
                                    `}
                                >
                                    <p className="whitespace-pre-wrap">{message.content}</p>
                                    {message.timestamp && (
                                        <p className={`text-xs mt-1 ${
                                            message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                                        }`}>
                                            {new Date(message.timestamp).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-2 shadow-sm">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Zone de saisie */}
                    <div className="p-4 border-t border-gray-200 bg-white">
                        <div className="flex items-end space-x-2">
                            <div className="flex-1">
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={!isConnected}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                             disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    placeholder={isConnected ? "Écrivez votre message..." : "Connexion en cours..."}
                                    maxLength={1000}
                                />
                            </div>
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || !isConnected}
                                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300
                                         text-white p-2 rounded-lg transition-colors duration-200
                                         disabled:cursor-not-allowed flex items-center justify-center"
                                aria-label="Envoyer le message"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>

                        {input.length > 800 && (
                            <p className="text-xs text-gray-500 mt-1">
                                {input.length}/1000 caractères
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatWidget;