"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import CustomInput from "@/components/CustomInput";
import { useToast } from "@/components/Toast";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const router = useRouter();
  const showToast = useToast((state) => state.show);

  useEffect(() => {
    const savedCode = localStorage.getItem('sadovod_invite_code');
    if (savedCode) {
      setInviteCode(savedCode);
      // СРАЗУ УДАЛЯЕМ, чтобы нельзя было перезайти без кода
      localStorage.removeItem('sadovod_invite_code'); 
    } else {
      router.push('/welcome');
    }
  }, [router]);

  const handleSubmit = async () => {
    if (!email || !password || !name) {
      showToast("Заполните все поля", "error");
      return;
    }
    if (!agreed) {
      showToast("Согласитесь с политикой конфиденциальности", "error");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, inviteCode }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast("Аккаунт успешно создан!", "success");
        await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        router.push("/");
        router.refresh();
      } else {
        showToast(data.error || "Ошибка регистрации", "error");
        // Если код не подошел, возвращаем на welcome
        if (res.status === 403) router.push('/welcome');
      }
    } catch (err) {
      showToast("Ошибка сети. Попробуйте позже.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!inviteCode) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-[#121212] p-8 md:p-10 rounded-xl border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <h1 className="text-3xl font-black text-white mb-2 tracking-tighter">Регистрация</h1>
          <p className="text-[var(--text-subdued)] text-sm mb-6">Создайте аккаунт SADOVOD.</p>
          
          <div className="flex flex-col gap-3">
            <CustomInput type="text" placeholder="Ваше имя" value={name} onChange={(e) => setName(e.target.value)} />
            <CustomInput type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <CustomInput isPassword placeholder="Пароль (мин 6 символов)" value={password} onChange={(e) => setPassword(e.target.value)} />

            <label className="flex items-start gap-3 mt-2 cursor-pointer group">
              <div 
                onClick={(e) => { e.preventDefault(); setAgreed(!agreed); }}
                className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                  agreed ? 'bg-white border-white' : 'border-white/20 group-hover:border-white/40'
                }`}
              >
                {agreed && <span className="text-black font-bold text-xs">✓</span>}
              </div>
              <span className="text-xs text-[var(--text-subdued)] leading-relaxed select-none">
                Я согласен с <Link href="/privacy" target="_blank" className="text-white hover:underline">политикой конфиденциальности</Link> и обработкой персональных данных.
              </span>
            </label>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-white text-black font-bold uppercase tracking-wider py-4 rounded-md hover:bg-gray-200 transition-all duration-300 mt-2 flex justify-center items-center h-[56px] disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_25px_rgba(255,255,255,0.1)]"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Создать аккаунт"}
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-[var(--text-subdued)]">
            Уже есть аккаунт? <Link href="/login" className="text-white hover:underline transition-all">Войти</Link>
          </div>
        </div>
      </div>
    </div>
  );
}