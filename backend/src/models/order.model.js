import mongoose from 'mongoose';
const itemSchema = new mongoose.Schema({ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, name: String, sku: String, selectedOptions: { size: String, color: String }, quantity: Number, unitPrice: Number, lineTotal: Number }, { _id: false });
const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, index: true }, accessTokenHash: { type: String, required: true, select: false }, idempotencyKey: { type: String, sparse: true, unique: true, index: true },
  customer: { name: { type: String, required: true }, whatsapp: { type: String, required: true }, address: { type: String, required: true } },
  items: { type: [itemSchema], validate: [(value) => value.length > 0, 'Order requires at least one item'] },
  subtotal: { type: Number, required: true, min: 0 }, deliveryCharge: { type: Number, required: true, min: 0 }, discount: { type: Number, default: 0, min: 0 }, grandTotal: { type: Number, required: true, min: 0 },
  advancePaymentAmount: { type: Number, default: 0, min: 0 }, cashOnDeliveryAmount: { type: Number, default: 0, min: 0 }, advancePaymentStatus: { type: String, enum: ['not_required', 'pending', 'paid'], default: 'not_required' },
  status: { type: String, enum: ['pending_confirmation', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'failed'], default: 'pending_confirmation', index: true },
  paymentMethod: { type: String, enum: ['cash_on_delivery', 'bank_transfer', 'other'], default: 'cash_on_delivery' }, paymentStatus: { type: String, enum: ['unpaid', 'pending', 'paid', 'refunded', 'failed'], default: 'unpaid' },
  customerNotes: { type: String, trim: true, maxlength: 2000, default: '' }, internalNotes: { type: String, trim: true, maxlength: 5000, default: '' }, whatsappLinkGeneratedAt: Date,
  attribution: { utm_source: String, utm_medium: String, utm_campaign: String, utm_content: String, fbclid: String, ig_source: String },
}, { timestamps: true });
orderSchema.index({ createdAt: -1 });
export const Order = mongoose.model('Order', orderSchema);
