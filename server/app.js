import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { authRouter } from './modules/auth/auth.routes.js';
import { categoriesRouter } from './modules/categories/categories.routes.js';
import { mastersRouter } from './modules/masters/masters.routes.js';
import { ordersRouter } from './modules/orders/orders.routes.js';
import { messagesRouter } from './modules/messages/messages.routes.js';
import { reviewsRouter } from './modules/reviews/reviews.routes.js';
import { attachUser } from './shared/auth.js';
import { errorHandler } from './shared/errors.js';
import { uploadsRouter } from './modules/uploads/uploads.routes.js';
import { getDb } from './db/index.js';
import { telegramRouter } from './modules/telegram/telegram.routes.js';

const app=express();
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
app.disable('x-powered-by');
app.use(express.json({limit:'100kb'}));
app.use(attachUser);
app.get('/api/health',async(_req,res)=>{await (await getDb()).command({ping:1});res.json({ok:true,service:'ustatop-express'});});
app.use('/api/auth',authRouter);
app.use('/api/telegram',telegramRouter);
app.use('/api/categories',categoriesRouter);
app.use('/api/masters',mastersRouter);
app.use('/api/uploads',uploadsRouter);
app.use('/api/orders',ordersRouter);
app.use('/api/orders/:id/messages',messagesRouter);
app.use('/api/orders/:id/reviews',reviewsRouter);
if(process.env.NODE_ENV==='production'&&!process.env.VERCEL){
  const dist=path.join(root,'dist');
  app.use(express.static(dist,{index:false}));
  app.get('/{*splat}',(_req,res)=>res.sendFile(path.join(dist,'index.html')));
}
app.use((_req,res)=>res.status(404).json({error:'Manzil topilmadi.'}));
app.use(errorHandler);
export default app;
