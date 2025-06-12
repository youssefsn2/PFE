import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
    Bell,
    Clock,
    AlertTriangle,
    Wind,
    CloudDrizzle,
    Zap,
    Droplets,
    AlertOctagon,
    AlertCircle,
    RefreshCw,
    Filter,
    Search,
    Calendar,
    ChevronDown,
    X,
    CheckCircle
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

// Types
interface HeaderProps {
    toggleSidebar: () => void;
    title?: string;
}

type NotificationType = 'pollution' | 'pm25' | 'pm10' | 'no2' | 'o3' | 'co' | 'capteur' | 'systeme';

type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

// Type pour les données brutes du backend
type RawNotification = {
    id: number;
    type: NotificationType;
    message: string;
    timestamp: string;
    priority?: NotificationPriority;
    isRead?: boolean;
    location?: string;
    value?: number;
    unit?: string;
};

// Type pour les notifications enrichies côté frontend
type Notification = Required<RawNotification>;

type FilterOptions = {
    type: NotificationType | 'all';
    priority: NotificationPriority | 'all';
    dateRange: 'today' | 'week' | 'month' | 'all';
    readStatus: 'all' | 'read' | 'unread';
};

// Configuration des alertes
const ALERT_CONFIG = {
    pollution: {
        icon: AlertTriangle,
        color: 'yellow',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        iconColor: 'text-yellow-600',
        label: 'Pollution générale'
    },
    pm25: {
        icon: Wind,
        color: 'blue',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        iconColor: 'text-blue-600',
        label: 'Particules PM2.5'
    },
    pm10: {
        icon: CloudDrizzle,
        color: 'purple',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        iconColor: 'text-purple-600',
        label: 'Particules PM10'
    },
    no2: {
        icon: Droplets,
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        iconColor: 'text-red-600',
        label: 'Dioxyde d\'azote'
    },
    o3: {
        icon: Wind,
        color: 'green',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        iconColor: 'text-green-600',
        label: 'Ozone'
    },
    co: {
        icon: AlertOctagon,
        color: 'orange',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        iconColor: 'text-orange-600',
        label: 'Monoxyde de carbone'
    },
    capteur: {
        icon: AlertCircle,
        color: 'gray',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        iconColor: 'text-gray-600',
        label: 'Capteur'
    },
    systeme: {
        icon: Zap,
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        iconColor: 'text-red-600',
        label: 'Système'
    }
};

const PRIORITY_CONFIG = {
    low: {
        color: 'text-green-600',
        bg: 'bg-green-100',
        label: 'Faible'
    },
    medium: {
        color: 'text-yellow-600',
        bg: 'bg-yellow-100',
        label: 'Modérée'
    },
    high: {
        color: 'text-orange-600',
        bg: 'bg-orange-100',
        label: 'Élevée'
    },
    critical: {
        color: 'text-red-600',
        bg: 'bg-red-100',
        label: 'Critique'
    }
};

