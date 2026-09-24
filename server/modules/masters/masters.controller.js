import { del } from '@vercel/blob';
import * as service from './masters.service.js';
import { requireUser } from '../../shared/auth.js';
import { validateBlobFile } from '../../shared/blob.js';
import { httpError } from '../../shared/errors.js';

export const list = async (req, res) => res.json(await service.list(req.query));
export const profile = async (req, res) => res.json(await service.getProfile(req.params.id));
export const update = async (req, res) => res.json({ user: await service.update(req.user, req.body) });
export const portfolioUpload = async (req, res) => {
  requireUser(req, 'master');
  const file = validateBlobFile(req.user, req.body.file, 'portfolio');
  res.status(201).json(await service.addPortfolioItem(req.user, file, req.body.caption));
};
export const portfolioDelete = async (req, res) => {
  const existing = await service.deletePortfolioItem(req.user, req.params.mediaId);
  try { await del(existing.url); } catch (error) { if (error.status !== 404) throw error; }
  res.json({ ok: true });
};
export function accessMaster(req, _res, next) { try { requireUser(req, 'master'); next(); } catch (error) { next(error); } }
export function accessPortfolio(req, _res, next) { try { requireUser(req, 'master'); next(); } catch (error) { next(error); } }
