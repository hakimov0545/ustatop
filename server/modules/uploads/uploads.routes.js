import { Router } from 'express';
import { createUpload } from './uploads.controller.js';
import { authenticated } from '../../shared/middleware.js';

export const uploadsRouter = Router();
uploadsRouter.post('/', authenticated, createUpload);
