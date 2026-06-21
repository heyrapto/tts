"use client";

import { useState, useEffect } from "react";
import {
  Download,
  Sparkles,
  Settings2,
  History,
  ImageIcon,
  X,
  Copy,
} from "lucide-react";
import { useAppStore } from "../store/use-app-store";
import { Button } from "./ui/button";
import SignInModal from "./sign-in-modal";

export default function ImageView() {
  const { deductCredits, addHistoryItem, history } = useAppStore();

  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<{ data: string; mimeType: string }[]>([]);
  const [responseText, setResponseText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"settings" | "history">("settings");
  const [showSignIn, setShowSignIn] = useState(false);

  const handleGenerate = async () => {
    const currentUser = useAppStore.getState().user;
    if (!currentUser) {
      setShowSignIn(true);
      return;
    }

    if (!prompt.trim()) return;
    setIsLoading(true);
    setImages([]);
    setResponseText("");
    setError(null);

    try {
      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate image");
      }

      const data = await res.json();
      const generatedImages = data.images || [];
      setImages(generatedImages);
      setResponseText(data.text || "");

      // Deduct 50 credits per image generation
      deductCredits(50);

      // Save each generated image to history
      if (generatedImages.length > 0) {
        const img = generatedImages[0];
        const dataUrl = `data:${img.mimeType};base64,${img.data}`;
        addHistoryItem({
          type: "image",
          input: prompt,
          outputUrl: dataUrl,
          outputText: data.text || "",
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const imageHistory = history.filter((h) => h.type === "image");

  return (
    <div className="flex-1 flex gap-5 p-6 overflow-hidden h-full">
      {/* Center: Prompt + Results */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 flex flex-col border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
          <textarea
            className="flex-1 w-full p-6 resize-none outline-none text-[15px] leading-relaxed text-gray-800 placeholder-gray-400 bg-transparent custom-scrollbar"
            placeholder="Describe the image you'd like to generate...&#10;&#10;Try: 'A serene Japanese garden at sunset with cherry blossoms falling over a koi pond'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="shrink-0 px-4 py-3 flex items-center justify-between border-t border-gray-100 bg-white">
            <div className="flex items-center gap-2">
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium animate-pulse">
                  <Sparkles className="w-4 h-4 text-violet-600 animate-spin" />
                  <span>Generating image…</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400 font-medium tabular-nums">
                {prompt.length.toLocaleString()} characters
              </span>
              <Button
                onClick={handleGenerate}
                disabled={isLoading || !prompt.trim()}
                size="icon"
                className="w-11 h-11 shrink-0"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Image Results Grid */}
        {images.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-4 overflow-y-auto custom-scrollbar pb-2">
            {images.map((img, i) => (
              <div
                key={i}
                className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm group cursor-pointer bg-gray-50 aspect-square"
                onClick={() => setLightboxSrc(`data:${img.mimeType};base64,${img.data}`)}
              >
                <img
                  src={`data:${img.mimeType};base64,${img.data}`}
                  alt={`Generated image ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <a
                    href={`data:${img.mimeType};base64,${img.data}`}
                    download={`generated-${i + 1}.png`}
                    className="p-2.5 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-all shadow-lg"
                    title="Download"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="w-5 h-5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {responseText && (
          <div className="mt-4 p-5 bg-gray-50 border border-gray-200 rounded-xl shadow-sm text-[14px] text-gray-800 leading-relaxed">
            <p>{responseText}</p>
          </div>
        )}
      </div>

      {/* Right Panel: Settings / History */}
      <div className="w-[300px] shrink-0 flex flex-col">
        <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm p-5 overflow-y-auto custom-scrollbar">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit mb-6 border border-gray-200/60">
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-150 flex items-center gap-1.5 ${
                activeTab === "settings"
                  ? "bg-white shadow-sm text-gray-900 border-gray-200/80"
                  : "text-gray-500 hover:text-gray-700 border-transparent"
              }`}
            >
              <Settings2 className="w-4 h-4" />
              Settings
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-150 flex items-center gap-1.5 ${
                activeTab === "history"
                  ? "bg-white shadow-sm text-gray-900 border-gray-200/80"
                  : "text-gray-500 hover:text-gray-700 border-transparent"
              }`}
            >
              <History className="w-4 h-4" />
              History
            </button>
          </div>

          {activeTab === "settings" ? (
            /* Settings View */
            <div className="flex flex-col flex-1">
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-semibold text-gray-900">Model</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-800">
                  <Sparkles className="w-4 h-4 text-violet-600 animate-pulse" />
                  Gemini 2.5 Flash Image
                </div>
              </div>

              <div className="mb-5">
                <span className="text-[13px] font-semibold text-gray-900 block mb-1">Output</span>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Images are generated alongside optional text descriptions. Results appear below the prompt area.
                </p>
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg mt-4">
                  <p className="text-xs text-red-700 font-medium">{error}</p>
                </div>
              )}
            </div>
          ) : (
            /* History View */
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="text-[13px] font-semibold text-gray-900 mb-3 block">Image History</span>
              {imageHistory.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <ImageIcon className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-xs font-semibold text-gray-400">No image history yet</p>
                  <p className="text-[10px] text-gray-400 mt-1">Generate images to see thumbnails here.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                  {imageHistory.map((item) => (
                    <div key={item.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl hover:shadow-sm transition-all duration-150">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[9px] font-medium text-gray-400">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      {item.outputUrl && (
                        <div
                          className="relative rounded-lg overflow-hidden border border-gray-200 bg-white mb-2 aspect-square cursor-zoom-in group shadow-xs"
                          onClick={() => setLightboxSrc(item.outputUrl || null)}
                        >
                          <img
                            src={item.outputUrl}
                            alt={item.input}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white bg-black/40 px-2 py-1 rounded-md backdrop-blur-xs">
                              Enlarge
                            </span>
                          </div>
                        </div>
                      )}

                      <p className="text-[11.5px] font-semibold text-gray-700 leading-snug line-clamp-2 mb-2">
                        {item.input}
                      </p>

                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => setPrompt(item.input)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-md text-[11px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
                          title="Copy prompt to editor"
                        >
                          <Copy className="w-3 h-3 text-gray-400" />
                          <span>Use Prompt</span>
                        </button>

                        {item.outputUrl && (
                          <a
                            href={item.outputUrl}
                            download={`image-${item.id}.png`}
                            className="p-1.5 text-gray-400 hover:text-gray-900 bg-white border border-gray-200 rounded-md transition-colors ml-auto"
                            title="Download Image"
                          >
                            <Download className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            className="absolute top-6 right-6 p-2.5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-md"
            onClick={() => setLightboxSrc(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxSrc}
            alt="Full size"
            className="max-w-full max-h-full rounded-lg shadow-2xl object-contain animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      
      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
    </div>
  );
}
