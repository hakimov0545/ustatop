import { handleUpload } from '@vercel/blob/client';
import { getCollection } from '../../db/index.js';
import { requireUser } from '../../shared/auth.js';
import { allowedMediaTypes, maxMediaSize } from '../../shared/blob.js';
import { httpError } from '../../shared/errors.js';

export async function createUpload(req, res) {
  const user = requireUser(req);
  const result = await handleUpload({
    request: req,
    body: req.body,
    onBeforeGenerateToken: async (pathname, clientPayload) => {
      let payload;
      try { payload = JSON.parse(clientPayload || '{}'); } catch { httpError(400, 'Upload ma’lumoti noto‘g‘ri.'); }
      const context = String(payload.context || '');
      if (!['portfolio', 'order'].includes(context) || !pathname.startsWith(`ustatop/${user.id}/${context}/`)) httpError(400, 'Upload manzili yaroqsiz.');
      if (context === 'portfolio') requireUser(req, 'master');
      if (context === 'order') {
        const order = await (await getCollection('orders')).findOne({ id: payload.orderId, $or: [{ customer_id: user.id }, { master_id: user.id }] });
        if (!order || ['completed', 'cancelled'].includes(order.status)) httpError(403, 'Bu buyurtma uchun fayl yuborib bo‘lmaydi.');
      }
      return { allowedContentTypes: allowedMediaTypes, maximumSizeInBytes: maxMediaSize, addRandomSuffix: true, tokenPayload: JSON.stringify({ userId: user.id, context, orderId: payload.orderId || null }) };
    },
    onUploadCompleted: async () => {},
  });
  res.json(result);
}
