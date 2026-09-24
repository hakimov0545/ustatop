import { Router } from 'express';
import * as controller from './masters.controller.js';
import { authenticated } from '../../shared/middleware.js';
export const mastersRouter=Router();
mastersRouter.get('/',controller.list);
mastersRouter.get('/:id',controller.profile);
mastersRouter.patch('/me/profile',controller.accessMaster,controller.update);
mastersRouter.post('/me/portfolio',authenticated,controller.portfolioUpload);
mastersRouter.delete('/me/portfolio/:mediaId',controller.accessPortfolio,controller.portfolioDelete);
