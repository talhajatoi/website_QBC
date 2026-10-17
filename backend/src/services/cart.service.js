import { Cart } from '../models/cart.model.js';
import { Product } from '../models/product.model.js';
import { ApiError } from '../utils/ApiError.js';
import { generateSecret, hashSecret } from '../utils/generateOrderNumber.js';

export const validateOptions = (product, options = {}) => { if (options.size && !product.sizes.includes(options.size)) throw new ApiError(422, 'Selected size is unavailable'); if (options.color && !product.colors.includes(options.color)) throw new ApiError(422, 'Selected color is unavailable'); };
export const readCartToken = (req) => req.get('x-cart-token') || '';
export const findCart = async (token) => { if (!/^[a-f0-9]{64}$/i.test(token)) throw new ApiError(401, 'A valid guest cart token is required'); const cart = await Cart.findOne({ tokenHash: hashSecret(token) }).populate('items.product'); if (!cart) throw new ApiError(404, 'Cart not found'); return cart; };
export const cartView = (cart) => { let subtotal = 0; const items = cart.items.map((item) => { const product = item.product; if (!product || !product.isAvailable) return { id: item._id, unavailable: true, quantity: item.quantity }; const unitPrice = product.salePrice ?? product.price; const lineTotal = unitPrice * item.quantity; subtotal += lineTotal; return { id: item._id, productId: product.id, name: product.name, sku: product.sku, image: product.images[0] || null, selectedOptions: item.selectedOptions, quantity: item.quantity, unitPrice, lineTotal, availableStock: product.stockQuantity }; }); return { id: cart.id, items, subtotal, total: subtotal, updatedAt: cart.updatedAt }; };
export const newCart = async () => { const token = generateSecret(); const cart = await Cart.create({ tokenHash: hashSecret(token), items: [] }); return { cart, token }; };
