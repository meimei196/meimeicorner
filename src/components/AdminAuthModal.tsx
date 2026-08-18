import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Mail, Key, Sparkles, LogOut, CheckCircle2, ShieldAlert } from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAdminStore, ADMIN_SECRET_PASSCODE, ADMIN_EMAILS } from '../lib/admin-store';

export function AdminAuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, isAdmin, adminName, setAdminStatus, logout } =
    useAdminStore();

  const [tab, setTab] = useState<'passcode' | 'email' | 'google'>('passcode');
  const [passcode, setPasscode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isAuthModalOpen) return null;

  const handlePasscodeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (passcode.trim() === ADMIN_SECRET_PASSCODE) {
      setAdminStatus(true, 'Chủ Shop MeiMei 👑');
      setSuccessMsg('Đăng nhập quyền Admin thành công! ✨');
      setTimeout(() => {
        setIsAuthModalOpen(false);
      }, 1000);
    } else {
      setErrorMsg('Mã quản trị bí mật không chính xác! (Mặc định: meimei196)');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ Email và Mật khẩu');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isRegister) {
        const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const isAdminUser = ADMIN_EMAILS.includes(email.trim().toLowerCase());
        setAdminStatus(isAdminUser, userCred.user.email || 'Admin');
        setSuccessMsg('Đăng ký tài khoản thành công!');
      } else {
        const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
        const isAdminUser = ADMIN_EMAILS.includes(email.trim().toLowerCase()) || email.includes('admin') || email.includes('lananh');
        setAdminStatus(isAdminUser, userCred.user.email || 'Admin');
        setSuccessMsg('Đăng nhập thành công!');
      }

      setTimeout(() => {
        setIsAuthModalOpen(false);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMsg('Email hoặc mật khẩu không chính xác!');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Email này đã được đăng ký, hãy chuyển qua Đăng nhập!');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('Mật khẩu cần ít nhất 6 ký tự!');
      } else {
        setErrorMsg(err.message || 'Có lỗi xảy ra khi xác thực!');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userEmail = result.user.email || '';
      const isAdminUser = ADMIN_EMAILS.includes(userEmail.toLowerCase()) || userEmail.includes('lananh');
      setAdminStatus(isAdminUser, result.user.displayName || userEmail);
      setSuccessMsg(`Xin chào ${result.user.displayName || userEmail}!`);
      setTimeout(() => {
        setIsAuthModalOpen(false);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain') {
        setErrorMsg('Domain này chưa bật trong Google Auth. Bạn hãy dùng tab "Mã quản trị" hoặc "Email/Mật khẩu" nhé!');
      } else {
        setErrorMsg('Đăng nhập Google chưa hoàn tất hoặc bị hủy.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        id="admin-auth-backdrop"
        className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        onClick={() => setIsAuthModalOpen(false)}
      >
        <motion.div
          id="admin-auth-modal"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm bg-zinc-950 border border-white/15 rounded-3xl p-6 shadow-2xl overflow-hidden select-none text-zinc-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-serif tracking-wide text-zinc-100">
                  {isAdmin ? 'Quản trị viên MeiMei 👑' : 'Đăng nhập Quản trị / Admin'}
                </h3>
                <p className="text-[10px] text-zinc-400">
                  {isAdmin ? 'Quyền xoá cmt & bài viết đã kích hoạt' : 'Dành cho Sốp quản lý cmt & bài viết'}
                </p>
              </div>
            </div>

            <button
              id="close-admin-auth-btn"
              onClick={() => setIsAuthModalOpen(false)}
              className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Already Admin View */}
          {isAdmin ? (
            <div className="py-6 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-emerald-300">Bạn đang là Admin!</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Đang đăng nhập: <span className="font-semibold text-zinc-200">{adminName || 'Admin'}</span>
                </p>
                <p className="text-[11px] text-zinc-500 mt-2">
                  Bạn có thể xoá bất kỳ comment hoặc bài viết forum nào bằng nút thùng rác 🗑️.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  id="admin-logout-btn"
                  onClick={async () => {
                    await logout();
                    setAdminStatus(false);
                    setIsAuthModalOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất Admin
                </button>
                <button
                  onClick={() => setIsAuthModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 font-semibold text-xs transition-all cursor-pointer"
                >
                  Xong
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 space-y-4">
              {/* Tab Selector */}
              <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setTab('passcode');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    tab === 'passcode'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Mã bí mật ⚡
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('email');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    tab === 'email'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Email / Mật khẩu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('google');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    tab === 'google'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Google
                </button>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Tab 1: Secret Passcode */}
              {tab === 'passcode' && (
                <form onSubmit={handlePasscodeLogin} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 font-medium ml-1">
                      Mã quản trị nhanh (Sốp MeiMei):
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="password"
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        placeholder="Nhập mã bí mật..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/40"
                        autoFocus
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 ml-1">
                      *Mã mặc định: <span className="text-zinc-400 font-mono">meimei196</span>
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer mt-2"
                  >
                    Kích hoạt quyền Admin ✨
                  </button>
                </form>
              )}

              {/* Tab 2: Email & Password */}
              {tab === 'email' && (
                <form onSubmit={handleEmailAuth} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 font-medium ml-1">Email:</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="lananh196k3@gmail.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/40"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 font-medium ml-1">Mật khẩu:</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/40"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {loading
                      ? 'Đang xử lý...'
                      : isRegister
                      ? 'Đăng ký tài khoản'
                      : 'Đăng nhập'}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegister(!isRegister);
                        setErrorMsg('');
                      }}
                      className="text-[11px] text-pink-300/80 hover:text-pink-200 underline transition-colors"
                    >
                      {isRegister
                        ? 'Đã có tài khoản? Chuyển sang Đăng nhập'
                        : 'Chưa có tài khoản? Bấm để Đăng ký mới'}
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 3: Google Login */}
              {tab === 'google' && (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-400 leading-relaxed text-center">
                    Đăng nhập nhanh bằng tài khoản Google. (Nếu deploy ở domain Lovable/khác, hãy dùng Tab Mã bí mật hoặc Email nếu Google chặn domain).
                  </p>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-zinc-100 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Tiếp tục với Google</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
