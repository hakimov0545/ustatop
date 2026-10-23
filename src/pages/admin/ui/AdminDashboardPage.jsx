import { useEffect, useState } from 'react';
import { getAdminDashboard } from '../api/adminApi.js';

const labels = { pending: 'Kutilmoqda', accepted: 'Qabul qilingan', en_route: 'Yo‘lda', arrived: 'Yetib kelgan', in_progress: 'Jarayonda', completed: 'Bajarilgan', cancelled: 'Bekor qilingan' };
const statusColors = { pending: '#d9a441', accepted: '#67926d', en_route: '#679cbb', arrived: '#5889a5', in_progress: '#7b77c5', completed: '#39805b', cancelled: '#c87571' };
const number = value => new Intl.NumberFormat('uz-UZ').format(value || 0);

export function AdminDashboardPage() {
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    getAdminDashboard(period).then(value => { if (active) setData(value); }).catch(problem => { if (active) setError(problem.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [period]);
  if (error && !data) return <section className="panel"><p className="form-error">{error}</p></section>;
  if (!data) return <div className="empty">Statistika yuklanmoqda…</div>;
  const { totals } = data;
  const statCards = [
    { label: 'Jami foydalanuvchi', value: totals.users, icon: '◉', note: 'mijozlar va ustalar', tone: 'green' },
    { label: 'Faol ustalar', value: totals.masters, icon: '✳', note: `${number(totals.customers)} mijoz`, tone: 'mint' },
    { label: 'Jami buyurtmalar', value: totals.orders, icon: '▤', note: 'barcha holatlar', tone: 'amber' },
    { label: 'Mijozlar bahosi', value: `★ ${totals.averageRating}`, icon: '★', note: `${number(totals.reviews)} ta sharh`, tone: 'violet' },
  ];
  const busyDistricts = data.usersByDistrict.slice(0, 6).map(row => ({ label: row._id, value: row.users, suffix: 'foydalanuvchi' }));
  const categories = data.topCategories.slice(0, 6).map(row => ({ label: `${row.icon} ${row.category}`, value: row.searches, suffix: 'qidiruv' }));
  const ordersByStatus = data.ordersByStatus.map(row => ({ ...row, label: labels[row._id] || row._id, color: statusColors[row._id] || '#9aa49b' }));
  return <div className="admin-layout">
    <main className="admin-main" id="overview">
      <div className="admin-toolbar"><div className="admin-breadcrumb">Boshqaruv <span>/</span> <b>Dashboard</b></div><div className="admin-tools"><span className={`admin-refresh ${loading ? 'is-loading' : ''}`} aria-live="polite"><i/> {loading ? 'Yangilanmoqda…' : 'Ma’lumotlar yangilandi'}</span><label className="admin-period"><select aria-label="Statistika davri" value={period} onChange={event => setPeriod(Number(event.target.value))}><option value="7">Oxirgi 7 kun</option><option value="30">Oxirgi 30 kun</option><option value="90">Oxirgi 90 kun</option></select></label></div></div>
      <div className="admin-heading"><div><span className="kicker">PLATFORMA TAHLILI</span><h1 className="page-title">Xush kelibsiz 👋</h1><p className="admin-subtitle">UstaTop faoliyati bo‘yicha muhim ko‘rsatkichlar bir joyda.</p></div><div className="admin-date-chip">◷ <span>{new Date().toLocaleDateString('uz-UZ',{day:'numeric',month:'long',year:'numeric'})}</span></div></div>
      {error && <p className="form-error">{error}</p>}
      <section className="admin-stat-grid">{statCards.map(card => <article className="admin-stat" key={card.label}><div className="admin-stat-top"><span className={`admin-stat-icon ${card.tone}`}>{card.icon}</span><span className="admin-stat-period">Jami</span></div><span className="admin-stat-label">{card.label}</span><strong>{number(card.value)}</strong><small>{card.note}</small></article>)}</section>
      <div className="admin-charts-grid">
        <section className="admin-chart-card admin-trend-card"><div className="admin-chart-heading"><div><span className="admin-chart-eyebrow">O‘SISH DINAMIKASI</span><h2>Foydalanuvchilar va buyurtmalar</h2></div><div className="admin-chart-legend"><span><i className="legend-users"/>Foydalanuvchilar</span><span><i className="legend-orders"/>Buyurtmalar</span></div></div><TrendChart rows={data.trend}/></section>
        <section className="admin-chart-card" id="orders"><div className="admin-chart-heading"><div><span className="admin-chart-eyebrow">BUYURTMALAR</span><h2>Holatlar bo‘yicha</h2></div><span className="admin-chart-total">{number(totals.orders)}<small>jami</small></span></div><StatusChart rows={ordersByStatus}/></section>
        <section className="admin-chart-card" id="regions"><div className="admin-chart-heading"><div><span className="admin-chart-eyebrow">AUDITORIYA</span><h2>Foydalanuvchilar hududi</h2></div></div><HorizontalBars rows={busyDistricts} color="green" empty="Hudud ma’lumotlari hali yo‘q."/></section>
        <section className="admin-chart-card" id="demand"><div className="admin-chart-heading"><div><span className="admin-chart-eyebrow">TALAB</span><h2>Ko‘p qidirilgan xizmatlar</h2></div></div><HorizontalBars rows={categories} color="amber" empty="Qidiruv statistikasi yig‘ilmoqda."/></section>
        <section className="admin-chart-card" id="masters"><div className="admin-chart-heading"><div><span className="admin-chart-eyebrow">USTALAR</span><h2>Ko‘p ko‘rilgan profillar</h2></div></div>{data.topMasters.length?<div className="admin-ranking">{data.topMasters.slice(0,6).map((master,index)=><div className="admin-ranking-row" key={master.id}><span className="ranking-number">{String(index+1).padStart(2,'0')}</span><span className="ranking-name">{master.name}</span><span className="ranking-value">{number(master.views)} <small>ko‘rish</small></span></div>)}</div>:<div className="admin-chart-empty">Profil ko‘rish statistikasi yig‘ilmoqda.</div>}</section>
        <section className="admin-chart-card"><div className="admin-chart-heading"><div><span className="admin-chart-eyebrow">BUYURTMA TALABI</span><h2>Hududlar bo‘yicha buyurtmalar</h2></div></div><HorizontalBars rows={data.ordersByDistrict.slice(0,6).map(row=>({label:row._id||'Ko‘rsatilmagan',value:row.count,suffix:'buyurtma'}))} color="blue" empty="Hali buyurtma yo‘q."/></section>
      </div>
      <p className="admin-footnote">Qidiruv va profil ko‘rish statistikasi ushbu versiya ishga tushganidan boshlab yig‘iladi{data.analyticsSince?` (${data.analyticsSince} dan)`:''}. Hudud kesimi foydalanuvchi profilida ko‘rsatilgan tumanga asoslanadi.</p>
    </main>
  </div>;
}

function TrendChart({ rows }) {
  const width = 720, height = 260, left = 35, right = 12, top = 18, bottom = 34;
  const chartWidth = width - left - right, chartHeight = height - top - bottom;
  const max = Math.max(1, ...rows.map(row => Math.max(row.users, row.orders)));
  const point = (value, index) => ({ x: left + (rows.length < 2 ? chartWidth / 2 : index * chartWidth / (rows.length - 1)), y: top + chartHeight - value / max * chartHeight });
  const pathFor = key => rows.map((row,index)=>{const p=point(row[key],index);return `${index?'L':'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;}).join(' ');
  const tickIndices = [...new Set([0,Math.floor((rows.length-1)/3),Math.floor((rows.length-1)*2/3),rows.length-1])];
  return <div className="admin-trend-wrap"><svg className="admin-trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Tanlangan davrda foydalanuvchilar va buyurtmalar soni">
    {[0,1,2,3].map(tick=>{const y=top+tick*chartHeight/3;return <g key={tick}><line x1={left} x2={width-right} y1={y} y2={y} className="chart-gridline"/><text x={left-8} y={y+4} textAnchor="end" className="chart-axis-label">{Math.round(max*(3-tick)/3)}</text></g>;})}
    <path d={`${pathFor('users')} L ${point(rows.at(-1)?.users||0,rows.length-1).x} ${top+chartHeight} L ${point(rows[0]?.users||0,0).x} ${top+chartHeight} Z`} className="chart-users-fill"/>
    <path d={pathFor('orders')} className="chart-orders-line"/><path d={pathFor('users')} className="chart-users-line"/>
    {rows.map((row,index)=>{const p=point(row.users,index);return <circle key={row.date} cx={p.x} cy={p.y} r="3" className="chart-users-dot"><title>{row.date}: {row.users} foydalanuvchi</title></circle>;})}
    {tickIndices.map(index=>rows[index]&&<text key={rows[index].date} x={point(0,index).x} y={height-8} textAnchor={index===0?'start':index===rows.length-1?'end':'middle'} className="chart-axis-label">{new Date(`${rows[index].date}T00:00:00`).toLocaleDateString('uz-UZ',{day:'numeric',month:'short'})}</text>)}
  </svg></div>;
}

function StatusChart({ rows }) {
  const total = rows.reduce((sum,row)=>sum+row.count,0), radius=48, circumference=2*Math.PI*radius;
  let offset=0;
  return <div className="admin-status-layout"><div className="admin-donut"><svg viewBox="0 0 120 120" role="img" aria-label="Buyurtmalar holati diagrammasi"><circle cx="60" cy="60" r={radius} className="donut-track"/>{rows.map(row=>{const length=total?row.count/total*circumference:0;const circle=<circle key={row._id} cx="60" cy="60" r={radius} fill="none" stroke={row.color} strokeWidth="13" strokeDasharray={`${length} ${circumference-length}`} strokeDashoffset={-offset} transform="rotate(-90 60 60)"><title>{row.label}: {row.count}</title></circle>;offset+=length;return circle;})}</svg><div className="admin-donut-center"><strong>{number(total)}</strong><span>buyurtma</span></div></div><div className="admin-status-legend">{rows.length?rows.map(row=><div key={row._id}><i style={{background:row.color}}/><span>{row.label}</span><b>{number(row.count)}</b></div>):<span className="admin-chart-empty">Hali buyurtma yo‘q.</span>}</div></div>;
}

function HorizontalBars({ rows, color, empty }) {
  const max = Math.max(1,...rows.map(row=>row.value));
  return rows.length?<div className="admin-bars">{rows.map((row,index)=><div className="admin-bar-row" key={`${row.label}-${index}`}><div className="admin-bar-label"><span>{row.label}</span><b>{number(row.value)} <small>{row.suffix}</small></b></div><div className="admin-bar-track"><i className={`bar-${color}`} style={{width:`${Math.max(3,row.value/max*100)}%`}}/></div></div>)}</div>:<div className="admin-chart-empty">{empty}</div>;
}
