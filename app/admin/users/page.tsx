"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Crown, Ban, Trash2, Shield, User as UserIcon, Loader2, Search } from "lucide-react";
import { useToast } from "@/components/Toast";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  subscriptionEnd: string | null;
  createdAt: string;
  _count: {
    likes: number;
    playlists: number;
    listenHistory: number;
  };
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [grantingUser, setGrantingUser] = useState<User | null>(null);
  const [grantMonths, setGrantMonths] = useState("1");
  const showToast = useToast((s) => s.show);
  const router = useRouter();

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUsers(await res.json());
      else showToast("Ошибка загрузки пользователей", "error");
    } catch {
      showToast("Ошибка сети", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleBan = async (user: User) => {
    setActionLoading(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ban" }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.status === "BANNED" ? "Пользователь забанен" : "Пользователь разбанен", "success");
        fetchUsers();
      } else {
        showToast(data.error || "Ошибка", "error");
      }
    } catch {
      showToast("Ошибка сети", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleGrantSubscription = async () => {
    if (!grantingUser) return;
    setActionLoading(grantingUser.id);
    try {
      const res = await fetch(`/api/admin/users/${grantingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "grant_subscription", months: parseInt(grantMonths) }),
      });
      if (res.ok) {
        showToast(`Подписка на ${grantMonths} мес. выдана`, "success");
        setGrantingUser(null);
        setGrantMonths("1");
        fetchUsers();
      } else {
        const data = await res.json();
        showToast(data.error || "Ошибка", "error");
      }
    } catch {
      showToast("Ошибка сети", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeSubscription = async (user: User) => {
    setActionLoading(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke_subscription" }),
      });
      if (res.ok) {
        showToast("Подписка отозвана", "success");
        fetchUsers();
      }
    } catch {
      showToast("Ошибка сети", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setActionLoading(deletingUser.id);
    try {
      const res = await fetch(`/api/admin/users/${deletingUser.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        showToast("Пользователь удален", "success");
        setDeletingUser(null);
        fetchUsers();
      } else {
        showToast(data.error || "Ошибка", "error");
      }
    } catch {
      showToast("Ошибка сети", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isSubActive = (user: User) => {
    return user.subscriptionEnd && new Date(user.subscriptionEnd) > new Date();
  };

  return (
    <div className="p-8">
      <Link href="/admin" className="text-[var(--text-subdued)] hover:text-white flex items-center gap-2 mb-6 transition">
        <ArrowLeft size={18} /> Назад в админку
      </Link>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-white">Пользователи ({users.length})</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subdued)]" size={16} />
          <input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1a1a1a] text-white pl-9 pr-4 py-2 rounded-md outline-none text-sm border border-transparent focus:border-white/20 transition"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-white flex items-center gap-2"><Loader2 className="animate-spin" /> Загрузка...</div>
      ) : (
        <div className="bg-[#121212] border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[var(--text-subdued)] text-xs uppercase">
              <tr>
                <th className="p-4">Пользователь</th>
                <th className="p-4">Роль</th>
                <th className="p-4">Подписка</th>
                <th className="p-4">Статистика</th>
                <th className="p-4">Статус</th>
                <th className="p-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="border-t border-white/5 hover:bg-white/[0.02] transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                        <UserIcon size={18} className="text-white/50" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{user.name || "Без имени"}</p>
                        <p className="text-[var(--text-subdued)] text-xs">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
                      user.role === 'ADMIN' ? 'bg-red-500/20 text-red-500' :
                      user.role === 'PREMIUM' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-white/10 text-white/70'
                    }`}>
                      {user.role === 'ADMIN' && <Shield size={12} />}
                      {user.role === 'PREMIUM' && <Crown size={12} />}
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {isSubActive(user) ? (
                      <div>
                        <p className="text-green-500 text-xs font-bold">Активна</p>
                        <p className="text-[var(--text-subdued)] text-xs">
                          до {new Date(user.subscriptionEnd!).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    ) : (
                      <span className="text-[var(--text-subdued)] text-xs">Нет</span>
                    )}
                  </td>
                  <td className="p-4">
                    <p className="text-white/70 text-xs">
                      ♥ {user._count.likes} • 🎵 {user._count.playlists} • ▶ {user._count.listenHistory}
                    </p>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-bold ${
                      user.status === 'BANNED' ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {user.status === 'BANNED' ? 'Забанен' : 'Активен'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      {isSubActive(user) ? (
                        <button
                          onClick={() => handleRevokeSubscription(user)}
                          disabled={actionLoading === user.id}
                          className="text-yellow-500 hover:text-yellow-400 p-2 bg-yellow-500/10 rounded-md transition disabled:opacity-50"
                          title="Отозвать подписку"
                        >
                          {actionLoading === user.id ? <Loader2 size={14} className="animate-spin" /> : <Crown size={14} />}
                        </button>
                      ) : (
                        <button
                          onClick={() => setGrantingUser(user)}
                          disabled={actionLoading === user.id}
                          className="text-yellow-500 hover:text-yellow-400 p-2 bg-yellow-500/10 rounded-md transition disabled:opacity-50"
                          title="Выдать подписку"
                        >
                          <Crown size={14} />
                        </button>
                      )}
                      
                      {user.role !== 'ADMIN' && (
                        <>
                          <button
                            onClick={() => handleBan(user)}
                            disabled={actionLoading === user.id}
                            className="text-orange-500 hover:text-orange-400 p-2 bg-orange-500/10 rounded-md transition disabled:opacity-50"
                            title={user.status === 'BANNED' ? "Разбанить" : "Забанить"}
                          >
                            {actionLoading === user.id ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                          </button>
                          <button
                            onClick={() => setDeletingUser(user)}
                            disabled={actionLoading === user.id}
                            className="text-red-500 hover:text-red-400 p-2 bg-red-500/10 rounded-md transition disabled:opacity-50"
                            title="Удалить"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* МОДАЛКА ВЫДАЧИ ПОДПИСКИ */}
      {grantingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="absolute inset-0" onClick={() => setGrantingUser(null)} />
          <div className="relative bg-[#1c1c1c] w-full max-w-sm rounded-2xl p-6 border border-white/5">
            <h2 className="text-xl font-bold text-white mb-2">Выдать подписку</h2>
            <p className="text-[var(--text-subdued)] text-sm mb-4">Пользователь: {grantingUser.email}</p>
            
            <label className="text-white/70 text-sm mb-2 block">Срок (мес.)</label>
            <input
              type="number"
              min="1"
              max="24"
              value={grantMonths}
              onChange={(e) => setGrantMonths(e.target.value)}
              className="w-full bg-[#2a2a2a] text-white p-3 rounded-md outline-none focus:ring-1 focus:ring-white/30 mb-4"
            />

            <div className="flex gap-3">
              <button onClick={() => setGrantingUser(null)} className="flex-1 bg-white/10 text-white font-bold py-3 rounded-md hover:bg-white/20 transition">
                Отмена
              </button>
              <button onClick={handleGrantSubscription} disabled={actionLoading === grantingUser.id} className="flex-1 bg-yellow-500 text-black font-bold py-3 rounded-md hover:bg-yellow-400 transition flex justify-center items-center">
                {actionLoading === grantingUser.id ? <Loader2 className="animate-spin" size={18} /> : "Выдать"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА УДАЛЕНИЯ */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="absolute inset-0" onClick={() => setDeletingUser(null)} />
          <div className="relative bg-[#1c1c1c] w-full max-w-sm rounded-2xl p-6 border border-white/5 flex flex-col items-center text-center">
            <h2 className="text-xl font-bold text-white mb-2">Удалить пользователя?</h2>
            <p className="text-[var(--text-subdued)] text-sm mb-6">{deletingUser.email}</p>
            <p className="text-red-500 text-xs mb-6">Все его лайки, плейлисты и история будут удалены.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setDeletingUser(null)} className="flex-1 bg-white/10 text-white font-bold py-3 rounded-md hover:bg-white/20 transition">
                Отмена
              </button>
              <button onClick={handleDelete} disabled={actionLoading === deletingUser.id} className="flex-1 bg-red-500 text-white font-bold py-3 rounded-md hover:bg-red-600 transition flex justify-center items-center">
                {actionLoading === deletingUser.id ? <Loader2 className="animate-spin" size={18} /> : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}