import React from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';



const AdminDashboard: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-gray-100">
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <div className="flex flex-col flex-1 w-full">
                <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                <main className="flex-1 overflow-y-auto p-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Espace Administrateur</h1>
                    <p className="text-gray-600">Gestion des utilisateurs, alertes et configuration système.</p>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
