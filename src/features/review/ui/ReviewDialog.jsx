import { useState } from 'react';
import { submitReview } from '../../../entities/review/api/reviewApi.js';
import { Field } from '../../../shared/ui/Field.jsx';
import { Modal } from '../../../shared/ui/Modal.jsx';
export function ReviewDialog({order,close,onDone}){
  const [rating,setRating]=useState(5);const [error,setError]=useState('');
  async function submit(event){event.preventDefault();const values=Object.fromEntries(new FormData(event.currentTarget));try{await submitReview(order.id,{...values,rating});onDone();}catch(problem){setError(problem.message);}}
  return <Modal close={close}><div className="dialog-head"><div><span className="kicker">BUYURTMA #{order.id}</span><h2 className="page-title">Xizmatni baholang</h2></div><button className="close" onClick={close}>×</button></div><form onSubmit={submit}><div className="stars" aria-label="Reyting">{[1,2,3,4,5].map(value=><button type="button" key={value} onClick={()=>setRating(value)} className={value<=rating?'on':''} aria-label={`${value} yulduz`}>★</button>)}</div><Field label="Sharhingiz" hint="(ixtiyoriy)"><textarea name="comment" maxLength="1000" placeholder="Usta va xizmat haqida fikringiz"/></Field>{error&&<p className="form-error">{error}</p>}<button className="btn">Bahoni yuborish</button></form></Modal>;
}
