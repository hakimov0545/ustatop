import { useCallback,useEffect,useState } from 'react';
import { request } from '../../../shared/api/client.js';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { uploadMedia } from '../../../shared/lib/upload.js';

export function ChatDialog({order,user,close,notify}){
  const [messages,setMessages]=useState([]);const [file,setFile]=useState(null);const [error,setError]=useState('');
  const load=useCallback(async()=>{try{setMessages(await request(`/api/orders/${order.id}/messages`));setError('');}catch(problem){setError(problem.message);}},[order.id]);
  useEffect(()=>{load();const timer=setInterval(()=>{if(!document.hidden)load();},4000);return()=>clearInterval(timer);},[load]);
  useEffect(()=>{const element=document.querySelector('.chat-box');if(element)element.scrollTop=element.scrollHeight;},[messages]);
  async function submit(event){event.preventDefault();const form=event.currentTarget;const body=String(new FormData(form).get('body')||'').trim();if(!body&&!file)return;try{const attachment=file?await uploadMedia(file,{userId:user.id,context:'order',orderId:order.id}):null;await request(`/api/orders/${order.id}/messages`,{method:'POST',body:JSON.stringify({body,attachment})});form.reset();setFile(null);await load();}catch(problem){notify(problem.message);}}
  return <Modal close={close}><div className="dialog-head"><div><span className="kicker">BUYURTMA #{order.id}</span><h2 className="page-title">Mijoz va usta chati</h2></div><button className="close" onClick={close}>×</button></div>{error&&<p className="form-error">{error}</p>}
    <div className="chat-box">{messages.length?messages.map(message=><div className={`bubble ${message.sender_id===user.id?'mine':''}`} key={message.id}>{message.body}{message.attachments?.map(media=><Media key={media.id} item={media}/>)}<small>{message.sender_name} · {message.created_at}</small></div>):<div className="empty">Hali xabar yo‘q. Birinchi xabarni yozing yoki rasm/video yuboring.</div>}</div>
    <form className="chat-form" onSubmit={submit}><input name="body" maxLength="2000" placeholder="Xabar yozing…"/><label className="file-pick" title="Rasm/video biriktirish">＋<input type="file" hidden accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" onChange={event=>setFile(event.target.files?.[0]||null)}/></label><button className="btn">Yuborish</button></form>{file&&<p className="subtle">Biriktirildi: {file.name} · <button className="link-button" type="button" onClick={()=>setFile(null)}>olib tashlash</button></p>}<p className="note">JPG, PNG, WebP, MP4, MOV yoki WebM · 50 MB gacha.</p></Modal>;
}
function Media({item}){const url=item.url;return item.mime_type.startsWith('video/')?<video className="chat-media" src={url} controls preload="metadata"/>:<a href={url} target="_blank" rel="noreferrer"><img className="chat-media" src={url} alt={item.caption||item.original_name} loading="lazy"/></a>;}
