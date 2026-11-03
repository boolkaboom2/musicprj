"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, User as UserIcon, Image as ImageIcon, Lock, Sparkles } from "lucide-react";
import { useToast } from "./Toast";
import { motion, AnimatePresence } from "framer-motion";
import AvatarEffect from "./AvatarEffect";

type User = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  telegram: string | null;
  phone: string | null;
  avatarEffect: string | null;
};

export default function ProfileModal({ 
  isOpen, onClose, currentUser 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  currentUser: User 
}) {
  const [activeTab, setActiveTab] = useState<"visual" | "security">("visual");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const showToast = useToast((s) => s.show);
  const router = useRouter();

  // Визуал
  const [name, setName] = useState(currentUser.name || "");
  const [bio, setBio] = useState(currentUser.bio || "");
  const [telegram, setTelegram] = useState(currentUser.telegram || "");
  const [phone, setPhone] = useState(currentUser.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || "");
  const [bannerUrl, setBannerUrl] = useState(currentUser.bannerUrl || "");
  const [avatarEffect, setAvatarEffect] = useState(currentUser.avatarEffect || "none");

  // Безопасность
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const getDisplaySrc = (url: string | null) => {
    if (!url) return null;
    return url.startsWith('http') || url.startsWith('/') ? url : `/api/stream/${url}`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Ошибка загрузки");
      if (type === "avatar") setAvatarUrl(uploadData.url);
      else setBannerUrl(uploadData.url);
      showToast("Файл загружен", "info");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveVisual = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, telegram, phone, avatarUrl, bannerUrl, avatarEffect }),
      });
      if (res.ok) {
        showToast("Профиль обновлен", "success");
        router.refresh();
        onClose();
      } else {
        showToast("Ошибка сохранения", "error");
      }
    } catch {
      showToast("Ошибка сети", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    if (!currentPassword) {
      showToast("Введите текущий пароль", "error");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/security", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail, newPassword, currentPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Данные обновлены", "success");
        setCurrentPassword(""); setNewEmail(""); setNewPassword("");
        router.refresh();
      } else showToast(data.error || "Ошибка", "error");
    } catch {
      showToast("Ошибка сети", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-[#121212] w-full max-w-lg rounded-2xl shadow-2xl border border-white/5 flex flex-col max-h-[90vh] overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 border-b border-white/5 shrink-0">
              <h2 className="text-xl font-bold text-white">Настройки профиля</h2>
              <button onClick={onClose} className="text-white/50 hover:text-white transition bg-white/5 p-2 rounded-full"><X size={18} /></button>
            </div>

            <div className="flex px-6 pt-4 shrink-0 gap-6 border-b border-white/5 relative">
              <button onClick={() => setActiveTab("visual")} className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === "visual" ? "text-white" : "text-[var(--text-subdued)] hover:text-white"}`}>
                Профиль
                {activeTab === "visual" && <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />}
              </button>
              <button onClick={() => setActiveTab("security")} className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === "security" ? "text-white" : "text-[var(--text-subdued)] hover:text-white"}`}>
                Безопасность
                {activeTab === "security" && <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />}
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative">
              <AnimatePresence mode="wait">
                {activeTab === "visual" && (
                  <motion.div key="visual" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="flex flex-col gap-6">
                    
                    {/* БАННЕР */}
                    <div className="relative w-full h-32 bg-[#282828] rounded-xl overflow-hidden group cursor-pointer shrink-0" onClick={() => bannerInputRef.current?.click()}>
                      {bannerUrl ? <img src={getDisplaySrc(bannerUrl)!} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/20"><ImageIcon size={32} /></div>}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><span className="text-white text-xs font-bold">Изменить баннер</span></div>
                      <input type="file" accept="image/*" className="hidden" ref={bannerInputRef} onChange={(e) => handleFileUpload(e, "banner")} />
                    </div>

                    {/* АВАТАРКА + ОТСТУП СНИЗУ, ЧТОБЫ НЕ ПЕРЕКРЫВАТЬ КНОПКИ */}
                    <div className="flex gap-4 items-center -mt-14 mb-4 px-4 relative z-10">
                      <div className="w-24 h-24 shrink-0 relative" onClick={() => avatarInputRef.current?.click()}>
                        <AvatarEffect effect={avatarEffect}>
                          <div className="w-full h-full rounded-full bg-[#1a1a1a] border-4 border-[#121212] overflow-hidden relative group cursor-pointer shadow-xl">
                            {avatarUrl ? <img src={getDisplaySrc(avatarUrl)!} className="w-full h-full object-cover absolute inset-0" /> : <div className="w-full h-full flex items-center justify-center text-white/20"><UserIcon size={40} /></div>}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><span className="text-white text-[10px] font-bold">Загрузить</span></div>
                          </div>
                        </AvatarEffect>
                        <input type="file" accept="image/*" className="hidden" ref={avatarInputRef} onChange={(e) => handleFileUpload(e, "avatar")} />
                      </div>
                      {isUploading && <span className="text-xs text-white/50 animate-pulse">Загрузка...</span>}
                    </div>

                    <div>
                      <label className="text-xs text-white/50 font-bold mb-2 flex items-center gap-1 block"><Sparkles size={12}/> Эффект вокруг аватара</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'none', label: 'Без эффекта' },
                          { id: 'pulse', label: 'Пульсация' },
                          { id: 'neon', label: 'Неон' },
                          { id: 'gradient', label: 'Градиент' },
                        ].map(eff => (
                          <button
                            key={eff.id}
                            onClick={() => setAvatarEffect(eff.id)}
                            className={`py-2 px-3 rounded-lg text-xs font-bold transition border ${avatarEffect === eff.id ? 'bg-white text-black border-white' : 'bg-white/5 text-white/70 border-transparent hover:bg-white/10'}`}
                          >
                            {eff.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 mt-2">
                      <div>
                        <label className="text-xs text-white/50 font-bold mb-1 block">Имя</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#1a1a1a] text-white p-3 rounded-lg outline-none border border-transparent focus:border-white/20 transition" placeholder="Ваше имя" />
                      </div>
                      <div>
                        <label className="text-xs text-white/50 font-bold mb-1 block">О себе</label>
                        <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="w-full bg-[#1a1a1a] text-white p-3 rounded-lg outline-none border border-transparent focus:border-white/20 transition resize-none" placeholder="Расскажите о себе..." />
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="text-xs text-white/50 font-bold mb-1 block">Telegram (опц.)</label>
                          <input type="text" value={telegram} onChange={e => setTelegram(e.target.value)} className="w-full bg-[#1a1a1a] text-white p-3 rounded-lg outline-none border border-transparent focus:border-white/20 transition" placeholder="username" />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-white/50 font-bold mb-1 block">Телефон (опц.)</label>
                          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-[#1a1a1a] text-white p-3 rounded-lg outline-none border border-transparent focus:border-white/20 transition" placeholder="+7 (999) 000-00-00" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "security" && (
                  <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="flex flex-col gap-6">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl text-yellow-500 text-xs leading-relaxed">
                      Внимание! Для изменения email или пароля вам нужно подтвердить действие вашим текущим паролем.
                    </div>
                    <div>
                      <label className="text-xs text-white/50 font-bold mb-1 block">Новый Email</label>
                      <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full bg-[#1a1a1a] text-white p-3 rounded-lg outline-none border border-transparent focus:border-white/20 transition" placeholder={currentUser.email} />
                    </div>
                    <div className="h-px bg-white/5" />
                    <div>
                      <label className="text-xs text-white/50 font-bold mb-1 block">Новый Пароль</label>
                      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-[#1a1a1a] text-white p-3 rounded-lg outline-none border border-transparent focus:border-white/20 transition" placeholder="••••••••" />
                    </div>
                    <div>
                      <label className="text-xs text-yellow-500 font-bold mb-1 block flex items-center gap-1"><Lock size={12}/> Текущий пароль</label>
                      <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full bg-[#1a1a1a] text-white p-3 rounded-lg outline-none border border-yellow-500/30 focus:border-yellow-500 transition" placeholder="Введите текущий пароль" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-6 border-t border-white/5 shrink-0">
              {activeTab === "visual" ? (
                <button onClick={handleSaveVisual} disabled={isSaving || isUploading} className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition flex justify-center items-center">
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : "Сохранить профиль"}
                </button>
              ) : (
                <button onClick={handleSaveSecurity} disabled={isSaving} className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition flex justify-center items-center">
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : "Обновить безопасность"}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}