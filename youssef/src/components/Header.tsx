import React, { useState, useRef, useEffect } from 'react';
import { Menu, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useWebSocket from '../Hooks/useWebSocket';
import { toast } from 'react-toastify';
import {useNotification} from "../context/NotificationContext";
import NotificationIcon from '../pages/NotificationIcon';
import ChatWidget from "./ChatWidget"; // ajuste le chemin si nécessaire
import ChatDiscussions from './ChatDiscussions'; // <-- à importer


type HeaderProps = {
    toggleSidebar: () => void;
};

type Notification = {
    type: string;
    message: string;
    timestamp: string;
};

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
    const { user } = useAuth();
    const userId = user?.id || '';

    const { notifications, clearNotifications, markAllAsRead } = useNotification();
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const [chatOpen, setChatOpen] = useState(false);

    const [showChatDiscussions, setShowChatDiscussions] = useState(false);


    // Handle clicks outside of dropdown menus
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setNotificationOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setProfileOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleBellClick = () => {
        setNotificationOpen((prev) => !prev);
        markAllAsRead(); // ✅ efface le badge rouge globalement
    };

    const handleProfileClick = () => {
        setProfileOpen((prev) => !prev);
    };

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date();
        const notifTime = new Date(timestamp);
        const diffMs = now.getTime() - notifTime.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins} min`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `Il y a ${diffHours}h`;

        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return 'Hier';
        if (diffDays < 7) return `Il y a ${diffDays}j`;

        return notifTime.toLocaleDateString();
    };

    return (
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                    {/* Mobile menu button */}
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-md text-gray-600 hover:bg-gray-100 md:hidden focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors duration-200"
                        aria-label="Ouvrir le menu"
                    >
                        <Menu size={24} />
                    </button>

                    {/* Logo and title */}
                    <div className="flex-1 ml-4 md:ml-0">
                        <h2 className="text-lg font-semibold text-gray-800 tracking-wide flex items-center">
                            <span className="text-xl mr-2">🌤️</span>
                            <span className="hidden sm:inline bg-gradient-to-r from-green-600 to-blue-500 bg-clip-text text-transparent">
                                OCP - Surveillance Météo & Qualité de l'air
                            </span>
                            <span className="sm:hidden">OCP Monitor</span>
                        </h2>
                    </div>



                    {/* Notifications & profile */}
                    {/* Chat assistant */}
                    <ChatWidget />
                    {/* 🔄 MODIFICATION : Modal de chat améliorée */}
                    {showChatDiscussions && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                            <div
                                className="bg-white rounded-lg w-full max-w-3xl h-[90vh] shadow-2xl overflow-hidden flex flex-col">
                                {/* Header de la modal */}
                                <div
                                    className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">Messagerie Instantanée</h3>
                                    <button
                                        onClick={() => setShowChatDiscussions(false)}
                                        className="text-white hover:text-red-200 p-1 rounded-lg hover:bg-white/20 transition-colors"
                                    >
                                        <span className="text-xl">✖</span>
                                    </button>
                                </div>
                                {/* Contenu du chat */}
                                <div className="flex-1 overflow-hidden">
                                    <ChatDiscussions/>
                                </div>
                            </div>
                        </div>
                    )}


                    <div className="flex items-center space-x-4">
                        {/* Notifications bell */}
                        <div className="relative" ref={notificationRef}>
                            <NotificationIcon onClick={handleBellClick}/>
                            {/* Notifications dropdown */}
                            {notificationOpen && (
                                <div
                                    className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 transform origin-top-right transition-all duration-200 ease-out">
                                    <div
                                        className="px-4 py-3 font-semibold border-b border-gray-100 text-gray-700 flex items-center justify-between">
                                        <div className="flex items-center">
                                            <span className="mr-2 text-green-600">🔔</span>
                                            <span>Notifications</span>
                                        </div>
                                        {notifications.length > 0 && (
                                            <button
                                                className="text-xs text-green-600 hover:text-green-800 font-medium"
                                                onClick={clearNotifications}
                                            >
                                                Tout effacer
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-96 overflow-y-auto scrollbar-thin">
                                        {notifications.length === 0 ? (
                                            <div className="px-4 py-6 text-sm text-gray-500 text-center">
                                                Aucune notification
                                            </div>
                                        ) : (
                                            <ul>
                                                {notifications.map((notification, index) => (
                                                    <li key={index}
                                                        className="px-4 py-3 text-sm border-b border-gray-100 hover:bg-gray-50">
                                                        <div className="flex items-center justify-between">
                                                            <div
                                                                className="font-medium text-gray-800">{notification.type.toUpperCase()}</div>
                                                            <div
                                                                className="text-xs text-gray-400">{formatTimeAgo(notification.timestamp)}</div>
                                                        </div>
                                                        <div className="text-gray-600 mt-1">{notification.message}</div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setShowChatDiscussions(!showChatDiscussions)}
                            className="fixed bottom-20 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
                            aria-label="Ouvrir la discussion"
                        >
                            💬
                        </button>

                        {/* User profile */}
                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={handleProfileClick}
                                className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                            >
                                <div
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium shadow-sm bg-gradient-to-br from-green-500 to-green-700">
                                    <User size={18}/>
                                </div>
                                <span
                                    className="hidden md:inline text-sm font-medium text-gray-700 max-w-[150px] truncate">
                                    {user?.name || user?.email || 'Utilisateur'}
                                </span>
                                <ChevronDown size={16} className="hidden md:block text-gray-500"/>
                            </button>

                            {/* Profile dropdown */}
                            {profileOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
                                    <div className="py-2 px-4 border-b border-gray-100">
                                        <p className="text-sm font-medium text-gray-800">
                                            {user?.name || 'Utilisateur'}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {user?.email || 'utilisateur@ocp.ma'}
                                        </p>
                                    </div>
                                    <div className="py-1">
                                        <button
                                            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center">
                                            <span className="mr-2">👤</span> Mon profil
                                        </button>
                                        <button
                                            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center">
                                            <span className="mr-2">⚙️</span> Paramètres
                                        </button>
                                        <button
                                            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left flex items-center">
                                            <span className="mr-2">🚪</span> Déconnexion
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;