import React, { useState, useEffect } from 'react';
import { LogIn, UserPlus, CloudSun } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext'; // adapte le chemin si besoin



const LoginRegister: React.FC = () => {
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [email, setEmail] = useState('');
    const [motDePasse, setMotDePasse] = useState('');
    const [prenom, setPrenom] = useState('');
    const [nom, setNom] = useState('');
    const [role, setRole] = useState('ROLE_INGENIEUR');
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [erreur, setErreur] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { refreshAuth } = useAuth(); // ✅ pour rafraîchir le contexte après login


    useEffect(() => {
        if (isRegisterMode && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLatitude(position.coords.latitude);
                    setLongitude(position.coords.longitude);
                },
                (error) => {
                    console.error('Erreur de géolocalisation :', error);
                    setLatitude(0);
                    setLongitude(0);
                }
            );
        }
    }, [isRegisterMode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErreur('');
        setIsLoading(true);

        try {
            if (isRegisterMode) {
                const res = await axios.post('http://localhost:8080/auth/register', {
                    firstName: prenom,
                    lastName: nom,
                    email,
                    password: motDePasse,
                    latitude: latitude ?? 0,
                    longitude: longitude ?? 0,
                    role: { name: role },
                });

                toast.success('✅ Compte créé avec succès ! Connecte-toi maintenant');
                setIsRegisterMode(false);
            } else {
                const res = await axios.post('http://localhost:8080/auth/login', {
                    email,
                    password: motDePasse,
                });

                const { token, role, name, id } = res.data; // ✅ Ajoute `id`
                localStorage.setItem('token', token);
                localStorage.setItem('email', email);
                localStorage.setItem('role', role);
                localStorage.setItem('name', name);
                localStorage.setItem('id', id); // ✅ Ajoute ceci
                refreshAuth(); // ✅ Mets à jour le contexte ici

                switch (role) {
                    case 'ROLE_ADMIN':
                        navigate('/dashboard');
                        break;
                    case 'ROLE_INGENIEUR':
                    case 'ROLE_TECHNICIEN':
                        navigate('/dashboard');
                        break;
                    default:
                        navigate('/dashboard');
                        break;
                }
            }
        } catch (err: any) {
            setErreur(err.response?.data || 'Erreur lors du traitement.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4F9055] to-[#67AE6E] px-6">
            <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl space-y-6">
                <div className="text-center">
                    <CloudSun size={52} style={{ color: '#67AE6E' }} />
                    <h2 className="text-3xl font-bold text-gray-800 mt-2">
                        {isRegisterMode ? 'Créer un compte' : 'Connexion'}
                    </h2>
                    <p className="text-gray-600">
                        {isRegisterMode
                            ? 'Remplis les champs pour t’inscrire'
                            : 'Connecte-toi à ton espace personnel'}
                    </p>
                </div>

                {erreur && <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm">{erreur}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegisterMode && (
                        <>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Prénom</label>
                                <input
                                    type="text"
                                    value={prenom}
                                    onChange={(e) => setPrenom(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border rounded-lg shadow-sm"
                                    placeholder="Prénom"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Nom</label>
                                <input
                                    type="text"
                                    value={nom}
                                    onChange={(e) => setNom(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border rounded-lg shadow-sm"
                                    placeholder="Nom"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Rôle</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg shadow-sm"
                                >
                                    <option value="ROLE_INGENIEUR">Ingénieur</option>
                                    <option value="ROLE_TECHNICIEN">Technicien</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Latitude</label>
                                <input
                                    type="text"
                                    value={latitude !== null ? latitude.toFixed(6) : 'Chargement...'}
                                    readOnly
                                    className="w-full px-4 py-2 border rounded-lg shadow-sm bg-gray-100 text-gray-700"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Longitude</label>
                                <input
                                    type="text"
                                    value={longitude !== null ? longitude.toFixed(6) : 'Chargement...'}
                                    readOnly
                                    className="w-full px-4 py-2 border rounded-lg shadow-sm bg-gray-100 text-gray-700"
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm text-gray-700 mb-1">Adresse email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 border rounded-lg shadow-sm"
                            placeholder="exemple@ocp.ma"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-700 mb-1">Mot de passe</label>
                        <input
                            type="password"
                            value={motDePasse}
                            onChange={(e) => setMotDePasse(e.target.value)}
                            required
                            className="w-full px-4 py-2 border rounded-lg shadow-sm"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 bg-[#67AE6E] hover:bg-[#579B60] text-white py-2 px-4 rounded-lg font-semibold transition"
                    >
                        {isRegisterMode ? <UserPlus size={18} /> : <LogIn size={18} />}
                        {isLoading
                            ? isRegisterMode
                                ? 'Création...'
                                : 'Connexion...'
                            : isRegisterMode
                                ? 'Créer un compte'
                                : 'Se connecter'}
                    </button>
                </form>

                <div className="text-center text-sm text-gray-600">
                    {isRegisterMode ? (
                        <>
                            Déjà un compte ?{' '}
                            <button
                                onClick={() => setIsRegisterMode(false)}
                                className="text-[#67AE6E] hover:underline font-medium"
                            >
                                Se connecter
                            </button>
                        </>
                    ) : (
                        <>
                            Pas encore de compte ?{' '}
                            <button
                                onClick={() => setIsRegisterMode(true)}
                                className="text-[#67AE6E] hover:underline font-medium"
                            >
                                Crée un compte ici
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginRegister;
