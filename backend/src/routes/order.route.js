import { Router } from 'express';
import { createOrder, publicOrder } from '../controllers/order.controller.js';
import { publicWriteLimiter } from '../middleware/rateLimit.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { orderCreateSchema } from '../validators/order.validator.js';
const router = Router();
router.post('/', publicWriteLimiter, validate(orderCreateSchema), createOrder);
router.get('/:orderNumber', publicOrder);
export default router;
