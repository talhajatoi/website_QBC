import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  imageUrl: { type: String, trim: true, default: '' },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });
export const Category = mongoose.model('Category', categorySchema);
