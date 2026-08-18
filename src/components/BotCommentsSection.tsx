import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../lib/user-auth-store';
import { ImageLightbox } from './ImageLightbox';
import { compressImage } from '../lib/image-utils';
import {
  MessageSquare,
  Plus,
  Send,
  Trash2,
  Image as ImageIcon,
  X,
  Sparkles,
  User,
  Clock,
  Edit3,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BotCommentItem {
  id: string;
  botId: string;
  userId?: string;
  username?: string;
  nickname: string;
  avatar?: string;
  content: string;
  images?: string[];
  createdAt: number;
  editedAt?: number;
}

export function BotCommentsSection({ botId, botName }: { botId: string; botName: string }) {
  const { currentUser, isAdmin } = useAuthStore();
  const [comments, setComments] = useState<BotCommentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [nickname, setNickname] = useState(() => {
    if (currentUser?.nickname) return currentUser.nickname;
    return '';
  });
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Comment State
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);

  // Delete state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Lightbox states
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync nickname if user logs in or logs out
  useEffect(() => {
    if (currentUser) {
      setNickname(currentUser.nickname || currentUser.username || '');
    } else {
      setNickname('');
    }
  }, [currentUser]);

  // Subscribe to comments in Firestore
  useEffect(() => {
    setLoading(true);
    const commentsRef = collection(db, 'bot_comments');
    const q = query(commentsRef, where('botId', '==', botId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: BotCommentItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            botId: data.botId || botId,
            userId: data.userId || '',
            username: data.username || '',
            nickname: data.nickname || 'Bae ẩn danh 𝜗ৎ',
            avatar: data.avatar || '',
            content: data.content || '',
            images: Array.isArray(data.images) ? data.images : [],
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
            editedAt: typeof data.editedAt === 'number' ? data.editedAt : undefined,
          });
        });

        // Client-side sort by newest first
        list.sort((a, b) => b.createdAt - a.createdAt);
        setComments(list);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching comments:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [botId]);

  // Handle image selection (max 3)
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    if (selectedImages.length + files.length > 3) {
      alert('Tối đa 3 tấm ảnh cho mỗi bình luận thôi nhé bae 𝜗ৎ!');
      return;
    }

    setIsCompressing(true);
    try {
      const newBase64s: string[] = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const compressed = await compressImage(file, 1000, 1000, 0.78);
        newBase64s.push(compressed);
      }
      setSelectedImages((prev) => [...prev, ...newBase64s].slice(0, 3));
    } catch (err) {
      console.error('Error processing image:', err);
      alert('Không thể tải ảnh lên, bạn thử tấm ảnh khác nhé!');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && selectedImages.length === 0) return;

    setIsSubmitting(true);
    const finalNickname = currentUser
      ? (currentUser.nickname || currentUser.username)
      : (nickname.trim() || 'Bae ẩn danh 𝜗ৎ');

    try {
      const payload: any = {
        botId,
        nickname: finalNickname,
        content: content.trim(),
        images: selectedImages,
        createdAt: Date.now(),
      };

      if (currentUser) {
        payload.userId = currentUser.uid;
        payload.username = currentUser.username;
        if (currentUser.avatar) payload.avatar = currentUser.avatar;
      }

      // Add timeout safeguard of 8 seconds
      await Promise.race([
        addDoc(collection(db, 'bot_comments'), payload),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
      ]);

      setContent('');
      setSelectedImages([]);
    } catch (err) {
      console.error('Error submitting comment:', err);
      alert('Đã gửi bình luận hoặc có lỗi kết nối, hãy kiểm tra lại danh sách bình luận!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start editing
  const handleStartEdit = (cmt: BotCommentItem) => {
    setEditingCommentId(cmt.id);
    setEditCommentContent(cmt.content);
  };

  // Save edit comment
  const handleSaveEditComment = async (commentId: string) => {
    if (!editCommentContent.trim()) {
      alert('Nội dung bình luận không được để trống!');
      return;
    }

    setIsUpdatingComment(true);
    const trimmed = editCommentContent.trim();
    try {
      const cmtRef = doc(db, 'bot_comments', commentId);
      await Promise.race([
        updateDoc(cmtRef, {
          content: trimmed,
          editedAt: Date.now(),
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000))
      ]);

      // Optimistic local update
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, content: trimmed, editedAt: Date.now() } : c))
      );
      setEditingCommentId(null);
      setEditCommentContent('');
    } catch (err) {
      console.error('Error updating comment:', err);
      // Close edit on error/timeout so button never stays stuck
      setEditingCommentId(null);
    } finally {
      setIsUpdatingComment(false);
    }
  };

  // Delete comment (admin or owner)
  const handleDeleteComment = async (commentId: string) => {
    // Close modal immediately so it never stays stuck
    setDeleteTargetId(null);
    // Optimistic removal from UI list
    setComments((prev) => prev.filter((c) => c.id !== commentId));

    try {
      await Promise.race([
        deleteDoc(doc(db, 'bot_comments', commentId)),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000))
      ]);
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  // Helper to check if current user can edit/delete
  const canModifyComment = (cmt: BotCommentItem) => {
    if (isAdmin) return true;
    if (currentUser && cmt.userId && currentUser.uid === cmt.userId) return true;
    return false;
  };

  // Open Lightbox
  const openLightbox = (imgs: string[], idx: number) => {
    setLightboxImages(imgs);
    setLightboxIndex(idx);
    setIsLightboxOpen(true);
  };

  const formatTimestamp = (ts: number) => {
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    const date = new Date(ts);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  return (
    <div id="bot-comments-section" className="w-full pt-4 space-y-6">
      {/* Section Title */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-300">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-2">
              Bình luận ẩn danh
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-mono font-medium lowercase">
                {comments.length}
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Góc tâm sự, review & nhắn nhủ cho {botName} 𝜗ৎ
            </p>
          </div>
        </div>
      </div>

      {/* Input Comment Box */}
      <form
        onSubmit={handleSubmitComment}
        className="p-4 sm:p-5 rounded-3xl bg-zinc-950/70 border border-white/15 backdrop-blur-md shadow-xl space-y-3.5"
      >
        <div className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center">
          {/* Nickname display / input */}
          {currentUser ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-xs font-semibold text-pink-200">
              <div className="w-5 h-5 rounded-full bg-pink-500/30 overflow-hidden flex items-center justify-center text-[10px] text-white">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{(currentUser.nickname || currentUser.username).charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span>{currentUser.nickname || currentUser.username}</span>
              {isAdmin && <span className="text-[10px] text-amber-300 font-bold">👑</span>}
            </div>
          ) : (
            <div className="w-full sm:w-1/3 relative">
              <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Nickname (vd: Bé iu...)"
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-pink-500/40 transition-all"
                maxLength={40}
              />
            </div>
          )}

          <div className="text-[10px] text-zinc-500 flex items-center gap-1 sm:ml-auto">
            <Sparkles className="w-3 h-3 text-pink-400/60" />
            <span>{currentUser ? 'Đã đăng nhập - Có quyền sửa/xoá cmt' : 'Ai qua đường cũng cmt & up ảnh được nhé'}</span>
          </div>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Chia sẻ cảm nghĩ, review bot, dặn dò ${botName}...`}
            rows={3}
            className="w-full p-3.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/40 resize-none transition-all leading-relaxed"
          />
        </div>

        {/* Image Preview Grid */}
        {selectedImages.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {selectedImages.map((img, idx) => (
              <div
                key={idx}
                className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/20 group shadow-md"
              >
                <img
                  src={img}
                  alt={`Preview ${idx + 1}`}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => openLightbox(selectedImages, idx)}
                />
                <button
                  type="button"
                  onClick={() => removeSelectedImage(idx)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 hover:bg-red-500 text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Xoá ảnh"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Action Bottom Bar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={selectedImages.length >= 3 || isCompressing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all disabled:opacity-40 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-pink-300" />
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Thêm ảnh ({selectedImages.length}/3)</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              multiple
              className="hidden"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && selectedImages.length === 0)}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Đang gửi...</span>
            ) : (
              <>
                <span>Gửi cmt</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3.5 pt-2">
        {loading ? (
          <div className="py-8 text-center text-xs text-zinc-500 animate-pulse">
            Đang tải bình luận... 𝜗ৎ
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 px-4 rounded-3xl bg-white/[0.02] border border-white/5 text-center">
            <p className="text-xs font-medium text-zinc-400 font-serif italic">
              Chưa có bình luận nào cho {botName} hết nè.
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              Hãy là người đầu tiên để lại lời nhắn yêu thương nhé! 🎀
            </p>
          </div>
        ) : (
          comments.map((cmt) => {
            const isOwner = currentUser && cmt.userId && currentUser.uid === cmt.userId;
            const canModify = isAdmin || isOwner;

            return (
              <motion.div
                key={cmt.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 sm:p-5 rounded-3xl bg-zinc-950/60 border border-white/10 backdrop-blur-md shadow-md space-y-2.5 transition-all hover:border-white/20"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-white/15 flex items-center justify-center text-pink-200 text-xs font-bold font-serif overflow-hidden">
                      {cmt.avatar ? (
                        <img src={cmt.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{cmt.nickname.charAt(0).toUpperCase() || 'B'}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-bold text-zinc-200 font-serif tracking-wide">
                          {cmt.nickname}
                        </h4>
                        {cmt.userId === 'admin_meimeicorner' && (
                          <span className="text-[10px] text-amber-300 font-bold">👑 Sốp</span>
                        )}
                        {cmt.editedAt && (
                          <span className="text-[9px] text-zinc-500 italic">(đã chỉnh sửa)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{formatTimestamp(cmt.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions (Edit / Delete) */}
                  {canModify && (
                    <div className="flex items-center gap-1">
                      {isOwner && editingCommentId !== cmt.id && (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cmt)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                          title="Chỉnh sửa bình luận"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteTargetId(cmt.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                        title="Xoá bình luận"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Content or Edit Form */}
                {editingCommentId === cmt.id ? (
                  <div className="space-y-2 pt-1">
                    <textarea
                      value={editCommentContent}
                      onChange={(e) => setEditCommentContent(e.target.value)}
                      rows={2}
                      className="w-full p-3 rounded-xl bg-white/5 border border-pink-500/40 text-xs sm:text-sm text-zinc-100 focus:outline-none resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingCommentId(null)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-400"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        disabled={isUpdatingComment}
                        onClick={() => handleSaveEditComment(cmt.id)}
                        className="px-3 py-1.5 rounded-lg bg-pink-500/80 hover:bg-pink-500 text-xs font-bold text-white flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>{isUpdatingComment ? 'Đang lưu...' : 'Lưu'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  cmt.content && (
                    <p className="text-xs sm:text-sm text-zinc-200/95 whitespace-pre-wrap leading-relaxed">
                      {cmt.content}
                    </p>
                  )
                )}

                {/* Attached Photos */}
                {cmt.images && cmt.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {cmt.images.map((imgUrl, imgIdx) => (
                      <div
                        key={imgIdx}
                        onClick={() => openLightbox(cmt.images!, imgIdx)}
                        className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-white/15 cursor-pointer shadow-md group hover:scale-[1.02] transition-transform"
                      >
                        <img
                          src={imgUrl}
                          alt="Bình luận đính kèm"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold backdrop-blur-[1px]">
                          🔍 Phóng to
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTargetId && (
          <div
            className="fixed inset-0 z-[100001] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setDeleteTargetId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xs bg-zinc-950 border border-white/15 rounded-3xl p-5 shadow-2xl text-center space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-100">Xoá bình luận này?</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Hành động này không thể khôi phục sau khi xoá.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTargetId(null)}
                  className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteComment(deleteTargetId)}
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
                >
                  Xoá ngay
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox for viewing photos inside page */}
      <ImageLightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onNavigate={(idx) => setLightboxIndex(idx)}
      />
    </div>
  );
}
