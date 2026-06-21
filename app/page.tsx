"use client";

import { useEffect, useState } from "react";
import Sidebar from "./components/sidebar";
import TtsView from "./components/tts-view";
import ImageView from "./components/image-view";
import TranslateView from "./components/translate-view";
import CreditsView from "./components/credits-view";
import { supabase } from "./lib/supabase";
import { useAppStore } from "./store/use-app-store";

const VIEW_TITLES: Record<string, string> = {
  tts: "Text to Speech",
  image: "Image Generation",
  translate: "Live Translate",
  credits: "Credits & Purchase",
};

export default function Home() {
  const { user, setUser, activeView, setView, isUpgraded } = useAppStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Set up Supabase auth listener
  useEffect(() => {
    supabase.auth.getSession().then((res: any) => {
      const session = res.data?.session;
      setUser(session?.user ?? null, session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null, session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser]);

  if (!isHydrated) {
    return (
      <div className="flex h-screen w-screen bg-white items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white text-gray-900 overflow-hidden">
      <Sidebar activeView={activeView} onViewChange={setView} />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="h-14 shrink-0 border-b border-gray-200 bg-white flex items-center justify-between px-6">
          <h1 className="text-[15px] font-semibold text-gray-900 tracking-tight">
            {VIEW_TITLES[activeView] || "Voice Studio"}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md border border-gray-200">
              {isUpgraded ? "Premium" : "Personal"}
            </span>
            <span
              onClick={() => setView("credits")}
              className={`text-xs font-semibold hover:underline cursor-pointer ${
                isUpgraded ? "text-violet-600" : "text-amber-600"
              }`}
            >
              {isUpgraded ? "Paid tier · Upgraded" : "Free tier · Upgrade now"}
            </span>
          </div>
        </header>

        {/* View content */}
        <div className="flex-1 overflow-hidden">
          {activeView === "tts" && <TtsView />}
          {activeView === "image" && <ImageView />}
          {activeView === "translate" && <TranslateView />}
          {activeView === "credits" && <CreditsView />}
        </div>
      </main>
    </div>
  );
}
