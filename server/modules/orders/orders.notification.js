function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char]);
}

export async function notifyNewOrder(order, customer) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = customer.telegram_chat_id;
  if (!token || !chatId) {
    console.info(`Order notification skipped for customer ${customer.id}: Telegram is not linked.`);
    return;
  }

  const text = [
    '<b>Yangi buyurtma</b>',
    `Mijoz: ${escapeHtml(customer.name)}`,
    `Telefon: ${escapeHtml(customer.phone)}`,
    `Xizmat: ${escapeHtml(order.category_name)}`,
    `Tuman: ${escapeHtml(order.district)}`,
    `Manzil: ${escapeHtml(order.address)}`,
    `Vaqt: ${escapeHtml(order.preferred_time || order.scheduled_at)}`,
    `Muammo: ${escapeHtml(order.description)}`,
    `Buyurtma ID: <code>${escapeHtml(order.id)}</code>`,
  ].join('\n');

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
    console.error('Order notification failed:', error.message);
  }
}
