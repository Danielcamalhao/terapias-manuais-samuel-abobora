"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  clientType: "NORMAL" | "PREMIUM";
  emailVerified: boolean;
  birthDate: string | null;
  age?: number;
}

interface Campaign {
  id: string;
  type: string;
  subject: string;
  sentTo: number;
  sentAt: string;
  targetType: string | null;
  createdAt: string;
}

interface BirthdayConfig {
  enabled: boolean;
  offerText: string;
  promoCode: string | null;
  offerValidDays: number;
  imageUrl: string | null;
  customMessage: string | null;
}

type CampaignType = "PROMOCAO" | "FERIAS" | "HORARIOS" | "PERSONALIZADO";

const campaignTypeLabels: Record<CampaignType | "ANIVERSARIO", string> = {
  PROMOCAO: "Promoção",
  FERIAS: "Aviso de Férias",
  HORARIOS: "Alteração de Horários",
  PERSONALIZADO: "Personalizado",
  ANIVERSARIO: "Aniversário",
};

const campaignTypeIcons: Record<CampaignType | "ANIVERSARIO", string> = {
  PROMOCAO: "🎉",
  FERIAS: "🏖️",
  HORARIOS: "⏰",
  PERSONALIZADO: "📧",
  ANIVERSARIO: "🎂",
};

