export async function request(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
  });
  const data = await response
    .json()
    .catch(() => ({ error: "Server javobi o‘qilmadi." }));
  if (!response.ok) throw new Error(data.error || "So‘rov bajarilmadi.");
  return data;
}
export const jsonBody = (value) => JSON.stringify(value);