const AlertsPage: React.FC = () => {
    // États
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [selectedNotifications, setSelectedNotifications] = useState<Set<number>>(new Set());

    const [filters, setFilters] = useState<FilterOptions>({
        type: 'all',
        priority: 'all',
        dateRange: 'all',
        readStatus: 'all'
    });

    const { token } = useAuth();

    // Récupération des notifications
    const fetchNotifications = useCallback(async (showRefreshLoader = false) => {
        try {
            if (showRefreshLoader) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const res = await axios.get('http://localhost:8080/api/notifications', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // Simuler des propriétés supplémentaires pour améliorer l'expérience
            const enhancedNotifications: Notification[] = res.data.map((notif: RawNotification) => ({
                ...notif,
                priority: notif.priority || getPriorityFromType(notif.type),
                isRead: notif.isRead || false,
                location: notif.location || 'Station principale',
            }));

            setNotifications(enhancedNotifications);
            setError(null);
        } catch (error) {
            console.error('Erreur lors de la récupération des notifications :', error);
            setError('Impossible de charger les alertes. Veuillez réessayer plus tard.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    // Déterminer la priorité basée sur le type
    const getPriorityFromType = (type: NotificationType): NotificationPriority => {
        switch (type) {
            case 'systeme':
            case 'co':
                return 'critical';
            case 'pollution':
            case 'no2':
                return 'high';
            case 'pm25':
            case 'pm10':
            case 'o3':
                return 'medium';
            case 'capteur':
                return 'low';
            default:
                return 'medium';
        }
    };

    // Filtrage et recherche
    const applyFiltersAndSearch = useCallback(() => {
        let filtered = notifications;

        // Filtrage par recherche
        if (searchTerm) {
            filtered = filtered.filter(notif =>
                notif.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ALERT_CONFIG[notif.type]?.label.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtrage par type
        if (filters.type !== 'all') {
            filtered = filtered.filter(notif => notif.type === filters.type);
        }

        // Filtrage par priorité
        if (filters.priority !== 'all') {
            filtered = filtered.filter(notif => notif.priority === filters.priority);
        }

        // Filtrage par statut de lecture
        if (filters.readStatus !== 'all') {
            filtered = filtered.filter(notif =>
                filters.readStatus === 'read' ? notif.isRead : !notif.isRead
            );
        }

        // Filtrage par date
        if (filters.dateRange !== 'all') {
            const now = new Date();
            const filterDate = new Date();

            switch (filters.dateRange) {
                case 'today':
                    filterDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    filterDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    filterDate.setMonth(now.getMonth() - 1);
                    break;
            }

            filtered = filtered.filter(notif =>
                new Date(notif.timestamp) >= filterDate
            );
        }

        // Tri par date (plus récent en premier)
        filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setFilteredNotifications(filtered);
    }, [notifications, searchTerm, filters]);

    // Statistiques
    const stats = useMemo(() => {
        const total = notifications.length;
        const unread = notifications.filter(n => !n.isRead).length;
        const critical = notifications.filter(n => n.priority === 'critical').length;
        const today = notifications.filter(n => {
            const notifDate = new Date(n.timestamp);
            const today = new Date();
            return notifDate.toDateString() === today.toDateString();
        }).length;

        return { total, unread, critical, today };
    }, [notifications]);

    // Effets
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        applyFiltersAndSearch();
    }, [applyFiltersAndSearch]);

    // Actions
    const handleRefresh = () => {
        fetchNotifications(true);
    };

    const markAsRead = async (notificationIds: number[]) => {
        try {
            // Ici vous appelleriez votre API pour marquer comme lu
            // await axios.patch(`http://localhost:8080/api/notifications/read`, { ids: notificationIds });

            setNotifications(prev =>
                prev.map(notif =>
                    notificationIds.includes(notif.id) ? { ...notif, isRead: true } : notif
                )
            );
            setSelectedNotifications(new Set());
        } catch (error) {
            console.error('Erreur lors du marquage comme lu:', error);
        }
    };

    const handleSelectNotification = (id: number) => {
        setSelectedNotifications(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const clearFilters = () => {
        setFilters({
            type: 'all',
            priority: 'all',
            dateRange: 'all',
            readStatus: 'all'
        });
        setSearchTerm('');
    };

    // Rendu des composants
    const renderAlertIcon = (type: NotificationType) => {
        const config = ALERT_CONFIG[type];
        if (!config) return <Bell className="text-gray-600" size={20} />;

        const IconComponent = config.icon;
        return <IconComponent className={config.iconColor} size={20} />;
    };

    const renderPriorityBadge = (priority: NotificationPriority) => {
        const config = PRIORITY_CONFIG[priority];
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            const diffInMinutes = Math.floor(diffInHours * 60);
            return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
        } else if (diffInHours < 24) {
            const hours = Math.floor(diffInHours);
            return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
        } else {
            return new Intl.DateTimeFormat('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <div className="flex-1 flex flex-col">
                <main className="p-6 max-w-7xl mx-auto w-full">
                    {/* En-tête avec statistiques */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                    <Bell className="text-blue-600" />
                                    Alertes et Notifications
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    Surveillez les alertes de qualité de l'air en temps réel
                                </p>
                            </div>
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                Actualiser
                            </button>
                        </div>

                        {/* Statistiques */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Total</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                    </div>
                                    <Bell className="text-gray-400 w-8 h-8" />
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Non lues</p>
                                        <p className="text-2xl font-bold text-blue-600">{stats.unread}</p>
                                    </div>
                                    <AlertCircle className="text-blue-400 w-8 h-8" />
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Critiques</p>
                                        <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
                                    </div>
                                    <AlertTriangle className="text-red-400 w-8 h-8" />
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Aujourd'hui</p>
                                        <p className="text-2xl font-bold text-green-600">{stats.today}</p>
                                    </div>
                                    <Calendar className="text-green-400 w-8 h-8" />
                                </div>
                            </div>
                        </div>

                        {/* Barre de recherche et filtres */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex flex-col lg:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher dans les alertes..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <Filter className="w-4 h-4" />
                                        Filtres
                                        <ChevronDown className={`w-4 h-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                                    </button>
                                    {selectedNotifications.size > 0 && (
                                        <button
                                            onClick={() => markAsRead(Array.from(selectedNotifications))}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Marquer comme lu ({selectedNotifications.size})
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Panneau de filtres */}
                            {showFilters && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                            <select
                                                value={filters.type}
                                                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="all">Tous les types</option>
                                                {Object.entries(ALERT_CONFIG).map(([key, config]) => (
                                                    <option key={key} value={key}>{config.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                                            <select
                                                value={filters.priority}
                                                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as any }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="all">Toutes priorités</option>
                                                {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                                                    <option key={key} value={key}>{config.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Période</label>
                                            <select
                                                value={filters.dateRange}
                                                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="all">Toute période</option>
                                                <option value="today">Aujourd'hui</option>
                                                <option value="week">Cette semaine</option>
                                                <option value="month">Ce mois</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                                            <select
                                                value={filters.readStatus}
                                                onChange={(e) => setFilters(prev => ({ ...prev, readStatus: e.target.value as any }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="all">Tous</option>
                                                <option value="unread">Non lues</option>
                                                <option value="read">Lues</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            onClick={clearFilters}
                                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                            Effacer les filtres
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contenu principal */}
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Chargement des alertes...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5" />
                                <div>
                                    <h3 className="font-medium">Erreur de chargement</h3>
                                    <p className="text-sm mt-1">{error}</p>
                                </div>
                            </div>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
                            <Bell className="mx-auto text-gray-400 mb-4" size={48} />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {notifications.length === 0 ? 'Aucune alerte' : 'Aucun résultat'}
                            </h3>
                            <p className="text-gray-600">
                                {notifications.length === 0
                                    ? 'Aucune alerte reçue pour le moment.'
                                    : 'Aucune alerte ne correspond à vos critères de recherche.'
                                }
                            </p>
                            {notifications.length > 0 && (
                                <button
                                    onClick={clearFilters}
                                    className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                    Effacer les filtres
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredNotifications.map((notif) => {
                                const config = ALERT_CONFIG[notif.type];
                                const priority = notif.priority || 'medium';

                                return (
                                    <div
                                        key={notif.id}
                                        className={`bg-white border rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer ${
                                            !notif.isRead ? 'border-l-4 border-l-blue-500' : 'border-gray-200'
                                        } ${selectedNotifications.has(notif.id) ? 'ring-2 ring-blue-500' : ''}`}
                                        onClick={() => handleSelectNotification(notif.id)}
                                    >
                                        <div className="p-4">
                                            <div className="flex items-start gap-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedNotifications.has(notif.id)}
                                                    onChange={() => handleSelectNotification(notif.id)}
                                                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    onClick={(e) => e.stopPropagation()}
                                                />

                                                <div className={`p-3 rounded-full ${config?.bgColor || 'bg-gray-50'} ${config?.borderColor || 'border-gray-200'} border`}>
                                                    {renderAlertIcon(notif.type)}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className={`font-medium ${!notif.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                                                {config?.label || 'Alerte'}
                                                            </h3>
                                                            {renderPriorityBadge(priority)}
                                                            {!notif.isRead && (
                                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <Clock className="w-3 h-3" />
                                                            {formatTimestamp(notif.timestamp)}
                                                        </div>
                                                    </div>

                                                    <p className={`text-sm mb-2 ${!notif.isRead ? 'text-gray-800' : 'text-gray-600'}`}>
                                                        {notif.message}
                                                    </p>

                                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                                        {notif.location && (
                                                            <span>📍 {notif.location}</span>
                                                        )}
                                                        {notif.value && notif.unit && (
                                                            <span>
                                                                📊 {notif.value} {notif.unit}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination ou Load More pourrait être ajouté ici */}
                    {filteredNotifications.length > 0 && (
                        <div className="mt-8 text-center">
                            <p className="text-sm text-gray-600">
                                Affichage de {filteredNotifications.length} alerte{filteredNotifications.length > 1 ? 's' : ''}
                                {notifications.length !== filteredNotifications.length && ` sur ${notifications.length} au total`}
                            </p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AlertsPage;