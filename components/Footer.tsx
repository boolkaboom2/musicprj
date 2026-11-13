import Link from "next/link";
import { Send, Code2 } from "lucide-react";

const DiscordIcon = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
  </svg>
);

const YoutubeIcon = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-[var(--bg-card)] border-t border-[var(--border-color)] mt-12 pt-12 pb-8 px-4 md:px-8 transition-colors">
      <div className="max-w-6xl mx-auto">
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          
          <div className="flex flex-col gap-4">
            <h3 className="text-[var(--text-base)] font-black text-xl uppercase tracking-tighter mb-2">SADOVOD</h3>
            <p className="text-[var(--text-subdued)] text-xs leading-relaxed max-w-[200px]">
              Учебный стриминговый сервис. Не является коммерческим продуктом.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-[var(--text-subdued)] text-xs font-bold uppercase tracking-wider mb-1">Платформа</h4>
            <Link href="/" className="text-[var(--text-base)] hover:opacity-70 text-sm transition">Главная</Link>
            <Link href="/search" className="text-[var(--text-base)] hover:opacity-70 text-sm transition">Поиск</Link>
            <Link href="/library" className="text-[var(--text-base)] hover:opacity-70 text-sm transition">Медиатека</Link>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-[var(--text-subdued)] text-xs font-bold uppercase tracking-wider mb-1">Помощь</h4>
            <Link href="/faq" className="text-[var(--text-base)] hover:opacity-70 text-sm transition">FAQ</Link>
            <Link href="/privacy" className="text-[var(--text-base)] hover:opacity-70 text-sm transition">Политика конфиденциальности</Link>
            <a href="https://github.com/boolkaboom2/musicprj" target="_blank" rel="noopener noreferrer" className="text-[var(--text-base)] hover:opacity-70 text-sm transition">Исходный код</a>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-[var(--text-subdued)] text-xs font-bold uppercase tracking-wider mb-1">Связь</h4>
            <div className="flex flex-wrap gap-3">
              <a href="https://github.com/boolkaboom2" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-full flex items-center justify-center text-[var(--text-subdued)] hover:text-[var(--text-base)] transition">
                <Code2 size={20} />
              </a>
              <a href="https://t.me/boolkaboom2" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-full flex items-center justify-center text-[var(--text-subdued)] hover:text-[var(--text-base)] transition">
                <Send size={20} />
              </a>
              <a href="https://discord.gg/b3efh2Ez4" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-full flex items-center justify-center text-[var(--text-subdued)] hover:text-[var(--text-base)] transition">
                <DiscordIcon size={20} />
              </a>
              <a href="https://www.youtube.com/@DkflUjyxfhjd" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-full flex items-center justify-center text-[var(--text-subdued)] hover:text-[var(--text-base)] transition">
                <YoutubeIcon size={20} />
              </a>
            </div>
          </div>

        </div>

        <div className="border-t border-[var(--border-color)] pt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap gap-4 text-[11px] text-[var(--text-subdued)]">
            <Link href="/privacy" className="hover:text-[var(--text-base)] transition">Legal</Link>
            <Link href="/privacy" className="hover:text-[var(--text-base)] transition">Privacy Policy</Link>
            <Link href="/faq" className="hover:text-[var(--text-base)] transition">FAQ</Link>
          </div>
          <p className="text-[11px] text-[var(--text-subdued)]">
            © 2026 SADOVOD. Все права на аудиозаписи принадлежат их правообладателям.
          </p>
        </div>

      </div>
    </footer>
  );
}