import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { Product } from '../src/models/product.model.js';
import { Review } from '../src/models/review.model.js';

const samples = [
  { displayName: 'Demo Rider', rating: 5, text: 'Demo content only. This is not a customer testimonial.' },
  { displayName: 'BicycleFan92', rating: 4, text: 'Demo content only. This is not a verified customer experience.' },
  { displayName: 'HappyRider', rating: 3, text: 'Demo content only. Intended for development demonstrations.' },
];
try {
  if (env.NODE_ENV === 'production') throw new Error('Demo review seeding is disabled in production');
  await connectDatabase(env.MONGODB_URI);
  const products = await Product.find().sort({ createdAt: 1 }).limit(samples.length);
  if (!products.length) throw new Error('Create at least one product before seeding demo reviews');
  for (let index = 0; index < products.length; index += 1) await Review.updateOne({ product: products[index]._id, displayName: samples[index].displayName, isDemo: true }, { $setOnInsert: { ...samples[index], product: products[index]._id, status: 'published', isDemo: true, verifiedPurchase: false } }, { upsert: true });
  console.log(`Demo review seed completed for ${products.length} product(s). Demo ratings are excluded from production statistics.`);
  await disconnectDatabase();
} catch (error) { console.error(`Demo review seed failed: ${error.message}`); await disconnectDatabase().catch(() => {}); process.exit(1); }
