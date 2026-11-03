import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ListMusic, Send, Phone, Calendar } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import AvatarEffect from "@/components/AvatarEffect";

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <PageTransition>
      <div className="flex flex-col h-full w-full bg-[#121212]">
        <Suspense fallback={<div className="p-8 text-[var(--text-subdued)] animate-pulse">Загрузка профиля...</div>}>
          <UserProfileData params={params} />
        </Suspense>
      </div>
    </PageTransition>
  );
}

async function UserProfileData({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      bannerUrl: true,
      bio: true,
      telegram: true,
      phone: true,
      avatarEffect: true,
      createdAt: true,
      playlists: {
        where: { isPublic: true },
        include: { _count: { select: { items: true } } },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!user) notFound();

  const avatarUrlString = user.avatarUrl as string | null;
  const bannerUrlString = user.bannerUrl as string | null;
  const telegramString = user.telegram as string | null;

  const avatarSrc = avatarUrlString 
    ? (avatarUrlString.startsWith('http') || avatarUrlString.startsWith('/') ? avatarUrlString : `/api/stream/${avatarUrlString}`)
    : null;
    
  const bannerSrc = bannerUrlString 
    ? (bannerUrlString.startsWith('http') || bannerUrlString.startsWith('/') ? bannerUrlString : `/api/stream/${bannerUrlString}`)
    : null;

  const cleanTelegram = telegramString ? telegramString.replace('@', '') : null;

  return (
    <div className="flex flex-col h-full w-full">
      
      {/* БАННЕР */}
      <div className="relative w-full h-56 md:h-72 shrink-0 bg-[#1a1a1a]">
        {bannerSrc ? (
          <img src={bannerSrc} className="absolute inset-0 w-full h-full object-cover" alt="banner" />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a]" />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent" />
        
        <div className="absolute -bottom-16 md:-bottom-20 left-0 right-0 max-w-4xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 z-20">
          
          {/* АВАТАРКА С ЭФФЕКТОМ */}
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#1a1a1a] border-4 border-[#121212] shrink-0 shadow-2xl relative z-20">
            <AvatarEffect effect={user.avatarEffect || "none"}>
              <div className="w-full h-full rounded-full overflow-hidden">
                {avatarSrc ? (
                  <img src={avatarSrc} className="w-full h-full object-cover" alt="avatar" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20 text-4xl font-black">?</div>
                )}
              </div>
            </AvatarEffect>
          </div>
          
          <div className="flex flex-col items-center md:items-start gap-2 flex-1 pb-2">
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter text-center md:text-left break-words drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
              {user.name || "Пользователь"}
            </h1>
            
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-xs text-[var(--text-subdued)] bg-black/40 md:bg-transparent px-3 py-1.5 md:p-0 rounded-lg backdrop-blur-md md:backdrop-blur-none">
              <span className="flex items-center gap-1 text-white/80 md:text-[var(--text-subdued)]"><Calendar size={14} /> С нами с {new Date(user.createdAt).getFullYear()}</span>
              
              {cleanTelegram && (
                <a href={`https://t.me/${cleanTelegram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition text-white/80 md:text-[var(--text-subdued)]">
                  <Send size={14} /> @{cleanTelegram}
                </a>
              )}

              {user.phone && (
                <span className="flex items-center gap-1 text-white/80 md:text-[var(--text-subdued)]"><Phone size={14} /> {user.phone}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* КОНТЕНТ */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto px-4 md:px-8 pt-20 md:pt-28 pb-8">
          
          {user.bio && (
            <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-2">О себе</h2>
              <p className="text-white/80 text-sm leading-relaxed max-w-2xl whitespace-pre-wrap">{user.bio}</p>
            </div>
          )}

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <ListMusic size={24} /> Публичные плейлисты
            </h2>
            
            {user.playlists.length === 0 ? (
              <p className="text-[var(--text-subdued)] text-sm">У пользователя пока нет публичных плейлистов.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {user.playlists.map(pl => {
                  const cover = pl.coverUrl
                    ? (pl.coverUrl.startsWith('http') || pl.coverUrl.startsWith('/') ? pl.coverUrl : `/api/stream/${pl.coverUrl}`)
                    : null;
                  return (
                    <Link key={pl.id} href={`/playlist/${pl.id}`} className="group flex flex-col gap-3 p-3 bg-[#0a0a0a] hover:bg-[#1a1a1a] rounded-xl transition-colors">
                      <div className="w-full aspect-square bg-[#282828] rounded-lg flex items-center justify-center relative overflow-hidden">
                        {cover ? (
                          <img src={cover} alt={pl.title} className="w-full h-full object-cover" />
                        ) : (
                          <ListMusic size={40} className="text-white/20" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-sm truncate">{pl.title}</h3>
                        <p className="text-[var(--text-subdued)] text-xs mt-0.5">{pl._count.items} треков</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}