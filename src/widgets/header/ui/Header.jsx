export function Header({ user, page, setPage, onLogout, onAuth }) {
  return (
    <header className="topbar">
      <button className="brand" onClick={() => setPage("home")}>
        <span className="brandmark">U</span>usta
        <span className="brand-accent">top</span>
      </button>
      <nav className="nav">
        {user?.role === "customer" ? (
          <>
            <button
              className={page === "home" ? "active" : ""}
              onClick={() => setPage("home")}
            >
              Ustalar
            </button>
            <button
              className={page === "orders" ? "active" : ""}
              onClick={() => setPage("orders")}
            >
              Buyurtmalar
            </button>
          </>
        ) : user?.role === "master" ? (
          <>
            <button
              className={page === "orders" ? "active" : ""}
              onClick={() => setPage("orders")}
            >
              Ishlar
            </button>
            <button
              className={page === "settings" ? "active" : ""}
              onClick={() => setPage("settings")}
            >
              Profil/portfolio
            </button>
          </>
        ) : (
          <button
            className={page === "home" ? "active" : ""}
            onClick={() => setPage("home")}
          >
            Ustalarni topish
          </button>
        )}
      </nav>
      <div className="account-actions">
        {user ? (
          <>
            <span className="account-name">{user.name}</span>
            <button className="btn outline small" onClick={onLogout}>
              Chiqish
            </button>
          </>
        ) : (
          <>
            <button className="text-button" onClick={() => onAuth("login")}>
              Kirish
            </button>
            <button className="btn small" onClick={() => onAuth("register")}>
              Ro‘yxatdan o‘tish
            </button>
          </>
        )}
      </div>
    </header>
  );
}
