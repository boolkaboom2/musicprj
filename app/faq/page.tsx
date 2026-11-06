"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";

const FAQ_DATA = [
  {
    q: "Что такое SADOVOD?",
    a: "Это учебный музыкальный стриминговый сервис, созданный как проект для защиты в колледже. Он не является коммерческим продуктом и не предназначен для массового использования."
  },
  {
    q: "Почему я не могу зарегистрироваться без инвайт-кода?",
    a: "Сайт использует закрытую систему регистрации, чтобы избежать проблем с Роскомнадзором и правообладателями. Код доступа можно получить только у администратора проекта."
  },
  {
    q: "Откуда берется музыка?",
    a: "Аудио загружается из открытых источников в интернете и хранится в нашем Telegram-боте. Все права на аудиозаписи принадлежат их законным правообладателям. Использование исключительно в ознакомительных целях."
  },
  {
    q: "Почему некоторые треки (спед-апы, редкий андеграунд) не находятся?",
    a: "Наш сервер находится в России, и мы используем доступные открытые базы. Треки, которые есть только на заблокированных платформах (например, YouTube или SoundCloud), недоступны для прямого скачивания."
  },
  {
    q: "Почему импорт плейлиста идет так долго?",
    a: "Скачивание идет в фоновом режиме, чтобы не перегружать сервер. Мы качаем треки по одному с паузами, чтобы базы данных не заблокировали нас за спам. Вы можете закрыть вкладку — процесс не прервется."
  },
  {
    q: "Что такое PREMIUM-подписка и как ее получить?",
    a: "Это учебная имитация платной подписки (в будущем планируется безлимитный импорт и свои обложки). Сейчас она выдается администратором вручную в панели управления."
  },
  {
    q: "Почему имя сайта выглядит так странно (178.236.242.110.nip.io)?",
    a: "Для работы HTTPS (защищенного соединения) и API нам нужен домен. Вместо покупки реального домена мы используем бесплатный сервис nip.io, который привязывает IP нашего сервера к адресу."
  },
  {
    q: "Как работает 'Моя волна'?",
    a: "Алгоритм анализирует текущий трек и сначала предлагает другие песни этого же артиста, затем похожие по жанру, а потом — треки, которые слушали другие пользователи с похожими вкусами."
  },
  {
    q: "Что делать, если трек не добавляется в плейлист?",
    a: "Скорее всего, он уже там есть или произошел сбой сети. Обновите страницу. Если ошибка повторяется — напишите в раздел 'Обратная связь'."
  },
  {
    q: "Будет ли мобильное приложение?",
    a: "Сайт уже поддерживает PWA (Progressive Web App). Вы можете установить его на рабочий стол телефона (через меню браузера 'Добавить на главный экран'), и оно будет работать как нативное приложение."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-3xl mx-auto text-[var(--text-base)] min-h-full">
        <Link href="/" className="text-[var(--text-subdued)] hover:text-[var(--text-base)] flex items-center gap-2 mb-8 transition">
          <ArrowLeft size={18} /> На главную
        </Link>
        
        <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight text-[var(--text-base)]">Часто задаваемые вопросы</h1>
        <p className="text-[var(--text-subdued)] text-sm mb-8">Ответы на самые популярные вопросы о SADOVOD.</p>

        <div className="flex flex-col gap-3">
          {FAQ_DATA.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-4 md:p-6 text-left"
                >
                  <span className="font-bold text-sm md:text-base pr-4 text-[var(--text-base)]">{item.q}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0 text-[var(--text-subdued)]"
                  >
                    <ChevronDown size={20} />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="px-4 md:px-6 pb-4 md:pb-6 text-sm text-[var(--text-subdued)] leading-relaxed border-t border-[var(--border-color)] pt-4 mt-2">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </PageTransition>
  );
}