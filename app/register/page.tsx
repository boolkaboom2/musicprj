"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // После регистрации сразу логиним
        await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "Ошибка регистрации");
      }
    } catch (err) {
      setError("Ошибка сети. Попробуйте позже.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] w-full p-8 animate-in fade-in zoom-in-95 duration-500 ease-out">
      <div className="bg-[#121212] p-8 md:p-10 rounded-xl border border-white/5 w-full max-w-md shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

        <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Регистрация</h1>
        <p className="text-[var(--text-subdued)] text-sm mb-8">Создайте аккаунт SADOVOD.</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <input
              type="text"
              placeholder="Ваше имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1a1a1a] text-white p-4 rounded-md outline-none focus:ring-1 focus:ring-white/30 border border-transparent focus:border-white/10 transition-all duration-300"
            />
          </div>
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#1a1a1a] text-white p-4 rounded-md outline-none focus:ring-1 focus:ring-white/30 border border-transparent focus:border-white/10 transition-all duration-300"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#1a1a1a] text-white p-4 rounded-md outline-none focus:ring-1 focus:ring-white/30 border border-transparent focus:border-white/10 transition-all duration-300"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-md border border-red-500/20 animate-in slide-in-from-top-2 fade-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="bg-white text-black font-bold py-4 rounded-md hover:bg-gray-200 transition-all duration-300 mt-2 flex justify-center items-center h-[56px] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Создать аккаунт"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[var(--text-subdued)]">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-white hover:underline transition-all">
            Войти
          </Link>
        </div>
      </div>
    </div>
  );
}