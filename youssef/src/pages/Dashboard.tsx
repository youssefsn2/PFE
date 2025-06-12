import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Wind,
    Thermometer,
    Droplets,
    Bell,
    ExternalLink,
    RefreshCw,
    AlertTriangle,
    CloudRain,
    MapPin,
    BarChart3,
    ArrowRight,
    Clock,
    TrendingUp,
    Calendar,
    Star,
    Activity,
    Shield,
    Sun,
    Moon,
    CloudSun,
    Eye,
    Zap
} from 'lucide-react';

interface WeatherData {
    main: {
        temp: number;
        feels_like: number;
        humidity: number;
        pressure: number;
        temp_min: number;
        temp_max: number;
    };
    weather: Array<{
        id: number;
        main: string;
        description: string;
        icon: string;
    }>;
    wind: {
        speed: number;
        deg: number;
        gust?: number;
    };
    visibility?: number;
    clouds?: {
        all: number;
    };
    name?: string;
    sys?: {
        sunrise: number;
        sunset: number;
    };
}

interface AirQualityData {
    aqi: number;
    pm25: number;
    pm10: number;
    no2: number;
    o3: number;
    co: number;
    so2?: number;
    nh3?: number;
}

interface Notification {
    id: number;
    type: string;
    message: string;
    timestamp: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    read?: boolean;
}

interface DashboardStats {
    todayAlerts: number;
    avgAqi: number;
    weatherTrend: 'up' | 'down' | 'stable';
    lastUpdate: string;
}

