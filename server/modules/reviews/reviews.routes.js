import { Router } from 'express';
import { create } from './reviews.controller.js';
import { authenticated } from '../../shared/middleware.js';
export const reviewsRouter=Router({mergeParams:true});
reviewsRouter.use(authenticated);
reviewsRouter.post('/',create);
