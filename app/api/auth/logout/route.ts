import { NextResponse } from 'next/server';

export async function POST() {
  // Просто удаляем куку и возвращаем успех, редирект сделает клиент
  const response = NextResponse.json({ success: true });
  response.cookies.delete('auth_token');
  return response;
}