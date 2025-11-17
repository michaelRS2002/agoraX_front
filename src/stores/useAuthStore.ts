import { create } from "zustand";
import { auth, googleProvider } from "../lib/firebase.config";
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

  initAuthObserver: () => void;
  initFromLocalStorage: () => void;

  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
   _observerInitialized?: boolean; 
};

const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  _observerInitialized: false,
  setUser: (user) => set({ user }),

  // 🔵 Cargar sesión previa guardada en localStorage
  initFromLocalStorage: () => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      set({ user: JSON.parse(savedUser) });
    }
  },

  // 🟡 Observador de Firebase (se ejecuta 1 sola vez)
  initAuthObserver: () => {
    if (get()._observerInitialized) return;

    (get() as any)._observerInitialized = true;

    onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (!fbUser) {
        set({ user: null });
        return;
      }

      const idToken = await fbUser.getIdToken();

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
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      const idToken = await fbUser.getIdToken();

      const res = await httpClient.post("/auth/firebase-login", { idToken });

      const backendUser = res.user;
      const backendToken = res.token;

      localStorage.setItem("authToken", backendToken);
      localStorage.setItem("user", JSON.stringify(backendUser));

      set({ user: backendUser });
    } catch (error) {
      console.error("Error en Google Login:", error);
    }
  },

  // 🔴 Logout Total
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

