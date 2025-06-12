import React, { useEffect, useState, useRef } from 'react';
import { Wind, RefreshCw, Info, MapPin, Droplets, CloudRain, AlertTriangle, Clock } from 'lucide-react';
import axios from 'axios';

import ChartAQI from '../components/ChartAQI';

const AirQualityPage: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [location, setLocation] = useState('Votre localisation');
    const [loading, setLoading] = useState(false);
    const [airData, setAirData] = useState<any>(null);
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
    const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
    const [refreshInterval, setRefreshInterval] = useState<number>(5 * 60 * 1000); // 5 minutes par défaut
    const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const fetchAirQuality = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:8080/api/air/live', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            setAirData(res.data);
            setLastRefreshTime(new Date());
        } catch (error) {
            console.error('Erreur récupération air:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAirQualityHistory = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/air/history', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            setHistoryData(res.data.slice(0, 24));
        } catch (error) {
            console.error('Erreur récupération historique:', error);
        }
    };

    // Configuration de l'auto-refresh
    const setupAutoRefresh = () => {
        // Nettoyage de tout timer existant
        if (refreshTimerRef.current) {
            clearInterval(refreshTimerRef.current);
        }

        // Création d'un nouveau timer uniquement si l'auto-refresh est activé
        if (autoRefreshEnabled) {
            refreshTimerRef.current = setInterval(() => {
                console.log("Auto-refresh des données...");
                fetchAirQuality();
                fetchAirQualityHistory();
            }, refreshInterval);
        }
    };

    // Gestion de l'activation/désactivation de l'auto-refresh
    const toggleAutoRefresh = () => {
        setAutoRefreshEnabled(prev => !prev);
    };

    // Changement d'intervalle de rafraîchissement
    const changeRefreshInterval = (minutes: number) => {
        const newInterval = minutes * 60 * 1000;
        setRefreshInterval(newInterval);
    };

    // Effet pour charger les données initiales
    useEffect(() => {
        fetchAirQuality();
        fetchAirQualityHistory();
        detectCityAutomatically();

        // Nettoyage au démontage du composant
        return () => {
            if (refreshTimerRef.current) {
                clearInterval(refreshTimerRef.current);
            }
        };
    }, []);

    // Effet pour configurer l'auto-refresh lorsque les paramètres changent
    useEffect(() => {
        setupAutoRefresh();

        return () => {
            if (refreshTimerRef.current) {
                clearInterval(refreshTimerRef.current);
            }
        };
    }, [autoRefreshEnabled, refreshInterval]);

    const detectCityAutomatically = async () => {
        try {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    const { latitude, longitude } = position.coords;
                    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
                        params: {
                            lat: latitude,
                            lon: longitude,
                            format: 'json',
                        },
                    });

                    const city = response.data.address.city || response.data.address.town || response.data.address.village || "Votre localisation";
                    setLocation(city);
                }, (error) => {
                    console.error("Erreur de géolocalisation :", error);
                    setLocation("Localisation inconnue");
                });
            } else {
                console.error("La géolocalisation n'est pas supportée par ce navigateur.");
                setLocation("Non supporté");
            }
        } catch (error) {
            console.error("Erreur lors de la récupération de la ville :", error);
            setLocation("Erreur de détection");
        }
    };

    const handleRefresh = () => fetchAirQuality();

    const getAqiCategory = (aqi: number) => {
        if (aqi <= 50) return 'Excellente';
        if (aqi <= 100) return 'Bonne';
        if (aqi <= 150) return 'Modérée';
        if (aqi <= 200) return 'Mauvaise';
        if (aqi <= 300) return 'Très mauvaise';
        return 'Dangereuse';
    };

    const getAqiColor = (aqi: number) => {
        if (aqi <= 50) return 'text-emerald-500';
        if (aqi <= 100) return 'text-green-500';
        if (aqi <= 150) return 'text-yellow-500';
        if (aqi <= 200) return 'text-orange-500';
        if (aqi <= 300) return 'text-red-500';
        return 'text-purple-800';
    };

    const getAqiBgColor = (aqi: number) => {
        if (aqi <= 50) return 'bg-emerald-500';
        if (aqi <= 100) return 'bg-green-500';
        if (aqi <= 150) return 'bg-yellow-500';
        if (aqi <= 200) return 'bg-orange-500';
        if (aqi <= 300) return 'bg-red-500';
        return 'bg-purple-800';
    };

    const getAqiGradient = (aqi: number) => {
        if (aqi <= 50) return 'from-emerald-50 to-cyan-50';
        if (aqi <= 100) return 'from-green-50 to-emerald-50';
        if (aqi <= 150) return 'from-yellow-50 to-amber-50';
        if (aqi <= 200) return 'from-orange-50 to-amber-50';
        if (aqi <= 300) return 'from-red-50 to-rose-50';
        return 'from-purple-50 to-fuchsia-50';
    };

    const getBorderColor = (aqi: number) => {
        if (aqi <= 50) return 'border-emerald-300';
        if (aqi <= 100) return 'border-green-300';
        if (aqi <= 150) return 'border-yellow-300';
        if (aqi <= 200) return 'border-orange-300';
        if (aqi <= 300) return 'border-red-300';
        return 'border-purple-300';
    };

    const getAqiIcon = (aqi: number) => {
        if (aqi <= 50) return <Wind size={28} className="text-emerald-500" />;
        if (aqi <= 100) return <Wind size={28} className="text-green-500" />;
        if (aqi <= 150) return <CloudRain size={28} className="text-yellow-500" />;
        if (aqi <= 200) return <Droplets size={28} className="text-orange-500" />;
        if (aqi <= 300) return <AlertTriangle size={28} className="text-red-500" />;
        return <AlertTriangle size={28} className="text-purple-800" />;
    };

    if (!airData) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
                <div className="flex flex-col items-center">
                    <RefreshCw size={56} className="animate-spin text-blue-500 opacity-80 mb-4" />
                    <p className="text-gray-600 font-medium animate-pulse">Chargement des données...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-blue-50">
            <div className="flex flex-col flex-1">
                <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">

                    {/* En-tête avec effet glassmorphism */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 bg-white bg-opacity-60 backdrop-filter backdrop-blur-lg p-6 rounded-2xl shadow-sm border border-white border-opacity-40">
                        <div className="mb-4 md:mb-0">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight flex items-center">
                                <Wind size={28} className="text-blue-500 mr-3" />
                                Qualité de l'air
                            </h1>
                            <p className="text-gray-600 mt-1 ml-1">Surveillance en temps réel des polluants atmosphériques</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="flex flex-row gap-2 w-full sm:w-auto">
                                <button
                                    onClick={handleRefresh}
                                    disabled={loading}
                                    className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-600 border border-blue-500 shadow-sm text-white hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 font-medium"
                                >
                                    <RefreshCw size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                                    {loading ? 'Actualisation...' : 'Actualiser'}
                                </button>

                                <button
                                    onClick={toggleAutoRefresh}
                                    className={`flex items-center justify-center px-4 py-2.5 rounded-xl border shadow-sm transition-colors duration-200 font-medium ${
                                        autoRefreshEnabled
                                            ? 'bg-green-600 border-green-500 text-white hover:bg-green-700'
                                            : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <Clock size={18} className="mr-2" />
                                    {autoRefreshEnabled ? 'Auto: ON' : 'Auto: OFF'}
                                </button>
                            </div>

                            <div className="w-full sm:w-64 flex items-center bg-white p-2 px-4 rounded-xl shadow-sm border border-gray-200 focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-blue-400 transition-all duration-200">
                                <MapPin size={18} className="text-blue-500 mr-2 flex-shrink-0" />
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="w-full outline-none text-sm py-1.5"
                                    placeholder="Votre localisation"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Données principales */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
                        {/* Indice AQI principal */}
                        <div className={`md:col-span-4 bg-gradient-to-br ${getAqiGradient(airData.aqi)} rounded-2xl shadow-lg p-6 flex flex-col justify-center items-center text-center transform transition-all duration-300 hover:shadow-xl border ${getBorderColor(airData.aqi)}`}>
                            <div className="p-5 mb-4 bg-white bg-opacity-70 rounded-full shadow-inner">
                                <div className={`text-7xl md:text-8xl font-bold ${getAqiColor(airData.aqi)}`}>
                                    {airData.aqi}
                                </div>
                            </div>
                            <div className="text-gray-800 font-semibold text-xl md:text-2xl mb-3 flex items-center justify-center">
                                {getAqiIcon(airData.aqi)}
                                <span className="ml-2">{getAqiCategory(airData.aqi)}</span>
                            </div>
                            <div className="mt-4 bg-white bg-opacity-70 rounded-xl px-6 py-4 w-full shadow-sm">
                                <div className="text-gray-700 text-sm font-medium flex justify-between items-center mb-2">
                                    <span>PM2.5:</span>
                                    <span className="font-bold">{airData.pm25} µg/m³</span>
                                </div>
                                <div className="text-gray-700 text-sm font-medium flex justify-between items-center">
                                    <span>PM10:</span>
                                    <span className="font-bold">{airData.pm10} µg/m³</span>
                                </div>
                            </div>
                            <div className="text-xs text-gray-600 mt-6 px-3 py-1.5 bg-white bg-opacity-70 rounded-full inline-flex items-center">
                                <RefreshCw size={12} className="mr-1" />
                                Mis à jour: {lastRefreshTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {autoRefreshEnabled && (
                                <div className="mt-2 text-xs text-green-600 px-3 py-1.5 bg-green-50 bg-opacity-70 rounded-full inline-flex items-center">
                                    <Clock size={12} className="mr-1" />
                                    Auto-refresh actif ({refreshInterval/60000} min)
                                </div>
                            )}
                        </div>

                        {/* Détail des polluants */}
                        <div className="md:col-span-8 bg-white rounded-2xl shadow-lg p-6 md:p-8 relative overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 opacity-60 rounded-bl-full -z-10"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-50 opacity-60 rounded-tr-full -z-10"></div>

                            <h2 className="text-lg md:text-xl font-semibold mb-6 flex items-center text-gray-800">
                                <Wind size={22} className="text-blue-600 mr-2.5" />
                                Détail complet des polluants
                            </h2>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {[
                                    { label: "PM2.5", value: airData.pm25, unit: "µg/m³", icon: <Droplets size={20} className="text-blue-500" /> },
                                    { label: "PM10", value: airData.pm10, unit: "µg/m³", icon: <Droplets size={20} className="text-blue-500" /> },
                                    { label: "NO₂", value: airData.no2, unit: "µg/m³", icon: <CloudRain size={20} className="text-blue-500" /> },
                                    { label: "O₃", value: airData.o3, unit: "µg/m³", icon: <Wind size={20} className="text-blue-500" /> },
                                    { label: "CO", value: airData.co, unit: "mg/m³", icon: <AlertTriangle size={20} className="text-blue-500" /> }
                                ].map((pollutant, index) => (
                                    <PollutantBox
                                        key={index}
                                        label={pollutant.label}
                                        value={pollutant.value}
                                        unit={pollutant.unit}
                                        icon={pollutant.icon}
                                    />
                                ))}
                            </div>

                            <div className="mt-8">
                                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                    <Info size={18} className="mr-2 text-blue-500" />
                                    Impact sanitaire
                                </h3>

                                <div className={`bg-opacity-25 p-5 rounded-xl text-sm text-gray-700 shadow-sm border-l-4 ${getBorderColor(airData.aqi)} ${getAqiGradient(airData.aqi)}`}>
                                    {airData.aqi <= 50 && "Qualité de l'air excellente. Conditions idéales pour les activités en plein air pour tous."}
                                    {airData.aqi > 50 && airData.aqi <= 100 && "Qualité de l'air acceptable. Les personnes particulièrement sensibles peuvent ressentir des effets mineurs."}
                                    {airData.aqi > 100 && airData.aqi <= 150 && "Les personnes sensibles (asthmatiques, personnes âgées, enfants) peuvent ressentir des symptômes respiratoires."}
                                    {airData.aqi > 150 && airData.aqi <= 200 && "Toute la population peut commencer à ressentir des effets nocifs. Limitation recommandée des activités en extérieur."}
                                    {airData.aqi > 200 && airData.aqi <= 300 && "Avertissement sanitaire : risques accrus pour l'ensemble de la population. Évitez les activités prolongées en extérieur."}
                                    {airData.aqi > 300 && "Alerte sanitaire : tous peuvent subir des effets sanitaires graves. Évitez impérativement toute activité physique en extérieur."}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Historique des 24 dernières heures */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8 border border-gray-100">
                        <h2 className="text-lg md:text-xl font-semibold mb-6 flex items-center text-gray-800">
                            <RefreshCw size={22} className="text-blue-600 mr-2.5" />
                            Évolution AQI - 24 dernières heures
                        </h2>

                        {/* Graphique AQI */}
                        <div className="mb-8">
                            <ChartAQI data={historyData} />
                        </div>

                        {/* Tableau historique */}
                        {!historyData.length ? (
                            <div className="text-gray-500 text-center py-10 bg-gray-50 rounded-xl">
                                <RefreshCw size={32} className="mx-auto mb-3 text-gray-400" />
                                Aucune donnée disponible pour les dernières 24 heures.
                            </div>
                        ) : (
                            <div className="overflow-x-auto bg-gray-50 rounded-xl p-2">
                                <table className="min-w-full table-auto text-sm">
                                    <thead>
                                    <tr className="bg-gray-100 text-gray-700 rounded-lg">
                                        <th className="px-4 py-3 text-left font-medium">Heure</th>
                                        <th className="px-4 py-3 text-left font-medium">AQI</th>
                                        <th className="px-4 py-3 text-left font-medium">Niveau</th>
                                        <th className="px-4 py-3 text-left font-medium">PM2.5</th>
                                        <th className="px-4 py-3 text-left font-medium">PM10</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {historyData.map((item: any, index: number) => (
                                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="px-4 py-3 text-gray-600">
                                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-4 py-3">
                                                    <span className={`font-bold ${getAqiColor(item.aqi)}`}>
                                                        {item.aqi}
                                                    </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getAqiBgColor(item.aqi)}`}>
                                                        {getAqiCategory(item.aqi)}
                                                    </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 font-medium">{item.pm25} µg/m³</td>
                                            <td className="px-4 py-3 text-gray-700 font-medium">{item.pm10} µg/m³</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Paramètres de rafraîchissement */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
                        <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center text-gray-800">
                            <Clock size={22} className="text-blue-600 mr-2.5" />
                            Paramètres de rafraîchissement
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="flex items-center mb-4">
                                    <div className="mr-4">
                                        <label className="flex items-center cursor-pointer">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={autoRefreshEnabled}
                                                    onChange={toggleAutoRefresh}
                                                />
                                                <div className={`block w-14 h-8 rounded-full ${autoRefreshEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${autoRefreshEnabled ? 'transform translate-x-6' : ''}`}></div>
                                            </div>
                                            <div className="ml-3 text-gray-700 font-medium">
                                                Auto-refresh {autoRefreshEnabled ? 'activé' : 'désactivé'}
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600 mb-4">
                                    L'auto-refresh permet de mettre à jour automatiquement les données sans action manuelle.
                                </p>

                                {lastRefreshTime && (
                                    <div className="text-sm text-gray-600">
                                        Dernière mise à jour: <strong>{lastRefreshTime.toLocaleString()}</strong>
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="mb-4">
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Intervalle de rafraîchissement
                                    </label>
                                    <div className="flex gap-2 flex-wrap">
                                        {[1, 5, 10, 15, 30].map(minutes => (
                                            <button
                                                key={minutes}
                                                onClick={() => changeRefreshInterval(minutes)}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                                    refreshInterval === minutes * 60 * 1000
                                                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                                }`}
                                            >
                                                {minutes} {minutes === 1 ? 'minute' : 'minutes'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {autoRefreshEnabled && (
                                    <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                                        Les données seront automatiquement actualisées toutes les {refreshInterval/60000} minutes.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Informations et légende */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <UnderstandingAQI />
                        <PollutantInfo />
                    </div>

                </main>
            </div>
        </div>
    );
};

const PollutantBox: React.FC<{ label: string, value: number, unit: string, icon: React.ReactNode }> = ({ label, value, unit, icon }) => {
    const getValueColor = (label: string, value: number) => {
        // Logique pour déterminer la couleur en fonction de la valeur et du type de polluant
        if (label === "PM2.5") {
            if (value <= 12) return "text-emerald-500";
            if (value <= 35) return "text-yellow-500";
            return "text-red-500";
        }
        if (label === "PM10") {
            if (value <= 54) return "text-emerald-500";
            if (value <= 154) return "text-yellow-500";
            return "text-red-500";
        }
        // Couleur par défaut
        return "text-gray-800";
    };

    return (
        <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-100 text-center hover:bg-white hover:shadow transition-all duration-200 flex flex-col items-center justify-center">
            <div className="bg-blue-50 p-2 rounded-full mb-2">
                {icon}
            </div>
            <div className="text-sm font-medium text-gray-600 mb-1">{label}</div>
            <div className={`text-2xl font-bold ${getValueColor(label, value)} mb-1`}>{value}</div>
            <div className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-1 inline-block">{unit}</div>
        </div>
    );
};

const UnderstandingAQI = () => (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 hover:shadow-xl transition-shadow duration-300 relative overflow-hidden border border-gray-100">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 opacity-70 rounded-full"></div>
        <h2 className="text-lg md:text-xl font-semibold mb-6 flex items-center text-gray-800">
            <Info size={22} className="text-blue-600 mr-2.5" />
            Comprendre l'indice AQI
        </h2>
        <ul className="space-y-3 text-sm relative z-10">
            <li className="flex items-center p-3 hover:bg-emerald-50 rounded-xl transition-colors duration-200 border border-transparent hover:border-emerald-100">
                <span className="inline-block w-6 h-6 bg-emerald-500 mr-4 rounded-full shadow-md"></span>
                <div>
                    <span className="font-semibold text-gray-800">0-50 : Excellente</span>
                    <p className="text-xs text-gray-600 mt-1">Qualité de l'air idéale pour tous</p>
                </div>
            </li>
            <li className="flex items-center p-3 hover:bg-green-50 rounded-xl transition-colors duration-200 border border-transparent hover:border-green-100">
                <span className="inline-block w-6 h-6 bg-green-500 mr-4 rounded-full shadow-md"></span>
                <div>
                    <span className="font-semibold text-gray-800">51-100 : Bonne</span>
                    <p className="text-xs text-gray-600 mt-1">Acceptable pour la plupart des gens</p>
                </div>
            </li>
            <li className="flex items-center p-3 hover:bg-yellow-50 rounded-xl transition-colors duration-200 border border-transparent hover:border-yellow-100">
                <span className="inline-block w-6 h-6 bg-yellow-500 mr-4 rounded-full shadow-md"></span>
                <div>
                    <span className="font-semibold text-gray-800">101-150 : Modérée</span>
                    <p className="text-xs text-gray-600 mt-1">Sensibles affectés, précautions nécessaires</p>
                </div>
            </li>
            <li className="flex items-center p-3 hover:bg-orange-50 rounded-xl transition-colors duration-200 border border-transparent hover:border-orange-100">
                <span className="inline-block w-6 h-6 bg-orange-500 mr-4 rounded-full shadow-md"></span>
                <div>
                    <span className="font-semibold text-gray-800">151-200 : Mauvaise</span>
                    <p className="text-xs text-gray-600 mt-1">Effets néfastes pour tous les individus</p>
                </div>
            </li>
            <li className="flex items-center p-3 hover:bg-red-50 rounded-xl transition-colors duration-200 border border-transparent hover:border-red-100">
                <span className="inline-block w-6 h-6 bg-red-500 mr-4 rounded-full shadow-md"></span>
                <div>
                    <span className="font-semibold text-gray-800">201-300 : Très mauvaise</span>
                    <p className="text-xs text-gray-600 mt-1">Alertes sanitaires, éviter l'extérieur</p>
                </div>
            </li>
            <li className="flex items-center p-3 hover:bg-purple-50 rounded-xl transition-colors duration-200 border border-transparent hover:border-purple-100">
                <span className="inline-block w-6 h-6 bg-purple-800 mr-4 rounded-full shadow-md"></span>
                <div>
                    <span className="font-semibold text-gray-800">301+ : Dangereuse</span>
                    <p className="text-xs text-gray-600 mt-1">Conditions d'urgence sanitaire</p>
                </div>
            </li>
        </ul>
    </div>
);

const PollutantInfo = () => (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 hover:shadow-xl transition-shadow duration-300 relative overflow-hidden border border-gray-100">
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-50 opacity-70 rounded-full"></div>
        <h2 className="text-lg md:text-xl font-semibold mb-6 text-gray-800 flex items-center">
            <AlertTriangle size={22} className="text-blue-600 mr-2.5" />
            Informations sur les polluants
        </h2>
        <ul className="space-y-4 text-sm relative z-10">
            <li className="p-4 rounded-xl bg-gradient-to-r from-white to-gray-50 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                <span className="font-semibold text-gray-800 block mb-1 flex items-center">
                    <Droplets size={16} className="text-blue-500 mr-2" />
                    PM2.5
                </span>
                <span className="text-gray-600">Particules fines de diamètre inférieur à 2,5μm qui pénètrent profondément dans les poumons et le sang.</span>
            </li>
            <li className="p-4 rounded-xl bg-gradient-to-r from-white to-gray-50 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                <span className="font-semibold text-gray-800 block mb-1 flex items-center">
                    <Droplets size={16} className="text-blue-500 mr-2" />
                    PM10
                </span>
                <span className="text-gray-600">Particules inhalables de diamètre inférieur à 10μm causant des irritations respiratoires et oculaires.</span>
            </li>
            <li className="p-4 rounded-xl bg-gradient-to-r from-white to-gray-50 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                <span className="font-semibold text-gray-800 block mb-1 flex items-center">
                    <CloudRain size={16} className="text-blue-500 mr-2" />
                    NO₂
                </span>
                <span className="text-gray-600">Dioxyde d'azote, gaz irritant pour les voies respiratoires, principalement émis par la circulation routière.</span>
            </li>
            <li className="p-4 rounded-xl bg-gradient-to-r from-white to-gray-50 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                <span className="font-semibold text-gray-800 block mb-1 flex items-center">
                    <Wind size={16} className="text-blue-500 mr-2" />
                    O₃
                </span>
                <span className="text-gray-600">Ozone troposphérique, composé bénéfique en haute altitude mais nocif à basse altitude et à haute concentration.</span>
            </li>
            <li className="p-4 rounded-xl bg-gradient-to-r from-white to-gray-50 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                <span className="font-semibold text-gray-800 block mb-1 flex items-center">
                    <AlertTriangle size={16} className="text-blue-500 mr-2" />
                    CO
                </span>
                <span className="text-gray-600">Monoxyde de carbone, gaz inodore et incolore, potentiellement mortel à forte concentration, issu de combustions incomplètes.</span>
            </li>
        </ul>
    </div>
);

export default AirQualityPage;