import * as service from './messages.service.js';
export const list = async (req, res) => res.json(await service.list(req.user, req.params.id));
export const create = async (req, res) => res.status(201).json(await service.create(req.user, req.params.id, req.body.body, req.body.attachment));
export async function ensureParticipant(req, _res, next) { try { await service.list(req.user, req.params.id); next(); } catch (error) { next(error); } }
