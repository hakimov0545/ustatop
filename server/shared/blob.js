import { httpError } from './errors.js';

export const allowedMediaTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'];
export const maxMediaSize = 50 * 1024 * 1024;

export function validateBlobFile(user, input, context) {
  if (!input || typeof input !== 'object') httpError(400, 'Fayl ma’lumoti topilmadi.');
  let url;
  try { url = new URL(String(input.url || '')); } catch { httpError(400, 'Fayl havolasi noto‘g‘ri.'); }
  const pathname = String(input.pathname || '');
  let decodedPath;
  try { decodedPath = decodeURIComponent(url.pathname.replace(/^\/+/, '')); } catch { httpError(400, 'Fayl havolasi noto‘g‘ri.'); }
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.public.blob.vercel-storage.com') || !pathname.startsWith(`ustatop/${user.id}/${context}/`) || decodedPath !== pathname) httpError(400, 'Yuklangan fayl manzili yaroqsiz.');
  const contentType = String(input.contentType || '');
  const size = Number(input.size_bytes);
  if (!allowedMediaTypes.includes(contentType) || !Number.isSafeInteger(size) || size < 1 || size > maxMediaSize) httpError(400, 'Fayl turi yoki hajmi ruxsat etilmagan.');
  return { url: url.toString(), pathname, contentType, size_bytes: size, original_name: String(input.original_name || pathname.split('/').pop()).slice(0, 255) };
}
