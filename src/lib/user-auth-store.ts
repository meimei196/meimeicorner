import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth, db } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  username: string; // for display / login reference
  nickname: string;
  avatar: string;
  bio: string;
  isAdmin: boolean;
  createdAt: number;
}

interface AuthState {
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isAdmin: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  updateProfile: (data: Partial<Pick<UserProfile, 'nickname' | 'avatar' | 'bio'>>) => Promise<void>;
  loginAsAdmin: (username: string, pass: string) => Promise<boolean>;
  loginUser: (usernameOrEmail: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (username: string, pass: string, nickname?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

// Fixed credentials
const ADMIN_USERNAME = 'meimeicorner';
const ADMIN_PASSWORD = 'meimei196';

// Helper to convert plain username to mock/real email for Firebase Auth
const usernameToEmail = (uname: string) => {
  const clean = uname.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
  return `${clean || 'user'}@meimeicorner.app`;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      firebaseUser: null,
      isAdmin: false,
      isAuthModalOpen: false,

      setIsAuthModalOpen: (open) => set({ isAuthModalOpen: open }),

      loginAsAdmin: async (username: string, pass: string) => {
        const u = username.trim().toLowerCase();
        const p = pass.trim();
        if (u === ADMIN_USERNAME && p === ADMIN_PASSWORD) {
          let adminProfile: UserProfile = {
            uid: 'admin_meimeicorner',
            username: 'meimeicorner',
            nickname: 'Sốp MeiMei 👑',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            bio: 'Chủ tiệm meimeicorner 𝜗ৎ Góc nhỏ tâm sự & ngắm zai đẹp ✨',
            isAdmin: true,
            createdAt: Date.now(),
          };

          // Check custom admin profile from local cache first
          try {
            const cached = localStorage.getItem('meimei_admin_profile_custom');
            if (cached) {
              adminProfile = { ...adminProfile, ...JSON.parse(cached), uid: 'admin_meimeicorner', username: 'meimeicorner', isAdmin: true };
            }
          } catch {}

          // Check custom admin profile from firestore
          try {
            const adminDoc = await getDoc(doc(db, 'user_profiles', 'admin_meimeicorner'));
            if (adminDoc.exists()) {
              adminProfile = { ...adminProfile, ...(adminDoc.data() as any), uid: 'admin_meimeicorner', username: 'meimeicorner', isAdmin: true };
              localStorage.setItem('meimei_admin_profile_custom', JSON.stringify(adminProfile));
            }
          } catch (e) {
            console.warn('Could not fetch admin profile from firestore:', e);
          }

          set({
            currentUser: adminProfile,
            isAdmin: true,
          });
          return true;
        }
        return false;
      },

      loginUser: async (usernameOrEmail: string, pass: string) => {
        const raw = usernameOrEmail.trim();
        const passClean = pass.trim();

        // 1. Check if user is trying admin login
        if (raw.toLowerCase() === ADMIN_USERNAME && passClean === ADMIN_PASSWORD) {
          await get().loginAsAdmin(raw, passClean);
          return { success: true };
        }

        if (!raw || !passClean) {
          return { success: false, error: 'Vui lòng nhập tên tài khoản và mật khẩu!' };
        }

        const email = raw.includes('@') ? raw.toLowerCase() : usernameToEmail(raw);

        try {
          const cred = await signInWithEmailAndPassword(auth, email, passClean);
          const uid = cred.user.uid;

          // Start with default or local cached profile
          let profile: UserProfile = {
            uid,
            username: raw,
            nickname: raw,
            avatar: '',
            bio: '',
            isAdmin: false,
            createdAt: Date.now(),
          };

          try {
            const cached = localStorage.getItem(`meimei_profile_${uid}`);
            if (cached) {
              profile = { ...profile, ...JSON.parse(cached), uid, isAdmin: false };
            }
          } catch {}

          // Fetch fresh user profile from firestore
          try {
            const userDoc = await getDoc(doc(db, 'user_profiles', uid));
            if (userDoc.exists()) {
              profile = { ...profile, ...(userDoc.data() as any), uid, isAdmin: false };
              localStorage.setItem(`meimei_profile_${uid}`, JSON.stringify(profile));
            }
          } catch (e) {
            console.warn('Could not fetch user profile from firestore:', e);
          }

          set({
            currentUser: profile,
            firebaseUser: cred.user,
            isAdmin: false,
          });

          return { success: true };
        } catch (err: any) {
          console.error('Login error:', err);
          let msg = 'Tên tài khoản hoặc mật khẩu không chính xác!';
          if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
            msg = 'Tên đăng nhập hoặc mật khẩu không đúng!';
          } else if (err.code === 'auth/invalid-email') {
            msg = 'Tên tài khoản không hợp lệ (chỉ gồm chữ và số)!';
          }
          return { success: false, error: msg };
        }
      },

      registerUser: async (username: string, pass: string, nickname?: string) => {
        const uClean = username.trim();
        const passClean = pass.trim();

        if (uClean.toLowerCase() === ADMIN_USERNAME) {
          return { success: false, error: 'Tên tài khoản này đã được bảo lưu riêng cho Sốp!' };
        }

        if (uClean.length < 3) {
          return { success: false, error: 'Tên tài khoản cần ít nhất 3 ký tự!' };
        }

        if (passClean.length < 6) {
          return { success: false, error: 'Mật khẩu cần ít nhất 6 ký tự!' };
        }

        const email = uClean.includes('@') ? uClean.toLowerCase() : usernameToEmail(uClean);
        const finalNick = nickname?.trim() || uClean;

        try {
          const cred = await createUserWithEmailAndPassword(auth, email, passClean);
          const uid = cred.user.uid;

          const newProfile: UserProfile = {
            uid,
            username: uClean,
            nickname: finalNick,
            avatar: '',
            bio: 'Thành viên meimeicorner 𝜗ৎ',
            isAdmin: false,
            createdAt: Date.now(),
          };

          try {
            localStorage.setItem(`meimei_profile_${uid}`, JSON.stringify(newProfile));
          } catch {}

          try {
            await setDoc(doc(db, 'user_profiles', uid), newProfile);
          } catch (e) {
            console.warn('Could not save profile to firestore:', e);
          }

          set({
            currentUser: newProfile,
            firebaseUser: cred.user,
            isAdmin: false,
          });

          return { success: true };
        } catch (err: any) {
          console.error('Register error:', err);
          let msg = 'Đăng ký không thành công, vui lòng thử lại!';
          if (err.code === 'auth/email-already-in-use') {
            msg = 'Tên tài khoản này đã có người đăng ký rồi!';
          } else if (err.code === 'auth/weak-password') {
            msg = 'Mật khẩu quá ngắn, vui lòng chọn ít nhất 6 ký tự!';
          }
          return { success: false, error: msg };
        }
      },

      updateProfile: async (data) => {
        const current = get().currentUser;
        if (!current) return;

        const updated: UserProfile = {
          ...current,
          ...data,
        };

        // 1. Instantly update state
        set({ currentUser: updated });

        // 2. Instantly update local cache
        try {
          if (current.uid === 'admin_meimeicorner') {
            localStorage.setItem('meimei_admin_profile_custom', JSON.stringify(updated));
          } else {
            localStorage.setItem(`meimei_profile_${current.uid}`, JSON.stringify(updated));
          }
        } catch (e) {
          console.warn('LocalStorage save error:', e);
        }

        // 3. Fire-and-forget / non-blocking sync to Firestore with 2s timeout
        try {
          await Promise.race([
            setDoc(doc(db, 'user_profiles', current.uid), updated, { merge: true }),
            new Promise((resolve) => setTimeout(resolve, 2000)),
          ]);
        } catch (e) {
          console.warn('Background profile firestore sync:', e);
        }
      },

      logout: async () => {
        try {
          await signOut(auth);
        } catch {
          // ignore
        }
        try {
          localStorage.removeItem('meimei_saved_nickname');
        } catch {
          // ignore
        }
        set({
          currentUser: null,
          firebaseUser: null,
          isAdmin: false,
        });
      },
    }),
    {
      name: 'meimei_user_auth_store',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAdmin: state.isAdmin,
      }),
    }
  )
);

