// src/context/NotificationContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type Notification = {
    type: string;
    message: string;
    timestamp: string;
};

type NotificationContextType = {
    notifications: Notification[];
    addNotification: (notif: Notification) => void;
    clearNotifications: () => void;
    hasUnread: boolean;
    markAllAsRead: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>(() => {
        const stored = localStorage.getItem('notifications');
        return stored ? JSON.parse(stored) : [];
    });

    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }, [notifications]);

    const addNotification = (notif: Notification) => {
        setNotifications((prev) => [notif, ...prev]);
        setHasUnread(true);
    };

    const clearNotifications = () => {
        setNotifications([]);
        setHasUnread(false);
    };

    const markAllAsRead = () => {
        setHasUnread(false);
    };

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, clearNotifications, hasUnread, markAllAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotification must be used within NotificationProvider');
    return context;
};