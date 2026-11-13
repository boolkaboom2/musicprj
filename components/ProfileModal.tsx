"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, User as UserIcon, Image as ImageIcon, Lock, Sparkles, Sun, Moon, LayoutTemplate, Download } from "lucide-react";
import { useToast } from "./Toast";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import AvatarEffect from "./AvatarEffect";
import { useThemeStore } from "@/store/themeStore";
import { useUIStore } from "@/store/uiStore";

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
  
  const { theme, toggleTheme } = useThemeStore();
  const { isAnimatedBgEnabled, toggleAnimatedBg } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    useThemeStore.getState().hydrate();
    setMounted(true);
  }, []);

  const [name, setName] = useState(currentUser.name || "");
  const [bio, setBio] = useState(currentUser.bio || "");
  const [telegram, setTelegram] = useState(currentUser.telegram || "");
  const [phone, setPhone] = useState(currentUser.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || "");
  const [bannerUrl, setBannerUrl] = useState(currentUser.bannerUrl || "");
  const [avatarEffect, setAvatarEffect] = useState(currentUser.avatarEffect || "none");

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
    if (!currentPassword) { showToast("Введите текущий пароль", "error"); return; }
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

  const handleInstallClick = async () => {
    const prompt = (window as any).deferredPrompt;
    if (prompt) {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        (window as any).deferredPrompt = null;
        showToast("Приложение установлено!", "success");
      }
    } else {
      showToast("Установка недоступна. Возможно, приложение уже установлено или ваш браузер не поддерживает PWA.", "info");
    }
  };

  if (typeof document === 'undefined') return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          {/* УВЕЛИЧЕНА ШИРИНА МОДАЛКИ НА 3XL */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-[var(--bg-card)] w-full max-w-lg 3xl:max-w-2xl rounded-2xl shadow-2xl border border-[var(--border-color)] flex flex-col max-h-[90vh] overflow-hidden transition-colors"
          >
            <div className="flex justify-between items-center p-6 3xl:p-8 border-b border-[var(--border-color)] shrink-0">
              <h2 className="text-xl 3xl:text-2xl font-bold text-[var(--text-base)]">Настройки профиля</h2>
              <button onClick={onClose} className="text-[var(--text-subdued)] hover:text-[var(--text-base)] transition bg-[var(--bg-main)] p-2 rounded-full"><X size={18} className="3xl:w-6 3xl:h-6" /></button>
            </div>

            <div className="flex px-6 pt-4 shrink-0 gap-6 border-b border-[var(--border-color)] relative">
              <button onClick={() => setActiveTab("visual")} className={`pb-3 text-sm 3xl:text-base font-bold transition-colors relative ${activeTab === "visual" ? "text-[var(--text-base)]" : "text-[var(--text-subdued)] hover:text-[var(--text-base)]"}`}>
                Профиль
                {activeTab === "visual" && <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--text-base)]" />}
              </button>
              <button onClick={() => setActiveTab("security")} className={`pb-3 text-sm 3xl:text-base font-bold transition-colors relative ${activeTab === "security" ? "text-[var(--text-base)]" : "text-[var(--text-subdued)] hover:text-[var(--text-base)]"}`}>
                Безопасность
                {activeTab === "security" && <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--text-base)]" />}
              </button>
            </div>

            <div className="p-6 3xl:p-8 overflow-y-auto custom-scrollbar flex-1 relative">
              <AnimatePresence mode="wait">
                {activeTab === "visual" && (
                  <motion.div key="visual" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="flex flex-col gap-6">
                    <div className="relative w-full h-32 3xl:h-48 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl overflow-hidden group cursor-pointer shrink-0" onClick={() => bannerInputRef.current?.click()}>
                      {bannerUrl ? <img src={getDisplaySrc(bannerUrl)!} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[var(--text-subdued)]"><ImageIcon size={32} /></div>}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><span className="text-white text-xs 3xl:text-sm font-bold">Изменить баннер</span></div>
                      <input type="file" accept="image/*" className="hidden" ref={bannerInputRef} onChange={(e) => handleFileUpload(e, "banner")} />
                    </div>
                    <div className="flex gap-4 items-center -mt-14 3xl:-mt-20 mb-4 px-4 relative z-10">
                      <div className="w-24 h-24 3xl:w-32 3xl:h-32 shrink-0 relative" onClick={() => avatarInputRef.current?.click()}>
                        <AvatarEffect effect={avatarEffect}>
                          <div className="w-full h-full rounded-full bg-[var(--bg-main)] border-4 border-[var(--bg-card)] overflow-hidden relative group cursor-pointer shadow-xl">
                            {avatarUrl ? <img src={getDisplaySrc(avatarUrl)!} className="w-full h-full object-cover absolute inset-0" /> : <div className="w-full h-full flex items-center justify-center text-[var(--text-subdued)]"><UserIcon size={40} /></div>}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><span className="text-white text-[10px] font-bold">Загрузить</span></div>
                          </div>
                        </AvatarEffect>
                        <input type="file" accept="image/*" className="hidden" ref={avatarInputRef} onChange={(e) => handleFileUpload(e, "avatar")} />
                      </div>
                      {isUploading && <span className="text-xs text-[var(--text-subdued)] animate-pulse">Загрузка...</span>}
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between bg-[var(--bg-main)] border border-[var(--border-color)] p-4 rounded-xl">
                        <div className="flex items-center gap-2">
                          {mounted && (theme === 'dark' ? <Moon size={20} className="text-[var(--text-base)]" /> : <Sun size={20} className="text-[var(--text-base)]" />)}
                          <span className="text-sm 3xl:text-base font-bold text-[var(--text-base)]">Тёмная тема</span>
                        </div>
                        <button onClick={toggleTheme} className={`w-12 h-6 3xl:w-14 3xl:h-7 rounded-full transition-colors relative flex items-center ${mounted && theme === 'dark' ? 'bg-green-500' : 'bg-[var(--border-color)]'}`}>
                          <div className={`w-4 h-4 3xl:w-5 3xl:h-5 bg-white rounded-full absolute transition-transform ${mounted && theme === 'dark' ? 'translate-x-7 3xl:translate-x-8' : 'translate-x-1'}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between bg-[var(--bg-main)] border border-[var(--border-color)] p-4 rounded-xl">
                        <div className="flex items-center gap-2">
                          <LayoutTemplate size={20} className="text-[var(--text-base)]" />
                          <span className="text-sm 3xl:text-base font-bold text-[var(--text-base)]">Нейросеть на фоне</span>
                        </div>
                        <button onClick={toggleAnimatedBg} className={`w-12 h-6 3xl:w-14 3xl:h-7 rounded-full transition-colors relative flex items-center ${isAnimatedBgEnabled ? 'bg-green-500' : 'bg-[var(--border-color)]'}`}>
                          <div className={`w-4 h-4 3xl:w-5 3xl:h-5 bg-white rounded-full absolute transition-transform ${isAnimatedBgEnabled ? 'translate-x-7 3xl:translate-x-8' : 'translate-x-1'}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between bg-[var(--bg-main)] border border-[var(--border-color)] p-4 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Download size={20} className="text-[var(--text-base)]" />
                          <span className="text-sm 3xl:text-base font-bold text-[var(--text-base)]">Установить приложение</span>
                        </div>
                        <button onClick={handleInstallClick} className="bg-[var(--text-base)] text-[var(--bg-main)] text-xs 3xl:text-sm font-bold px-3 3xl:px-4 py-1.5 3xl:py-2 rounded-md hover:opacity-80 transition">
                          Установить
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs 3xl:text-sm text-[var(--text-subdued)] font-bold mb-2 flex items-center gap-1 block"><Sparkles size={12}/> Эффект вокруг аватара</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'none', label: 'Без эффекта' },
                          { id: 'pulse', label: 'Пульсация' },
                          { id: 'neon', label: 'Неон' },
                          { id: 'gradient', label: 'Градиент' },
                        ].map(eff => (
                          <button key={eff.id} onClick={() => setAvatarEffect(eff.id)} className={`py-2 px-3 rounded-lg text-xs 3xl:text-sm font-bold transition border ${avatarEffect === eff.id ? 'bg-[var(--text-base)] text-[var(--bg-main)] border-[var(--text-base)]' : 'bg-[var(--bg-main)] text-[var(--text-subdued)] border-[var(--border-color)] hover:text-[var(--text-base)]'}`}>
                            {eff.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 mt-2">
                      <div>
                        <label className="text-xs 3xl:text-sm text-[var(--text-subdued)] font-bold mb-1 block">Имя</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-[var(--bg-input)] text-[var(--text-base)] p-3 3xl:p-4 rounded-lg outline-none border border-[var(--border-color)] focus:border-[var(--text-subdued)] transition text-sm 3xl:text-base" placeholder="Ваше имя" />
                      </div>
                      <div>
                        <label className="text-xs 3xl:text-sm text-[var(--text-subdued)] font-bold mb-1 block">О себе</label>
                        <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="w-full bg-[var(--bg-input)] text-[var(--text-base)] p-3 3xl:p-4 rounded-lg outline-none border border-[var(--border-color)] focus:border-[var(--text-subdued)] transition resize-none custom-scrollbar text-sm 3xl:text-base" placeholder="Расскажите о себе..." />
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="text-xs 3xl:text-sm text-[var(--text-subdued)] font-bold mb-1 block">Telegram (опц.)</label>
                          <input type="text" value={telegram} onChange={e => setTelegram(e.target.value)} className="w-full bg-[var(--bg-input)] text-[var(--text-base)] p-3 3xl:p-4 rounded-lg outline-none border border-[var(--border-color)] focus:border-[var(--text-subdued)] transition text-sm 3xl:text-base" placeholder="username" />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs 3xl:text-sm text-[var(--text-subdued)] font-bold mb-1 block">Телефон (опц.)</label>
                          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-[var(--bg-input)] text-[var(--text-base)] p-3 3xl:p-4 rounded-lg outline-none border border-[var(--border-color)] focus:border-[var(--text-subdued)] transition text-sm 3xl:text-base" placeholder="+7 (999) 000-00-00" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "security" && (
                  <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="flex flex-col gap-6">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl text-yellow-600 dark:text-yellow-500 text-xs 3xl:text-sm leading-relaxed transition-colors">
                      Внимание! Для изменения email или пароля вам нужно подтвердить действие вашим текущим паролем.
                    </div>
                    <div>
                      <label className="text-xs 3xl:text-sm text-[var(--text-subdued)] font-bold mb-1 block">Новый Email</label>
                      <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full bg-[var(--bg-input)] text-[var(--text-base)] p-3 3xl:p-4 rounded-lg outline-none border border-[var(--border-color)] focus:border-[var(--text-subdued)] transition text-sm 3xl:text-base" placeholder={currentUser.email} />
                    </div>
                    <div className="h-px bg-[var(--border-color)]" />
                    <div>
                      <label className="text-xs 3xl:text-sm text-[var(--text-subdued)] font-bold mb-1 block">Новый Пароль</label>
                      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-[var(--bg-input)] text-[var(--text-base)] p-3 3xl:p-4 rounded-lg outline-none border border-[var(--border-color)] focus:border-[var(--text-subdued)] transition text-sm 3xl:text-base" placeholder="••••••••" />
                    </div>
                    <div>
                      <label className="text-xs 3xl:text-sm text-yellow-500 font-bold mb-1 block flex items-center gap-1"><Lock size={12}/> Текущий пароль</label>
                      <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full bg-[var(--bg-input)] text-[var(--text-base)] p-3 3xl:p-4 rounded-lg outline-none border border-yellow-500/50 focus:border-yellow-500 transition text-sm 3xl:text-base" placeholder="Введите текущий пароль" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-6 3xl:p-8 border-t border-[var(--border-color)] shrink-0">
              {activeTab === "visual" ? (
                <button onClick={handleSaveVisual} disabled={isSaving || isUploading} className="w-full bg-[var(--text-base)] text-[var(--bg-main)] font-bold py-3 3xl:py-4 rounded-lg hover:opacity-80 transition flex justify-center items-center text-sm 3xl:text-base">
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : "Сохранить профиль"}
                </button>
              ) : (
                <button onClick={handleSaveSecurity} disabled={isSaving} className="w-full bg-[var(--text-base)] text-[var(--bg-main)] font-bold py-3 3xl:py-4 rounded-lg hover:opacity-80 transition flex justify-center items-center text-sm 3xl:text-base">
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : "Обновить безопасность"}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}