// Sync Firebase Auth state changes
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, async (user) => {
    const state = useAuthStore.getState();
    if (!user) {
      if (state.currentUser && !state.currentUser.uid.startsWith('admin_')) {
        // Already handled
      }
    } else {
      // Fetch fresh profile from Firestore
      try {
        let profileData: Partial<UserProfile> = {};
        const cached = localStorage.getItem(`meimei_profile_${user.uid}`);
        if (cached) {
          try {
            profileData = JSON.parse(cached);
          } catch {}
        }
        const userDoc = await getDoc(doc(db, 'user_profiles', user.uid));
        if (userDoc.exists()) {
          profileData = { ...profileData, ...(userDoc.data() as any) };
          localStorage.setItem(`meimei_profile_${user.uid}`, JSON.stringify(profileData));
        }
        if (profileData.username || profileData.nickname) {
          useAuthStore.setState({
            currentUser: {
              uid: user.uid,
              username: profileData.username || 'user',
              nickname: profileData.nickname || profileData.username || 'User',
              avatar: profileData.avatar || '',
              bio: profileData.bio || '',
              isAdmin: false,
              createdAt: profileData.createdAt || Date.now(),
            },
            firebaseUser: user,
            isAdmin: false,
          });
        }
      } catch (e) {
        console.warn('Could not sync user profile from onAuthStateChanged:', e);
      }
    }
  });
}
