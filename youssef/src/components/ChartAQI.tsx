import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface ChartAQIProps {
    data: any[];
}

const ChartAQI: React.FC<ChartAQIProps> = ({ data }) => {
    // Format l'heure pour affichage (ex: 14:00)
    const formatHour = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Préparer les données pour le graphique
    const formattedData = data.map(item => ({
        hour: formatHour(item.timestamp),
        aqi: item.aqi,
        pm25: item.pm25,
        pm10: item.pm10,
    }));

    return (
        <div className="bg-white rounded-xl shadow-md p-6 md:p-8 mb-8">
            <h2 className="text-lg md:text-xl font-semibold mb-5 flex items-center text-gray-800">
                📈 Historique AQI, PM2.5 et PM10 - 24 dernières heures
            </h2>

            {!data.length ? (
                <div className="text-gray-500 text-center py-10">
                    Pas assez de données pour afficher le graphique.
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={formattedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="aqi" stroke="#3b82f6" strokeWidth={2} name="AQI" />
                        <Line type="monotone" dataKey="pm25" stroke="#10b981" strokeWidth={2} name="PM2.5 (µg/m³)" />
                        <Line type="monotone" dataKey="pm10" stroke="#f59e0b" strokeWidth={2} name="PM10 (µg/m³)" />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

export default ChartAQI;
