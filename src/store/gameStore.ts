import { create } from 'zustand';
import { persist } from 'zustand/middleware'; // 1. Importar persist
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface Message {
    role: 'ai' | 'user' | 'system';
    content: string;
}

export interface Game {
    _id?: string;
    charId: string;
    charName: string;
    charImage: string | null;
    health: number;
    messages: Message[];
    missions: string[];
    date: string;
    inventory : string[];
}

interface GameState {
    games: Game[];
    fetchGames: (token: string) => Promise<void>;
    addGame: (game: Game) => void;
    updateGame: (game: Game) => void;
    deleteGame: (id: string) => void;
}

export const useGameStore = create<GameState>()(
    persist(
        (set) => ({
            games: [],
            fetchGames: async (token: string) => {
                try {
                    // Nota: Asegúrate de que el endpoint sea /api/games o /api/partidas según tu backend
                    const res = await fetch(`${API_URL}/api/games`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        set({ games: data });
                    }
                } catch (error) {
                    console.error("Error fetch games:", error);
                }
            },
           addGame: (game) => set((state) => {
            const exists = state.games.some(g => g._id === game._id);
                if (exists) return state; 
                return { games: [game, ...state.games] };
}),
            updateGame: (updatedGame) => set((state) => ({
                games: state.games.map(g => g._id === updatedGame._id ? updatedGame : g)
            })),
            deleteGame: (id) => set((state) => ({
                games: state.games.filter(g => g._id !== id)
            })),
        }),
        {
            name: 'game-storage', // Nombre de la clave en localStorage
        }
    )
);