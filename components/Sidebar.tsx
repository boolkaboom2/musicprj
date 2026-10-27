import Link from "next/link";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import UserProfileClient from "./UserProfileClient";

async function UserProfile() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const payload = token ? await verifyToken(token) : null;
  
  let user = null;
  if (payload) {
    // Приводим тип к any, чтобы TS не ругался
    user = await prisma.user.findUnique({ where: { id: payload.userId } }) as any;
  }

  return <UserProfileClient user={user} />;
}

async function AdminLink() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const payload = token ? await verifyToken(token) : null;

  if (payload?.role === "ADMIN") {
    return (
      <Link href="/admin" className="text-[var(--text-subdued)] hover:text-white transition font-medium text-sm tracking-wide mt-4 pt-4 border-t border-[#333]">
        Админ-панель
      </Link>
    );
  }
  return null;
}

export default function Sidebar() {
  return (
    <aside className="w-[280px] bg-[#121212] rounded-lg flex flex-col p-6 shrink-0 justify-between h-full">
      <div>
        <Link href="/" className="text-2xl font-black uppercase tracking-tighter text-white">
          Sadovod
        </Link>
        
        <nav className="flex flex-col gap-4 mt-8">
          <Link href="/" className="text-[var(--text-subdued)] hover:text-white transition font-medium text-sm tracking-wide">
            Главная
          </Link>
          <Link href="/search" className="text-[var(--text-subdued)] hover:text-white transition font-medium text-sm tracking-wide">
            Поиск
          </Link>
          <Link href="/library" className="text-[var(--text-subdued)] hover:text-white transition font-medium text-sm tracking-wide">
            Моя медиатека
          </Link>
          
          <Suspense fallback={null}>
            <AdminLink />
          </Suspense>
        </nav>
      </div>

      <div className="border-t border-[#333] pt-4">
        <Suspense fallback={<div className="h-10 bg-white/5 animate-pulse rounded-md"></div>}>
          <UserProfile />
        </Suspense>
      </div>
    </aside>
  );
}