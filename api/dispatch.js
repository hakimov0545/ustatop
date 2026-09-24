import app from '../server/app.js';

export default function dispatch(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const route = url.searchParams.get('__route');
  if (!route) return res.status(400).json({ error: 'API manzili noto‘g‘ri.' });

  url.searchParams.delete('__route');
  req.url = `/api/${route}${url.search}`;
  return app(req, res);
}
