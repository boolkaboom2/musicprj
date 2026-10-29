"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import CustomInput from "@/components/CustomInput";
import { useToast } from "@/components/Toast";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const showToast = useToast((state) => state.show);

  const handleSubmit = async () => {
    if (!email || !password || !name) {
       showToast("Заполните все поля", "error");
       return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
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
        console.log("REGISTER ERROR FROM API:", data.error);
        showToast(data.error || "Ошибка регистрации", "error");
      }
    } catch (err) {
      showToast("Ошибка сети. Попробуйте позже.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] w-full p-8">
      <div className="bg-[#121212] p-8 md:p-10 rounded-xl border border-white/5 w-full max-w-md shadow-2xl relative overflow-hidden">
        <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Регистрация</h1>
        <p className="text-[var(--text-subdued)] text-sm mb-8">Создайте аккаунт SADOVOD.</p>
        
        <div className="flex flex-col gap-4">
          <CustomInput
            type="text"
            placeholder="Ваше имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <CustomInput
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <CustomInput
            isPassword
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-white text-black font-bold py-4 rounded-md hover:bg-gray-200 transition-all duration-300 mt-2 flex justify-center items-center h-[56px] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Создать аккаунт"}
          </button>
        </div>

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
