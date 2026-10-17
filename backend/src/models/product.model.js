import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 200, index: 'text' },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ },
  description: { type: String, required: true, trim: true, maxlength: 10000, index: 'text' },
  brand: { type: String, required: true, trim: true, maxlength: 100, index: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  bicycleType: { type: String, trim: true, maxlength: 100, default: '', index: true },
  price: { type: Number, required: true, min: 0 },
  salePrice: { type: Number, min: 0, default: null },
  stockQuantity: { type: Number, required: true, min: 0, default: 0 },
  sku: { type: String, required: true, trim: true, uppercase: true, unique: true, index: true, maxlength: 100 },
  images: { type: [String], default: [] },
  specifications: { type: Map, of: String, default: {} },
  sizes: { type: [String], default: [] },
  colors: { type: [String], default: [] },
  isAvailable: { type: Boolean, default: true, index: true },
  isFeatured: { type: Boolean, default: false, index: true },
  averageRating: { type: Number, default: 0, min: 0, max: 5, index: true },
  reviewCount: { type: Number, default: 0, min: 0 },
}, { timestamps: true });
productSchema.index({ createdAt: -1 }); productSchema.index({ price: 1 }); productSchema.index({ averageRating: -1, reviewCount: -1 });
productSchema.virtual('currentPrice').get(function currentPrice() { return this.salePrice ?? this.price; });
export const Product = mongoose.model('Product', productSchema);
