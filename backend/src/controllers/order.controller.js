import { Order } from '../models/order.model.js';
import { Product } from '../models/product.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateOrderNumber, generateSecret, hashSecret } from '../utils/generateOrderNumber.js';
import { canTransition, makeOrderItemsAndReserveStock, releaseStock } from '../services/order.service.js';
import { whatsappUrlForOrder } from '../services/whatsapp.service.js';
import { getBankTransferPaymentInstructions, getCodAdvancePaymentInstructions } from '../services/payment.service.js';
import { env } from '../config/env.js';

export const createOrder = asyncHandler(async (req, res) => {
  const idempotencyKey = req.get('idempotency-key');
  if (idempotencyKey && !/^[A-Za-z0-9_-]{16,200}$/.test(idempotencyKey)) throw new ApiError(422, 'Invalid Idempotency-Key header');
  if (idempotencyKey && await Order.exists({ idempotencyKey })) throw new ApiError(409, 'This checkout request has already been processed');
  if (req.body.paymentMethod === 'bank_transfer' && !getBankTransferPaymentInstructions().length) throw new ApiError(503, 'Bank transfer payment details are not configured');
  const { items, reserved } = await makeOrderItemsAndReserveStock(req.body.items);
  try {
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const deliveryCharge = env.DELIVERY_CHARGE_PKR;
    const grandTotal = subtotal + deliveryCharge;
    const isCashOnDelivery = req.body.paymentMethod === 'cash_on_delivery';
    const advancePaymentAmount = isCashOnDelivery ? Math.round(subtotal * 0.2) : 0;
    const cashOnDeliveryAmount = isCashOnDelivery ? grandTotal - advancePaymentAmount : 0;
    const accessToken = generateSecret();
    const order = await Order.create({ orderNumber: generateOrderNumber(), accessTokenHash: hashSecret(accessToken), ...(idempotencyKey && { idempotencyKey }), customer: { ...req.body.customer, whatsapp: req.body.customer.whatsapp.replace(/[\s-]/g, '') }, items, subtotal, deliveryCharge, grandTotal, advancePaymentAmount, cashOnDeliveryAmount, advancePaymentStatus: isCashOnDelivery ? 'pending' : 'not_required', paymentStatus: isCashOnDelivery ? 'pending' : 'unpaid', paymentMethod: req.body.paymentMethod, customerNotes: req.body.customerNotes, attribution: req.body.attribution });
    const whatsappUrl = whatsappUrlForOrder(order);
    order.whatsappLinkGeneratedAt = new Date(); await order.save();
    const paymentInstructions = isCashOnDelivery
      ? getCodAdvancePaymentInstructions()
      : order.paymentMethod === 'bank_transfer' ? getBankTransferPaymentInstructions() : null;
    res.status(201).json({ success: true, message: 'Order created. It is pending manual confirmation.', data: { order: { orderNumber: order.orderNumber, status: order.status, paymentMethod: order.paymentMethod, subtotal: order.subtotal, deliveryCharge: order.deliveryCharge, grandTotal: order.grandTotal, advancePaymentAmount: order.advancePaymentAmount, cashOnDeliveryAmount: order.cashOnDeliveryAmount, advancePaymentStatus: order.advancePaymentStatus }, paymentInstructions, orderAccessToken: accessToken, whatsappUrl } });
  } catch (error) { await Promise.all(reserved.map((entry) => Product.updateOne({ _id: entry.product }, { $inc: { stockQuantity: entry.quantity } }))); throw error; }
});
export const publicOrder = asyncHandler(async (req, res) => { const accessToken = req.get('x-order-access-token') || ''; if (!/^[a-f0-9]{64}$/i.test(accessToken)) throw new ApiError(401, 'A valid order access token is required'); const order = await Order.findOne({ orderNumber: req.params.orderNumber, accessTokenHash: hashSecret(accessToken) }).select('-accessTokenHash -internalNotes -attribution'); if (!order) throw new ApiError(404, 'Order not found'); const paymentInstructions = order.paymentMethod === 'cash_on_delivery' ? getCodAdvancePaymentInstructions() : order.paymentMethod === 'bank_transfer' ? getBankTransferPaymentInstructions() : null; res.json({ success: true, message: 'Order retrieved successfully', data: { order, paymentInstructions } }); });
export const adminOrders = asyncHandler(async (req, res) => { const query = req.validatedQuery; const filter = query.status ? { status: query.status } : {}; const [orders, total] = await Promise.all([Order.find(filter).select('-accessTokenHash').sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit), Order.countDocuments(filter)]); res.json({ success: true, message: 'Orders retrieved successfully', data: { orders, pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } } }); });
export const adminOrder = asyncHandler(async (req, res) => { const order = await Order.findById(req.params.id).select('-accessTokenHash'); if (!order) throw new ApiError(404, 'Order not found'); res.json({ success: true, message: 'Order retrieved successfully', data: { order } }); });
export const updateOrderStatus = asyncHandler(async (req, res) => { const order = await Order.findById(req.params.id); if (!order) throw new ApiError(404, 'Order not found'); if (!canTransition(order.status, req.body.status)) throw new ApiError(422, `Invalid order status transition from ${order.status} to ${req.body.status}`); const updatedOrder = await Order.findOneAndUpdate({ _id: order._id, status: order.status }, { status: req.body.status }, { returnDocument: 'after', runValidators: true }).select('-accessTokenHash'); if (!updatedOrder) throw new ApiError(422, 'Order status changed while processing the request. Refresh and try again.'); if (['cancelled', 'failed'].includes(req.body.status)) await releaseStock(updatedOrder.items); res.json({ success: true, message: 'Order status updated successfully', data: { order: updatedOrder } }); });
export const updatePaymentStatus = asyncHandler(async (req, res) => { const order = await Order.findByIdAndUpdate(req.params.id, { paymentStatus: req.body.paymentStatus }, { returnDocument: 'after', runValidators: true }).select('-accessTokenHash'); if (!order) throw new ApiError(404, 'Order not found'); res.json({ success: true, message: 'Payment status updated successfully', data: { order } }); });
export const updateAdvancePaymentStatus = asyncHandler(async (req, res) => { const order = await Order.findById(req.params.id); if (!order) throw new ApiError(404, 'Order not found'); if (order.paymentMethod !== 'cash_on_delivery') throw new ApiError(422, 'Advance payment status only applies to cash-on-delivery orders'); order.advancePaymentStatus = req.body.advancePaymentStatus; await order.save(); res.json({ success: true, message: 'Advance payment status updated successfully', data: { order } }); });
export const updateNotes = asyncHandler(async (req, res) => { const order = await Order.findByIdAndUpdate(req.params.id, { internalNotes: req.body.internalNotes }, { returnDocument: 'after', runValidators: true }).select('-accessTokenHash'); if (!order) throw new ApiError(404, 'Order not found'); res.json({ success: true, message: 'Order notes updated successfully', data: { order } }); });