const Dashboard: React.FC = () => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [location, setLocation] = useState('Chargement...');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const navigate = useNavigate();

    // Update current time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    const fetchAllData = async () => {
        setRefreshing(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch data in parallel with better error handling
            const [weatherRes, airQualityRes, notificationsRes] = await Promise.allSettled([
                axios.get('http://localhost:8080/meteo/actuelle', { headers }),
                axios.get('http://localhost:8080/api/air/live', { headers }),
                axios.get('http://localhost:8080/api/notifications', { headers })
            ]);

            // Handle weather data
            if (weatherRes.status === 'fulfilled') {
                setWeather(weatherRes.value.data);
                setLocation(weatherRes.value.data.name || 'Localisation inconnue');
            }

            // Handle air quality data
            if (airQualityRes.status === 'fulfilled') {
                setAirQuality(airQualityRes.value.data);
            }

            // Handle notifications data
            if (notificationsRes.status === 'fulfilled') {
                setNotifications(notificationsRes.value.data.slice(0, 5));
                // Calculate stats from notifications
                const todayAlerts = notificationsRes.value.data.filter((n: Notification) =>
                    new Date(n.timestamp).toDateString() === new Date().toDateString()
                ).length;
                setStats({
                    todayAlerts,
                    avgAqi: airQuality?.aqi || 0,
                    weatherTrend: 'stable',
                    lastUpdate: new Date().toISOString()
                });
            }

            setError(null);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('Impossible de charger les données. Veuillez réessayer.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAllData();
        // Setup auto-refresh every 5 minutes
        const refreshInterval = setInterval(fetchAllData, 5 * 60 * 1000);
        return () => clearInterval(refreshInterval);
    }, []);

    const getAqiCategory = (aqi: number) => {
        if (aqi <= 50) return 'Excellente';
        if (aqi <= 100) return 'Bonne';
        if (aqi <= 150) return 'Modérée';
        if (aqi <= 200) return 'Mauvaise';
        if (aqi <= 300) return 'Très mauvaise';
        return 'Dangereuse';
    };

    const getAqiColor = (aqi: number) => {
        if (aqi <= 50) return 'text-emerald-600';
        if (aqi <= 100) return 'text-green-600';
        if (aqi <= 150) return 'text-yellow-600';
        if (aqi <= 200) return 'text-orange-600';
        if (aqi <= 300) return 'text-red-600';
        return 'text-purple-700';
    };

    const getAqiBg = (aqi: number) => {
        if (aqi <= 50) return 'bg-emerald-500';
        if (aqi <= 100) return 'bg-green-500';
        if (aqi <= 150) return 'bg-yellow-500';
        if (aqi <= 200) return 'bg-orange-500';
        if (aqi <= 300) return 'bg-red-500';
        return 'bg-purple-700';
    };

    const getWeatherIcon = (iconCode: string) => {
        return `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'pollution': return <AlertTriangle className="text-yellow-600" size={20} />;
            case 'pm25': return <Wind className="text-blue-600" size={20} />;
            case 'pm10': return <CloudRain className="text-purple-600" size={20} />;
            case 'no2': return <Droplets className="text-red-600" size={20} />;
            case 'o3': return <Wind className="text-green-600" size={20} />;
            case 'weather': return <CloudSun className="text-orange-600" size={20} />;
            default: return <Bell className="text-gray-600" size={20} />;
        }
    };

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'critical': return 'bg-red-100 border-red-300';
            case 'high': return 'bg-orange-100 border-orange-300';
            case 'medium': return 'bg-yellow-100 border-yellow-300';
            default: return 'bg-blue-100 border-blue-300';
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const getTimeOfDay = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'morning';
        if (hour < 18) return 'afternoon';
        return 'evening';
    };

    const getGreeting = () => {
        const timeOfDay = getTimeOfDay();
        switch (timeOfDay) {
            case 'morning': return 'Bonjour';
            case 'afternoon': return 'Bon après-midi';
            case 'evening': return 'Bonsoir';
            default: return 'Bonjour';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100">
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                        <RefreshCw size={64} className="animate-spin text-blue-500 opacity-80" />
                        <div className="absolute inset-0 rounded-full bg-blue-200 opacity-20 animate-pulse"></div>
                    </div>
                    <p className="text-gray-700 font-medium text-lg animate-pulse">
                        Chargement de votre tableau de bord...
                    </p>
                    <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100">
            <div className="flex flex-col">
                <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                    {/* Enhanced Dashboard Header */}
                    <div className="mb-8 bg-white/70 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-white/20">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center">
                                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                                        <BarChart3 size={32} className="text-white" />
                                    </div>
                                    <div className="ml-4">
                                        <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                            {getGreeting()} !
                                        </h1>
                                        <p className="text-lg text-gray-600 mt-1">Tableau de bord environnemental</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center bg-white/50 px-3 py-2 rounded-lg">
                                        <MapPin size={16} className="mr-2 text-blue-500" />
                                        <span className="font-medium">{location}</span>
                                    </div>
                                    <div className="flex items-center bg-white/50 px-3 py-2 rounded-lg">
                                        <Clock size={16} className="mr-2 text-green-500" />
                                        <span>Mis à jour à {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    {stats && (
                                        <div className="flex items-center bg-white/50 px-3 py-2 rounded-lg">
                                            <Activity size={16} className="mr-2 text-purple-500" />
                                            <span>{stats.todayAlerts} alertes aujourd'hui</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={fetchAllData}
                                disabled={refreshing}
                                className={`mt-6 lg:mt-0 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 flex items-center shadow-lg ${
                                    refreshing ? 'opacity-70 scale-95' : ''
                                }`}
                            >
                                <RefreshCw size={20} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                {refreshing ? 'Actualisation...' : 'Actualiser'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 p-4 rounded-2xl mb-6 shadow-sm">
                            <div className="flex items-center">
                                <AlertTriangle size={20} className="mr-3 text-red-500" />
                                <span className="font-medium">{error}</span>
                            </div>
                        </div>
                    )}

                    {/* Enhanced Main Dashboard Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                        {/* Enhanced Weather Widget */}
                        {weather && (
                            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-white/20">
                                <div className="bg-gradient-to-r from-blue-100 to-cyan-100 px-6 py-4 flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                                        <div className="bg-white/50 p-2 rounded-xl mr-3">
                                            <Thermometer size={24} className="text-blue-600" />
                                        </div>
                                        Conditions météo
                                    </h2>
                                    <button
                                        onClick={() => navigate('/weather')}
                                        className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-semibold bg-white/50 px-3 py-2 rounded-xl hover:bg-white/70 transition-all"
                                    >
                                        Voir plus <ExternalLink size={16} className="ml-1" />
                                    </button>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="relative">
                                                <img
                                                    src={getWeatherIcon(weather.weather[0].icon)}
                                                    alt={weather.weather[0].description}
                                                    className="w-24 h-24 drop-shadow-lg"
                                                />
                                            </div>
                                            <div className="ml-6">
                                                <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                                    {Math.round(weather.main.temp)}°
                                                </div>
                                                <div className="text-gray-600 capitalize font-medium text-lg">
                                                    {weather.weather[0].description}
                                                </div>
                                                <div className="text-sm text-gray-500 mt-1">
                                                    {Math.round(weather.main.temp_min)}° / {Math.round(weather.main.temp_max)}°
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                                        <WeatherMetric
                                            icon={<Thermometer size={20} className="text-orange-500" />}
                                            label="Ressenti"
                                            value={`${Math.round(weather.main.feels_like)}°C`}
                                        />
                                        <WeatherMetric
                                            icon={<Droplets size={20} className="text-blue-500" />}
                                            label="Humidité"
                                            value={`${weather.main.humidity}%`}
                                        />
                                        <WeatherMetric
                                            icon={<Wind size={20} className="text-gray-500" />}
                                            label="Vent"
                                            value={`${Math.round(weather.wind.speed)} km/h`}
                                        />
                                        <WeatherMetric
                                            icon={<Eye size={20} className="text-purple-500" />}
                                            label="Visibilité"
                                            value={weather.visibility ? `${Math.round(weather.visibility / 1000)} km` : 'N/A'}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Enhanced Air Quality Widget */}
                        {airQuality && (
                            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-white/20">
                                <div className="bg-gradient-to-r from-emerald-100 to-green-100 px-6 py-4 flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                                        <div className="bg-white/50 p-2 rounded-xl mr-3">
                                            <Wind size={24} className="text-emerald-600" />
                                        </div>
                                        Qualité de l'air
                                    </h2>
                                    <button
                                        onClick={() => navigate('/air-quality')}
                                        className="text-emerald-600 hover:text-emerald-800 flex items-center text-sm font-semibold bg-white/50 px-3 py-2 rounded-xl hover:bg-white/70 transition-all"
                                    >
                                        Analyser <ExternalLink size={16} className="ml-1" />
                                    </button>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className={`p-6 rounded-2xl ${getAqiBg(airQuality.aqi)} bg-opacity-15 border-2 border-opacity-30 ${getAqiBg(airQuality.aqi).replace('bg-', 'border-')}`}>
                                                <div className={`text-4xl font-bold ${getAqiColor(airQuality.aqi)}`}>
                                                    {airQuality.aqi}
                                                </div>
                                            </div>
                                            <div className="ml-6">
                                                <div className={`text-xl font-bold ${getAqiColor(airQuality.aqi)}`}>
                                                    {getAqiCategory(airQuality.aqi)}
                                                </div>
                                                <div className="text-gray-600 font-medium">Indice AQI</div>
                                                <div className={`mt-2 px-3 py-1 rounded-full text-sm font-medium ${getAqiColor(airQuality.aqi)} bg-opacity-10 ${getAqiBg(airQuality.aqi)}`}>
                                                    {airQuality.aqi <= 100 ? '✓ Sain' :
                                                        airQuality.aqi <= 150 ? '⚠ Modéré' :
                                                            '⚠ Risque'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8">
                                        <div className="text-sm font-semibold text-gray-700 mb-4">Polluants principaux</div>
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                            <PollutantCard name="PM2.5" value={airQuality.pm25} unit="μg/m³" color="blue" />
                                            <PollutantCard name="PM10" value={airQuality.pm10} unit="μg/m³" color="purple" />
                                            <PollutantCard name="NO₂" value={airQuality.no2} unit="μg/m³" color="red" />
                                            <PollutantCard name="O₃" value={airQuality.o3} unit="μg/m³" color="green" />
                                            <PollutantCard name="CO" value={airQuality.co} unit="mg/m³" color="orange" />
                                            {airQuality.so2 && (
                                                <PollutantCard name="SO₂" value={airQuality.so2} unit="μg/m³" color="yellow" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Enhanced Alerts Widget */}
                    <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-white/20 mb-8">
                        <div className="bg-gradient-to-r from-amber-100 to-orange-100 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center">
                                <div className="bg-white/50 p-2 rounded-xl mr-3">
                                    <Bell size={24} className="text-amber-600" />
                                </div>
                                Alertes récentes
                                {notifications.filter(n => !n.read).length > 0 && (
                                    <span className="ml-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                        {notifications.filter(n => !n.read).length}
                                    </span>
                                )}
                            </h2>
                            <button
                                onClick={() => navigate('/alerts')}
                                className="text-amber-600 hover:text-amber-800 flex items-center text-sm font-semibold bg-white/50 px-3 py-2 rounded-xl hover:bg-white/70 transition-all"
                            >
                                Gérer <ExternalLink size={16} className="ml-1" />
                            </button>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                        <Shield size={32} className="text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-500 mb-2">Aucune alerte</h3>
                                    <p className="text-gray-400">Tout va bien ! Aucune alerte récente à signaler.</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div key={notification.id} className={`px-6 py-4 hover:bg-gray-50/50 transition-all cursor-pointer border-l-4 ${getPriorityColor(notification.priority)}`}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start">
                                                <div className="p-2 rounded-lg bg-white shadow-sm mr-4">
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-gray-800 font-medium">{notification.message}</p>
                                                    <p className="text-xs text-gray-500 mt-2 flex items-center">
                                                        <Clock size={12} className="mr-1" />
                                                        {formatDate(notification.timestamp)}
                                                        {notification.priority && (
                                                            <>
                                                                <span className="mx-2">•</span>
                                                                <span className={`capitalize font-medium ${
                                                                    notification.priority === 'critical' ? 'text-red-600' :
                                                                        notification.priority === 'high' ? 'text-orange-600' :
                                                                            notification.priority === 'medium' ? 'text-yellow-600' :
                                                                                'text-blue-600'
                                                                }`}>
                                                                    {notification.priority}
                                                                </span>
                                                            </>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            {!notification.read && (
                                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Enhanced Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <QuickActionCard
                            title="Qualité de l'air"
                            description="Analyse détaillée des polluants et tendances"
                            icon={<Wind className="text-emerald-500" size={28} />}
                            color="from-emerald-50 to-emerald-100"
                            gradient="from-emerald-500 to-emerald-600"
                            onClick={() => navigate('/air-quality')}
                            badge={airQuality ? getAqiCategory(airQuality.aqi) : undefined}
                        />
                        <QuickActionCard
                            title="Météo"
                            description="Conditions actuelles et prévisions"
                            icon={<Thermometer className="text-blue-500" size={28} />}
                            color="from-blue-50 to-blue-100"
                            gradient="from-blue-500 to-blue-600"
                            onClick={() => navigate('/weather')}
                            badge={weather ? `${Math.round(weather.main.temp)}°C` : undefined}
                        />
                        <QuickActionCard
                            title="Alertes"
                            description="Notifications et avertissements"
                            icon={<Bell className="text-amber-500" size={28} />}
                            color="from-amber-50 to-amber-100"
                            gradient="from-amber-500 to-amber-600"
                            onClick={() => navigate('/alerts')}
                            badge={notifications.filter(n => !n.read).length > 0 ? `${notifications.filter(n => !n.read).length} nouveau(x)` : undefined}
                        />
                        <QuickActionCard
                            title="Historique"
                            description="Données et tendances historiques"
                            icon={<TrendingUp className="text-purple-500" size={28} />}
                            color="from-purple-50 to-purple-100"
                            gradient="from-purple-500 to-purple-600"
                            onClick={() => navigate('/history')}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
};

interface WeatherMetricProps {
    icon: React.ReactNode;
    label: string;
    value: string;
}

const WeatherMetric: React.FC<WeatherMetricProps> = ({ icon, label, value }) => (
    <div className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
            <div className="bg-white p-2 rounded-lg shadow-sm">
                {icon}
            </div>
        </div>
        <div className="mt-3">
            <div className="text-xs text-gray-500 font-medium">{label}</div>
            <div className="text-lg font-bold text-gray-800">{value}</div>
        </div>
    </div>
);

interface PollutantCardProps {
    name: string;
    value: number;
    unit: string;
    color: string;
}

const PollutantCard: React.FC<PollutantCardProps> = ({ name, value, unit, color }) => {
    const colorClasses = {
        blue: 'bg-blue-50 border-blue-200 text-blue-700',
        purple: 'bg-purple-50 border-purple-200 text-purple-700',
        red: 'bg-red-50 border-red-200 text-red-700',
        green: 'bg-green-50 border-green-200 text-green-700',
        orange: 'bg-orange-50 border-orange-200 text-orange-700',
        yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    };

    return (
        <div className={`p-3 rounded-xl border-2 ${colorClasses[color as keyof typeof colorClasses]} hover:shadow-md transition-all`}>
            <div className="text-xs font-medium opacity-75">{name}</div>
            <div className="text-lg font-bold">{value}</div>
            <div className="text-xs opacity-75">{unit}</div>
        </div>
    );
};

interface QuickActionCardProps {
    title: string;
    description: string;
    icon: React.ReactElement<{ className?: string; size?: number }>;
    color: string;
    gradient: string;
    onClick: () => void;
    badge?: string;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({
                                                             title,
                                                             description,
                                                             icon,
                                                             color,
                                                             gradient,
                                                             onClick,
                                                             badge
                                                         }) => {
    return (
        <div
            onClick={onClick}
            className="group cursor-pointer bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105"
        >
            <div className={`p-6 bg-gradient-to-r ${color} rounded-t-3xl relative overflow-hidden`}>
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center">
                        <div className={`p-3 rounded-2xl bg-gradient-to-r ${gradient} shadow-lg`}>
                            {React.cloneElement(icon, {
                                className: "text-white",
                                size: 28
                            })}
                        </div>
                        <div className="ml-4">
                            <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
                            {badge && (
                                <span className="inline-block mt-1 px-2 py-1 bg-white/70 text-xs font-semibold rounded-full text-gray-700">
                                    {badge}
                                </span>
                            )}
                        </div>
                    </div>
                    <ArrowRight
                        size={20}
                        className="text-gray-600 group-hover:text-gray-800 group-hover:translate-x-1 transition-all duration-200"
                    />
                </div>
                {/* Decorative background pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                    <div className="w-full h-full rounded-full bg-white transform translate-x-16 -translate-y-16"></div>
                </div>
            </div>
            <div className="p-6">
                <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
                <div className="mt-4 flex items-center text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors">
                    <span>Accéder</span>
                    <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;