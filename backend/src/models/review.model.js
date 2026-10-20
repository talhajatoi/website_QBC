import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  displayName: { type: String, required: true, trim: true, maxlength: 80 },
  rating: { type: Number, required: true, min: 1, max: 5 },
  text: { type: String, required: true, trim: true, maxlength: 3000 },
  reviewDate: { type: Date },
  imageUrl: { type: String, trim: true, default: '' },
  verifiedPurchase: { type: Boolean, default: false },
  status: { type: String, enum: ['published', 'hidden'], default: 'hidden', index: true },
  isDemo: { type: Boolean, default: false, index: true },
  helpfulCount: { type: Number, default: 0, min: 0 },
}, { timestamps: true });
reviewSchema.index({ product: 1, status: 1, isDemo: 1, rating: -1, helpfulCount: -1, reviewDate: -1 });
export const Review = mongoose.model('Review', reviewSchema);
