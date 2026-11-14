
# SADOVOD — Полная техническая документация и архитектура

## 1. Описание проекта
**SADOVOD** — это учебный стриминговый сервис (Fullstack-приложение), разработанный как дипломный проект. Основная цель — создать полноценную платформу для прослушивания музыки, способную работать в условиях российских реалий, где зарубежные хостинги и API подвержены блокировкам.

Проект развернут на собственном VPS и включает в себя:
- Фронтенд на Next.js 16 (App Router).
- Реляционную базу данных PostgreSQL (Prisma ORM).
- Систему аутентификации и ролей (JWT).
- Собственный плеер с Web Audio API (эквалайзер).
- Каскадную систему импорта музыки из открытых источников.
- Админ-панель с аналитикой посещений.
- Telegram-бота для парсинга плейлистов.

---

## 2. Полная архитектура файлов


.
├── app
│   ├── admin
│   │   ├── analytics
│   │   ├── feedback
│   │   ├── import
│   │   ├── invites
│   │   ├── users
│   │   └── page.tsx
│   ├── api
│   │   ├── admin (feedback, invites, save-track, users)
│   │   ├── analytics
│   │   ├── auth (admin-bypass, forgot-password, login, logout, register, reset-password, validate-invite)
│   │   ├── feedback
│   │   ├── history
│   │   ├── import
│   │   ├── import-queue (cancel, status, route.ts)
│   │   ├── itunes
│   │   ├── likes
│   │   ├── lyrics
│   │   ├── parse-playlist
│   │   ├── pins
│   │   ├── playlists ([id]/cover, [id]/reorder, [id]/tracks, add, public, route.ts)
│   │   ├── recommendations
│   │   ├── search
│   │   ├── search-external
│   │   ├── search-music
│   │   ├── stream/[fileId]
│   │   ├── tracks ([id], route.ts)
│   │   ├── upload
│   │   ├── user ([id], avatar, profile, security)
│   │   └── visit
│   ├── faq/page.tsx
│   ├── forgot-password/page.tsx
│   ├── library/page.tsx
│   ├── login/page.tsx
│   ├── playlist/[id] (EditablePlaylistTitle, PlaylistTrackList, page.tsx)
│   ├── playlists (client.tsx, page.tsx)
│   ├── privacy/page.tsx
│   ├── register/page.tsx
│   ├── reset-password/page.tsx
│   ├── search/page.tsx
│   ├── track/[id]/page.tsx
│   ├── user/[id]/page.tsx
│   ├── welcome/page.tsx
│   ├── globals.css
│   ├── icon.svg
│   ├── layout.tsx
│   ├── manifest.ts
│   ├── not-found.tsx
│   └── page.tsx
├── components
│   ├── AddToPlaylistModal.tsx
│   ├── AdminLoginModal.tsx
│   ├── AuthThemeToggle.tsx
│   ├── AvatarEffect.tsx
│   ├── CarouselSlider.tsx
│   ├── CreatePlaylistButton.tsx
│   ├── CubeSlider.tsx
│   ├── CustomInput.tsx
│   ├── DeletePlaylistButton.tsx
│   ├── DisableContextMenu.tsx
│   ├── FeedbackButton.tsx
│   ├── FeedbackModal.tsx
│   ├── Footer.tsx
│   ├── GlobalImportNotification.tsx
│   ├── GlobalImportStatus.tsx
│   ├── HomePageClient.tsx
│   ├── HomeSearch.tsx
│   ├── Icons.tsx
│   ├── ImportPlaylistButton.tsx
│   ├── ImportPlaylistModal.tsx
│   ├── InfoTooltip.tsx
│   ├── InstallPWA.tsx
│   ├── InviteModal.tsx
│   ├── LikeButton.tsx
│   ├── Loader.tsx
│   ├── LyricsViewer.tsx
│   ├── MobileHeader.tsx
│   ├── MobileSwipeHandler.tsx
│   ├── NeuralBackground.tsx
│   ├── PageTransition.tsx
│   ├── PlayButton.tsx
│   ├── Player.tsx
│   ├── PlayerLikeButton.tsx
│   ├── PlaylistCoverUploader.tsx
│   ├── PlaylistPrivacyToggle.tsx
│   ├── ProfileModal.tsx
│   ├── PWARegister.tsx
│   ├── QueueModal.tsx
│   ├── RecentlyPlayed.tsx
│   ├── SearchClient.tsx
│   ├── SharePlaylistButton.tsx
│   ├── Sidebar.tsx
│   ├── Skeletons.tsx
│   ├── SoundSettingsModal.tsx
│   ├── ThemeSwitcher.tsx
│   ├── Toast.tsx
│   ├── TrackList.tsx
│   ├── TrackMenuTrigger.tsx
│   ├── TrackOptionsMenu.tsx
│   ├── UserLikesInit.tsx
│   ├── UserProfileClient.tsx
│   ├── VinylScene.tsx
│   ├── VisitLogger.tsx
│   └── VolumeSlider.tsx
├── lib
│   ├── audius.ts
│   ├── auth.ts
│   ├── downloader.ts
│   ├── hitmoz.ts
│   ├── isAdmin.ts
│   ├── lyrics.ts
│   ├── mp3party.ts
│   ├── prisma.ts
│   ├── proxy-fetch.ts
│   ├── rate-limit.ts
│   ├── saavn.ts
│   ├── spotify.ts
│   ├── validations.ts
│   ├── youtube.ts
│   └── zaycev.ts
├── prisma
│   ├── schema.prisma
│   └── seed.ts
├── public
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── sw.js
│   ├── uploads
│   ├── vercel.svg
│   └── window.svg
├── scripts
│   └── local-worker.ts
├── store
│   ├── modalStore.ts
│   ├── playerStore.ts
│   ├── soundStore.ts
│   ├── themeStore.ts
│   ├── trackMenuStore.ts
│   └── uiStore.ts
├── .github/workflows
│   ├── deploy.yml
│   └── download.yml
├── bot.js
├── bot-local.js
├── bot-proxy.js
├── bot-vps.js
├── cloudflared-linux-amd64.deb
├── ecosystem.config.js
├── eslint.config.mjs
├── ffmpeg
├── next.config.ts
├── next-env.d.ts
├── package.json
├── package-lock.json
├── prisma.config.ts
├── proxy.ts
├── README.md
├── rebuild.sh
├── tsconfig.json
├── worker.ts
└── yt-dlp



