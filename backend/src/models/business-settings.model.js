import mongoose from 'mongoose';
import { env } from '../config/env.js';

const socialLinksSchema = new mongoose.Schema({
  facebook: { type: String, trim: true, default: '' },
  instagram: { type: String, trim: true, default: '' },
  tiktok: { type: String, trim: true, default: '' },
  youtube: { type: String, trim: true, default: '' },
}, { _id: false });

const businessSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'default' },
  storeName: { type: String, required: true, trim: true, maxlength: 120, default: 'Quetta Bikes Club' },
  whatsappNumber: { type: String, trim: true, default: env.WHATSAPP_BUSINESS_NUMBER || '' },
  contactPhone: { type: String, trim: true, maxlength: 40, default: '' },
  contactEmail: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
  address: { type: String, trim: true, maxlength: 500, default: '' },
  socialLinks: { type: socialLinksSchema, default: () => ({}) },
}, { timestamps: true });

export const BusinessSettings = mongoose.model('BusinessSettings', businessSettingsSchema);
