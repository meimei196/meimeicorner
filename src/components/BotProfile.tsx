import { Bot, bots } from '../data/bots';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useStore } from '../lib/store';

export function BotProfile({ botId, onBack }: { botId: string; onBack: () => void }) {
  const bot = bots.find(b => b.id === botId);
  const stats = useStore((state) => state.botStats[botId]) || { chatCount: 0, likesCount: 0 };
  
  if (!bot) return null;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent">
      <header className="sticky top-0 z-50 p-4 flex items-center justify-center bg-black/60 backdrop-blur-md border-b border-white/10 shadow-sm relative">
        <button 
          onClick={onBack}
          className="absolute left-4 w-10 h-10 rounded-full flex items-center justify-center text-zinc-100 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center truncate max-w-[70%]">
          <h1 className="text-lg font-bold text-zinc-100 serif-title">{bot.name}</h1>
          <p className="text-[10px] text-zinc-400 truncate">{bot.description}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-8">
          
          {/* Cover & Avatar */}
          <div className="flex flex-col items-center">
            <div className="w-40 h-40 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-zinc-700 shadow-xl mb-6 relative">
               <img src={bot.avatar} alt={bot.name} className="w-full h-full object-cover" />
            </div>
            
            <h1 className="text-3xl font-bold text-zinc-100 text-center mb-2">{bot.name}</h1>
            <p className="text-sm text-zinc-400 italic text-center mb-4">{bot.description}</p>
            
            <div className="flex items-center gap-4 text-xs text-zinc-300 mb-6 font-medium">
               <span className="flex items-center gap-1">🤍 {formatNumber(stats.likesCount)} Lượt thích</span>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {bot.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-white/5 text-zinc-200 rounded-full text-[10px] font-semibold border border-white/10 shadow-sm backdrop-blur-sm">
                  #{tag}
                </span>
              ))}
            </div>

            <a 
              href={bot.link || "#"}
              target={bot.link ? "_blank" : "_self"}
              rel="noreferrer"
              onClick={(e) => {
                if (!bot.link) {
                  e.preventDefault();
                  alert(`Sắp ra mắt! Link tới model trò chuyện của ${bot.name} chưa được gắn.`);
                }
              }}
              className="group flex items-center gap-2 bg-zinc-100 hover:bg-white text-black px-8 py-3 rounded-full font-bold shadow-md transition-all hover:-translate-y-1"
            >
              Chơi với {bot.name}
              <ExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </a>
          </div>

          <div className="grid gap-6">
            {bot.backstory && (
            <div className="glass-panel p-6 rounded-3xl border-white/10">
               <h3 className="text-sm uppercase tracking-widest text-[#d4d4d8] font-bold mb-3">Backstory</h3>
               <p className="text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed">{bot.backstory}</p>
            </div>
            )}

            <div className="glass-panel p-6 rounded-3xl border-white/10">
               <h3 className="text-sm uppercase tracking-widest text-[#d4d4d8] font-bold mb-3">Mở đầu</h3>
               <p className="text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed italic">{bot.greeting}</p>
            </div>
            
            {bot.personality && (
              <div className="glass-panel p-6 rounded-3xl border-white/10">
                 <h3 className="text-sm uppercase tracking-widest text-[#d4d4d8] font-bold mb-3">Tính cách</h3>
                 <p className="text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed">{bot.personality}</p>
              </div>
            )}
            
            {bot.appearance && (
              <div className="glass-panel p-6 rounded-3xl border-white/10">
                 <h3 className="text-sm uppercase tracking-widest text-[#d4d4d8] font-bold mb-3">Ngoại hình</h3>
                 <p className="text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed">{bot.appearance}</p>
              </div>
            )}
            
            {bot.habits && (
              <div className="glass-panel p-6 rounded-3xl border-white/10">
                 <h3 className="text-sm uppercase tracking-widest text-[#d4d4d8] font-bold mb-3">Thói quen</h3>
                 <p className="text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed">{bot.habits}</p>
              </div>
            )}

            {bot.worldBuilding && (
              <div className="glass-panel p-6 rounded-3xl border-white/10">
                 <h3 className="text-sm uppercase tracking-widest text-[#d4d4d8] font-bold mb-3">World-Building</h3>
                 <p className="text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed">{bot.worldBuilding}</p>
              </div>
            )}

            {bot.userProfile && (
              <div className="glass-panel p-6 rounded-3xl border-white/10">
                 <h3 className="text-sm uppercase tracking-widest text-[#d4d4d8] font-bold mb-3">Hồ sơ User</h3>
                 <p className="text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed">{bot.userProfile}</p>
              </div>
            )}
            
            {(bot.charPrompt && bot.charPrompt.length > 0) && (
              <div className="glass-panel p-6 rounded-3xl border-white/10">
                <h3 className="text-sm uppercase tracking-widest text-[#d4d4d8] font-bold mb-3">Tính cách / Tương tác</h3>
                <p className="text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed opacity-80">{bot.charPrompt}</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
