import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check, MessageCircle, ShoppingBag } from 'lucide-react';
import { getProduct, getProductImageUrl } from '../services/product.service';
import { getReviewImageUrl, getReviews, getReviewSummary, getTopReview } from '../services/review.service';
import { useCart } from '../hooks/useCart';
import PriceDisplay from '../Components/PriceDisplay';
import RatingStars from '../Components/RatingStars';
import QuantitySelector from '../Components/QuantitySelector';
import LoadingSpinner from '../Components/LoadingSpinner';
import EmptyState from '../Components/EmptyState';
import ErrorMessage from '../Components/ErrorMessage';
import { formatDate } from '../utils/formatDate';

const fallbackImage = 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=85';

export default function ProductDetails() {
  const { slug } = useParams(); const navigate = useNavigate(); const { addItem } = useCart();
  const [product, setProduct] = useState(null); const [reviews, setReviews] = useState([]); const [topReview, setTopReview] = useState(null); const [summary, setSummary] = useState(null); const [quantity, setQuantity] = useState(1); const [options, setOptions] = useState({}); const [image, setImage] = useState(''); const [error, setError] = useState('');
  useEffect(() => {
    let current = true;
    setProduct(null); setReviews([]); setTopReview(null); setSummary(null); setError(''); setOptions({}); setQuantity(1);
    getProduct(slug).then(async (response) => {
      const nextProduct = response.data.product;
      if (!current) return;
      setProduct(nextProduct); setImage(nextProduct.images?.[0] || fallbackImage);
      const [all, top, reviewSummary] = await Promise.allSettled([getReviews(nextProduct._id, { limit: 6 }), getTopReview(nextProduct._id), getReviewSummary(nextProduct._id)]);
      if (!current) return;
      if (all.status === 'fulfilled') setReviews(all.value.data.reviews || []);
      if (top.status === 'fulfilled') setTopReview(top.value.data.review || null);
      if (reviewSummary.status === 'fulfilled') setSummary(reviewSummary.value.data);
    }).catch((requestError) => { if (current) setError(requestError.message); });
    return () => { current = false; };
  }, [slug]);
  const add = async (buyNow = false) => { try { await addItem({ productId: product._id, quantity, selectedOptions: options }); toast.success('Added to your cart'); if (buyNow) navigate('/checkout'); } catch (requestError) { toast.error(requestError.message); } };
  if (error) return <main className="container-page py-20"><EmptyState title="Product unavailable" text={error} action={<Link className="btn-primary" to="/products">Browse bicycles</Link>} /></main>;
  if (!product) return <LoadingSpinner label="Loading product" />;
  const images = product.images?.length ? product.images : [fallbackImage]; const rating = summary?.averageRating ?? product.averageRating; const reviewCount = summary?.total ?? product.reviewCount;
  return <main className="container-page py-10"><div className="grid gap-10 lg:grid-cols-2"><div><div className="aspect-square overflow-hidden rounded-3xl bg-zinc-100"><img src={getProductImageUrl(image)} onError={(event) => { event.currentTarget.src = fallbackImage; }} alt={product.name} className="h-full w-full object-cover" /></div>{images.length > 1 && <div className="mt-3 flex gap-3 overflow-auto">{images.map((src) => <button type="button" key={src} className={`h-18 w-18 shrink-0 overflow-hidden rounded-xl border-2 ${image === src ? 'border-brand-dark' : 'border-transparent'}`} onClick={() => setImage(src)}><img src={getProductImageUrl(src)} alt={`${product.name} view`} className="h-full w-full object-cover" /></button>)}</div>}</div><div><p className="eyebrow">{product.category?.name || product.brand}</p><h1 className="font-display text-4xl font-black sm:text-5xl">{product.name}</h1><div className="mt-4"><RatingStars rating={rating} count={reviewCount} /></div><PriceDisplay product={product} className="mt-6 text-3xl" /><p className="mt-6 leading-7 text-zinc-600">{product.description}</p><div className="mt-6 flex items-center gap-2 text-sm font-bold">{product.stockQuantity > 0 ? <><Check className="h-4 w-4 text-green-600" />In stock ({product.stockQuantity} available)</> : <span className="text-red-600">Currently unavailable</span>}</div>{product.sizes?.length > 0 && <fieldset className="mt-7"><legend className="mb-3 text-sm font-black">Choose size</legend><div className="flex flex-wrap gap-2">{product.sizes.map((size) => <button type="button" onClick={() => setOptions({ ...options, size })} className={`rounded-xl border px-4 py-2 text-sm font-bold ${options.size === size ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-200'}`} key={size}>{size}</button>)}</div></fieldset>}{product.colors?.length > 0 && <fieldset className="mt-5"><legend className="mb-3 text-sm font-black">Choose colour</legend><div className="flex flex-wrap gap-2">{product.colors.map((color) => <button type="button" onClick={() => setOptions({ ...options, color })} className={`rounded-xl border px-4 py-2 text-sm font-bold ${options.color === color ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-200'}`} key={color}>{color}</button>)}</div></fieldset>}<div className="mt-8 flex flex-wrap gap-3"><QuantitySelector value={quantity} onChange={setQuantity} max={Math.max(1, Math.min(product.stockQuantity, 20))} disabled={!product.stockQuantity} /><button disabled={!product.stockQuantity} onClick={() => add()} className="btn-primary"><ShoppingBag className="h-4 w-4" />Add to cart</button><button disabled={!product.stockQuantity} onClick={() => add(true)} className="btn-secondary"><MessageCircle className="h-4 w-4" />Buy now</button></div></div></div><section className="mt-16 grid gap-10 lg:grid-cols-[1fr_.8fr]"><div><h2 className="section-title text-3xl">Specifications</h2><dl className="mt-5 overflow-hidden rounded-2xl border border-zinc-200">{Object.entries(product.specifications || {}).length ? Object.entries(product.specifications).map(([key, value]) => <div className="grid grid-cols-2 border-b border-zinc-100 p-4 last:border-0" key={key}><dt className="font-bold capitalize">{key}</dt><dd className="text-zinc-600">{value}</dd></div>) : <div className="p-5 text-zinc-600">No additional specifications published.</div>}</dl><h2 className="mt-12 section-title text-3xl">All reviews</h2>{reviews.length ? <div className="mt-5 grid gap-4">{reviews.map((review) => <article className="rounded-2xl border border-zinc-200 p-5" key={review._id}><div className="flex justify-between gap-3"><div><h3 className="font-black">{review.displayName}</h3><RatingStars rating={review.rating} small /></div><time className="text-xs text-zinc-400">{formatDate(review.reviewDate || review.createdAt)}</time></div><p className="mt-1 text-sm leading-6 text-zinc-600">{review.text}</p>{review.imageUrl && <img className="mt-3 max-h-72 rounded-xl object-cover" src={getReviewImageUrl(review.imageUrl)} alt={`Product photo shared by ${review.displayName}`} loading="lazy" />}{review.verifiedPurchase && <span className="mt-3 inline-block text-xs font-bold text-green-700">Verified purchase</span>}</article>)}</div> : <div className="mt-5"><EmptyState title="No published reviews yet" text="Reviews will appear here once the store publishes them." /></div>}</div><aside>{topReview ? <article className="rounded-3xl bg-zinc-950 p-7 text-white"><p className="text-xs font-black tracking-widest text-brand">TOP CUSTOMER REVIEW</p><RatingStars rating={topReview.rating} small /><p className="mt-3 leading-7 text-zinc-300">“{topReview.text}”</p><p className="mt-4 text-sm font-bold">— {topReview.displayName}</p></article> : <ErrorMessage message="No top review is available yet." />}</aside></section></main>;
}
