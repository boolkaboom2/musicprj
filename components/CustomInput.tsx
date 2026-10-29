"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isPassword?: boolean;
}

export default function CustomInput({ isPassword, className, ...props }: CustomInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = isPassword ? (showPassword ? "text" : "password") : "text";
  
  return (
    <div className="relative w-full">
      <input
        {...props}
        type={inputType}
        required={false}
        className={`w-full bg-[#1a1a1a] text-white p-4 pr-12 rounded-md outline-none focus:ring-1 focus:ring-white/30 border border-transparent focus:border-white/10 transition-all duration-300 ${className}`}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-subdued)] hover:text-white transition-colors duration-300"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
    </div>
  );
}
