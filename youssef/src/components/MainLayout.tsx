import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface Props {
    children: React.ReactNode;
}

const MainLayout: React.FC<Props> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
            <div className="flex flex-col flex-1">
                <Header toggleSidebar={toggleSidebar} />
                <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
