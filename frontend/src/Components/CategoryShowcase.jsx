import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getCategoryProducts, getProductImageUrl } from '../services/product.service';

const fallbackImage = 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=80';

export default function CategoryShowcase({ category }) {
  const [active, setActive] = useState(false);
  const [products, setProducts] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    if (!active || requested) return;
    setLoading(true);
    setRequested(true);
    getCategoryProducts(category.slug, { limit: 5 }).then((response) => {
      setProducts(response.data.products || []);
    }).catch((requestError) => {
      setError(requestError.message);
    }).finally(() => {
      setLoading(false);
    });
  }, [active, category.slug, requested]);

  useEffect(() => {
    if (!active || products.length < 2) return undefined;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % products.length), 2200);
    return () => window.clearInterval(timer);
  }, [active, products.length]);

  const product = products[index];
  const image = active && product?.images?.[0]
    ? getProductImageUrl(product.images[0])
    : category.imageUrl || fallbackImage;
  const deactivate = () => {
    setActive(false);
    setIndex(0);
  };

  return <Link
    to={`/categories/${category.slug}`}
    onPointerEnter={() => setActive(true)}
    onPointerLeave={deactivate}
    onFocus={() => setActive(true)}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) deactivate(); }}
    className="category-showcase group relative h-56 overflow-hidden rounded-3xl bg-zinc-900"
    aria-label={`Explore ${category.name}${active && product ? `: ${product.name}` : ''}`}
  >
    <AnimatePresence mode="wait" initial={false}>
      <motion.img
        key={image}
        src={image}
        onError={(event) => { event.currentTarget.src = fallbackImage; }}
        alt={active && product ? product.name : category.name}
        className="absolute inset-0 h-full w-full object-cover"
        initial={{ opacity: 0, scale: 1.08, x: 16 }}
        animate={{ opacity: 1, scale: active ? 1.07 : 1, x: 0 }}
        exit={{ opacity: 0, scale: 1.03, x: -14 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      />
    </AnimatePresence>
    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/15 to-transparent" />
    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
      <div className="min-w-0 text-white">
        <h3 className="text-2xl font-black">{category.name}</h3>
        {(active || category.description) && <p className="mt-1 line-clamp-2 text-sm font-semibold text-zinc-200">{active ? (loading ? 'Finding your next ride…' : product?.name || (error ? 'Products could not be loaded' : 'Explore this collection')) : category.description}</p>}
      </div>
      {active && products.length > 1 && <span className="shrink-0 rounded-full bg-brand px-3 py-1 text-xs font-black text-zinc-950">{index + 1} / {products.length}</span>}
    </div>
    {active && products.length > 1 && <span className="category-showcase__progress" key={`${category._id}-${index}`} />}
  </Link>;
}
