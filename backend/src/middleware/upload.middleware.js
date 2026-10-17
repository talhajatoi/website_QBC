import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { fileTypeFromFile } from 'file-type';
import { ApiError } from '../utils/ApiError.js';

const sourceDirectory = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDirectory = path.resolve(sourceDirectory, '../../uploads');
const reviewDirectory = path.join(uploadsDirectory, 'reviews');
const productDirectory = path.join(uploadsDirectory, 'products');
fs.mkdirSync(reviewDirectory, { recursive: true });
fs.mkdirSync(productDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, reviewDirectory),
  filename: (req, file, callback) => callback(null, `${crypto.randomUUID()}.jpg`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    const hasJpgExtension = /\.jpe?g$/i.test(file.originalname);
    if (!['image/jpeg', 'image/jpg'].includes(file.mimetype) && !hasJpgExtension) return callback(new ApiError(422, 'Review image must be a JPG file'));
    callback(null, true);
  },
});

export const uploadReviewImage = [upload.single('image'), async (req, res, next) => {
  if (!req.file) return next();
  try {
    const detected = await fileTypeFromFile(req.file.path);
    if (detected?.mime !== 'image/jpeg') {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return next(new ApiError(422, 'Review image must contain valid JPG data'));
    }
    req.file.publicUrl = `/uploads/reviews/${req.file.filename}`;
    return next();
  } catch (error) {
    await fs.promises.unlink(req.file.path).catch(() => {});
    return next(error);
  }
}];

const productStorage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, productDirectory),
  filename: (req, file, callback) => callback(null, crypto.randomUUID()),
});
const productUpload = multer({
  storage: productStorage,
  limits: { fileSize: 50 * 1024 * 1024, files: 12 },
  fileFilter: (req, file, callback) => {
    const hasImageExtension = /\.(jpe?g|png)$/i.test(file.originalname);
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.mimetype) && !hasImageExtension) return callback(new ApiError(422, 'Product images must be JPEG, JPG, or PNG files'));
    callback(null, true);
  },
});

export const uploadProductImages = [productUpload.array('productImages', 12), async (req, res, next) => {
  if (!req.files?.length) return next();
  try {
    for (const file of req.files) {
      const detected = await fileTypeFromFile(file.path);
      if (!['image/jpeg', 'image/png'].includes(detected?.mime)) {
        await Promise.all(req.files.map(removeUploadedFile));
        return next(new ApiError(422, 'Product image must contain valid JPEG, JPG, or PNG data'));
      }
      const extension = detected.mime === 'image/png' ? 'png' : 'jpg';
      const filename = `${path.basename(file.path)}.${extension}`;
      const newPath = path.join(productDirectory, filename);
      await fs.promises.rename(file.path, newPath);
      file.path = newPath;
      file.filename = filename;
      file.publicUrl = `/uploads/products/${filename}`;
    }
    return next();
  } catch (error) {
    await Promise.all(req.files.map(removeUploadedFile));
    return next(error);
  }
}];

export const removeUploadedFile = async (file) => { if (file?.path) await fs.promises.unlink(file.path).catch(() => {}); };
export const removeUploadedFiles = async (files = []) => Promise.all(files.map(removeUploadedFile));
export const removeReviewImage = async (imageUrl) => {
  if (!imageUrl?.startsWith('/uploads/reviews/')) return;
  const filePath = path.join(reviewDirectory, path.basename(imageUrl));
  await fs.promises.unlink(filePath).catch(() => {});
};
export const removeProductImage = async (imageUrl) => {
  if (!imageUrl?.startsWith('/uploads/products/')) return;
  const filePath = path.join(productDirectory, path.basename(imageUrl));
  await fs.promises.unlink(filePath).catch(() => {});
};
