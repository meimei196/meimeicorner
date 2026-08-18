import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth } from './firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';

// Known admin emails
export const ADMIN_EMAILS = [
  'lananh196k3@gmail.com',
  'meimei196k3@gmail.com',
  'admin@meimeicorner.web.app',
];

export const ADMIN_SECRET_PASSCODE = 'meimei196'; // Quick admin passcode for shop owner

interface AdminState {
  user: User | null;
  isAdmin: boolean;
  adminName: string;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  setAdminStatus: (isAdmin: boolean, name?: string) => void;
  logout: () => Promise<void>;
  checkIsAdmin: (emailOrPasscode?: string | null) => boolean;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      user: null,
      isAdmin: false,
      adminName: '',
      isAuthModalOpen: false,
      setIsAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
      setAdminStatus: (isAdmin, name = 'Admin MeiMei 👑') => set({ isAdmin, adminName: name }),
      checkIsAdmin: (val) => {
        if (!val) return false;
        const normalized = val.trim().toLowerCase();
        if (normalized === ADMIN_SECRET_PASSCODE.toLowerCase()) return true;
        if (ADMIN_EMAILS.some((e) => e.toLowerCase() === normalized)) return true;
        return false;
      },
      logout: async () => {
        try {
          await signOut(auth);
        } catch {
          // ignore
        }
        set({ user: null, isAdmin: false, adminName: '' });
      },
    }),
    {
      name: 'meimei-admin-storage',
      partialize: (state) => ({ isAdmin: state.isAdmin, adminName: state.adminName }),
    }
  )
);

// Listen to Firebase Auth state
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, (currentUser) => {
    const state = useAdminStore.getState();
    if (currentUser) {
      const email = currentUser.email || '';
      const isAdminUser = state.checkIsAdmin(email);
      useAdminStore.setState({
        user: currentUser,
        isAdmin: isAdminUser || state.isAdmin,
        adminName: currentUser.displayName || currentUser.email || 'Admin MeiMei 👑',
      });
    } else {
      useAdminStore.setState({ user: null });
    }
  });
}
