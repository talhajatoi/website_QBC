import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { getAdminProducts } from '../../services/product.service';
import { createReview, deleteReview, getAdminReviews, getReviewImageUrl, updateReview } from '../../services/review.service';
import LoadingSpinner from '../../Components/LoadingSpinner';
import EmptyState from '../../Components/EmptyState';
import RatingStars from '../../Components/RatingStars';
import Pagination from '../../Components/Pagination';
import { formatDate } from '../../utils/formatDate';

const getToday = () => {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
};

const toDateInputValue = (date) => {
  if (!date) return getToday();
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return getToday();
  return parsedDate.toISOString().slice(0, 10);
};

export default function ReviewsManagement() {
  const [data, setData] = useState();
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { status: 'hidden', rating: 5, verifiedPurchase: false, reviewDate: getToday() },
  });

  const load = useCallback((page = 1) => getAdminReviews({ status: status || undefined, page, limit: 20 })
    .then((response) => setData(response.data))
    .catch((error) => toast.error(error.message)), [status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getAdminProducts({ limit: 100 })
      .then((response) => setProducts(response.data.products))
      .catch((error) => toast.error(error.message));
  }, []);

  const open = (review) => {
    setEditing(review || {});
    reset(review ? {
      ...review,
      productId: review.product?._id,
      reviewDate: toDateInputValue(review.reviewDate || review.createdAt),
      removeImage: false,
    } : {
      status: 'hidden',
      rating: 5,
      verifiedPurchase: false,
      reviewDate: getToday(),
      productId: '',
      removeImage: false,
    });
  };

  const save = async (values) => {
    const { productId, image, removeImage, displayName, rating, reviewDate, text, status, verifiedPurchase } = values;
    const imageFile = image?.[0];
    try {
      if (editing?._id) {
        await updateReview(editing._id, { displayName, rating, reviewDate, text, status, verifiedPurchase, removeImage: Boolean(removeImage) }, imageFile);
      } else {
        await createReview(productId, { displayName, rating, reviewDate, text, status, verifiedPurchase }, imageFile);
      }
      toast.success(`Review ${editing?._id ? 'updated' : 'created'}`);
      setEditing(null);
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const remove = async (review) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await deleteReview(review._id);
      toast.success('Review deleted');
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!data) return <LoadingSpinner label="Loading reviews" />;

  return <>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="eyebrow">Moderation</p><h1 className="section-title">Reviews</h1></div>
      <div className="flex gap-3">
        <select className="input w-38" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All</option><option value="published">Published</option><option value="hidden">Hidden</option>
        </select>
        <button className="btn-primary" onClick={() => open(null)}><Plus className="h-4 w-4" />New review</button>
      </div>
    </div>
    {editing && <form onSubmit={handleSubmit(save)} className="mt-7 rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex justify-between">
        <h2 className="text-xl font-black">{editing._id ? 'Edit review' : 'Create review'}</h2>
        <button type="button" onClick={() => setEditing(null)}><X /></button>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {!editing._id && <label className="field md:col-span-2">Product<select className="input" {...register('productId', { required: true })}><option value="">Select product</option>{products.map((product) => <option key={product._id} value={product._id}>{product.name}</option>)}</select></label>}
        <label className="field">Anonymous display name<input className="input" {...register('displayName', { required: true })} /></label>
        <label className="field">Rating<select className="input" {...register('rating')}>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} star{rating > 1 ? 's' : ''}</option>)}</select></label>
        <label className="field">Review date (day/month/year)<input className="input" type="date" {...register('reviewDate', { required: true })} /></label>
        <label className="field md:col-span-2">Review text<textarea className="input min-h-28" {...register('text', { required: true })} /></label>
        <label className="field">Publication status<select className="input" {...register('status')}><option value="hidden">Hidden</option><option value="published">Published</option></select></label>
        <label className="mt-7 flex items-center gap-2 text-sm font-bold"><input type="checkbox" {...register('verifiedPurchase')} />Verified purchase</label>
        <label className="field md:col-span-2">Product photo <span className="font-normal text-zinc-500">Optional · JPG, up to 5 MB</span><input className="input" type="file" accept=".jpg,.jpeg,image/jpeg" {...register('image')} /></label>
        {editing.imageUrl && <label className="flex items-center gap-2 text-sm font-bold md:col-span-2"><input type="checkbox" {...register('removeImage')} />Remove current photo</label>}
      </div>
      <p className="mt-4 text-xs text-zinc-500">Only check verified purchase for a genuinely verified order. Demo reviews cannot be labelled verified.</p>
      <button disabled={isSubmitting} className="btn-primary mt-5">Save review</button>
    </form>}
    {data.reviews.length ? <>
      <div className="mt-8 grid gap-4">{data.reviews.map((review) => <article className="rounded-2xl bg-white p-5 shadow-sm" key={review._id}>
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <div className="flex items-center gap-2"><h2 className="font-black">{review.displayName}</h2>{review.isDemo && <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-bold">Demo sample</span>}</div>
            <p className="mt-1 text-xs text-zinc-500">{review.product?.name || 'Deleted product'} · {review.status} · {formatDate(review.reviewDate || review.createdAt)}</p>
            <RatingStars rating={review.rating} small />
            <p className="mt-3 text-sm text-zinc-600">{review.text}</p>
            {review.imageUrl && <img className="mt-3 max-h-56 rounded-xl object-cover" src={getReviewImageUrl(review.imageUrl)} alt={`Product photo shared by ${review.displayName}`} />}
          </div>
          <div className="flex h-fit gap-2">
            <button className="btn-icon" onClick={() => open(review)}><Pencil className="h-4 w-4" /></button>
            <button className="btn-icon text-red-600" onClick={() => remove(review)}><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      </article>)}</div>
      <Pagination pagination={data.pagination} onChange={load} />
    </> : <div className="mt-8"><EmptyState title="No reviews found" /></div>}
  </>;
}
