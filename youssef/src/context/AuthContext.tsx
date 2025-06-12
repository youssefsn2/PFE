import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    logout: () => void;
    refreshAuth: () => void; // 👈 ajoute ceci

}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    logout: () => {},
    refreshAuth: () => {}, // 👈 ajoute cette ligne ici aussi

});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);


    useEffect(() => {
        const token = localStorage.getItem('token');
        const id = localStorage.getItem('id');
        const email = localStorage.getItem('email');
        const role = localStorage.getItem('role');
        const name = localStorage.getItem('name');

        if (token && id && email && role) {
            setToken(token);
            setUser({
                id,
                name: name || email.split('@')[0],
                email,
                role,
            });
        }
    }, []);

    const logout = () => {
        localStorage.clear();
        setUser(null);
        setToken(null);
        window.location.href = '/login';
    };


    const refreshAuth = () => {
        const token = localStorage.getItem('token');
        const id = localStorage.getItem('id');
        const email = localStorage.getItem('email');
        const role = localStorage.getItem('role');
        const name = localStorage.getItem('name');

        if (token && id && email && role) {
            setToken(token);
            setUser({
                id,
                name: name || email.split('@')[0],
                email,
                role,
            });
        }
    };


    return (
        <AuthContext.Provider value={{ user, token, logout,refreshAuth }}>
            {children}

        </AuthContext.Provider>

    );
};



export const useAuth = () => useContext(AuthContext);
