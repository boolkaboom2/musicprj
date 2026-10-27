"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/store/playerStore";

export default function UserLikesInit({ initialLikes }: { initialLikes: string[] }) {
  const setLikedTrackIds = usePlayerStore((state) => state.setLikedTrackIds);

  useEffect(() => {
    setLikedTrackIds(initialLikes);
  }, [initialLikes, setLikedTrackIds]);

  return null;
}