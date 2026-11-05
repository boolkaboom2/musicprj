"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import CustomInput from "@/components/CustomInput";
import { useToast } from "@/components/Toast";
import AuthThemeToggle from "@/components/AuthThemeToggle";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const showToast = useToast((state) => state.show);

  const handleSubmit = async () => {
    if (!email || !password) {
      showToast("Введите email и пароль", "error");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = "/";
      } else {
        showToast(data.error || "Ошибка входа", "error");
      }
    } catch (err) {
      showToast("Ошибка сети. Попробуйте позже.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AuthThemeToggle />
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-6 transition-colors duration-300">
        <div className="w-full max-w-md">
          <div className="bg-[var(--bg-card)] p-8 md:p-10 rounded-xl border border-[var(--border-color)] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--text-subdued)] to-transparent opacity-30" />

            <h1 className="text-3xl font-black text-[var(--text-base)] mb-2 tracking-tighter">Вход</h1>
            <p className="text-[var(--text-subdued)] text-sm mb-8">Войдите, чтобы слушать и создавать плейлисты.</p>
            
            <div className="flex flex-col gap-4">
              <CustomInput
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <CustomInput
                isPassword
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-[var(--text-base)] text-[var(--bg-main)] font-bold uppercase tracking-wider py-4 rounded-md hover:opacity-80 transition-all duration-300 mt-2 flex justify-center items-center h-[56px] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Войти"}
              </button>
            </div>

            <div className="mt-6 flex justify-between items-center text-sm text-[var(--text-subdued)]">
              <Link href="/register" className="hover:text-[var(--text-base)] transition-all">Регистрация</Link>
              <Link href="/forgot-password" className="hover:text-[var(--text-base)] transition-all">Забыли пароль?</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}