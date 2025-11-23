import { create } from "zustand";
import { auth, googleProvider, githubProvider } from "../lib/firebase.config";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { httpClient } from "../utils/httpClient";

// Usuario REAL que devuelve tu backend
interface BackendUser {
  id: number;
  name: string | null;
  email: string | null;
  age: number | null;
  photoURL?: string | null;
}

type AuthStore = {
  user: BackendUser | null;
  setUser: (user: BackendUser | null) => void;
  authInProgress: boolean;
  setAuthInProgress: (v: boolean) => void;

  initAuthObserver: () => void;
  initFromLocalStorage: () => void;

  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;   // <-- GitHub

  logout: () => Promise<void>;
  _observerInitialized?: boolean;
};

const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  _observerInitialized: false,
  authInProgress: false,

  setUser: (user) => set({ user }),
  setAuthInProgress: (v: boolean) => set({ authInProgress: v }),

  // 🔵 Inicializar sesión desde localStorage
  initFromLocalStorage: () => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      set({ user: JSON.parse(savedUser) });
    }
  },

  // 🟡 Observador de Firebase (solo 1 vez)
  initAuthObserver: () => {
    if (get()._observerInitialized) return;

    (get() as any)._observerInitialized = true;

    onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (!fbUser) {
        set({ user: null });
        return;
      }

      // force refresh token to avoid stale idToken issues
      const idToken = await fbUser.getIdToken(true);

      try {
        const res = await httpClient.post("/auth/firebase-login", { idToken });

        const backendUser = res.user;
        const backendToken = res.token;

        localStorage.setItem("authToken", backendToken);
        localStorage.setItem("user", JSON.stringify(backendUser));

        set({ user: backendUser });
      } catch (error) {
        console.error("Error sincronizando sesión:", error);
      }
    });
  },

  // 🟢 Login con Google
  loginWithGoogle: async () => {
    // prevent concurrent popup attempts
    if (get().authInProgress) return;
    get().setAuthInProgress(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      // force refresh token to avoid stale idToken issues
      const idToken = await fbUser.getIdToken(true);
      // Note: backend expects idToken in POST /auth/login
      const res = await httpClient.post("/auth/login", { idToken });

      const backendUser = res.user;
      const backendToken = res.token;

      localStorage.setItem("authToken", backendToken);
      localStorage.setItem("user", JSON.stringify(backendUser));

      set({ user: backendUser });
    } catch (error: any) {
      // handle specific firebase popup cancellation gracefully
      const code = (error && (error as any).code) || '';
      if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user') {
        console.warn('Login popup cancelled by user or another popup was open.');
      } else {
        console.error('Error en Google Login:', error);
      }
      throw error;
    } finally {
      get().setAuthInProgress(false);
    }
  },

  // 🟣 Login con GitHub 
  loginWithGithub: async () => {
    if (get().authInProgress) return;
    get().setAuthInProgress(true);
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const fbUser = result.user;

      const idToken = await fbUser.getIdToken();
      // Note: backend expects idToken in POST /auth/login
      const res = await httpClient.post("/auth/login", { idToken });

      const backendUser = res.user;
      const backendToken = res.token;

      localStorage.setItem("authToken", backendToken);
      localStorage.setItem("user", JSON.stringify(backendUser));

      set({ user: backendUser });
    } catch (error: any) {
      const code = (error && (error as any).code) || '';
      if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user') {
        console.warn('Login popup cancelled by user or another popup was open.');
      } else {
        console.error('Error en GitHub Login:', error);
      }
      throw error;
    } finally {
      get().setAuthInProgress(false);
    }
  },

  // 🔴 Logout
  logout: async () => {
    try {
      await signOut(auth);

      localStorage.removeItem("authToken");
      localStorage.removeItem("user");

      set({ user: null });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  },
}));

export default useAuthStore;

