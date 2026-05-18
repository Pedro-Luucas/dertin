"use client";

import { useState, useRef, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
  type PanInfo,
} from "framer-motion";
import type { SwipeCandidate } from "@/stores/swipe";

interface Props {
  candidate: SwipeCandidate;
  onSwipe: (direction: "left" | "right") => void;
}

export function SwipeCard({ candidate, onSwipe }: Props) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
  const likeOpacity = useTransform(x, [0, 80, 150], [0, 0.5, 1]);
  const nopeOpacity = useTransform(x, [-150, -80, 0], [1, 0.5, 0]);

  const fireSwipe = useCallback(
    (direction: "left" | "right") => {
      if (swiping || expanded) return;
      setSwiping(true);
      const target = direction === "right" ? 400 : -400;
      animate(x, target, {
        type: "spring",
        stiffness: 600,
        damping: 50,
        onComplete: () => onSwipe(direction),
      });
    },
    [swiping, expanded, x, onSwipe]
  );

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (swiping || expanded) return;

    const absX = Math.abs(info.offset.x);
    const absY = Math.abs(info.offset.y);
    const velocityX = Math.abs(info.velocity.x);
    const threshold = 100;

    // Swipe up to expand
    if (info.offset.y < -80 && absY > absX) {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 35 });
      animate(y, 0, { type: "spring", stiffness: 500, damping: 35 });
      setExpanded(true);
      return;
    }

    if (info.offset.x > threshold || (info.offset.x > 50 && velocityX > 500)) {
      fireSwipe("right");
    } else if (
      info.offset.x < -threshold ||
      (info.offset.x < -50 && velocityX > 500)
    ) {
      fireSwipe("left");
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 35 });
      animate(y, 0, { type: "spring", stiffness: 500, damping: 35 });
    }
  }

  function handlePhotoTap(e: React.PointerEvent) {
    if (swiping || expanded) return;
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    const half = rect.width / 2;

    if (candidate.photos.length <= 1) return;

    if (tapX > half) {
      setPhotoIndex((i) => Math.min(i + 1, candidate.photos.length - 1));
    } else {
      setPhotoIndex((i) => Math.max(i - 1, 0));
    }
  }

  const drinkLabels: Record<string, string> = {
    social: "Bebe socialmente",
    never: "Não bebe",
    frequent: "Bebe frequentemente",
  };

  return (
    <>
      <div className="relative w-full max-w-[340px] mx-auto">
        <motion.div
          ref={cardRef}
          key={candidate.id}
          drag={swiping ? false : true}
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.9}
          onDragEnd={handleDragEnd}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative aspect-[3/4.2] rounded-3xl overflow-hidden shadow-2xl shadow-purple/10 cursor-grab active:cursor-grabbing select-none"
          style={{ x, y, rotate, touchAction: "none" }}
        >
          {/* Photo display */}
          <div className="h-full w-full relative" onPointerUp={handlePhotoTap}>
            {candidate.photos.length > 0 ? (
              candidate.photos.map((photo, i) => (
                <img
                  key={i}
                  src={photo.photo_url}
                  alt={`${candidate.first_name} foto ${i + 1}`}
                  className="absolute inset-0 h-full w-full object-cover pointer-events-none transition-opacity duration-200"
                  style={{ opacity: i === photoIndex ? 1 : 0 }}
                  draggable={false}
                />
              ))
            ) : (
              <div className="h-full w-full bg-secondary flex items-center justify-center">
                <span className="text-4xl opacity-50">📷</span>
              </div>
            )}
          </div>

          {/* Photo indicators */}
          {candidate.photos.length > 1 && (
            <div className="absolute top-3 left-4 right-4 flex gap-1 z-10">
              {candidate.photos.map((_, i) => (
                <div
                  key={i}
                  className={`h-[3px] flex-1 rounded-full transition-all duration-200 ${
                    i === photoIndex ? "bg-white" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Like overlay */}
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute inset-0 bg-green-500/10 pointer-events-none z-10"
          />
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-12 left-6 z-20 rounded-xl border-[3px] border-green-400 px-5 py-2 rotate-[-12deg]"
          >
            <span className="text-2xl font-black text-green-400 tracking-wide">
              CURTI
            </span>
          </motion.div>

          {/* Nope overlay */}
          <motion.div
            style={{ opacity: nopeOpacity }}
            className="absolute inset-0 bg-red-500/10 pointer-events-none z-10"
          />
          <motion.div
            style={{ opacity: nopeOpacity }}
            className="absolute top-12 right-6 z-20 rounded-xl border-[3px] border-red-400 px-5 py-2 rotate-[12deg]"
          >
            <span className="text-2xl font-black text-red-400 tracking-wide">
              NOPE
            </span>
          </motion.div>

          {/* User info gradient */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-24 pb-6 px-5 z-10">
            <h3 className="text-[1.7rem] font-bold text-white leading-tight">
              {candidate.first_name}
              <span className="font-normal text-white/80 ml-2">
                {candidate.age}
              </span>
            </h3>
            {candidate.bio && (
              <p className="mt-1.5 text-[0.9rem] text-white/70 line-clamp-2 leading-snug">
                {candidate.bio}
              </p>
            )}
            {/* Swipe up hint */}
            <div className="mt-3 flex items-center gap-1.5 text-white/40 text-xs">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              <span>Arraste pra cima para ver mais</span>
            </div>
          </div>
        </motion.div>

        {/* Action buttons */}
        <div className="flex justify-center gap-5 mt-5">
          <button
            onClick={() => fireSwipe("left")}
            disabled={swiping}
            className="h-16 w-16 rounded-full bg-card border border-border flex items-center justify-center text-red-400 hover:bg-red-400/10 hover:border-red-400/50 active:scale-90 transition-all duration-150 disabled:opacity-50"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <button
            onClick={() => fireSwipe("right")}
            disabled={swiping}
            className="h-16 w-16 rounded-full bg-card border border-border flex items-center justify-center text-green-400 hover:bg-green-400/10 hover:border-green-400/50 active:scale-90 transition-all duration-150 disabled:opacity-50"
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded profile overlay */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
            onClick={() => setExpanded(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-0 overflow-y-auto overscroll-contain"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setExpanded(false)}
                className="sticky top-4 left-4 z-10 h-10 w-10 rounded-full bg-card/80 backdrop-blur border border-border flex items-center justify-center ml-4"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Photos */}
              <div className="px-4 -mt-6 space-y-3">
                {candidate.photos.length > 0 ? (
                  candidate.photos.map((photo, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden">
                      <img
                        src={photo.photo_url}
                        alt={`${candidate.first_name} foto ${i + 1}`}
                        className="w-full aspect-[3/4] object-cover"
                      />
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-secondary aspect-[3/4] flex items-center justify-center">
                    <span className="text-5xl opacity-50">📷</span>
                  </div>
                )}
              </div>

              {/* Profile info */}
              <div className="px-5 pt-6 pb-32">
                <h2 className="text-3xl font-bold text-foreground">
                  {candidate.first_name}
                  <span className="font-normal text-muted-foreground ml-2">
                    {candidate.age}
                  </span>
                </h2>

                {candidate.bio && (
                  <p className="mt-4 text-[0.95rem] text-muted-foreground leading-relaxed">
                    {candidate.bio}
                  </p>
                )}

                {/* Details */}
                <div className="mt-5 flex flex-wrap gap-2">
                  {candidate.gender && (
                    <span className="px-3 py-1.5 rounded-full bg-purple/10 text-purple text-sm font-medium">
                      {candidate.gender === "male" ? "Homem" : candidate.gender === "female" ? "Mulher" : candidate.gender}
                    </span>
                  )}
                  {candidate.drink_preference && (
                    <span className="px-3 py-1.5 rounded-full bg-purple/10 text-purple text-sm font-medium">
                      {drinkLabels[candidate.drink_preference] || candidate.drink_preference}
                    </span>
                  )}
                </div>

                {/* Action buttons in expanded view */}
                <div className="flex justify-center gap-5 mt-8">
                  <button
                    onClick={() => { setExpanded(false); setTimeout(() => fireSwipe("left"), 100); }}
                    className="h-16 w-16 rounded-full bg-card border border-border flex items-center justify-center text-red-400 hover:bg-red-400/10 hover:border-red-400/50 active:scale-90 transition-all duration-150"
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                  <button
                    onClick={() => { setExpanded(false); setTimeout(() => fireSwipe("right"), 100); }}
                    className="h-16 w-16 rounded-full bg-card border border-border flex items-center justify-center text-green-400 hover:bg-green-400/10 hover:border-green-400/50 active:scale-90 transition-all duration-150"
                  >
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
