import { getForParticipant } from '../orders/orders.repository.js';
import { create } from './reviews.repository.js';
import { requireUser } from '../../shared/auth.js';
import { id } from '../../shared/validation.js';
import { httpError } from '../../shared/errors.js';
import { getCollection } from '../../db/index.js';

export async function submit(user,rawOrderId,data){
  requireUser({user},'customer');const orderId=id(rawOrderId,'Buyurtma');
  const order=await getForParticipant(orderId,user);
  if(!order||order.customer_id!==user.id)httpError(404,'Buyurtma topilmadi.');
  if(order.status!=='completed'||!order.master_id)httpError(400,'Baho faqat yakunlangan buyurtma uchun beriladi.');
  const rating=Number(data.rating),comment=String(data.comment||'').trim().slice(0,1000);
  if(!Number.isInteger(rating)||rating<1||rating>5)httpError(400,'Baho 1 dan 5 gacha bo‘lishi kerak.');
  try{await create({orderId,customerId:user.id,masterId:order.master_id,rating,comment});}
  catch(error){if(error.code===11000)httpError(409,'Bu buyurtmaga allaqachon baho berilgan.');throw error;}
  return {ok:true};
}