## 3. Архитектура базы данных (Prisma)
Мы используем PostgreSQL на хостинге Neon.tech. Схема спроектирована для высокой скорости чтения и поддержки всех функций плеера.

- **User**: Основная таблица пользователей. Хранит `role` (USER/ADMIN/PREMIUM), `status` (ACTIVE/BANNED), `subscriptionEnd`, `avatarUrl`, `avatarEffect`, `bannerUrl`, `bio`, `telegram`, `phone`.
- **Track**: Таблица треков. Ключевое поле — `hash` (MD5 от названия и артиста). Оно используется для **дедупликации** (защита от скачивания одного и того же трека дважды). Также содержит поля `lyrics` и `syncedLyrics` для текстов песен и `bpm` для кроссфейда.
- **Playlist** и **PlaylistItem**: Позволяют создавать плейлисты. Поле `order` в `PlaylistItem` отвечает за Drag&Drop сортировку. Поддерживается `isPublic` (публичные плейлисты) и `coverUrl` (пользовательская обложка).
- **Like**: Связующая таблица для лайков (юзер + трек). Уникальный индекс по паре `userId + trackId` защищает от двойных лайков.
- **ListenHistory**: Собирает статистику прослушиваний для алгоритма рекомендаций («Моя волна»).
- **PinnedTrack**: Закрепленные треки на главной странице.
- **VisitLog**: Собирает данные о посещениях (путь, IP, User-Agent) для дашборда админки.
- **SubscriptionLog**: История выдачи и отзыва подписок.
- **Feedback**: Обратная связь от пользователей (тип, сообщение, статус).
- **InviteCode**: Система закрытой регистрации (код, дата создания, кто использовал).
- **ImportTask**: Очередь задач на скачивание (`batchId`, `title`, `artist`, `status`).

---

## 4. Ключевые технические решения (Обход ограничений)

### 4.1. Хранение аудиофайлов
Вместо платных облачных хранилищ (S3, Cloudflare R2) используется **Telegram Bot API**. 
1. Сервер скачивает трек из открытых источников.
2. Отправляет его в закрытый Telegram-канал через `sendAudio`.
3. Получает `file_id` и сохраняет его в БД в поле `Track.audioUrl`.
При прослушивании сервер делает запрос к Telegram и **проксирует** поток байтов через себя. Это скрывает прямые ссылки на Telegram от пользователей и позволяет перематывать треки (поддержка HTTP `Range` заголовков).

### 4.2. Импорт музыки (Каскадная система)
Из-за блокировок Роскомнадзора прямые запросы к некоторым зарубежным API с сервера не работают. Мы провели огромную исследовательскую работу (файлы `audius.ts`, `spotify.ts`, `youtube.ts`, `zaycev.ts`, `saavn.ts` — это история наших попыток найти рабочий источник).

