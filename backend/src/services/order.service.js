import { Product } from '../models/product.model.js';
import { ApiError } from '../utils/ApiError.js';
import { validateOptions } from './cart.service.js';

export const makeOrderItemsAndReserveStock = async (requestedItems) => {
  const merged = new Map();
  for (const item of requestedItems) { const key = `${item.productId}:${item.selectedOptions.size || ''}:${item.selectedOptions.color || ''}`; const existing = merged.get(key); if (existing) existing.quantity += item.quantity; else merged.set(key, { ...item, selectedOptions: { size: item.selectedOptions.size || '', color: item.selectedOptions.color || '' } }); }
  const items = []; const reserved = [];
  try {
    for (const request of merged.values()) {
      const product = await Product.findById(request.productId);
      if (!product || !product.isAvailable) throw new ApiError(422, 'One or more products are unavailable');
      validateOptions(product, request.selectedOptions);
      const decremented = await Product.findOneAndUpdate({ _id: product._id, isAvailable: true, stockQuantity: { $gte: request.quantity } }, { $inc: { stockQuantity: -request.quantity } }, { returnDocument: 'after' });
      if (!decremented) throw new ApiError(422, `Insufficient stock for ${product.name}`);
      reserved.push({ product: product._id, quantity: request.quantity });
      const unitPrice = product.salePrice ?? product.price;
      items.push({ product: product._id, name: product.name, sku: product.sku, selectedOptions: request.selectedOptions, quantity: request.quantity, unitPrice, lineTotal: unitPrice * request.quantity });
    }
    return { items, reserved };
  } catch (error) { await Promise.all(reserved.map((entry) => Product.updateOne({ _id: entry.product }, { $inc: { stockQuantity: entry.quantity } }))); throw error; }
};
export const releaseStock = (items) => Promise.all(items.map((item) => Product.updateOne({ _id: item.product }, { $inc: { stockQuantity: item.quantity } })));
export const canTransition = (from, to) => ({ pending_confirmation: ['confirmed', 'cancelled', 'failed'], confirmed: ['processing', 'cancelled', 'failed'], processing: ['shipped', 'cancelled', 'failed'], shipped: ['delivered'], delivered: [], cancelled: [], failed: [] }[from] || []).includes(to);
