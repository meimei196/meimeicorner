import { useState, useRef, useEffect } from 'react';
import { Bot, bots } from '../data/bots';
import { useStore } from '../lib/store';
import { Filter } from 'lucide-react';

export function Home({ onSelectBot }: { onSelectBot: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showTags, setShowTags] = useState(false);
  const likedBots = useStore((state) => state.likedBots);
  const subscribeToBotStats = useStore((state) => state.subscribeToBotStats);
  const tagsRef = useRef<HTMLDivElement>(null);

  const filterTags = ['School', 'FWB', 'Possessive', 'Teasing', 'Dominant', 'Sadist', 'Drama', 'Old man', 'Daddy vibe', 'Dead Dove', 'Vampire', 'Ex', 'Enemy', 'Mafia', 'Báo thù', 'Stepbrother', 'Arranged marriage', 'Royal', 'Bully', 'Colonel'];

  const filteredBots = bots.filter(
    (b) =>
      b.id !== 'system-osin' &&
      (b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))) &&
      (!activeTag || b.tags.some((t) => t.toLowerCase() === activeTag.toLowerCase() || t === activeTag))
  );

  useEffect(() => {
    // Subscribe to all visible bots
    const unsubscribers = filteredBots.map(bot => subscribeToBotStats(bot.id));
    return () => unsubscribers.forEach(unsub => unsub());
  }, [filteredBots.length]); // Re-subscribe when filter changes

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagsRef.current && !tagsRef.current.contains(event.target as Node)) {
        setShowTags(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto overflow-hidden relative">
      <header className="p-6 text-center relative">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-100 serif-title mb-1 drop-shadow-md">
          𝑚𝑒𝑖𝑚𝑒𝑖𝑐𝑜𝑟𝑛𝑒𝑟
        </h1>
        <p className="text-xs text-zinc-400 mb-4 drop-shadow-md">.✦ pick your husbandos and try 𝜗ৎ ݁˖</p>

        <div className="flex justify-center items-center">
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

      <main className="flex-1 px-8 pb-8 flex justify-center overflow-auto custom-scrollbar">
        <div className="w-full max-w-[800px] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-[260px] gap-4">
          {filteredBots.map((bot) => (
            <BotCard
              key={bot.id}
              bot={bot}
              onClick={() => onSelectBot(bot.id)}
              isLiked={likedBots.includes(bot.id)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

function BotCard({ bot, onClick, isLiked }: { bot: Bot; onClick: () => void; isLiked: boolean; key?: string }) {
  const toggleLike = useStore((state) => state.toggleLike);
  const stats = useStore((state) => state.botStats[bot.id]) || { chatCount: 0, likesCount: 0 };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div
      onClick={onClick}
      className={`h-[260px] transition-transform hover:-translate-y-1 relative rounded-[20px] overflow-hidden cursor-pointer shadow-sm group border border-white/10`}
    >
      <img src={bot.avatar} alt={bot.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      
      {/* Subtle bottom gradient to make text readable without stark border */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none"></div>

      <div 
        className="absolute top-3 right-3 text-white drop-shadow-lg cursor-pointer z-10 text-lg"
        onClick={(e) => { e.stopPropagation(); toggleLike(bot.id); }}
      >
        {isLiked ? '❤️' : '🤍'}
      </div>

      <div className="absolute bottom-0 w-full p-4 text-white z-10 flex flex-col justify-end">
        <p className="text-sm font-bold leading-tight drop-shadow-md">{bot.name}</p>
        <p className="text-[10px] italic text-zinc-300 truncate drop-shadow-md mt-0.5">{bot.description}</p>
        
        <div className="flex justify-between items-center mt-2 opacity-90 text-zinc-300">
          <span className="text-[9px] font-medium drop-shadow-md truncate pr-1">
            {bot.tags.map(t => `#${t}`).join(' ')}
          </span>
          <span className="text-[10px] whitespace-nowrap font-medium drop-shadow-md text-white">
             🤍 {formatNumber(stats.likesCount)}
          </span>
        </div>
      </div>
    </div>
  );
}
