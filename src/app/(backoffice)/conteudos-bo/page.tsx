"use client";

import { useEffect, useState } from "react";

interface SiteSettings {
  id: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroImageUrl: string | null;
  heroImagePublicId: string | null;
  benefitsTitle: string;
  benefitsSubtitle: string;
  benefit1Title: string;
  benefit1Description: string;
  benefit2Title: string;
  benefit2Description: string;
  benefit3Title: string;
  benefit3Description: string;
  ctaTitle: string;
  ctaDescription: string;
  aboutTitle: string;
  aboutText1: string;
  aboutText2: string;
  footerDescription: string;
  footerEmail: string;
  footerPhone: string;
}

export default function ConteudosBackoffice() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"home" | "about" | "footer">("home");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/site-settings");
      if (!res.ok) throw new Error("Erro ao carregar configurações");
      const data = await res.json();
      setSettings(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!settings) return;

    try {
      const form = new FormData();
      form.append("file", file);

      if (settings.heroImagePublicId) {
        form.append("oldPublicId", settings.heroImagePublicId);
      }

      setUploading(true);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      setUploading(false);

      if (data.url && data.public_id) {
        setSettings({
          ...settings,
          heroImageUrl: data.url,
          heroImagePublicId: data.public_id,
        });
      } else {
        setError("Erro no upload da imagem.");
      }
    } catch (err) {
      console.error("Falha no upload:", err);
      setError("Falha no upload da imagem.");
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!settings?.heroImagePublicId) return;

    if (!confirm("Tem a certeza que deseja remover esta imagem?")) return;

    try {
      const form = new FormData();
      form.append("oldPublicId", settings.heroImagePublicId);
      await fetch("/api/upload", { method: "POST", body: form });

      setSettings({
        ...settings,
        heroImageUrl: null,
        heroImagePublicId: null,
      });
    } catch (err) {
      console.error("Erro ao remover imagem:", err);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch("/api/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao guardar");
      }

      setSuccess("Configurações guardadas com sucesso!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof SiteSettings, value: string) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Erro ao carregar configurações</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-green-800 mb-1">
              Gestão de Conteúdos
            </h1>
            <p className="text-gray-600 text-sm">
              Edite os textos e imagens do site público
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-green-700 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-green-800 transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                A guardar...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Guardar Alterações
              </>
            )}
          </button>
        </div>

        {/* Mensagens */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("home")}
            className={`px-6 py-3 font-semibold text-sm transition ${
              activeTab === "home"
                ? "text-green-700 border-b-2 border-green-700"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Página Inicial
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`px-6 py-3 font-semibold text-sm transition ${
              activeTab === "about"
                ? "text-green-700 border-b-2 border-green-700"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Sobre
          </button>
          <button
            onClick={() => setActiveTab("footer")}
            className={`px-6 py-3 font-semibold text-sm transition ${
              activeTab === "footer"
                ? "text-green-700 border-b-2 border-green-700"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Rodapé
          </button>
        </div>

        {/* Página Inicial */}
        {activeTab === "home" && (
          <div className="space-y-6">
            {/* Hero Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Secção Principal (Hero)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Título Principal
                    </label>
                    <input
                      type="text"
                      value={settings.heroTitle}
                      onChange={(e) => handleChange("heroTitle", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Subtítulo
                    </label>
                    <input
                      type="text"
                      value={settings.heroSubtitle}
                      onChange={(e) => handleChange("heroSubtitle", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Descrição
                    </label>
                    <textarea
                      value={settings.heroDescription}
                      onChange={(e) => handleChange("heroDescription", e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Imagem Principal
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {settings.heroImageUrl ? (
                      <div className="space-y-3">
                        <img
                          src={settings.heroImageUrl}
                          alt="Hero"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Remover imagem
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-gray-500 mb-2">
                          {uploading ? "A enviar..." : "Nenhuma imagem selecionada"}
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleImageUpload(e.target.files[0]);
                      }}
                      className="mt-2 text-sm"
                      disabled={uploading}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Recomendado: 600x400 pixels. Se não definir, será usada a imagem padrão.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefícios Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Secção Benefícios
              </h2>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Título da Secção
                    </label>
                    <input
                      type="text"
                      value={settings.benefitsTitle}
                      onChange={(e) => handleChange("benefitsTitle", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Subtítulo
                    </label>
                    <input
                      type="text"
                      value={settings.benefitsSubtitle}
                      onChange={(e) => handleChange("benefitsSubtitle", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Benefício 1 */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="text-sm font-bold text-blue-800 mb-3">Benefício 1</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Título</label>
                      <input
                        type="text"
                        value={settings.benefit1Title}
                        onChange={(e) => handleChange("benefit1Title", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Descrição</label>
                      <textarea
                        value={settings.benefit1Description}
                        onChange={(e) => handleChange("benefit1Description", e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Benefício 2 */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="text-sm font-bold text-green-800 mb-3">Benefício 2</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Título</label>
                      <input
                        type="text"
                        value={settings.benefit2Title}
                        onChange={(e) => handleChange("benefit2Title", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Descrição</label>
                      <textarea
                        value={settings.benefit2Description}
                        onChange={(e) => handleChange("benefit2Description", e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Benefício 3 */}
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h3 className="text-sm font-bold text-purple-800 mb-3">Benefício 3</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Título</label>
                      <input
                        type="text"
                        value={settings.benefit3Title}
                        onChange={(e) => handleChange("benefit3Title", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Descrição</label>
                      <textarea
                        value={settings.benefit3Description}
                        onChange={(e) => handleChange("benefit3Description", e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                Secção Call to Action (CTA)
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={settings.ctaTitle}
                    onChange={(e) => handleChange("ctaTitle", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={settings.ctaDescription}
                    onChange={(e) => handleChange("ctaDescription", e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Página Sobre */}
        {activeTab === "about" && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Página Sobre
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Título da Página
                </label>
                <input
                  type="text"
                  value={settings.aboutTitle}
                  onChange={(e) => handleChange("aboutTitle", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Primeiro Parágrafo
                </label>
                <textarea
                  value={settings.aboutText1}
                  onChange={(e) => handleChange("aboutText1", e.target.value)}
                  rows={5}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Segundo Parágrafo
                </label>
                <textarea
                  value={settings.aboutText2}
                  onChange={(e) => handleChange("aboutText2", e.target.value)}
                  rows={5}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {activeTab === "footer" && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Rodapé (Footer)
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={settings.footerDescription}
                  onChange={(e) => handleChange("footerDescription", e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Email de Contacto
                  </label>
                  <input
                    type="email"
                    value={settings.footerEmail}
                    onChange={(e) => handleChange("footerEmail", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={settings.footerPhone}
                    onChange={(e) => handleChange("footerPhone", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
