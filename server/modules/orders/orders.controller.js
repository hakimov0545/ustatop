import * as service from './orders.service.js';
export const list=async(req,res)=>res.json(await service.list(req.user));
export const incoming=async(req,res)=>res.json(await service.incoming(req.user));
export const detail=async(req,res)=>res.json(await service.detail(req.user,req.params.id));
export const create=async(req,res)=>res.status(201).json(await service.create(req.user,req.body));
export const updateStatus=async(req,res)=>res.json(await service.changeStatus(req.user,req.params.id,req.body.status));
