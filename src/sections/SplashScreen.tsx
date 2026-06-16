import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
      <div
        className={`flex flex-col items-center transition-all duration-700 ease-out ${
          fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Logo */}
        <div className="w-24 h-24 mb-6">
          <img
            src="/logo.png"
            alt="LawBot"
            className="w-full h-full object-contain"
          />
        </div>

        {/* App Name */}
        <h1 className="text-3xl font-bold text-[#202123] tracking-tight mb-2">
          LawBot
        </h1>

        {/* Tagline */}
        <p className="text-[#6E6E80] text-base text-center max-w-[280px]">
          Your AI Legal Assistant
        </p>

        {/* Sub tagline */}
        <p className="text-[#6E6E80] text-sm text-center mt-1">
          Know Your Rights
        </p>

        {/* Loading indicator */}
        <div className="mt-8 flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#10A37F] animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-[#10A37F] animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-[#10A37F] animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
