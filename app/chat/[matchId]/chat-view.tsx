"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSessionStore } from "@/stores/session";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import type { ChatMessage, EventUser, ProfilePhoto } from "@/types/database";

const MAX_MESSAGES_PER_USER = 5;

export function ChatView() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;
  const { currentUser } = useSessionStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [otherUser, setOtherUser] = useState<(EventUser & { photos: ProfilePhoto[] }) | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [myMessageCount, setMyMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  async function loadChat() {
    if (!currentUser) return;

    try {
      const [{ user }, { messages: msgs }] = await Promise.all([
        api.matches.getOtherUser(matchId, currentUser.id),
        api.matches.getMessages(matchId),
      ]);

      setOtherUser(user);
      setMessages(msgs);
      setMyMessageCount(msgs.filter((m) => m.sender_id === currentUser.id).length);
      console.log("[ChatView] Loaded chat:", msgs.length, "messages");
    } catch (err) {
      console.error("[ChatView] Error loading chat:", err);
      toast.error("Erro ao carregar conversa");
      router.push("/matches");
    }
  }

  useEffect(() => {
    if (!currentUser) {
      router.push("/");
      return;
    }
    loadChat();
  }, [currentUser, matchId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!currentUser || !input.trim() || sending) return;
    if (myMessageCount >= MAX_MESSAGES_PER_USER) return;

    setSending(true);
    const content = input.trim();
    setInput("");

    try {
      const { message } = await api.matches.sendMessage(matchId, {
        sender_id: currentUser.id,
        content,
      });
      setMessages((prev) => [...prev, message]);
      setMyMessageCount((c) => c + 1);
    } catch (err) {
      console.error("[ChatView] Error sending message:", err);
      toast.error("Erro ao enviar mensagem");
      setInput(content);
    } finally {
      setSending(false);
    }
  }

  const canSend = myMessageCount < MAX_MESSAGES_PER_USER;

  return (
    <div className="flex flex-1 flex-col h-screen-safe" style={{ overscrollBehavior: "contain" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border safe-top">
        <button
          onClick={() => router.push("/matches")}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        {otherUser && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-full overflow-hidden bg-secondary flex-shrink-0 ring-2 ring-purple/20">
              {otherUser.photos[0] && (
                <img
                  src={otherUser.photos[0].photo_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{otherUser.first_name}</p>
              {otherUser.instagram && (
                <p className="text-xs text-purple truncate">
                  @{otherUser.instagram.replace("@", "")}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5" style={{ overscrollBehavior: "contain" }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-sm text-muted-foreground">
              Diga oi! Vocês têm {MAX_MESSAGES_PER_USER} mensagens cada.
            </p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUser?.id;
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
                  isMine
                    ? "bg-purple text-white rounded-br-md"
                    : "bg-secondary text-foreground rounded-bl-md"
                }`}
              >
                <p className="text-[0.9rem] leading-relaxed">{msg.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-3 safe-bottom">
        {canSend ? (
          <>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Digite uma mensagem..."
                maxLength={500}
                className="flex-1 rounded-full bg-secondary px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple/50"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="h-12 w-12 rounded-full bg-purple flex items-center justify-center text-white disabled:opacity-40 hover:bg-purple-dark active:scale-90 transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground/70">
              {myMessageCount}/{MAX_MESSAGES_PER_USER} mensagens usadas
            </p>
          </>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">
              Limite atingido — troque o contato! 💜
            </p>
            {otherUser?.instagram && (
              <p className="mt-1 text-sm text-purple font-medium">
                @{otherUser.instagram.replace("@", "")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
