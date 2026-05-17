"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import type { Event } from "@/types/database";

export function AdminDashboard() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadEvents() {
    try {
      const { events: data } = await api.admin.listEvents();
      setEvents(data);
    } catch (err) {
      console.error("[AdminDashboard] Error loading events:", err);
      toast.error("Erro ao carregar eventos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-purple border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border">
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            <span className="text-purple">dertin</span>
            <span className="text-muted-foreground font-normal text-sm ml-3">admin</span>
          </h1>
        </div>
        <button
          onClick={() => router.push("/admin/events")}
          className="rounded-xl bg-purple px-5 py-2.5 text-sm text-white font-semibold hover:bg-purple-dark active:scale-95 transition-all"
        >
          + Novo evento
        </button>
      </div>

      <div className="flex-1 px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-purple/10 flex items-center justify-center mb-4">
                <span className="text-3xl">🎉</span>
              </div>
              <h2 className="text-lg font-bold">Nenhum evento ainda</h2>
              <p className="mt-2 text-sm text-muted-foreground">Crie seu primeiro evento para começar</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {events.map((event) => {
                const isExpired = new Date(event.ends_at) < new Date();
                return (
                  <button
                    key={event.id}
                    onClick={() => router.push(`/admin/events/${event.id}`)}
                    className="rounded-2xl bg-card border border-border p-5 text-left hover:border-purple/30 hover:bg-card/80 active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-base">{event.title}</h3>
                      <span
                        className={`text-[0.65rem] px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                          isExpired
                            ? "bg-muted text-muted-foreground"
                            : "bg-purple/15 text-purple"
                        }`}
                      >
                        {isExpired ? "Encerrado" : "Ativo"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1.5">{event.venue_name}</p>
                    <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground/70">
                      <span className="font-mono">/{event.slug}</span>
                      <span>•</span>
                      <span>
                        {new Date(event.starts_at).toLocaleDateString("pt-BR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
