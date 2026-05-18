"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/stores/session";
import { api } from "@/lib/api-client";
import { generateFingerprint } from "@/lib/fingerprint";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export function OnboardingForm({ eventSlug }: { eventSlug: string }) {
  const router = useRouter();
  const { adminReturnEventId, currentEvent, setCurrentUser } = useSessionStore();
  const [step, setStep] = useState<"info" | "photo">("info");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    first_name: "",
    age: "",
    bio: "",
    gender: "",
    instagram: "",
    phone_number: "",
    sexuality: "",
    drink_preference: "",
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (photos.length >= 4) return;

    const file = files[0];
    setPhotos((prev) => [...prev, file]);
    setPhotoPreviews((prev) => [...prev, URL.createObjectURL(file)]);
    e.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!currentEvent) {
      console.error("[OnboardingForm] No current event in store");
      toast.error("Erro: evento não encontrado");
      return;
    }
    if (!form.first_name || !form.age || !form.gender) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    if (photos.length === 0) {
      toast.error("Tire pelo menos uma foto");
      return;
    }

    setLoading(true);

    try {
      const fp = generateFingerprint({ fresh: Boolean(adminReturnEventId) });

      const { user } = await api.users.create(eventSlug, {
        device_fingerprint: fp,
        first_name: form.first_name,
        age: parseInt(form.age),
        bio: form.bio || undefined,
        gender: form.gender,
        sexuality: form.sexuality || undefined,
        drink_preference: form.drink_preference || undefined,
        instagram: form.instagram || undefined,
        phone_number: form.phone_number || undefined,
      });

      console.log("[OnboardingForm] User created:", user.id);

      for (let i = 0; i < photos.length; i++) {
        await api.upload.photo(photos[i], currentEvent.id, user.id, i);
        console.log("[OnboardingForm] Photo uploaded:", i);
      }

      setCurrentUser(user);
      toast.success("Perfil criado!");
      router.push(`/event/${eventSlug}/swipe`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao criar perfil";
      console.error("[OnboardingForm] Submit error:", err);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col h-screen-safe safe-top safe-bottom overflow-y-auto">
      <AnimatePresence mode="wait">
        {step === "info" ? (
          <motion.div
            key="info"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 flex-col px-6 py-6"
          >
            {/* Progress */}
            <div className="flex gap-2 mb-6">
              <div className="h-1 flex-1 rounded-full bg-purple" />
              <div className="h-1 flex-1 rounded-full bg-secondary" />
            </div>

            <h1 className="text-2xl font-black mb-1">Crie seu perfil</h1>
            <p className="text-sm text-muted-foreground mb-6">Leva menos de 1 minuto</p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome *</label>
                <input
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder="Seu primeiro nome"
                  className="mt-1.5 w-full rounded-xl bg-secondary border border-border px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple/50 transition-all"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Idade *</label>
                <input
                  name="age"
                  type="number"
                  min="18"
                  max="99"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="18"
                  className="mt-1.5 w-full rounded-xl bg-secondary border border-border px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple/50 transition-all"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Gênero *</label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded-xl bg-secondary border border-border px-4 py-3.5 text-foreground focus:outline-none focus:ring-2 focus:ring-purple/50 transition-all appearance-none"
                >
                  <option value="">Selecione</option>
                  <option value="homem">Homem</option>
                  <option value="mulher">Mulher</option>
                  <option value="nao-binario">Não-binário</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Bio</label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Algo sobre você..."
                  maxLength={200}
                  rows={3}
                  className="mt-1.5 w-full rounded-xl bg-secondary border border-border px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple/50 transition-all resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Instagram</label>
                <input
                  name="instagram"
                  value={form.instagram}
                  onChange={handleChange}
                  placeholder="@seuuser"
                  className="mt-1.5 w-full rounded-xl bg-secondary border border-border px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple/50 transition-all"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                <input
                  name="phone_number"
                  value={form.phone_number}
                  onChange={handleChange}
                  placeholder="(11) 99999-9999"
                  className="mt-1.5 w-full rounded-xl bg-secondary border border-border px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple/50 transition-all"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Sexualidade</label>
                <select
                  name="sexuality"
                  value={form.sexuality}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded-xl bg-secondary border border-border px-4 py-3.5 text-foreground focus:outline-none focus:ring-2 focus:ring-purple/50 transition-all appearance-none"
                >
                  <option value="">Prefiro não dizer</option>
                  <option value="hetero">Heterossexual</option>
                  <option value="homo">Homossexual</option>
                  <option value="bi">Bissexual</option>
                  <option value="pan">Pansexual</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Bebida preferida</label>
                <input
                  name="drink_preference"
                  value={form.drink_preference}
                  onChange={handleChange}
                  placeholder="Cerveja, gin, água..."
                  className="mt-1.5 w-full rounded-xl bg-secondary border border-border px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple/50 transition-all"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!form.first_name || !form.age || !form.gender) {
                  toast.error("Preencha os campos obrigatórios");
                  return;
                }
                if (parseInt(form.age) < 18) {
                  toast.error("Você precisa ter pelo menos 18 anos");
                  return;
                }
                setStep("photo");
              }}
              className="mt-6 w-full rounded-2xl bg-purple py-4 text-white text-base font-bold hover:bg-purple-dark active:scale-[0.98] transition-all shadow-lg shadow-purple/20"
            >
              Próximo: Fotos →
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="photo"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 flex-col px-6 py-6"
          >
            {/* Progress */}
            <div className="flex gap-2 mb-6">
              <div className="h-1 flex-1 rounded-full bg-purple" />
              <div className="h-1 flex-1 rounded-full bg-purple" />
            </div>

            <h1 className="text-2xl font-black mb-1">Suas fotos</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Tire até 4 fotos com a câmera ({photos.length}/4)
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {photoPreviews.map((preview, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative aspect-[3/4] rounded-2xl overflow-hidden ring-2 ring-purple/20"
                >
                  <img src={preview} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </motion.div>
              ))}

              {photos.length < 4 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-[3/4] rounded-2xl border-2 border-dashed border-purple/30 flex flex-col items-center justify-center text-purple hover:border-purple/60 hover:bg-purple/5 active:scale-95 transition-all"
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <span className="text-sm font-medium">Tirar foto</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />

            <div className="mt-auto space-y-3">
              <button
                onClick={handleSubmit}
                disabled={loading || photos.length === 0}
                className="w-full rounded-2xl bg-purple py-4 text-white text-base font-bold hover:bg-purple-dark active:scale-[0.98] transition-all disabled:opacity-40 shadow-lg shadow-purple/20"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Criando perfil...
                  </span>
                ) : (
                  "Começar a curtir"
                )}
              </button>
              <button
                onClick={() => setStep("info")}
                className="w-full rounded-2xl py-3 text-muted-foreground text-sm font-medium active:scale-[0.98] transition-all"
              >
                ← Voltar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
