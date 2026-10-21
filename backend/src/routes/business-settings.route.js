import { Router } from 'express';
import { getPublicBusinessSettings } from '../controllers/business-settings.controller.js';

const router = Router();
router.get('/', getPublicBusinessSettings);
export default router;
