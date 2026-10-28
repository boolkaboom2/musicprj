import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль должен быть минимум 6 символов'),
  name: z.string().min(2, 'Имя должно быть минимум 2 символа').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

export const trackIdSchema = z.object({
  trackId: z.string().uuid('Некорректный ID трека'),
});

export const createTrackSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  artist: z.string().min(1, 'Исполнитель обязателен'),
  audioUrl: z.string().min(1, 'Аудио обязательно'),
  coverUrl: z.string().url('Некорректная ссылка на обложку').nullable().optional(),
  duration: z.number().min(0).optional(),
  genre: z.string().nullable().optional(),
  releaseYear: z.number().min(1900).max(2100).nullable().optional(),
});

export const playlistSchema = z.object({
  title: z.string().min(1, 'Название плейлиста обязательно'),
});

export const playlistAddSchema = z.object({
  playlistId: z.string().uuid('Некорректный ID плейлиста'),
  trackId: z.string().uuid('Некорректный ID трека'),
});
