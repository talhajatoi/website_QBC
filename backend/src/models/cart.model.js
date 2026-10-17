import mongoose from 'mongoose';
const cartSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true, index: true },
  items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, quantity: { type: Number, required: true, min: 1 }, selectedOptions: { size: { type: String, default: '' }, color: { type: String, default: '' } } }],
}, { timestamps: true });
cartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });
export const Cart = mongoose.model('Cart', cartSchema);
