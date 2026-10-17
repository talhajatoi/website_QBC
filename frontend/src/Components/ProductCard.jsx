import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import PriceDisplay from './PriceDisplay';
import RatingStars from './RatingStars';
import { useCart } from '../hooks/useCart';
import { getProductImageUrl } from '../services/product.service';
const fallback = 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=80';
export default function ProductCard({ product }) { const { addItem } = useCart(); const add = async () => { try { await addItem({ productId: product._id, quantity: 1 }); toast.success('Added to your cart'); } catch (error) { toast.error(error.message); } };
 return <motion.article whileHover={{ y: -5 }} className="product-card group overflow-hidden rounded-3xl border bg-white shadow-sm"><Link to={`/products/${product.slug}`} className="block aspect-[4/3] overflow-hidden bg-zinc-100"><img loading="lazy" onError={(e) => { e.currentTarget.src = fallback; }} src={getProductImageUrl(product.images?.[0]) || fallback} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></Link><div className="p-5"><div className="mb-2 flex items-start justify-between gap-3"><Link className="text-lg font-black leading-tight hover:text-zinc-600" to={`/products/${product.slug}`}>{product.name}</Link>{product.stockQuantity <= 0 && <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-700">Sold out</span>}</div><p className="mb-3 text-sm text-zinc-500">{product.brand} · {product.bicycleType || 'Bicycle'}</p><RatingStars rating={product.averageRating} count={product.reviewCount} small /><div className="mt-4 flex items-center justify-between gap-2"><PriceDisplay product={product} /><button onClick={add} disabled={product.stockQuantity <= 0} className="btn-icon product-card-action" aria-label={`Add ${product.name} to cart`}><ShoppingBag className="h-4 w-4" /></button></div></div></motion.article>; }
