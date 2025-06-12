"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import axios from "axios"
import useChatWebSocket from "../Hooks/useChatWebSocket"
import { useAuth } from "../context/AuthContext"
import { Search, Plus, Users, Send, MoreVertical, UserPlus, Filter, Check, CheckCheck, Phone, Video, Paperclip, Smile, X } from 'lucide-react'

interface User {
    id: string
    firstName?: string
    lastName?: string
    email?: string
    department?: string
    city?: string
    ocp?: string
    role?: {
        id: number
        name: string
    }
}

interface ChatGroup {
    id: string
    name?: string
    department?: string
    city?: string
    ocp?: string
    members?: User[]
}

interface Message {
    id: string
    content: string
    sender: User
    recipient?: User
    group?: ChatGroup
    timestamp: string
    read: boolean
}

interface GroupCreationData {
    name: string
    department: string
    city: string
    ocp: string
    userIds: string[]
}

const ChatDiscussions: React.FC = () => {
    const { user, token } = useAuth()
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [groups, setGroups] = useState<ChatGroup[]>([])
    const [inputMessage, setInputMessage] = useState<string>("")
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({})
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string>("")

    // États pour la création de groupe
    const [showGroupModal, setShowGroupModal] = useState<boolean>(false)
    const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false)
    const [groupCreationData, setGroupCreationData] = useState<GroupCreationData>({
        name: "",
        department: "",
        city: "",
        ocp: "",
        userIds: [],
    })
    const [selectedUsersForGroup, setSelectedUsersForGroup] = useState<string[]>([])
    const [availableUsers, setAvailableUsers] = useState<User[]>([])

    // États pour les filtres avancés
    const [filterType, setFilterType] = useState<"all" | "users" | "groups">("all")
    const [departmentFilter, setDepartmentFilter] = useState<string>("")
    const [cityFilter, setCityFilter] = useState<string>("")
    const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(false)
    const [showFilters, setShowFilters] = useState<boolean>(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)

    // ✅ Fonction de callback pour les messages WebSocket
    const handleWebSocketMessage = useCallback(
        (message: Message) => {
            console.log("📥 Nouveau message WebSocket reçu:", message)

            const newMessage = message as Message

            // ✅ Vérifier si le message est pertinent pour la conversation actuelle
            const isForCurrentConversation =
                (selectedUser &&
                    (newMessage.sender.id === selectedUser.id ||
                        newMessage.recipient?.id === selectedUser.id ||
                        (newMessage.sender.id === user?.id && newMessage.recipient?.id === selectedUser.id) ||
                        (newMessage.sender.id === selectedUser.id && newMessage.recipient?.id === user?.id))) ||
                (selectedGroup && newMessage.group?.id === selectedGroup.id)

            if (isForCurrentConversation) {
                console.log("✅ Message ajouté à la conversation actuelle")
                setMessages((prev) => {
                    const exists = prev.find((m) => m.id === newMessage.id)
                    if (exists) return prev
                    return [...prev, newMessage]
                })
            } else {
                console.log("ℹ️ Message reçu pour une autre conversation")
                if (newMessage.sender.id !== user?.id) {
                    const key = newMessage.recipient ? newMessage.sender.id : newMessage.group?.id
                    if (key) {
                        setUnreadCounts((prev) => ({
                            ...prev,
                            [key]: (prev[key] || 0) + 1,
                        }))
                    }
                }
            }
        },
        [selectedUser, selectedGroup, user?.id],
    )

    const stompClient = useChatWebSocket(handleWebSocketMessage)

    // ✅ Chargement initial des données
    useEffect(() => {
        const fetchData = async () => {
            if (!token) return

            setLoading(true)
            setError("")

            try {
                console.log("📊 Chargement des données...")

                // Chargement des utilisateurs
                const usersRes = await axios.get("http://localhost:8080/api/chatt/search/users?query=", {
                    headers: { Authorization: `Bearer ${token}` },
                })
                setUsers(usersRes.data)
                setAvailableUsers(usersRes.data)

                // Chargement des groupes
                const groupsRes = await axios.get("http://localhost:8080/api/groups", {
                    headers: { Authorization: `Bearer ${token}` },
                })
                setGroups(groupsRes.data)

                // Chargement des compteurs de messages non lus
                await loadUnreadCounts(usersRes.data, groupsRes.data)

                console.log("✅ Données chargées avec succès")
            } catch (err) {
                console.error("❌ Erreur lors du chargement des données", err)
                setError("Erreur lors du chargement des données")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [token])

    // ✅ Chargement des compteurs de messages non lus
    const loadUnreadCounts = async (usersList: User[], groupsList: ChatGroup[]) => {
        if (!token) return

        const counts: { [key: string]: number } = {}

        // Compteurs pour les utilisateurs
        await Promise.all(
            usersList.map(async (u: User) => {
                try {
                    const res = await axios.get(`http://localhost:8080/api/chatt/messages/private/unread-count?userId=${u.id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                    counts[u.id] = res.data
                } catch (err) {
                    console.warn(`Impossible de charger le compteur pour l'utilisateur ${u.id}`)
                    counts[u.id] = 0
                }
            }),
        )

        // Compteurs pour les groupes
        await Promise.all(
            groupsList.map(async (g: ChatGroup) => {
                try {
                    const res = await axios.get(`http://localhost:8080/api/chatt/messages/group/unread-count?groupId=${g.id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                    counts[g.id] = res.data
                } catch (err) {
                    console.warn(`Impossible de charger le compteur pour le groupe ${g.id}`)
                    counts[g.id] = 0
                }
            }),
        )

        setUnreadCounts(counts)
    }
    const getFullName = (user: User) => {
        const first = user.firstName || ""
        const last = user.lastName || ""
        return `${first} ${last}`.trim()
    }

    // ✅ Chargement des messages selon la sélection
    useEffect(() => {
        if (selectedUser) {
            console.log("📱 Chargement des messages privés pour:", selectedUser.email)
            fetchPrivateMessages(selectedUser.id)
        } else if (selectedGroup) {
            console.log("👥 Chargement des messages de groupe pour:", selectedGroup.name)
            fetchGroupMessages(selectedGroup.id)
        }
    }, [selectedUser, selectedGroup])

    // ✅ Récupération des messages privés
    const fetchPrivateMessages = async (userId: string) => {
        if (!token) return

        try {
            const res = await axios.get(`http://localhost:8080/api/messages/private/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            setMessages(res.data)

            // Marquer les messages comme lus
            await axios.post(
                `http://localhost:8080/api/chatt/messages/private/mark-read?userId=${userId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } },
            )

            // Réinitialiser le compteur
            setUnreadCounts((prev) => ({ ...prev, [userId]: 0 }))
        } catch (err) {
            console.error("❌ Erreur lors du chargement des messages privés", err)
            setError("Erreur lors du chargement des messages")
        }
    }

    // ✅ Récupération des messages de groupe
    const fetchGroupMessages = async (groupId: string) => {
        if (!token) return

        try {
            const res = await axios.get(`http://localhost:8080/api/messages/group/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            setMessages(res.data)

            // Marquer les messages comme lus
            await axios.post(
                `http://localhost:8080/api/chatt/messages/group/mark-read?groupId=${groupId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } },
            )

            // Réinitialiser le compteur
            setUnreadCounts((prev) => ({ ...prev, [groupId]: 0 }))
        } catch (err) {
            console.error("❌ Erreur lors du chargement des messages de groupe", err)
            setError("Erreur lors du chargement des messages")
        }
    }

    // ✅ Envoi de message
    const sendMessage = async () => {
        if (!inputMessage.trim() || !user) {
            return
        }

        const payload = {
            recipientId: selectedUser?.id ?? null,
            groupId: selectedGroup?.id ?? null,
            content: inputMessage,
        }

        try {
            if (stompClient?.connected) {
                // Envoi via WebSocket
                stompClient.publish({
                    destination: "/app/chat.send",
                    body: JSON.stringify(payload),
                })
                console.log("✅ Message envoyé via WebSocket")
            } else {
                // Fallback via API REST
                if (selectedUser) {
                    await axios.post(`http://localhost:8080/api/messages/private/${selectedUser.id}`, inputMessage, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "text/plain",
                        },
                    })
                } else if (selectedGroup) {
                    await axios.post(`http://localhost:8080/api/messages/group/${selectedGroup.id}`, inputMessage, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "text/plain",
                        },
                    })
                }
                console.log("✅ Message envoyé via API REST")

                // Recharger les messages
                if (selectedUser) {
                    fetchPrivateMessages(selectedUser.id)
                } else if (selectedGroup) {
                    fetchGroupMessages(selectedGroup.id)
                }
            }

            setInputMessage("")
        } catch (error) {
            console.error("❌ Erreur lors de l'envoi du message:", error)
            setError("Erreur lors de l'envoi du message")
        }
    }

    // ✅ Création d'un nouveau groupe
    const createGroup = async () => {
        if (!token || !groupCreationData.name.trim()) {
            setError("Le nom du groupe est requis")
            return
        }

        try {
            setLoading(true)
            const response = await axios.post(
                "http://localhost:8080/api/groups",
                {
                    name: groupCreationData.name,
                    department: groupCreationData.department,
                    city: groupCreationData.city,
                    ocp: groupCreationData.ocp,
                    userIds: selectedUsersForGroup.map((id) => Number.parseInt(id)),
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            )

            // Ajouter le nouveau groupe à la liste
            setGroups((prev) => [...prev, response.data])

            // Réinitialiser le formulaire
            setGroupCreationData({ name: "", department: "", city: "", ocp: "", userIds: [] })
            setSelectedUsersForGroup([])
            setShowGroupModal(false)

            console.log("✅ Groupe créé avec succès")
        } catch (err) {
            console.error("❌ Erreur lors de la création du groupe:", err)
            setError("Erreur lors de la création du groupe")
        } finally {
            setLoading(false)
        }
    }

    // ✅ Ajouter un utilisateur à un groupe existant
    const addUserToGroup = async (groupId: string, userId: string) => {
        if (!token) return

        try {
            setLoading(true)
            const response = await axios.put(
                `http://localhost:8080/api/groups/${groupId}/add-user/${userId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } },
            )

            // Mettre à jour la liste des groupes
            setGroups((prev) => prev.map((g) => (g.id === groupId ? response.data : g)))

            console.log("✅ Utilisateur ajouté au groupe avec succès")
        } catch (err) {
            console.error("❌ Erreur lors de l'ajout de l'utilisateur:", err)
            setError("Erreur lors de l'ajout de l'utilisateur")
        } finally {
            setLoading(false)
        }
    }

    // ✅ Recherche d'utilisateurs avec filtres
    const searchUsers = async (query: string) => {
        if (!token) return

        try {
            const res = await axios.get(`http://localhost:8080/api/chatt/search/users?query=${query}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            setUsers(res.data)
        } catch (err) {
            console.error("❌ Erreur lors de la recherche d'utilisateurs", err)
        }
    }

    // ✅ Gestion de la recherche avec debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.trim()) {
                searchUsers(searchQuery)
            }
        }, 300)

        return () => clearTimeout(timeoutId)
    }, [searchQuery])

    // ✅ Auto-scroll vers le bas
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // ✅ Filtrage des utilisateurs et groupes
    const getFilteredContacts = () => {
        let filteredUsers = users.filter(
            (u) =>
                (u.lastName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()),
        )

        let filteredGroups = groups.filter((g) => (g.name || "").toLowerCase().includes(searchQuery.toLowerCase()))

        // Filtres par département et ville
        if (departmentFilter) {
            filteredUsers = filteredUsers.filter((u) => u.department === departmentFilter)
            filteredGroups = filteredGroups.filter((g) => g.department === departmentFilter)
        }

        if (cityFilter) {
            filteredUsers = filteredUsers.filter((u) => u.city === cityFilter)
            filteredGroups = filteredGroups.filter((g) => g.city === cityFilter)
        }

        // Filtre par messages non lus
        if (showUnreadOnly) {
            filteredUsers = filteredUsers.filter((u) => (unreadCounts[u.id] || 0) > 0)
            filteredGroups = filteredGroups.filter((g) => (unreadCounts[g.id] || 0) > 0)
        }

        return { filteredUsers, filteredGroups }
    }

    const { filteredUsers, filteredGroups } = getFilteredContacts()
    // @ts-ignore

    // ✅ Obtenir les départements et villes uniques pour les filtres
    const uniqueDepartments = [...new Set([...users, ...groups].map((item) => item.department).filter(Boolean))]
    // @ts-ignore
    const uniqueCities = [...new Set([...users, ...groups].map((item) => item.city).filter(Boolean))]

    // Fonction pour générer un avatar avec initiales
    const getInitials = (name?: string, email?: string) => {
        if (name) {
            return name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
        }
        if (email) {
            return email.slice(0, 2).toUpperCase()
        }
        return "U"
    }

    // Fonction pour générer une couleur d'avatar basée sur l'ID
    const getAvatarColor = (id: string) => {
        const colors = [
            "bg-gradient-to-br from-emerald-400 to-emerald-600",
            "bg-gradient-to-br from-cyan-400 to-cyan-600",
            "bg-gradient-to-br from-violet-400 to-violet-600",
            "bg-gradient-to-br from-rose-400 to-rose-600",
            "bg-gradient-to-br from-amber-400 to-amber-600",
            "bg-gradient-to-br from-teal-400 to-teal-600",
            "bg-gradient-to-br from-orange-400 to-orange-600",
            "bg-gradient-to-br from-purple-400 to-purple-600",
        ]
        const index = Number.parseInt(id) % colors.length
        return colors[index]
    }

    if (loading && users.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
                <div className="text-center">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-border mx-auto mb-6"></div>
                        <div className="absolute inset-2 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-full"></div>
                    </div>
                    <div className="text-slate-600 font-medium">Chargement de vos conversations...</div>
                    <div className="text-slate-400 text-sm mt-1">Connexion en cours</div>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="flex h-16 items-center justify-between px-6">
                    <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                            <span className="text-white text-lg">💬</span>
                        </div>
                        <h1 className="text-xl font-semibold text-gray-900">Messagerie</h1>
                    </div>
                    <button
                        onClick={() => setShowGroupModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                        <Plus className="h-4 w-4"/>
                        <span>Nouveau groupe</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4 rounded-r-lg">
                    <div className="flex">
                        <div className="text-red-700 font-medium">{error}</div>
                        <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">
                            <X size={16}/>
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar - Liste des conversations */}
                <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-lg">
                    {/* Barre de recherche */}
                    <div className="p-5 border-b border-gray-200 bg-gray-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                    size={18}/>
                            <input
                                type="text"
                                placeholder="Rechercher une conversation..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-10 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors ${
                                    showFilters ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                }`}
                            >
                                <Filter size={16}/>
                            </button>
                        </div>

                        {/* Filtres avancés */}
                        {showFilters && (
                            <div className="mt-4 space-y-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                                <div className="flex gap-2">
                                    <select
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value as "all" | "users" | "groups")}
                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="all">🔍 Tous</option>
                                        <option value="users">👤 Utilisateurs</option>
                                        <option value="groups">👥 Groupes</option>
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <select
                                        value={departmentFilter}
                                        onChange={(e) => setDepartmentFilter(e.target.value)}
                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="">🏢 Tous départements</option>
                                        {uniqueDepartments.map((dept) => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={cityFilter}
                                        onChange={(e) => setCityFilter(e.target.value)}
                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="">🏙️ Toutes villes</option>
                                        {uniqueCities.map((city) => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                </div>
                                <label
                                    className="flex items-center text-sm text-gray-700 cursor-pointer hover:text-blue-600">
                                    <input
                                        type="checkbox"
                                        checked={showUnreadOnly}
                                        onChange={(e) => setShowUnreadOnly(e.target.checked)}
                                        className="mr-3 w-4 h-4 rounded text-blue-500 focus:ring-blue-500 border-gray-300"
                                    />
                                    <span>🔴 Messages non lus uniquement</span>
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Liste des conversations */}
                    <div className="flex-1 overflow-y-auto">
                        {(filterType === "all" || filterType === "users") && (
                            <div>
                                {filteredUsers.length > 0 && (
                                    <div
                                        className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                                        ✨ Contacts ({filteredUsers.length})
                                    </div>
                                )}
                                {filteredUsers.map((u) => (
                                    <div
                                        key={u.id}
                                        onClick={() => {
                                            setSelectedUser(u)
                                            setSelectedGroup(null)
                                        }}
                                        className={`px-4 py-4 cursor-pointer hover:bg-blue-50 transition-colors border-l-4 ${
                                            selectedUser?.id === u.id
                                                ? "bg-blue-50 border-blue-500"
                                                : "border-transparent hover:border-blue-300"
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div
                                                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md ${getAvatarColor(u.id)}`}>
                                                {getInitials(u.lastName, u.email)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-semibold text-gray-900 truncate">
                                                        {getFullName(u) || u.email || "Utilisateur inconnu"}
                                                    </h3>
                                                    {unreadCounts[u.id] > 0 && (
                                                        <span
                                                            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center font-bold">
                {unreadCounts[u.id]}
            </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 truncate">{u.email}</p>
                                                {u.lastName && (
                                                    <p className="text-xs text-gray-400 truncate">
                                                        Rôle : {u.role?.name?.replace("ROLE_", "")}
                                                    </p>
                                                )}
                                            </div>

                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {(filterType === "all" || filterType === "groups") && (
                            <div>
                                {filteredGroups.length > 0 && (
                                    <div
                                        className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                                        Groupes ({filteredGroups.length})
                                    </div>
                                )}
                                {filteredGroups.map((g) => (
                                    <div
                                        key={g.id}
                                        onClick={() => {
                                            setSelectedGroup(g)
                                            setSelectedUser(null)
                                        }}
                                        className={`px-4 py-4 cursor-pointer hover:bg-purple-50 transition-colors border-l-4 ${
                                            selectedGroup?.id === g.id
                                                ? "bg-purple-50 border-purple-500"
                                                : "border-transparent hover:border-purple-300"
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div
                                                className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-md">
                                                <Users className="text-white" size={20}/>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-semibold text-gray-900 truncate">{g.name || "Groupe sans nom"}</h3>
                                                    {unreadCounts[g.id] > 0 && (
                                                        <span
                                                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center font-bold">
                                                            {unreadCounts[g.id]}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    {g.members?.length || 0} membre{(g.members?.length || 0) > 1 ? "s" : ""}
                                                </p>
                                                {(g.department || g.city) && (
                                                    <p className="text-xs text-gray-400 truncate">
                                                        {g.department} {g.city && `• ${g.city}`}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Zone de conversation principale */}
                <div className="flex-1 flex flex-col bg-gray-50">
                    {selectedUser || selectedGroup ? (
                        <>
                            {/* Header de conversation */}
                            <div
                                className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
                                <div className="flex items-center space-x-4">
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md ${
                                            selectedUser ? getAvatarColor(selectedUser.id) : "bg-gradient-to-r from-purple-500 to-pink-500"
                                        }`}>
                                        {selectedUser ? getInitials(selectedUser.lastName, selectedUser.email) :
                                            <Users size={20}/>}
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-gray-900 text-lg">
                                            {selectedUser ? selectedUser.lastName || selectedUser.email : selectedGroup?.name}
                                        </h2>
                                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                                            <div
                                                className={`w-2 h-2 rounded-full ${stompClient?.connected ? "bg-green-400" : "bg-gray-400"}`}></div>
                                            <span>{stompClient?.connected ? "En ligne" : "Hors ligne"}</span>
                                            {selectedGroup && selectedGroup.members && (
                                                <span>• {selectedGroup.members.length} membre{selectedGroup.members.length > 1 ? "s" : ""}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {selectedUser && (
                                        <>
                                            <button
                                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                <Phone size={18}/>
                                            </button>
                                            <button
                                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                <Video size={18}/>
                                            </button>
                                        </>
                                    )}
                                    {selectedGroup && (
                                        <button
                                            onClick={() => setShowAddUserModal(true)}
                                            className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                        >
                                            <UserPlus size={18}/>
                                        </button>
                                    )}
                                    <button
                                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                        <MoreVertical size={18}/>
                                    </button>
                                </div>
                            </div>

                            {/* Zone des messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((msg, i) => {
                                    const isOwn = msg.sender.id === user?.id
                                    const showAvatar = i === 0 || messages[i - 1].sender.id !== msg.sender.id

                                    return (
                                        <div
                                            key={msg.id || i}
                                            className={`flex ${isOwn ? "justify-end" : "justify-start"} ${showAvatar ? "mt-6" : "mt-2"}`}
                                        >
                                            <div className={`flex items-end space-x-3 max-w-xs lg:max-w-md ${
                                                isOwn ? "flex-row-reverse space-x-reverse" : ""
                                            }`}>
                                                {!isOwn && showAvatar && (
                                                    <div
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${getAvatarColor(msg.sender.id)}`}>
                                                        {getInitials(msg.sender.lastName, msg.sender.email)}
                                                    </div>
                                                )}
                                                {!isOwn && !showAvatar && <div className="w-8"></div>}

                                                <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                                                    isOwn
                                                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-md"
                                                        : "bg-white text-gray-900 rounded-bl-md border border-gray-200"
                                                }`}>
                                                    {!isOwn && showAvatar && selectedGroup && (
                                                        <div className="text-xs font-semibold mb-2 text-gray-600">
                                                            {msg.sender.lastName || msg.sender.email}
                                                        </div>
                                                    )}
                                                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                                                    <div
                                                        className={`text-xs mt-2 flex items-center justify-end space-x-1 ${
                                                            isOwn ? "text-blue-100" : "text-gray-500"
                                                        }`}>
                                                        <span>{new Date(msg.timestamp).toLocaleTimeString([], {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}</span>
                                                        {isOwn && (
                                                            <div className="text-blue-100">
                                                                {msg.read ? <CheckCheck size={14}/> :
                                                                    <Check size={14}/>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                                <div ref={messagesEndRef}/>
                            </div>

                            {/* Zone de saisie */}
                            <div className="bg-white border-t border-gray-200 px-6 py-4">
                                <div className="flex items-end space-x-4">
                                    <button
                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        <Paperclip size={20}/>
                                    </button>
                                    <div className="flex-1 relative">
                                        <textarea
                                            placeholder="Tapez votre message..."
                                            value={inputMessage}
                                            onChange={(e) => setInputMessage(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault()
                                                    sendMessage()
                                                }
                                            }}
                                            className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors resize-none max-h-32"
                                            rows={1}
                                            disabled={loading}
                                            style={{minHeight: "48px"}}
                                        />
                                        <button
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100">
                                            <Smile size={18}/>
                                        </button>
                                    </div>
                                    <button
                                        onClick={sendMessage}
                                        disabled={loading || !inputMessage.trim()}
                                        className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full hover:from-blue-600 hover:to-purple-600 transition-all duration-300 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed shadow-lg hover:scale-105"
                                    >
                                        <Send size={18}/>
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div
                                    className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                    <span className="text-white text-2xl">💬</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-800 mb-2">Sélectionnez une conversation</h2>
                                <p className="text-gray-500">Choisissez un contact ou un groupe pour commencer à
                                    discuter</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de création de groupe */}
            {showGroupModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
                        <div
                            className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
                            <h3 className="text-xl font-bold text-gray-900">Créer un nouveau groupe</h3>
                            <button
                                onClick={() => {
                                    setShowGroupModal(false)
                                    setGroupCreationData({name: "", department: "", city: "", ocp: "", userIds: []})
                                    setSelectedUsersForGroup([])
                                }}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20}/>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nom du groupe
                                        *</label>
                                    <input
                                        type="text"
                                        placeholder="Entrez le nom du groupe"
                                        value={groupCreationData.name}
                                        onChange={(e) => setGroupCreationData((prev) => ({
                                            ...prev,
                                            name: e.target.value
                                        }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            className="block text-sm font-semibold text-gray-700 mb-2">Département</label>
                                        <input
                                            type="text"
                                            placeholder="Département"
                                            value={groupCreationData.department}
                                            onChange={(e) => setGroupCreationData((prev) => ({
                                                ...prev,
                                                department: e.target.value
                                            }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Ville</label>
                                        <input
                                            type="text"
                                            placeholder="Ville"
                                            value={groupCreationData.city}
                                            onChange={(e) => setGroupCreationData((prev) => ({
                                                ...prev,
                                                city: e.target.value
                                            }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">OCP</label>
                                    <input
                                        type="text"
                                        placeholder="OCP"
                                        value={groupCreationData.ocp}
                                        onChange={(e) => setGroupCreationData((prev) => ({
                                            ...prev,
                                            ocp: e.target.value
                                        }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Sélectionner les
                                        membres</label>
                                    <div
                                        className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg bg-gray-50">
                                        {availableUsers.map((user) => (
                                            <label
                                                key={user.id}
                                                className="flex items-center p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsersForGroup.includes(user.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedUsersForGroup((prev) => [...prev, user.id])
                                                        } else {
                                                            setSelectedUsersForGroup((prev) => prev.filter((id) => id !== user.id))
                                                        }
                                                    }}
                                                    className="mr-3 rounded text-blue-500 focus:ring-blue-500"
                                                />
                                                <div
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 shadow-sm ${getAvatarColor(user.id)}`}>
                                                    {getInitials(`${user.firstName} ${user.lastName}`, user.email)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-semibold text-gray-900">
                                                        {user.firstName} {user.lastName || user.email}
                                                    </div>
                                                    {user.department && (
                                                        <div className="text-sm text-gray-500">{user.department}</div>
                                                    )}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
                            <button
                                onClick={() => {
                                    setShowGroupModal(false)
                                    setGroupCreationData({name: "", department: "", city: "", ocp: "", userIds: []})
                                    setSelectedUsersForGroup([])
                                }}
                                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                                disabled={loading}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={createGroup}
                                disabled={loading || !groupCreationData.name.trim()}
                                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-lg"
                            >
                                {loading ? "Création..." : "Créer le groupe"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal d'ajout d'utilisateur au groupe */}
            {showAddUserModal && selectedGroup && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div
                        className="bg-white/95 backdrop-blur-xl rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200/50">
                        <div
                            className="px-6 py-5 border-b border-slate-200/60 flex items-center justify-between bg-gradient-to-r from-violet-50 to-purple-50">
                            <h3 className="text-xl font-bold text-slate-900">Ajouter un membre</h3>
                            <button
                                onClick={() => setShowAddUserModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
                            >
                                <X size={20}/>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                            <p className="text-sm text-slate-600 mb-4 font-medium">
                                Sélectionnez un utilisateur à ajouter au groupe "{selectedGroup.name}"
                            </p>
                            <div className="space-y-3">
                                {availableUsers
                                    .filter((user) => !selectedGroup.members?.some((member) => member.id === user.id))
                                    .map((user) => (
                                        <div
                                            key={user.id}
                                            onClick={() => {
                                                addUserToGroup(selectedGroup.id, user.id)
                                                setShowAddUserModal(false)
                                            }}
                                            className="flex items-center p-4 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 rounded-xl cursor-pointer border border-slate-200 hover:border-violet-300 transition-all duration-200 hover:shadow-lg"
                                        >
                                            <div
                                                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mr-4 shadow-lg ${getAvatarColor(user.id)}`}
                                            >
                                                {getInitials(user.lastName, user.email)}
                                            </div>
                                            <div className="flex-1">
                                                <div
                                                    className="font-semibold text-slate-900">{user.lastName || user.email}</div>
                                                <div className="text-sm text-slate-500">{user.email}</div>
                                                {user.department &&
                                                    <div className="text-xs text-slate-400">{user.department}</div>}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Indicateur de statut de connexion */}
            <div className="fixed bottom-6 right-6 z-40">
                <div
                    className={`px-4 py-3 rounded-full text-sm font-bold shadow-xl transition-all duration-300 backdrop-blur-xl ${
                        stompClient?.connected
                            ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-emerald-500/25"
                            : "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-red-500/25"
                    }`}
                >
                    <div className="flex items-center space-x-2">
                        <div
                            className={`w-2.5 h-2.5 rounded-full ${
                                stompClient?.connected ? "bg-white shadow-lg" : "bg-white animate-pulse"
                            }`}
                        ></div>
                        <span>{stompClient?.connected ? "Connecté" : "Reconnexion..."}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ChatDiscussions
