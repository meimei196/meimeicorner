import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { playFortuneClickSound } from '../lib/sound';

interface Hexagram {
  name: string;
  symbol: string;
  meaning: string;
  advice: string;
}

const HEXAGRAMS: Hexagram[] = [
  {
    name: "Quẻ số 1 - Thuần Càn",
    symbol: "䷀",
    meaning: "Trời mang tính dương cương mạnh mẽ, chủ động và kiêu hãnh.",
    advice: "Đại cát. Mọi việc đều hanh thông, thuận lợi. Tuy nhiên cần giữ thái độ khiêm nhường, tránh kiêu ngạo để giữ được sự bền vững lâu dài."
  },
  {
    name: "Quẻ số 2 - Thuần Khôn",
    symbol: "䷁",
    meaning: "Đất mang tính âm nhu, bao dung, tiếp nhận và vâng phục.",
    advice: "Đại cát. Hãy hành động với sự bao dung, mềm mỏng và kiên nhẫn. Lắng nghe người khác sẽ mang lại lợi ích lớn lao hơn là tranh giành."
  },
  {
    name: "Quẻ số 3 - Thủy Lôi Truân",
    symbol: "䷂",
    meaning: "Gian nan lúc khởi đầu giống như mầm non vượt qua lớp đất cứng.",
    advice: "Vạn sự khởi đầu nan. Hãy giữ vững ý chí và kiên trì nhẫn nại. Qua được giai đoạn khó khăn ban đầu, mọi thứ sẽ dần trở nên xán lạn."
  },
  {
    name: "Quẻ số 4 - Sơn Thủy Mông",
    symbol: "䷃",
    meaning: "Sương mù che phủ chân núi, sự non nớt và mông lung cần dẫn dắt.",
    advice: "Khi chưa hiểu rõ vấn đề, đừng hành động vội vàng. Hãy tìm kiếm sự chỉ dẫn từ người đi trước hoặc những người có kinh nghiệm."
  },
  {
    name: "Quẻ số 10 - Thiên Trạch Lý",
    symbol: "䷉",
    meaning: "Đi sau đuôi cọp, bước đi đầy mạo hiểm nhưng cực kỳ khéo léo.",
    advice: "Cẩn trọng trong từng hành động và lời nói. Dù ở trong hoàn cảnh nguy hiểm nhưng nếu biết giữ đúng lễ nghĩa và sự kính trọng, sẽ vượt qua bình an."
  },
  {
    name: "Quẻ số 11 - Địa Thiên Thái",
    symbol: "䷊",
    meaning: "Trời đất giao hòa, vạn vật hanh thông, thái bình thịnh vượng.",
    advice: "Thời vận vô cùng tốt đẹp. Mọi sự bình an, hòa hợp. Đây là lúc thích hợp để phát triển các mối quan hệ và tiến hành những việc quan trọng."
  },
  {
    name: "Quẻ số 12 - Thiên Địa Bĩ",
    symbol: "䷋",
    meaning: "Trời đất không giao hòa, bế tắc, cô lập và thờ ơ.",
    advice: "Giai đoạn khó khăn, bế tắc. Không nên mạo hiểm tiến lên. Hãy ẩn mình chờ đợi, giữ gìn phẩm chất và chờ thời cơ tốt hơn."
  },
  {
    name: "Quẻ số 13 - Thiên Hỏa Đồng Nhân",
    symbol: "䷌",
    meaning: "Cùng chung chí hướng, sự đồng điệu tâm hồn giữa dòng người.",
    advice: "Cát lợi khi hợp tác và kết giao. Hãy mở rộng lòng mình, đoàn kết với những người có cùng chí hướng, mọi việc sẽ đạt được thành tựu lớn."
  },
  {
    name: "Quẻ số 14 - Hỏa Thiên Đại Hữu",
    symbol: "䷍",
    meaning: "Lửa sáng trên trời, sự sở hữu rộng lớn và sung túc vô bờ.",
    advice: "Thời kỳ sung túc và dồi dào. Nhưng hãy nhớ chia sẻ và giúp đỡ người khác, đừng giữ sự ích kỷ, như vậy may mắn mới lâu bền."
  },
  {
    name: "Quẻ số 15 - Địa Sơn Khiêm",
    symbol: "䷎",
    meaning: "Núi ẩn mình dưới đất sâu, sự nhún nhường và tự tôn vô hình.",
    advice: "Sự khiêm tốn mang lại phước lành. Dù có tài năng hay thành tựu, hãy biết nhún nhường, tránh khoe khoang. Mọi sự sẽ bình an và được nể trọng."
  },
  {
    name: "Quẻ số 31 - Trạch Sơn Hàm",
    symbol: "䷞",
    meaning: "Hồ nước trên đỉnh núi, sự cảm ứng rung động và hút nhau mãnh liệt.",
    advice: "Sự thấu cảm và chân thành sẽ kết nối trái tim. Đừng dùng thủ đoạn, hãy tiếp cận mọi việc bằng sự đồng cảm và tấm lòng thành thật."
  },
  {
    name: "Quẻ số 44 - Thiên Phong Cấu",
    symbol: "䷫",
    meaning: "Gió thổi dưới gầm trời, sự gặp gỡ bất ngờ mang đầy duyên nợ.",
    advice: "Cẩn thận với những sự kiện hoặc mối quan hệ bất ngờ. Không phải sự gặp gỡ nào cũng mang lại điều tốt, hãy giữ sự tỉnh táo và phán đoán đúng đắn."
  },
  {
    name: "Quẻ số 54 - Lôi Trạch Quy Muội",
    symbol: "䷵",
    meaning: "Sấm sét trên hồ nước, tiến lên một cách vội vã, không hợp thứ tự.",
    advice: "Đừng quá vội vàng tiến tới mà quên đi những quy tắc và sự chuẩn bị cần thiết. Hành động nôn nóng lúc này có thể dẫn đến hậu quả không mong muốn."
  }
];

