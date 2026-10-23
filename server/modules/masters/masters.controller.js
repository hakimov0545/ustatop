import { del } from '@vercel/blob';
import * as service from './masters.service.js';
import { requireUser } from '../../shared/auth.js';
import { validateBlobFile } from '../../shared/blob.js';
import { httpError } from '../../shared/errors.js';
import * as adminRepository from '../admin/admin.repository.js';

export const list = async (req, res) => {
  const result = await service.list(req.query);
  const categoryId = /^\d+$/.test(String(req.query.category || '')) ? Number(req.query.category) : null;
  const district = String(req.query.district || '').trim().slice(0, 100) || null;
  try { await adminRepository.recordSearch({ categoryId, district }); } catch { /* analytics must not block the service if storage is unavailable */ }
  res.json(result);
};
export const profile = async (req, res) => {
  const result = await service.getProfile(req.params.id);
  try { await adminRepository.recordMasterView(req.params.id); } catch { /* analytics must not block the profile if storage is unavailable */ }
  res.json(result);
};
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
