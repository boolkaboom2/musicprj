import { Suspense } from "react";
import SearchClient from "@/components/SearchClient";

export default function SearchPage() {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-8 pb-0">
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-6">
          Поиск
        </h1>
      </div>
      <Suspense fallback={<div className="p-8 text-[var(--text-subdued)]">Загрузка...</div>}>
        <SearchClient />
      </Suspense>
    </div>
  );
}