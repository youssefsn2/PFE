import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    Settings as SettingsIcon,
    CloudSun,
    Wind,
    Users,
    Bell,
    BarChart2,
    LogOut,
    X,
    Menu,
    User,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Types
type SidebarProps = {
    isOpen: boolean;
    toggleSidebar: () => void;
};

type NavigationItem = {
    to: string;
    icon: React.ReactNode;
    label: string;
    adminOnly?: boolean;
};

type TooltipType = 'user' | 'logout' | string;

// Constants
const MOBILE_BREAKPOINT = 1024;
const SIDEBAR_WIDTH = {
    expanded: 'lg:w-72',
    collapsed: 'lg:w-20',
    mobile: 'w-80'
};

const NAVIGATION_ITEMS: NavigationItem[] = [
    { to: '/dashboard', icon: <BarChart2 size={20} />, label: 'Tableau de bord' },
    { to: '/weather', icon: <CloudSun size={20} />, label: 'Météo' },
    { to: '/air-quality', icon: <Wind size={20} />, label: 'Qualité de l\'air' },
];

const SETTINGS_ITEMS: NavigationItem[] = [
    { to: '/alerts', icon: <Bell size={20} />, label: 'Alertes' },
    { to: '/employees', icon: <Users size={20} />, label: 'Employés', adminOnly: true },
];

// Custom hooks
const useResponsiveLayout = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return { isMobile };
};

const useTooltip = () => {
    const [showTooltip, setShowTooltip] = useState<TooltipType>('');
    const location = useLocation();

    // Reset tooltip when route changes
    useEffect(() => {
        setShowTooltip('');
    }, [location.pathname]);

    const showTooltipHandler = useCallback((tooltip: TooltipType) => {
        setShowTooltip(tooltip);
    }, []);

    const hideTooltipHandler = useCallback(() => {
        setShowTooltip('');
    }, []);

    return {
        showTooltip,
        showTooltipHandler,
        hideTooltipHandler
    };
};

// Main Sidebar Component
const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const { isMobile } = useResponsiveLayout();
    const { showTooltip, showTooltipHandler, hideTooltipHandler } = useTooltip();

    // Memoized user initials
    const userInitials = useMemo(() => {
        if (user?.name) {
            const names = user.name.split(' ');
            if (names.length >= 2) {
                return `${names[0][0]}${names[1][0]}`.toUpperCase();
            }
            return user.name[0].toUpperCase();
        }
        return user?.email?.[0].toUpperCase() || 'U';
    }, [user?.name, user?.email]);

    // Handle logout with confirmation
    const handleLogout = useCallback(() => {
        if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            logout();
        }
    }, [logout]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Escape' && isOpen && isMobile) {
            toggleSidebar();
        }
    }, [isOpen, isMobile, toggleSidebar]);

    // Toggle collapsed state (desktop only)
    const toggleCollapsed = useCallback(() => {
        if (!isMobile) {
            setCollapsed(prev => !prev);
        }
    }, [isMobile]);

    // Filter navigation items based on user role
    const filteredSettingsItems = useMemo(() => {
        return SETTINGS_ITEMS.filter(item =>
            !item.adminOnly || user?.role === 'ROLE_ADMIN'
        );
    }, [user?.role]);

    return (
        <>
            {/* Mobile Overlay */}
            <MobileOverlay isOpen={isOpen} onClose={toggleSidebar} />

            {/* Sidebar Container */}
            <aside
                className={`
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                    ${collapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded}
                    ${SIDEBAR_WIDTH.mobile}
                    fixed inset-y-0 left-0 z-40 bg-gradient-to-b from-[#4F9055] via-[#67AE6E] to-[#67AE6E]/95
                    transition-all duration-300 ease-out lg:translate-x-0 
                    lg:static lg:inset-auto shadow-2xl backdrop-blur-sm
                    border-r border-[#579B60]/30 flex flex-col overflow-hidden
                `}
                onKeyDown={handleKeyDown}
                role="navigation"
                aria-label="Navigation principale"
            >
                {/* Header */}
                <SidebarHeader
                    collapsed={collapsed}
                    onToggleCollapsed={toggleCollapsed}
                    onCloseMobile={toggleSidebar}
                    isMobile={isMobile}
                />

                {/* User Info */}
                <UserInfo
                    user={user}
                    userInitials={userInitials}
                    collapsed={collapsed}
                    showTooltip={showTooltip}
                    onShowTooltip={showTooltipHandler}
                    onHideTooltip={hideTooltipHandler}
                    onLogout={handleLogout}
                />

                {/* Navigation */}
                <Navigation
                    navigationItems={NAVIGATION_ITEMS}
                    settingsItems={filteredSettingsItems}
                    collapsed={collapsed}
                />

                {/* Footer Actions */}
                <SidebarFooter
                    collapsed={collapsed}
                    isMobile={isMobile}
                    showTooltip={showTooltip}
                    onShowTooltip={showTooltipHandler}
                    onHideTooltip={hideTooltipHandler}
                    onLogout={handleLogout}
                />
            </aside>

            {/* Mobile Toggle Button */}
            <MobileToggleButton onToggle={toggleSidebar} />
        </>
    );
};
const formatRole = (role: string | undefined): string => {
    if (!role) return '';

    const roleMap: Record<string, string> = {
        'ROLE_ADMIN': 'Administrateur',
        'ROLE_INGENIEUR': 'Ingénieur',
        'ROLE_TECHNICIEN': 'Technicien',
    };

    return roleMap[role] || 'Utilisateur'; // Valeur par défaut
};