export function FortuneWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [hexagram, setHexagram] = useState<Hexagram | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const checkDailyFortune = () => {
      const stored = localStorage.getItem('dailyHexagram');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          const today = new Date().toDateString();
          if (data.date === today && data.hexagram) {
            setHexagram(data.hexagram);
          } else {
            localStorage.removeItem('dailyHexagram');
          }
        } catch (e) {
          localStorage.removeItem('dailyHexagram');
        }
      }
    };
    checkDailyFortune();
  }, []);

  const drawFortune = () => {
    playFortuneClickSound();

    if (hexagram) {
      setIsOpen(true);
      return;
    }

    setIsOpen(true);
    setIsDrawing(true);
    
    setTimeout(() => {
      const random = HEXAGRAMS[Math.floor(Math.random() * HEXAGRAMS.length)];
      setHexagram(random);
      setIsDrawing(false);
      localStorage.setItem('dailyHexagram', JSON.stringify({
        date: new Date().toDateString(),
        hexagram: random
      }));
    }, 1500);
  };

  return (
    <>
      <div className="flex justify-center mt-2">
        <button
          onClick={drawFortune}
          className="relative flex items-center justify-center px-6 py-2 rounded-full bg-zinc-900/60 border border-zinc-700 text-zinc-300 text-sm font-serif italic hover:bg-zinc-800 hover:text-zinc-100 transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] group overflow-hidden"
        >
          {/* Subtle glowing sweep effect */}
          <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
          <span className="relative z-10 flex items-center gap-1.5">
            Thông điệp hôm nay ✦
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-zinc-400 text-xs"></span>
          </span>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-zinc-950/95 backdrop-blur-2xl rounded-2xl p-[1.5px] shadow-[0_0_50px_rgba(255,255,255,0.15)] relative text-center overflow-hidden"
            >
              {/* Fancy animated glowing border with silver/zinc metallic gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-750 via-white to-zinc-750 animate-[spin_4s_linear_infinite]" />
              
              <div className="relative w-full h-full bg-zinc-950 rounded-2xl p-8 z-10 border border-white/5 flex flex-col items-center">
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <h3 className="text-2xl font-bold text-zinc-100 mb-6 serif-title tracking-wide italic">
                  Lá Bài Định Mệnh
                </h3>
                
                {isDrawing ? (
                  <div className="py-8 flex flex-col items-center gap-6">
                    <div className="w-12 h-16 bg-zinc-900 border border-zinc-700 rounded-lg animate-bounce shadow-xl flex items-center justify-center">
                      <span className="text-2xl text-zinc-400">䷏</span>
                    </div>
                    <p className="text-sm text-zinc-400 animate-pulse font-serif italic">Đang bốc quẻ Kinh Dịch...</p>
                  </div>
                ) : (
                  hexagram && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center"
                    >
                      <div className="text-5xl text-zinc-100 my-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] animate-pulse">
                        {hexagram.symbol}
                      </div>
                      
                      <h4 className="text-base font-bold text-zinc-100 tracking-wider font-serif italic mb-2">
                        {hexagram.name}
                      </h4>
                      
                      <p className="text-[11px] text-zinc-500 leading-relaxed mb-6 px-2 italic">
                        Tượng quẻ: {hexagram.meaning}
                      </p>
                      
                      <div className="w-full h-[1px] bg-zinc-800 mb-6" />
                      
                      <p className="text-xs sm:text-sm leading-relaxed text-zinc-300 font-serif italic">
                        {hexagram.advice}
                      </p>
                    </motion.div>
                  )
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}