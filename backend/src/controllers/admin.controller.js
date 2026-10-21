import { asyncHandler } from '../utils/asyncHandler.js';
import { Product } from '../models/product.model.js';
import { Order } from '../models/order.model.js';
import { Review } from '../models/review.model.js';

const orderStatuses = ['pending_confirmation', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'failed'];

export const dashboardSummary = asyncHandler(async (req, res) => {
  const [products, orderMetrics, reviewMetrics] = await Promise.all([
    Product.countDocuments(),
    Order.aggregate([
      {
        $facet: {
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          sales: [
            { $match: { status: 'delivered' } },
            { $group: { _id: null, revenue: { $sum: '$grandTotal' }, orders: { $sum: 1 } } },
          ],
        },
      },
    ]),
    Review.aggregate([
      {
        $facet: {
          total: [{ $match: { isDemo: false } }, { $count: 'count' }],
          pending: [{ $match: { isDemo: false, status: 'hidden' } }, { $count: 'count' }],
          published: [
            { $match: { isDemo: false, status: 'published' } },
            { $group: { _id: null, count: { $sum: 1 }, averageRating: { $avg: '$rating' } } },
          ],
        },
      },
    ]),
  ]);

  const ordersByStatus = Object.fromEntries(orderStatuses.map((status) => [status, 0]));
  for (const status of orderMetrics[0]?.byStatus || []) ordersByStatus[status._id] = status.count;
  const sales = orderMetrics[0]?.sales[0] || { revenue: 0, orders: 0 };
  const reviews = reviewMetrics[0] || {};
  const publishedReviews = reviews.published[0] || { count: 0, averageRating: 0 };

  res.json({
    success: true,
    message: 'Admin summary retrieved successfully',
    data: {
      products,
      pendingOrders: ordersByStatus.pending_confirmation,
      sales: { deliveredRevenue: sales.revenue, deliveredOrders: sales.orders },
      ordersByStatus,
      reviews: {
        total: reviews.total[0]?.count || 0,
        pending: reviews.pending[0]?.count || 0,
        published: publishedReviews.count,
        averageRating: publishedReviews.averageRating ? Math.round(publishedReviews.averageRating * 10) / 10 : 0,
      },
    },
  });
});
