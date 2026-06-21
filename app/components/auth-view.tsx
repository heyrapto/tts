"use client";

import { useState } from "react";
import { supabase, isMock } from "../lib/supabase";
import { Button } from "./ui/button";
import { ShieldCheck } from "lucide-react";

export default function AuthView() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      if (error) throw error;
    } catch (error) {
      console.error("Sign-in error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#fafafa] p-4 text-gray-900 font-sans">
      {/* Centered Login Card */}
      <div className="w-full max-w-[380px] bg-white border border-gray-200 rounded-2xl p-8 shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-violet-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-sm mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">tts studio</h1>
          <p className="text-xs text-gray-500 font-medium mt-1.5">Sign in to manage and generate audio scripts</p>
        </div>

        {/* Demo Mode Notice */}
        {isMock && (
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl mb-6 flex gap-2.5 items-start">
            <ShieldCheck className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-800 font-semibold leading-relaxed">
              <span className="font-bold">Demo Mode Active</span>
              <p className="font-medium text-amber-700 mt-0.5">
                No Supabase credentials detected in `.env`. Click sign in to access immediately as a guest.
              </p>
            </div>
          </div>
        )}

        {/* Sign In Button */}
        <Button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 font-bold py-3.5 rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98] cursor-pointer"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <>
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.69 5.69 0 0 1 8.24 12.8a5.69 5.69 0 0 1 5.751-5.714c1.458 0 2.783.525 3.81 1.408l3.14-3.136C18.892 3.48 16.48 2.378 13.99 2.378c-5.23 0-9.48 4.25-9.48 9.48s4.25 9.482 9.48 9.482c5.44 0 9.049-3.82 9.049-9.213a8.9 8.9 0 0 0-.166-1.842h-8.883v.001Z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </Button>

        {/* Footer info */}
        <div className="mt-6 text-center">
          <span className="text-[10px] font-semibold text-gray-400">
            Secure authentication managed by Supabase.
          </span>
        </div>
      </div>
    </div>
  );
}
