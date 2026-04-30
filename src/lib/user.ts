import { cookies } from 'next/headers';


// 仮のユーザーIDをCookieで管理するユーティリティ
export async function getUserId(): Promise<string> {
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get('user_id');
  const deviceIdCookie = cookieStore.get('gbf_device_id');
  
  return userIdCookie?.value || deviceIdCookie?.value || 'default-user';
}
