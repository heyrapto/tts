"use client";

import { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Download,
  Upload,
  ChevronDown,
  Settings2,
  History,
  FileAudio2,
  Volume2,
  Copy,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useAppStore } from "../store/use-app-store";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import SignInModal from "./sign-in-modal";

const VOICES = [
  { id: "Schedar", name: "Schedar", tag: "Natural" },
  { id: "Aoede", name: "Aoede", tag: "Expressive" },
  { id: "Charon", name: "Charon", tag: "Deep" },
  { id: "Fenrir", name: "Fenrir", tag: "Bold" },
  { id: "Kore", name: "Kore", tag: "Calm" },
  { id: "Puck", name: "Puck", tag: "Dynamic" },
];

export default function TtsView() {
  const { isUpgraded, deductCredits, addHistoryItem, history } = useAppStore();
  
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("Schedar");
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"settings" | "history">("settings");
  const [showSignIn, setShowSignIn] = useState(false);
  
  // Voice Preview States
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Local active audio url playing (for history items)
  const [playingHistoryId, setPlayingHistoryId] = useState<string | null>(null);
  const historyAudioRef = useRef<HTMLAudioElement | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Character limit based on tier
  const characterLimit = isUpgraded ? 10000 : 900;

  // Cleanup audios on unmount
  useEffect(() => {
    return () => {
      if (previewAudioRef.current) previewAudioRef.current.pause();
      if (historyAudioRef.current) historyAudioRef.current.pause();
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [audioUrl]);

  const handleGenerate = async () => {
    const currentUser = useAppStore.getState().user;
    if (!currentUser) {
      setShowSignIn(true);
      return;
    }

    if (!text.trim() || text.length > characterLimit) return;
    setIsLoading(true);
    setAudioUrl(null);
    setError(null);
    setIsPlaying(false);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate audio");
      }
      
      const blob = await res.blob();
      const newUrl = URL.createObjectURL(blob);
      setAudioUrl(newUrl);

      // Deduct credits (1 credit per character generated)
      deductCredits(text.length);

      // Save to history
      addHistoryItem({
        type: "tts",
        input: text,
        outputUrl: newUrl,
        voice: voice,
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
  };

  const handleVoicePreview = (voiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (playingPreview === voiceId) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setPlayingPreview(null);
      return;
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }

    const audio = new Audio(`/api/voice-preview?voice=${voiceId}`);
    previewAudioRef.current = audio;
    setPlayingPreview(voiceId);

    audio.play().catch((err) => {
      console.error("Preview audio play error:", err);
      setPlayingPreview(null);
    });

    audio.onended = () => {
      setPlayingPreview(null);
    };
  };

  const playHistoryAudio = (item: any) => {
    if (playingHistoryId === item.id) {
      if (historyAudioRef.current) {
        historyAudioRef.current.pause();
      }
      setPlayingHistoryId(null);
      return;
    }

    if (historyAudioRef.current) {
      historyAudioRef.current.pause();
    }

    // If we have a blob url in memory, play it
    if (item.outputUrl) {
      const audio = new Audio(item.outputUrl);
      historyAudioRef.current = audio;
      setPlayingHistoryId(item.id);
      audio.play().catch(async () => {
        // Blob might have expired, let's regenerate on the fly!
        regenerateHistoryItem(item);
      });
      audio.onended = () => setPlayingHistoryId(null);
    } else {
      // Regenerate on the fly
      regenerateHistoryItem(item);
    }
  };

  const regenerateHistoryItem = async (item: any) => {
    setPlayingHistoryId(item.id);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: item.input, voice: item.voice }),
      });
      if (!res.ok) throw new Error("Failed to replay");
      const blob = await res.blob();
      const freshUrl = URL.createObjectURL(blob);
      
      // Update item url locally for subsequent clicks
      item.outputUrl = freshUrl;
      
      const audio = new Audio(freshUrl);
      historyAudioRef.current = audio;
      audio.play();
      audio.onended = () => setPlayingHistoryId(null);
    } catch (err) {
      console.error(err);
      setPlayingHistoryId(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const contents = event.target?.result as string;
      setText(contents.slice(0, characterLimit));
    };
    reader.readAsText(file);
  };

  const selectedVoice = VOICES.find((v) => v.id === voice)!;
  const ttsHistory = history.filter((h) => h.type === "tts");

  return (
    <div className="flex-1 flex gap-5 p-6 overflow-hidden h-full">
      {/* Center: Text Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 flex flex-col border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
          <textarea
            className="flex-1 w-full p-6 resize-none outline-none text-[15px] leading-relaxed text-gray-800 placeholder-gray-400 bg-transparent custom-scrollbar"
            placeholder={`Start typing or paste your script here... (${characterLimit.toLocaleString()} character limit for your tier)\n\nTry something like:\n'This is a psychopath. This is a sociopath. What's the difference?'`}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, characterLimit))}
          />

          {/* Footer bar */}
          <div className="shrink-0 px-4 py-3 flex items-center justify-between border-t border-gray-100 bg-white">
            <label className="p-2 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all duration-150 cursor-pointer" title="Upload text file">
              <Upload className="w-[18px] h-[18px]" />
              <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
            </label>

            <div className="flex items-center gap-4">
              <span className={`text-xs font-medium tabular-nums ${text.length > characterLimit ? "text-red-500 font-bold" : "text-gray-400"}`}>
                {text.length.toLocaleString()} / {characterLimit.toLocaleString()}
              </span>
              <Button
                onClick={handleGenerate}
                disabled={isLoading || !text.trim() || text.length > characterLimit}
                size="icon"
                className="w-11 h-11 shrink-0"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <Play className="w-5 h-5 ml-0.5 fill-current" />
                )}
              </Button>
            </div>
          </div>
        </div>
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
              {/* Voice Select */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-semibold text-gray-900">Select a voice</span>
                  <span className="text-[10px] bg-gray-900 text-white px-2 py-0.5 rounded flex items-center gap-1 font-medium tracking-wide uppercase">
                    <FileAudio2 className="w-3 h-3" />
                    Gemini TTS
                  </span>
                </div>

                {/* Custom shadcn dropdown menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-300 rounded-lg bg-white hover:border-gray-400 text-[13px] font-medium text-gray-900 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
                      <span>{selectedVoice.name} — {selectedVoice.tag}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[260px]">
                    <DropdownMenuLabel>Voices</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {VOICES.map((v) => (
                      <DropdownMenuItem
                        key={v.id}
                        onClick={() => setVoice(v.id)}
                        className={`flex items-center justify-between ${
                          voice === v.id ? "bg-gray-100 text-gray-900 font-bold" : ""
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold">{v.name}</span>
                          <span className="text-[10px] text-gray-400">{v.tag}</span>
                        </div>
                        {/* Play preview button */}
                        <button
                          onClick={(e) => handleVoicePreview(v.id, e)}
                          className="p-1 rounded-md bg-white hover:bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-900 shadow-sm transition-all duration-100 flex items-center justify-center shrink-0"
                          title={`Listen to ${v.name} preview`}
                        >
                          {playingPreview === v.id ? (
                            <Pause className="w-3.5 h-3.5 text-violet-600 fill-current" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5 text-gray-600" />
                          )}
                        </button>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <p className="text-xs text-red-700 font-medium">{error}</p>
                </div>
              )}

              {/* Audio Player */}
              {audioUrl && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <button
                      className="w-10 h-10 shrink-0 flex items-center justify-center bg-gray-900 text-white rounded-full hover:bg-black hover:scale-105 transition-all duration-200 shadow-md"
                      onClick={togglePlay}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5 fill-current" />
                      )}
                    </button>
                    <span className="flex-1 text-[13px] font-semibold text-gray-900 truncate">
                      Generated Audio
                    </span>
                    <a
                      href={audioUrl}
                      download={`speech-${voice.toLowerCase()}.wav`}
                      className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors duration-150"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    controls
                    className="w-full h-8"
                    controlsList="nodownload noplaybackrate"
                  />
                </div>
              )}
            </div>
          ) : (
            /* History View */
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="text-[13px] font-semibold text-gray-900 mb-3 block">Generation History</span>
              {ttsHistory.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <FileAudio2 className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-xs font-semibold text-gray-400">No TTS history yet</p>
                  <p className="text-[10px] text-gray-400 mt-1">Generate text-to-speech to see logs here.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                  {ttsHistory.map((item) => (
                    <div key={item.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl hover:shadow-sm transition-all duration-150">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-[11px] font-bold text-gray-600 bg-gray-200/60 px-1.5 py-0.5 rounded">
                          {item.voice}
                        </span>
                        <span className="text-[9px] font-medium text-gray-400">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <p className="text-[11.5px] font-medium text-gray-700 leading-snug line-clamp-3 mb-2">
                        {item.input}
                      </p>

                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => playHistoryAudio(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-md text-[11px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
                        >
                          {playingHistoryId === item.id ? (
                            <>
                              <Pause className="w-3 h-3 text-violet-600 fill-current" />
                              <span>Playing</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 text-gray-600 fill-current" />
                              <span>Play</span>
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => setText(item.input)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-md text-[11px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs ml-auto cursor-pointer"
                          title="Load script into editor"
                        >
                          <Copy className="w-3 h-3 text-gray-400" />
                          <span>Load</span>
                        </button>

                        {item.outputUrl && (
                          <a
                            href={item.outputUrl}
                            download={`speech-${item.voice?.toLowerCase()}-${item.id}.wav`}
                            className="p-1.5 text-gray-400 hover:text-gray-900 bg-white border border-gray-200 rounded-md transition-colors"
                            title="Download Audio"
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
      
      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
    </div>
  );
}
