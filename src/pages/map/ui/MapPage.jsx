import { useCallback, useEffect, useState } from 'react';
import { getMasters } from '../../../entities/master/api/masterApi.js';
import { requestLocation } from '../../../shared/lib/geo.js';
import { useRef } from 'react';

export function MapPage({ onBack, onOpenMaster, issueDraft = {}, onClearIssue }) {
  const [point, setPoint] = useState(null);
  const [masters, setMasters] = useState([]);
  const [radius, setRadius] = useState(10);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Joylashuv aniqlanmoqda…');
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const load = useCallback(async (location, distance, categoryId = issueDraft.categoryId) => {
    if (!location) { setMasters([]); setLoading(false); return; }
    setLoading(true);
    try { setMasters(await getMasters({ latitude: location.latitude, longitude: location.longitude, radius: distance, ...(categoryId ? { category: categoryId } : {}) })); }
    catch (error) { setMessage(error.message); }
    finally { setLoading(false); }
  }, [issueDraft.categoryId]);
  useEffect(() => {
    let active = true;
    requestLocation().then(location => {
      if (!active) return;
      setPoint(location); setMessage(issueDraft.description ? `“${issueDraft.description}” so‘roviga mos ustalar ko‘rsatilmoqda.` : 'Sizning joylashuvingiz va yaqin ustalar ko‘rsatilmoqda.'); load(location, radius);
    }).catch(error => { if (active) { setMessage(`${error.message} Xaritani ko‘rish uchun joylashuvga ruxsat bering.`); setLoading(false); } });
    return () => { active = false; };
  }, [issueDraft.description, load]);
  function updateRadius(value) { const next = Number(value); setRadius(next); if (point) load(point, next); }
  const located = masters.filter(master => master.latitude != null && master.longitude != null && Number.isFinite(Number(master.latitude)) && Number.isFinite(Number(master.longitude)));
  const center = point || { latitude: 41.3111, longitude: 69.2797 };
  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then(L => {
      if (cancelled || !mapRef.current) return;
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
      const map = L.map(mapRef.current, { scrollWheelZoom: true }).setView([center.latitude, center.longitude], point ? 12 : 11);
      mapInstance.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
      if (point) L.marker([point.latitude, point.longitude], { icon: L.divIcon({ className: 'user-map-marker', html: '<span><i></i>Siz</span>', iconSize: [58, 42], iconAnchor: [29, 21] }), zIndexOffset: 1000, title: 'Sizning joylashuvingiz' }).addTo(map).bindTooltip('Siz shu yerdasiz');
      located.forEach(master => {
        const marker = L.marker([Number(master.latitude), Number(master.longitude)], { icon: L.divIcon({ className: 'master-map-marker', html: '<span><i>⌂</i></span>', iconSize: [38, 44], iconAnchor: [19, 39] }), title: master.name }).addTo(map);
        const popup = document.createElement('div'); popup.className = 'master-popup';
        const name = document.createElement('b'); name.textContent = master.name; popup.append(name);
        const detail = document.createElement('span'); detail.textContent = `${master.category || 'Usta'} · ${master.district || ''}`; popup.append(detail);
        const rating = document.createElement('span'); rating.textContent = master.review_count ? `★ ${Number(master.rating).toFixed(1)} · ${master.review_count} baho` : 'Hozircha baho yo‘q'; popup.append(rating);
        if (master.distance_km != null) { const distance = document.createElement('span'); distance.textContent = `Sizdan ${master.distance_km} km`; popup.append(distance); }
        const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Profilni ko‘rish'; button.addEventListener('click', () => onOpenMaster(master.id)); popup.append(button);
        marker.bindPopup(popup);
      });
      const bounds = [...(point ? [[point.latitude, point.longitude]] : []), ...located.map(master => [Number(master.latitude), Number(master.longitude)])];
      if (bounds.length > 1) map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
      window.setTimeout(() => map.invalidateSize(), 100);
    }).catch(() => { if (!cancelled) setMessage('Xaritani yuklab bo‘lmadi. Internet aloqasini tekshirib qayta urinib ko‘ring.'); });
    return () => { cancelled = true; if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
  }, [point, located.map(master => master.id).join(','), onOpenMaster]);
  return <section className="panel map-page">
    <button className="text-button map-back" onClick={onBack}>← Asosiy sahifa</button>
    <div className="panel-head"><div><span className="kicker">USTALAR XARITASI</span><h1 className="page-title">Yaqiningizdagi ustalar</h1><p className="subtle">{message}</p>{issueDraft.description&&<p className="notice map-query-notice" role="status">So‘rov: <b>{issueDraft.description}</b> · {issueDraft.categoryId?'Mos xizmatdagi ustalar ko‘rsatilmoqda.':'Mos xizmat topilmadi, barcha ustalar ko‘rsatilmoqda.'} <button type="button" className="text-button" aria-label="So‘rovni tozalash" title="So‘rovni tozalash" onClick={()=>{onClearIssue?.();setMessage('Barcha ustalar ko‘rsatilmoqda.');if(point)load(point,radius,'');}}>×</button></p>}</div><label className="map-radius">Radius: {radius} km<input type="range" min="1" max="50" value={radius} onChange={event => updateRadius(event.target.value)}/></label></div>
    <div className="master-map-wrap"><div className="map-title"><b>{point ? 'Sizning nuqtangiz va ustalar' : 'Toshkent xaritasi'}</b><a href={`https://www.openstreetmap.org/?mlat=${center.latitude}&mlon=${center.longitude}#map=13/${center.latitude}/${center.longitude}`} target="_blank" rel="noreferrer">Katta xaritada ochish ↗</a></div><div className="master-map leaflet-map" ref={mapRef} role="application" aria-label="Siz va yaqin ustalar xaritasi"/><div className="map-legend"><span><i className="customer-dot"/> Sizning joylashuvingiz</span><span><i className="master-dot"/> Ustalar</span></div></div>
    {loading ? <div className="empty">Ustalar yuklanmoqda…</div> : located.length ? <div className="map-master-list">{located.map(master => <button key={master.id} onClick={() => onOpenMaster(master.id)}>{master.name}<small>{master.distance_km != null ? `${master.distance_km} km · ${master.district}` : master.district}</small></button>)}</div> : <div className="empty">Bu radiusda joylashuvini ulashgan usta topilmadi.</div>}
    {!point&&<button className="btn" onClick={async()=>{setMessage('Joylashuv aniqlanmoqda…');try{const location=await requestLocation();setPoint(location);setMessage('Sizning joylashuvingiz va yaqin ustalar ko‘rsatilmoqda.');load(location,radius);}catch(error){setMessage(error.message);}}}>⌖ Joylashuvni aniqlash</button>}
  </section>;
}

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (window.leafletLoading) return window.leafletLoading;
  window.leafletLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; script.async = true;
    script.onload = () => resolve(window.L); script.onerror = reject; document.head.append(script);
  });
  return window.leafletLoading;
}
