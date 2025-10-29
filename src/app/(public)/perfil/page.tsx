"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Profile {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  birthDate: string | null;
  profession: string | null;
  addressCity: string | null;
  addressPost: string | null;
  createdAt: string;
}

export default function PerfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    birthDate: "",
    profession: "",
    addressCity: "",
    addressPost: "",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.status === 401) {
        router.push("/auth/login");
        return;
      }
      if (!res.ok) throw new Error("Erro ao carregar perfil");

      const data = await res.json();
      setProfile(data);
      setFormData({
        name: data.name || "",
        phone: data.phone || "",
        birthDate: data.birthDate ? data.birthDate.split("T")[0] : "",
        profession: data.profession || "",
        addressCity: data.addressCity || "",
        addressPost: data.addressPost || "",
      });
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
      setError("Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validar passwords se a secção estiver visível
    if (showPasswordSection) {
      if (!passwordData.oldPassword) {
        setError("Por favor, introduza a palavra-passe atual");
        return;
      }
      if (!passwordData.newPassword) {
        setError("Por favor, introduza a nova palavra-passe");
        return;
      }
      if (passwordData.newPassword.length < 6) {
        setError("A nova palavra-passe deve ter pelo menos 6 caracteres");
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError("As palavras-passe não coincidem");
        return;
      }
    }

    setSaving(true);

    try {
      const updateData: any = {
        name: formData.name,
        phone: formData.phone || null,
        birthDate: formData.birthDate ? new Date(formData.birthDate).toISOString() : null,
        profession: formData.profession || null,
        addressCity: formData.addressCity || null,
        addressPost: formData.addressPost || null,
      };

      if (showPasswordSection && passwordData.newPassword) {
        updateData.oldPassword = passwordData.oldPassword;
        updateData.password = passwordData.newPassword;
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao atualizar perfil");
      }

      const updated = await res.json();
      setProfile(updated);
      setSuccess("Perfil atualizado com sucesso!");
      setEditing(false);
      setShowPasswordSection(false);
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Erro ao carregar perfil</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-gray-100 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
          <Link href="/dashboard" className="hover:text-green-700">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Perfil</span>
        </div>

        {/* Header */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-500 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                <p className="text-gray-600">{profile.email}</p>
                <span className="inline-block mt-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  {profile.role === "ADMIN" ? "Administrador" : "Cliente"}
                </span>
              </div>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition"
              >
                Editar Perfil
              </button>
            )}
          </div>
        </div>

        {/* Mensagens */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Formulário / Visualização */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 p-8">
          {editing ? (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="+351 XXX XXX XXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) =>
                      setFormData({ ...formData, birthDate: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Profissão
                  </label>
                  <input
                    type="text"
                    value={formData.profession}
                    onChange={(e) =>
                      setFormData({ ...formData, profession: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={formData.addressCity}
                    onChange={(e) =>
                      setFormData({ ...formData, addressCity: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    value={formData.addressPost}
                    onChange={(e) =>
                      setFormData({ ...formData, addressPost: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="XXXX-XXX"
                  />
                </div>

                <div className="md:col-span-2 border-t border-gray-200 pt-6 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowPasswordSection(!showPasswordSection)}
                    className="text-green-700 font-semibold hover:text-green-800 mb-4"
                  >
                    {showPasswordSection ? "✕ Cancelar alteração de palavra-passe" : "🔒 Alterar palavra-passe"}
                  </button>

                  {showPasswordSection && (
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Palavra-passe Atual *
                        </label>
                        <input
                          type="password"
                          value={passwordData.oldPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, oldPassword: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="••••••••"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Nova Palavra-passe *
                        </label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, newPassword: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="••••••••"
                          minLength={6}
                        />
                        <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Confirmar Nova Palavra-passe *
                        </label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition disabled:opacity-50"
                >
                  {saving ? "A guardar..." : "Guardar Alterações"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setShowPasswordSection(false);
                    setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
                    setError("");
                    setSuccess("");
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField label="Email" value={profile.email} />
                <InfoField label="Telefone" value={profile.phone || "Não definido"} />
                <InfoField
                  label="Data de Nascimento"
                  value={
                    profile.birthDate
                      ? new Date(profile.birthDate).toLocaleDateString("pt-PT")
                      : "Não definida"
                  }
                />
                <InfoField label="Profissão" value={profile.profession || "Não definida"} />
                <InfoField label="Cidade" value={profile.addressCity || "Não definida"} />
                <InfoField label="Código Postal" value={profile.addressPost || "Não definido"} />
              </div>

              <div className="pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Membro desde {new Date(profile.createdAt).toLocaleDateString("pt-PT")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-600 mb-1">{label}</p>
      <p className="text-gray-900">{value}</p>
    </div>
  );
}
