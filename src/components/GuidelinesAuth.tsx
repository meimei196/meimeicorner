import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, ShieldAlert, HeartCrack } from 'lucide-react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../lib/firebase';

export function GuidelinesAuth({ onSuccess }: { onSuccess: () => void }) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleEnter = () => {
    // Synchronously play a silent audio to unlock unmuted audio context for mobile browsers
    try {
      const silentAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==");
      silentAudio.play().catch(() => {});
    } catch {
      // ignore
    }

    // Trigger synchronous user gesture event to unlock mobile audio autoplay policy
    window.dispatchEvent(new Event('app-user-entered'));

    setIsLoggingIn(true);
    
    // Call onSuccess immediately so user enters app without any delay in FB In-App Browser
    onSuccess();

    // Perform Firebase anonymous sign-in in background
    signInAnonymously(auth)
      .then(() => {
        setIsLoggingIn(false);
      })
      .catch((err) => {
        console.warn("Firebase auth background warning:", err);
        setIsLoggingIn(false);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xl max-h-[90vh] flex flex-col bg-zinc-950/90 backdrop-blur-2xl border border-zinc-800/60 rounded-3xl overflow-hidden shadow-2xl relative"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-zinc-800 via-zinc-400 to-zinc-800 z-10"></div>
        
        {/* Sticky Header */}
        <div className="pt-8 px-6 sm:px-10 pb-4 text-center shrink-0">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-100 serif-title drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] animate-pulse" style={{ animationDuration: '3s' }}>
            <span className="relative inline-block">
              meimeicorner
              <motion.span
                animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8], rotate: [0, 45, 90] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute -top-3 -right-6 text-zinc-400"
              >
                ✦
              </motion.span>
              <motion.span
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5], rotate: [90, 45, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 1 }}
                className="absolute -bottom-1 -left-4 text-zinc-500 text-sm"
              >
                ✦
              </motion.span>
            </span>
          </h1>
        </div>

        {/* Scrollable Content */}
        <div className="px-6 sm:px-10 pb-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="w-full bg-zinc-900/40 border border-zinc-800/60 p-5 sm:p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-5">
              <HeartCrack className="w-24 h-24 text-zinc-400" />
            </div>
            
            <div className="flex items-center gap-3 mb-4 text-zinc-300">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-base sm:text-lg font-bold tracking-widest uppercase">Disclaimer / Cảnh báo</h3>
            </div>
            
            <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-zinc-400 relative z-10">
              <p>
                Chào mừng bạn đến với góc nhỏ của sốp. Trước khi bước vào, vui lòng lưu ý:
              </p>
              
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-zinc-500 mt-0.5">✦</span>
                  <span><strong>Nội dung 18+:</strong> Các bot ở đây đa phần theo khuynh hướng <strong>Dark Romance, Ngược luyến, NSFW 🔞</strong> và có thể chứa yếu tố bạo lực tâm lý/thể xác.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-zinc-500 mt-0.5">✦</span>
                  <span><strong>Giả tưởng hoàn toàn:</strong> Mọi tình huống, tính cách nhân vật đều là hư cấu. Sốp <strong>tuyệt đối không</strong> cổ xúy hay khuyến khích các hành vi độc hại, bạo lực áp dụng vào thực tế. Hãy phân định rạch ròi giữa thế giới ảo và đời thực.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-zinc-500 mt-0.5">✦</span>
                  <span><strong>Thử nghiệm:</strong> Các bot hiện vẫn đang trong quá trình test và hoàn thiện. Do sốp không sử dụng Discord nên mọi thứ sẽ được pub trực tiếp tại đây. Nếu có bất kỳ lỗi nào & muốn góp ý, có thể fb ẩn danh hoặc liên hệ qua FB của sốp.</span>
                </li>
              </ul>
              
              <p className="pt-2 text-zinc-300 font-medium italic text-center">
                Nếu bé iu đã đủ 18 tuổi và có một tinh thần thép để đón nhận những chiếc cờ đỏ rực rỡ này...
              </p>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="p-6 sm:p-10 pt-2 shrink-0">
          {/* Profile Platform Links */}
          <div className="flex justify-center items-center gap-8 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300 fill-mode-both">
            <a 
              href="https://yodayo.com/@meimei196" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="group flex flex-col items-center gap-1.5 transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-pink-500/5 border border-pink-500/10 flex items-center justify-center text-pink-300/40 group-hover:bg-pink-500/20 group-hover:border-pink-500/30 group-hover:text-pink-200 transition-all shadow-sm">
                <span className="text-[9px] font-black tracking-tighter">YDY</span>
              </div>
              <span className="text-[7px] uppercase tracking-[0.2em] text-zinc-600 font-bold group-hover:text-pink-400/60 transition-colors">Yodayo</span>
            </a>
            <a 
              href="https://character.ai/profile/mei196" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="group flex flex-col items-center gap-1.5 transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-pink-500/5 border border-pink-500/10 flex items-center justify-center text-pink-300/40 group-hover:bg-pink-500/20 group-hover:border-pink-500/30 group-hover:text-pink-200 transition-all shadow-sm">
                <span className="text-[9px] font-black tracking-tighter">C.AI</span>
              </div>
              <span className="text-[7px] uppercase tracking-[0.2em] text-zinc-600 font-bold group-hover:text-pink-400/60 transition-colors">C.AI</span>
            </a>
            <a 
              href="https://xoul.ai/profile/meimei196" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="group flex flex-col items-center gap-1.5 transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-pink-500/5 border border-pink-500/10 flex items-center justify-center text-pink-300/40 group-hover:bg-pink-500/20 group-hover:border-pink-500/30 group-hover:text-pink-200 transition-all shadow-sm">
                <span className="text-[9px] font-black tracking-tighter">XOL</span>
              </div>
              <span className="text-[7px] uppercase tracking-[0.2em] text-zinc-600 font-bold group-hover:text-pink-400/60 transition-colors">Xoul</span>
            </a>
          </div>

          <button
            onClick={handleEnter}
            disabled={isLoggingIn}
            className="relative w-full py-4 bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 font-semibold tracking-wide transition-all flex items-center justify-center gap-2 group disabled:opacity-50 shadow-[0_0_15px_rgba(255,255,255,0.05)] overflow-hidden"
          >
            {/* Glowing sweep effect */}
            <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            
            {isLoggingIn ? (
              <div className="w-5 h-5 border-2 border-zinc-400 border-t-zinc-100 rounded-full animate-spin relative z-10"></div>
            ) : (
              <span className="relative z-10 flex items-center gap-2">
                mời zào đây cùng sốp <span className="group-hover:animate-bounce">𝜗ৎ</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
