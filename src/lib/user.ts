import { cookies } from 'next/headers';


// 仮のユーザーIDをCookieで管理するユーティリティ
export async function getUserId(): Promise<string> {
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get('gbf_device_id');
  
  if (userIdCookie?.value) {
    return userIdCookie.value;
  }
  
  return 'default-user'; // fallback (Server Component/Actions contexts shouldn't use fallback if we properly set it, but we can't set it in every read)
}
