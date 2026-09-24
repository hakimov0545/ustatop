import { districts } from '../config/districts.js';
import { httpError } from './errors.js';

export const cleanPhone=value=>String(value||'').replace(/[^\d+]/g,'');
export function id(value,label='ID') {const text=String(value??'');if(/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(text)||/^legacy-(?:user|order|message|review|event|media)-\d+$/.test(text))return text;const parsed=Number(value);if(!Number.isInteger(parsed)||parsed<1)httpError(400,`${label} noto‘g‘ri.`);return parsed;}
export function district(value) {if(!districts.includes(value))httpError(400,'Toshkent tumanini tanlang.');return value;}
export function coordinates(latitude,longitude,{optional=true}={}) {
  if((latitude==null||latitude==='')&&(longitude==null||longitude==='')&&optional)return {latitude:null,longitude:null};
  const lat=Number(latitude),lng=Number(longitude);
  if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat < -90||lat>90||lng < -180||lng>180)httpError(400,'Joylashuv koordinatalari noto‘g‘ri.');
  return {latitude:lat,longitude:lng};
}
