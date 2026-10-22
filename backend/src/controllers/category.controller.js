import { Category } from '../models/category.model.js';
import { Product } from '../models/product.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { removeCategoryImage, removeUploadedFile } from '../middleware/upload.middleware.js';
export const listCategories = asyncHandler(async (req, res) => { const filter = req.admin ? {} : { isActive: true }; const categories = await Category.find(filter).sort({ name: 1 }); res.json({ success: true, message: 'Categories retrieved successfully', data: { categories } }); });
export const createCategory = asyncHandler(async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, message: 'Category created successfully', data: { category } });
  } catch (error) {
    await removeUploadedFile(req.file);
    throw error;
  }
});
export const updateCategory = asyncHandler(async (req, res) => {
  const previousCategory = await Category.findById(req.params.id);
  if (!previousCategory) {
    await removeUploadedFile(req.file);
    throw new ApiError(404, 'Category not found');
  }
  const previousImage = previousCategory.imageUrl;
  try {
    Object.assign(previousCategory, req.body);
    await previousCategory.save();
  } catch (error) {
    await removeUploadedFile(req.file);
    throw error;
  }
  if (previousImage !== previousCategory.imageUrl) await removeCategoryImage(previousImage);
  res.json({ success: true, message: 'Category updated successfully', data: { category: previousCategory } });
});
export const deleteCategory = asyncHandler(async (req, res) => { const category = await Category.findById(req.params.id); if (!category) throw new ApiError(404, 'Category not found'); if (await Product.exists({ category: category._id })) throw new ApiError(409, 'Cannot delete a category that still has products'); await category.deleteOne(); await removeCategoryImage(category.imageUrl); res.json({ success: true, message: 'Category deleted successfully' }); });
