import { env } from '../config/env.js';
import { Product } from '../models/product.model.js';
import { Review } from '../models/review.model.js';

export const includeDemoReviews = () => env.NODE_ENV === 'development' && env.ENABLE_DEMO_CONTENT;
export const publicReviewFilter = (product) => ({ product, status: 'published', ...(includeDemoReviews() ? {} : { isDemo: false }) });
export const recalculateProductRatings = async (productId) => {
  const [summary] = await Review.aggregate([{ $match: { product: productId, status: 'published', isDemo: false } }, { $group: { _id: null, averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } }]);
  await Product.findByIdAndUpdate(productId, { averageRating: summary?.averageRating ? Math.round(summary.averageRating * 10) / 10 : 0, reviewCount: summary?.reviewCount || 0 });
};
