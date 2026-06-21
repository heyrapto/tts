"use client";

import { useState } from "react";
import { 
  Zap,
  ChevronDown,
  Flame,
  CheckCircle2,
  MinusCircle,
  PlusCircle,
  Check,
} from "lucide-react";
import { useAppStore } from "../store/use-app-store";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import SignInModal from "./sign-in-modal";

export default function CreditsView() {
  const { credits, isUpgraded, setUpgrade } = useAppStore();
  const [duration, setDuration] = useState("3 Months ($5.00)");
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  const durationOptions = [
    "1 Month ($2.00)",
    "3 Months ($5.00)",
    "6 Months ($9.00)",
    "12 Months ($15.00)",
  ];

  const handleUpgrade = () => {
    const currentUser = useAppStore.getState().user;
    if (!currentUser) {
      setShowSignIn(true);
      return;
    }
    setUpgrade(true);
    setShowSuccess(true);
  };

  const handleDowngrade = () => {
    setUpgrade(false);
  };

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  // Base price calculations
  const getBasePrice = () => {
    if (duration.includes("$2.00")) return 2;
    if (duration.includes("$5.00")) return 5;
    if (duration.includes("$9.00")) return 9;
    if (duration.includes("$15.00")) return 15;
    return 5;
  };

  const calculateTotalPrice = () => {
    const base = getBasePrice();
    const subtotal = base * quantity;
    // Standard discount logic: if quantity > 1, apply a discount (e.g. 5% per extra item up to 25%)
    const discount = Math.min(0.25, (quantity - 1) * 0.05);
    return (subtotal * (1 - discount)).toFixed(2);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-6 p-6 h-full overflow-y-auto bg-[#fafafa]">
      {/* Left Column: Paid tier */}
      <div className="w-full md:w-[380px] shrink-0">
        <div className="border-2 border-violet-100 rounded-2xl bg-white shadow-sm p-6 flex flex-col h-full relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-violet-100/40 rounded-full blur-3xl pointer-events-none" />

          {/* Title */}
          <h2 className="text-2xl font-bold flex items-center gap-2.5 mb-6 text-gray-900">
            <Zap className="w-6 h-6 fill-current text-gray-900" /> Paid tier
          </h2>
          
          {/* Dropdown with shadcn */}
          <div className="mb-5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-between w-full px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors shadow-sm focus:outline-none">
                  <span>{duration}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[330px]">
                {durationOptions.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => setDuration(option)}
                    className={duration === option ? "bg-gray-100 text-gray-900 font-semibold" : ""}
                  >
                    {option}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Promo banner */}
          <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl p-4 mb-6 text-white shadow-md relative overflow-hidden">
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
            
            <div className="flex items-start gap-3 relative z-10">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm shadow-sm">
                <Flame className="w-5 h-5 text-white fill-current" />
              </div>
              <div className="flex-1">
                <div className="flex items-center flex-wrap gap-2 font-black text-sm tracking-tight mb-1">
                   FLAT PRICE 
                   <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider backdrop-blur-sm border border-white/10 shadow-sm">
                     Limited time only
                   </span>
                </div>
                <p className="text-[12px] font-medium text-white/90 leading-snug">
                  All credit packages at the same price, regardless of validity period!
                </p>
              </div>
            </div>
          </div>
          
          {/* Features list */}
          <div className="space-y-4 mb-8 flex-1">
             <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-gray-900 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold text-gray-900 text-base">
                    <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded mr-1.5 font-extrabold">1,000,000</span> 
                    credits
                  </span>
                  <ul className="mt-2 space-y-1 text-[13px] font-medium text-gray-500">
                    <li>≈ 1,700 minutes of Text to Speech</li>
                    <li>≈ 834 AI songs</li>
                    <li>≈ 667 AI videos</li>
                    <li>≈ 400 Proxies</li>
                    <li>≈ 2,000 Images</li>
                    <li className="text-gray-400 italic">* Unlimited cloned voices</li>
                  </ul>
                </div>
             </div>
             
             <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-gray-900 shrink-0" />
                <span className="font-bold text-gray-900 text-base">API access</span>
             </div>
          </div>
          
          {/* Price control */}
          <div className="mb-6">
            <div className="flex items-center justify-between px-6 mb-2">
               <button 
                 onClick={decreaseQuantity}
                 className="text-gray-400 hover:text-gray-900 transition-colors"
               >
                 <MinusCircle className="w-6 h-6" />
               </button>
               <span className="text-3xl font-black text-gray-900 tracking-tight">{calculateTotalPrice()} $</span>
               <button 
                 onClick={increaseQuantity}
                 className="text-gray-400 hover:text-gray-900 transition-colors"
               >
                 <PlusCircle className="w-6 h-6" />
               </button>
            </div>
            <p className="text-center text-xs font-medium text-gray-500">
              {quantity > 1 ? `Quantity: ${quantity} (Discount active!)` : 'The more you press "+", the cheaper it gets'}
            </p>
          </div>
          
          {/* Buttons refactored to shadcn */}
          <div className="space-y-2.5">
            <div className="flex gap-2.5">
               <Button
                 onClick={handleUpgrade}
                 className="flex-1 bg-[#ffc439] hover:bg-[#f4b624] text-[#003087] font-bold text-[13px] py-3 rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer"
               >
                 PayPal / Credit Card
               </Button>
               <Button 
                 onClick={handleUpgrade}
                 className="flex-1 bg-gray-900 hover:bg-black text-white font-bold text-[13px] py-3 rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer"
               >
                 USDT
               </Button>
            </div>
            <Button
              onClick={handleUpgrade}
              variant="outline"
              className="w-full bg-white hover:bg-gray-50 text-gray-900 font-bold text-[13px] py-3 rounded-xl border border-gray-200 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
            >
              Chuyển khoản / Wise
            </Button>
          </div>
          
          <p className="text-center text-xs font-medium text-gray-400 mt-5">
            Need more methods? <a href="#" className="text-gray-600 hover:underline">Contact us.</a>
          </p>
        </div>
      </div>
      
      {/* Right Column: Your Credits */}
      <div className="flex-1 flex flex-col">
         <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-8 flex-1 flex flex-col relative overflow-hidden">
            {/* Subtle corner graphic */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-gray-50 to-white opacity-50 rounded-full blur-3xl pointer-events-none -mt-10 -mr-10" />

            <h2 className="text-xl font-bold flex items-center gap-2.5 mb-8 text-gray-900 relative z-10">
              <Zap className="w-5 h-5 text-gray-900" /> Your Credits
            </h2>
            
            <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-6 mb-8 relative z-10 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-gray-500 mb-1.5 tracking-wide">Total Credits</p>
                <p className="text-4xl font-black text-gray-900 tracking-tight">
                  {credits.toLocaleString()}
                </p>
              </div>
              
              {isUpgraded && (
                <Button 
                  onClick={handleDowngrade} 
                  variant="ghost" 
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 text-[11px] font-semibold"
                  title="Reset status back to free tier"
                >
                  Downgrade (Reset)
                </Button>
              )}
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
              {isUpgraded ? (
                <div className="flex flex-col items-center text-center max-w-[280px]">
                  <div className="w-16 h-16 mb-4 rounded-full bg-violet-50 flex items-center justify-center text-violet-600">
                    <Check className="w-8 h-8" />
                  </div>
                  <p className="text-[15px] font-bold text-gray-900 mb-1">Paid Tier Active</p>
                  <p className="text-xs text-gray-400 leading-normal">
                    You have unlocked unlimited voice synthesis script limits up to 10,000 characters per request.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center max-w-[280px]">
                  <div className="w-16 h-16 mb-4 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                    <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4M12 20V4" />
                    </svg>
                  </div>
                  <p className="text-[15px] font-semibold text-gray-400">No expiring credit packages</p>
                  <p className="text-xs text-gray-400 leading-normal mt-1">
                    Upgrade to get 1,000,000 credits and unlock full platform script lengths.
                  </p>
                </div>
              )}
            </div>
         </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Zap className="w-8 h-8 fill-current" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Upgrade Successful!</h3>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              Congratulations! Your account has been upgraded to the Premium Paid Tier. 1,000,000 credits have been added to your balance.
            </p>
            <Button onClick={() => setShowSuccess(false)} className="w-full">
              Start Creating
            </Button>
          </div>
        </div>
      )}
      
      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
    </div>
  );
}
