import { Router } from 'express';
import { paymentInstructions } from '../controllers/payment.controller.js';

const router = Router();
router.get('/instructions', paymentInstructions);
export default router;
