import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface HistoryItem {
  id: string;
  type: "tts" | "image" | "translate";
  timestamp: string;
  input: string;
  outputUrl?: string; // Audio Blob URL or Image base64 URL
  outputText?: string; // Translated text or Image metadata
  voice?: string;
  language?: string;
}

interface AppState {
  activeView: "tts" | "image" | "translate" | "credits";
  user: any | null;
  session: any | null;
  credits: number;
  isUpgraded: boolean;
  history: HistoryItem[];
  
  // Actions
  setView: (view: "tts" | "image" | "translate" | "credits") => void;
  setUser: (user: any | null, session: any | null) => void;
  setCredits: (credits: number) => void;
  deductCredits: (amount: number) => void;
  setUpgrade: (status: boolean) => void;
  addHistoryItem: (item: Omit<HistoryItem, "id" | "timestamp">) => void;
  clearHistory: () => void;
  resetAll: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeView: "tts",
      user: null,
      session: null,
      credits: 900,
      isUpgraded: false,
      history: [],

      setView: (activeView) => set({ activeView }),
      
      setUser: (user, session) => set((state) => {
        // If logging in a new user and we don't have credits set yet, initialize them
        const isNewUser = state.user?.id !== user?.id;
        return {
          user,
          session,
          credits: isNewUser ? (state.isUpgraded ? 1000000 : 900) : state.credits,
        };
      }),

      setCredits: (credits) => set({ credits }),
      
      deductCredits: (amount) => set((state) => {
        const newCredits = Math.max(0, state.credits - amount);
        return { credits: newCredits };
      }),

      setUpgrade: (isUpgraded) => set((state) => ({
        isUpgraded,
        // Set credits to 1,000,000 when upgraded, or reset to 900 if downgraded
        credits: isUpgraded ? 1000000 : 900,
      })),

      addHistoryItem: (item) => set((state) => {
        const newItem: HistoryItem = {
          ...item,
          id: Math.random().toString(36).substring(2, 11),
          timestamp: new Date().toISOString(),
        };
        return { history: [newItem, ...state.history] };
      }),

      clearHistory: () => set({ history: [] }),

      resetAll: () => set({
        activeView: "tts",
        user: null,
        session: null,
        credits: 900,
        isUpgraded: false,
        history: [],
      }),
    }),
    {
      name: "tts-studio-storage",
      // Only persist history, credits, isUpgraded, activeView
      partialize: (state) => ({
        history: state.history,
        credits: state.credits,
        isUpgraded: state.isUpgraded,
        activeView: state.activeView,
        // We don't persist session/user here directly, as Supabase manages its own auth persistence
      }),
    }
  )
);