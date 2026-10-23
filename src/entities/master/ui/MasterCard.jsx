import { money } from '../../../shared/lib/format.js';
export function MasterCard({master,user,onOpen,onOrder,issueDraft}){
  const initials=master.name.split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase();
  return <article className="master-card" role="link" tabIndex={0} onClick={()=>onOpen(master.id)} onKeyDown={event=>{if(event.target===event.currentTarget&&(event.key==='Enter'||event.key===' ')){event.preventDefault();onOpen(master.id);}}} aria-label={`${master.name} profilini ko‘rish`}><div className="master-top"><div className="avatar">{initials}</div><div><h3>{master.name}</h3><div className="subtle">{master.category} · {master.district}</div></div><div className="rating">★ {master.review_count?Number(master.rating).toFixed(1):'Yangi'}{master.review_count>0&&<div className="subtle">{master.review_count} baho</div>}</div></div>
    <p className="bio">{master.bio||'Usta xizmatga tayyor.'}</p>{master.services?.length>0&&<div className="service-tags">{master.services.slice(0,3).map(service=><span key={service}>{service}</span>)}</div>}
    <div className="meta-row"><span>📍 {master.distance_km!=null?`${master.distance_km} km · ~${master.eta_minutes} daq`:master.district}</span><span>{master.price_min?`${money(master.price_min)}–${money(master.price_max)} so‘m`:'Narx kelishiladi'}</span></div>
    {user?.role==='customer'&&<button className="btn" onClick={event=>{event.stopPropagation();onOrder(master,issueDraft);}}>Band qilish <span>↗</span></button>}{!user&&<button className="btn" onClick={event=>{event.stopPropagation();onOrder(null,issueDraft);}}>Buyurtma berish <span>↗</span></button>}
  </article>;
}