**Итоговая рабочая схема:**
1. **Поиск метаданных:** Используются открытые API iTunes и Deezer (они не блокируют IP сервера).
2. **Поиск аудио:** Используются зеркала базы открытых MP3-источников (Hitmoz). Для обхода блокировок сервер использует пул CORS-прокси (`allorigins`, `codetabs`).
3. **Обогащение (Метаданные):** Обложка, год, жанр и длительность подтягиваются каскадом: iTunes (обложка 1000x1000) -> Deezer -> Парсер источника.
4. **Плейлисты:** Для переноса плейлистов используется внешний Telegram-бот `@yamusic_export_bot`, который выдает текстовый список в формате `Артист - Название`. Пользователь копирует этот текст, вставляет в модалку на сайте (`ImportPlaylistModal.tsx`), а наш сервер ставит треки в очередь.
5. **Резервный скачиватель:** Настроен GitHub Action (`.github/workflows/download.yml`), который качает треки с американского IP (если основной источник заблокирован для России).

### 4.3. Фоновая обработка
Чтобы пользователь не ждал скачивания 100 треков, используется **воркер** (`worker.ts`). Он запущен в PM2 и работает независимо от веб-сервера. Воркер берет задачи со статусом `PENDING` из таблицы `ImportTask`, качает их и меняет статус на `DONE` или `FAILED`. Пользователь может закрыть вкладку, а прогресс отображается через глобальное уведомление (`GlobalImportNotification.tsx`).

---

## 5. Безопасность
- **JWT (jose) + HttpOnly Cookies**: Токен авторизации хранится в защищенных куках, недоступных для JavaScript (защита от XSS).
- **bcryptjs**: Пароли хешируются с солью перед сохранением в БД.
- **Rate Limiting (lru-cache)**: Защита от брутфорса. На логин — 5 попыток в минуту, на регистрацию — 3 (по IP-адресу).
- **Zod**: Строгая валидация всех входящих JSON-запросов (email, пароль, ID трека, название плейлиста и т.д.).
- **Разделение прав**: Все API-роуты для изменения данных (создание, удаление, редактирование) проверяют роль пользователя через `isAdmin.ts`.
- **Защита API для ботов**: Эндпоинты `/api/import-queue` и `/api/admin/save-track` защищены секретным ключом в заголовке `x-api-secret`, известным только нашему серверу и GitHub Actions.
- **Инвайт-система**: Регистрация возможна только по коду, выданному админом (защита от несанкционированного доступа).

---

## 6. UI/UX и особенности фронтенда
- **Брутальный минимализм**: Темная тема (#000000 / #121212), белый текст, отказ от дефолтных элементов браузера (кастомные скроллбары, кнопки, ползунки).
- **Next.js 16 (App Router)**: Использование Server Components для быстрой загрузки страниц и Client Components для интерактивного плеера.
- **Zustand**: Глобальное состояние плеера (очередь треков, громкость, лайки, тема) синхронизировано между всеми компонентами без лишних ре-рендеров.
- **Web Audio API**: Эквалайзер (Bass/Mid/Treble) работает за счет пропускания аудиопотока через `AudioContext` с `BiquadFilterNode`.
- **PWA (Progressive Web App)**: Сайт можно установить на телефон как нативное приложение. `manifest.ts` + `sw.js` кэшируют статику и картинки.
- **Медиа-сессии**: Интеграция с Media Session API для управления плеером с экрана блокировки телефона.
- **Framer Motion**: Все модалки, тосты и страницы анимированы (fade, slide, scale, layoutId).

---

## 7. CI/CD и Деплой
- **VPS**: Собственный сервер (Ubuntu 24.04, 1 CPU, 2GB RAM + 4GB Swap). Swap-файл обязателен для сборки Next.js 16 (иначе OOM).
- **Nginx**: Reverse-proxy с настройкой `proxy_buffering off` для стриминга аудио без задержек и `worker_connections 4096` для высоких нагрузок.
- **PM2**: Менеджер процессов. Запускает три приложения: `sadovod` (сайт), `worker` (скачивание в фоне), `parser-bot` (Telegram-бот). Настроен `pm2 save` для автозапуска при перезагрузке.
- **GitHub Actions**: Настроен автодеплой (`.github/workflows/deploy.yml`) при пуше в `main`. Дополнительный воркфлоу (`download.yml`) отвечает за скачивание треков через американский IP (обход блокировок).
- **HTTPS**: Настроен через `nip.io` домен и Let's Encrypt сертификат. Куки с `secure: true`.