import { requireUser } from '../../shared/auth.js';
import * as repository from './admin.repository.js';

export async function dashboard(req, res) {
  requireUser(req, 'admin');
  const days = [7, 30, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 30;
  res.json(await repository.dashboard(days));
}
