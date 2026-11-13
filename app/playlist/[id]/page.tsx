import { Suspense } from "react";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PlaylistPrivacyToggle from "@/components/PlaylistPrivacyToggle";
import PlaylistCoverUploader from "@/components/PlaylistCoverUploader";
import PlaylistTrackList from "./PlaylistTrackList";
import EditablePlaylistTitle from "./EditablePlaylistTitle";
import DeletePlaylistButton from "@/components/DeletePlaylistButton";
import SharePlaylistButton from "@/components/SharePlaylistButton";
import Loader from "@/components/Loader";

export default function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="flex flex-col h-full w-full">
      <Suspense fallback={<Loader />}>
        <PlaylistContent paramsPromise={params} />
      </Suspense>
    </div>
  );
}

async function PlaylistContent({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const payload = token ? await verifyToken(token) : null;

  const playlist = await prisma.playlist.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: {
        include: { track: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!playlist) notFound();

  const isOwner = payload?.userId === playlist.userId;
  const isAdmin = payload?.role === 'ADMIN';

  if (!playlist.isPublic && !isOwner && !isAdmin) notFound();

  let userLikes: string[] = [];
  if (payload?.userId) {
    const likes = await prisma.like.findMany({
      where: { userId: payload.userId },
      select: { trackId: true },
    });
    userLikes = likes.map(like => like.trackId);
  }

  const tracks = playlist.items.map((item) => item.track);
  const ownerName = playlist.user.name || playlist.user.email.split('@')[0];

  return (
    <div className="flex flex-col h-full w-full max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-8 p-4 md:p-8 bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-main)] pb-8 md:pb-12 transition-colors duration-300">
        
        {isOwner ? (
          <div className="self-start md:self-end shrink-0">
            <PlaylistCoverUploader playlistId={playlist.id} coverUrl={playlist.coverUrl} />
          </div>
        ) : (
          // УВЕЛИЧИЛИ ОБЛОЖКУ
          <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 xl:w-72 xl:h-72 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-2xl shrink-0 overflow-hidden flex items-center justify-center self-start md:self-end">
            {playlist.coverUrl ? (
              <img 
                src={playlist.coverUrl.startsWith('http') || playlist.coverUrl.startsWith('/') ? playlist.coverUrl : `/api/stream/${playlist.coverUrl}`} 
                alt="cover" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <span className="text-[var(--text-subdued)] text-5xl">♪</span>
            )}
          </div>
        )}
        
        <div className="flex flex-col gap-3 md:gap-4 min-w-0 flex-1">
          <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-[var(--text-subdued)]">
            {playlist.isPublic ? "Публичный плейлист" : "Приватный плейлист"}
          </span>
          
          <EditablePlaylistTitle playlistId={playlist.id} initialTitle={playlist.title} isOwner={isOwner} />

          {/* УВЕЛИЧИЛИ ТЕКСТ */}
          <p className="text-[var(--text-subdued)] text-sm md:text-base lg:text-lg break-words">
            {ownerName} • {tracks.length} треков
          </p>
          
          <div className="flex flex-wrap gap-3 mt-2">
            {isOwner && <PlaylistPrivacyToggle playlistId={playlist.id} isPublic={playlist.isPublic} />}
            <SharePlaylistButton playlistId={playlist.id} />
            {isOwner && <DeletePlaylistButton playlistId={playlist.id} />}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {tracks.length === 0 ? (
          <p className="p-4 md:p-8 text-[var(--text-subdued)] text-lg">В этом плейлисте пока нет треков.</p>
        ) : (
          <PlaylistTrackList initialTracks={tracks} userLikes={userLikes} playlistId={playlist.id} isOwner={isOwner} />
        )}
      </div>
    </div>
  );
}