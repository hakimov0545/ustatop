import { Link, NavLink } from 'react-router-dom';

export function Header({ user, loading, onLogout, onAuth }) {
  return (
    <header className="topbar">
      <Link className="brand" to="/">
        <span className="brandmark">U</span>usta<span className="brand-accent">top</span>
      </Link>
      <nav className="nav">
        {user?.role === 'customer' ? <>
          <NavLink to="/" end>Ustalar</NavLink>
          <NavLink to="/map">Xarita</NavLink>
          <NavLink to="/orders">Buyurtmalar</NavLink>
        </> : user?.role === 'admin' ? <>
          <NavLink to="/admin">Dashboard</NavLink>
        </> : user?.role === 'master' ? <>
          <NavLink to="/orders">Ishlar</NavLink>
          <NavLink to="/settings">Profil/portfolio</NavLink>
        </> : <>
          <NavLink to="/" end>Ustalarni topish</NavLink>
          <NavLink to="/map">Xarita</NavLink>
        </>}
      </nav>
      <div className="account-actions">
        {loading ? <span className="account-name" aria-label="Akkaunt tekshirilmoqda">…</span> : user ? <>
          <span className="account-name">{user.name}</span>
          <button className="btn outline small" onClick={onLogout}>Chiqish</button>
        </> : <>
          <button className="text-button" onClick={() => onAuth('login')}>Kirish</button>
          <button className="btn small" onClick={() => onAuth('register')}>Ro‘yxatdan o‘tish</button>
        </>}
      </div>
    </header>
  );
}
