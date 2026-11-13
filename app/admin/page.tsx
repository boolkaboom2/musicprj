"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, UploadCloud, Loader2, Music, Search, Trash2, Edit, BarChart3, Users, Link as LinkIcon, ListMusic, MessageSquarePlus, Key } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useToast } from "@/components/Toast";
import ImportPlaylistModal from "@/components/ImportPlaylistModal";
import PageTransition from "@/components/PageTransition";

const MotionLink = motion(Link);

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
  const router = useRouter();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
  
  const [directUrl, setDirectUrl] = useState("");
  const [isImportingDirect, setIsImportingDirect] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const showToast = useToast((s) => s.show);
  
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");
  const [editGenre, setEditGenre] = useState("");
  const [editYear, setEditYear] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const fetchTracks = async () => {
    try {
      const res = await fetch("/api/tracks", { cache: "no-store" });
      if (res.ok) setTracks(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTracks(); }, []);

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
        router.refresh();
      } else {
        const data = await res.json();
        showToast(data.error || "Ошибка при добавлении трека", "error");
      }
    } catch (error) {
      showToast("Ошибка сети", "error");
    }
  };

  const handleDirectImport = async () => {
    if (!directUrl.trim()) {
      showToast("Вставьте ссылку на MP3-файл", "error");
      return;
    }

    setIsImportingDirect(true);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directUrl }),
      });
      const data = await res.json();

      if (res.ok) {
        showToast(`Трек "${data.track.title}" успешно импортирован!`, "success");
        setDirectUrl("");
        fetchTracks();
        router.refresh();
      } else {
        showToast(data.error || "Ошибка импорта", "error");
      }
    } catch (error) {
      showToast("Ошибка сети при импорте", "error");
    } finally {
      setIsImportingDirect(false);
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
        router.refresh();
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
        router.refresh();
      }
    } catch (error) {
      showToast("Ошибка обновления", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleImportSuccess = (playlistId: string | null) => {
    fetchTracks();
    router.refresh();
  };

  return (
    <PageTransition>
      <div className="p-4 md:p-8 3xl:p-12 4xl:p-16 relative w-full max-w-[1600px] 3xl:max-w-[2200px] mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 md:mb-8 3xl:mb-12">
          <h1 className="text-2xl md:text-3xl 3xl:text-5xl font-black text-[var(--text-base)] tracking-tight">Админ-панель</h1>
          <div className="flex flex-wrap gap-2 3xl:gap-3">
            <MotionLink 
              href="/admin/analytics" 
              whileTap={{ scale: 0.95 }}
              className="bg-[var(--text-base)] text-[var(--bg-main)] hover:opacity-80 px-3 md:px-5 py-2 md:py-2.5 3xl:px-8 3xl:py-4 rounded-full text-xs md:text-sm 3xl:text-lg font-bold transition flex items-center gap-1.5 md:gap-2 whitespace-nowrap"
            >
              <BarChart3 size={14} className="md:w-[18px] md:h-[18px] 3xl:w-6 3xl:h-6" /> Дашборд
            </MotionLink>
            <MotionLink 
              href="/admin/users" 
              whileTap={{ scale: 0.95 }}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-main)] text-[var(--text-base)] px-3 md:px-5 py-2 md:py-2.5 3xl:px-8 3xl:py-4 rounded-full text-xs md:text-sm 3xl:text-lg font-bold transition flex items-center gap-1.5 md:gap-2 whitespace-nowrap"
            >
              <Users size={14} className="md:w-[18px] md:h-[18px] 3xl:w-6 3xl:h-6" /> Пользователи
            </MotionLink>
            <MotionLink 
              href="/admin/invites" 
              whileTap={{ scale: 0.95 }}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-main)] text-[var(--text-base)] px-3 md:px-5 py-2 md:py-2.5 3xl:px-8 3xl:py-4 rounded-full text-xs md:text-sm 3xl:text-lg font-bold transition flex items-center gap-1.5 md:gap-2 whitespace-nowrap"
            >
              <Key size={14} className="md:w-[18px] md:h-[18px] 3xl:w-6 3xl:h-6" /> Инвайты
            </MotionLink>
            <MotionLink 
              href="/admin/feedback" 
              whileTap={{ scale: 0.95 }}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-main)] text-[var(--text-base)] px-3 md:px-5 py-2 md:py-2.5 3xl:px-8 3xl:py-4 rounded-full text-xs md:text-sm 3xl:text-lg font-bold transition flex items-center gap-1.5 md:gap-2 whitespace-nowrap"
            >
              <MessageSquarePlus size={14} className="md:w-[18px] md:h-[18px] 3xl:w-6 3xl:h-6" /> Feedback
            </MotionLink>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsImportModalOpen(true)} 
              className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-main)] text-[var(--text-base)] px-3 md:px-5 py-2 md:py-2.5 3xl:px-8 3xl:py-4 rounded-full text-xs md:text-sm 3xl:text-lg font-bold transition flex items-center gap-1.5 md:gap-2 whitespace-nowrap"
            >
              <ListMusic size={14} className="md:w-[18px] md:h-[18px] 3xl:w-6 3xl:h-6" /> Импорт
            </motion.button>
            <MotionLink 
              href="/admin/import" 
              whileTap={{ scale: 0.95 }}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-main)] text-[var(--text-base)] px-3 md:px-5 py-2 md:py-2.5 3xl:px-8 3xl:py-4 rounded-full text-xs md:text-sm 3xl:text-lg font-bold transition whitespace-nowrap"
            >
              Массовый
            </MotionLink>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 3xl:gap-20">
          <div className="w-full lg:w-1/2 flex flex-col gap-8 3xl:gap-12">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 md:p-6 3xl:p-8 rounded-xl">
              <h2 className="text-xl md:text-2xl font-bold text-[var(--text-base)] mb-2 flex items-center gap-2">
                <LinkIcon size={20} className="text-green-500 3xl:w-8 3xl:h-8" /> Импорт по ссылке
              </h2>
              <p className="text-[var(--text-subdued)] text-sm 3xl:text-base mb-4">
                Вставьте прямую ссылку на MP3-файл (заканчивается на .mp3). Сервер скачает его и зальет в Telegram.
              </p>
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="https://example.com/music/track.mp3" 
                  value={directUrl} 
                  onChange={(e) => setDirectUrl(e.target.value)}
                  className="w-full bg-[var(--bg-input)] text-[var(--text-base)] p-3 3xl:p-4 rounded-md outline-none border-2 border-[var(--border-color)] focus:border-[var(--text-subdued)] transition-all text-sm 3xl:text-base"
                />
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDirectImport} 
                  disabled={isImportingDirect} 
                  className="bg-green-500 text-black font-bold px-4 md:px-6 3xl:px-8 3xl:py-4 3xl:text-lg rounded-md hover:bg-green-400 transition flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                >
                  {isImportingDirect ? <Loader2 className="animate-spin" size={18} /> : "Загрузить"}
                </motion.button>
              </div>
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-bold text-[var(--text-base)] mb-4">Ручное добавление</h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                <div className="flex gap-2 relative">
                  <input 
                    type="text" placeholder="Название трека" value={title} onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[var(--bg-input)] text-[var(--text-base)] p-3 3xl:p-4 rounded-md outline-none border-2 border-[var(--border-color)] focus:border-[var(--text-subdued)] transition-all text-sm 3xl:text-base"
                  />
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    type="button" 
                    onClick={handleSearchITunes} 
                    disabled={isSearchingITunes} 
                    className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-main)] text-[var(--text-base)] px-4 rounded-md transition flex items-center justify-center shrink-0"
                  >
                    {isSearchingITunes ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                  </motion.button>
                </div>
                <input type="text" placeholder="Исполнитель" value={artist} onChange={(e) => setArtist(e.target.value)} className="bg-[var(--bg-input)] text-[var(--text-base)] p-3 3xl:p-4 rounded-md outline-none border-2 border-[var(--border-color)] focus:border-[var(--text-subdued)] transition-all text-sm 3xl:text-base" />
                <div className="flex gap-4">
                  <input type="text" placeholder="Жанр" value={genre} onChange={(e) => setGenre(e.target.value)} className="w-2/3 bg-[var(--bg-input)] text-[var(--text-base)] p-3 3xl:p-4 rounded-md outline-none border-2 border-[var(--border-color)] focus:border-[var(--text-subdued)] transition-all text-sm 3xl:text-base" />
                  <input type="number" placeholder="Год" value={releaseYear} onChange={(e) => setReleaseYear(e.target.value)} className="w-1/3 bg-[var(--bg-input)] text-[var(--text-base)] p-3 3xl:p-4 rounded-md outline-none border-2 border-[var(--border-color)] focus:border-[var(--text-subdued)] transition-all text-sm 3xl:text-base" />
                </div>
                
                <div className="flex flex-col gap-2">
                  <input type="file" accept="audio/*" className="hidden" ref={audioInputRef} onChange={handleAudioChange} />
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    type="button" 
                    onClick={() => audioInputRef.current?.click()} 
                    disabled={isUploadingAudio} 
                    className={`flex items-center justify-between p-3 3xl:p-4 rounded-md border-2 transition-all duration-300 ${audioUrl ? "bg-green-500/10 border-green-500/50 text-green-500" : "bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-subdued)] hover:text-[var(--text-base)]"}`}
                  >
                    <span className="text-sm 3xl:text-base font-medium">{audioUrl ? `Аудио загружено (${formatTime(duration)})` : "Загрузить MP3"}</span>
                    {isUploadingAudio ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
                  </motion.button>
                </div>
                <div className="flex flex-col gap-2">
                  <input type="file" accept="image/*" className="hidden" ref={coverInputRef} onChange={handleCoverChange} />
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    type="button" 
                    onClick={() => coverInputRef.current?.click()} 
                    disabled={isUploadingCover} 
                    className={`flex items-center justify-between p-3 3xl:p-4 rounded-md border-2 transition-all duration-300 ${coverUrl ? "bg-green-500/10 border-green-500/50 text-green-500" : "bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-subdued)] hover:text-[var(--text-base)]"}`}
                  >
                    <span className="text-sm 3xl:text-base font-medium">{coverUrl ? "Обложка загружена" : "Загрузить обложку (опционально)"}</span>
                    {isUploadingCover ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
                  </motion.button>
                </div>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  type="submit" 
                  className="bg-[var(--text-base)] text-[var(--bg-main)] font-bold py-3 3xl:py-4 rounded-md hover:opacity-80 transition-colors mt-2 text-sm 3xl:text-base"
                >
                  Добавить трек
                </motion.button>
              </form>
            </div>
          </div>

          <div className="w-full lg:w-1/2">
            <h2 className="text-xl md:text-2xl font-bold text-[var(--text-base)] mb-4">Все треки ({tracks.length})</h2>
            {isLoading ? (
               <p className="text-[var(--text-subdued)] text-sm">Загрузка...</p>
            ) : (
              <ul className="flex flex-col gap-3">
                 {tracks.map(track => (
                    <li key={track.id} className="bg-[var(--bg-card)] p-3 3xl:p-4 rounded-md flex items-center justify-between border border-[var(--border-color)] group">
                      <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                        <div className="w-12 h-12 3xl:w-16 3xl:h-16 bg-[var(--bg-main)] rounded overflow-hidden shrink-0 flex items-center justify-center">
                          {track.coverUrl ? <img src={track.coverUrl.startsWith('http') ? track.coverUrl : `/api/stream/${track.coverUrl}`} alt={track.title} className="w-full h-full object-cover" /> : <Music size={20} className="text-[var(--text-subdued)]" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[var(--text-base)] font-medium truncate text-sm 3xl:text-lg">{track.title}</span>
                          <span className="text-[var(--text-subdued)] text-xs 3xl:text-base truncate">{track.artist} {track.genre ? `• ${track.genre}` : ''} {track.releaseYear ? `• ${track.releaseYear}` : ''}</span>
                        </div>
                      </div>
                      
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 shrink-0">
                        <motion.button 
                          whileTap={{ scale: 0.9 }}
                          onClick={() => openEdit(track)} 
                          className="text-[var(--text-subdued)] hover:text-[var(--text-base)] p-2 bg-[var(--bg-main)] rounded-md transition"
                        >
                          <Edit size={16} className="3xl:w-5 3xl:h-5" />
                        </motion.button>
                        <motion.button 
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setDeletingId(track.id)} 
                          className="text-red-500 hover:text-red-400 p-2 bg-red-500/10 rounded-md transition"
                        >
                          <Trash2 size={16} className="3xl:w-5 3xl:h-5" />
                        </motion.button>
                      </div>
                    </li>
                 ))}
              </ul>
            )}
          </div>
        </div>

        {editingTrack && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4">
            <div className="absolute inset-0" onClick={() => setEditingTrack(null)} />
            <div className="relative bg-[var(--bg-card)] w-full max-w-md 3xl:max-w-xl rounded-2xl p-6 3xl:p-8 shadow-2xl border border-[var(--border-color)]">
              <h2 className="text-xl 3xl:text-2xl font-bold text-[var(--text-base)] mb-4">Редактировать трек</h2>
              <form onSubmit={handleUpdate} className="flex flex-col gap-3">
                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Название" className="bg-[var(--bg-input)] text-[var(--text-base)] p-3 3xl:p-4 rounded-md outline-none border-2 border-[var(--border-color)] focus:border-[var(--text-subdued)] text-sm 3xl:text-base" />
                <input type="text" value={editArtist} onChange={e => setEditArtist(e.target.value)} placeholder="Исполнитель" className="bg-[var(--bg-input)] text-[var(--text-base)] p-3 3xl:p-4 rounded-md outline-none border-2 border-[var(--border-color)] focus:border-[var(--text-subdued)] text-sm 3xl:text-base" />
                <div className="flex gap-3">
                  <input type="text" value={editGenre} onChange={e => setEditGenre(e.target.value)} placeholder="Жанр" className="w-2/3 bg-[var(--bg-input)] text-[var(--text-base)] p-3 3xl:p-4 rounded-md outline-none border-2 border-[var(--border-color)] focus:border-[var(--text-subdued)] text-sm 3xl:text-base" />
                  <input type="number" value={editYear} onChange={e => setEditYear(e.target.value)} placeholder="Год" className="w-1/3 bg-[var(--bg-input)] text-[var(--text-base)] p-3 3xl:p-4 rounded-md outline-none border-2 border-[var(--border-color)] focus:border-[var(--text-subdued)] text-sm 3xl:text-base" />
                </div>
                <motion.button whileTap={{ scale: 0.95 }} type="submit" disabled={isUpdating} className="bg-[var(--text-base)] text-[var(--bg-main)] font-bold py-3 3xl:py-4 rounded-md hover:opacity-80 transition mt-2 flex justify-center text-sm 3xl:text-base">
                  {isUpdating ? <Loader2 className="animate-spin" size={20} /> : "Сохранить изменения"}
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={() => setEditingTrack(null)} className="text-sm text-[var(--text-subdued)] hover:text-[var(--text-base)] mt-1">Отмена</motion.button>
              </form>
            </div>
          </div>
        )}

        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4">
            <div className="absolute inset-0" onClick={() => setDeletingId(null)} />
            <div className="relative bg-[var(--bg-card)] w-full max-w-sm 3xl:max-w-md rounded-2xl p-6 3xl:p-8 shadow-2xl border border-[var(--border-color)] flex flex-col items-center text-center">
              <h2 className="text-xl 3xl:text-2xl font-bold text-[var(--text-base)] mb-2">Удалить трек?</h2>
              <p className="text-[var(--text-subdued)] text-sm 3xl:text-base mb-6">Это действие нельзя отменить.</p>
              <div className="flex gap-3 w-full">
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setDeletingId(null)} className="flex-1 bg-[var(--bg-main)] text-[var(--text-base)] font-bold py-3 3xl:py-4 rounded-md hover:opacity-80 transition disabled:opacity-50 text-sm 3xl:text-base" disabled={isDeleting}>
                  Отмена
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleDelete} className="flex-1 bg-red-500 text-white font-bold py-3 3xl:py-4 rounded-md hover:bg-red-600 transition flex justify-center items-center text-sm 3xl:text-base" disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="animate-spin" size={20} /> : "Удалить"}
                </motion.button>
              </div>
            </div>
          </div>
        )}

        <ImportPlaylistModal 
          isOpen={isImportModalOpen} 
          onClose={() => setIsImportModalOpen(false)} 
          onSuccess={handleImportSuccess}
        />
      </div>
    </PageTransition>
  );
}