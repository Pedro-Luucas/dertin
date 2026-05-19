import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center h-screen-safe">
      <div className="mb-10">
        <h1 className="text-6xl font-black tracking-tighter">
          <span className="text-purple">dertin</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
          Conheça pessoas no evento. Rápido, divertido, efêmero.
        </p>
      </div>

      <div className="w-full max-w-sm">
        <div className="rounded-2xl bg-card/50 border border-border p-6">
          <div className="w-12 h-12 rounded-full bg-purple/10 flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M7 7h.01M7 12h.01M12 7h.01M12 12h.01M17 7h.01M17 12h.01M7 17h.01M12 17h.01M17 17h.01" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">
            Escaneie o QR code do evento para começar
          </p>
        </div>
      </div>

      <div className="mt-14">
        <Link
          href="/admin"
          className="group inline-flex items-center gap-2 rounded-full border border-purple-light/40 bg-purple px-6 py-3 text-sm font-bold text-white shadow-[0_0_30px_oklch(0.55_0.25_285_/_35%)] transition-all hover:-translate-y-0.5 hover:bg-purple-light hover:shadow-[0_0_44px_oklch(0.7_0.2_285_/_45%)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-purple/50"
        >
          Área do organizador
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>
    </div>
  );
}
