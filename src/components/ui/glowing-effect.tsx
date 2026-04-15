"use client";

import { cn } from "@/lib/utils";

interface GlowingEffectProps {
  children: React.ReactNode;
  className?: string;
}

export function GlowingEffect({ children, className }: GlowingEffectProps) {
  return (
    <div className={cn("relative", className)}>
      <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 opacity-70 blur-md animate-pulse" />
      <div className="relative">
        {children}
      </div>
    </div>
  );
}