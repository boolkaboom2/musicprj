"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import CustomInput from "@/components/CustomInput";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setMessage(""); setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage("Ссылка для сброса пароля отправлена в консоль сервера (смотри терминал).");
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
    <div className="flex items-center justify-center min-h-[80vh] w-full p-8">
      <div className="bg-[#121212] p-8 md:p-10 rounded-xl border border-white/5 w-full max-w-md shadow-2xl">
        <h1 className="text-2xl font-black text-white mb-6">Сброс пароля</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <CustomInput
            type="email"
            placeholder="Введите ваш Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          {message && <div className="text-green-500 text-sm bg-green-500/10 p-3 rounded-md">{message}</div>}
          {error && <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-md">{error}</div>}

          <button type="submit" disabled={isLoading} className="bg-white text-black font-bold py-3 rounded-md hover:bg-gray-200 transition-colors flex justify-center items-center">
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Сбросить"}
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/login" className="text-sm text-[var(--text-subdued)] hover:text-white">Вернуться ко входу</Link>
        </div>
      </div>
    </div>
  );
}