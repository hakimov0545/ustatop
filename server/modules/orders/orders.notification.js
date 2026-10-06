function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char]);
}

async function sendTelegram(chatId, text, context) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`Telegram returned HTTP ${response.status}`);
    const result = await response.json();
    if (!result.ok) throw new Error(result.description || 'Telegram rejected the message');
  } catch (error) {
    // Notification delivery must not undo an order that has already been saved.
    console.error(`Telegram notification failed (${context}):`, error.message);
  }
}

export async function notifyNewOrder(order, customer) {
  if (!customer.telegram_chat_id || customer.telegram_notifications_enabled === false) {
    console.info(`Order notification skipped for customer ${customer.id}: Telegram is not linked or notifications are disabled.`);
    return;
  }
  const text = [
    '<b>Yangi buyurtma yaratildi</b>',
    `Xizmat: ${escapeHtml(order.category_name)}`,
    `Tuman: ${escapeHtml(order.district)}`,
    `Manzil: ${escapeHtml(order.address)}`,
    `Vaqt: ${escapeHtml(order.preferred_time || order.scheduled_at)}`,
    `Muammo: ${escapeHtml(order.description)}`,
    `Buyurtma ID: <code>${escapeHtml(order.id)}</code>`,
  ].join('\n');
  await sendTelegram(customer.telegram_chat_id, text, `new order ${order.id}`);
}

const statusMessages = {
  accepted: 'Usta buyurtmangizni qabul qildi.',
  en_route: 'Usta siz tomonga yo‘lga chiqdi.',
  arrived: 'Usta manzilga yetib keldi.',
  in_progress: 'Buyurtmangiz bo‘yicha ish boshlandi.',
  completed: 'Buyurtmangiz yakunlandi. Xizmatdan baho qoldirishingiz mumkin.',
  cancelled: 'Buyurtmangiz bekor qilindi.',
};

export async function notifyOrderStatus(order, status) {
  if (!statusMessages[status]) return;
  const customer = await (await getCollection('users')).findOne({ id: order.customer_id, role: 'customer' });
  if (!customer?.telegram_chat_id || customer.telegram_notifications_enabled === false) return;
  const text = [
    `<b>${escapeHtml(statusMessages[status])}</b>`,
    `Xizmat: ${escapeHtml(order.category_name)}`,
    order.master_name ? `Usta: ${escapeHtml(order.master_name)}` : '',
    `Buyurtma ID: <code>${escapeHtml(order.id)}</code>`,
  ].filter(Boolean).join('\n');
  await sendTelegram(customer.telegram_chat_id, text, `order ${order.id} status ${status}`);
}
