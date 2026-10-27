import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-[#121212]">
      <h1 className="text-[15vw] font-black text-white leading-none tracking-tighter">
        404
      </h1>
      <p className="text-[var(--text-subdued)] font-mono uppercase tracking-widest mt-4 mb-8">
        Track not found
      </p>
      <Link 
        href="/" 
        className="border border-white text-white px-8 py-3 rounded-full font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors"
      >
        Вернуться на главную
      </Link>
    </div>
  );
}