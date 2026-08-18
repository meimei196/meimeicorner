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
  increment,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../lib/user-auth-store';
import { ImageLightbox } from './ImageLightbox';
import { compressImage } from '../lib/image-utils';
import {
  ArrowLeft,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  Image as ImageIcon,
  X,
  Sparkles,
  User,
  Clock,
  Heart,
  Flame,
  Laugh,
  Search,
  Edit3,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playCardClickSound } from '../lib/sound';

export interface ForumPostItem {
  id: string;
  userId?: string;
  username?: string;
  title: string;
  content: string;
  nickname: string;
  avatar?: string;
  botName?: string;
  tag?: string;
  images?: string[];
  reactions?: Record<string, number>;
  commentCount?: number;
  createdAt: number;
  editedAt?: number;
}

export interface ForumCommentItem {
  id: string;
  postId: string;
  userId?: string;
  username?: string;
  nickname: string;
  avatar?: string;
  content: string;
  images?: string[];
  createdAt: number;
  editedAt?: number;
}

const FORUM_TAGS = [
  'Tất cả',
  'Simp zai 🍒',
  'Tâm sự 💌',
  'Review bot ✨',
];

const REACTION_TYPES = [
  { key: 'heart', emoji: '❤️', label: 'Mê xỉu' },
  { key: 'cherry', emoji: '🍒', label: 'Nóng bỏng' },
  { key: 'sob', emoji: '😭', label: 'Cảm động' },
  { key: 'laugh', emoji: '😂', label: 'Cười xỉu' },
  { key: 'fire', emoji: '🔥', label: 'Cháy quá' },
];

