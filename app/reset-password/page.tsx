"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import CustomInput from "@/components/CustomInput";
import { useToast } from "@/components/Toast";
import PageTransition from "@/components/PageTransition";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const showToast = useToast((s) => s.show);

  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!token) {
    return (
      <div className="text-center text-red-500 bg-red-500/10 p-4 rounded-md border border-red-500/20 max-w-md">
        Неверная или отсутствующая ссылка для сброса.
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      
      if (res.ok) {
        showToast("Пароль успешно изменен! Перенаправляем на вход...", "success");
        setTimeout(() => router.push("/login"), 2000);
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
    <div className="bg-[#121212] p-8 md:p-10 rounded-xl border border-white/5 shadow-2xl relative overflow-hidden w-full max-w-md">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <h1 className="text-3xl font-black text-white mb-2 tracking-tighter">Новый пароль</h1>
      <p className="text-[var(--text-subdued)] text-sm mb-8">Введите новый пароль для вашего аккаунта.</p>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <CustomInput
          isPassword
          placeholder="Новый пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={isLoading}
          className="bg-white text-black font-bold uppercase tracking-wider py-4 rounded-md hover:bg-gray-200 transition-all duration-300 mt-2 flex justify-center items-center h-[56px] disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_25px_rgba(255,255,255,0.1)]"
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Сохранить пароль"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <Suspense fallback={<div className="text-white"><Loader2 className="animate-spin" /></div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </PageTransition>
  );
}