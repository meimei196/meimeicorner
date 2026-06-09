import { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, AlertCircle, ChevronRight, Lightbulb } from 'lucide-react';

export function GuidelinesAuth({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'meimeicorner2026') {
      setError(false);
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-zinc-700 via-zinc-400 to-zinc-700 z-10"></div>
        
        <div className="p-8 sm:p-10 text-zinc-300 overflow-y-auto custom-scrollbar">
          <h2 className="text-2xl font-bold text-center text-white mb-8 tracking-wide">
            𝐒𝐨𝐦𝐞 𝐠𝐮𝐢𝐝𝐞𝐥𝐢𝐧𝐞𝐬 𝐟𝐨𝐫 𝐧𝐞𝐰𝐛𝐢𝐞𝐬
          </h2>

          <div className="space-y-4 text-sm leading-relaxed mb-8">
            <p className="flex items-start gap-3">
              <span className="text-zinc-500 mt-0.5">✎</span>
              <span>Vui lòng <strong className="text-white">không</strong> share pass/link bot public ra ngoài</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-zinc-500 mt-0.5">✎</span>
              <span>Hồ sơ giới thiệu bot trên web còn hơi sơ sài ｡°(°¯᷄◠¯᷅°)°｡ có gì sẽ update sau</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-zinc-500 mt-0.5">✎</span>
              <span>Những prompt chat dưới đây có sử dụng AI hỗ trợ nên giọng văn sẽ khá cứng ( ;´ - `;) tui đang cố gắng khắc phục</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-zinc-500 mt-0.5">✎</span>
              <span>Vì chưa thể pub hết link và cần testers nên đa phần những bản prompt này là bản draft, tui rất rất cần feedback của các bạn (,,&gt;ヮ&lt;,,)!</span>
            </p>
            
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl mt-4 flex gap-3 text-zinc-200">
              <AlertCircle className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
              <p>
                <strong className="text-white">LƯU Ý:</strong> Những bot này chủ yếu là hàng ngược nhẹ tới nặng và thuần BG (do chưa có thời gian build BL hjhj) nên mong mọi người sẽ fb đúng hồ sơ user nữ
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-xl mt-4 flex gap-3 text-zinc-200">
              <Lightbulb className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p>
                  <strong className="text-white">TIPS:</strong> vì để bot nhớ lâu hơn, mọi người sẽ điền thông tin user trong 'System instructions' -&gt; khi điền xong click nút 3 chấm góc phải -&gt; click 'Save prompt' trước khi chat.
                </p>
                <p>
                  Ở bên dưới sẽ là hồ sơ/bối cảnh/lore cơ bản của {"{{"}user{"}}"} cho mọi người đọc tham khảo.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 italic">
              𝑉𝑎̣̂𝑦 𝑚𝑜̣𝑖 𝑛𝑔𝑢̛𝑜̛̀𝑖 𝑛𝑒̂𝑛 𝑓𝑒𝑒𝑑𝑏𝑎𝑐𝑘 𝑐𝑎́𝑖 𝑔𝑖̀?
            </h3>
            <p className="text-xs text-zinc-400 mb-4">[rcm model 3.1 pro hoặc 3.5 flash vì tui thường chỉ test trên 2 con này]</p>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-zinc-500 mt-0.5">⤷</span>
                <span>Bot có đang bám sát tính cách không?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-zinc-500 mt-0.5">⤷</span>
                <span>Bot có trở nên mềm lòng/yêu user sớm không?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-zinc-500 mt-0.5">⤷</span>
                <span>Bot có nổi tính chiếm hữu tổng tài ngang không?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-zinc-500 mt-0.5">⤷</span>
                <span>Tình tiết RP có bị nhàm chán không?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-zinc-500 mt-0.5">⤷</span>
                <span>Xin thêm trải nghiệm của những bạn đã từng chat với bot bản cũ so với bản mới này (╥‸╥) tui sợ hong đúng ý users cũ...</span>
              </li>
            </ul>

            <p className="text-sm italic text-zinc-400 bg-white/5 p-4 rounded-xl">
              mà thời gian fb hong có deadline bắt buộc nên mấy bạn cứ thoải mái test nha =))))))) mọi người có thể fb thêm nhìu trải nghiệm khác nếu có, tui luôn hoan hỉ nhận ý kiến đóng góp và sẽ cân nhắc bổ sung ( ⸝⸝´ ᵕ `⸝⸝)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 pt-8 border-t border-white/10">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-300">
                Nhập mật khẩu để tiếp tục:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full pl-12 pr-4 py-3 bg-black/50 border rounded-xl 
                    text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-colors
                    ${error ? 'border-red-500/50' : 'border-white/10'}`}
                  placeholder="Enter password..."
                />
                <button
                  type="submit"
                  className="absolute inset-y-1 right-1 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              {error && (
                <p className="text-red-400 text-xs mt-1">Sai mật khẩu! Vui lòng thử lại.</p>
              )}
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
