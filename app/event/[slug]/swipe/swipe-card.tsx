"use client";

import { useState, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
  type PanInfo,
} from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import type { SwipeCandidate } from "@/stores/swipe";

interface Props {
  candidate: SwipeCandidate;
  onSwipe: (direction: "left" | "right") => void;
}

export function SwipeCard({ candidate, onSwipe }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, dragFree: false });
  const [photoIndex, setPhotoIndex] = useState(0);
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
  const likeOpacity = useTransform(x, [0, 80, 150], [0, 0.5, 1]);
  const nopeOpacity = useTransform(x, [-150, -80, 0], [1, 0.5, 0]);
  const cardScale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPhotoIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useState(() => {
    if (emblaApi) emblaApi.on("select", onSelect);
  });

  function handleDragEnd(_: unknown, info: PanInfo) {
    const threshold = 100;
    const velocity = Math.abs(info.velocity.x);

    if (info.offset.x > threshold || (info.offset.x > 50 && velocity > 500)) {
      setExiting("right");
      setTimeout(() => onSwipe("right"), 200);
    } else if (info.offset.x < -threshold || (info.offset.x < -50 && velocity > 500)) {
      setExiting("left");
      setTimeout(() => onSwipe("left"), 200);
    }
  }

  function handleButtonSwipe(direction: "left" | "right") {
    setExiting(direction);
    setTimeout(() => onSwipe(direction), 200);
  }

  return (
    <div className="relative w-full max-w-[340px] mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={candidate.id}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.9}
          onDragEnd={handleDragEnd}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{
            x: exiting === "right" ? 300 : exiting === "left" ? -300 : 0,
            opacity: 0,
            rotate: exiting === "right" ? 20 : exiting === "left" ? -20 : 0,
            transition: { duration: 0.3 },
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative aspect-[3/4.2] rounded-3xl overflow-hidden shadow-2xl shadow-purple/10 cursor-grab active:cursor-grabbing select-none"
          style={{ x, rotate, scale: cardScale, touchAction: "none" }}
        >
          {/* Photo carousel */}
          <div ref={emblaRef} className="h-full w-full overflow-hidden">
            <div className="flex h-full">
              {candidate.photos.length > 0 ? (
                candidate.photos.map((photo, i) => (
                  <div key={i} className="flex-[0_0_100%] min-w-0 h-full">
                    <img
                      src={photo.photo_url}
                      alt={`${candidate.first_name} foto ${i + 1}`}
                      className="h-full w-full object-cover pointer-events-none"
                      draggable={false}
                    />
                  </div>
                ))
              ) : (
                <div className="flex-[0_0_100%] min-w-0 h-full bg-secondary flex items-center justify-center">
                  <span className="text-4xl opacity-50">📷</span>
                </div>
              )}
            </div>
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
            <span className="text-2xl font-black text-green-400 tracking-wide">CURTI</span>
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
            <span className="text-2xl font-black text-red-400 tracking-wide">NOPE</span>
          </motion.div>

          {/* User info gradient */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-24 pb-6 px-5 z-10">
            <h3 className="text-[1.7rem] font-bold text-white leading-tight">
              {candidate.first_name}
              <span className="font-normal text-white/80 ml-2">{candidate.age}</span>
            </h3>
            {candidate.bio && (
              <p className="mt-1.5 text-[0.9rem] text-white/70 line-clamp-2 leading-snug">
                {candidate.bio}
              </p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex justify-center gap-5 mt-5">
        <button
          onClick={() => handleButtonSwipe("left")}
          className="h-16 w-16 rounded-full bg-card border border-border flex items-center justify-center text-red-400 hover:bg-red-400/10 hover:border-red-400/50 active:scale-90 transition-all duration-150"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <button
          onClick={() => handleButtonSwipe("right")}
          className="h-16 w-16 rounded-full bg-card border border-border flex items-center justify-center text-green-400 hover:bg-green-400/10 hover:border-green-400/50 active:scale-90 transition-all duration-150"
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
