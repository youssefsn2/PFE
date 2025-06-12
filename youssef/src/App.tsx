import React, {useRef} from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import AdminDashboard from './pages/admin/AdminDashboard';
import EngineeringDashboard from './pages/user/EngineeringDashboard';
import UserDashboard from './pages/Dashboard';
import ProtectedRoute from './pages/ProtectedRoute';
import LoginRegister from './pages/LoginRegister';
import PreferencesPage from './pages/PreferencesPage';
import WeatherPage from './pages/WeatherPage';
import Employees from './pages/employees';
import AirQualityPage from './pages/AirQualityPage';
import AlertsPage from './pages/AlertsPage';

import MainLayout from './components/MainLayout';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNotification } from './context/NotificationContext';

import useWebSocket from './Hooks/useWebSocket';
import { useAuth } from './context/AuthContext';

const App: React.FC = () => {
    const { user } = useAuth();
    const { addNotification } = useNotification();
    const lastMessageRef = useRef<string | null>(null);

    useWebSocket(user?.id, (msg) => {
        const msgText = `${msg.message}`;
        if (lastMessageRef.current === msgText) return;
        lastMessageRef.current = msgText;

        toast.info(`🔔 ${msgText}`, {
            position: 'top-right',
            autoClose: 5000,
        });

        addNotification(msg);
    });

    return (
        <Router>

            <ToastContainer />
            <Routes>
                <Route path="/login" element={<LoginRegister />} />

                <Route
                    path="/adminDashboard"
                    element={
                        <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                            <MainLayout>
                                <AdminDashboard />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/preferences"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <PreferencesPage />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/air-quality"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <AirQualityPage />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/alerts"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <AlertsPage />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/engineering"
                    element={
                        <ProtectedRoute allowedRoles={['ROLE_INGENIEUR', 'ROLE_TECHNICIEN']}>
                            <MainLayout>
                                <EngineeringDashboard />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <UserDashboard />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/weather"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <WeatherPage />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/employees"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <Employees />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="*"
                    element={<div className="p-8 text-center text-red-600 font-semibold">404 - Page non trouvée</div>}
                />
            </Routes>
        </Router>
    );
};

export default App;
