import * as repository from './masters.repository.js';
import { id,district,coordinates,cleanPhone } from '../../shared/validation.js';
import { distanceKm,etaMinutes } from '../../shared/geo.js';
import { publicUser,requireUser } from '../../shared/auth.js';
import { httpError } from '../../shared/errors.js';
import { getCollection } from '../../db/index.js';
import crypto from 'node:crypto';

export async function list(query){
  const categoryId=query.category?id(query.category,'Xizmat turi'):null;
  const area=query.district?district(query.district):null;
  const point=coordinates(query.latitude,query.longitude);
  const radius=query.radius?Number(query.radius):null;
  const masters=(await repository.list({categoryId,district:area})).map(master=>{
    let distance=null,eta=null;
    if(point.latitude!==null&&master.latitude!==null&&master.longitude!==null){distance=Number(distanceKm(point.latitude,point.longitude,master.latitude,master.longitude).toFixed(1));eta=etaMinutes(distance);}
    const {password_hash,phone,contact_phone,social_links,_id,created_at,latest_review,...publicMaster}=master;
    return {...publicMaster,services:parseServices(master.services),distance_km:distance,eta_minutes:eta};
  }).filter(master=>radius===null||(master.distance_km!==null&&master.distance_km<=radius))
   .sort((a,b)=>a.distance_km===null?1:b.distance_km===null?-1:a.distance_km-b.distance_km||b.rating-a.rating);
  return masters;
}
function parseServices(value){if(Array.isArray(value))return value;try{return JSON.parse(value||'[]');}catch{return[];}}
export async function getProfile(masterId){
  const master=await repository.profile(id(masterId,'Usta'));
  if(!master)httpError(404,'Usta topilmadi.');
  const {latitude,longitude,password_hash,phone,_id,...publicMaster}=master;
  const [portfolio,reviews]=await Promise.all([repository.portfolio(master.id),repository.reviews(master.id)]);
  return {...publicMaster,services:parseServices(master.services),social_links:parseSocialLinks(master.social_links),portfolio,reviews};
}
const socialHosts={telegram:['t.me','telegram.me'],instagram:['instagram.com','www.instagram.com'],facebook:['facebook.com','www.facebook.com','fb.com'],tiktok:['tiktok.com','www.tiktok.com'],youtube:['youtube.com','www.youtube.com','youtu.be']};
function parseSocialLinks(value){if(value&&typeof value==='object'&&!Array.isArray(value))return value;try{return JSON.parse(value||'{}');}catch{return{};}}
function validateContact(data){
  const rawPhone=String(data.contact_phone||'').trim(),phone=rawPhone?cleanPhone(rawPhone):'';
  if(phone&&!/^\+?\d{7,15}$/.test(phone))httpError(400,'Aloqa telefon raqamini tekshiring.');
  const raw=data.social_links&&typeof data.social_links==='object'?data.social_links:{};
  const links={};
  for(const [network,hosts] of Object.entries(socialHosts)){
    const value=String(raw[network]||'').trim();if(!value)continue;
    let url;try{url=new URL(value);}catch{httpError(400,`${network} havolasi to‘liq URL bo‘lishi kerak (https:// bilan).`);}
    if(url.protocol!=='https:'||!hosts.includes(url.hostname.toLowerCase())||url.username||url.password)httpError(400,`${network} uchun rasmiy profil havolasini kiriting.`);
    links[network]=url.toString();
  }
  return {contactPhone:phone,socialLinks:JSON.stringify(links)};
}
export async function update(user,data){
  requireUser({user},'master');
  const name=String(data.name||'').trim(),area=district(data.district),bio=String(data.bio||'').trim().slice(0,1000);
  const experienceYears=Number(data.experience_years||0),priceMin=Number(data.price_min),priceMax=Number(data.price_max);
  if(name.length<2||!Number.isInteger(experienceYears)||experienceYears<0||experienceYears>70||!Number.isSafeInteger(priceMin)||!Number.isSafeInteger(priceMax)||priceMin<0||priceMax<priceMin)httpError(400,'Profil ma’lumotlarini tekshiring.');
  const services=(Array.isArray(data.services)?data.services:String(data.services||'').split(',')).map(item=>String(item).trim()).filter(Boolean).slice(0,12);
  const contact=validateContact(data);
  const point=coordinates(data.latitude,data.longitude);
  const saved=await repository.updateProfile(user.id,{name,district:area,bio,experience_years:experienceYears,services,price_min:priceMin,price_max:priceMax,latitude:point.latitude,longitude:point.longitude,available:Boolean(data.available),contact_phone:contact.contactPhone,social_links:JSON.parse(contact.socialLinks),updated_at:new Date()});
  return publicUser(saved);
}
export async function addPortfolioItem(user,file,caption){
  requireUser({user},'master');
  if(!file)httpError(400,'Portfolio uchun rasm yoki video tanlang.');
  const media={id:crypto.randomUUID(),owner_id:user.id,portfolio_master_id:user.id,url:file.url,pathname:file.pathname,original_name:file.original_name,mime_type:file.contentType,size_bytes:file.size_bytes,caption:String(caption||'').trim().slice(0,300),created_at:new Date()};
  return repository.addPortfolio(user.id,media);
}
export async function deletePortfolioItem(user,mediaId){
  requireUser({user},'master');
  const collection=await getCollection('media');
  const existing=await collection.findOne({id:id(mediaId,'Media'),portfolio_master_id:user.id});
  if(!existing)httpError(404,'Portfolio materiali topilmadi.');
  await repository.removePortfolio(user.id,mediaId);return existing;
}
