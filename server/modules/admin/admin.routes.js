import { Router } from 'express';
import * as controller from './admin.controller.js';

export const adminRouter = Router();
adminRouter.get('/dashboard', controller.dashboard);
