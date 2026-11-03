"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FAQ_DATA = [
  {
    q: "Что такое SADOVOD?",
    a: "SADOVOD — это учебный стриминговый сервис, разработанный как дипломный проект. Он позволяет слушать музыку, создавать плейлисты, ставить лайки и закреплять треки. Проект не является коммерческим и создан исключительно в образовательных целях."
  },
  {
    q: "Как установить приложение на компьютер (Windows / Mac)?",
    a: "Откройте сайт в Google Chrome или Microsoft Edge. В левом меню (сайдбаре) нажмите кнопку 'Установить приложение' (или найдите значок установки в правой части адресной строки браузера). После установки SADOVOD появится на рабочем столе как отдельная программа."
  },
  {
    q: "Как установить приложение на телефон (Android / iOS)?",
    a: "На Android: откройте сайт в Chrome, нажмите три точки в правом верхнем углу и выберите 'Установить приложение'. На iPhone (iOS): откройте сайт строго в Safari, нажмите кнопку 'Поделиться' (квадрат со стрелкой вверх) и выберите 'На экран «Домой»'. Приложение появится на главном экране."
  },
  {
    q: "Почему имя сайта такое странное (https://178.236.242.110.nip.io/)?",
    a: "Это учебный проект. Для работы SSL-сертификата (HTTPS) и интеграций с внешними API нам нужен домен. Покупать настоящий домен ради теста не имеет смысла, поэтому мы используем бесплатный сервис nip.io, который автоматически привязывает IP сервера к домену."
  },
  {
    q: "Почему что-то может не загружаться или грузиться долго?",
    a: "Сайт использует бесплатный тариф базы данных Neon.tech. Если ее не трогать 5-10 минут, она 'засыпает'. Первый запрос после сна может занять 3-5 секунд. Также возможны кратковременные сбои при скачивании музыки."
  },
  {
    q: "Безопасно ли это приложение? Оно не следит за мной?",
    a: "Абсолютно безопасно. Это Progressive Web App (PWA). Оно не имеет доступа к вашей камере, микрофону, контактам или геолокации. Все данные (email, пароль) передаются по защищенному HTTPS-соединению и хранятся в зашифрованном виде."
  },
  {
    q: "Откуда берется музыка?",
    a: "Аудио берется из открытых источников. Сайт не является коммерческим сервисом. Все права на аудиозаписи принадлежат их законным правообладателям. Использование исключительно в ознакомительных целях."
  },
  {
    q: "Как получить инвайт-код для регистрации?",
    a: "Доступ к сайту закрыт, чтобы избежать проблем с Роскомнадзором и правообладателями. Код можно получить только у администратора проекта. Регистрация без кода невозможна."
  },
  {
    q: "Что такое эффекты вокруг аватара?",
    a: "Это визуальные фичи для кастомизации вашего профиля. Вы можете выбрать 'Пульсацию', 'Неон' или 'Градиент' в настройках профиля. Эффект будет виден на вашей странице и в мини-профиле в левом меню."
  },
  {
    q: "Почему я не могу добавить свой трек в базу?",
    a: "На данный момент добавление треков и импорт плейлистов доступны только администраторам (для поддержания чистоты базы и обхода ограничений). Обычные пользователи могут слушать музыку, создавать плейлисты и лайкать треки."
  },
  {
    q: "Как связаться с разработчиком?",
    a: "Ссылки на мой GitHub и Telegram находятся в самом низу страницы (в футере). Пишите по любым вопросам, связанным с работой сайта."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto text-white min-h-full">
      <Link href="/" className="text-[var(--text-subdued)] hover:text-white flex items-center gap-2 mb-8 transition">
        <ArrowLeft size={18} /> На главную
      </Link>
      
      <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">Часто задаваемые вопросы</h1>
      <p className="text-[var(--text-subdued)] text-sm mb-8">Ответы на самые популярные вопросы о SADOVOD.</p>

      <div className="flex flex-col gap-3">
        {FAQ_DATA.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div 
              key={index} 
              className="bg-[#121212] border border-white/5 rounded-xl overflow-hidden transition-colors hover:border-white/10"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between p-4 md:p-6 text-left"
              >
                <span className="font-bold text-sm md:text-base pr-4">{item.q}</span>
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
                    <div className="px-4 md:px-6 pb-4 md:pb-6 text-sm text-[var(--text-subdued)] leading-relaxed border-t border-white/5 pt-4 mt-2">
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
  );
}