"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import type { Event, EventUser } from "@/types/database";

interface Stats {
  users: number;
  swipes: number;
  matches: number;
}

export function EventDetail({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [users, setUsers] = useState<EventUser[]>([]);
  const [stats, setStats] = useState<Stats>({ users: 0, swipes: 0, matches: 0 });
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

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

  async function handleSeed() {
    setSeeding(true);
    try {
      const { count } = await api.admin.seedEvent(eventId);
      toast.success(`${count} usuários de teste criados`);
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
              onClick={handleSeed}
              disabled={seeding}
              className="rounded-2xl bg-purple/5 border border-purple/20 py-4 px-5 text-sm text-purple font-medium hover:bg-purple/10 active:scale-[0.98] transition-all disabled:opacity-50 text-left"
            >
              {seeding ? "Populando..." : "🧪 Popular com 10♂ + 10♀ (teste)"}
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

          {/* QR Code */}
          <div className="rounded-2xl bg-card border border-border p-6 mb-6">
            <h2 className="font-bold mb-1">QR Code do Evento</h2>
            <p className="text-xs text-muted-foreground mb-4 break-all">{eventUrl}</p>
            <div className="flex justify-center p-6 bg-white rounded-xl">
              <QRCode value={eventUrl} size={180} level="M" />
            </div>
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
