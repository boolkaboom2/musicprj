"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import CustomInput from "@/components/CustomInput";
import { useToast } from "@/components/Toast";
import PageTransition from "@/components/PageTransition";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const showToast = useToast((s) => s.show);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (res.ok) {
        showToast("Ссылка для сброса отправлена в консоль сервера (смотрите терминал)", "success");
      } else {
        showToast(data.error || "Ошибка", "error");
      }
    } catch (err) {
      showToast("Ошибка сети", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-[#121212] p-8 md:p-10 rounded-xl border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <h1 className="text-3xl font-black text-white mb-2 tracking-tighter">Сброс пароля</h1>
            <p className="text-[var(--text-subdued)] text-sm mb-8">Введите ваш email, и мы сгенерируем ссылку для сброса.</p>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <CustomInput
                type="email"
                placeholder="Ваш Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <button
                type="submit"
                disabled={isLoading}
                className="bg-white text-black font-bold uppercase tracking-wider py-4 rounded-md hover:bg-gray-200 transition-all duration-300 mt-2 flex justify-center items-center h-[56px] disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_25px_rgba(255,255,255,0.1)]"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Сбросить"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-[var(--text-subdued)]">
              <Link href="/login" className="hover:text-white transition-all">Вернуться ко входу</Link>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}