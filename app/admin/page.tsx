"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, XCircle, UploadCloud, Loader2, Music, Search, Trash2, Edit, BarChart3, Users } from "lucide-react";
import Link from "next/link";

type Track = {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl: string | null;
  duration: number;
  genre: string | null;
  releaseYear: number | null;
};

export default function AdminPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Состояния формы
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState("");
  const [duration, setDuration] = useState(0); 
  const [releaseYear, setReleaseYear] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSearchingITunes, setIsSearchingITunes] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  
  // Состояния редактирования
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");
  const [editGenre, setEditGenre] = useState("");
  const [editYear, setEditYear] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Состояние удаления
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const fetchTracks = async () => {
    try {
      const res = await fetch("/api/tracks");
      if (res.ok) setTracks(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTracks(); }, []);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSearchITunes = async () => {
    if (!title.trim()) {
      showToast("Введите название трека", "error");
      return;
    }
    setIsSearchingITunes(true);
    try {
      const query = artist ? `${artist} ${title}` : title;
      const res = await fetch(`/api/itunes?q=${encodeURIComponent(query)}`);
      
      if (res.ok) {
        const data = await res.json();
        setArtist(data.artist);
        setGenre(data.genre);
        setDuration(data.duration);
        setCoverUrl(data.coverUrl);
        if (data.releaseYear) setReleaseYear(data.releaseYear.toString());
        showToast("Данные из iTunes подтянуты", "success");
      } else {
        showToast("Ничего не найдено в iTunes", "error");
      }
    } catch (error) {
      showToast("Ошибка поиска в iTunes", "error");
    } finally {
      setIsSearchingITunes(false);
    }
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const uploadFile = async (file: File, type: "audio" | "cover") => {
    const formData = new FormData();
    formData.append("file", file);
    if (type === "audio") setIsUploadingAudio(true);
    else setIsUploadingCover(true);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        if (type === "audio") setAudioUrl(data.url);
        else setCoverUrl(data.url);
        showToast("Файл успешно загружен", "success");
      } else {
        showToast("Ошибка при загрузке файла", "error");
      }
    } catch (error) {
      showToast("Ошибка сети при загрузке", "error");
    } finally {
      if (type === "audio") setIsUploadingAudio(false);
      else setIsUploadingCover(false);
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const audioObj = new Audio(URL.createObjectURL(file));
    audioObj.addEventListener("loadedmetadata", () => setDuration(Math.round(audioObj.duration)));
    uploadFile(file, "audio");
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, "cover");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !artist || !audioUrl) {
      showToast("Заполните название, исполнителя и загрузите аудио", "error");
      return;
    }

    try {
      const res = await fetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title, artist, audioUrl, 
          coverUrl: coverUrl || null, 
          duration, 
          genre: genre || null,
          releaseYear: releaseYear ? parseInt(releaseYear) : null
        }),
      });

      if (res.ok) {
        showToast("Трек успешно добавлен!", "success");
        setTitle(""); setArtist(""); setGenre(""); setDuration(0); setAudioUrl(""); setCoverUrl(""); setReleaseYear("");
        fetchTracks();
      } else {
        const data = await res.json();
        showToast(data.error || "Ошибка при добавлении трека", "error");
      }
    } catch (error) {
      showToast("Ошибка сети", "error");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tracks/${deletingId}`, { method: 'DELETE' });
      if (res.ok) {
        setTracks(tracks.filter(t => t.id !== deletingId));
        showToast("Трек удален", "success");
        setDeletingId(null);
      } else {
        const errorData = await res.json();
        showToast(errorData.error || "Ошибка удаления", "error");
      }
    } catch (error) {
      showToast("Ошибка сети при удалении", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const openEdit = (track: Track) => {
    setEditingTrack(track);
    setEditTitle(track.title);
    setEditArtist(track.artist);
    setEditGenre(track.genre || "");
    setEditYear(track.releaseYear ? track.releaseYear.toString() : "");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrack) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/tracks/${editingTrack.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: editTitle, 
          artist: editArtist, 
          genre: editGenre,
          releaseYear: editYear ? parseInt(editYear) : null
        }),
      });
      if (res.ok) {
        showToast("Трек обновлен", "success");
        setEditingTrack(null);
        fetchTracks();
      }
    } catch (error) {
      showToast("Ошибка обновления", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-8 relative">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-[var(--text-base)] tracking-tight">Админ-панель</h1>
        <div className="flex gap-3">
          <Link href="/admin/analytics" className="bg-white text-black hover:bg-gray-200 px-5 py-2.5 rounded-full text-sm font-bold transition flex items-center gap-2">
            <BarChart3 size={18} /> Дашборд
          </Link>
          <Link href="/admin/users" className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full text-sm font-bold transition flex items-center gap-2">
            <Users size={18} /> Пользователи
          </Link>
          <Link href="/admin/import" className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full text-sm font-bold transition">
            Массовый импорт
          </Link>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Форма добавления */}
        <div className="w-full lg:w-1/2">
          <h2 className="text-xl font-bold text-white mb-4">Добавить трек</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex gap-2 relative">
              <input 
                type="text" placeholder="Название трека" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#1a1a1a] text-white p-3 rounded-md outline-none focus:ring-1 focus:ring-white/30 border border-transparent focus:border-white/10 transition-all"
              />
              <button type="button" onClick={handleSearchITunes} disabled={isSearchingITunes} className="bg-white/10 hover:bg-white/20 text-white px-4 rounded-md transition flex items-center justify-center shrink-0">
                {isSearchingITunes ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              </button>
            </div>
            <input type="text" placeholder="Исполнитель" value={artist} onChange={(e) => setArtist(e.target.value)} className="bg-[#1a1a1a] text-white p-3 rounded-md outline-none focus:ring-1 focus:ring-white/30 border border-transparent focus:border-white/10 transition-all" />
            <div className="flex gap-4">
              <input type="text" placeholder="Жанр" value={genre} onChange={(e) => setGenre(e.target.value)} className="w-2/3 bg-[#1a1a1a] text-white p-3 rounded-md outline-none focus:ring-1 focus:ring-white/30 border border-transparent focus:border-white/10 transition-all" />
              <input type="number" placeholder="Год" value={releaseYear} onChange={(e) => setReleaseYear(e.target.value)} className="w-1/3 bg-[#1a1a1a] text-white p-3 rounded-md outline-none focus:ring-1 focus:ring-white/30 border border-transparent focus:border-white/10 transition-all" />
            </div>
            
            <div className="flex flex-col gap-2">
              <input type="file" accept="audio/*" className="hidden" ref={audioInputRef} onChange={handleAudioChange} />
              <button type="button" onClick={() => audioInputRef.current?.click()} disabled={isUploadingAudio} className={`flex items-center justify-between p-3 rounded-md border transition-all duration-300 ${audioUrl ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-[#1a1a1a] border-transparent hover:border-white/20 text-[var(--text-subdued)] hover:text-white"}`}>
                <span className="text-sm font-medium">{audioUrl ? `Аудио загружено (${formatTime(duration)})` : "Загрузить MP3"}</span>
                {isUploadingAudio ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <input type="file" accept="image/*" className="hidden" ref={coverInputRef} onChange={handleCoverChange} />
              <button type="button" onClick={() => coverInputRef.current?.click()} disabled={isUploadingCover} className={`flex items-center justify-between p-3 rounded-md border transition-all duration-300 ${coverUrl ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-[#1a1a1a] border-transparent hover:border-white/20 text-[var(--text-subdued)] hover:text-white"}`}>
                <span className="text-sm font-medium">{coverUrl ? "Обложка загружена" : "Загрузить обложку (опционально)"}</span>
                {isUploadingCover ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
              </button>
            </div>
            <button type="submit" className="bg-white text-black font-bold py-3 rounded-md hover:bg-gray-200 transition-colors mt-2">Добавить трек</button>
          </form>
        </div>

        {/* Список треков */}
        <div className="w-full lg:w-1/2">
          <h2 className="text-xl font-bold text-white mb-4">Все треки ({tracks.length})</h2>
          {isLoading ? (
             <p className="text-[var(--text-subdued)] text-sm">Загрузка...</p>
          ) : (
            <ul className="flex flex-col gap-3">
               {tracks.map(track => (
                  <li key={track.id} className="bg-[#121212] p-3 rounded-md flex items-center justify-between border border-white/5 group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#333] rounded overflow-hidden shrink-0 flex items-center justify-center">
                        {track.coverUrl ? <img src={track.coverUrl.startsWith('http') ? track.coverUrl : `/api/stream/${track.coverUrl}`} alt={track.title} className="w-full h-full object-cover" /> : <Music size={20} className="text-[#555]" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white font-medium">{track.title}</span>
                        <span className="text-[var(--text-subdued)] text-sm">{track.artist} {track.genre ? `• ${track.genre}` : ''} {track.releaseYear ? `• ${track.releaseYear}` : ''}</span>
                      </div>
                    </div>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button onClick={() => openEdit(track)} className="text-[var(--text-subdued)] hover:text-white p-2 bg-white/5 rounded-md transition">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => setDeletingId(track.id)} className="text-red-500 hover:text-red-400 p-2 bg-red-500/10 rounded-md transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
               ))}
            </ul>
          )}
        </div>
      </div>

      {/* МОДАЛКА РЕДАКТИРОВАНИЯ */}
      {editingTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4">
          <div className="absolute inset-0" onClick={() => setEditingTrack(null)} />
          <div className="relative bg-[#1c1c1c] w-full max-w-md rounded-2xl p-6 shadow-2xl border border-white/5">
            <h2 className="text-xl font-bold text-white mb-4">Редактировать трек</h2>
            <form onSubmit={handleUpdate} className="flex flex-col gap-3">
              <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Название" className="bg-[#2a2a2a] text-white p-3 rounded-md outline-none focus:ring-1 focus:ring-white/30" />
              <input type="text" value={editArtist} onChange={e => setEditArtist(e.target.value)} placeholder="Исполнитель" className="bg-[#2a2a2a] text-white p-3 rounded-md outline-none focus:ring-1 focus:ring-white/30" />
              <div className="flex gap-3">
                <input type="text" value={editGenre} onChange={e => setEditGenre(e.target.value)} placeholder="Жанр" className="w-2/3 bg-[#2a2a2a] text-white p-3 rounded-md outline-none focus:ring-1 focus:ring-white/30" />
                <input type="number" value={editYear} onChange={e => setEditYear(e.target.value)} placeholder="Год" className="w-1/3 bg-[#2a2a2a] text-white p-3 rounded-md outline-none focus:ring-1 focus:ring-white/30" />
              </div>
              <button type="submit" disabled={isUpdating} className="bg-white text-black font-bold py-3 rounded-md hover:bg-gray-200 transition mt-2 flex justify-center">
                {isUpdating ? <Loader2 className="animate-spin" size={20} /> : "Сохранить изменения"}
              </button>
              <button type="button" onClick={() => setEditingTrack(null)} className="text-sm text-[var(--text-subdued)] hover:text-white mt-1">Отмена</button>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛКА УДАЛЕНИЯ */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4">
          <div className="absolute inset-0" onClick={() => setDeletingId(null)} />
          <div className="relative bg-[#1c1c1c] w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-white/5 flex flex-col items-center text-center">
            <h2 className="text-xl font-bold text-white mb-2">Удалить трек?</h2>
            <p className="text-[var(--text-subdued)] text-sm mb-6">Это действие нельзя отменить.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setDeletingId(null)} className="flex-1 bg-white/10 text-white font-bold py-3 rounded-md hover:bg-white/20 transition disabled:opacity-50" disabled={isDeleting}>
                Отмена
              </button>
              <button onClick={handleDelete} className="flex-1 bg-red-500 text-white font-bold py-3 rounded-md hover:bg-red-600 transition flex justify-center items-center" disabled={isDeleting}>
                {isDeleting ? <Loader2 className="animate-spin" size={20} /> : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ТОСТ */}
      {toast && (
        <div className={`fixed bottom-24 right-8 flex items-center gap-3 px-6 py-4 rounded-md shadow-2xl border transition-all duration-300 animate-in slide-in-from-right-8 fade-in ${toast.type === "success" ? "bg-[#121212] border-green-500/30 text-green-500" : "bg-[#121212] border-red-500/30 text-red-500"}`}>
          {toast.type === "success" ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}
    </div>
  );
}