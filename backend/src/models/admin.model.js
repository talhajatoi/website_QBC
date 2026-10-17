import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true, minlength: 12, select: false },
  role: { type: String, enum: ['admin'], default: 'admin' },
  isActive: { type: Boolean, default: true, select: false },
}, { timestamps: true, toJSON: { transform: (doc, ret) => { delete ret.password; delete ret.__v; return ret; } } });

adminSchema.pre('save', async function hashPassword() { if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12); });
adminSchema.methods.comparePassword = function comparePassword(candidate) { return bcrypt.compare(candidate, this.password); };
export const Admin = mongoose.model('Admin', adminSchema);
