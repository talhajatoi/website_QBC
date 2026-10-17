import { Category } from '../models/category.model.js';
import { Product } from '../models/product.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
export const listCategories = asyncHandler(async (req, res) => { const filter = req.admin ? {} : { isActive: true }; const categories = await Category.find(filter).sort({ name: 1 }); res.json({ success: true, message: 'Categories retrieved successfully', data: { categories } }); });
export const createCategory = asyncHandler(async (req, res) => { const category = await Category.create(req.body); res.status(201).json({ success: true, message: 'Category created successfully', data: { category } }); });
export const updateCategory = asyncHandler(async (req, res) => { const category = await Category.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true }); if (!category) throw new ApiError(404, 'Category not found'); res.json({ success: true, message: 'Category updated successfully', data: { category } }); });
export const deleteCategory = asyncHandler(async (req, res) => { const category = await Category.findById(req.params.id); if (!category) throw new ApiError(404, 'Category not found'); if (await Product.exists({ category: category._id })) throw new ApiError(409, 'Cannot delete a category that still has products'); await category.deleteOne(); res.json({ success: true, message: 'Category deleted successfully' }); });
