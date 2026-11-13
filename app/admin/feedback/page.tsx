"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Bug, Lightbulb, HelpCircle, MessageSquare, Check, Trash2, Clock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/Toast";

type Feedback = {
  id: string;
  type: string;
  message: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  user: { email: string; name: string | null } | null;
};

const TYPE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  BUG: { label: 'Баг', icon: Bug, color: 'red' },
  FEATURE: { label: 'Пожелание', icon: Lightbulb, color: 'yellow' },
  QUESTION: { label: 'Вопрос', icon: HelpCircle, color: 'blue' },
  OTHER: { label: 'Другое', icon: MessageSquare, color: 'gray' },
};

const STATUS_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  NEW: { label: 'Новое', icon: Clock, color: 'blue' },
  IN_PROGRESS: { label: 'В работе', icon: Loader2, color: 'yellow' },
  RESOLVED: { label: 'Решено', icon: CheckCircle2, color: 'green' },
};

export default function FeedbackAdminPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'NEW' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const showToast = useToast((s) => s.show);

  const fetchFeedbacks = async () => {
    try {
      const res = await fetch('/api/feedback');
      if (res.ok) setFeedbacks(await res.json());
    } catch {}
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchFeedbacks(); }, []);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status } : f));
        showToast("Статус обновлён", "success");
      }
    } catch { showToast("Ошибка", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить сообщение?")) return;
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFeedbacks(prev => prev.filter(f => f.id !== id));
        showToast("Удалено", "success");
      }
    } catch { showToast("Ошибка", "error"); }
  };

  const filtered = filter === 'ALL' ? feedbacks : feedbacks.filter(f => f.status === filter);

  return (
    <div className="p-4 md:p-8">
      <Link href="/admin" className="text-[var(--text-subdued)] hover:text-[var(--text-base)] flex items-center gap-2 mb-6 transition">
        <ArrowLeft size={18} /> Назад в админку
      </Link>

      <h1 className="text-2xl md:text-3xl font-black text-[var(--text-base)] mb-6">Обратная связь</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {(['ALL', 'NEW', 'IN_PROGRESS', 'RESOLVED'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition ${
              filter === f ? 'bg-[var(--text-base)] text-[var(--bg-main)]' : 'bg-[var(--bg-card)] text-[var(--text-subdued)] border border-[var(--border-color)] hover:bg-[var(--bg-main)]'
            }`}
          >
            {f === 'ALL' ? 'Все' : STATUS_LABELS[f].label} ({f === 'ALL' ? feedbacks.length : feedbacks.filter(x => x.status === f).length})
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-[var(--text-base)]"><Loader2 className="animate-spin" size={20} /> Загрузка...</div>
      ) : filtered.length === 0 ? (
        <p className="text-[var(--text-subdued)]">Сообщений нет.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(f => {
            const typeInfo = TYPE_LABELS[f.type] || TYPE_LABELS.OTHER;
            const statusInfo = STATUS_LABELS[f.status] || STATUS_LABELS.NEW;
            const TypeIcon = typeInfo.icon;
            const StatusIcon = statusInfo.icon;
            return (
              <div key={f.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col gap-3">
                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded bg-${typeInfo.color}-500/10 text-${typeInfo.color}-400`}>
                      <TypeIcon size={12} /> {typeInfo.label}
                    </span>
                    <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded bg-${statusInfo.color}-500/10 text-${statusInfo.color}-400`}>
                      <StatusIcon size={12} /> {statusInfo.label}
                    </span>
                    <span className="text-[var(--text-subdued)] text-xs">
                      {new Date(f.createdAt).toLocaleString('ru-RU')}
                    </span>
                    {f.user && (
                      <span className="text-[var(--text-subdued)] text-xs">
                        от {f.user.name || f.user.email}
                      </span>
                    )}
                  </div>
                  <button onClick={() => handleDelete(f.id)} className="text-red-500 hover:text-red-400 p-1.5 rounded transition">
                    <Trash2 size={16} />
                  </button>
                </div>

                <p className="text-[var(--text-base)] text-sm whitespace-pre-wrap">{f.message}</p>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border-color)]">
                  <button
                    onClick={() => handleStatusChange(f.id, 'NEW')}
                    className={`text-xs px-3 py-1.5 rounded transition ${f.status === 'NEW' ? 'bg-blue-500/20 text-blue-500' : 'bg-[var(--bg-main)] text-[var(--text-subdued)] hover:bg-[var(--bg-card)]'}`}
                  >
                    Новое
                  </button>
                  <button
                    onClick={() => handleStatusChange(f.id, 'IN_PROGRESS')}
                    className={`text-xs px-3 py-1.5 rounded transition ${f.status === 'IN_PROGRESS' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-[var(--bg-main)] text-[var(--text-subdued)] hover:bg-[var(--bg-card)]'}`}
                  >
                    В работе
                  </button>
                  <button
                    onClick={() => handleStatusChange(f.id, 'RESOLVED')}
                    className={`text-xs px-3 py-1.5 rounded transition flex items-center gap-1 ${f.status === 'RESOLVED' ? 'bg-green-500/20 text-green-500' : 'bg-[var(--bg-main)] text-[var(--text-subdued)] hover:bg-[var(--bg-card)]'}`}
                  >
                    <Check size={12} /> Решено
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}