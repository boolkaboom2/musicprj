"use client";

import { useState } from "react";
import { Loader2, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export default function ImportPage() {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleImport = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    setResults([]);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textList: text }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setResults(data.results);
        setText(""); // Очищаем поле
      } else {
        alert(data.error || "Ошибка импорта");
      }
    } catch (error) {
      alert("Ошибка сети");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link href="/admin" className="text-[var(--text-subdued)] hover:text-white flex items-center gap-2 mb-6 transition">
        <ArrowLeft size={18} /> Назад в админку
      </Link>
      
      <h1 className="text-3xl font-black text-white mb-2">Массовый импорт</h1>
      <p className="text-[var(--text-subdued)] mb-6 text-sm">
        Вставьте список треков (каждый с новой строки) в формате "Исполнитель - Название".
        Скрипт сам найдет обложки и скачает аудио. <br/>
        <span className="text-red-400">Важно: скачивание идет с открытых источников, процесс занимает время.</span>
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isLoading}
        placeholder={`Кино - Звезда по имени Солнце\nMiyagi - Captain\nБаста - Сансара`}
        className="w-full h-40 bg-[#1a1a1a] text-white p-4 rounded-xl outline-none focus:ring-2 focus:ring-white/20 border border-transparent transition-all resize-none mb-4 custom-scrollbar"
      />

      <button
        onClick={handleImport}
        disabled={isLoading}
        className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="animate-spin" size={20} /> : null}
        {isLoading ? "Скачиваем и добавляем (не закрывайте страницу)..." : "Начать импорт"}
      </button>

      {results.length > 0 && (
        <div className="mt-8 flex flex-col gap-2">
          <h2 className="text-white font-bold mb-2">Результаты:</h2>
          {results.map((r, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${r.success ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
              {r.success ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              <span className="text-sm font-medium">{r.success ? `Добавлен: ${r.title}` : `Ошибка: ${r.line}`}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}