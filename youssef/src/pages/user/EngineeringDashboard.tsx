import React, { useState } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';

const EngineeringDashboard: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user } = useAuth();

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gray-100">
            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            {/* Contenu principal */}
            <div className="flex flex-col flex-1 w-full">
                {/* Header */}
                <Header toggleSidebar={toggleSidebar} />

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                        {user?.role === 'ROLE_INGENIEUR'
                            ? 'Espace Ingénieur'
                            : user?.role === 'ROLE_TECHNICIEN'
                                ? 'Espace Technicien'
                                : 'Espace Utilisateur'}
                    </h1>
                    <p className="text-gray-600">Bienvenue sur votre espace de travail OCP.</p>

                    {/* ➕ Tu peux ajouter ici les composants météo, capteurs, cartes, etc. */}
                </main>
            </div>
        </div>
    );
};

export default EngineeringDashboard;
