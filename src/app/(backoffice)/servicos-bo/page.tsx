"use client";

import { useState, useEffect } from "react";

interface Service {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  durationMin: number;
  active: boolean;
  imageUrl?: string | null;
  imagePublicId?: string | null;
}

export default function ServicosBackofficePage() {
  const [servicos, setServicos] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Service | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    priceCents: "",
    durationMin: "",
    active: true,
    imageUrl: "",
    imagePublicId: "",
  });

  // 🔹 Carregar serviços
  const loadServices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/services");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao carregar serviços");
      if (Array.isArray(data)) setServicos(data);
      else setServicos([]);
    } catch (err) {
      console.error("❌ Erro no fetch /api/admin/services:", err);
      setServicos([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadServices();
  }, []);

  // 🔹 Upload de imagem para o Cloudinary (com eliminação automática da anterior)
  const handleImageUpload = async (file: File) => {
    try {
      const form = new FormData();
      form.append("file", file);

      // Se já existe uma imagem anterior, envia também o oldPublicId
      if (formData.imagePublicId) {
        form.append("oldPublicId", formData.imagePublicId);
      }

      setUploading(true);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      setUploading(false);

      if (data.url && data.public_id) {
        // Atualiza formData com nova imagem
        setFormData({
          ...formData,
          imageUrl: data.url,
          imagePublicId: data.public_id,
        });
      } else {
        alert("❌ Erro no upload da imagem.");
      }
    } catch (error) {
      console.error("❌ Falha na ligação ao Cloudinary:", error);
      alert("❌ Falha na ligação ao Cloudinary.");
      setUploading(false);
    }
  };

  // 🔹 Submeter formulário (criar/editar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editing ? "PUT" : "POST";
    const url = editing
      ? `/api/admin/services/${editing.id}`
      : "/api/admin/services";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        priceCents: Number(formData.priceCents),
        durationMin: Number(formData.durationMin),
      }),
    });

    if (res.ok) {
      // Limpar form e recarregar
      setFormData({
        name: "",
        description: "",
        priceCents: "",
        durationMin: "",
        active: true,
        imageUrl: "",
        imagePublicId: "",
      });
      setEditing(null);
      loadServices();
    } else {
      alert("❌ Erro ao gravar serviço");
    }
  };

  // 🔹 Eliminar serviço
  const handleDelete = async (id: string) => {
    if (!confirm("Tem a certeza que quer eliminar este serviço?")) return;
    const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    if (res.ok) loadServices();
  };

  // 🔹 Editar serviço
  const handleEdit = (s: Service) => {
    setEditing(s);
    setFormData({
      name: s.name,
      description: s.description,
      priceCents: (s.priceCents / 100).toString(),
      durationMin: s.durationMin.toString(),
      active: s.active,
      imageUrl: s.imageUrl || "",
      imagePublicId: s.imagePublicId || "",
    });
  };

  // 🔹 Atualizar campos do formulário
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = "checked" in e.target ? e.target.checked : false;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-green-800 mb-6">
          Gestão de Serviços
        </h1>

        {/* Formulário */}
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-lg p-6 mb-10"
        >
          <h2 className="text-xl font-semibold mb-4">
            {editing ? "Editar Serviço" : "Novo Serviço"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nome
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 mt-1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Preço (€)
              </label>
              <input
                type="number"
                name="priceCents"
                value={formData.priceCents}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 mt-1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Duração (minutos)
              </label>
              <input
                type="number"
                name="durationMin"
                value={formData.durationMin}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 mt-1"
                required
              />
            </div>

            <div className="flex items-center mt-6">
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleChange}
                className="h-4 w-4 text-green-700 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">Ativo</label>
            </div>

            {/* Upload de Imagem (Cloudinary) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Imagem do Serviço
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleImageUpload(e.target.files[0]);
                }}
                className="mt-2"
              />
              {uploading && (
                <p className="text-sm text-gray-500 mt-2">
                  A enviar imagem para o Cloudinary...
                </p>
              )}
              {formData.imageUrl && (
                <div className="mt-3">
                  <img
                    src={formData.imageUrl}
                    alt="Pré-visualização"
                    className="w-48 h-32 object-cover rounded-md border bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        confirm(
                          "Tem a certeza que deseja remover esta imagem?"
                        )
                      ) {
                        const form = new FormData();
                        form.append("oldPublicId", formData.imagePublicId);
                        await fetch("/api/upload", {
                          method: "POST",
                          body: form,
                        });
                        setFormData({
                          ...formData,
                          imageUrl: "",
                          imagePublicId: "",
                        });
                      }
                    }}
                    className="mt-2 text-sm text-red-600 hover:underline"
                  >
                    Remover imagem
                  </button>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Descrição
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 mt-1 h-24"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-4">
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setFormData({
                    name: "",
                    description: "",
                    priceCents: "",
                    durationMin: "",
                    active: true,
                    imageUrl: "",
                    imagePublicId: "",
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2 bg-green-700 text-white font-semibold rounded-md hover:bg-green-800"
            >
              {editing ? "Guardar Alterações" : "Adicionar Serviço"}
            </button>
          </div>
        </form>

        {/* Listagem */}
        {loading ? (
          <p className="text-gray-500">A carregar serviços...</p>
        ) : Array.isArray(servicos) && servicos.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {servicos.map((s) => (
              <div
                key={s.id}
                className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
              >
                {s.imageUrl && (
                  <img
                    src={s.imageUrl}
                    alt={s.name}
                    className="w-full h-40 object-cover rounded-md mb-3 bg-gray-100"
                  />
                )}
                <h2 className="text-lg font-semibold text-green-800 mb-1">
                  {s.name}
                </h2>
                <p className="text-gray-600 text-sm mb-2 line-clamp-3">
                  {s.description}
                </p>
                <p className="font-semibold text-gray-800">
                  {(s.priceCents / 100).toFixed(2)} €
                </p>
                <p className="text-sm text-gray-500 mb-3">
                  {s.durationMin} minutos
                </p>
                <div className="flex justify-between text-sm">
                  <button
                    onClick={() => handleEdit(s)}
                    className="text-blue-600 hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Nenhum serviço encontrado.</p>
        )}
      </div>
    </main>
  );
}
