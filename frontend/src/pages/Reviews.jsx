import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ImagePlus, Send, Star } from 'lucide-react';
import { getProducts } from '../services/product.service';
import { getPublicReviews, getReviewImageUrl, submitReview } from '../services/review.service';
import EmptyState from '../Components/EmptyState';
import ErrorMessage from '../Components/ErrorMessage';
import LoadingSpinner from '../Components/LoadingSpinner';
import Pagination from '../Components/Pagination';
import RatingStars from '../Components/RatingStars';
import { formatDate } from '../utils/formatDate';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    getProducts({ limit: 100 }).then((response) => {
      if (active) setProducts(response.data.products);
    }).catch((requestError) => {
      if (active) toast.error(`Could not load bicycles: ${requestError.message}`);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getPublicReviews({ page, limit: 12, sort }).then((response) => {
      if (!active) return;
      setReviews(response.data.reviews);
      setPagination(response.data.pagination);
    }).catch((requestError) => {
      if (active) setError(requestError.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [page, sort]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview('');
      return undefined;
    }
    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  const chooseImage = (file) => {
    if (file && !['image/jpeg', 'image/jpg'].includes(file.type) && !/\.jpe?g$/i.test(file.name)) {
      toast.error('Please choose a JPG image.');
      setImageFile(null);
      return;
    }
    setImageFile(file || null);
  };

  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setSubmitting(true);
    try {
      await submitReview(values.get('productId'), {
        displayName: values.get('displayName'),
        rating: values.get('rating'),
        text: values.get('text'),
      }, imageFile);
      toast.success('Thanks! Your review has been submitted for approval.');
      form.reset();
      setImageFile(null);
    } catch (requestError) {
      toast.error(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="container-page py-12">
    <p className="eyebrow">Rider stories</p>
    <h1 className="section-title">Customer reviews</h1>
    <p className="mt-3 max-w-2xl leading-7 text-zinc-600">See what riders think about their bicycles, or share your own experience with the community.</p>
    <section className="mt-9 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.72fr)]">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-2xl font-black">What riders are saying</h2><p className="mt-1 text-sm text-zinc-500">Reviews are shown after moderation.</p></div>
          <label className="field">Sort by<select className="input" value={sort} onChange={(event) => { setPage(1); setSort(event.target.value); }}><option value="newest">Newest</option><option value="rating">Highest rated</option></select></label>
        </div>
        {error && <div className="mt-5"><ErrorMessage message={error} /></div>}
        {loading ? <LoadingSpinner label="Loading reviews" /> : reviews.length ? <>
          <div className="mt-5 grid gap-4">
            {reviews.map((review) => <article className="rounded-2xl border border-zinc-200 bg-white p-5" key={review._id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="font-black">{review.displayName}</h3><RatingStars rating={review.rating} small /></div>
                <time className="text-xs text-zinc-400">{formatDate(review.reviewDate || review.createdAt)}</time>
              </div>
              {review.product && <Link className="mt-3 inline-block text-sm font-bold text-zinc-600 hover:text-zinc-950" to={`/products/${review.product.slug}`}>{review.product.name}</Link>}
              <p className="mt-1 whitespace-pre-line text-sm leading-6 text-zinc-600">{review.text}</p>
              {review.imageUrl && <img className="mt-4 max-h-72 w-full rounded-xl object-cover sm:w-auto sm:max-w-full" src={getReviewImageUrl(review.imageUrl)} alt={`Product photo shared by ${review.displayName}`} loading="lazy" />}
              {review.verifiedPurchase && <span className="mt-3 inline-block text-xs font-bold text-green-700">Verified purchase</span>}
            </article>)}
          </div>
          <Pagination pagination={pagination} onChange={setPage} />
        </> : <div className="mt-5"><EmptyState title="No reviews yet" text="Be the first rider to share your experience." /></div>}
      </div>
      <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm sm:p-7">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand"><Star className="h-5 w-5 fill-current" /></span><div><p className="eyebrow">Your experience</p><h2 className="text-2xl font-black">Write a review</h2></div></div>
        <p className="mt-3 text-sm leading-6 text-zinc-600">Reviews are checked by our team before they appear on the site.</p>
        <form className="mt-5 grid gap-4" onSubmit={submit}>
          <label className="field">Bicycle<select className="input" name="productId" defaultValue="" required><option value="" disabled>Select a bicycle</option>{products.map((product) => <option key={product._id} value={product._id}>{product.name}</option>)}</select></label>
          <label className="field">Your name<input className="input" name="displayName" minLength="2" maxLength="80" required /></label>
          <label className="field">Rating<select className="input" name="rating" defaultValue="5" required>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} star{rating !== 1 ? 's' : ''}</option>)}</select></label>
          <label className="field">Your review<textarea className="input min-h-28" name="text" minLength="5" maxLength="3000" required /></label>
          <label className="field">Product photo <span className="font-normal text-zinc-500">Optional · JPG, up to 5 MB</span>
            <span className="flex items-center gap-2 rounded-xl border border-dashed border-zinc-300 p-3 text-sm font-bold"><ImagePlus className="h-5 w-5 shrink-0" /><input className="min-w-0 text-sm font-normal" type="file" accept=".jpg,.jpeg,image/jpeg" onChange={(event) => chooseImage(event.target.files?.[0])} /></span>
          </label>
          {imagePreview && <img className="max-h-56 rounded-xl object-cover" src={imagePreview} alt="Selected product preview" />}
          <button className="btn-primary w-fit" type="submit" disabled={submitting || products.length === 0}><Send className="h-4 w-4" />{submitting ? 'Submitting…' : 'Submit review'}</button>
        </form>
      </aside>
    </section>
  </main>;
}
