import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  Lock,
  LogOut,
  Camera,
  Check,
  Edit3,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../lib/user-auth-store';
import { compressImage } from '../lib/image-utils';

export function UserAuthModal() {
  const {
    currentUser,
    isAdmin,
    isAuthModalOpen,
    setIsAuthModalOpen,
    loginUser,
    registerUser,
    updateProfile,
    logout,
  } = useAuthStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  if (!isAuthModalOpen) return null;

  // Initialize edit fields when opening profile
  const handleStartEdit = () => {
    if (currentUser) {
      setEditNickname(currentUser.nickname || currentUser.username || '');
      setEditBio(currentUser.bio || '');
      setEditAvatar(currentUser.avatar || '');
      setIsEditingProfile(true);
      setErrorMsg('');
      setSuccessMsg('');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh hợp lệ!');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Compress avatar to compact base64
      const compressed = await compressImage(file, 250, 250, 0.85);
      setEditAvatar(compressed);
    } catch (err) {
      console.error('Error compressing avatar:', err);
      alert('Không thể xử lý ảnh này, bạn thử ảnh khác nhé!');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNickname.trim()) {
      setErrorMsg('Tên / Nickname không được để trống!');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await updateProfile({
        nickname: editNickname.trim(),
        bio: editBio.trim(),
        avatar: editAvatar,
      });

      setSuccessMsg('Cập nhật hồ sơ thành công! ✨');
      setTimeout(() => {
        setIsEditingProfile(false);
        setSuccessMsg('');
        setLoading(false);
      }, 400);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Không thể lưu hồ sơ, vui lòng thử lại!');
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ tên tài khoản và mật khẩu!');
      return;
    }

    setLoading(true);

    if (mode === 'login') {
      const res = await loginUser(username, password);
      setLoading(false);
      if (res.success) {
        setSuccessMsg(
          username.trim().toLowerCase() === 'meimeicorner'
            ? 'Đăng nhập thành công với quyền Sốp meimeicorner 👑'
            : 'Đăng nhập thành công! ✨'
        );
        setTimeout(() => {
          setIsAuthModalOpen(false);
          setUsername('');
          setPassword('');
          setSuccessMsg('');
        }, 800);
      } else {
        setErrorMsg(res.error || 'Đăng nhập thất bại!');
      }
    } else {
      const res = await registerUser(username, password, nickname);
      setLoading(false);
      if (res.success) {
        setSuccessMsg('Đăng ký tài khoản thành công! Chào mừng bạn 𝜗ৎ');
        setTimeout(() => {
          setIsAuthModalOpen(false);
          setUsername('');
          setPassword('');
          setNickname('');
          setSuccessMsg('');
        }, 900);
      } else {
        setErrorMsg(res.error || 'Đăng ký thất bại!');
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsEditingProfile(false);
    setIsAuthModalOpen(false);
  };

  return (
    <AnimatePresence>
      <div
        id="user-auth-backdrop"
        className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        onClick={() => setIsAuthModalOpen(false)}
      >
        <motion.div
          id="user-auth-modal"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm bg-zinc-950 border border-white/15 rounded-3xl p-6 shadow-2xl overflow-hidden select-none text-zinc-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Close Button */}
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* ================= CASE 1: LOGGED IN USER PROFILE ================= */}
          {currentUser ? (
            <div className="space-y-5 pt-1">
              {/* Header Title */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-300">
                  {isAdmin ? <Shield className="w-4 h-4 text-amber-400" /> : <Sparkles className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold font-serif tracking-wide text-zinc-100 flex items-center gap-1.5">
                    <span>{isAdmin ? 'Sốp meimeicorner' : 'Tài khoản của bạn'}</span>
                    {isAdmin && <span className="text-xs">👑</span>}
                  </h3>
                  <p className="text-[10px] text-zinc-400">
                    {isAdmin ? 'Đặc quyền quản trị & quản lý' : 'Thành viên meimeicorner 𝜗ৎ'}
                  </p>
                </div>
              </div>

              {/* View / Edit Mode */}
              {!isEditingProfile ? (
                <div className="space-y-4">
                  {/* Avatar & Info */}
                  <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/[0.03] border border-white/10 relative overflow-hidden group">
                    <div className="relative mb-3">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-pink-400/40 shadow-[0_0_15px_rgba(244,114,182,0.2)] bg-zinc-900 flex items-center justify-center text-2xl font-serif font-bold text-pink-200">
                        {currentUser.avatar ? (
                          <img
                            src={currentUser.avatar}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{(currentUser.nickname || currentUser.username || 'B').charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-zinc-100 font-serif flex items-center gap-1.5">
                      <span>{currentUser.nickname || currentUser.username}</span>
                      {isAdmin && <span className="text-amber-300 text-xs">👑</span>}
                    </h4>

                    <p className="text-xs text-pink-300/80 font-mono mt-0.5">
                      @{currentUser.username}
                    </p>

                    {/* Bio */}
                    <div className="mt-3 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-300 font-sans italic text-center max-h-24 overflow-y-auto custom-scrollbar">
                      {currentUser.bio || 'Chưa có tiểu sử giới thiệu 𝜗ৎ'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-zinc-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-pink-400" />
                      <span>Sửa hồ sơ</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-semibold text-red-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Edit Profile Form */
                <form onSubmit={handleSaveProfile} className="space-y-3.5 text-left">
                  {/* Avatar Upload */}
                  <div className="flex flex-col items-center gap-2 pb-1">
                    <div
                      onClick={() => avatarInputRef.current?.click()}
                      className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-pink-400/50 hover:border-pink-400 bg-zinc-900 flex items-center justify-center cursor-pointer group shadow-md"
                    >
                      {editAvatar ? (
                        <img src={editAvatar} alt="Edit Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-zinc-500 group-hover:text-pink-300 transition-colors" />
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                        <Camera className="w-5 h-5 mb-0.5" />
                        <span className="text-[9px] font-bold">Đổi ảnh</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-400 italic">Click vào avatar để tải ảnh mới</span>
                    <input
                      type="file"
                      ref={avatarInputRef}
                      onChange={handleAvatarChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  {/* Nickname Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold ml-1">
                      Tên hiển thị / Nickname:
                    </label>
                    <input
                      type="text"
                      value={editNickname}
                      onChange={(e) => setEditNickname(e.target.value)}
                      placeholder="Nhập tên của bạn..."
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-200 focus:outline-none focus:border-pink-500/40"
                      maxLength={40}
                      required
                    />
                  </div>

                  {/* Bio Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold ml-1">
                      Tiểu sử giới thiệu (Bio):
                    </label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Viết vài dòng giới thiệu về bản thân hoặc gu bot của bạn..."
                      rows={3}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/40 resize-none"
                      maxLength={180}
                    />
                  </div>

                  {errorMsg && <p className="text-xs text-red-400 text-center">{errorMsg}</p>}
                  {successMsg && <p className="text-xs text-green-400 text-center">{successMsg}</p>}

                  {/* Save / Cancel buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      disabled={loading || isUploadingAvatar}
                      className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-400 hover:text-white transition-all cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={loading || isUploadingAvatar}
                      className="py-2.5 px-4 rounded-xl bg-pink-500/80 hover:bg-pink-500 text-xs font-bold text-white shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {loading ? 'Đang lưu...' : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Lưu hồ sơ</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* ================= CASE 2: LOGIN / REGISTER MODAL ================= */
            <div className="space-y-5 pt-1">
              {/* Header Title */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-300">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-serif tracking-wide text-zinc-100">
                    {mode === 'login' ? 'Đăng nhập tài khoản' : 'Tạo tài khoản mới'}
                  </h3>
                  <p className="text-[10px] text-zinc-400">
                    {mode === 'login' ? 'Đăng nhập để giữ nickname & cmt zai' : 'Gia nhập góc nhỏ meimeicorner 𝜗ৎ'}
                  </p>
                </div>
              </div>

              {/* Mode Tabs */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-zinc-100 text-zinc-950 shadow-sm font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    mode === 'register'
                      ? 'bg-zinc-100 text-zinc-950 shadow-sm font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Đăng ký
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-3 text-left">
                {/* Username Input */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold ml-1">
                    Tên tài khoản:
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="vd: meimeicorner hoặc tên của bạn"
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/40"
                      required
                    />
                  </div>
                </div>

                {/* Nickname (only on register) */}
                {mode === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold ml-1">
                      Nickname hiển thị (tùy chọn):
                    </label>
                    <div className="relative">
                      <Sparkles className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-pink-400" />
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="vd: Bé Mèo 𝜗ৎ"
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/40"
                        maxLength={40}
                      />
                    </div>
                  </div>
                )}

                {/* Password Input */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold ml-1">
                    Mật khẩu:
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu..."
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/40"
                      required
                    />
                  </div>
                </div>

                {/* Error & Success Messages */}
                {errorMsg && (
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 text-center">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-300 text-center">
                    {successMsg}
                  </div>
                )}

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs sm:text-sm shadow-xl transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span>Đang xử lý...</span>
                    ) : mode === 'login' ? (
                      <span>Đăng nhập</span>
                    ) : (
                      <span>Đăng ký ngay 𝜗ৎ</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
