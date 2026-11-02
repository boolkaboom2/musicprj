import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import Player from "@/components/Player";
import AddToPlaylistModal from "@/components/AddToPlaylistModal";
import TrackOptionsMenu from "@/components/TrackOptionsMenu"; 
import DisableContextMenu from "@/components/DisableContextMenu";
import Toast from "@/components/Toast";
import VisitLogger from "@/components/VisitLogger";
import AutoRefresher from "@/components/AutoRefresher";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UserLikesInit from "@/components/UserLikesInit";
import { Suspense } from "react";

const manrope = Manrope({ 
  variable: "--font-manrope", 
  subsets: ["latin", "cyrillic"], 
  weight: ["400", "500", "600", "700", "800"] 
});

export const metadata: Metadata = {
  title: "SADOVOD",
  description: "Твой личный стриминговый сервис",
};

async function LayoutData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const payload = token ? await verifyToken(token) : null;
  
  let user: any = null;
  let userLikes: string[] = [];
  let isAdmin = false;

  if (payload?.userId) {
    user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, avatarUrl: true, role: true }
    });
    isAdmin = user?.role === 'ADMIN';

    const likes = await prisma.like.findMany({
      where: { userId: payload.userId },
      select: { trackId: true }
    });
    userLikes = likes.map(l => l.trackId);
  }
  
  return (
    <>
      <UserLikesInit initialLikes={userLikes} />
      <Sidebar user={user} isAdmin={isAdmin} />
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={manrope.variable}>
      <body className="antialiased bg-black text-white h-[100dvh] flex flex-col overflow-hidden font-sans">
        
        <MobileHeader />

        <div className="flex flex-1 overflow-hidden md:p-2 gap-2">
          <Suspense fallback={null}>
            <LayoutData />
          </Suspense>
          
          <main className="flex-1 h-full overflow-y-auto overflow-x-hidden bg-[#121212] md:rounded-lg custom-scrollbar relative">
            {children}
          </main>
        </div>

        <Suspense fallback={null}>
          <Player />
        </Suspense>
        
        <AddToPlaylistModal />
        <TrackOptionsMenu />
        <DisableContextMenu />
        
        <Toast />
        
        <Suspense fallback={null}>
          <VisitLogger /> 
        </Suspense>
        
        <AutoRefresher />
        
      </body>
    </html>
  );
}