export function ForumPage({ onBack, onSelectBot }: { onBack: () => void; onSelectBot?: (id: string) => void }) {
  const { currentUser, isAdmin, setIsAuthModalOpen } = useAuthStore();
  const [posts, setPosts] = useState<ForumPostItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedTag, setSelectedTag] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  // Create post modal
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postNickname, setPostNickname] = useState(() => {
    if (currentUser?.nickname) return currentUser.nickname;
    return '';
  });
  const [postBotName, setPostBotName] = useState('');
  const [postTag, setPostTag] = useState('Simp zai 🍒');
  const [postImages, setPostImages] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'post' | 'comment'; id: string; postId?: string } | null>(null);

  // Expanded post comments
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  // Lightbox
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync nickname when currentUser changes (logs in or logs out)
  useEffect(() => {
    if (currentUser) {
      setPostNickname(currentUser.nickname || currentUser.username || '');
    } else {
      setPostNickname('');
    }
  }, [currentUser]);

  // Realtime subscription to forum posts
  useEffect(() => {
    setLoading(true);
    const postsRef = collection(db, 'forum_posts');

    const unsubscribe = onSnapshot(
      postsRef,
      (snapshot) => {
        const list: ForumPostItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            userId: data.userId || '',
            username: data.username || '',
            title: data.title || '',
            content: data.content || '',
            nickname: data.nickname || 'Bae ẩn danh 𝜗ৎ',
            avatar: data.avatar || '',
            botName: data.botName || '',
            tag: data.tag || 'Simp zai 🍒',
            images: Array.isArray(data.images) ? data.images : [],
            reactions: data.reactions || {},
            commentCount: data.commentCount || 0,
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
            editedAt: typeof data.editedAt === 'number' ? data.editedAt : undefined,
          });
        });

        // Client-side sort by newest
        list.sort((a, b) => b.createdAt - a.createdAt);
        setPosts(list);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching forum posts:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter posts
  const filteredPosts = posts.filter((p) => {
    const matchTag = selectedTag === 'Tất cả' || p.tag?.toLowerCase() === selectedTag.toLowerCase();
    const matchSearch =
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.botName && p.botName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchTag && matchSearch;
  });

  // Handle image upload for post
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    if (postImages.length + files.length > 3) {
      alert('Tối đa 3 tấm ảnh cho mỗi bài viết thôi nè bae!');
      return;
    }

    setIsCompressing(true);
    try {
      const newImages: string[] = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const compressed = await compressImage(file, 1000, 1000, 0.78);
        newImages.push(compressed);
      }
      setPostImages((prev) => [...prev, ...newImages].slice(0, 3));
    } catch (err) {
      console.error('Error compressing image:', err);
      alert('Không thể xử lý ảnh, bạn thử tấm khác nhé!');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Submit new post
  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) {
      alert('Vui lòng nhập Tiêu đề và Nội dung bài viết!');
      return;
    }

    setIsSubmittingPost(true);
    const finalNick = currentUser
      ? (currentUser.nickname || currentUser.username)
      : (postNickname.trim() || 'Bae ẩn danh 𝜗ৎ');

    try {
      const payload: any = {
        title: postTitle.trim(),
        content: postContent.trim(),
        nickname: finalNick,
        botName: postBotName.trim(),
        tag: postTag,
        images: postImages,
        reactions: { heart: 1 },
        commentCount: 0,
        createdAt: Date.now(),
      };

      if (currentUser) {
        payload.userId = currentUser.uid;
        payload.username = currentUser.username;
        if (currentUser.avatar) payload.avatar = currentUser.avatar;
      }

      await Promise.race([
        addDoc(collection(db, 'forum_posts'), payload),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
      ]);

      setPostTitle('');
      setPostContent('');
      setPostBotName('');
      setPostImages([]);
      setIsCreatingPost(false);
    } catch (err) {
      console.error('Error submitting forum post:', err);
      // Close creation modal on completion/error so user is not locked
      setIsCreatingPost(false);
      setPostTitle('');
      setPostContent('');
      setPostBotName('');
      setPostImages([]);
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // React to a post
  const handleReact = async (postId: string, reactionKey: string) => {
    try {
      const postRef = doc(db, 'forum_posts', postId);
      await updateDoc(postRef, {
        [`reactions.${reactionKey}`]: increment(1),
      });
    } catch (err) {
      console.error('Error reacting to post:', err);
    }
  };

  // Delete post or comment
  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;

    const target = deleteTarget;
    // Dismiss modal immediately so it never stays stuck
    setDeleteTarget(null);

    try {
      if (target.type === 'post') {
        await Promise.race([
          deleteDoc(doc(db, 'forum_posts', target.id)),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000))
        ]);
      } else if (target.type === 'comment') {
        await Promise.race([
          deleteDoc(doc(db, 'forum_comments', target.id)),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000))
        ]);
        if (target.postId) {
          try {
            const postRef = doc(db, 'forum_posts', target.postId);
            await updateDoc(postRef, {
              commentCount: increment(-1),
            });
          } catch (e) {
            console.warn('Could not decrement comment count:', e);
          }
        }
      }
    } catch (err) {
      console.error('Error executing delete:', err);
    }
  };

  // Open Lightbox
  const openLightbox = (imgs: string[], idx: number) => {
    setLightboxImages(imgs);
    setLightboxIndex(idx);
    setIsLightboxOpen(true);
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent">
      {/* Top Header */}
      <header className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between bg-black/70 backdrop-blur-md border-b border-white/10 shadow-sm relative">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-100 hover:bg-white/10 transition-colors cursor-pointer"
          title="Trở về Trang chủ"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center truncate px-2">
          <h1 className="text-base sm:text-lg font-bold text-zinc-100 serif-title tracking-wide flex items-center justify-center gap-1.5 neon-title">
            <span>forum tám zai</span>
            <span className="text-xs">𝜗ৎ</span>
          </h1>
          <p className="text-[10px] text-zinc-400 truncate">
            Góc tâm sự & buôn chuyện các anh nhà 🎀
          </p>
        </div>

        {/* Round Avatar / Login Icon */}
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="w-9 h-9 rounded-full border border-white/15 bg-zinc-950/80 hover:border-pink-400/40 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer overflow-hidden shadow-sm"
          title={currentUser ? `Hồ sơ: ${currentUser.nickname || currentUser.username}` : 'Đăng nhập / Đăng ký'}
        >
          {currentUser ? (
            currentUser.avatar ? (
              <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-pink-300 font-serif">
                {(currentUser.nickname || currentUser.username).charAt(0).toUpperCase()}
              </span>
            )
          ) : (
            <User className="w-4 h-4 text-zinc-400" />
          )}
        </button>
      </header>

      {/* Main Forum Content Scrollable */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Top Banner & Quick Post Button */}
          <div className="relative p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border border-white/15 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-serif italic mb-2">
                  <span>✦</span>
                  <span>Góc buôn dưa lê & thả thính</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-zinc-100 tracking-tight">
                  Tám chuyện các anh nhà 🍒
                </h2>
                <p className="text-xs text-zinc-400 mt-1 max-w-md">
                  Chia sẻ trải nghiệm chơi bot, review hoặc khoe ảnh tình thương mến thương!
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  playCardClickSound();
                  setIsCreatingPost(true);
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(255,255,255,0.2)] transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <span>Viết bài mới 𝜗ৎ</span>
              </button>
            </div>
          </div>

          {/* Search & Categories Bar */}
          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm bài viết, tên chồng iu, chủ đề..."
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-zinc-950/70 border border-white/10 text-xs sm:text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/40 backdrop-blur-md"
              />
            </div>

            {/* Tag Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
              {FORUM_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                    selectedTag === tag
                      ? 'bg-zinc-100 text-zinc-950 border-white shadow-md'
                      : 'bg-zinc-950/60 border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Post Creation Modal */}
          <AnimatePresence>
            {isCreatingPost && (
              <div
                className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
                onClick={() => !isSubmittingPost && setIsCreatingPost(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="relative w-full max-w-lg bg-zinc-950 border border-white/20 rounded-[32px] p-5 sm:p-7 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Top Bar */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold font-serif text-pink-200">
                        ✦ Viết bài tám zai 𝜗ৎ
                      </h3>
                      <p className="text-[10px] text-zinc-400">
                        Bài viết sẽ hiển thị công khai cho mọi người cùng đọc & bình luận!
                      </p>
                    </div>
                    <button
                      onClick={() => setIsCreatingPost(false)}
                      className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Form Scrollable */}
                  <form
                    onSubmit={handleSubmitPost}
                    className="flex-1 overflow-y-auto space-y-4 py-4 pr-1 text-left custom-scrollbar"
                  >
                    {/* Nickname & Husband Selector */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold ml-1">
                          Nickname của bạn:
                        </label>
                        {currentUser ? (
                          <div className="px-3.5 py-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-xs font-semibold text-pink-200 truncate">
                            {currentUser.nickname || currentUser.username}
                          </div>
                        ) : (
                          <div className="relative">
                            <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                              type="text"
                              value={postNickname}
                              onChange={(e) => setPostNickname(e.target.value)}
                              placeholder="Bae ẩn danh 𝜗ৎ"
                              className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/40"
                              maxLength={40}
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold ml-1">
                          Chồng iu liên quan:
                        </label>
                        <input
                          type="text"
                          value={postBotName}
                          onChange={(e) => setPostBotName(e.target.value)}
                          placeholder="vd: Ngụy Khải, Lôi Diễn, Kha Dục..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/40"
                        />
                      </div>
                    </div>

                    {/* Tag Selector */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold ml-1">
                        Chủ đề bài viết:
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {FORUM_TAGS.filter((t) => t !== 'Tất cả').map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setPostTag(t)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                              postTag === t
                                ? 'bg-pink-500/20 text-pink-200 border-pink-500/40'
                                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold ml-1">
                        Tiêu đề:
                      </label>
                      <input
                        type="text"
                        value={postTitle}
                        onChange={(e) => setPostTitle(e.target.value)}
                        placeholder="Đặt tiêu đề thật cuốn hút nè..."
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/40"
                        maxLength={120}
                        required
                      />
                    </div>

                    {/* Content */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold ml-1">
                        Nội dung bài viết:
                      </label>
                      <textarea
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        placeholder="Kể chi tiết chuyện anh nhà, chia sẻ cảm xúc, review hoặc thả thính..."
                        rows={5}
                        className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-xs sm:text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/40 resize-none leading-relaxed"
                        required
                      />
                    </div>

                    {/* Images Upload (Max 3) */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold ml-1">
                        Ảnh minh hoạ (tối đa 3 tấm):
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {postImages.map((src, i) => (
                          <div
                            key={i}
                            className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/20 shadow-md group"
                          >
                            <img src={src} className="w-full h-full object-cover" alt="Preview" />
                            <button
                              type="button"
                              onClick={() => setPostImages((prev) => prev.filter((_, idx) => idx !== i))}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 hover:bg-red-500 text-white flex items-center justify-center transition-all cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}

                        {postImages.length < 3 && (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isCompressing}
                            className="w-20 h-20 rounded-xl border border-dashed border-zinc-700 hover:border-zinc-500 bg-white/[0.02] hover:bg-white/5 flex flex-col items-center justify-center gap-1 text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer"
                          >
                            <Plus className="w-5 h-5 text-pink-400" />
                            <span className="text-[9px] font-bold">Thêm ảnh</span>
                          </button>
                        )}
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        accept="image/*"
                        multiple
                        className="hidden"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmittingPost || !postTitle.trim() || !postContent.trim()}
                        className="w-full py-3.5 rounded-2xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs sm:text-sm shadow-xl transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSubmittingPost ? (
                          <span>Đang đăng bài...</span>
                        ) : (
                          <span>Đăng bài ngay 𝜗ৎ</span>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Posts Feed */}
          <div className="space-y-6">
            {loading ? (
              <div className="py-16 text-center text-xs text-zinc-500 animate-pulse">
                Đang tải các bài viết forum tám zai... 𝜗ৎ
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="py-16 px-4 rounded-3xl bg-zinc-950/40 border border-white/5 text-center">
                <p className="text-sm font-medium text-zinc-400 font-serif italic">
                  Chưa có bài viết nào trong mục này 𝜗ৎ
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Hãy là người đầu tiên mở bát thảo luận nhé bae!
                </p>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <ForumPostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  isAdmin={isAdmin}
                  onReact={(reactionKey) => handleReact(post.id, reactionKey)}
                  onOpenLightbox={openLightbox}
                  onDeletePost={() => setDeleteTarget({ type: 'post', id: post.id })}
                  onDeleteComment={(commentId) => setDeleteTarget({ type: 'comment', id: commentId, postId: post.id })}
                  isExpanded={!!expandedComments[post.id]}
                  onToggleExpand={() => toggleComments(post.id)}
                  onSelectBot={onSelectBot}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div
            className="fixed inset-0 z-[100001] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
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
                <h4 className="text-sm font-bold text-zinc-100">
                  {deleteTarget.type === 'post' ? 'Xoá bài viết này?' : 'Xoá bình luận này?'}
                </h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Hành động này không thể hoàn tác sau khi xoá.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
                >
                  Xoá ngay
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox for Photos */}
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

// Individual Forum Post Card Component
interface ForumPostCardProps {
  post: ForumPostItem;
  currentUser: any;
  isAdmin: boolean;
  onReact: (key: string) => void;
  onOpenLightbox: (imgs: string[], idx: number) => void;
  onDeletePost: () => void;
  onDeleteComment: (commentId: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelectBot?: (id: string) => void;
}

const ForumPostCard: React.FC<ForumPostCardProps> = ({
  post,
  currentUser,
  isAdmin,
  onReact,
  onOpenLightbox,
  onDeletePost,
  onDeleteComment,
  isExpanded,
  onToggleExpand,
  onSelectBot,
}) => {
  const [comments, setComments] = useState<ForumCommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // Comment input
  const [cmtNickname, setCmtNickname] = useState(() => {
    if (currentUser?.nickname) return currentUser.nickname;
    return '';
  });
  const [cmtContent, setCmtContent] = useState('');
  const [cmtImages, setCmtImages] = useState<string[]>([]);
  const [isCompressingCmt, setIsCompressingCmt] = useState(false);
  const [isSubmittingCmt, setIsSubmittingCmt] = useState(false);

  // Edit comment state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);

  const cmtFileInputRef = useRef<HTMLInputElement>(null);

  // Sync nickname
  useEffect(() => {
    if (currentUser) {
      setCmtNickname(currentUser.nickname || currentUser.username || '');
    } else {
      setCmtNickname('');
    }
  }, [currentUser]);

  // Load comments when expanded
  useEffect(() => {
    if (!isExpanded) return;

    setLoadingComments(true);
    const cmtsRef = collection(db, 'forum_comments');
    const q = query(cmtsRef, where('postId', '==', post.id));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: ForumCommentItem[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: docSnap.id,
            postId: d.postId || post.id,
            userId: d.userId || '',
            username: d.username || '',
            nickname: d.nickname || 'Bae ẩn danh 𝜗ৎ',
            avatar: d.avatar || '',
            content: d.content || '',
            images: Array.isArray(d.images) ? d.images : [],
            createdAt: typeof d.createdAt === 'number' ? d.createdAt : Date.now(),
            editedAt: typeof d.editedAt === 'number' ? d.editedAt : undefined,
          });
        });

        list.sort((a, b) => a.createdAt - b.createdAt);
        setComments(list);
        setLoadingComments(false);
      },
      (err) => {
        console.error('Error fetching comments:', err);
        setLoadingComments(false);
      }
    );

    return () => unsubscribe();
  }, [isExpanded, post.id]);

  // Handle comment image selection
  const handleCmtImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    if (cmtImages.length + files.length > 3) {
      alert('Tối đa 3 tấm ảnh thôi nhé bae!');
      return;
    }

    setIsCompressingCmt(true);
    try {
      const list: string[] = [];
      for (const f of files) {
        if (!f.type.startsWith('image/')) continue;
        const comp = await compressImage(f, 900, 900, 0.75);
        list.push(comp);
      }
      setCmtImages((prev) => [...prev, ...list].slice(0, 3));
    } catch (err) {
      console.error(err);
    } finally {
      setIsCompressingCmt(false);
      if (cmtFileInputRef.current) cmtFileInputRef.current.value = '';
    }
  };

  // Submit comment under post
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmtContent.trim() && cmtImages.length === 0) return;

    setIsSubmittingCmt(true);
    const finalNick = currentUser
      ? (currentUser.nickname || currentUser.username)
      : (cmtNickname.trim() || 'Bae ẩn danh 𝜗ৎ');

    try {
      const payload: any = {
        postId: post.id,
        nickname: finalNick,
        content: cmtContent.trim(),
        images: cmtImages,
        createdAt: Date.now(),
      };

      if (currentUser) {
        payload.userId = currentUser.uid;
        payload.username = currentUser.username;
        if (currentUser.avatar) payload.avatar = currentUser.avatar;
      }

      await Promise.race([
        addDoc(collection(db, 'forum_comments'), payload),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
      ]);

      // Increment comment count on post
      try {
        const postRef = doc(db, 'forum_posts', post.id);
        await updateDoc(postRef, {
          commentCount: increment(1),
        });
      } catch (e) {
        console.warn('Could not increment post count:', e);
      }

      setCmtContent('');
      setCmtImages([]);
    } catch (err) {
      console.error('Error adding comment:', err);
      // Reset form anyway so user is not blocked
      setCmtContent('');
      setCmtImages([]);
    } finally {
      setIsSubmittingCmt(false);
    }
  };

  // Save edit comment
  const handleSaveEditComment = async (commentId: string) => {
    if (!editCommentContent.trim()) return;
    setIsUpdatingComment(true);
    const trimmed = editCommentContent.trim();
    try {
      await Promise.race([
        updateDoc(doc(db, 'forum_comments', commentId), {
          content: trimmed,
          editedAt: Date.now(),
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000))
      ]);

      // Optimistic update
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, content: trimmed, editedAt: Date.now() } : c))
      );
      setEditingCommentId(null);
    } catch (err) {
      console.error('Error editing comment:', err);
      setEditingCommentId(null);
    } finally {
      setIsUpdatingComment(false);
    }
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

  const isPostOwner = currentUser && post.userId && currentUser.uid === post.userId;
  const canDeleteThisPost = isAdmin || isPostOwner;

  return (
    <div className="p-5 sm:p-6 rounded-[28px] bg-zinc-950/80 border border-white/15 backdrop-blur-xl shadow-2xl space-y-4 hover:border-white/25 transition-all">
      {/* Post Author Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-white/20 flex items-center justify-center text-pink-200 text-sm font-bold font-serif shadow-inner overflow-hidden">
            {post.avatar ? (
              <img src={post.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{post.nickname.charAt(0).toUpperCase() || 'B'}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-zinc-100 font-serif tracking-wide">
                {post.nickname}
              </h4>
              {post.userId === 'admin_meimeicorner' && (
                <span className="text-[10px] text-amber-300 font-bold">👑 Sốp</span>
              )}
              {post.tag && (
                <span className="px-2.5 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-[10px] text-pink-300 font-medium">
                  {post.tag}
                </span>
              )}
              {post.botName && (
                <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-zinc-300 font-serif italic">
                  💋 {post.botName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5">
              <Clock className="w-3 h-3 text-zinc-500" />
              <span>{formatTimestamp(post.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Delete Post Button (Admin or Post Creator) */}
        {canDeleteThisPost && (
          <button
            type="button"
            onClick={onDeletePost}
            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
            title="Xoá bài viết"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Post Title & Content */}
      <div className="space-y-2">
        <h3 className="text-base sm:text-lg font-bold text-zinc-100 font-serif leading-snug">
          {post.title}
        </h3>
        <p className="text-xs sm:text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>
      </div>

      {/* Post Images Grid (Click to view in lightbox) */}
      {post.images && post.images.length > 0 && (
        <div
          className={`grid gap-2.5 pt-1 ${
            post.images.length === 1 ? 'grid-cols-1' : post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
          }`}
        >
          {post.images.map((img, i) => (
            <div
              key={i}
              onClick={() => onOpenLightbox(post.images!, i)}
              className="relative aspect-square rounded-2xl overflow-hidden border border-white/15 cursor-pointer group shadow-lg"
            >
              <img src={img} alt="Attached" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold backdrop-blur-[1px]">
                🔍 Phóng to
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reactions & Comment Toggle Bar */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10 flex-wrap gap-2">
        {/* Reactions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {REACTION_TYPES.map((react) => {
            const count = (post.reactions && post.reactions[react.key]) || 0;
            return (
              <button
                key={react.key}
                type="button"
                onClick={() => onReact(react.key)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer active:scale-90 border ${
                  count > 0
                    ? 'bg-pink-500/10 border-pink-500/30 text-pink-200 hover:bg-pink-500/20'
                    : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
                title={react.label}
              >
                <span>{react.emoji}</span>
                {count > 0 && <span className="text-[11px] font-mono">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Comment Count Toggle */}
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5 text-pink-300" />
          <span>{comments.length || post.commentCount || 0} bình luận</span>
        </button>
      </div>

      {/* Expanded Comments Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-3 border-t border-white/10 space-y-4 overflow-hidden"
          >
            {/* Comments List */}
            <div className="space-y-3">
              {loadingComments ? (
                <div className="text-center py-4 text-xs text-zinc-500 animate-pulse">
                  Đang tải bình luận...
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-4 text-xs text-zinc-500 italic">
                  Chưa có bình luận nào. Hãy để lại lời nhắn đầu tiên nhé! 𝜗ৎ
                </div>
              ) : (
                comments.map((c) => {
                  const isCmtOwner = currentUser && c.userId && currentUser.uid === c.userId;
                  const canModifyCmt = isAdmin || isCmtOwner;

                  return (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-pink-500/20 border border-white/15 flex items-center justify-center text-[10px] font-bold text-pink-200 overflow-hidden">
                            {c.avatar ? (
                              <img src={c.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span>{c.nickname.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-zinc-200 font-serif">
                            {c.nickname}
                          </span>
                          {c.userId === 'admin_meimeicorner' && (
                            <span className="text-[9px] text-amber-300 font-bold">👑 Sốp</span>
                          )}
                          {c.editedAt && (
                            <span className="text-[9px] text-zinc-500 italic">(đã sửa)</span>
                          )}
                          <span className="text-[10px] text-zinc-500">
                            • {formatTimestamp(c.createdAt)}
                          </span>
                        </div>

                        {canModifyCmt && (
                          <div className="flex items-center gap-1">
                            {isCmtOwner && editingCommentId !== c.id && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCommentId(c.id);
                                  setEditCommentContent(c.content);
                                }}
                                className="p-1 text-zinc-400 hover:text-white"
                                title="Sửa cmt"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onDeleteComment(c.id)}
                              className="p-1 text-red-400 hover:text-red-300"
                              title="Xoá cmt"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {editingCommentId === c.id ? (
                        <div className="space-y-2 pt-1">
                          <textarea
                            value={editCommentContent}
                            onChange={(e) => setEditCommentContent(e.target.value)}
                            rows={2}
                            className="w-full p-2.5 rounded-xl bg-black/50 border border-pink-500/40 text-xs text-zinc-100 resize-none focus:outline-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingCommentId(null)}
                              className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white"
                            >
                              Hủy
                            </button>
                            <button
                              type="button"
                              disabled={isUpdatingComment}
                              onClick={() => handleSaveEditComment(c.id)}
                              className="px-3 py-1 bg-pink-500 text-xs font-bold text-white rounded-lg flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Lưu</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        c.content && (
                          <p className="text-xs text-zinc-200/90 whitespace-pre-wrap leading-relaxed">
                            {c.content}
                          </p>
                        )
                      )}

                      {/* Comment Images */}
                      {c.images && c.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {c.images.map((img, idx) => (
                            <div
                              key={idx}
                              onClick={() => onOpenLightbox(c.images!, idx)}
                              className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 cursor-pointer shadow-md"
                            >
                              <img src={img} alt="Cmt" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Comment Box */}
            <form onSubmit={handleSubmitComment} className="pt-2 space-y-2.5 text-left">
              {/* Nickname / User Identity Row */}
              <div className="flex items-center gap-2 flex-wrap">
                {currentUser ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-pink-500/10 border border-pink-500/20 text-xs font-semibold text-pink-200">
                    <div className="w-4 h-4 rounded-full bg-pink-500/30 overflow-hidden flex items-center justify-center text-[9px] text-white shrink-0">
                      {currentUser.avatar ? (
                        <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{(currentUser.nickname || currentUser.username).charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span>{currentUser.nickname || currentUser.username}</span>
                    {isAdmin && <span className="text-[10px] text-amber-300 font-bold">👑 Sốp</span>}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                    <div className="relative w-full sm:w-64">
                      <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        value={cmtNickname}
                        onChange={(e) => setCmtNickname(e.target.value)}
                        placeholder="Điền Nickname (hoặc để trống)..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-pink-500/40"
                        maxLength={40}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500 hidden sm:inline italic">
                      (Không điền sẽ để ẩn danh 𝜗ৎ)
                    </span>
                  </div>
                )}
              </div>

              {/* Text Input & Buttons Row */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cmtContent}
                  onChange={(e) => setCmtContent(e.target.value)}
                  placeholder="Viết câu trả lời / chia sẻ suy nghĩ..."
                  className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-pink-500/40"
                />
                <button
                  type="button"
                  onClick={() => cmtFileInputRef.current?.click()}
                  disabled={cmtImages.length >= 3 || isCompressingCmt}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-xs cursor-pointer flex items-center justify-center shrink-0"
                  title="Đính kèm ảnh (tối đa 3 ảnh)"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                </button>
                <input
                  type="file"
                  ref={cmtFileInputRef}
                  onChange={handleCmtImageSelect}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <button
                  type="submit"
                  disabled={isSubmittingCmt || (!cmtContent.trim() && cmtImages.length === 0)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs disabled:opacity-40 cursor-pointer shrink-0 transition-all active:scale-95"
                >
                  {isSubmittingCmt ? 'Gửi...' : 'Gửi'}
                </button>
              </div>

              {/* Comment Image Previews */}
              {cmtImages.length > 0 && (
                <div className="flex gap-2 pt-1">
                  {cmtImages.map((src, idx) => (
                    <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/20">
                      <img src={src} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setCmtImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
