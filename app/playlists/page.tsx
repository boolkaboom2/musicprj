import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import PlaylistsClient from "./client";

export default async function PublicPlaylistsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload?.userId) {
    redirect("/login");
  }

  return <PlaylistsClient />;
}