// Sub-components
const MobileOverlay: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
            onClick={onClose}
            role="button"
            tabIndex={0}
            aria-label="Fermer le menu"
            onKeyDown={(e) => e.key === 'Enter' && onClose()}
        />
    );
};

const SidebarHeader: React.FC<{
    collapsed: boolean;
    onToggleCollapsed: () => void;
    onCloseMobile: () => void;
    isMobile: boolean;
}> = ({ collapsed, onToggleCollapsed, onCloseMobile, isMobile }) => (
    <header className="flex items-center justify-between p-5 bg-white/10 border-b border-[#579B60]/40 backdrop-blur-sm">
        <div className="flex items-center gap-3 group">
            <div className="bg-white/20 p-2 rounded-lg shadow-lg">
                <CloudSun
                    size={22}
                    className="text-white group-hover:rotate-12 transition-transform duration-300"
                    aria-hidden="true"
                />
            </div>
            {!collapsed && (
                <h1 className="text-xl font-bold tracking-wider text-white">
                    OCP Météo
                </h1>
            )}
        </div>

        <div className="flex items-center">
            {!isMobile && (
                <button
                    onClick={onToggleCollapsed}
                    className="text-white/80 hover:text-white transition-all p-2 hover:bg-white/10 rounded-lg active:scale-95"
                    aria-label={collapsed ? "Étendre la barre latérale" : "Réduire la barre latérale"}
                >
                    <ChevronRight
                        size={20}
                        className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                    />
                </button>
            )}

            {isMobile && (
                <button
                    onClick={onCloseMobile}
                    className="text-white/80 hover:text-white transition-all p-2 hover:bg-white/10 rounded-lg active:scale-95"
                    aria-label="Fermer le menu"
                >
                    <X size={22} aria-hidden="true" />
                </button>
            )}
        </div>
    </header>
);

