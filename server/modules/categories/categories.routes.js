import { Router } from 'express';
import * as service from './categories.service.js';
export const categoriesRouter=Router();
categoriesRouter.get('/',async(_req,res)=>res.json(await service.categories()));
categoriesRouter.post('/suggest',async(req,res)=>res.json(await service.suggest(req.body.description)));
