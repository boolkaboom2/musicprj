"use client";

export default function Loader() {
  return (
    <div className="flex items-center justify-center w-full min-h-[50vh]">
      <div className="flex gap-2">
        <div className="w-2.5 h-2.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2.5 h-2.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2.5 h-2.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}