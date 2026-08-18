import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (index: number) => void;
}

export function ImageLightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}: ImageLightboxProps) {
  const total = images.length;
  const safeIndex = Math.min(Math.max(0, currentIndex), Math.max(0, total - 1));

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (total <= 1) return;
    const nextIdx = (safeIndex - 1 + total) % total;
    onNavigate?.(nextIdx);
  }, [safeIndex, total, onNavigate]);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (total <= 1) return;
    const nextIdx = (safeIndex + 1) % total;
    onNavigate?.(nextIdx);
  }, [safeIndex, total, onNavigate]);

  // Keyboard navigation: ESC, Left, Right
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || total === 0) return null;

  return (
    <AnimatePresence>
      <div 
        id="image-lightbox-modal"
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-xl p-3 sm:p-6 select-none"
        onClick={onClose}
      >
        {/* Top bar controls */}
        <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20 pointer-events-none">
          <div className="px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-white/15 text-xs font-semibold text-zinc-200 backdrop-blur-md shadow-lg pointer-events-auto">
            {safeIndex + 1} / {total}
          </div>

          <button
            id="close-lightbox-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-white/20 text-zinc-200 hover:text-white flex items-center justify-center backdrop-blur-md shadow-lg transition-all active:scale-95 cursor-pointer pointer-events-auto"
            title="Đóng (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Arrows */}
        {total > 1 && (
          <>
            <button
              id="prev-lightbox-btn"
              type="button"
              onClick={handlePrev}
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-white/20 text-zinc-200 hover:text-white flex items-center justify-center backdrop-blur-md shadow-2xl transition-all active:scale-90 z-20 cursor-pointer"
              title="Ảnh trước (◀)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              id="next-lightbox-btn"
              type="button"
              onClick={handleNext}
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-white/20 text-zinc-200 hover:text-white flex items-center justify-center backdrop-blur-md shadow-2xl transition-all active:scale-90 z-20 cursor-pointer"
              title="Ảnh kế tiếp (▶)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Main Image Container */}
        <motion.div
          key={images[safeIndex]}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="relative max-w-[92vw] max-h-[85vh] sm:max-w-[85vw] sm:max-h-[82vh] flex items-center justify-center rounded-2xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.9)]"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={images[safeIndex]}
            alt={`Ảnh ${safeIndex + 1}`}
            className="max-w-full max-h-[85vh] sm:max-h-[82vh] w-auto h-auto object-contain rounded-2xl border border-white/10"
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
