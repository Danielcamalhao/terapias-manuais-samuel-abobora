"use client";

import { useEffect, useState } from "react";
import DatePicker from "@/components/DatePicker";

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
  });
  const [submitting, setSubmitting] = useState(false);
  const [creatingWithEmail, setCreatingWithEmail] = useState(false);
  const [createMessage, setCreateMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
    });
    setCreateMessage(null);
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
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setResetMessage(null);
    setVerificationMessage(null);
    setCreateMessage(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "CLIENT",
      clientType: "NORMAL",
      birthDate: "",
    });
  };

  const handleResendVerification = async () => {
    if (!editingUser) return;

    setResendingVerification(true);
    setVerificationMessage(null);

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}/resend-verification`, {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok) {
        setVerificationMessage({ type: "success", text: "Email de verificação enviado com sucesso!" });
      } else {
        setVerificationMessage({ type: "error", text: data.error || "Erro ao enviar email" });
      }
    } catch {
      setVerificationMessage({ type: "error", text: "Erro ao processar pedido" });
    } finally {
      setResendingVerification(false);
    }
  };

  const handleResetPassword = async () => {
    if (!editingUser) return;

    if (!confirm(`Tem a certeza que deseja gerar uma nova password para ${editingUser.name}? Uma password temporária será enviada por email.`)) {
      return;
    }

    setResettingPassword(true);
    setResetMessage(null);

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}/reset-password`, {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok) {
        setResetMessage({ type: "success", text: data.message });
      } else {
        setResetMessage({ type: "error", text: data.error || "Erro ao enviar email" });
      }
    } catch {
      setResetMessage({ type: "error", text: "Erro ao processar pedido" });
    } finally {
      setResettingPassword(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingUser) {
      // Editar utilizador existente
      setSubmitting(true);
      try {
        const res = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone || null,
            role: formData.role,
            clientType: formData.clientType,
            birthDate: formData.birthDate || null,
          }),
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
    } else {
      // Criar novo utilizador com password temporária
      setCreatingWithEmail(true);
      setCreateMessage(null);

      try {
        const res = await fetch("/api/admin/users/create-with-temp-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone || null,
            role: formData.role,
            clientType: formData.clientType,
            birthDate: formData.birthDate || null,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setCreateMessage({ type: "error", text: data.error || "Erro ao criar utilizador" });
          return;
        }

        setCreateMessage({ type: "success", text: data.message });
        await fetchUsers();

        // Fechar modal após 2 segundos de sucesso
        setTimeout(() => {
          closeModal();
        }, 2000);
      } catch (err) {
        setCreateMessage({ type: "error", text: err instanceof Error ? err.message : "Erro desconhecido" });
      } finally {
        setCreatingWithEmail(false);
      }
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
            Gestão de Utilizadores
          </h1>
          <p className="text-gray-600">
            Gerir utilizadores, permissões e categorias
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

        {/* Operadores de Sistema (Admins) */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Operadores de Sistema</h2>
              <p className="text-sm text-gray-500">
                {filteredUsers.filter((u) => u.role === "ADMIN").length} administrador(es)
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {filteredUsers.filter((u) => u.role === "ADMIN").length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Nenhum operador de sistema encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-purple-50 border-b border-purple-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                        Utilizador
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                        Contacto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-purple-700 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers
                      .filter((u) => u.role === "ADMIN")
                      .map((user) => (
                        <tr key={user.id} className="hover:bg-purple-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold mr-3 bg-gradient-to-br from-purple-600 to-purple-500">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {user.name}
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
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => openEditModal(user)}
                              className="text-purple-700 hover:text-purple-900 mr-4"
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

        {/* Clientes */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Clientes</h2>
              <p className="text-sm text-gray-500">
                {filteredUsers.filter((u) => u.role === "CLIENT").length} cliente(s) •
                <span className="text-yellow-600 ml-1">
                  {filteredUsers.filter((u) => u.role === "CLIENT" && u.clientType === "PREMIUM").length} premium
                </span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {filteredUsers.filter((u) => u.role === "CLIENT").length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Nenhum cliente encontrado</p>
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
                    {filteredUsers
                      .filter((u) => u.role === "CLIENT")
                      .map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold mr-3 ${
                                  user.clientType === "PREMIUM"
                                    ? "bg-gradient-to-br from-yellow-500 to-orange-500"
                                    : "bg-gradient-to-br from-green-600 to-emerald-500"
                                }`}
                              >
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {user.name}
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
                <DatePicker
                  value={formData.birthDate}
                  onChange={(date) => setFormData({ ...formData, birthDate: date })}
                  placeholder="Selecionar data de nascimento"
                  maxDate={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className={formData.role === "CLIENT" ? "grid grid-cols-2 gap-4" : ""}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Função *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const newRole = e.target.value as "CLIENT" | "ADMIN";
                      setFormData({
                        ...formData,
                        role: newRole,
                        // Quando muda para ADMIN, reseta a categoria para NORMAL
                        clientType: newRole === "ADMIN" ? "NORMAL" : formData.clientType,
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="CLIENT">Cliente</option>
                    <option value="ADMIN">Operador de Sistema</option>
                  </select>
                </div>

                {/* Categoria - apenas visível para Clientes */}
                {formData.role === "CLIENT" && (
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
                )}
              </div>

              {/* Info quando é Operador de Sistema */}
              {formData.role === "ADMIN" && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-sm text-purple-800 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Operadores de Sistema têm acesso ao backoffice
                  </p>
                </div>
              )}

              {/* Info sobre password temporária - apenas para novos utilizadores */}
              {!editingUser && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">Password temporária por email</h4>
                      <p className="text-xs text-blue-700 mt-1">
                        Ao criar o utilizador, uma password temporária será gerada automaticamente e enviada por email.
                        O utilizador receberá instruções para definir a sua própria password.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mensagem de criação */}
              {!editingUser && createMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  createMessage.type === "success"
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}>
                  <div className="flex items-center gap-2">
                    {createMessage.type === "success" ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                    {createMessage.text}
                  </div>
                </div>
              )}

              {/* Verificação de Email - apenas ao editar utilizador não verificado */}
              {editingUser && !editingUser.emailVerified && (
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                        Email não verificado
                      </h4>
                      <p className="text-xs text-gray-500">Reenviar email de confirmação</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendingVerification}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {resendingVerification ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          A enviar...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Reenviar Verificação
                        </>
                      )}
                    </button>
                  </div>

                  {/* Verification Message */}
                  {verificationMessage && (
                    <div className={`p-3 rounded-lg text-sm ${
                      verificationMessage.type === "success"
                        ? "bg-green-50 border border-green-200 text-green-800"
                        : "bg-red-50 border border-red-200 text-red-800"
                    }`}>
                      <div className="flex items-center gap-2">
                        {verificationMessage.type === "success" ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                        {verificationMessage.text}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Reset Password - apenas ao editar */}
              {editingUser && (
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Gestão de Password</h4>
                      <p className="text-xs text-gray-500">Gerar nova password e enviar por email</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={resettingPassword}
                      className="px-4 py-2 bg-amber-600 text-white text-sm rounded-lg font-medium hover:bg-amber-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {resettingPassword ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          A enviar...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                          Reset Password
                        </>
                      )}
                    </button>
                  </div>

                  {/* Reset Message */}
                  {resetMessage && (
                    <div className={`p-3 rounded-lg text-sm ${
                      resetMessage.type === "success"
                        ? "bg-green-50 border border-green-200 text-green-800"
                        : "bg-red-50 border border-red-200 text-red-800"
                    }`}>
                      {resetMessage.type === "success" ? (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {resetMessage.text}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          {resetMessage.text}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                  disabled={submitting || creatingWithEmail}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 transition disabled:opacity-50"
                  disabled={submitting || creatingWithEmail}
                >
                  {submitting ? "A guardar..." : creatingWithEmail ? "A criar e enviar email..." : editingUser ? "Guardar" : "Criar e Enviar Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
