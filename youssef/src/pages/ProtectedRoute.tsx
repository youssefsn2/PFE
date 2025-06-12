import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactElement;
    allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { user, token } = useAuth();

    // 🚫 Si l'utilisateur n'est pas connecté → redirection vers /login
    if (!user || !token) {
        return <Navigate to="/login" replace />;
    }

    // ❌ Si l'utilisateur connecté n'a pas le bon rôle
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // ✅ Sinon, on autorise l'accès à la page protégée
    return children;
};

export default ProtectedRoute;
