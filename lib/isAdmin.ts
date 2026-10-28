import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const payload = token ? await verifyToken(token) : null;

  return payload?.role === 'ADMIN';
}
