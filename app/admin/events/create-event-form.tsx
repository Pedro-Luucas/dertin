"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export function CreateEventForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    venue_name: "",
    starts_at: "",
    ends_at: "",
  });

  const [coverFile, setCoverFile] = useState<File | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.venue_name || !form.starts_at || !form.ends_at) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);

    try {
      const slug = form.slug || generateSlug(form.title);
      let cover_image_url: string | null = null;

      if (coverFile) {
        const { url } = await api.admin.uploadCover(coverFile, slug);
        cover_image_url = url;
        console.log("[CreateEventForm] Cover uploaded:", url);
      }

      await api.admin.createEvent({
        title: form.title,
        slug,
        venue_name: form.venue_name,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
        cover_image_url,
      });

      toast.success("Evento criado com sucesso!");
      router.push("/admin");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao criar evento";
      console.error("[CreateEventForm] Submit error:", err);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-border">
        <button
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">Novo Evento</h1>
      </div>

      <div className="flex-1 px-6 py-6">
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-5">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Título *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Nome do evento"
              className="mt-1.5 w-full rounded-xl bg-secondary border border-border px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple/50 focus:border-purple/50 transition-all"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Slug (URL)</label>
            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              placeholder={form.title ? generateSlug(form.title) : "meu-evento"}
              className="mt-1.5 w-full rounded-xl bg-secondary border border-border px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple/50 focus:border-purple/50 transition-all font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground/60 mt-1.5">
              Deixe vazio para gerar automaticamente
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Local *</label>
            <input
              name="venue_name"
              value={form.venue_name}
              onChange={handleChange}
              placeholder="Nome do local"
              className="mt-1.5 w-full rounded-xl bg-secondary border border-border px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple/50 focus:border-purple/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Início *</label>
              <input
                name="starts_at"
                type="datetime-local"
                value={form.starts_at}
                onChange={handleChange}
                className="mt-1.5 w-full rounded-xl bg-secondary border border-border px-4 py-3.5 text-foreground focus:outline-none focus:ring-2 focus:ring-purple/50 focus:border-purple/50 transition-all text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Fim *</label>
              <input
                name="ends_at"
                type="datetime-local"
                value={form.ends_at}
                onChange={handleChange}
                className="mt-1.5 w-full rounded-xl bg-secondary border border-border px-4 py-3.5 text-foreground focus:outline-none focus:ring-2 focus:ring-purple/50 focus:border-purple/50 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Imagem de capa</label>
            <div className="mt-1.5 rounded-xl bg-secondary border border-dashed border-border/80 p-4 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-purple/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-purple hover:file:bg-purple/20 file:cursor-pointer"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-purple py-4 text-white text-base font-bold hover:bg-purple-dark active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-purple/20 mt-4"
          >
            {loading ? "Criando..." : "Criar evento"}
          </button>
        </form>
      </div>
    </div>
  );
}
