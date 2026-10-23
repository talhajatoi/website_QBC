import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Check, MessageCircle, ShoppingBag, X } from 'lucide-react';
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
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [topReview, setTopReview] = useState(null);
  const [summary, setSummary] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [options, setOptions] = useState({});
  const [image, setImage] = useState('');
  const [galleryInteracted, setGalleryInteracted] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomOffset, setZoomOffset] = useState({ x: 0, y: 0 });
  const [error, setError] = useState('');
  const touchGesture = useRef(null);
  const swiped = useRef(false);
  const clearSwipeSuppression = useRef(null);
  const images = product?.images?.length ? product.images : [fallbackImage];

  useEffect(() => {
    let current = true;
    setProduct(null);
    setReviews([]);
    setTopReview(null);
    setSummary(null);
    setError('');
    setOptions({});
    setQuantity(1);
    setLightboxOpen(false);
    setGalleryInteracted(false);
    setZoomScale(1);
    setZoomOffset({ x: 0, y: 0 });
    getProduct(slug).then(async (response) => {
      const nextProduct = response.data.product;
      if (!current) return;
      setProduct(nextProduct);
      setImage(nextProduct.images?.[0] || fallbackImage);
      setGalleryInteracted(false);
      const [all, top, reviewSummary] = await Promise.allSettled([
        getReviews(nextProduct._id, { limit: 6 }),
        getTopReview(nextProduct._id),
        getReviewSummary(nextProduct._id),
      ]);
      if (!current) return;
      if (all.status === 'fulfilled') setReviews(all.value.data.reviews || []);
      if (top.status === 'fulfilled') setTopReview(top.value.data.review || null);
      if (reviewSummary.status === 'fulfilled') setSummary(reviewSummary.value.data);
    }).catch((requestError) => {
      if (current) setError(requestError.message);
    });
    return () => { current = false; };
  }, [slug]);

  useEffect(() => {
    const slideshowImages = product?.images?.slice(0, 3) || [];
    if (galleryInteracted || slideshowImages.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setImage((current) => {
        const index = slideshowImages.indexOf(current);
        return slideshowImages[(index + 1 + slideshowImages.length) % slideshowImages.length];
      });
    }, 3000);
    return () => window.clearInterval(timer);
  }, [galleryInteracted, product]);

  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const closeOrNavigate = (event) => {
      if (event.key === 'Escape') {
        setLightboxOpen(false);
        setZoomScale(1);
        setZoomOffset({ x: 0, y: 0 });
      }
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      setGalleryInteracted(true);
      setZoomScale(1);
      setZoomOffset({ x: 0, y: 0 });
      const imageList = product?.images?.length ? product.images : [fallbackImage];
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      setImage((current) => {
        const index = Math.max(0, imageList.indexOf(current));
        return imageList[(index + direction + imageList.length) % imageList.length];
      });
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOrNavigate);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOrNavigate);
    };
  }, [lightboxOpen, product]);

  const changeImage = (direction) => {
    setZoomScale(1);
    setZoomOffset({ x: 0, y: 0 });
    setImage((current) => {
      const index = Math.max(0, images.indexOf(current));
      return images[(index + direction + images.length) % images.length];
    });
  };
  const distanceBetweenTouches = (touches) => {
    const deltaX = touches[0].clientX - touches[1].clientX;
    const deltaY = touches[0].clientY - touches[1].clientY;
    return Math.hypot(deltaX, deltaY);
  };
  const handleTouchStart = (event) => {
    setGalleryInteracted(true);
    if (event.touches.length > 1) {
      const currentGesture = touchGesture.current;
      touchGesture.current = {
        mode: 'pinch',
        startDistance: distanceBetweenTouches(event.touches),
        startScale: currentGesture?.mode === 'pinch' ? currentGesture.startScale : zoomScale,
        startOffset: zoomOffset,
      };
      swiped.current = true;
      return;
    }
    const touch = event.touches[0];
    touchGesture.current = {
      mode: zoomScale > 1 ? 'pan' : 'swipe',
      startX: touch.clientX,
      startY: touch.clientY,
      startOffset: zoomOffset,
    };
  };
  const handleTouchMove = (event) => {
    const gesture = touchGesture.current;
    if (event.touches.length > 1) {
      if (!gesture || gesture.mode !== 'pinch') {
        touchGesture.current = {
          mode: 'pinch',
          startDistance: distanceBetweenTouches(event.touches),
          startScale: zoomScale,
          startOffset: zoomOffset,
        };
        swiped.current = true;
        return;
      }
      const nextScale = Math.max(
        1,
        Math.min(4, gesture.startScale * (distanceBetweenTouches(event.touches) / gesture.startDistance)),
      );
      setZoomScale(nextScale);
      if (nextScale === 1) setZoomOffset({ x: 0, y: 0 });
      return;
    }
    if (!gesture || event.touches.length !== 1) return;
    const touch = event.touches[0];
    if (gesture.mode === 'pan' && zoomScale > 1) {
      setZoomOffset({
        x: gesture.startOffset.x + touch.clientX - gesture.startX,
        y: gesture.startOffset.y + touch.clientY - gesture.startY,
      });
      swiped.current = true;
    }
  };
  const handleTouchEnd = (event) => {
    const gesture = touchGesture.current;
    if (!gesture) return;
    if (gesture.mode === 'pinch') {
      swiped.current = true;
      clearTimeout(clearSwipeSuppression.current);
      clearSwipeSuppression.current = window.setTimeout(() => { swiped.current = false; }, 700);
      if (event.touches.length === 1 && zoomScale > 1) {
        const touch = event.touches[0];
        touchGesture.current = {
          mode: 'pan',
          startX: touch.clientX,
          startY: touch.clientY,
          startOffset: zoomOffset,
        };
      } else {
        touchGesture.current = null;
      }
      return;
    }
    touchGesture.current = null;
    if (gesture.mode !== 'swipe' || zoomScale > 1 || event.changedTouches.length !== 1) return;
    const touch = event.changedTouches[0];
    const distanceX = touch.clientX - gesture.startX;
    const distanceY = touch.clientY - gesture.startY;
    if (Math.abs(distanceX) < 45 || Math.abs(distanceX) <= Math.abs(distanceY) * 1.2) return;
    swiped.current = true;
    changeImage(distanceX < 0 ? 1 : -1);
    clearTimeout(clearSwipeSuppression.current);
    clearSwipeSuppression.current = window.setTimeout(() => { swiped.current = false; }, 700);
  };
  const cancelTouchGesture = () => {
    if (!touchGesture.current) return;
    touchGesture.current = null;
    swiped.current = true;
    clearTimeout(clearSwipeSuppression.current);
    clearSwipeSuppression.current = window.setTimeout(() => { swiped.current = false; }, 700);
  };
  const zoomBy = (amount) => {
    setGalleryInteracted(true);
    setZoomScale((current) => {
      const nextScale = Math.max(1, Math.min(4, current + amount));
      if (nextScale === 1) setZoomOffset({ x: 0, y: 0 });
      return nextScale;
    });
  };
  const openLightbox = () => {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    setGalleryInteracted(true);
    setLightboxOpen(true);
  };
  const add = async (buyNow = false) => {
    try {
      await addItem({ productId: product._id, quantity, selectedOptions: options });
      toast.success('Added to your cart');
      if (buyNow) navigate('/checkout');
    } catch (requestError) {
      toast.error(requestError.message);
    }
  };

  if (error) return <main className="container-page py-20"><EmptyState title="Product unavailable" text={error} action={<Link className="btn-primary" to="/products">Browse bicycles</Link>} /></main>;
  if (!product) return <LoadingSpinner label="Loading product" />;
  const rating = summary?.averageRating ?? product.averageRating;
  const reviewCount = summary?.total ?? product.reviewCount;
  const legacyCondition = Object.entries(product.specifications || {}).find(([key]) => key.toLocaleLowerCase() === 'condition')?.[1];
  const condition = product.condition || legacyCondition;
  const specifications = Object.entries(product.specifications || {}).filter(([key, value]) => key.toLocaleLowerCase() !== 'condition' && String(value).trim());
  const components = Object.entries(product.components || {}).filter(([, value]) => String(value).trim());

  return (
    <main className="container-page py-10">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-zinc-100">
            <button
              type="button"
              className="h-full w-full cursor-zoom-in touch-pan-y"
              onClick={openLightbox}
              onPointerEnter={() => setGalleryInteracted(true)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={cancelTouchGesture}
              aria-label={`Open ${product.name} image gallery`}
            >
              <img
                src={getProductImageUrl(image)}
                onError={(event) => { event.currentTarget.src = fallbackImage; }}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </button>
            {condition && <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/95 px-4 py-2 text-sm font-black text-zinc-900 shadow">Condition · {condition}</span>}
            {images.length > 1 && (
              <>
                <button type="button" className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow" onClick={() => { setGalleryInteracted(true); changeImage(-1); }} aria-label="Previous product image"><ArrowLeft className="h-5 w-5" /></button>
                <button type="button" className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow" onClick={() => { setGalleryInteracted(true); changeImage(1); }} aria-label="Next product image"><ArrowRight className="h-5 w-5" /></button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-auto">
              {images.map((src, index) => (
                <button type="button" key={src} className={`h-18 w-18 shrink-0 overflow-hidden rounded-xl border-2 ${image === src ? 'border-brand-dark' : 'border-transparent'}`} onClick={() => { setGalleryInteracted(true); setZoomScale(1); setZoomOffset({ x: 0, y: 0 }); setImage(src); }} aria-label={`Show product image ${index + 1}`}>
                  <img src={getProductImageUrl(src)} alt={`${product.name} view ${index + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <p className="mt-2 text-center text-xs font-semibold text-zinc-500">Tap to expand · Swipe to view more</p>
        </div>

        <div>
          <p className="eyebrow">{product.category?.name || product.brand}</p>
          <h1 className="font-display text-4xl font-black sm:text-5xl">{product.name}</h1>
          <div className="mt-4"><RatingStars rating={rating} count={reviewCount} /></div>
          <PriceDisplay product={product} className="mt-6 text-3xl" />
          <p className="mt-6 leading-7 text-zinc-600">{product.description}</p>
          <div className="mt-6 flex items-center gap-2 text-sm font-bold">
            {product.stockQuantity > 0
              ? <><Check className="h-4 w-4 text-green-600" />In stock ({product.stockQuantity} available)</>
              : <span className="text-red-600">Currently unavailable</span>}
          </div>
          {product.sizes?.length > 0 && (
            <fieldset className="mt-7">
              <legend className="mb-3 text-sm font-black">Choose size</legend>
              <div className="flex flex-wrap gap-2">{product.sizes.map((size) => <button type="button" onClick={() => setOptions({ ...options, size })} className={`rounded-xl border px-4 py-2 text-sm font-bold ${options.size === size ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-200'}`} key={size}>{size}</button>)}</div>
            </fieldset>
          )}
          {product.colors?.length > 0 && (
            <fieldset className="mt-5">
              <legend className="mb-3 text-sm font-black">Choose colour</legend>
              <div className="flex flex-wrap gap-2">{product.colors.map((color) => <button type="button" onClick={() => setOptions({ ...options, color })} className={`rounded-xl border px-4 py-2 text-sm font-bold ${options.color === color ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-200'}`} key={color}>{color}</button>)}</div>
            </fieldset>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <QuantitySelector value={quantity} onChange={setQuantity} max={Math.max(1, Math.min(product.stockQuantity, 20))} disabled={!product.stockQuantity} />
            <button disabled={!product.stockQuantity} onClick={() => add()} className="btn-primary"><ShoppingBag className="h-4 w-4" />Add to cart</button>
            <button disabled={!product.stockQuantity} onClick={() => add(true)} className="btn-secondary"><MessageCircle className="h-4 w-4" />Buy now</button>
          </div>
        </div>
      </div>

      <section className="mt-16 grid gap-10 lg:grid-cols-[1fr_.8fr]">
        <div>
          {specifications.length > 0 && (
            <>
              <h2 className="section-title text-3xl">Specifications</h2>
              <div className="@container mt-4">
                <dl className="grid grid-cols-1 gap-2 @md:grid-cols-2">
                  {specifications.map(([key, value]) => (
                    <div className="grid min-w-0 grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm" key={key}>
                      <dt className="break-words font-bold capitalize leading-5">{key}</dt>
                      <dd className="break-words leading-5 text-zinc-600">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </>
          )}
          {components.length > 0 && (
            <>
              <h2 className="mt-8 section-title text-3xl">Components</h2>
              <div className="@container mt-3">
                <dl className="grid grid-cols-1 gap-1.5 @md:grid-cols-2">
                  {components.map(([name, value]) => (
                    <div className="grid min-w-0 grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm" key={name}>
                      <dt className="break-words font-bold capitalize leading-5">{name}</dt>
                      <dd className="break-words leading-5 text-zinc-600">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </>
          )}
          <h2 className="mt-12 section-title text-3xl">All reviews</h2>
          {reviews.length ? (
            <div className="mt-5 grid gap-4">
              {reviews.map((review) => (
                <article className="rounded-2xl border border-zinc-200 p-5" key={review._id}>
                  <div className="flex justify-between gap-3">
                    <div><h3 className="font-black">{review.displayName}</h3><RatingStars rating={review.rating} small /></div>
                    <time className="text-xs text-zinc-400">{formatDate(review.reviewDate || review.createdAt)}</time>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">{review.text}</p>
                  {review.imageUrl && <img className="mt-3 max-h-72 rounded-xl object-cover" src={getReviewImageUrl(review.imageUrl)} alt={`Product photo shared by ${review.displayName}`} loading="lazy" />}
                  {review.verifiedPurchase && <span className="mt-3 inline-block text-xs font-bold text-green-700">Verified purchase</span>}
                </article>
              ))}
            </div>
          ) : <div className="mt-5"><EmptyState title="No published reviews yet" text="Reviews will appear here once the store publishes them." /></div>}
        </div>
        <aside>
          {topReview
            ? <article className="rounded-3xl bg-zinc-950 p-7 text-white"><p className="text-xs font-black tracking-widest text-brand">TOP CUSTOMER REVIEW</p><RatingStars rating={topReview.rating} small /><p className="mt-3 leading-7 text-zinc-300">“{topReview.text}”</p><p className="mt-4 text-sm font-bold">— {topReview.displayName}</p></article>
            : <ErrorMessage message="No top review is available yet." />}
        </aside>
      </section>

      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${product.name} image gallery`}
          className="fixed inset-0 z-[100] grid place-items-center bg-black/95 p-4"
          onClick={(event) => { if (event.target === event.currentTarget) { setLightboxOpen(false); setZoomScale(1); setZoomOffset({ x: 0, y: 0 }); } }}
        >
          <button type="button" className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={() => { setLightboxOpen(false); setZoomScale(1); setZoomOffset({ x: 0, y: 0 }); }} aria-label="Close image gallery"><X /></button>
          {images.length > 1 && <button type="button" className="absolute left-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-6" onClick={() => changeImage(-1)} aria-label="Previous product image"><ArrowLeft /></button>}
          <div
            className="grid max-h-[88vh] max-w-[90vw] touch-none place-items-center overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={cancelTouchGesture}
          >
            <img
              src={getProductImageUrl(image)}
              alt={product.name}
              className="max-h-[88vh] max-w-[90vw] select-none object-contain transition-transform duration-100"
              style={{ transform: `translate(${zoomOffset.x}px, ${zoomOffset.y}px) scale(${zoomScale})` }}
              draggable="false"
            />
          </div>
          {images.length > 1 && <button type="button" className="absolute right-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-6" onClick={() => changeImage(1)} aria-label="Next product image"><ArrowRight /></button>}
          <div className="absolute bottom-4 left-4 flex gap-2">
            <button type="button" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-xl font-bold text-white hover:bg-white/20 disabled:opacity-40" onClick={() => zoomBy(-0.5)} disabled={zoomScale <= 1} aria-label="Zoom out">−</button>
            <button type="button" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-xl font-bold text-white hover:bg-white/20 disabled:opacity-40" onClick={() => zoomBy(0.5)} disabled={zoomScale >= 4} aria-label="Zoom in">+</button>
          </div>
          {images.length > 1 && <p className="absolute bottom-5 text-sm font-bold text-white">{images.indexOf(image) + 1} / {images.length}</p>}
        </div>
      )}
    </main>
  );
}
