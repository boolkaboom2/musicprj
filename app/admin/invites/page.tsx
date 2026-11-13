"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Key, Plus, Loader2, Copy, Check } from "lucide-react";
import { useToast } from "@/components/Toast";

type Invite = {
  id: string;
  code: string;
  usedBy: string | null;
  usedAt: string | null;
  createdAt: string;
  user: { email: string } | null;
};

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const showToast = useToast((s) => s.show);

  const fetchInvites = async () => {
    try {
      const res = await fetch("/api/admin/invites");
      if (res.ok) setInvites(await res.json());
    } catch {
      showToast("Ошибка загрузки", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchInvites(); }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/admin/invites", { method: "POST" });
      if (res.ok) {
        showToast("Код сгенерирован", "success");
        fetchInvites();
      } else {
        showToast("Ошибка генерации", "error");
      }
    } catch {
      showToast("Ошибка сети", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (code: string, id: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = code;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      setCopiedId(id);
      showToast("Код скопирован", "success");
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <Link href="/admin" className="text-[var(--text-subdued)] hover:text-[var(--text-base)] flex items-center gap-2 mb-6 transition">
        <ArrowLeft size={18} /> Назад в админку
      </Link>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[var(--text-base)] flex items-center gap-3">
            <Key size={28} /> Инвайт-коды
          </h1>
          <p className="text-[var(--text-subdued)] text-sm mt-1">
            Генерируйте коды для доступа друзей к сайту.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="bg-[var(--text-base)] text-[var(--bg-main)] font-bold py-2.5 px-6 rounded-full hover:opacity-80 transition flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
        >
          {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
          Создать код
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-[var(--text-base)]"><Loader2 className="animate-spin" size={20} /> Загрузка...</div>
      ) : invites.length === 0 ? (
        <p className="text-[var(--text-subdued)]">Кодов пока нет. Нажми "Создать код".</p>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[var(--bg-main)] text-[var(--text-subdued)] text-xs uppercase">
              <tr>
                <th className="p-4">Код</th>
                <th className="p-4">Статус</th>
                <th className="p-4">Дата создания</th>
                <th className="p-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => (
                <tr key={invite.id} className="border-t border-[var(--border-color)] hover:bg-[var(--bg-main)] transition">
                  <td className="p-4">
                    <span className={`font-mono text-lg font-bold tracking-widest ${invite.usedBy ? 'text-[var(--text-subdued)] line-through' : 'text-[var(--text-base)]'}`}>
                      {invite.code}
                    </span>
                  </td>
                  <td className="p-4">
                    {invite.usedBy ? (
                      <span className="text-red-500 text-xs font-bold bg-red-500/10 px-2 py-1 rounded">
                        Использован ({invite.user?.email})
                      </span>
                    ) : (
                      <span className="text-green-500 text-xs font-bold bg-green-500/10 px-2 py-1 rounded">
                        Активен
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-[var(--text-subdued)] text-sm">
                    {new Date(invite.createdAt).toLocaleString('ru-RU')}
                  </td>
                  <td className="p-4 text-right">
                    {!invite.usedBy && (
                      <button
                        onClick={() => handleCopy(invite.code, invite.id)}
                        className="text-[var(--text-subdued)] hover:text-[var(--text-base)] transition p-2 bg-[var(--bg-main)] rounded-md"
                        title="Скопировать"
                      >
                        {copiedId === invite.id ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}