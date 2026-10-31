"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, Music, PlayCircle, Crown, Loader2 } from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then(res => res.json())
      .then(d => { setData(d); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="p-8 text-white flex items-center gap-2"><Loader2 className="animate-spin" /> Загрузка статистики...</div>;
  if (!data) return <div className="p-8 text-red-500">Ошибка загрузки данных</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-black text-white mb-8">Дашборд</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#121212] border border-white/5 p-6 rounded-xl flex items-center gap-4">
          <div className="p-4 bg-white/5 rounded-full"><Users size={24} className="text-white" /></div>
          <div>
            <p className="text-[var(--text-subdued)] text-sm">Пользователи</p>
            <p className="text-2xl font-bold text-white">{data.totalUsers}</p>
          </div>
        </div>
        <div className="bg-[#121212] border border-white/5 p-6 rounded-xl flex items-center gap-4">
          <div className="p-4 bg-white/5 rounded-full"><Music size={24} className="text-white" /></div>
          <div>
            <p className="text-[var(--text-subdued)] text-sm">Треки в базе</p>
            <p className="text-2xl font-bold text-white">{data.totalTracks}</p>
          </div>
        </div>
        <div className="bg-[#121212] border border-white/5 p-6 rounded-xl flex items-center gap-4">
          <div className="p-4 bg-white/5 rounded-full"><PlayCircle size={24} className="text-white" /></div>
          <div>
            <p className="text-[var(--text-subdued)] text-sm">Прослушивания</p>
            <p className="text-2xl font-bold text-white">{data.totalPlays}</p>
          </div>
        </div>
        <div className="bg-[#121212] border border-white/5 p-6 rounded-xl flex items-center gap-4">
          <div className="p-4 bg-white/5 rounded-full"><Crown size={24} className="text-yellow-500" /></div>
          <div>
            <p className="text-[var(--text-subdued)] text-sm">Подписки</p>
            <p className="text-2xl font-bold text-white">{data.activeSubscriptions}</p>
          </div>
        </div>
      </div>

      <div className="bg-[#121212] border border-white/5 p-6 rounded-xl">
        <h2 className="text-xl font-bold text-white mb-6">Посещения за последние 7 дней</h2>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="date" stroke="#888" tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
              <YAxis stroke="#888" tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1c1c1c', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="visits" stroke="#ffffff" strokeWidth={3} dot={{ r: 4, fill: '#000', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
