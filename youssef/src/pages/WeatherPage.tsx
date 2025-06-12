
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Thermometer,
    Droplets,
    Wind,
    Compass,
    Clock,
    MapPin,
    RefreshCw,
    CalendarDays,
    ChevronRight,
    Search,
    Zap,
    AlertTriangle,
    Database,
    History,
    Settings,
    Trash2,
    BarChart3,
    Download,
    Filter
} from 'lucide-react';

const ocpCities = [
    { name: "Khouribga", latitude: 32.8822, longitude: -6.9063 },
    { name: "Youssoufia", latitude: 32.2504, longitude: -8.5298 },
    { name: "Safi", latitude: 32.2979, longitude: -9.2360 },
    { name: "Jorf Lasfar", latitude: 33.1462, longitude: -8.6169 }
];

const WeatherPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'current' | 'forecast' | 'history' | 'comparison' | 'database'>('current');
    const [current, setCurrent] = useState<any>(null);
    const [forecast, setForecast] = useState<any[]>([]);
    const [hourly, setHourly] = useState<any[]>([]);
    const [selectedDay, setSelectedDay] = useState<number>(0);
    const [location, setLocation] = useState<string>('');
    const [comparison, setComparison] = useState<any | null>(null);
    const [dbComparison, setDbComparison] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // Nouvelles données pour les fonctionnalités backend
    const [currentFromDB, setCurrentFromDB] = useState<any>(null);
    const [forecastFromDB, setForecastFromDB] = useState<any[]>([]);
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [historyDateStart, setHistoryDateStart] = useState<string>('');
    const [historyDateEnd, setHistoryDateEnd] = useState<string>('');
    const [cleanupStatus, setCleanupStatus] = useState<string>('');

    const getAuthHeaders = () => ({
        Authorization: `Bearer ${localStorage.getItem('token')}`,
    });

    const fetchCurrentWeather = async () => {
        try {
            const response = await axios.get('http://localhost:8080/meteo/actuelle', {
                headers: getAuthHeaders()
            });
            setCurrent(response.data);
            return response.data;
        } catch (err) {
            console.error('Erreur météo actuelle:', err);
            throw err;
        }
    };

    const fetchForecast = async () => {
        try {
            const response = await axios.get('http://localhost:8080/meteo/prevision', {
                headers: getAuthHeaders()
            });
            const forecastList = response.data.list;
            const cityName = response.data.city?.name || 'Localisation inconnue';

            setHourly(forecastList.slice(0, 48));
            setForecast(groupForecastByDay(forecastList));
            setLocation(cityName);
            return response.data;
        } catch (err) {
            console.error('Erreur prévisions:', err);
            throw err;
        }
    };

    const fetchComparison = async () => {
        try {
            const response = await axios.get('http://localhost:8080/meteo/comparaison', {
                headers: getAuthHeaders()
            });
            setComparison(response.data);
            return response.data;
        } catch (err) {
            console.error('Erreur comparaison:', err);
            throw err;
        }
    };

    const fetchCurrentFromDB = async () => {
        try {
            const response = await axios.get('http://localhost:8080/meteo/actuelle/db', {
                headers: getAuthHeaders()
            });
            setCurrentFromDB(response.data);
            return response.data;
        } catch (err) {
            console.error('Erreur météo DB:', err);
            return null;
        }
    };

    const fetchForecastFromDB = async () => {
        try {
            const response = await axios.get('http://localhost:8080/meteo/previsions/db', {
                headers: getAuthHeaders()
            });
            setForecastFromDB(response.data);
            return response.data;
        } catch (err) {
            console.error('Erreur prévisions DB:', err);
            return [];
        }
    };

    const fetchDBComparison = async () => {
        try {
            const response = await axios.get('http://localhost:8080/meteo/comparaison/db', {
                headers: getAuthHeaders()
            });
            setDbComparison(response.data);
            return response.data;
        } catch (err) {
            console.error('Erreur comparaison DB:', err);
            return null;
        }
    };

    const fetchHistoryData = async (startDate: string, endDate: string) => {
        if (!startDate || !endDate) {
            showNotification('Veuillez sélectionner des dates de début et fin', 'error');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8080/meteo/historique', {
                headers: getAuthHeaders(),
                params: {
                    dateDebut: startDate,
                    dateFin: endDate
                }
            });
            setHistoryData(response.data);
            showNotification('Historique chargé avec succès', 'success');
        } catch (err) {
            console.error('Erreur historique:', err);
            showNotification('Erreur lors du chargement de l\'historique', 'error');
        } finally {
            setLoading(false);
        }
    };

    const cleanupOldData = async () => {
        try {
            setCleanupStatus('En cours...');
            const response = await axios.delete('http://localhost:8080/meteo/nettoyer', {
                headers: getAuthHeaders()
            });
            setCleanupStatus('Terminé');
            showNotification(response.data.message, 'success');

            // Rafraîchir les données DB après nettoyage
            await fetchCurrentFromDB();
            await fetchForecastFromDB();
        } catch (err) {
            console.error('Erreur nettoyage:', err);
            setCleanupStatus('Erreur');
            showNotification('Erreur lors du nettoyage', 'error');
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            await Promise.all([
                fetchCurrentWeather(),
                fetchForecast(),
                fetchComparison(),
                fetchCurrentFromDB(),
                fetchForecastFromDB(),
                fetchDBComparison()
            ]);

        } catch (err) {
            console.error(err);
            setError("Erreur lors du chargement des données météo.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const refreshData = () => {
        setRefreshing(true);
        fetchData();
    };

    const detectLocation = () => {
        if (!navigator.geolocation) {
            showNotification("La géolocalisation n'est pas prise en charge par ce navigateur.", "error");
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                await axios.put("http://localhost:8080/user/update-location", {
                    latitude,
                    longitude
                }, {
                    headers: getAuthHeaders()
                });
                showNotification("Localisation mise à jour avec succès", "success");
                fetchData();
            } catch (err) {
                console.error(err);
                showNotification("Erreur lors de la mise à jour de la localisation.", "error");
            }
        });
    };

    const showNotification = (message: string, type: 'success' | 'error') => {
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 rounded-lg shadow-lg px-6 py-4 flex items-center z-50 transform transition-transform duration-300 ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`;

        notification.innerHTML = `
            <span class="mr-3">${type === 'success' ? '✓' : '✕'}</span>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('translate-y-20', 'opacity-0');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    };

    const updateCityLocation = async (cityName: string) => {
        const city = ocpCities.find(c => c.name === cityName);
        if (!city) return;

        try {
            await axios.put("http://localhost:8080/user/update-location", {
                latitude: city.latitude,
                longitude: city.longitude
            }, {
                headers: getAuthHeaders()
            });
            showNotification(`Ville changée pour ${cityName}`, "success");
            fetchData();
        } catch (err) {
            console.error(err);
            showNotification("Erreur lors du changement de ville.", "error");
        }
    };

    const exportHistoryData = () => {
        if (historyData.length === 0) {
            showNotification('Aucune donnée à exporter', 'error');
            return;
        }

        const csvContent = [
            ['Date', 'Température', 'Humidité', 'Pression', 'Vent', 'Description'].join(','),
            ...historyData.map(item => [
                new Date(item.dateCreation).toLocaleString(),
                item.temperature,
                item.humidite,
                item.pression,
                item.vitesseVent,
                item.description
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `historique_meteo_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        showNotification('Export terminé', 'success');
    };

    useEffect(() => {
        fetchData();

        // Définir des dates par défaut pour l'historique (7 derniers jours)
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        setHistoryDateEnd(now.toISOString().slice(0, 16));
        setHistoryDateStart(weekAgo.toISOString().slice(0, 16));
    }, []);

    if (loading && !current) return (
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
            <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center space-y-4">
                <div className="relative">
                    <RefreshCw className="animate-spin text-blue-500" size={40} />
                    <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl"></div>
                </div>
                <p className="text-lg text-gray-600 font-medium">Chargement des données météo...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
            <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center">
                <AlertTriangle size={48} className="text-red-500 mb-4" />
                <p className="text-red-500 font-medium text-lg mb-2">{error}</p>
                <button
                    onClick={fetchData}
                    className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center transition-colors duration-200"
                >
                    <RefreshCw size={18} className="mr-2" />
                    Réessayer
                </button>
            </div>
        </div>
    );

    const getWeatherGradient = (weatherId: number) => {
        if (weatherId >= 200 && weatherId < 300) return "from-gray-700 to-gray-900";
        if (weatherId >= 300 && weatherId < 400) return "from-blue-300 to-blue-400";
        if (weatherId >= 500 && weatherId < 600) return "from-blue-400 to-blue-600";
        if (weatherId >= 600 && weatherId < 700) return "from-blue-50 to-blue-200";
        if (weatherId >= 700 && weatherId < 800) return "from-gray-300 to-gray-500";
        if (weatherId === 800) return "from-blue-400 to-blue-600";
        if (weatherId > 800) return "from-blue-200 to-blue-400";
        return "from-blue-400 to-blue-600";
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100">
            <div className="flex flex-col flex-1 w-full">
                {/* Header avec navigation par onglets */}
                <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
                            <div className="flex items-center">
                                <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                                    <span className="mr-3 text-3xl">🌤️</span>
                                    <span className="bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">
                                        Météo OCP
                                    </span>
                                </h1>
                                <div className="flex items-center text-slate-600 ml-6">
                                    <MapPin size={16} className="mr-1 text-blue-500" />
                                    <span className="text-sm">{location}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setActiveTab('current')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                        activeTab === 'current'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-white text-gray-600 hover:bg-blue-50'
                                    }`}
                                >
                                    <Thermometer size={16} className="inline mr-2" />
                                    Actuel
                                </button>
                                <button
                                    onClick={() => setActiveTab('forecast')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                        activeTab === 'forecast'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-white text-gray-600 hover:bg-blue-50'
                                    }`}
                                >
                                    <CalendarDays size={16} className="inline mr-2" />
                                    Prévisions
                                </button>
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                        activeTab === 'history'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-white text-gray-600 hover:bg-blue-50'
                                    }`}
                                >
                                    <History size={16} className="inline mr-2" />
                                    Historique
                                </button>
                                <button
                                    onClick={() => setActiveTab('comparison')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                        activeTab === 'comparison'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-white text-gray-600 hover:bg-blue-50'
                                    }`}
                                >
                                    <BarChart3 size={16} className="inline mr-2" />
                                    Comparaison
                                </button>
                                <button
                                    onClick={() => setActiveTab('database')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                        activeTab === 'database'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-white text-gray-600 hover:bg-blue-50'
                                    }`}
                                >
                                    <Database size={16} className="inline mr-2" />
                                    Base de données
                                </button>
                            </div>
                        </div>

                        {/* Contrôles généraux */}
                        <div className="flex flex-col sm:flex-row gap-3 pb-4">
                            <div className="relative flex-grow max-w-xs">
                                <select
                                    onChange={(e) => updateCityLocation(e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500 transition-colors duration-200 appearance-none text-gray-700"
                                    defaultValue=""
                                >
                                    <option value="" disabled>Choisir une ville OCP</option>
                                    {ocpCities.map((city) => (
                                        <option key={city.name} value={city.name}>
                                            {city.name}
                                        </option>
                                    ))}
                                </select>
                                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            </div>

                            <button
                                onClick={detectLocation}
                                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                                <MapPin size={16} />
                                <span>Ma position</span>
                            </button>

                            <button
                                onClick={refreshData}
                                className={`flex items-center justify-center gap-2 bg-white text-blue-600 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50 transition-all duration-200 ${refreshing ? 'opacity-75' : ''}`}
                                disabled={refreshing}
                            >
                                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                                <span>Actualiser</span>
                            </button>
                        </div>
                    </div>
                </div>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
                    {/* Contenu selon l'onglet actif */}
                    {activeTab === 'current' && current && (
                        <CurrentWeatherTab
                            current={current}
                            hourly={hourly}
                            comparison={comparison}
                            getWeatherGradient={getWeatherGradient}
                        />
                    )}

                    {activeTab === 'forecast' && (
                        <ForecastTab
                            forecast={forecast}
                            selectedDay={selectedDay}
                            setSelectedDay={setSelectedDay}
                        />
                    )}

                    {activeTab === 'history' && (
                        <HistoryTab
                            historyData={historyData}
                            historyDateStart={historyDateStart}
                            historyDateEnd={historyDateEnd}
                            setHistoryDateStart={setHistoryDateStart}
                            setHistoryDateEnd={setHistoryDateEnd}
                            fetchHistoryData={fetchHistoryData}
                            exportHistoryData={exportHistoryData}
                            loading={loading}
                        />
                    )}

                    {activeTab === 'comparison' && (
                        <ComparisonTab
                            comparison={comparison}
                            dbComparison={dbComparison}
                        />
                    )}

                    {activeTab === 'database' && (
                        <DatabaseTab
                            currentFromDB={currentFromDB}
                            forecastFromDB={forecastFromDB}
                            cleanupOldData={cleanupOldData}
                            cleanupStatus={cleanupStatus}
                        />
                    )}
                </main>
            </div>
        </div>
    );
};

// Composant pour l'onglet météo actuelle
const CurrentWeatherTab: React.FC<{
    current: any;
    hourly: any[];
    comparison: any;
    getWeatherGradient: (weatherId: number) => string;
}> = ({ current, hourly, comparison, getWeatherGradient }) => {
    if (!current?.weather?.[0] || !current?.main) return null;

    const weather = current.weather[0];
    const main = current.main;
    const wind = current.wind || {};

    return (
        <div className="space-y-6">
            {/* Carte météo actuelle */}
            <div className={`bg-gradient-to-r ${getWeatherGradient(weather.id)} text-white rounded-3xl shadow-xl p-6 md:p-8 transform hover:scale-[1.01] transition-all duration-300`}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center mb-6 md:mb-0">
                        <div className="relative">
                            <img
                                src={`https://openweathermap.org/img/wn/${weather.icon}@4x.png`}
                                alt={weather.description}
                                className="w-32 h-32 drop-shadow-lg"
                            />
                        </div>
                        <div className="ml-6">
                            <div className="text-6xl md:text-7xl font-extrabold">
                                {Math.round(main.temp)}°
                                <span className="text-lg align-top ml-1 opacity-70">C</span>
                            </div>
                            <div className="text-lg opacity-80 font-medium capitalize">
                                {weather.description}
                            </div>
                            <div className="text-sm opacity-70 mt-1">
                                Mise à jour: {new Date().toLocaleTimeString()}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <WeatherItem
                            icon={<Thermometer size={24} />}
                            label="Ressenti"
                            value={`${Math.round(main.feels_like)}°C`}
                            lightMode={false}
                        />
                        <WeatherItem
                            icon={<Droplets size={24} />}
                            label="Humidité"
                            value={`${main.humidity}%`}
                            lightMode={false}
                        />
                        <WeatherItem
                            icon={<Wind size={24} />}
                            label="Vent"
                            value={`${Math.round(wind.speed || 0)} km/h`}
                            lightMode={false}
                        />
                        <WeatherItem
                            icon={<Compass size={24} />}
                            label="Direction"
                            value={`${wind.deg || 0}°`}
                            lightMode={false}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Prévision horaire */}
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 lg:col-span-2">
                    <h2 className="text-xl font-semibold mb-6 text-slate-700 flex items-center">
                        <Clock className="mr-3 text-blue-500" size={22} />
                        Prévision horaire
                        <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            48 prochaines heures
                        </span>
                    </h2>
                    <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-blue-100">
                        {hourly.map((h, i) => (
                            <div
                                key={i}
                                className={`flex flex-col items-center ${i === 0 ? 'bg-blue-500 text-white' : 'bg-blue-50 hover:bg-blue-100'} px-4 py-3 rounded-xl shadow-sm min-w-[90px] transform hover:scale-105 transition-transform duration-200`}
                            >
                                <div className="text-sm font-medium">{formatHour(h.dt_txt)}</div>
                                <img
                                    src={`https://openweathermap.org/img/wn/${h.weather[0].icon}@2x.png`}
                                    alt=""
                                    className="w-12 h-12 my-1"
                                />
                                <div className="text-lg font-semibold">{Math.round(h.main.temp)}°</div>
                                <div className={`text-xs ${i === 0 ? 'text-blue-100' : 'text-gray-500'} capitalize`}>
                                    {h.weather[0].description.length > 10
                                        ? h.weather[0].description.substring(0, 10) + '...'
                                        : h.weather[0].description}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Analyse de prévision */}
                {comparison && (
                    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-6 text-slate-700 flex items-center">
                            <Zap className="mr-3 text-blue-500" size={22} />
                            Analyse de prévision
                        </h2>
                        <div className="space-y-4">
                            <ComparisonItem
                                label="Température actuelle"
                                value={comparison.temp_actuelle}
                                color="text-blue-500"
                                icon={<Thermometer size={18} />}
                            />
                            <ComparisonItem
                                label="Prévue (jour 1)"
                                value={comparison.temp_prev}
                                color="text-purple-500"
                                icon={<CalendarDays size={18} />}
                            />
                            <ComparisonItem
                                label="Différence"
                                value={comparison.difference}
                                color={comparison.difference > 0 ? 'text-red-500' : comparison.difference < 0 ? 'text-blue-500' : 'text-green-500'}
                                showSign
                                icon={<ChevronRight size={18} />}
                            />

                            <div className="mt-6 pt-4 border-t border-gray-100">
                                <div className="text-sm text-gray-500">
                                    Précision de prévision:
                                </div>
                                <div className="mt-2 relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                    {(() => {
                                        const diff = Math.abs(comparison.difference);
                                        const accuracy = Math.max(0, 100 - (diff * 10));
                                        const color = accuracy > 80 ? 'bg-green-500' :
                                            accuracy > 60 ? 'bg-yellow-500' : 'bg-red-500';
                                        return (
                                            <div
                                                className={`absolute top-0 left-0 h-full ${color}`}
                                                style={{ width: `${accuracy}%` }}
                                            ></div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Composant pour l'onglet prévisions météo
const ForecastTab: React.FC<{
    forecast: any[];
    selectedDay: number;
    setSelectedDay: (day: number) => void;
}> = ({ forecast, selectedDay, setSelectedDay }) => {
    if (!forecast || forecast.length === 0) return (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-8 text-center">
            <CalendarDays size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">Aucune prévision disponible</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Sélecteur de jour */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-6 text-slate-700 flex items-center">
                    <CalendarDays className="mr-3 text-blue-500" size={22} />
                    Prévisions sur 5 jours
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                    {forecast.map((day, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedDay(index)}
                            className={`p-4 rounded-xl text-center transition-all duration-200 ${
                                selectedDay === index
                                    ? 'bg-blue-500 text-white shadow-lg scale-105'
                                    : 'bg-blue-50 hover:bg-blue-100 text-gray-700'
                            }`}
                        >
                            <div className="text-sm font-medium mb-2">
                                {formatDayName(day.date)}
                            </div>
                            <img
                                src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                                alt={day.description}
                                className="w-12 h-12 mx-auto mb-2"
                            />
                            <div className="font-semibold">
                                {Math.round(day.temp_max)}°/{Math.round(day.temp_min)}°
                            </div>
                            <div className="text-xs mt-1 capitalize">
                                {day.description}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Détails du jour sélectionné */}
            {forecast[selectedDay] && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold mb-4 text-slate-700">
                            Détails pour {formatDayName(forecast[selectedDay].date)}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <WeatherItem
                                icon={<Thermometer size={20} />}
                                label="Température max"
                                value={`${Math.round(forecast[selectedDay].temp_max)}°C`}
                            />
                            <WeatherItem
                                icon={<Thermometer size={20} />}
                                label="Température min"
                                value={`${Math.round(forecast[selectedDay].temp_min)}°C`}
                            />
                            <WeatherItem
                                icon={<Droplets size={20} />}
                                label="Humidité"
                                value={`${forecast[selectedDay].humidity}%`}
                            />
                            <WeatherItem
                                icon={<Wind size={20} />}
                                label="Vent"
                                value={`${Math.round(forecast[selectedDay].wind_speed)} km/h`}
                            />
                        </div>
                    </div>

                    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold mb-4 text-slate-700">
                            Graphique de température
                        </h3>
                        <div className="h-48 flex items-end justify-around">
                            {forecast.map((day, index) => {
                                const maxTemp = Math.max(...forecast.map(d => d.temp_max));
                                const height = (day.temp_max / maxTemp) * 160;
                                return (
                                    <div key={index} className="flex flex-col items-center">
                                        <div
                                            className={`w-8 rounded-t-lg transition-all duration-300 ${
                                                index === selectedDay ? 'bg-blue-500' : 'bg-blue-300'
                                            }`}
                                            style={{ height: `${height}px` }}
                                        ></div>
                                        <div className="text-xs mt-2 font-medium">
                                            {Math.round(day.temp_max)}°
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {formatDayName(day.date, true)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Composant pour l'onglet historique
const HistoryTab: React.FC<{
    historyData: any[];
    historyDateStart: string;
    historyDateEnd: string;
    setHistoryDateStart: (date: string) => void;
    setHistoryDateEnd: (date: string) => void;
    fetchHistoryData: (start: string, end: string) => void;
    exportHistoryData: () => void;
    loading: boolean;
}> = ({
          historyData,
          historyDateStart,
          historyDateEnd,
          setHistoryDateStart,
          setHistoryDateEnd,
          fetchHistoryData,
          exportHistoryData,
          loading
      }) => {
    return (
        <div className="space-y-6">
            {/* Contrôles de l'historique */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-6 text-slate-700 flex items-center">
                    <History className="mr-3 text-blue-500" size={22} />
                    Historique météo
                    <span className="ml-3 px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        {historyData.length} enregistrements
                    </span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date de début
                        </label>
                        <input
                            type="datetime-local"
                            value={historyDateStart}
                            onChange={(e) => setHistoryDateStart(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date de fin
                        </label>
                        <input
                            type="datetime-local"
                            value={historyDateEnd}
                            onChange={(e) => setHistoryDateEnd(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => fetchHistoryData(historyDateStart, historyDateEnd)}
                            disabled={loading}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors duration-200 disabled:opacity-50"
                        >
                            <Filter size={16} className="mr-2" />
                            {loading ? 'Chargement...' : 'Filtrer'}
                        </button>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={exportHistoryData}
                            disabled={historyData.length === 0}
                            className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors duration-200 disabled:opacity-50"
                        >
                            <Download size={16} className="mr-2" />
                            Exporter CSV
                        </button>
                    </div>
                </div>

                {/* Graphique de l'historique */}
                {historyData.length > 0 && (
                    <div className="mt-6 h-64 bg-gray-50 rounded-lg p-4">
                        <div className="h-full flex items-end justify-around">
                            {historyData.slice(0, 20).map((item, index) => {
                                const maxTemp = Math.max(...historyData.map(d => d.temperature));
                                const height = (item.temperature / maxTemp) * 200;
                                return (
                                    <div key={index} className="flex flex-col items-center group">
                                        <div className="relative">
                                            <div
                                                className="w-3 bg-blue-500 rounded-t-sm transition-all duration-300 group-hover:bg-blue-600"
                                                style={{ height: `${height}px` }}
                                            ></div>
                                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                                                {Math.round(item.temperature)}°C
                                            </div>
                                        </div>
                                        <div className="text-xs mt-1 transform rotate-45 origin-bottom-left">
                                            {new Date(item.dateCreation).toLocaleDateString()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Liste des données historiques */}
            {historyData.length > 0 ? (
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-slate-700">
                            Données détaillées
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Température</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Humidité</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pression</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vent</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ville</th>

                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {historyData.map((item, index) => (
                                <tr key={index} className="hover:bg-blue-50 transition-colors duration-200">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(item.dateCreation).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                        {Math.round(item.temperature)}°C
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.humidite}%
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {Math.round(item.pression)} hPa
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {Math.round(item.vitesseVent)} km/h
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 capitalize">
                                        {item.description}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.ville || '—'}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-8 text-center">
                    <History size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg">Aucune donnée historique trouvée</p>
                    <p className="text-gray-400 text-sm mt-2">
                        Sélectionnez une période et cliquez sur "Filtrer" pour afficher l'historique
                    </p>
                </div>
            )}
        </div>
    );
};

// Composant pour l'onglet comparaison
const ComparisonTab: React.FC<{
    comparison: any;
    dbComparison: any;
}> = ({ comparison, dbComparison }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Comparaison API */}
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold mb-6 text-slate-700 flex items-center">
                        <BarChart3 className="mr-3 text-blue-500" size={22} />
                        Comparaison API
                        <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            Temps réel
                        </span>
                    </h2>

                    {comparison ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                                <span className="text-gray-700">Température actuelle</span>
                                <span className="text-xl font-bold text-blue-600">
                                    {Math.round(comparison.temp_actuelle)}°C
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                                <span className="text-gray-700">Température prévue</span>
                                <span className="text-xl font-bold text-purple-600">
                                    {Math.round(comparison.temp_prev)}°C
                                </span>
                            </div>
                            <div className={`flex justify-between items-center p-4 rounded-lg ${
                                comparison.difference > 0 ? 'bg-red-50' :
                                    comparison.difference < 0 ? 'bg-blue-50' : 'bg-green-50'
                            }`}>
                                <span className="text-gray-700">Différence</span>
                                <span className={`text-xl font-bold ${
                                    comparison.difference > 0 ? 'text-red-600' :
                                        comparison.difference < 0 ? 'text-blue-600' : 'text-green-600'
                                }`}>
        {comparison.difference > 0 ? '+' : ''}{Math.round(comparison.difference)}°C
    </span>
                            </div>

                            <div className="flex justify-between items-center p-4 bg-gray-100 rounded-lg">
                                <span className="text-gray-700">Ville (API)</span>
                                <span className="text-sm font-medium text-gray-800 capitalize">
        {comparison.ville || 'Inconnue'}
    </span>
                            </div>

                            {/* Indicateur de précision */}
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-600">Précision de la prévision</span>
                                    <span className="text-sm font-medium text-gray-800">
                                        {Math.max(0, 100 - Math.abs(comparison.difference) * 10).toFixed(0)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ${
                                            Math.abs(comparison.difference) < 1 ? 'bg-green-500' :
                                                Math.abs(comparison.difference) < 3 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                        style={{
                                            width: `${Math.max(0, 100 - Math.abs(comparison.difference) * 10)}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <AlertTriangle size={48} className="mx-auto text-gray-400 mb-4"/>
                            <p className="text-gray-500">Comparaison API non disponible</p>
                        </div>
                    )}
                </div>

                {/* Comparaison Base de données */}
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold mb-6 text-slate-700 flex items-center">
                        <Database className="mr-3 text-green-500" size={22}/>
                        Comparaison Base de données
                        <span className="ml-3 px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            Historique
                        </span>
                    </h2>

                    {dbComparison ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                                <span className="text-gray-700">Température stockée</span>
                                <span className="text-xl font-bold text-blue-600">
                                    {Math.round(dbComparison.temp_actuelle)}°C
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                                <span className="text-gray-700">Prévision stockée</span>
                                <span className="text-xl font-bold text-purple-600">
                                    {Math.round(dbComparison.temp_prev)}°C
                                </span>
                            </div>
                            <div className={`flex justify-between items-center p-4 rounded-lg ${
                                dbComparison.difference > 0 ? 'bg-red-50' :
                                    dbComparison.difference < 0 ? 'bg-blue-50' : 'bg-green-50'
                            }`}>
                                <span className="text-gray-700">Différence</span>
                                <span className={`text-xl font-bold ${
                                    dbComparison.difference > 0 ? 'text-red-600' :
                                        dbComparison.difference < 0 ? 'text-blue-600' : 'text-green-600'
                                }`}>
                                    {dbComparison.difference > 0 ? '+' : ''}{Math.round(dbComparison.difference)}°C
                                </span>
                            </div>

                            {/* Informations temporelles */}
                            <div className="mt-6 space-y-2 text-sm text-gray-600">
                                <div className="flex justify-between">
                                    <span>Date actuelle:</span>
                                    <span>{new Date(dbComparison.date_actuelle).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Date prévision:</span>
                                    <span>{new Date(dbComparison.date_prevision).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-gray-100 rounded-lg">
                                <span className="text-gray-700">Ville (DB)</span>
                                <span className="text-sm font-medium text-gray-800 capitalize">
    {dbComparison.ville || 'Inconnue'}
  </span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Database size={48} className="mx-auto text-gray-400 mb-4"/>
                            <p className="text-gray-500">Comparaison DB non disponible</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Analyse comparative */}
            {comparison && dbComparison && (
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-slate-700 flex items-center">
                        <ChevronRight className="mr-2 text-orange-500" size={20} />
                        Analyse comparative
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                                {Math.abs(comparison.difference - dbComparison.difference).toFixed(1)}°
                            </div>
                            <div className="text-sm text-gray-600">Écart entre sources</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                                {((Math.abs(comparison.difference) + Math.abs(dbComparison.difference)) / 2).toFixed(1)}°
                            </div>
                            <div className="text-sm text-gray-600">Erreur moyenne</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                                {Math.max(0, 100 - ((Math.abs(comparison.difference) + Math.abs(dbComparison.difference)) / 2) * 10).toFixed(0)}%
                            </div>
                            <div className="text-sm text-gray-600">Fiabilité globale</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Composant pour l'onglet base de données
const DatabaseTab: React.FC<{
    currentFromDB: any;
    forecastFromDB: any[];
    cleanupOldData: () => void;
    cleanupStatus: string;
}> = ({ currentFromDB, forecastFromDB, cleanupOldData, cleanupStatus }) => {
    return (
        <div className="space-y-6">
            {/* Outils de gestion */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-6 text-slate-700 flex items-center">
                    <Settings className="mr-3 text-blue-500" size={22} />
                    Gestion de la base de données
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <Database size={32} className="mx-auto text-blue-500 mb-2" />
                        <div className="text-2xl font-bold text-blue-600">
                            {currentFromDB ? '1' : '0'}
                        </div>
                        <div className="text-sm text-gray-600">Météo actuelle</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                        <CalendarDays size={32} className="mx-auto text-green-500 mb-2" />
                        <div className="text-2xl font-bold text-green-600">
                            {forecastFromDB.length}
                        </div>
                        <div className="text-sm text-gray-600">Prévisions stockées</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                        <Trash2 size={32} className="mx-auto text-red-500 mb-2" />
                        <button
                            onClick={cleanupOldData}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 mt-2"
                        >
                            Nettoyer données
                        </button>
                        {cleanupStatus && (
                            <div className="text-xs mt-2 text-gray-600">
                                Statut: {cleanupStatus}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Données météo actuelles stockées */}
            {currentFromDB && (
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-slate-700 flex items-center">
                        <Thermometer className="mr-2 text-blue-500" size={20} />
                        Dernière météo stockée
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <WeatherItem
                            icon={<Thermometer size={18} />}
                            label="Température"
                            value={`${Math.round(currentFromDB.temperature)}°C`}
                        />
                        <WeatherItem
                            icon={<Droplets size={18} />}
                            label="Humidité"
                            value={`${currentFromDB.humidite}%`}
                        />
                        <WeatherItem
                            icon={<Wind size={18} />}
                            label="Vent"
                            value={`${Math.round(currentFromDB.vitesseVent)} km/h`}
                        />
                        <WeatherItem
                            icon={<Clock size={18} />}
                            label="Mis à jour"
                            value={new Date(currentFromDB.dateCreation).toLocaleTimeString()}
                        />
                    </div>
                    <div className="mt-4 text-sm text-gray-600">
                        <div className="flex justify-between">
                            <span>Ville:</span>
                            <span>{currentFromDB.ville}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Description:</span>
                            <span className="capitalize">{currentFromDB.description}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Date de création:</span>
                            <span>{new Date(currentFromDB.dateCreation).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            )}
            {/* Prévisions stockées */}
            {forecastFromDB && forecastFromDB.length > 0 && (
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-slate-700 flex items-center">
                        <CalendarDays className="mr-2 text-green-500" size={20} />
                        Prévisions stockées
                        <span className="ml-3 px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            {forecastFromDB.length} entrées
                        </span>
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left">Date prévision</th>
                                <th className="px-4 py-2 text-left">Température</th>
                                <th className="px-4 py-2 text-left">Humidité</th>
                                <th className="px-4 py-2 text-left">Description</th>
                                <th className="px-4 py-2 text-left">Stocké le</th>
                                <th className="px-4 py-2 text-left">Ville</th>

                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {forecastFromDB.slice(0, 10).map((forecast, index) => (
                                <tr key={index} className="hover:bg-blue-50 transition-colors duration-200">
                                    <td className="px-4 py-2 font-medium">
                                        {new Date(forecast.datePrevision).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-2 text-blue-600 font-semibold">
                                        {Math.round(forecast.temperature)}°C
                                    </td>
                                    <td className="px-4 py-2">
                                        {forecast.humidite}%
                                    </td>
                                    <td className="px-4 py-2 capitalize">
                                        {forecast.description}
                                    </td>
                                    <td className="px-4 py-2 text-gray-500">
                                        {new Date(forecast.dateCreation).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-2">{forecast.ville || '—'}</td>

                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                    {forecastFromDB.length > 10 && (
                        <div className="mt-4 text-center text-sm text-gray-500">
                            Et {forecastFromDB.length - 10} autres prévisions...
                        </div>
                    )}
                </div>
            )}

            {/* État vide */}
            {!currentFromDB && (!forecastFromDB || forecastFromDB.length === 0) && (
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-8 text-center">
                    <Database size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg">Aucune donnée en base</p>
                    <p className="text-gray-400 text-sm mt-2">
                        Les données météo seront automatiquement stockées lors des prochaines requêtes
                    </p>
                </div>
            )}
        </div>
    );
};

// Composants utilitaires
const WeatherItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string;
    lightMode?: boolean;
}> = ({ icon, label, value, lightMode = true }) => (
    <div className={`flex items-center ${lightMode ? 'text-gray-700' : 'text-white/90'}`}>
        <div className={`mr-3 ${lightMode ? 'text-blue-500' : 'text-white/70'}`}>
            {icon}
        </div>
        <div>
            <div className={`text-xs ${lightMode ? 'text-gray-500' : 'text-white/60'} uppercase tracking-wide`}>
                {label}
            </div>
            <div className="font-semibold">{value}</div>
        </div>
    </div>
);

const ComparisonItem: React.FC<{
    label: string;
    value: number;
    color: string;
    showSign?: boolean;
    icon: React.ReactNode;
}> = ({ label, value, color, showSign = false, icon }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center">
            <div className={`mr-2 ${color}`}>{icon}</div>
            <span className="text-sm text-gray-600">{label}</span>
        </div>
        <span className={`font-semibold ${color}`}>
            {showSign && value > 0 ? '+' : ''}{Math.round(value)}°C
        </span>
    </div>
);

// Fonctions utilitaires
const formatHour = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.getHours().toString().padStart(2, '0') + 'h';
};

const formatDayName = (dateStr: string, short = false) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
        return short ? 'Auj.' : "Aujourd'hui";
    }
    if (date.toDateString() === tomorrow.toDateString()) {
        return short ? 'Dem.' : 'Demain';
    }

    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const fullDays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    return short ? days[date.getDay()] : fullDays[date.getDay()];
};

const groupForecastByDay = (forecastList: any[]) => {
    const grouped = forecastList.reduce((acc: any, item: any) => {
        const date = item.dt_txt.split(' ')[0];
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(item);
        return acc;
    }, {});

    return Object.keys(grouped).slice(0, 5).map(date => {
        const dayData = grouped[date];
        const temps = dayData.map((d: any) => d.main.temp);
        const firstItem = dayData[0];

        return {
            date,
            temp_max: Math.max(...temps),
            temp_min: Math.min(...temps),
            description: firstItem.weather[0].description,
            icon: firstItem.weather[0].icon,
            humidity: firstItem.main.humidity,
            wind_speed: firstItem.wind.speed,
            items: dayData
        };
    });
};

export default WeatherPage;
