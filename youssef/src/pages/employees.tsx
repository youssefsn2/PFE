import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Trash2,
    PencilLine,
    Eye,
    PlusCircle,
    Search,
    Filter,
    X,
    Check,
    UserPlus,
    AlertTriangle,
    Loader2
} from 'lucide-react';


const Employees: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editUserId, setEditUserId] = useState<number | null>(null);
    const [editedUser, setEditedUser] = useState<any>({});
    const [newUser, setNewUser] = useState<any>({ firstName: '', lastName: '', email: '', password: '', role: { name: 'ROLE_USER' } });
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [showAddForm, setShowAddForm] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('http://localhost:8080/admin/users', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setUsers(res.data);
        } catch (err) {
            console.error(err);
            setError("Erreur lors du chargement des utilisateurs.");
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (id: number) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;
        try {
            await axios.delete(`http://localhost:8080/admin/users/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setUsers(users.filter(user => user.id !== id));
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la suppression.");
        }
    };

    const handleEditClick = (user: any) => {
        setEditUserId(user.id);
        const { latitude, longitude, ...userData } = user;
        setEditedUser({ ...userData, password: '' });
    };

    const handleEditChange = (field: string, value: any) => {
        setEditedUser({ ...editedUser, [field]: value });
    };

    const handleSaveEdit = async () => {
        try {
            const payload = { ...editedUser };
            if (!payload.password) delete payload.password;
            if (payload.role && typeof payload.role === 'string') {
                payload.role = { name: payload.role };
            }
            const originalUser = users.find(user => user.id === editUserId);
            if (originalUser) {
                payload.latitude = originalUser.latitude;
                payload.longitude = originalUser.longitude;
            }
            await axios.put(`http://localhost:8080/admin/users/${editUserId}`, payload, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
            });
            setEditUserId(null);
            fetchUsers();
        } catch (err: any) {
            console.error("Erreur détaillée:", err.response?.data || err.message);
            alert("Erreur lors de la mise à jour: " + (err.response?.data?.message || err.message));
        }
    };

    const cancelEdit = () => {
        setEditUserId(null);
    };

    const handleNewUserChange = (field: string, value: any) => {
        if (field === 'role') {
            setNewUser({ ...newUser, role: { name: value } });
        } else {
            setNewUser({ ...newUser, [field]: value });
        }
    };

    const handleAddUser = async () => {
        try {
            const payload = { ...newUser };
            await axios.post(`http://localhost:8080/admin/users`, payload, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
            });
            setNewUser({ firstName: '', lastName: '', email: '', password: '', role: { name: 'ROLE_ADMIN' } });
            setShowAddForm(false);
            fetchUsers();
        } catch (err: any) {
            console.error("Erreur lors de l'ajout:", err.response?.data || err.message);
            alert("Erreur lors de l'ajout: " + (err.response?.data?.message || err.message));
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = searchTerm === '' ||
            user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter =
            activeFilter === 'all' ||
            (activeFilter === 'admin' && user.role?.name === 'ROLE_ADMIN') ||
            (activeFilter === 'ingenieur' && user.role?.name === 'ROLE_INGENIEUR') ||
            (activeFilter === 'technicien' && user.role?.name === 'ROLE_TECHNICIEN');

        return matchesSearch && matchesFilter;
    });

    const getRoleColor = (roleName: string) => {
        switch(roleName) {
            case 'ROLE_ADMIN':
                return 'bg-indigo-100 text-indigo-800';
            case 'ROLE_INGENIEUR':
                return 'bg-cyan-100 text-cyan-800';
            case 'ROLE_TECHNICIEN':
                return 'bg-emerald-100 text-emerald-800';
            default:
                return 'bg-slate-100 text-slate-800';
        }
    };

    const getRoleBadge = (roleName: string) => {
        const className = `px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(roleName)}`;
        const label = roleName === 'ROLE_ADMIN' ? 'Admin' :
            roleName === 'ROLE_INGENIEUR' ? 'Ingénieur' :
                roleName === 'ROLE_TECHNICIEN' ? 'Technicien' :
                    roleName;
        return <span className={className}>{label}</span>;
    };

    const getFilterButtonClass = (filterName: string) => {
        return activeFilter === filterName
            ? 'bg-indigo-600 text-white'
            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200';
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <div className="flex flex-col flex-1 w-full">
                <main className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <h1 className="text-2xl font-bold text-slate-800">Gestion des employés</h1>
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow transition duration-150 font-medium text-sm"
                        >
                            {showAddForm ? (
                                <>
                                    <X className="mr-2" size={18} /> Annuler
                                </>
                            ) : (
                                <>
                                    <UserPlus className="mr-2" size={18} /> Ajouter un employé
                                </>
                            )}
                        </button>
                    </div>

                    {/* Barre de recherche et filtres */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative flex-grow max-w-md">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <Search className="text-slate-400" size={18} />
                                </div>
                                <input
                                    type="text"
                                    className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg block w-full pl-10 p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Rechercher un employé..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter size={16} className="text-slate-500" />
                                <div className="flex gap-2">
                                    <button
                                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${getFilterButtonClass('all')}`}
                                        onClick={() => setActiveFilter('all')}
                                    >
                                        Tous
                                    </button>
                                    <button
                                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${getFilterButtonClass('admin')}`}
                                        onClick={() => setActiveFilter('admin')}
                                    >
                                        Admin
                                    </button>
                                    <button
                                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${getFilterButtonClass('ingenieur')}`}
                                        onClick={() => setActiveFilter('ingenieur')}
                                    >
                                        Ingénieur
                                    </button>
                                    <button
                                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${getFilterButtonClass('technicien')}`}
                                        onClick={() => setActiveFilter('technicien')}
                                    >
                                        Technicien
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Formulaire d'ajout */}
                    {showAddForm && (
                        <div className="bg-white shadow-md border border-slate-200 p-0 rounded-xl mb-8 transition-all overflow-hidden">
                            <div className="bg-indigo-50 border-b border-slate-200 px-6 py-4">
                                <h2 className="text-lg font-semibold text-indigo-800 flex items-center">
                                    <UserPlus className="mr-2 text-indigo-600" size={20} />
                                    Ajouter un nouvel employé
                                </h2>
                                <p className="text-slate-600 text-sm mt-1">Remplissez les informations ci-dessous pour créer un nouvel employé</p>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">Prénom</label>
                                        <div className="relative">
                                            <input
                                                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm shadow-sm transition-all"
                                                placeholder="Entrez le prénom"
                                                value={newUser.firstName}
                                                onChange={(e) => handleNewUserChange('firstName', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">Nom</label>
                                        <div className="relative">
                                            <input
                                                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm shadow-sm transition-all"
                                                placeholder="Entrez le nom"
                                                value={newUser.lastName}
                                                onChange={(e) => handleNewUserChange('lastName', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">Email</label>
                                        <div className="relative">
                                            <input
                                                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm shadow-sm transition-all"
                                                placeholder="exemple@entreprise.com"
                                                value={newUser.email}
                                                onChange={(e) => handleNewUserChange('email', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">Mot de passe</label>
                                        <div className="relative">
                                            <input
                                                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm shadow-sm transition-all"
                                                type="password"
                                                placeholder="••••••••"
                                                value={newUser.password}
                                                onChange={(e) => handleNewUserChange('password', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700">Rôle</label>
                                        <div className="relative">
                                            <select
                                                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm shadow-sm transition-all appearance-none"
                                                value={newUser.role.name}
                                                onChange={(e) => handleNewUserChange('role', e.target.value)}
                                            >
                                                <option value="ROLE_ADMIN">Admin</option>
                                                <option value="ROLE_INGENIEUR">Ingénieur</option>
                                                <option value="ROLE_TECHNICIEN">Technicien</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowAddForm(false)}
                                    className="px-4 py-2 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleAddUser}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow text-sm font-medium flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                >
                                    <PlusCircle className="mr-2" size={16} /> Ajouter l'employé
                                </button>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center items-center h-64 bg-white rounded-xl shadow-sm border border-slate-200">
                            <div className="flex flex-col items-center">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
                                <p className="text-slate-600">Chargement des données...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-sm mb-6">
                            <div className="flex items-center">
                                <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                                <p className="font-medium">{error}</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {filteredUsers.length === 0 ? (
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                                    <div className="flex flex-col items-center">
                                        <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                            <Search className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <p className="text-slate-500 text-lg mb-2">Aucun employé ne correspond à votre recherche</p>
                                        <p className="text-slate-400 text-sm">Essayez de modifier vos critères de recherche</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-200">
                                            <thead className="bg-slate-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nom</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mot de passe</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rôle</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Localisation</th>
                                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-slate-200">
                                            {filteredUsers.map(user => (
                                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                        {user.id}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {editUserId === user.id ? (
                                                            <div className="flex gap-2">
                                                                <input
                                                                    className="w-24 p-1.5 border border-slate-300 rounded text-sm"
                                                                    value={editedUser.firstName || ''}
                                                                    onChange={(e) => handleEditChange('firstName', e.target.value)}
                                                                    placeholder="Prénom"
                                                                />
                                                                <input
                                                                    className="w-24 p-1.5 border border-slate-300 rounded text-sm"
                                                                    value={editedUser.lastName || ''}
                                                                    onChange={(e) => handleEditChange('lastName', e.target.value)}
                                                                    placeholder="Nom"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center">
                                                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white">
                                                                        <span className="font-medium">
                                                                            {`${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`}
                                                                        </span>
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="text-sm font-medium text-slate-900">
                                                                        {`${user.firstName || ''} ${user.lastName || ''}`}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {editUserId === user.id ? (
                                                            <input
                                                                className="p-1.5 border border-slate-300 rounded text-sm w-full"
                                                                value={editedUser.email || ''}
                                                                onChange={(e) => handleEditChange('email', e.target.value)}
                                                            />
                                                        ) : (
                                                            <div className="text-sm text-slate-900">{user.email}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {editUserId === user.id ? (
                                                            <input
                                                                className="p-1.5 border border-slate-300 rounded text-sm"
                                                                type="password"
                                                                placeholder="Nouveau mot de passe"
                                                                onChange={(e) => handleEditChange('password', e.target.value)}
                                                            />
                                                        ) : (
                                                            <div className="text-sm text-slate-500">••••••••</div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {editUserId === user.id ? (
                                                            <select
                                                                className="p-1.5 border border-slate-300 rounded text-sm bg-white"
                                                                value={editedUser.role?.name || ''}
                                                                onChange={(e) => handleEditChange('role', { name: e.target.value })}
                                                            >
                                                                <option value="ROLE_ADMIN">Admin</option>
                                                                <option value="ROLE_INGENIEUR">Ingénieur</option>
                                                                <option value="ROLE_TECHNICIEN">Technicien</option>
                                                            </select>
                                                        ) : (
                                                            getRoleBadge(user.role?.name)
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                        {user.latitude?.toFixed(4) || '—'}, {user.longitude?.toFixed(4) || '—'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        {editUserId === user.id ? (
                                                            <div className="flex justify-end space-x-2">
                                                                <button
                                                                    onClick={handleSaveEdit}
                                                                    className="bg-emerald-600 text-white p-1.5 rounded hover:bg-emerald-700 transition-colors"
                                                                    title="Enregistrer"
                                                                >
                                                                    <Check size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={cancelEdit}
                                                                    className="bg-slate-400 text-white p-1.5 rounded hover:bg-slate-500 transition-colors"
                                                                    title="Annuler"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex justify-end space-x-2">
                                                                <button
                                                                    className="text-indigo-600 hover:text-indigo-900 p-1.5 rounded hover:bg-indigo-50 transition-colors"
                                                                    title="Voir les détails"
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleEditClick(user)}
                                                                    className="text-amber-600 hover:text-amber-900 p-1.5 rounded hover:bg-amber-50 transition-colors"
                                                                    title="Modifier"
                                                                >
                                                                    <PencilLine size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteUser(user.id)}
                                                                    className="text-red-600 hover:text-red-900 p-1.5 rounded hover:bg-red-50 transition-colors"
                                                                    title="Supprimer"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                                        <div className="text-sm text-slate-500">
                                            {filteredUsers.length} employé{filteredUsers.length > 1 ? 's' : ''} affiché{filteredUsers.length > 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Employees;