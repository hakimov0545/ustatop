import { useCallback, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useRoutes } from 'react-router-dom';
import { request } from '../shared/api/client.js';
import { getCategories } from '../entities/category/api/categoryApi.js';
import { Header } from '../widgets/header/ui/Header.jsx';
import { HomePage } from '../pages/home/ui/HomePage.jsx';
import { MapPage } from '../pages/map/ui/MapPage.jsx';
import { OrdersPage } from '../pages/orders/ui/OrdersPage.jsx';
import { MasterProfilePage } from '../pages/master-profile/ui/MasterProfilePage.jsx';
import { MasterSettingsPage } from '../pages/master-settings/ui/MasterSettingsPage.jsx';
import { AuthPage } from '../features/auth/ui/AuthPage.jsx';
import { OrderDialog } from '../features/order-create/ui/OrderDialog.jsx';
import { ChatDialog } from '../features/order-chat/ui/ChatDialog.jsx';
import { ReviewDialog } from '../features/review/ui/ReviewDialog.jsx';
import { AdminDashboardPage } from '../pages/admin/ui/AdminDashboardPage.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [issueDraft, setIssueDraft] = useState({ description: '', categoryId: '' });
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const [revision, setRevision] = useState(0);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const notify = useCallback((message) => {
    setToast(message);
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setToast(''), 3500);
  }, []);

  useEffect(() => {
    request('/api/auth/me')
      .then((auth) => setUser(auth.user))
      .catch((problem) => notify(problem.message))
      .finally(() => setReady(true));
    getCategories().then(setCategories).catch((problem) => notify(problem.message));
  }, [notify]);

  useEffect(() => {
    if (!user) return undefined;
    const timer = window.setInterval(() => {
      if (!document.hidden) setRevision((value) => value + 1);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [user?.id]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  function authenticated(nextUser) {
    setUser(nextUser);
    const requested = location.state?.from;
    navigate(nextUser.role === 'admin' ? '/admin' : nextUser.role === 'master' ? '/orders' : (requested || '/'), { replace: true });
    notify('Akkauntga muvaffaqiyatli kirdingiz.');
  }

  async function logout() {
    try {
      await request('/api/auth/logout', { method: 'POST', body: '{}' });
      setUser(null); setModal(null); navigate('/', { replace: true });
      notify('Akkauntdan chiqdingiz.');
    } catch (problem) { notify(problem.message); }
  }

  function orderCreated(orderId) {
    setModal(null); navigate('/orders'); setRevision((value) => value + 1);
    notify(`Buyurtma #${orderId} yaratildi.`);
  }

  function reviewDone() {
    setModal(null); setRevision((value) => value + 1); notify('Baho va sharh saqlandi.');
  }

  function openOrder(master, draft = issueDraft) {
    if (user?.role === 'customer') {
      setModal({ type: 'order', master, description: draft?.description || '', categoryId: draft?.categoryId || '' });
    } else navigate('/register');
  }

  const openProfile = useCallback((id) => {
    navigate(`/usta/${encodeURIComponent(id)}`);
  }, [navigate]);

  const backOrHome = useCallback(() => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate('/', { replace: true });
  }, [navigate]);

  const pages = useRoutes([
    { path: '/', element: <HomePage user={user} categories={categories} onOrder={openOrder} onIssue={setIssueDraft} onOpenMaster={openProfile} onOpenMap={() => navigate('/map')} onAuth={() => navigate('/register')} /> },
    { path: '/map', element: <MapPage issueDraft={issueDraft} onClearIssue={() => setIssueDraft({ description: '', categoryId: '' })} onBack={backOrHome} onOpenMaster={openProfile} /> },
    { path: '/orders', element: <ProtectedPage ready={ready} user={user} from={location.pathname}><OrdersPage key={user?.id} revision={revision} user={user} categories={categories} onOrder={openOrder} onChat={(order) => setModal({ type: 'chat', order })} onReview={(order) => setModal({ type: 'review', order })} notify={notify} /></ProtectedPage> },
    { path: '/admin', element: <ProtectedPage ready={ready} user={user} role="admin" from={location.pathname}><AdminDashboardPage /></ProtectedPage> },
    { path: '/settings', element: <ProtectedPage ready={ready} user={user} role="master" from={location.pathname}><MasterSettingsPage user={user} categories={categories} onUser={setUser} notify={notify} /></ProtectedPage> },
    { path: '/login', element: <AuthPage key={location.pathname} initialMode="login" categories={categories} onModeChange={(mode) => navigate(mode === 'register' ? '/register' : '/login')} onAuth={authenticated} /> },
    { path: '/register', element: <AuthPage key={location.pathname} initialMode="register" categories={categories} onModeChange={(mode) => navigate(mode === 'register' ? '/register' : '/login')} onAuth={authenticated} /> },
    { path: '/usta/:id', element: <MasterProfileRoute user={user} onBack={backOrHome} onOrder={(master) => openOrder(master, issueDraft)} /> },
    { path: '*', element: <section className="panel"><h1>Sahifa topilmadi</h1><button className="btn" onClick={() => navigate('/')}>Asosiy sahifaga qaytish</button></section> },
  ]);

  return <>
    <Header user={user} loading={!ready} onLogout={logout} onAuth={(mode) => navigate(mode === 'register' ? '/register' : '/login')} />
    <main className="container">{pages}</main>
    {modal?.type === 'order' && <OrderDialog categories={categories} master={modal.master} customer={user} initialDescription={modal.description} initialCategory={modal.categoryId} close={() => setModal(null)} onCreated={orderCreated} />}
    {modal?.type === 'chat' && <ChatDialog order={modal.order} user={user} close={() => setModal(null)} notify={notify} />}
    {modal?.type === 'review' && <ReviewDialog order={modal.order} close={() => setModal(null)} onDone={reviewDone} />}
    <div className={`toast ${toast ? 'show' : ''}`} role="status">{toast}</div>
  </>;
}

function ProtectedPage({ ready, user, role, from, children }) {
  if (!ready) return <div className="empty">Yuklanmoqda…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from }} />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  return children;
}

function MasterProfileRoute({ user, onBack, onOrder }) {
  const { id } = useParams();
  return <MasterProfilePage key={id} masterId={id} user={user} onBack={onBack} onOrder={onOrder} />;
}