export default function EmailsBackoffice() {
  const [activeTab, setActiveTab] = useState<"nova" | "aniversarios" | "config" | "historico">("nova");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [birthdayUsers, setBirthdayUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state - Nova Campanha
  const [campaignType, setCampaignType] = useState<CampaignType>("PROMOCAO");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [flyerUrl, setFlyerUrl] = useState("");
  const [targetType, setTargetType] = useState<"ALL" | "NORMAL" | "PREMIUM">("ALL");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState<"group" | "individual">("group");

  // Form state - Configuração de Aniversários
  const [birthdayConfig, setBirthdayConfig] = useState<BirthdayConfig>({
    enabled: true,
    offerText: "10% de desconto na sua próxima consulta",
    promoCode: "ANIVERSARIO10",
    offerValidDays: 30,
    imageUrl: null,
    customMessage: null,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [campaignsRes, usersRes, birthdaysRes, configRes] = await Promise.all([
        fetch("/api/email-campaigns"),
        fetch("/api/admin/users"),
        fetch("/api/email-campaigns/birthdays"),
        fetch("/api/birthday-config"),
      ]);

      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json();
        setCampaigns(campaignsData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.filter((u: User) => u.emailVerified));
      }

      if (birthdaysRes.ok) {
        const birthdaysData = await birthdaysRes.json();
        setBirthdayUsers(birthdaysData.users || []);
      }

      if (configRes.ok) {
        const configData = await configRes.json();
        setBirthdayConfig(configData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim()) {
      setMessage({ type: "error", text: "O assunto é obrigatório" });
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      const body: Record<string, unknown> = {
        type: campaignType,
        subject,
        content,
        flyerUrl: flyerUrl || undefined,
      };

      if (selectMode === "individual" && selectedUsers.length > 0) {
        body.selectedUserIds = selectedUsers;
      } else if (targetType !== "ALL") {
        body.targetType = targetType;
      }

      const res = await fetch("/api/email-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: "success",
          text: `Campanha enviada com sucesso! ${data.stats.sent} emails enviados, ${data.stats.failed} falhados.`,
        });
        setSubject("");
        setContent("");
        setFlyerUrl("");
        setSelectedUsers([]);
        fetchData();
      } else {
        setMessage({ type: "error", text: data.error || "Erro ao enviar campanha" });
      }
    } catch {
      setMessage({ type: "error", text: "Erro de conexão" });
    } finally {
      setSending(false);
    }
  };

  const handleSendBirthdays = async () => {
    if (birthdayUsers.length === 0) {
      setMessage({ type: "error", text: "Não há aniversariantes hoje" });
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      const res = await fetch("/api/email-campaigns/birthdays", {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: "success",
          text: `Emails de aniversário enviados! ${data.stats.sent} enviados, ${data.stats.failed} falhados.`,
        });
        fetchData();
      } else {
        setMessage({ type: "error", text: data.error || "Erro ao enviar emails" });
      }
    } catch {
      setMessage({ type: "error", text: "Erro de conexão" });
    } finally {
      setSending(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/birthday-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(birthdayConfig),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Configuração guardada com sucesso!" });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Erro ao guardar configuração" });
      }
    } catch {
      setMessage({ type: "error", text: "Erro de conexão" });
    } finally {
      setSaving(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    const filteredUsers = users.filter((u) =>
      targetType === "ALL" ? true : u.clientType === targetType
    );
    setSelectedUsers(filteredUsers.map((u) => u.id));
  };

  const deselectAllUsers = () => {
    setSelectedUsers([]);
  };

  const getFilteredUsers = () => {
    if (targetType === "ALL") return users;
    return users.filter((u) => u.clientType === targetType);
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
            Campanhas de Email
          </h1>
          <p className="text-gray-600">
            Envie emails promocionais e avisos para os seus clientes
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-700">{users.length}</div>
            <div className="text-sm text-gray-600">Clientes Verificados</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-purple-700">
              {users.filter((u) => u.clientType === "PREMIUM").length}
            </div>
            <div className="text-sm text-gray-600">Clientes Premium</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-blue-700">
              {users.filter((u) => u.clientType === "NORMAL").length}
            </div>
            <div className="text-sm text-gray-600">Clientes Normais</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-pink-700">{birthdayUsers.length}</div>
            <div className="text-sm text-gray-600">Aniversariantes Hoje</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab("nova")}
              className={`flex-1 px-4 py-4 text-sm font-medium transition whitespace-nowrap ${
                activeTab === "nova"
                  ? "bg-green-50 text-green-700 border-b-2 border-green-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Nova Campanha
            </button>
            <button
              onClick={() => setActiveTab("aniversarios")}
              className={`flex-1 px-4 py-4 text-sm font-medium transition whitespace-nowrap ${
                activeTab === "aniversarios"
                  ? "bg-green-50 text-green-700 border-b-2 border-green-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Aniversários ({birthdayUsers.length})
            </button>
            <button
              onClick={() => setActiveTab("config")}
              className={`flex-1 px-4 py-4 text-sm font-medium transition whitespace-nowrap ${
                activeTab === "config"
                  ? "bg-green-50 text-green-700 border-b-2 border-green-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Configurar Aniversário
            </button>
            <button
              onClick={() => setActiveTab("historico")}
              className={`flex-1 px-4 py-4 text-sm font-medium transition whitespace-nowrap ${
                activeTab === "historico"
                  ? "bg-green-50 text-green-700 border-b-2 border-green-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Histórico
            </button>
          </div>

          <div className="p-6">
            {/* Nova Campanha Tab */}
            {activeTab === "nova" && (
              <form onSubmit={handleSendCampaign} className="space-y-6">
                {/* Tipo de Campanha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tipo de Campanha
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(["PROMOCAO", "FERIAS", "HORARIOS", "PERSONALIZADO"] as CampaignType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setCampaignType(type)}
                        className={`p-4 rounded-lg border-2 text-center transition ${
                          campaignType === type
                            ? "border-green-700 bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="text-2xl mb-1">{campaignTypeIcons[type]}</div>
                        <div className="text-sm font-medium">{campaignTypeLabels[type]}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assunto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assunto do Email *
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={`Ex: ${campaignType === "PROMOCAO" ? "Promoção Especial - 20% de Desconto!" : "Aviso Importante"}`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Conteúdo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conteúdo do Email
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={5}
                    placeholder="Escreva aqui o conteúdo personalizado do email. Se deixar em branco, será usado o template padrão."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* URL do Flyer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL da Imagem/Flyer (opcional)
                  </label>
                  <input
                    type="url"
                    value={flyerUrl}
                    onChange={(e) => setFlyerUrl(e.target.value)}
                    placeholder="https://exemplo.com/imagem-promocao.jpg"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Destinatários */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Destinatários
                  </label>

                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="selectMode"
                        checked={selectMode === "group"}
                        onChange={() => {
                          setSelectMode("group");
                          setSelectedUsers([]);
                        }}
                        className="text-green-700 focus:ring-green-500"
                      />
                      <span className="text-sm">Por grupo</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="selectMode"
                        checked={selectMode === "individual"}
                        onChange={() => setSelectMode("individual")}
                        className="text-green-700 focus:ring-green-500"
                      />
                      <span className="text-sm">Selecionar individualmente</span>
                    </label>
                  </div>

                  {selectMode === "group" ? (
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setTargetType("ALL")}
                        className={`p-3 rounded-lg border-2 text-center transition ${
                          targetType === "ALL"
                            ? "border-green-700 bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="font-medium">Todos</div>
                        <div className="text-sm text-gray-500">{users.length} clientes</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTargetType("PREMIUM")}
                        className={`p-3 rounded-lg border-2 text-center transition ${
                          targetType === "PREMIUM"
                            ? "border-purple-700 bg-purple-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="font-medium text-purple-700">Premium</div>
                        <div className="text-sm text-gray-500">
                          {users.filter((u) => u.clientType === "PREMIUM").length} clientes
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTargetType("NORMAL")}
                        className={`p-3 rounded-lg border-2 text-center transition ${
                          targetType === "NORMAL"
                            ? "border-blue-700 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="font-medium text-blue-700">Normal</div>
                        <div className="text-sm text-gray-500">
                          {users.filter((u) => u.clientType === "NORMAL").length} clientes
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2 mb-3">
                        <button type="button" onClick={selectAllUsers} className="text-sm text-green-700 hover:text-green-800">
                          Selecionar todos
                        </button>
                        <span className="text-gray-300">|</span>
                        <button type="button" onClick={deselectAllUsers} className="text-sm text-gray-600 hover:text-gray-800">
                          Limpar seleção
                        </button>
                        <span className="text-gray-300">|</span>
                        <select
                          value={targetType}
                          onChange={(e) => setTargetType(e.target.value as typeof targetType)}
                          className="text-sm border border-gray-300 rounded px-2"
                        >
                          <option value="ALL">Filtrar: Todos</option>
                          <option value="PREMIUM">Filtrar: Premium</option>
                          <option value="NORMAL">Filtrar: Normal</option>
                        </select>
                      </div>

                      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                        {getFilteredUsers().map((user) => (
                          <label
                            key={user.id}
                            className={`flex items-center gap-3 p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                              selectedUsers.includes(user.id) ? "bg-green-50" : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => toggleUserSelection(user.id)}
                              className="rounded text-green-700 focus:ring-green-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-sm">{user.name}</div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                user.clientType === "PREMIUM"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {user.clientType}
                            </span>
                          </label>
                        ))}
                      </div>

                      {selectedUsers.length > 0 && (
                        <p className="mt-2 text-sm text-green-700">
                          {selectedUsers.length} cliente(s) selecionado(s)
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Submit */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={sending}
                    className="bg-green-700 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? "A enviar..." : "Enviar Campanha"}
                  </button>
                </div>
              </form>
            )}

            {/* Aniversários Tab */}
            {activeTab === "aniversarios" && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aniversariantes de Hoje
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Envie emails de parabéns personalizados com a oferta configurada.
                  </p>
                </div>

                {birthdayUsers.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-4xl mb-3">🎂</div>
                    <p className="text-gray-600">Não há aniversariantes hoje</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-6">
                      {birthdayUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 bg-pink-50 rounded-lg border border-pink-200"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-3xl">🎂</div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {user.name}
                                {user.age && (
                                  <span className="ml-2 text-sm text-pink-600 font-normal">
                                    ({user.age} anos)
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">{user.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!user.emailVerified && (
                              <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                                Não verificado
                              </span>
                            )}
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                user.clientType === "PREMIUM"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {user.clientType}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Resumo da oferta atual */}
                    <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-800 mb-2">Oferta Atual</h4>
                      <p className="text-green-700">{birthdayConfig.offerText}</p>
                      {birthdayConfig.promoCode && (
                        <p className="text-sm text-green-600 mt-1">
                          Código: <strong>{birthdayConfig.promoCode}</strong>
                        </p>
                      )}
                    </div>

                    <button
                      onClick={handleSendBirthdays}
                      disabled={sending || birthdayUsers.filter(u => u.emailVerified !== false).length === 0}
                      className="w-full bg-pink-600 text-white py-3 rounded-lg font-medium hover:bg-pink-700 transition disabled:opacity-50"
                    >
                      {sending ? "A enviar..." : `Enviar Parabéns (${birthdayUsers.filter(u => u.emailVerified !== false).length} verificados)`}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Configuração de Aniversário Tab */}
            {activeTab === "config" && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Configurar Email de Aniversário
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Personalize a mensagem e oferta que será enviada automaticamente aos aniversariantes.
                    O nome e idade do cliente são inseridos automaticamente.
                  </p>
                </div>

                {/* Ativar/Desativar */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Envio Automático</h4>
                    <p className="text-sm text-gray-600">Ativar envio automático de emails de aniversário</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBirthdayConfig({ ...birthdayConfig, enabled: !birthdayConfig.enabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      birthdayConfig.enabled ? "bg-green-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        birthdayConfig.enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Texto da Oferta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Texto da Oferta *
                  </label>
                  <input
                    type="text"
                    value={birthdayConfig.offerText}
                    onChange={(e) => setBirthdayConfig({ ...birthdayConfig, offerText: e.target.value })}
                    placeholder="Ex: 10% de desconto, Massagem grátis, Vale de 15€"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Esta é a oferta principal que aparece destacada no email
                  </p>
                </div>

                {/* Código Promocional */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código Promocional (opcional)
                  </label>
                  <input
                    type="text"
                    value={birthdayConfig.promoCode || ""}
                    onChange={(e) => setBirthdayConfig({ ...birthdayConfig, promoCode: e.target.value || null })}
                    placeholder="Ex: ANIVERSARIO10, PARABENS2024"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent uppercase"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Se definido, será mostrado em destaque no email
                  </p>
                </div>

                {/* Validade da Oferta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Validade da Oferta (dias)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={birthdayConfig.offerValidDays}
                    onChange={(e) => setBirthdayConfig({ ...birthdayConfig, offerValidDays: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Número de dias que a oferta é válida (0 = sem validade específica)
                  </p>
                </div>

                {/* URL da Imagem */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL da Imagem/Flyer (opcional)
                  </label>
                  <input
                    type="url"
                    value={birthdayConfig.imageUrl || ""}
                    onChange={(e) => setBirthdayConfig({ ...birthdayConfig, imageUrl: e.target.value || null })}
                    placeholder="https://res.cloudinary.com/.../imagem-aniversario.jpg"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Cole o URL de uma imagem do Cloudinary ou outra fonte
                  </p>
                  {birthdayConfig.imageUrl && (
                    <div className="mt-2">
                      <img
                        src={birthdayConfig.imageUrl}
                        alt="Preview"
                        className="max-w-xs rounded-lg border border-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Mensagem Personalizada */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem Adicional (opcional)
                  </label>
                  <textarea
                    value={birthdayConfig.customMessage || ""}
                    onChange={(e) => setBirthdayConfig({ ...birthdayConfig, customMessage: e.target.value || null })}
                    rows={3}
                    placeholder="Ex: Esperamos vê-lo em breve! Este é o nosso presente de aniversário para si."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Texto adicional que aparece abaixo da oferta
                  </p>
                </div>

                {/* Preview */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-3">Preview do Email</h4>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-center">
                      <p className="text-3xl mb-2">🎂</p>
                      <h3 className="text-xl font-bold text-green-800">Feliz Aniversário, João!</h3>
                      <p className="text-sm text-gray-500">Parabéns pelos 35 anos!</p>
                    </div>
                    <p className="text-center mt-4 text-gray-700">
                      Em nome de toda a equipa das Terapias Manuais Samuel, desejamos-lhe um dia muito especial!
                    </p>
                    <p className="text-center mt-2">Para celebrar os seus <strong>35 anos</strong>, oferecemos-lhe:</p>
                    <p className="text-center text-green-700 font-bold text-lg mt-2">{birthdayConfig.offerText}</p>
                    {birthdayConfig.promoCode && (
                      <div className="text-center mt-3">
                        <span className="inline-block bg-green-800 text-white px-4 py-2 rounded-lg">
                          <span className="text-xs opacity-80">USE O CÓDIGO</span>
                          <br />
                          <span className="font-bold text-lg">{birthdayConfig.promoCode}</span>
                        </span>
                      </div>
                    )}
                    {birthdayConfig.customMessage && (
                      <p className="text-center mt-4 text-gray-500 italic">{birthdayConfig.customMessage}</p>
                    )}
                    {birthdayConfig.offerValidDays > 0 && (
                      <p className="text-center mt-4 text-xs text-gray-400">
                        Esta oferta é válida durante {birthdayConfig.offerValidDays} dias.
                      </p>
                    )}
                  </div>
                </div>

                {/* Guardar */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSaveConfig}
                    disabled={saving}
                    className="bg-green-700 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-800 transition disabled:opacity-50"
                  >
                    {saving ? "A guardar..." : "Guardar Configuração"}
                  </button>
                </div>
              </div>
            )}

            {/* Histórico Tab */}
            {activeTab === "historico" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Campanhas Enviadas
                </h3>

                {campaigns.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">Nenhuma campanha enviada ainda</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {campaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-2xl">
                            {campaignTypeIcons[campaign.type as keyof typeof campaignTypeIcons] || "📧"}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{campaign.subject}</div>
                            <div className="text-sm text-gray-500">
                              {campaignTypeLabels[campaign.type as keyof typeof campaignTypeLabels] || campaign.type}
                              {campaign.targetType && ` • ${campaign.targetType}`}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-700">
                            {campaign.sentTo} enviados
                          </div>
                          <div className="text-xs text-gray-500">
                            {campaign.sentAt
                              ? new Date(campaign.sentAt).toLocaleString("pt-PT")
                              : new Date(campaign.createdAt).toLocaleString("pt-PT")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Info sobre automação */}
        {activeTab === "config" && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Automação Diária</h4>
            <p className="text-sm text-blue-700 mb-2">
              Para enviar emails de aniversário automaticamente todos os dias às 9h, configure um Vercel Cron Job.
            </p>
            <p className="text-xs text-blue-600 font-mono bg-blue-100 p-2 rounded">
              POST /api/email-campaigns/birthdays (com CRON_SECRET no header Authorization)
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
