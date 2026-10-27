import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Player from "@/components/Player";
import AddToPlaylistModal from "@/components/AddToPlaylistModal";
import TrackOptionsMenu from "@/components/TrackOptionsMenu"; 
import DisableContextMenu from "@/components/DisableContextMenu";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UserLikesInit from "@/components/UserLikesInit";
import { Suspense } from "react";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SADOVOD",
  description: "Твой личный стриминговый сервис",
};

// Компонент для получения лайков на сервере
async function LayoutData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const payload = token ? await verifyToken(token) : null;
  
  let userLikes: string[] = [];
  if (payload?.userId) {
    const likes = await prisma.like.findMany({
      where: { userId: payload.userId },
      select: { trackId: true }
    });
    userLikes = likes.map(l => l.trackId);
  }
  
  return <UserLikesInit initialLikes={userLikes} />;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white h-screen flex flex-col overflow-hidden`}>
        
        {/* Инициализация лайков в Zustand (обернута в Suspense, так как читает куки) */}
        <Suspense fallback={null}>
          <LayoutData />
        </Suspense>
        
        {/* Основная рабочая область (Сайдбар + Контент) */}
        <div className="flex flex-1 overflow-hidden p-2 gap-2">
          <Sidebar />
          
          <main className="flex-1 h-full overflow-y-auto bg-[#121212] rounded-lg custom-scrollbar relative">
            {children}
          </main>
        </div>

        {/* Нижний плеер */}
        <Player />

        {/* Глобальные модальные окна и меню */}
        <AddToPlaylistModal />
        <TrackOptionsMenu />
        
        {/* Отключение системного меню по ПКМ */}
        <DisableContextMenu />
        
      </body>
    </html>
  );
}