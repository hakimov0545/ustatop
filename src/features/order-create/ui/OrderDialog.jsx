import { useEffect, useState } from "react";
import { createOrder } from "../../../entities/order/api/orderApi.js";
import { suggestCategory } from "../../../entities/category/api/categoryApi.js";
import { request } from "../../../shared/api/client.js";
import { requestLocation } from "../../../shared/lib/geo.js";
import { uploadMedia } from "../../../shared/lib/upload.js";
import { dateTime, money } from "../../../shared/lib/format.js";
import { CategorySelect, DistrictSelect } from "../../../shared/ui/Selects.jsx";
import { Field } from "../../../shared/ui/Field.jsx";
import { Modal } from "../../../shared/ui/Modal.jsx";

export function OrderDialog({
  categories,
  master,
  customer,
  close,
  onCreated,
  initialDescription = "",
  initialCategory = "",
}) {
  const [description, setDescription] = useState(initialDescription);
  const [category, setCategory] = useState(
    master ? String(master.category_id) : initialCategory,
  );
  const [choices, setChoices] = useState([]);
  const [suggestion, setSuggestion] = useState("");
  const [point, setPoint] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [telegramBot, setTelegramBot] = useState("");
  const [telegramError, setTelegramError] = useState("");
  useEffect(() => {
    let active = true;
    async function refreshTelegram() {
      try {
        const status = await request("/api/telegram/status");
        if (active) { setTelegramLinked(status.linked); setTelegramBot(status.bot_username); }
      } catch {}
    }
    refreshTelegram();
    const timer = window.setInterval(refreshTelegram, 2500);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  async function linkTelegram() {
    setTelegramError("");
    const telegramTab = window.open("about:blank", "_blank");
    try {
      const link = await request("/api/telegram/link", { method: "POST", body: "{}" });
      if (telegramTab) telegramTab.location.href = link.url;
      else window.location.href = link.url;
    } catch (problem) { telegramTab?.close(); setTelegramError(problem.message); }
  }
  useEffect(() => {
    if (description.trim().length < 5) return;
    const timer = setTimeout(async () => {
      try {
        const result = await suggestCategory(description);
        setChoices(result.suggestions);
        if (!category && result.suggestions.length) {
          setCategory(String(result.suggestions[0].id));
          setSuggestion(result.suggestions[0].name);
        }
      } catch {}
    }, 350);
    return () => clearTimeout(timer);
  }, [description, category]);
  async function locate() {
    try {
      setPoint(await requestLocation());
      setError("");
    } catch (problem) {
      setError(problem.message);
    }
  }
  async function submit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    try {
      const scheduled = new Date(values.scheduled_at);
      values.scheduled_at = scheduled.toISOString();
      values.preferred_time = dateTime(values.scheduled_at);
      values.category_id = category;
      if (point) Object.assign(values, point);
      if (master) values.master_id = master.id;
      const order = await createOrder(values);
      const files = Array.from(form.elements.attachments.files || []);
      for (const file of files) {
        const attachment = await uploadMedia(file, {
          userId: customer.id,
          context: "order",
          orderId: order.id,
        });
        await request(`/api/orders/${order.id}/messages`, {
          method: "POST",
          body: JSON.stringify({
            body: "Buyurtma uchun rasm/video",
            attachment,
          }),
        });
      }
      onCreated(order.id);
    } catch (problem) {
      setError(problem.message);
    } finally {
      setSubmitting(false);
    }
  }
  const minDate = new Date(Date.now() + 30 * 60 * 1000);
  minDate.setMinutes(Math.ceil(minDate.getMinutes() / 15) * 15, 0, 0);
  const minLocal = new Date(
    minDate.getTime() - minDate.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 16);
  return (
    <Modal close={close}>
      <div className="dialog-head">
        <div>
          <span className="kicker">BUYURTMA · BAND QILISH</span>
          <h2 className="page-title">Muammoni va vaqtni kiriting</h2>
        </div>
        <button className="close" onClick={close}>
          ×
        </button>
      </div>
      {master && (
        <div className="selected-master">
          <b>{master.name}</b>
          <span>
            {master.category} · {master.district} ·{" "}
            {master.price_min
              ? `${money(master.price_min)}–${money(master.price_max)} so‘m`
              : ""}
          </span>
        </div>
      )}
      <form onSubmit={submit}>
        <div className="panel telegram-link-panel">
          <b>{telegramLinked ? "✓ Telegram ulangan" : "Telegram orqali xabar olish"}</b>
          <p>{telegramLinked ? "Buyurtma va holat yangiliklari Telegramingizga yuboriladi." : "Buyurtma xabarini o‘z Telegramingizda olish uchun botni bir marta ishga tushiring."}</p>
          {!telegramLinked && <button type="button" className="btn outline small" onClick={linkTelegram} disabled={!telegramBot}>✈ {telegramBot ? `@${telegramBot} botini ulash` : "Telegram bot sozlanmagan"}</button>}
          {telegramError && <p className="form-error">{telegramError}</p>}
        </div>
        <Field label="Muammo">
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            name="description"
            minLength="8"
            maxLength="3000"
            required
            placeholder="Muammoni oddiy tilda yozing. Masalan: Стиральная машина не включается"
          />
        </Field>
        <Field label="Xizmat kategoriyasi">
          <CategorySelect
            categories={categories}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          />
        </Field>
        {choices.length > 0 && (
          <div className="suggestion">
            Tavsiya:{" "}
            {choices.map((item) => (
              <button
                type="button"
                className={
                  String(item.id) === category
                    ? "suggestion-chip active"
                    : "suggestion-chip"
                }
                key={item.id}
                onClick={() => {
                  setCategory(String(item.id));
                  setSuggestion(item.name);
                }}
              >
                {item.icon} {item.name}
              </button>
            ))}
          </div>
        )}
        {suggestion && (
          <p className="subtle">
            Tizim mos xizmatni taklif qildi. Kategoriyani xohlasangiz
            o‘zgartiring.
          </p>
        )}
        <div className="field-row">
          <Field label="Tuman">
            <DistrictSelect value={master?.district || customer.district} />
          </Field>
          <Field label="Aniq manzil">
            <input
              name="address"
              required
              minLength="3"
              maxLength="300"
              placeholder="Ko‘cha, uy, xonadon"
            />
          </Field>
        </div>
        <Field label="Usta keladigan sana va vaqt">
          <input
            name="scheduled_at"
            type="datetime-local"
            required
            min={minLocal}
          />
        </Field>
        <Field
          label="Muammo rasmi yoki videosi"
          hint="(ixtiyoriy · 50 MB gacha)"
        >
          <input
            name="attachments"
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
            multiple
          />
        </Field>
        <button
          className="btn outline small location-button"
          type="button"
          onClick={locate}
        >
          ⌖{" "}
          {point
            ? "Manzil koordinatasi olindi"
            : "Joriy joylashuvni qo‘shish (ixtiyoriy)"}
        </button>
        {error && <p className="form-error">{error}</p>}
        <button className="btn full" disabled={submitting}>
          {submitting ? "Yuborilmoqda…" : "Buyurtmani band qilish ↗"}
        </button>
      </form>
      <p className="note">
        {master
          ? "Tavsif, sana-vaqt va manzil tanlangan ustaga yuboriladi."
          : "Ochiq so‘rovni mos xizmatdagi ustalar ko‘radi; ko‘cha manzili usta qabul qilgandan keyin ochiladi."}
      </p>
    </Modal>
  );
}
