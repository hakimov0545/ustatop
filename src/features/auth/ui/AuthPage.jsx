import { useState } from 'react';
import { request,jsonBody } from '../../../shared/api/client.js';
import { requestLocation } from '../../../shared/lib/geo.js';
import { Field } from '../../../shared/ui/Field.jsx';
import { CategorySelect,DistrictSelect } from '../../../shared/ui/Selects.jsx';

export function AuthPage({initialMode,categories,onAuth,onModeChange}){
  const [mode,setMode]=useState(initialMode);const [role,setRole]=useState('customer');const [point,setPoint]=useState(null);const [error,setError]=useState('');
  function changeMode(next){setMode(next);onModeChange?.(next);}
  async function locate(){try{setPoint(await requestLocation());setError('');}catch(problem){setError(problem.message);}}
  async function submit(event){event.preventDefault();setError('');const form=event.currentTarget;const values=Object.fromEntries(new FormData(form));
    if(point)Object.assign(values,point);
    try{const data=await request(mode==='register'?'/api/auth/register':'/api/auth/login',{method:'POST',body:jsonBody({...values,role})});onAuth(data.user);}
    catch(problem){setError(problem.message);}
  }
  return <section className="auth-wrap panel"><span className="kicker">USTATOP AKKAUNTI</span><div className="auth-switch"><button type="button" className={mode==='login'?'active':''} onClick={()=>changeMode('login')}>Kirish</button><button type="button" className={mode==='register'?'active':''} onClick={()=>changeMode('register')}>Ro‘yxatdan o‘tish</button></div>
    {mode==='register'&&<div className="role-switch"><button type="button" className={`role-option ${role==='customer'?'active':''}`} onClick={()=>setRole('customer')}>👤 Mijoz</button><button type="button" className={`role-option ${role==='master'?'active':''}`} onClick={()=>setRole('master')}>🛠 Usta</button></div>}
    <h2>{mode==='register'?'Akkaunt yarating':'Xush kelibsiz'}</h2><form onSubmit={submit}>
      {mode==='register'&&<><Field label="Ism va familiya"><input name="name" required minLength="2" autoComplete="name" placeholder="Ismingiz"/></Field><Field label="Toshkent tumani"><DistrictSelect/></Field>
        {role==='master'&&<><Field label="Ko‘rsatadigan xizmatingiz"><CategorySelect categories={categories}/></Field><div className="field-row"><Field label="Eng kam narx, so‘m"><input name="price_min" type="number" min="0" required defaultValue="100000"/></Field><Field label="Eng yuqori narx, so‘m"><input name="price_max" type="number" min="0" required defaultValue="500000"/></Field></div><Field label="Tajriba yillari"><input name="experience_years" type="number" min="0" max="70" defaultValue="1"/></Field><Field label="Xizmatlaringiz" hint="Vergul bilan ajrating"><input name="services" placeholder="Kran ta’miri, quvur o‘rnatish"/></Field><Field label="O‘zingiz haqingizda"><textarea name="bio" maxLength="1000" placeholder="Tajriba, ish vaqti, kafolat…"/></Field></>}
        <button className="btn outline small location-button" type="button" onClick={locate}>⌖ {point?'Joylashuv olindi':'Joylashuvni ulash (ixtiyoriy)'}</button>
      </>}
      <Field label="Telefon raqami"><input name="phone" type="tel" required minLength="9" autoComplete="tel" placeholder="+998 90 123 45 67"/></Field><Field label="Parol" hint={mode==='register'?'(kamida 8 belgi)':''}><input name="password" type="password" required minLength="8" autoComplete={mode==='register'?'new-password':'current-password'} placeholder="••••••••"/></Field>
      {error&&<p className="form-error">{error}</p>}<button className="btn full">{mode==='register'?'Akkaunt yaratish':'Kirish'}</button><p className="note">Telefon raqami akkauntga kirish uchun ishlatiladi. GPS ixtiyoriy.</p>
    </form></section>;
}
