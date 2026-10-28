"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import CustomInput from "@/components/CustomInput";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    console.log("ФОРМА ОТПРАВЛЕНА! Данные:", email, password); 
    
    if (!email || !password) {
       setError("Введите email и пароль");
       return;
    }

    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("ОТВЕТ ОТ СЕРВЕРА:", data);

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "Ошибка входа");
      }
    } catch (err) {
      console.error(err);
      setError("Ошибка сети. Попробуйте позже.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] w-full p-8 animate-in fade-in zoom-in-95 duration-500 ease-out">
      <div className="bg-[#121212] p-8 md:p-10 rounded-xl border border-white/5 w-full max-w-md shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

        <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Вход</h1>
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

          {error && (
            <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-md border border-red-500/20 animate-in slide-in-from-top-2 fade-in">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-white text-black font-bold py-4 rounded-md hover:bg-gray-200 transition-all duration-300 mt-2 flex justify-center items-center h-[56px] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Войти"}
          </button>
        </div>

        <div className="mt-4 flex justify-between items-center text-sm text-[var(--text-subdued)]">
          <Link href="/register" className="hover:text-white transition-all">
            Регистрация
          </Link>
          <Link href="/forgot-password" className="hover:text-white transition-all">
            Забыли пароль?
          </Link>
        </div>
      </div>
    </div>
  );
}
