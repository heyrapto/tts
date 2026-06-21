"use client";

import { useState } from "react";
import {
  Volume2,
  Image as ImageIcon,
  Languages,
  LogOut,
  Zap,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
} from "lucide-react";
import { useAppStore } from "../store/use-app-store";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";

interface SidebarProps {
  activeView: "tts" | "image" | "translate" | "credits";
  onViewChange: (view: "tts" | "image" | "translate" | "credits") => void;
}

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { credits, user, resetAll } = useAppStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      resetAll(); // Clear local zustand state
    } catch (e) {
      console.error("Error signing out:", e);
    }
  };

  // Get user avatar letter or fallback to email
  const getUserLetter = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name[0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <aside 
      className={`shrink-0 border-r border-gray-200 bg-[#fdfdfd] flex flex-col justify-between transition-all duration-300 relative ${
        isCollapsed ? "w-[76px]" : "w-[256px]"
      }`}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-white border border-gray-200 rounded-full p-1 text-gray-400 hover:text-gray-700 shadow-sm z-10 transition-colors"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className="p-4 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {/* Logo */}
        <div 
          className={`flex items-center gap-2.5 mb-8 cursor-pointer transition-all ${isCollapsed ? "justify-center" : "px-2"}`} 
          onClick={() => onViewChange("tts")}
        >
          <div className="w-8 h-8 shrink-0 bg-gray-900 rounded-lg flex items-center justify-center text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </div>
          {!isCollapsed && (
            <span className="text-[15px] font-bold text-gray-900 tracking-tight whitespace-nowrap overflow-hidden">
              tts studio
            </span>
          )}
        </div>

        {/* Tools Section */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Tools
            </div>
          )}

          <button
            title="Text to Speech"
            onClick={() => onViewChange("tts")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] rounded-lg transition-all duration-150 cursor-pointer overflow-hidden
              ${activeView === "tts"
                ? "bg-gray-100 text-gray-900 font-semibold shadow-sm"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium"
              } ${isCollapsed ? "justify-center" : ""}`}
          >
            <Volume2 className="w-[18px] h-[18px] shrink-0" />
            {!isCollapsed && <span className="whitespace-nowrap">Text to Speech</span>}
          </button>

          <button
            title="Live Translate"
            onClick={() => onViewChange("translate")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] rounded-lg transition-all duration-150 cursor-pointer overflow-hidden
              ${activeView === "translate"
                ? "bg-gray-100 text-gray-900 font-semibold shadow-sm"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium"
              } ${isCollapsed ? "justify-center" : ""}`}
          >
            <Languages className="w-[18px] h-[18px] shrink-0" />
            {!isCollapsed && <span className="whitespace-nowrap">Live Translate</span>}
          </button>
          
          <button
            title="Image Generation"
            onClick={() => onViewChange("image")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] rounded-lg transition-all duration-150 cursor-pointer overflow-hidden
              ${activeView === "image"
                ? "bg-gray-100 text-gray-900 font-semibold shadow-sm"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium"
              } ${isCollapsed ? "justify-center" : ""}`}
          >
            <ImageIcon className="w-[18px] h-[18px] shrink-0" />
            {!isCollapsed && <span className="whitespace-nowrap">Image Generation</span>}
          </button>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className={`p-4 border-t border-gray-200 flex items-center justify-between transition-all overflow-hidden ${isCollapsed ? "flex-col gap-4" : ""}`}>
        
        {/* User Profile (Left) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className={`flex items-center gap-3 hover:opacity-80 transition-opacity duration-150 cursor-pointer select-none
              ${isCollapsed ? "justify-center" : ""}`}
            >
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user?.email || "Avatar"}
                  className="w-[38px] h-[38px] rounded-[14px] object-cover shadow-sm border border-gray-200 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-[38px] h-[38px] rounded-[14px] bg-[#7c28b0] text-white flex items-center justify-center font-medium text-lg shadow-sm shrink-0">
                  {getUserLetter()}
                </div>
              )}
              {!isCollapsed && (
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-[16px] font-bold text-gray-900 leading-none">
                    {credits.toLocaleString()}
                  </span>
                  <span className="text-[13px] text-gray-500 font-medium leading-none mt-1.5">
                    Credits
                  </span>
                </div>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[220px] mb-2" side="right" align="end">
            <DropdownMenuLabel className="pb-0">Account Info</DropdownMenuLabel>
            <div className="px-3 py-1.5 text-[11px] text-gray-400 font-medium truncate">
              {user?.email || "Not signed in"}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center gap-2 text-[12.5px] cursor-default font-semibold text-gray-700">
              <Zap className="w-4 h-4 text-[#7c28b0] fill-current" />
              <span>{credits.toLocaleString()} Credits</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-red-600 focus:bg-red-50 focus:text-red-700 flex items-center gap-2 font-bold"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Buy Button (Right) */}
        <div className={`relative ${isCollapsed ? "" : "ml-auto"}`}>
          {/* Subtle multi-color glow shadow */}
          <div className="absolute -inset-[2px] bg-gradient-to-r from-emerald-200 via-sky-200 to-blue-200 rounded-full blur-[4px] opacity-80"></div>
          
          <button 
            title="Buy Credits"
            onClick={() => onViewChange("credits")}
            className={`relative flex items-center gap-1.5 bg-white rounded-full shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer
              ${isCollapsed ? "w-[38px] h-[38px] justify-center p-0" : "px-3.5 py-1.5"}`}
          >
            <ShoppingCart className="w-[15px] h-[15px] text-gray-900 stroke-[2.5]" />
            {!isCollapsed && <span className="text-[13px] font-semibold text-gray-900 pr-1">Buy</span>}
          </button>
        </div>

      </div>
    </aside>
  );
}
