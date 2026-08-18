import { useState, useRef, ReactNode } from 'react';
import { Bot, bots } from '../data/bots';
import { ArrowLeft, ExternalLink, ChevronDown, ChevronUp, User } from 'lucide-react';
import { useStore } from '../lib/store';
import { useAuthStore } from '../lib/user-auth-store';
import { BotCommentsSection } from './BotCommentsSection';

interface CollapsibleSectionProps {
  title: string;
  content: ReactNode;
}

function CollapsibleSection({ title, content }: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors group select-none"
      >
        <h3 className="text-sm uppercase tracking-widest text-[#d4d4d8] font-bold group-hover:text-white transition-colors">
          {title}
        </h3>
        <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-zinc-400 group-hover:text-zinc-200 transition-all">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 transition-transform duration-300" />
          ) : (
            <ChevronDown className="w-4 h-4 transition-transform duration-300" />
          )}
        </div>
      </button>
      
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-white/5 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {content}
        </div>
      )}
    </div>
  );
}

export function BotProfile({ botId, onBack }: { botId: string; onBack: () => void }) {
  const bot = bots.find(b => b.id === botId);
  const stats = useStore((state) => state.botStats[botId]) || { chatCount: 0, likesCount: 0 };
  const { currentUser, isAdmin, setIsAuthModalOpen } = useAuthStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  };
  
  if (!bot) return null;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const cleanText = part.slice(2, -2);
        return <strong key={index} className="font-bold text-zinc-100">{cleanText}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent">
      <header className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between bg-black/60 backdrop-blur-md border-b border-white/10 shadow-sm relative">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-100 hover:bg-white/10 transition-colors cursor-pointer"
          title="Quay lại"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center truncate max-w-[60%]">
          <h1 className="text-base sm:text-lg font-bold text-zinc-100 serif-title truncate">{bot.name}</h1>
          <p className="text-[10px] text-zinc-400 truncate">{bot.description}</p>
        </div>

        <button
          onClick={() => setIsAuthModalOpen(true)}
          className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer overflow-hidden shadow-sm ${
            isAdmin
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
              : currentUser
              ? 'bg-zinc-950/80 border-pink-400/30 text-pink-300'
              : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
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
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative">
        <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-8 pb-16">
          
          {/* Cover & Avatar */}
          <div className="flex flex-col items-center">
            <div className="w-40 h-40 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-zinc-700 shadow-xl mb-6 relative">
               <img src={bot.avatar} alt={bot.name} className="w-full h-full object-cover" />
            </div>
            
            <h1 className="text-3xl font-bold text-zinc-100 text-center mb-2">{bot.name}</h1>
            <p className="text-sm text-zinc-400 italic text-center mb-4">{bot.description}</p>
            
            <div className="flex items-center gap-4 text-xs text-zinc-300 mb-6 font-medium">
            
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {bot.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-white/5 text-zinc-200 rounded-full text-[10px] font-semibold border border-white/10 shadow-sm backdrop-blur-sm">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
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
                className="group flex items-center gap-2 bg-zinc-100 hover:bg-white text-black px-7 py-3 rounded-full font-bold shadow-md transition-all hover:-translate-y-1 text-sm"
              >
                Chơi với {bot.name}
                <ExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </a>
            </div>
          </div>

          <div className="grid gap-6">
            {bot.backstory && (
            <div className="glass-panel p-6 rounded-3xl border-white/10">
               <h3 className="text-sm uppercase tracking-widest text-[#d4d4d8] font-bold mb-3">Backstory</h3>
               <p className="text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed">{renderFormattedText(bot.backstory)}</p>
            </div>
            )}

            <div className="glass-panel p-6 rounded-3xl border-white/10">
               <h3 className="text-sm uppercase tracking-widest text-[#d4d4d8] font-bold mb-3">Mở đầu</h3>
               <p className="text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed italic">{renderFormattedText(bot.greeting)}</p>
            </div>
            
            {bot.charProfile && (
              <CollapsibleSection
                title="Hồ sơ nhân vật"
                content={<p className="text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed">{renderFormattedText(bot.charProfile)}</p>}
              />
            )}
            
            {bot.lore && (
              <CollapsibleSection
                title="HIDDEN LORE (spoil⚠️)"
                content={<p className="text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed">{renderFormattedText(bot.lore)}</p>}
              />
            )}

            {bot.worldBuilding && (
              <CollapsibleSection
                title="World-Building"
                content={<p className="text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed">{renderFormattedText(bot.worldBuilding)}</p>}
              />
            )}

            {bot.NPCsProfile && (
              <CollapsibleSection
                title="Các nhân vật phụ"
                content={<p className="text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed">{renderFormattedText(bot.NPCsProfile)}</p>}
              />
            )}
            
            {bot.command && (
              <CollapsibleSection
                title="Các lệnh"
                content={<p className="text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed">{renderFormattedText(bot.command)}</p>}
              />
            )}  

            {(bot.charPrompt && bot.charPrompt.length > 0) && (
              <CollapsibleSection
                title="Tính cách / Tương tác"
                content={<p className="text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed opacity-80">{renderFormattedText(bot.charPrompt)}</p>}
              />
            )}
          </div>

          {/* Anonymous Comments Section for this Bot */}
          <div className="pt-2">
            <BotCommentsSection botId={bot.id} botName={bot.name} />
          </div>

        </div>

        {/* Floating Quick Scroll Top / Bottom Buttons (Mobile & Desktop optimized) */}
        <div className="fixed bottom-6 right-4 z-40 flex flex-col gap-2">
          <button
            type="button"
            onClick={scrollToTop}
            className="w-10 h-10 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-pink-300 hover:text-white hover:bg-black/95 flex items-center justify-center shadow-2xl transition-all active:scale-90 cursor-pointer group"
            title="Cuộn lên đầu trang"
          >
            <ChevronUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
          <button
            type="button"
            onClick={scrollToBottom}
            className="w-10 h-10 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-pink-300 hover:text-white hover:bg-black/95 flex items-center justify-center shadow-2xl transition-all active:scale-90 cursor-pointer group"
            title="Cuộn xuống cuối trang"
          >
            <ChevronDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
