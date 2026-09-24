import { Router } from 'express';
import * as controller from './messages.controller.js';
import { authenticated } from '../../shared/middleware.js';
export const messagesRouter=Router({mergeParams:true});
messagesRouter.use(authenticated);
messagesRouter.get('/',controller.list);
messagesRouter.post('/',controller.ensureParticipant,controller.create);
