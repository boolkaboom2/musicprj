import type { Metadata, Viewport } from "next";
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
import PWARegister from "@/components/PWARegister";
import InstallPWA from "@/components/InstallPWA";
import GlobalImportNotification from "@/components/GlobalImportNotification"; // <--- НОВОЕ
import MobileSwipeHandler from "@/components/MobileSwipeHandler";
import NeuralBackground from "@/components/NeuralBackground";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UserLikesInit from "@/components/UserLikesInit";
import { Suspense, ReactNode } from "react";

const manrope = Manrope({ 
  variable: "--font-manrope", 
  subsets: ["latin", "cyrillic"], 
  weight: ["400", "500", "600", "700", "800"] 
});

export const metadata: Metadata = {
  title: "SADOVOD",
  description: "Твой личный стриминговый сервис",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SADOVOD",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

async function LayoutData() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    const payload = token ? await verifyToken(token) : null;
    
    let user: any = null;
    let userLikes: string[] = [];
    let isAdmin = false;

    if (payload?.userId) {
      user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, name: true, avatarUrl: true, avatarEffect: true, role: true }
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
  } catch (e) {
    return null;
  }
}

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru" className={manrope.variable}>
      <body className="antialiased text-[var(--text-base)] h-[100dvh] flex flex-col overflow-hidden font-sans relative">
        
        <NeuralBackground />

        <Suspense fallback={null}>
          <MobileHeader />
        </Suspense>

        <div className="flex flex-1 overflow-hidden p-0 md:p-4 3xl:p-6 4xl:p-8 gap-0 md:gap-4 relative z-10 w-full">
          <Suspense fallback={null}>
            <LayoutData />
          </Suspense>
          
          <MobileSwipeHandler>
            <main className="flex-1 h-full overflow-y-auto overflow-x-hidden bg-transparent backdrop-blur-[2px] md:rounded-xl custom-scrollbar relative">
              {children}
            </main>
          </MobileSwipeHandler>
        </div>

        <Suspense fallback={null}>
          <Player />
        </Suspense>
        
        <AddToPlaylistModal />
        <TrackOptionsMenu />
        <DisableContextMenu />
        
        <Toast />
        
        {/* НОВОЕ УВЕДОМЛЕНИЕ СВЕРХУ */}
        <GlobalImportNotification />
        
        <Suspense fallback={null}>
          <VisitLogger /> 
        </Suspense>
        
        <PWARegister />
        
        <Suspense fallback={null}>
          <InstallPWA />
        </Suspense>

      </body>
    </html>
  );
}