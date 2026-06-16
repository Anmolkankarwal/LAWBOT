import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { User, LogIn, Shield } from "lucide-react";



interface AuthScreenProps {
  onGuestLogin: () => void;
  onOAuthSuccess: () => void;
  isLoading: boolean;
}

export default function AuthScreen({ onGuestLogin, onOAuthSuccess, isLoading }: AuthScreenProps) {
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-white flex flex-col z-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div
          className={`flex flex-col items-center transition-all duration-600 ease-out ${fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
        >
          {/* Logo */}
          <div className="w-20 h-20 mb-6">
            <img
              src="/logo.png"
              alt="LawBot"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Welcome Text */}
          <h1 className="text-2xl font-bold text-[#202123] text-center mb-2">
            Welcome to LawBot
          </h1>
          <p className="text-[#6E6E80] text-center text-base max-w-[300px] mb-8">
            Your AI-powered legal assistant for Indian law. Ask in Hindi, Hinglish, or English.
          </p>

          {/* Feature highlights */}
          <div className="flex flex-col gap-3 w-full max-w-[320px] mb-8">
            <div className="flex items-start gap-3 p-3 bg-[#F2F4F7] rounded-xl">
              <Shield className="w-5 h-5 text-[#10A37F] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#202123]">Legal References</p>
                <p className="text-xs text-[#6E6E80]">Cited sections from BNS, BNSS & Constitution</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-[#F2F4F7] rounded-xl">
              <User className="w-5 h-5 text-[#10A37F] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#202123]">Multilingual</p>
                <p className="text-xs text-[#6E6E80]">Works in Hindi, Hinglish & English</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Area */}
      <div
        className={`px-6 pb-10 pt-4 transition-all duration-500 ease-out delay-200 ${fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
      >
        <div className="flex flex-col gap-3 max-w-[320px] mx-auto">
          {/* Google OAuth Button */}
          <Button
            className="w-full h-12 bg-[#10A37F] hover:bg-[#1AAD85] text-white font-medium rounded-xl text-base shadow-sm transition-all active:scale-[0.98]"
            onClick={onGuestLogin}
          >
            <LogIn className="w-5 h-5 mr-2" />
            Continue with Google
          </Button>

          {/* Guest Button */}
          <Button
            variant="outline"
            className="w-full h-12 border-[#E5E5E5] text-[#202123] font-medium rounded-xl text-base hover:bg-[#F2F4F7] transition-all active:scale-[0.98]"
            onClick={onGuestLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-[#10A37F] border-t-transparent rounded-full animate-spin" />
                Loading...
              </span>
            ) : (
              <>
                <User className="w-5 h-5 mr-2" />
                Continue as Guest
              </>
            )}
          </Button>

          {/* Disclaimer */}
          <p className="text-[11px] text-[#6E6E80] text-center mt-2 leading-relaxed">
            By continuing, you agree to our Terms of Service. This is an educational tool and not a substitute for professional legal advice.
          </p>
        </div>
      </div>
    </div>
  );
}
