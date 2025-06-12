import React, { useEffect, useState } from 'react';
import axios from 'axios';


const PreferencesPage: React.FC = () => {
    // Existing preferences states
    const [uniteTemperature, setUniteTemperature] = useState('C');
    const [notificationsActives, setNotificationsActives] = useState(true);
    const [seuilAqi, setSeuilAqi] = useState(100);
    const [seuilPm10, setSeuilPm10] = useState(50);
    const [seuilPm25, setSeuilPm25] = useState(25);
    const [seuilNo2, setSeuilNo2] = useState(200);
    const [seuilO3, setSeuilO3] = useState(180);
    const [seuilCo, setSeuilCo] = useState(10);

    // New user info states
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [activeTab, setActiveTab] = useState('infos'); // 'infos' or 'preferences'

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    useEffect(() => {
        const token = localStorage.getItem('token');

        // Fetch user preferences
        axios
            .get('http://localhost:8080/user/preferences', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((res) => {
                const data = res.data;
                setUniteTemperature(data.uniteTemperature || 'C');
                setNotificationsActives(data.notificationsActives ?? true);
                setSeuilAqi(data.seuilAqi || 100);
                setSeuilPm10(data.seuilPm10 || 50);
                setSeuilPm25(data.seuilPm25 || 25);
                setSeuilNo2(data.seuilNo2 || 200);
                setSeuilO3(data.seuilO3 || 180);
                setSeuilCo(data.seuilCo || 10);
            })
            .catch((error) => {
                console.error("Erreur lors du chargement des préférences:", error);
                setSuccessMessage('❌ Erreur lors du chargement des préférences');
            });

        // Fetch user info
        axios
            .get('http://localhost:8080/user/me', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((res) => {
                const userData = res.data;
                setFirstName(userData.firstName || '');
                setLastName(userData.lastName || '');
                setEmail(userData.email || '');
            })
            .catch((error) => {
                console.error("Erreur lors du chargement des informations utilisateur:", error);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSavePreferences = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            await axios.put(
                'http://localhost:8080/user/preferences',
                {
                    uniteTemperature,
                    notificationsActives,
                    seuilAqi,
                    seuilPm10,
                    seuilPm25,
                    seuilNo2,
                    seuilO3,
                    seuilCo,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuccessMessage('✅ Préférences enregistrées avec succès !');

            // Auto-hide message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setSuccessMessage('❌ Erreur lors de la sauvegarde des préférences');
            setTimeout(() => setSuccessMessage(''), 3000);
        }
    };

    const handleUpdateUserInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        // Validation for password matching
        if (newPassword && newPassword !== confirmPassword) {
            setSuccessMessage('❌ Les mots de passe ne correspondent pas');
            setTimeout(() => setSuccessMessage(''), 3000);
            return;
        }

        const payload: any = {
            firstName,
            lastName
        };

        // Only include password fields if the user is attempting to change password
        if (newPassword && currentPassword) {
            payload.currentPassword = currentPassword;
            payload.newPassword = newPassword;
        }

        try {
            await axios.put(
                'http://localhost:8080/user/update-info',
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuccessMessage('✅ Informations personnelles mises à jour !');

            // Reset password fields after successful update
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            // Auto-hide message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: any) {
            const errorMessage = err.response?.data || 'Erreur lors de la mise à jour';
            setSuccessMessage(`❌ ${errorMessage}`);
            setTimeout(() => setSuccessMessage(''), 3000);
        }
    };

    const TabButton = ({ id, label, icon }: { id: string, label: string, icon: string }) => (
        <button
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center py-3 px-5 transition-all rounded-t-lg ${
                activeTab === id
                    ? 'bg-white text-[#4F9055] font-medium shadow-sm border-t border-l border-r border-gray-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
        >
            <span className="mr-2">{icon}</span>
            {label}
        </button>
    );

    // Show spinner when loading
    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-100">
                <div className="flex-1 flex flex-col">
                    <main className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 border-4 border-[#67AE6E] border-t-transparent rounded-full animate-spin"></div>
                            <span className="mt-4 text-gray-600">Chargement...</span>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            <div className="flex-1 flex flex-col">
                <main className="p-6">
                    <div className="max-w-4xl mx-auto w-full">
                        <h1 className="text-3xl font-bold mb-8 text-[#4F9055] border-b pb-4">
                            Paramètres du compte
                        </h1>

                        {/* Tab navigation */}
                        <div className="flex space-x-1 mb-4">
                            <TabButton id="infos" label="Informations personnelles" icon="👤" />
                            <TabButton id="preferences" label="Préférences de l'application" icon="⚙️" />
                        </div>

                        {/* User Info Form */}
                        {activeTab === 'infos' && (
                            <form onSubmit={handleUpdateUserInfo} className="space-y-6">
                                <div className="bg-white p-8 rounded-lg shadow-md transition-all hover:shadow-lg border border-gray-100">
                                    <h3 className="text-xl font-semibold text-gray-700 mb-6 pb-2 border-b">
                                        Informations personnelles
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-700">
                                                Prénom
                                            </label>
                                            <input
                                                type="text"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all"
                                                placeholder="Votre prénom"
                                            />
                                        </div>

                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-700">
                                                Nom
                                            </label>
                                            <input
                                                type="text"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all"
                                                placeholder="Votre nom"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <label className="block mb-2 text-sm font-medium text-gray-700">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            disabled
                                            className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-md text-gray-500"
                                            placeholder="Votre email"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-lg shadow-md transition-all hover:shadow-lg border border-gray-100">
                                    <h3 className="text-xl font-semibold text-gray-700 mb-6 pb-2 border-b">
                                        Changer de mot de passe
                                    </h3>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-700">
                                                Mot de passe actuel
                                            </label>
                                            <input
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all"
                                                placeholder="Votre mot de passe actuel"
                                            />
                                        </div>

                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-700">
                                                Nouveau mot de passe
                                            </label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all"
                                                placeholder="Nouveau mot de passe"
                                            />
                                        </div>

                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-700">
                                                Confirmer le nouveau mot de passe
                                            </label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all"
                                                placeholder="Confirmer le nouveau mot de passe"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        className="bg-[#67AE6E] hover:bg-[#579B60] text-white font-semibold px-8 py-3 rounded-md transition-all shadow-md hover:shadow-lg"
                                    >
                                        Enregistrer les modifications
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Preferences Form */}
                        {activeTab === 'preferences' && (
                            <form onSubmit={handleSavePreferences} className="space-y-6">
                                <div className="bg-white p-8 rounded-lg shadow-md transition-all hover:shadow-lg border border-gray-100">
                                    <h3 className="text-xl font-semibold text-gray-700 mb-6 pb-2 border-b">
                                        Paramètres généraux
                                    </h3>

                                    <div className="space-y-8">
                                        <div>
                                            <label className="block mb-3 text-sm font-medium text-gray-700">
                                                Unité de température
                                            </label>
                                            <div className="flex space-x-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setUniteTemperature('C')}
                                                    className={`flex-1 px-4 py-3 rounded-md border transition-all ${
                                                        uniteTemperature === 'C'
                                                            ? 'bg-[#67AE6E] text-white border-[#67AE6E] shadow-md'
                                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    Celsius (°C)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setUniteTemperature('F')}
                                                    className={`flex-1 px-4 py-3 rounded-md border transition-all ${
                                                        uniteTemperature === 'F'
                                                            ? 'bg-[#67AE6E] text-white border-[#67AE6E] shadow-md'
                                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    Fahrenheit (°F)
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            <div className="relative inline-block w-14 h-7 mr-3">
                                                <input
                                                    type="checkbox"
                                                    checked={notificationsActives}
                                                    onChange={(e) => setNotificationsActives(e.target.checked)}
                                                    className="opacity-0 w-0 h-0"
                                                    id="notifications-toggle"
                                                />
                                                <label
                                                    htmlFor="notifications-toggle"
                                                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-all duration-300 ${
                                                        notificationsActives ? 'bg-[#67AE6E]' : 'bg-gray-300'
                                                    }`}
                                                >
                                                    <span
                                                        className={`absolute h-5 w-5 left-1 top-1 bg-white rounded-full transition-transform duration-300 ${
                                                            notificationsActives ? 'translate-x-7' : 'translate-x-0'
                                                        }`}
                                                    ></span>
                                                </label>
                                            </div>
                                            <label htmlFor="notifications-toggle" className="font-medium text-gray-700 cursor-pointer">
                                                Activer les notifications
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-lg shadow-md transition-all hover:shadow-lg border border-gray-100">
                                    <h3 className="text-xl font-semibold text-gray-700 mb-6 pb-2 border-b">
                                        Seuils de notification
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {[
                                            { label: 'Seuil AQI', value: seuilAqi, setter: setSeuilAqi, info: 'Indice de qualité de l\'air' },
                                            { label: 'Seuil PM10', value: seuilPm10, setter: setSeuilPm10, info: 'Particules ≤ 10μm' },
                                            { label: 'Seuil PM2.5', value: seuilPm25, setter: setSeuilPm25, info: 'Particules fines ≤ 2.5μm' },
                                            { label: 'Seuil NO2', value: seuilNo2, setter: setSeuilNo2, info: 'Dioxyde d\'azote' },
                                            { label: 'Seuil O3', value: seuilO3, setter: setSeuilO3, info: 'Ozone' },
                                            { label: 'Seuil CO', value: seuilCo, setter: setSeuilCo, info: 'Monoxyde de carbone' },
                                        ].map((item) => (
                                            <div key={item.label}>
                                                <div className="flex justify-between mb-2">
                                                    <label className="text-sm font-medium text-gray-700">
                                                        {item.label}
                                                    </label>
                                                    <span className="text-xs text-gray-500 italic">{item.info}</span>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={item.value}
                                                        onChange={(e) => item.setter(Number(e.target.value))}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all"
                                                    />
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col space-y-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => item.setter(item.value + 1)}
                                                            className="text-gray-400 hover:text-[#67AE6E] focus:outline-none"
                                                        >
                                                            ▲
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => item.setter(Math.max(0, item.value - 1))}
                                                            className="text-gray-400 hover:text-[#67AE6E] focus:outline-none"
                                                        >
                                                            ▼
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        className="bg-[#67AE6E] hover:bg-[#579B60] text-white font-semibold px-8 py-3 rounded-md transition-all shadow-md hover:shadow-lg"
                                    >
                                        Enregistrer les préférences
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Success/Error Message Toast */}
                        {successMessage && (
                            <div
                                className={`fixed bottom-6 right-6 py-4 px-6 rounded-lg shadow-xl ${
                                    successMessage.includes('✅')
                                        ? 'bg-green-50 border-l-4 border-green-500 text-green-700'
                                        : 'bg-red-50 border-l-4 border-red-500 text-red-700'
                                } animate-fade-in-up transition-all duration-300 flex items-center`}
                            >
                                <span className="mr-2 text-xl">{successMessage.includes('✅') ? '✅' : '❌'}</span>
                                <span>{successMessage.replace(/^[✅❌]\s*/, '')}</span>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default PreferencesPage;