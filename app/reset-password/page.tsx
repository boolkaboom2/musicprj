"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import CustomInput from "@/components/CustomInput";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!token) {
    return (
      <div className="text-center text-red-500 bg-red-500/10 p-4 rounded-md border border-red-500/20">
        Неверная или отсутствующая ссылка для сброса.
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setMessage(""); setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage("Пароль успешно изменен! Сейчас перенаправим вас на вход.");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(data.error || "Ошибка");
      }
    } catch (err) {
      setError("Ошибка сети");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#121212] p-8 md:p-10 rounded-xl border border-white/5 w-full max-w-md shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      <h1 className="text-2xl font-black text-white mb-2">Новый пароль</h1>
      <p className="text-[var(--text-subdued)] text-sm mb-6">Введите новый пароль для вашего аккаунта.</p>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <CustomInput
          isPassword
          placeholder="Новый пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        {message && <div className="text-green-500 text-sm bg-green-500/10 p-3 rounded-md">{message}</div>}
        {error && <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-md">{error}</div>}

        <button type="submit" disabled={isLoading} className="bg-white text-black font-bold py-3 rounded-md hover:bg-gray-200 transition-colors flex justify-center items-center mt-2">
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Сохранить пароль"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] w-full p-8 animate-in fade-in zoom-in-95 duration-500 ease-out">
      {/* useSearchParams требует обертки в Suspense в Next.js */}
      <Suspense fallback={<div className="text-white"><Loader2 className="animate-spin" /></div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}