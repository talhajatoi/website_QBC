import { asyncHandler } from '../utils/asyncHandler.js';
import { Product } from '../models/product.model.js';
import { Order } from '../models/order.model.js';
export const dashboardSummary = asyncHandler(async (req, res) => { const [products, pendingOrders] = await Promise.all([Product.countDocuments(), Order.countDocuments({ status: 'pending_confirmation' })]); res.json({ success: true, message: 'Admin summary retrieved successfully', data: { products, pendingOrders } }); });
