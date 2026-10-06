import { useCallback, useEffect, useState } from "react";
import { request } from "../../../shared/api/client.js";

export function TelegramSettings() {
  const [state, setState] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setState(await request("/api/telegram/status"));
      setError("");
    } catch (problem) {
      setError(problem.message);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  async function connect() {
    setError("");
    const tab = window.open("about:blank", "_blank");
    try {
      const result = await request("/api/telegram/link", { method: "POST", body: "{}" });
      if (tab) tab.location.href = result.url;
      else window.location.href = result.url;
    } catch (problem) {
      tab?.close();
      setError(problem.message);
    }
  }

  async function setNotifications(enabled) {
    setSaving(true);
    setError("");
    try {
      const result = await request("/api/telegram/preferences", {
        method: "PATCH",
        body: JSON.stringify({ enabled }),
      });
      setState((current) => ({ ...current, ...result }));
    } catch (problem) {
      setError(problem.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel telegram-settings" aria-label="Telegram sozlamalari">
      <div className="telegram-settings-copy">
        <span className="kicker">TELEGRAM BILDIRISHNOMALARI</span>
        <h2>{state?.linked ? "Telegram ulangan ✓" : "Telegram ulanmagan"}</h2>
        <p>
          {state?.linked
            ? "Buyurtma yaratilishi va uning holati o‘zgarganda xabar olasiz."
            : "Buyurtma va usta holati haqida xabar olish uchun Telegram botni ulang."}
        </p>
      </div>
      <div className="telegram-settings-actions">
        {state?.linked ? (
          <label className="telegram-toggle">
            <input
              type="checkbox"
              checked={state.notifications_enabled}
              disabled={saving}
              onChange={(event) => setNotifications(event.target.checked)}
            />
            <span>Telegram xabarlarini olish</span>
          </label>
        ) : (
          <button className="btn small" onClick={connect} disabled={!state?.bot_username}>
            {state?.bot_username ? `✈ @${state.bot_username} botini ulash` : "Bot sozlanmagan"}
          </button>
        )}
        {state?.linked && state?.bot_username && (
          <span className="subtle">Bot: @{state.bot_username}</span>
        )}
      </div>
      {error && <p className="form-error telegram-settings-error">{error}</p>}
    </section>
  );
}