const UserInfo: React.FC<{
    user: any;
    userInitials: string;
    collapsed: boolean;
    showTooltip: TooltipType;
    onShowTooltip: (tooltip: TooltipType) => void;
    onHideTooltip: () => void;
    onLogout: () => void;
}> = ({ user, userInitials, collapsed, showTooltip, onShowTooltip, onHideTooltip, onLogout }) => (
    <div className={`p-5 border-b border-[#579B60]/30 ${collapsed ? 'flex justify-center' : 'space-y-3'} bg-white/10 backdrop-blur-sm`}>
        {collapsed ? (
            <div
                className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-medium shadow-lg border border-white/20 cursor-pointer"
                onMouseEnter={() => onShowTooltip('user')}
                onMouseLeave={onHideTooltip}
                role="button"
                tabIndex={0}
                aria-label={`Profil utilisateur: ${user?.name || user?.email}`}
            >
                {userInitials}
                <Tooltip
                    show={showTooltip === 'user'}
                    content={
                        <div>
                            <p className="text-sm font-semibold">{user?.name || user?.email}</p>
                            <p className="text-xs text-gray-500 mt-1">{user?.role}</p>
                        </div>
                    }
                />
            </div>
        ) : (
            <>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-medium shadow-lg border border-white/20">
                        {userInitials}
                    </div>
                    <div>
                        <p className="text-base font-semibold tracking-wide text-white">
                            {user?.name || user?.email}
                        </p>
                        <p className="text-xs text-[#D8EFDA]/90 font-medium uppercase tracking-wider">
                            {formatRole(user?.role)}
                        </p>
                    </div>
                </div>
                <div className="flex w-full gap-2">
                <NavLink
                        to="/preferences"
                        className="flex items-center justify-center gap-2 py-2 flex-1 rounded-lg
                        bg-white/10 hover:bg-white/20 text-white/90 hover:text-white
                        transition-all duration-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
                        aria-label="Accéder aux préférences"
                    >
                        <User size={16} aria-hidden="true" />
                        <span>Préférences</span>
                    </NavLink>
                    <button
                        onClick={onLogout}
                        className="flex items-center justify-center gap-2 py-2 flex-1 rounded-lg
                        bg-white/10 hover:bg-[#E3655B]/80 text-white/90 hover:text-white
                        transition-all duration-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
                        aria-label="Se déconnecter"
                    >
                        <LogOut size={16} aria-hidden="true" />
                        <span>Déconnexion</span>
                    </button>
                </div>
            </>
        )}
    </div>
);

const Navigation: React.FC<{
    navigationItems: NavigationItem[];
    settingsItems: NavigationItem[];
    collapsed: boolean;
}> = ({ navigationItems, settingsItems, collapsed }) => (
    <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-[#579B60]/50" role="navigation">
        <NavigationSection
            title={collapsed ? 'Menu' : 'Menu principal'}
            items={navigationItems}
            collapsed={collapsed}
        />

        <NavigationSection
            title={collapsed ? 'Param.' : 'Paramètres'}
            items={settingsItems}
            collapsed={collapsed}
        />
    </nav>
);

const NavigationSection: React.FC<{
    title: string;
    items: NavigationItem[];
    collapsed: boolean;
}> = ({ title, items, collapsed }) => (
    <div className="mb-4">
        <p className={`text-xs uppercase tracking-wider text-white/50 font-medium mb-2 px-3 ${collapsed ? 'text-center' : ''}`}>
            {title}
        </p>
        {items.map((item) => (
            <SidebarLink
                key={item.to}
                to={item.to}
                icon={item.icon}
                collapsed={collapsed}
                label={item.label}
            >
                {item.label}
            </SidebarLink>
        ))}
    </div>
);

const SidebarFooter: React.FC<{
    collapsed: boolean;
    isMobile: boolean;
    showTooltip: TooltipType;
    onShowTooltip: (tooltip: TooltipType) => void;
    onHideTooltip: () => void;
    onLogout: () => void;
}> = ({ collapsed, isMobile, showTooltip, onShowTooltip, onHideTooltip, onLogout }) => {
    if (collapsed && !isMobile) {
        return (
            <div className="p-4 border-t border-[#579B60]/30 bg-white/5 backdrop-blur-sm">
                <button
                    onClick={onLogout}
                    onMouseEnter={() => onShowTooltip('logout')}
                    onMouseLeave={onHideTooltip}
                    className="flex items-center justify-center p-3 w-full rounded-lg
                    transition-all duration-200 hover:bg-[#E3655B]/80 group
                    bg-white/10 hover:shadow-lg active:scale-95 text-white/90 hover:text-white
                    relative focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label="Se déconnecter"
                >
                    <LogOut size={20} className="group-hover:scale-110 transition-transform duration-300" aria-hidden="true" />
                    <Tooltip
                        show={showTooltip === 'logout'}
                        content={<p className="text-sm whitespace-nowrap">Se déconnecter</p>}
                    />
                </button>
            </div>
        );
    }

    if (isMobile) {
        return (
            <div className="p-4 border-t border-[#579B60]/30 bg-white/5 backdrop-blur-sm">
                <button
                    onClick={onLogout}
                    className="flex items-center justify-center gap-3 p-3.5 w-full rounded-xl
                    transition-all duration-200 hover:bg-[#E3655B]/80 group
                    bg-white/10 hover:shadow-lg active:scale-95 text-white/90 hover:text-white
                    focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label="Se déconnecter"
                >
                    <LogOut size={20} className="group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true" />
                    <span className="font-medium tracking-wide">Se déconnecter</span>
                </button>
            </div>
        );
    }

    return null;
};

const SidebarLink: React.FC<{
    to: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    collapsed: boolean;
    label: string;
}> = ({ to, icon, children, collapsed, label }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-3.5 rounded-xl transition-all duration-200
                ${isActive
                    ? 'bg-[#579B60] text-white shadow-lg shadow-[#579B60]/30'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                } group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-white/50`
            }
            onMouseEnter={() => collapsed && setShowTooltip(true)}
            onMouseLeave={() => collapsed && setShowTooltip(false)}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
        >
            <div className={`relative z-10 ${isActive ? 'bg-white/20' : 'bg-transparent'} ${isActive ? 'p-1.5' : 'p-1'} rounded-lg transition-all duration-300`}>
                {icon}
            </div>

            {!collapsed && (
                <span className="font-medium tracking-wide relative z-10">{children}</span>
            )}

            {/* Active indicator */}
            {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
            )}

            {/* Hover effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

            {/* Tooltip */}
            <Tooltip
                show={collapsed && showTooltip}
                content={<p className="text-sm whitespace-nowrap">{children}</p>}
            />
        </NavLink>
    );
};

const MobileToggleButton: React.FC<{ onToggle: () => void }> = ({ onToggle }) => (
    <button
        onClick={onToggle}
        className="fixed bottom-6 left-6 z-20 lg:hidden bg-[#67AE6E] text-white p-3.5 rounded-full shadow-lg hover:bg-[#579B60] transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Ouvrir le menu de navigation"
    >
        <Menu size={24} aria-hidden="true" />
    </button>
);

const Tooltip: React.FC<{ show: boolean; content: React.ReactNode }> = ({ show, content }) => {
    if (!show) return null;

    return (
        <div className="absolute left-16 bg-white/90 backdrop-blur-md text-gray-800 p-2 rounded-lg shadow-xl z-50 pointer-events-none">
            {content}
        </div>
    );
};

export default Sidebar;