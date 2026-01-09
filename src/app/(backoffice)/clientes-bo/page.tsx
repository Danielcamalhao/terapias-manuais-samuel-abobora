"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "CLIENT" | "ADMIN";
  clientType: "NORMAL" | "PREMIUM";
  emailVerified: boolean;
  birthDate: string | null;
  createdAt: string;
  _count?: {
    bookings: number;
  };
}

export default function ClientesBackoffice() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "CLIENT" | "ADMIN">("ALL");
  const [clientTypeFilter, setClientTypeFilter] = useState<"ALL" | "NORMAL" | "PREMIUM">("ALL");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "CLIENT" as "CLIENT" | "ADMIN",
    clientType: "NORMAL" as "NORMAL" | "PREMIUM",
    birthDate: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, clientTypeFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Erro ao carregar utilizadores");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by role
    if (roleFilter !== "ALL") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    // Filter by client type
    if (clientTypeFilter !== "ALL") {
      filtered = filtered.filter((u) => u.clientType === clientTypeFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          (u.phone && u.phone.includes(term))
      );
    }

    setFilteredUsers(filtered);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "CLIENT",
      clientType: "NORMAL",
      birthDate: "",
      password: "",
    });
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      clientType: user.clientType || "NORMAL",
      birthDate: user.birthDate ? user.birthDate.split("T")[0] : "",
      password: "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "CLIENT",
      clientType: "NORMAL",
      birthDate: "",
      password: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingUser
        ? `/api/admin/users/${editingUser.id}`
        : "/api/admin/users";

      const method = editingUser ? "PUT" : "POST";

      const body: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        role: formData.role,
        clientType: formData.clientType,
        birthDate: formData.birthDate || null,
      };

      // Only include password if it's provided
      if (formData.password) {
        body.password = formData.password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erro ao guardar utilizador");
      }

      await fetchUsers();
      closeModal();
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Tem a certeza que deseja remover o utilizador ${userName}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erro ao remover utilizador");
      }

      await fetchUsers();
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    }
  };

  const handleToggleClientType = async (user: User) => {
    try {
      const newType = user.clientType === "PREMIUM" ? "NORMAL" : "PREMIUM";
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientType: newType }),
      });

      if (!res.ok) {
        throw new Error("Erro ao atualizar tipo de cliente");
      }

      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestão de Clientes
          </h1>
          <p className="text-gray-600">
            Gerir utilizadores, permissões e categorias de clientes
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="flex-1 w-full lg:w-auto">
              <input
                type="text"
                placeholder="Pesquisar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Função:</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as "ALL" | "CLIENT" | "ADMIN")}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="ALL">Todos</option>
                <option value="CLIENT">Clientes</option>
                <option value="ADMIN">Administradores</option>
              </select>
            </div>

            {/* Client Type Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Categoria:</label>
              <select
                value={clientTypeFilter}
                onChange={(e) => setClientTypeFilter(e.target.value as "ALL" | "NORMAL" | "PREMIUM")}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="ALL">Todos</option>
                <option value="NORMAL">Normal</option>
                <option value="PREMIUM">Premium</option>
              </select>
            </div>

            {/* Create Button */}
            <button
              onClick={openCreateModal}
              className="bg-green-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-800 transition whitespace-nowrap"
            >
              + Novo Utilizador
            </button>
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-gray-600">Total:</span>
              <span className="ml-2 font-semibold text-gray-900">{users.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Clientes:</span>
              <span className="ml-2 font-semibold text-gray-900">
                {users.filter((u) => u.role === "CLIENT").length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Premium:</span>
              <span className="ml-2 font-semibold text-purple-700">
                {users.filter((u) => u.clientType === "PREMIUM").length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Normal:</span>
              <span className="ml-2 font-semibold text-blue-700">
                {users.filter((u) => u.clientType === "NORMAL").length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Verificados:</span>
              <span className="ml-2 font-semibold text-green-700">
                {users.filter((u) => u.emailVerified).length}
              </span>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">Nenhum utilizador encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilizador
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marcações
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aniversário
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold mr-3 ${
                              user.role === "ADMIN"
                                ? "bg-gradient-to-br from-purple-600 to-purple-500"
                                : user.clientType === "PREMIUM"
                                ? "bg-gradient-to-br from-yellow-500 to-orange-500"
                                : "bg-gradient-to-br from-green-600 to-emerald-500"
                            }`}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                              {user.role === "ADMIN" && (
                                <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.phone || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleClientType(user)}
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full cursor-pointer transition hover:opacity-80 ${
                            user.clientType === "PREMIUM"
                              ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-white"
                              : "bg-blue-100 text-blue-800"
                          }`}
                          title="Clique para alternar"
                        >
                          {user.clientType === "PREMIUM" ? "⭐ Premium" : "Normal"}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.emailVerified ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Verificado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user._count?.bookings || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.birthDate
                          ? new Date(user.birthDate).toLocaleDateString("pt-PT", {
                              day: "2-digit",
                              month: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-green-700 hover:text-green-900 mr-4"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.name)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingUser ? "Editar Utilizador" : "Novo Utilizador"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Função *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as "CLIENT" | "ADMIN" })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="CLIENT">Cliente</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria *
                  </label>
                  <select
                    value={formData.clientType}
                    onChange={(e) =>
                      setFormData({ ...formData, clientType: e.target.value as "NORMAL" | "PREMIUM" })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="PREMIUM">Premium</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password {editingUser ? "(deixe em branco para manter)" : "*"}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required={!editingUser}
                  minLength={6}
                />
                {!editingUser && (
                  <p className="mt-1 text-xs text-gray-500">Mínimo 6 caracteres</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 transition disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? "A guardar..." : editingUser ? "Guardar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
