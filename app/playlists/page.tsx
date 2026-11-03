import { Suspense } from "react";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import PlaylistsClient from "./client";

export default function PublicPlaylistsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white flex items-center gap-2">Загрузка плейлистов...</div>}>
      <PlaylistsData />
    </Suspense>
  );
}

async function PlaylistsData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload?.userId) {
    redirect("/login");
  }

  return <PlaylistsClient />;
}