"use client";

import { useState } from "react";
import { Loader2, ArrowLeft, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/Toast";

export default function ImportPage() {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const showToast = useToast((s) => s.show);

  const handleImport = async () => {
    if (!text.trim()) {
      showToast("Вставьте список треков", "error");
      return;
    }
    
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
        setText("");
        
        const addedCount = data.results.filter((r: any) => r.success && !r.skipped).length;
        const skippedCount = data.results.filter((r: any) => r.success && r.skipped).length;
        const failCount = data.results.filter((r: any) => !r.success).length;
        
        let msg = `Добавлено: ${addedCount}. `;
        if (skippedCount > 0) msg += `Уже было: ${skippedCount}. `;
        if (failCount > 0) msg += `Ошибок: ${failCount}.`;
        
        showToast(msg, failCount > 0 ? "error" : "success");
      } else {
        showToast(data.error || "Ошибка импорта", "error");
      }
    } catch (error) {
      showToast("Ошибка сети при импорте", "error");
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
          <h2 className="text-white font-bold mb-2">Результаты ({results.length}):</h2>
          {results.map((r, i) => {
            // Трек уже был в базе
            if (r.success && r.skipped) {
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-yellow-500/10 border-yellow-500/20 text-yellow-500">
                  <AlertCircle size={18} className="shrink-0" />
                  <span className="text-sm font-medium truncate">Уже в базе: {r.title}</span>
                </div>
              );
            }
            // Трек успешно добавлен
            if (r.success && !r.skipped) {
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-green-500/10 border-green-500/20 text-green-500">
                  <CheckCircle2 size={18} className="shrink-0" />
                  <span className="text-sm font-medium truncate">Добавлен: {r.title}</span>
                </div>
              );
            }
            // Ошибка
            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-red-500/10 border-red-500/20 text-red-500">
                <XCircle size={18} className="shrink-0" />
                <span className="text-sm font-medium truncate">Ошибка: {r.line || r.title}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}