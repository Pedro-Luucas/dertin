"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useSessionStore } from "@/stores/session";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import type { Event, EventUser } from "@/types/database";

interface Stats {
  users: number;
  swipes: number;
  matches: number;
}

type SeedGender = "mixed" | "male" | "female";
type SeedArchetype = "mixed" | "enthusiastic" | "shy" | "normal";

export function EventDetail({ eventId }: { eventId: string }) {
  const router = useRouter();
  const setAdminReturnEventId = useSessionStore((s) => s.setAdminReturnEventId);
  const [event, setEvent] = useState<Event | null>(null);
  const [users, setUsers] = useState<EventUser[]>([]);
  const [stats, setStats] = useState<Stats>({ users: 0, swipes: 0, matches: 0 });
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedOpen, setSeedOpen] = useState(false);
  const [seedCount, setSeedCount] = useState(20);
  const [seedGender, setSeedGender] = useState<SeedGender>("mixed");
  const [seedArchetype, setSeedArchetype] = useState<SeedArchetype>("mixed");
  const [seedWithSwipes, setSeedWithSwipes] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  function handleJoinAsParticipant() {
    if (!event) return;
    setAdminReturnEventId(eventId);
    router.push(`/event/${event.slug}`);
  }

  async function loadEvent() {
    try {
      const data = await api.admin.getEvent(eventId);
      setEvent(data.event);
      setUsers(data.users);
      setStats(data.stats);
      console.log("[EventDetail] Loaded event:", data.event.title);
    } catch (err) {
      console.error("[EventDetail] Error loading event:", err);
      toast.error("Erro ao carregar evento");
      router.push("/admin");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  async function toggleBan(userId: string, currentlyBanned: boolean) {
    try {
      await api.admin.toggleBan(eventId, userId, !currentlyBanned);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_banned: !currentlyBanned } : u))
      );
      toast.success(currentlyBanned ? "Usuário desbanido" : "Usuário banido");
    } catch (err) {
      console.error("[EventDetail] Error toggling ban:", err);
      toast.error("Erro ao alterar ban");
    }
  }

  async function handleDownloadQR(format: "png" | "svg" = "png") {
    if (!event) return;
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) {
      toast.error("QR Code não encontrado");
      return;
    }

    const clone = svg.cloneNode(true) as SVGSVGElement;
    if (!clone.getAttribute("xmlns")) {
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    }
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);
    const fileBase = `qrcode-${event.slug}`;

    if (format === "svg") {
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      triggerDownload(URL.createObjectURL(blob), `${fileBase}.svg`, true);
      return;
    }

    try {
      const exportSize = 1024;
      const padding = 64;
      const canvasSize = exportSize + padding * 2;

      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = canvasSize;
            canvas.height = canvasSize;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Canvas 2D context indisponível");

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvasSize, canvasSize);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, padding, padding, exportSize, exportSize);

            canvas.toBlob((blob) => {
              if (!blob) {
                reject(new Error("Falha ao gerar PNG"));
                return;
              }
              triggerDownload(URL.createObjectURL(blob), `${fileBase}.png`, true);
              URL.revokeObjectURL(url);
              resolve();
            }, "image/png");
          } catch (e) {
            URL.revokeObjectURL(url);
            reject(e);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("Falha ao carregar SVG"));
        };
        img.src = url;
      });

      toast.success("QR Code baixado");
    } catch (err) {
      console.error("[EventDetail] Error downloading QR:", err);
      toast.error("Erro ao baixar QR Code");
    }
  }

  function triggerDownload(href: string, filename: string, revoke: boolean) {
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (revoke) {
      setTimeout(() => URL.revokeObjectURL(href), 1000);
    }
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      const result = await api.admin.seedEvent(eventId, {
        count: seedCount,
        gender: seedGender,
        archetype: seedArchetype,
        with_swipes: seedWithSwipes,
      });
      const extras: string[] = [];
      if (result.swipes) extras.push(`${result.swipes} swipes`);
      if (result.matches) extras.push(`${result.matches} matches`);
      const suffix = extras.length ? ` (+ ${extras.join(", ")})` : "";
      toast.success(`${result.count} usuários criados${suffix}`);
      setSeedOpen(false);
      await loadEvent();
    } catch (err) {
      console.error("[EventDetail] Error seeding event:", err);
      toast.error("Erro ao popular evento");
    } finally {
      setSeeding(false);
    }
  }

  if (loading || !event) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-purple border-t-transparent" />
      </div>
    );
  }

  const eventUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/event/${event.slug}`;

  return (
    <div className="flex flex-1 flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-border">
        <button
          onClick={() => router.push("/admin")}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold">{event.title}</h1>
          <p className="text-sm text-muted-foreground">{event.venue_name}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-2xl bg-card border border-border p-5 text-center">
              <p className="text-3xl font-black text-purple">{stats.users}</p>
              <p className="text-xs text-muted-foreground mt-1">Usuários</p>
            </div>
            <div className="rounded-2xl bg-card border border-border p-5 text-center">
              <p className="text-3xl font-black text-purple">{stats.swipes}</p>
              <p className="text-xs text-muted-foreground mt-1">Swipes</p>
            </div>
            <div className="rounded-2xl bg-card border border-border p-5 text-center">
              <p className="text-3xl font-black text-purple">{stats.matches}</p>
              <p className="text-xs text-muted-foreground mt-1">Matches</p>
            </div>
          </div>

          {/* Actions row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setSeedOpen((v) => !v)}
              className="rounded-2xl bg-purple/5 border border-purple/20 py-4 px-5 text-sm text-purple font-medium hover:bg-purple/10 active:scale-[0.98] transition-all text-left flex items-center justify-between"
            >
              <span>🧪 Popular com perfis de teste</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className={`transition-transform ${seedOpen ? "rotate-180" : ""}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <div className="rounded-2xl bg-card border border-border py-4 px-5 text-sm text-muted-foreground">
              <span className="text-foreground font-medium">/{event.slug}</span>
              <span className="ml-2">•</span>
              <span className="ml-2">
                {new Date(event.starts_at).toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          {/* Seed customization panel */}
          {seedOpen && (
            <div className="rounded-2xl bg-card border border-border p-5 mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">Configurar seed</h3>
                <span className="text-xs text-muted-foreground">
                  fotos via randomuser.me + fallbacks
                </span>
              </div>

              {/* Count */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Quantidade
                  </label>
                  <span className="text-sm font-bold text-purple">{seedCount}</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={100}
                  step={1}
                  value={seedCount}
                  onChange={(e) => setSeedCount(Number(e.target.value))}
                  className="w-full accent-purple"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>2</span>
                  <span>100</span>
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Gênero
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { value: "mixed", label: "Misto" },
                      { value: "male", label: "♂ Homens" },
                      { value: "female", label: "♀ Mulheres" },
                    ] as Array<{ value: SeedGender; label: string }>
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSeedGender(opt.value)}
                      className={`rounded-xl py-2.5 px-3 text-xs font-medium transition-all ${
                        seedGender === opt.value
                          ? "bg-purple text-white"
                          : "bg-background border border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Archetype */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Arquétipo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: "mixed", label: "Misto", emoji: "🎲" },
                      { value: "enthusiastic", label: "Entusiasmado", emoji: "✨" },
                      { value: "normal", label: "Normal", emoji: "😎" },
                      { value: "shy", label: "Tímido", emoji: "🫣" },
                    ] as Array<{ value: SeedArchetype; label: string; emoji: string }>
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSeedArchetype(opt.value)}
                      className={`rounded-xl py-2.5 px-3 text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                        seedArchetype === opt.value
                          ? "bg-purple text-white"
                          : "bg-background border border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>{opt.emoji}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* With swipes */}
              <label className="flex items-center justify-between rounded-xl bg-background border border-border px-4 py-3 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">Gerar swipes + matches</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Cria swipes cruzados aleatórios entre os perfis seed
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={seedWithSwipes}
                  onChange={(e) => setSeedWithSwipes(e.target.checked)}
                  className="w-5 h-5 accent-purple cursor-pointer"
                />
              </label>

              {/* Submit */}
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="w-full rounded-xl bg-purple text-white py-3 text-sm font-bold hover:bg-purple-light active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {seeding ? "Populando..." : `Criar ${seedCount} perfis`}
              </button>
            </div>
          )}

          {/* QR Code */}
          <div className="rounded-2xl bg-card border border-border p-6 mb-6">
            <h2 className="font-bold mb-1">QR Code do Evento</h2>
            <p className="text-xs text-muted-foreground mb-4 break-all">{eventUrl}</p>
            <div ref={qrRef} className="flex justify-center p-6 bg-white rounded-xl">
              <QRCode value={eventUrl} size={180} level="M" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => handleDownloadQR("png")}
                className="rounded-xl bg-purple text-white py-3 px-4 text-sm font-bold hover:bg-purple-light active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                Baixar PNG
              </button>
              <button
                onClick={() => handleDownloadQR("svg")}
                className="rounded-xl bg-background border border-border text-foreground py-3 px-4 text-sm font-medium hover:bg-muted/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                Baixar SVG
              </button>
            </div>

            <button
              onClick={handleJoinAsParticipant}
              className="mt-3 w-full rounded-xl bg-purple/10 border border-purple/30 py-3.5 px-5 text-sm text-purple font-bold hover:bg-purple/15 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
              </svg>
              Entrar no evento como participante
            </button>
            <p className="mt-2 text-[11px] text-muted-foreground text-center">
              Cria um perfil normal no evento. Você poderá voltar ao painel a qualquer momento.
            </p>
          </div>

          {/* Users list */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-bold">Usuários ({users.length})</h2>
            </div>
            <div className="divide-y divide-border/50 max-h-[400px] overflow-y-auto">
              {users.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                  Nenhum usuário ainda
                </div>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {user.first_name}, {user.age}
                        {user.is_banned && (
                          <span className="ml-2 text-xs text-destructive font-normal">(banido)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.gender}</p>
                    </div>
                    <button
                      onClick={() => toggleBan(user.id, user.is_banned)}
                      className={`text-xs px-4 py-1.5 rounded-full font-medium transition-colors ${
                        user.is_banned
                          ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                          : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                      }`}
                    >
                      {user.is_banned ? "Desbanir" : "Banir"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
