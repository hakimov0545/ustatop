import { Router } from 'express';
import * as controller from './auth.controller.js';
export const authRouter=Router();
authRouter.post('/register',controller.register);
authRouter.post('/login',controller.login);
authRouter.post('/logout',controller.logout);
authRouter.get('/me',controller.me);
