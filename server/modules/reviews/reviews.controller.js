import { submit } from './reviews.service.js';
export const create=async(req,res)=>res.status(201).json(await submit(req.user,req.params.id,req.body));
