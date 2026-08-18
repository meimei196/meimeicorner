import React, { useState, useRef, useEffect, UIEvent, useMemo, useCallback } from 'react';
import { Bot, UpcomingBot, bots as allBots, upcomingBots } from '../data/bots';
import { Filter, ArrowUp, ArrowDown, Facebook, ChevronLeft, ChevronRight, X, Sparkles, BookOpen, MessageSquare, User } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';
import { AnonymousFeedback } from './AnonymousFeedback';
import { FortuneWidget } from './FortuneWidget';
import { BeginnerGuideModal } from './BeginnerGuideModal';
import { motion, AnimatePresence } from 'motion/react';
import { playCardClickSound, playFortuneClickSound } from '../lib/sound';
import { useAuthStore } from '../lib/user-auth-store';

export function Home({ onSelectBot, onOpenForum }: { onSelectBot: (id: string) => void; onOpenForum?: () => void }) {
  const { currentUser, isAdmin, setIsAuthModalOpen } = useAuthStore();
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showTags, setShowTags] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [selectedUpcomingBot, setSelectedUpcomingBot] = useState<UpcomingBot | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const tagsRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  // Carousel State
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const filterTags = ['School', 'TXVT', 'FWB', 'Possessive', 'Teasing', 'Dominant', 'Sadist', 'Drama', 'Old man', 'Daddy vibe', 'Dead Dove', 'Vampire', 'Ex', 'Enemy', 'Mafia', 'Báo thù', 'Stepbrother', 'Arranged marriage', 'Royal', 'Bully', 'Colonel', 'Bé trai', 'Cổ trang', 'NSFW'];

  const filteredBots = useMemo(() => {
    return [...allBots]
      .reverse() // Bot mới thêm ở cuối mảng sẽ được đưa lên đầu
      .sort((a, b) => ((b as any).isNew ? 1 : 0) - ((a as any).isNew ? 1 : 0)) // Ưu tiên tuyệt đối bot có tag isNew
      .filter(
        (b) =>
          b.id !== 'system-osin' &&
          (b.name.toLowerCase().includes(search.toLowerCase()) ||
            b.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))) &&
          (!activeTag || b.tags.some((t) => t.toLowerCase() === activeTag.toLowerCase() || t === activeTag))
      );
  }, [search, activeTag]);

  // Trích xuất Top 5 bot đề cử (Ưu tiên thuộc tính isRecommended)
  const topBots = useMemo(() => {
    const recommended = allBots.filter(b => b.id !== 'system-osin' && (b as any).isRecommended);
    if (recommended.length > 0) return recommended.slice(0, 5);
    // Fallback nếu chưa set đề cử thì lấy 5 người đầu tiên
    return [...allBots].filter(b => b.id !== 'system-osin').slice(0, 5);
  }, [allBots]);

  // Carousel Logic
  const nextSlide = useCallback(() => {
    setDirection(1);
    setCarouselIndex((prev) => (prev + 1) % topBots.length);
  }, [topBots.length]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCarouselIndex((prev) => (prev - 1 + topBots.length) % topBots.length);
  }, [topBots.length]);

  useEffect(() => {
    if (topBots.length <= 1 || search || activeTag) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [topBots.length, search, activeTag, nextSlide]);

  const containerRef = useRef<HTMLDivElement>(null);

  const getScrollContainer = useCallback(() => {
    if (!containerRef.current) return window as unknown as HTMLElement;
    let el: HTMLElement | null = containerRef.current.parentElement;
    while (el) {
      const style = window.getComputedStyle(el);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        return el;
      }
      el = el.parentElement;
    }
    return window as unknown as HTMLElement;
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagsRef.current && !tagsRef.current.contains(event.target as Node)) {
        setShowTags(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const parentEl = containerRef.current?.parentElement;
      const parentScroll = parentEl ? parentEl.scrollTop : 0;
      const winScroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const currentScroll = Math.max(parentScroll, winScroll);
      setShowScrollTop(currentScroll > 10);
    };

    window.addEventListener('scroll', handleScroll, true);
    const parentEl = containerRef.current?.parentElement;
    if (parentEl) {
      parentEl.addEventListener('scroll', handleScroll, { passive: true });
    }

    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      if (parentEl) {
        parentEl.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.scrollTo({ top: 0, behavior: 'smooth' });
    if (containerRef.current?.parentElement) {
      containerRef.current.parentElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    const parentEl = containerRef.current?.parentElement;
    const maxScroll = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      parentEl ? parentEl.scrollHeight : 0
    );
    window.scrollTo({ top: maxScroll, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: maxScroll, behavior: 'smooth' });
    document.body.scrollTo({ top: maxScroll, behavior: 'smooth' });
    if (parentEl) {
      parentEl.scrollTo({ top: maxScroll, behavior: 'smooth' });
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col min-h-full max-w-5xl mx-auto relative">
      <header className="p-6 text-center relative">
        {/* Top right Round Profile / Login button */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all shadow-md cursor-pointer overflow-hidden backdrop-blur-md ${
              isAdmin
                ? 'border-amber-400/40 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.3)] text-amber-300'
                : currentUser
                ? 'border-pink-400/40 bg-zinc-950/80 text-pink-300'
                : 'border-white/15 bg-zinc-950/70 text-zinc-400 hover:text-white hover:border-white/30'
            }`}
            title={currentUser ? `Hồ sơ: ${currentUser.nickname || currentUser.username}` : 'Đăng nhập / Đăng ký'}
          >
            {currentUser ? (
              currentUser.avatar ? (
                <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold font-serif">
                  {(currentUser.nickname || currentUser.username).charAt(0).toUpperCase()}
                </span>
              )
            ) : (
              <User className="w-4 h-4" />
            )}
          </button>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-100 serif-title mb-1 neon-title">
          <span className="relative inline-block">
            meimeicorner
            <motion.span
              animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8], rotate: [0, 45, 90] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute -top-3 -right-6 text-zinc-300"
            >
              ✦
            </motion.span>
            <motion.span
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5], rotate: [90, 45, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 1 }}
              className="absolute -bottom-1 -left-4 text-zinc-400 text-sm"
            >
              ✦
            </motion.span>
          </span>
        </h1>
        <p className="text-xs text-zinc-400 mb-4 drop-shadow-md">.✦ pick your husbandos and try 𝜗ৎ ݁˖</p>

        <FortuneWidget />
        <AnonymousFeedback />

        {/* Nút Forum Tám Zai đặt dưới mục Feedback cho sốp */}
        <div className="flex justify-center mt-2.5">
          <button
            type="button"
            onClick={() => {
              playFortuneClickSound();
              onOpenForum?.();
            }}
            className="relative flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-950/40 via-purple-950/40 to-pink-950/40 border border-pink-500/30 text-pink-200 text-sm font-serif italic hover:border-pink-400 hover:text-white transition-all shadow-[0_0_20px_rgba(244,114,182,0.12)] hover:shadow-[0_0_25px_rgba(244,114,182,0.25)] group overflow-hidden active:scale-95 cursor-pointer"
          >
            <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
            <MessageSquare className="w-4 h-4 text-pink-300 group-hover:scale-110 transition-transform" />
            <span className="relative z-10 font-bold tracking-wide">
              forum tám zai 𝜗ৎ
            </span>
            <span className="px-1.5 py-0.2 rounded-md bg-pink-500/20 text-[9px] font-sans font-bold text-pink-100 uppercase tracking-widest border border-pink-500/30">
              Mới
            </span>
          </button>
        </div>

        <div className="flex justify-center items-center mt-6">
          <div className="relative w-full max-w-md flex items-center" ref={tagsRef}>
            <span className="absolute left-4 top-1/2 -translate-y-1/2 z-10 select-none text-zinc-400">🔎</span>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full pl-10 pr-12 py-3 rounded-full glass-input focus:outline-none shadow-sm text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button 
              onClick={() => setShowTags(!showTags)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors z-10"
            >
              <Filter className="w-4 h-4" />
            </button>

            {/* Tags Dropdown */}
            {showTags && (
              <div className="absolute top-12 right-0 bg-black/80 backdrop-blur-md border border-white/10 shadow-lg rounded-2xl p-4 w-64 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex flex-wrap gap-2 text-[10px] font-semibold">
                  {filterTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                      className={`px-3 py-1 border rounded-full transition-colors ${
                        activeTag === tag ? 'bg-zinc-800 text-white border-zinc-500 shadow-sm' : 'bg-black/50 border-white/10 text-zinc-400 hover:border-zinc-500'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mục Chồng iu sắp đến - Teaser Banner */}
      {!search && !activeTag && upcomingBots.length > 0 && (
        <div className="w-full max-w-[800px] mx-auto px-8 mb-10">
          <div className="flex items-center justify-center mb-5 select-none gap-2">
            <span className="h-[1px] w-8 bg-gradient-to-r from-transparent to-white/30"></span>
            <h2 className="text-sm sm:text-base font-bold tracking-[0.22em] uppercase font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 via-white to-zinc-300 drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
              ⋆˙chồng iu sắp đến♡
            </h2>
            <span className="h-[1px] w-8 bg-gradient-to-l from-transparent to-white/30"></span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {upcomingBots.map((bot) => (
              <div 
                key={bot.id} 
                onClick={() => {
                  playCardClickSound();
                  setSelectedUpcomingBot(bot);
                }}
                className="relative group p-4 rounded-3xl bg-zinc-950/70 border border-white/10 backdrop-blur-md shadow-2xl overflow-hidden cursor-pointer select-none transition-all duration-300 hover:border-white/25 hover:bg-zinc-900/80 active:scale-[0.99]"
              >
                {/* Minimal Lock Icon & Arrow */}
                <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 text-zinc-400 group-hover:text-zinc-200 transition-colors">
                  <span className="text-xs" title={bot.releaseDate || 'Sắp ra mắt'}>🔒</span>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>

                <div className="flex gap-3.5 items-center">
                  {/* Avatar image - Crisp & clear without blur or overlay lock */}
                  <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden shrink-0 border border-white/10 group-hover:scale-105 transition-transform duration-500 shadow-lg">
                    <img src={bot.avatar} alt={bot.name} className="w-full h-full object-cover" />
                  </div>

                  {/* Info Teaser */}
                  <div className="flex-1 min-w-0 pr-6">
                    <h3 className="text-base font-bold text-zinc-100 tracking-tight font-serif truncate group-hover:text-pink-100 transition-colors">
                      {bot.name}
                    </h3>
                    <p className="text-[11px] font-medium text-pink-200/80 mb-1.5 truncate">
                      {bot.role}
                    </p>

                    <p className="text-[10px] text-zinc-400 line-clamp-2 italic leading-relaxed">
                      "{bot.teaser}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal chi tiết Chồng iu sắp đến */}
      <AnimatePresence>
        {selectedUpcomingBot && (
          <div 
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedUpcomingBot(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-zinc-950 border border-white/15 rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden select-none"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedUpcomingBot(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-all z-10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-white/15 shadow-xl mb-4">
                  <img src={selectedUpcomingBot.avatar} alt={selectedUpcomingBot.name} className="w-full h-full object-cover" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 font-medium mb-2.5">
                  <span>🔒</span>
                  <span>{selectedUpcomingBot.releaseDate || 'Sắp ra mắt 𝜗ৎ'}</span>
                </div>

                <h3 className="text-xl font-bold text-zinc-100 font-serif mb-1">
                  {selectedUpcomingBot.name}
                </h3>

                <p className="text-xs font-semibold text-pink-300/90 mb-3 px-2">
                  {selectedUpcomingBot.role}
                </p>

                {selectedUpcomingBot.tags && selectedUpcomingBot.tags.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                    {selectedUpcomingBot.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-zinc-400">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="w-full p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-left mb-5">
                  <p className="text-xs text-zinc-300/90 italic leading-relaxed whitespace-pre-line">
                    "{selectedUpcomingBot.teaser}"
                  </p>
                </div>

                <button
                  onClick={() => setSelectedUpcomingBot(null)}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 font-medium text-xs transition-all border border-white/10 active:scale-95 cursor-pointer"
                >
                  Đóng thông tin
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mục Đề cử chồng iu - Horizontal Scroll */}
      {topBots.length > 0 && !search && !activeTag && (
        <div className="w-full max-w-[800px] mx-auto px-8 mb-8">
          <div className="flex items-center justify-center mb-6 select-none gap-2">
            <span className="h-[1px] w-8 bg-gradient-to-r from-transparent to-white/30"></span>
            <h2 className="text-sm sm:text-base font-bold tracking-[0.22em] uppercase font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 via-white to-zinc-300 drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
              ⋆˙ đề cử chồng iu ⟡♡
            </h2>
            <span className="h-[1px] w-8 bg-gradient-to-l from-transparent to-white/30"></span>
          </div>
          
          {/* Khung nền kính mờ (Glassmorphism) bao quanh toàn bộ Carousel */}
          <div className="relative p-[1px] rounded-[40px] bg-gradient-to-b from-white/10 via-white/0 to-white/5 shadow-2xl">
            <div className="relative group px-12 py-10 bg-white/[0.005] backdrop-blur-[0.5px] rounded-[39px]">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={topBots[carouselIndex]?.id}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -40 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="flex justify-center"
                >
                  <div className="w-full max-w-[220px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[20px]">
                    <BotCard
                      bot={topBots[carouselIndex]}
                      onClick={() => {
                        playCardClickSound();
                        onSelectBot(topBots[carouselIndex].id);
                      }}
                    />
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner "Nàng là người mới?" nằm dưới mục Đề cử chồng iu */}
      {!search && !activeTag && (
        <div className="w-full max-w-[800px] mx-auto px-8 mb-8">
          <div 
            onClick={() => {
              playCardClickSound();
              setIsGuideOpen(true);
            }}
            className="group relative p-4 sm:p-4.5 rounded-2xl bg-zinc-950/80 border border-white/15 backdrop-blur-md shadow-xl hover:border-white/30 transition-all duration-300 cursor-pointer overflow-hidden flex items-center justify-between gap-3 select-none active:scale-[0.99]"
          >
            {/* Subtle glow behind banner */}
            <div className="absolute -inset-1 bg-white/5 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/20 flex items-center justify-center shrink-0 text-zinc-200 shadow-inner group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-zinc-100 font-serif tracking-wide group-hover:text-white transition-colors">
                  Nàng là người mới? 𝜗ৎ
                </h3>
                <p className="text-[11px] text-zinc-400 font-medium line-clamp-1 mt-0.5">
                  Bấm vào đây để xem hướng dẫn chọn Model AI & video thao tác nhé!
                </p>
              </div>
            </div>

            <div className="relative z-10 shrink-0 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-[11px] font-semibold text-zinc-200 group-hover:bg-white/20 group-hover:text-white transition-all flex items-center gap-1 shadow-md">
              <span>Xem ngay</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      )}

      {/* Modal Hướng dẫn người mới */}
      <BeginnerGuideModal 
        isOpen={isGuideOpen} 
        onClose={() => setIsGuideOpen(false)} 
      />

      <main 
        ref={mainRef}
        className="px-8 pb-8 flex flex-col items-center"
      >
        <div className="w-full max-w-[800px] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-[260px] gap-4 mb-12">
          {filteredBots.map((bot) => (
            <div key={bot.id}>
              <BotCard
                bot={bot}
                onClick={() => onSelectBot(bot.id)}
              />
            </div>
          ))}
        </div>

        <footer className="w-full max-w-[800px] py-6 text-center text-[11px] text-zinc-500 border-t border-white/5 flex flex-col items-center gap-2 select-none shrink-0 mt-auto">
          <p>© 2026 meimeicorner. All rights reserved.</p>
          <div className="flex gap-4 items-center">
            <a
              href="https://www.facebook.com/tinamcolink/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer font-semibold flex items-center gap-1.5"
            >
              <Facebook className="w-3.5 h-3.5 text-zinc-400 hover:text-white" />
            </a>
            <span className="w-px h-3 bg-white/10" />
            <a 
              href="https://yodayo.com/@meimei196" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-pink-300 hover:border-pink-500/20 transition-all shadow-sm"
              title="Yodayo"
            >
              <span className="text-[6px] font-black tracking-tighter">YDY</span>
            </a>
            <a 
              href="https://character.ai/profile/mei196" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-pink-300 hover:border-pink-500/20 transition-all shadow-sm"
              title="Character.AI"
            >
              <span className="text-[6px] font-black tracking-tighter">C.AI</span>
            </a>
            <a 
              href="https://xoul.ai/profile/meimei196" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-pink-300 hover:border-pink-500/20 transition-all shadow-sm"
              title="Xoul"
            >
              <span className="text-[6px] font-black tracking-tighter">XOL</span>
            </a>
          </div>
        </footer>
      </main>

      {/* Nhóm nút điều hướng Top/Down - Luôn hiển thị nổi bật phía trên mục "Hôm nay póc ai?" */}
      {/* Mobile View: Đặt ngay phía trên nút FAB "Hôm nay póc ai?" (bottom-right) */}
      <div 
        className="fixed right-4 bottom-[74px] md:hidden z-[2000] flex flex-col gap-2 transition-all duration-300"
      >
        <button
          onClick={scrollToTop}
          className="w-10 h-10 rounded-full bg-zinc-950/90 border border-zinc-700/80 text-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-md flex items-center justify-center hover:bg-zinc-800 active:scale-90 transition-all cursor-pointer"
          title="Lên đầu trang"
        >
          <ArrowUp className="w-4 h-4 text-zinc-200 stroke-[2.5]" />
        </button>
        <button
          onClick={scrollToBottom}
          className="w-10 h-10 rounded-full bg-zinc-950/90 border border-zinc-700/80 text-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-md flex items-center justify-center hover:bg-zinc-800 active:scale-90 transition-all cursor-pointer"
          title="Xuống cuối trang"
        >
          <ArrowDown className="w-4 h-4 text-zinc-200 stroke-[2.5]" />
        </button>
      </div>

      {/* PC / Desktop View: Đặt ngay phía trên thẻ "Hôm nay póc ai?" (top-[35%]) */}
      <div 
        className="fixed right-6 top-[35%] -translate-y-[calc(50%+76px)] hidden md:flex items-center gap-2 z-[2000] transition-all duration-300"
      >
        <button
          onClick={scrollToTop}
          className="w-11 h-10 rounded-xl bg-zinc-950/90 border border-zinc-700/80 text-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-md flex items-center justify-center hover:bg-zinc-800 hover:text-white hover:border-zinc-500 active:scale-95 transition-all cursor-pointer group"
          title="Lên đầu trang"
        >
          <ArrowUp className="w-4 h-4 text-zinc-200 stroke-[2.5] group-hover:-translate-y-0.5 transition-transform" />
        </button>
        <button
          onClick={scrollToBottom}
          className="w-11 h-10 rounded-xl bg-zinc-950/90 border border-zinc-700/80 text-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-md flex items-center justify-center hover:bg-zinc-800 hover:text-white hover:border-zinc-500 active:scale-95 transition-all cursor-pointer group"
          title="Xuống cuối trang"
        >
          <ArrowDown className="w-4 h-4 text-zinc-200 stroke-[2.5] group-hover:translate-y-0.5 transition-transform" />
        </button>
      </div>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </div>
  );
}

function BotCard({ bot, onClick }: { bot: Bot; onClick: () => void }) {
  return (
    <div
      onClick={() => {
        playCardClickSound();
        onClick();
      }}
      className={`h-[260px] transition-transform hover:-translate-y-1 relative rounded-[20px] overflow-hidden cursor-pointer shadow-sm group border border-white/10 isolate`}
      style={{ transform: 'translateZ(0)', willChange: 'transform' }}
    >
      <img src={bot.avatar} alt={bot.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      
      {/* Badge "new try" cho bot mới */}
      {(bot as any).isNew && (
        <div className="absolute top-3 left-3 z-20 px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/40 backdrop-blur-md animate-pulse shadow-[0_0_10px_rgba(244,114,182,0.3)]">
          <span className="text-[8px] font-bold text-pink-100 uppercase tracking-wider flex items-center gap-1">
            new try <span className="text-[10px]">𝜗ৎ</span>
          </span>
        </div>
      )}

      {/* Nút Like đã bị gỡ bỏ theo yêu cầu */}

      {/* Subtle bottom gradient to make text readable without stark border */}
      <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" style={{ transform: 'translateZ(0)' }}></div>

      <div className="absolute inset-x-0 bottom-0 z-10 p-4 pointer-events-none w-full" style={{ transform: 'translateZ(0)' }}>
        <h3 className="text-sm font-bold leading-tight drop-shadow-md text-white line-clamp-1">{bot.name}</h3>
        <p className="text-[10px] italic text-zinc-300 drop-shadow-md mt-1 line-clamp-1">{bot.description}</p>
        <p className="text-[9px] font-medium drop-shadow-md text-zinc-300 mt-1.5 line-clamp-1">
          {bot.tags.map(t => `#${t}`).join(' ')}
        </p>
      </div>
    </div>
  );
}