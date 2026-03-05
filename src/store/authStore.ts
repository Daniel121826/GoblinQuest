import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
    isLoggedIn: boolean;
    user: { name: string } | null;
    token: string | null; // Añadimos el token
    login: (userData: { name: string }, token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            isLoggedIn: false,
            user: null,
            token: null,
            login: (userData, token) => set({ isLoggedIn: true, user: userData, token }),
            logout: () => set({ isLoggedIn: false, user: null, token: null }),
        }),
        { name: 'auth-storage' }
    )
);