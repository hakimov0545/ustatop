import { Router } from 'express';
import { authenticated } from '../../shared/middleware.js';
import * as service from './telegram.service.js';

export const telegramRouter = Router();
telegramRouter.post('/webhook', async (req, res, next) => {
  if (!process.env.TELEGRAM_WEBHOOK_SECRET || req.get('x-telegram-bot-api-secret-token') !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return res.sendStatus(403);
  }
  try { await service.handleUpdate(req.body); res.sendStatus(200); } catch (error) { next(error); }
});
telegramRouter.get('/status', authenticated, async (req, res) => res.json(await service.status(req.user)));
telegramRouter.post('/link', authenticated, async (req, res) => res.json(await service.createLink(req.user)));
