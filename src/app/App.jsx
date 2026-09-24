import { useCallback, useEffect, useState } from "react";
import { request } from "../shared/api/client.js";
import { getCategories } from "../entities/category/api/categoryApi.js";
import { Header } from "../widgets/header/ui/Header.jsx";
import { HomePage } from "../pages/home/ui/HomePage.jsx";
import { OrdersPage } from "../pages/orders/ui/OrdersPage.jsx";
import { MasterProfilePage } from "../pages/master-profile/ui/MasterProfilePage.jsx";
import { MasterSettingsPage } from "../pages/master-settings/ui/MasterSettingsPage.jsx";
import { AuthPage } from "../features/auth/ui/AuthPage.jsx";
import { OrderDialog } from "../features/order-create/ui/OrderDialog.jsx";
import { ChatDialog } from "../features/order-chat/ui/ChatDialog.jsx";
import { ReviewDialog } from "../features/review/ui/ReviewDialog.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState("home");
  const [authMode, setAuthMode] = useState("login");
  const [masterId, setMasterId] = useState(null);
  const [issueDraft, setIssueDraft] = useState({
    description: "",
    categoryId: "",
  });
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [revision, setRevision] = useState(0);
  const [ready, setReady] = useState(false);
  const notify = useCallback((message) => {
    setToast(message);
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setToast(""), 3500);
  }, []);
  useEffect(() => {
    Promise.all([request("/api/auth/me"), getCategories()])
      .then(([auth, cats]) => {
        setUser(auth.user);
        setCategories(cats);
      })
      .catch((problem) => notify(problem.message))
      .finally(() => setReady(true));
  }, [notify]);
  useEffect(() => {
    if (!user) return undefined;
    const timer = window.setInterval(() => {
      if (!document.hidden) setRevision((value) => value + 1);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [user?.id]);
  function authenticated(nextUser) {
    setUser(nextUser);
    setPage(nextUser.role === "master" ? "orders" : "home");
    notify("Akkauntga muvaffaqiyatli kirdingiz.");
  }
  async function logout() {
    try {
      await request("/api/auth/logout", { method: "POST", body: "{}" });
      setUser(null);
      setPage("home");
      setModal(null);
      notify("Akkauntdan chiqdingiz.");
    } catch (problem) {
      notify(problem.message);
    }
  }
  function orderCreated(orderId) {
    setModal(null);
    setPage("orders");
    setRevision((value) => value + 1);
    notify(`Buyurtma #${orderId} yaratildi.`);
  }
  function reviewDone() {
    setModal(null);
    setRevision((value) => value + 1);
    notify("Baho va sharh saqlandi.");
  }
  function openOrder(master, draft = issueDraft) {
    if (user?.role === "customer")
      setModal({
        type: "order",
        master,
        description: draft?.description || "",
        categoryId: draft?.categoryId || "",
      });
    else {
      setAuthMode("register");
      setPage("auth");
    }
  }
  function openProfile(id) {
    setMasterId(id);
    setPage("master");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (!ready)
    return (
      <main className="container">
        <div className="loading">UstaTop yuklanmoqda…</div>
      </main>
    );
  return (
    <>
      <Header
        user={user}
        page={page}
        setPage={setPage}
        onLogout={logout}
        onAuth={(mode) => {
          setAuthMode(mode);
          setPage("auth");
        }}
      />
      <main className="container">
        {page === "auth" ? (
          <AuthPage
            key={authMode}
            initialMode={authMode}
            categories={categories}
            onAuth={authenticated}
          />
        ) : page === "orders" && user ? (
          <OrdersPage
            key={user.id}
            revision={revision}
            user={user}
            categories={categories}
            onOrder={openOrder}
            onChat={(order) => setModal({ type: "chat", order })}
            onReview={(order) => setModal({ type: "review", order })}
            notify={notify}
          />
        ) : page === "settings" && user?.role === "master" ? (
          <MasterSettingsPage
            user={user}
            categories={categories}
            onUser={setUser}
            notify={notify}
          />
        ) : page === "master" ? (
          <MasterProfilePage
            masterId={masterId}
            user={user}
            onBack={() => setPage("home")}
            onOrder={(master) => openOrder(master, issueDraft)}
          />
        ) : (
          <HomePage
            user={user}
            categories={categories}
            onOrder={openOrder}
            onIssue={setIssueDraft}
            onOpenMaster={openProfile}
            onAuth={() => {
              setAuthMode("register");
              setPage("auth");
            }}
          />
        )}
      </main>
      {modal?.type === "order" && (
        <OrderDialog
          categories={categories}
          master={modal.master}
          customer={user}
          initialDescription={modal.description}
          initialCategory={modal.categoryId}
          close={() => setModal(null)}
          onCreated={orderCreated}
        />
      )}{" "}
      {modal?.type === "chat" && (
        <ChatDialog
          order={modal.order}
          user={user}
          close={() => setModal(null)}
          notify={notify}
        />
      )}{" "}
      {modal?.type === "review" && (
        <ReviewDialog
          order={modal.order}
          close={() => setModal(null)}
          onDone={reviewDone}
        />
      )}
      <div className={`toast ${toast ? "show" : ""}`} role="status">
        {toast}
      </div>
    </>
  );
}
