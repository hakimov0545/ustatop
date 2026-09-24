import { upload } from '@vercel/blob/client';

export async function uploadMedia(file, { userId, context, orderId }) {
  const folder = `ustatop/${userId}/${context}`;
  const pathname = `${folder}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const blob = await upload(pathname, file, {
    access: 'public',
    handleUploadUrl: '/api/uploads',
    clientPayload: JSON.stringify({ context, orderId }),
    contentType: file.type,
    multipart: file.size > 4 * 1024 * 1024,
  });
  return { url: blob.url, pathname: blob.pathname, contentType: blob.contentType, size_bytes: file.size, original_name: file.name };
}
