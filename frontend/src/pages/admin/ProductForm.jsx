import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ImagePlus, X } from 'lucide-react';
import { createProduct, getAdminProducts, getProductImageUrl, updateProduct } from '../../services/product.service';
import { getAdminCategories } from '../../services/category.service';
import LoadingSpinner from '../../Components/LoadingSpinner';

const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const split = (value) => value.split('\n').map((line) => line.trim()).filter(Boolean);
const specifications = (value) => Object.fromEntries(value.split('\n').map((line) => line.split(':')).filter(([key, text]) => key?.trim() && text?.trim()).map(([key, ...text]) => [key.trim(), text.join(':').trim()]));
const acceptedImage = (file) => ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type) || /\.(jpe?g|png)$/i.test(file.name);

export default function ProductForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ defaultValues: { isAvailable: true, isFeatured: false, stockQuantity: 0, sizes: '', colors: '', specifications: '' } });
  const [categories, setCategories] = useState();
  const [existingImages, setExistingImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedPreviews, setSelectedPreviews] = useState([]);

  useEffect(() => {
    Promise.all([getAdminCategories(), editing ? getAdminProducts({ limit: 100 }) : Promise.resolve(null)])
      .then(([categoryResponse, productResponse]) => {
        setCategories(categoryResponse.data.categories);
        if (!productResponse) return;
        const product = productResponse.data.products.find((item) => item._id === id);
        if (!product) {
          toast.error('Product not found');
          return;
        }
        setExistingImages(product.images || []);
        reset({
          ...product,
          category: product.category?._id || product.category,
          salePrice: product.salePrice ?? '',
          sizes: product.sizes?.join('\n') || '',
          colors: product.colors?.join('\n') || '',
          specifications: Object.entries(product.specifications || {}).map(([key, value]) => `${key}: ${value}`).join('\n'),
        });
      })
      .catch((error) => toast.error(error.message));
  }, [id, editing, reset]);

  useEffect(() => {
    const previews = selectedImages.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setSelectedPreviews(previews);
    return () => previews.forEach(({ url }) => URL.revokeObjectURL(url));
  }, [selectedImages]);

  const chooseImages = (event) => {
    const chosen = Array.from(event.target.files || []);
    event.target.value = '';
    if (chosen.some((file) => !acceptedImage(file))) {
      toast.error('Choose JPEG, JPG, or PNG images only.');
      return;
    }
    if (chosen.some((file) => file.size > 50 * 1024 * 1024)) {
      toast.error('Each product image must be 50 MB or smaller.');
      return;
    }
    const availableSlots = 12 - existingImages.length - selectedImages.length;
    if (chosen.length > availableSlots) {
      toast.error('A product can have up to 12 images.');
      return;
    }
    setSelectedImages((current) => [...current, ...chosen]);
  };

  const submit = async (values) => {
    const payload = {
      ...values,
      slug: values.slug || slugify(values.name),
      price: Number(values.price),
      salePrice: values.salePrice === '' ? null : Number(values.salePrice),
      stockQuantity: Number(values.stockQuantity),
      images: [...existingImages],
      productImages: selectedImages,
      sizes: split(values.sizes),
      colors: split(values.colors),
      specifications: specifications(values.specifications),
    };
    try {
      if (editing) await updateProduct(id, payload);
      else await createProduct(payload);
      toast.success(`Product ${editing ? 'updated' : 'created'}`);
      navigate('/admin/products');
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!categories) return <LoadingSpinner label="Loading form" />;

  return <>
    <Link className="text-sm font-bold underline" to="/admin/products">← Products</Link>
    <h1 className="section-title mt-3">{editing ? 'Edit product' : 'New product'}</h1>
    <form onSubmit={handleSubmit(submit)} className="mt-8 max-w-4xl rounded-3xl bg-white p-6 shadow-sm">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="field md:col-span-2">Product name<input className="input" {...register('name', { required: 'Name is required' })} />{errors.name && <small>{errors.name.message}</small>}</label>
        <label className="field">Slug<input className="input" placeholder="generated-from-name-if-empty" {...register('slug')} /></label>
        <label className="field">SKU<input className="input" {...register('sku', { required: 'SKU is required' })} />{errors.sku && <small>{errors.sku.message}</small>}</label>
        <label className="field">Brand<input className="input" {...register('brand', { required: 'Brand is required' })} /></label>
        <label className="field">Bicycle type<input className="input" placeholder="Mountain, City, Road…" {...register('bicycleType')} /></label>
        <label className="field">Category<select className="input" {...register('category', { required: 'Choose a category' })}><option value="">Select category</option>{categories.map((category) => <option value={category._id} key={category._id}>{category.name}</option>)}</select></label>
        <label className="field">Price (PKR)<input className="input" type="number" min="0" {...register('price', { required: 'Price is required' })} /></label>
        <label className="field">Sale price (optional)<input className="input" type="number" min="0" {...register('salePrice')} /></label>
        <label className="field">Stock quantity<input className="input" type="number" min="0" {...register('stockQuantity', { required: true })} /></label>
        <label className="field md:col-span-2">Description<textarea className="input min-h-32" {...register('description', { required: 'Description is required', minLength: { value: 10, message: 'Use at least 10 characters' } })} />{errors.description && <small>{errors.description.message}</small>}</label>
        <div className="field md:col-span-2">
          <span>Product images <span className="font-normal text-zinc-400">(JPEG, JPG, or PNG · up to 50 MB each · maximum 12 images)</span></span>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-zinc-300 p-4 text-sm font-bold hover:border-zinc-600">
            <ImagePlus className="h-5 w-5" />Choose product images
            <input className="sr-only" type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" multiple onChange={chooseImages} />
          </label>
          {(existingImages.length > 0 || selectedPreviews.length > 0) && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {existingImages.map((imageUrl, index) => <div className="relative aspect-square overflow-hidden rounded-xl bg-zinc-100" key={imageUrl}>
              <img className="h-full w-full object-cover" src={getProductImageUrl(imageUrl)} alt={`Product image ${index + 1}`} />
              <button className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-zinc-900 shadow" type="button" aria-label={`Remove product image ${index + 1}`} onClick={() => setExistingImages((images) => images.filter((item) => item !== imageUrl))}><X className="h-4 w-4" /></button>
            </div>)}
            {selectedPreviews.map(({ file, url }, index) => <div className="relative aspect-square overflow-hidden rounded-xl bg-zinc-100" key={`${file.name}-${file.lastModified}-${index}`}>
              <img className="h-full w-full object-cover" src={url} alt={`New product image ${existingImages.length + index + 1}`} />
              <button className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-zinc-900 shadow" type="button" aria-label={`Remove selected product image ${index + 1}`} onClick={() => setSelectedImages((images) => images.filter((item) => item !== file))}><X className="h-4 w-4" /></button>
            </div>)}
          </div>}
        </div>
        <label className="field">Available sizes <span className="font-normal text-zinc-400">(one per line)</span><textarea className="input min-h-24" {...register('sizes')} /></label>
        <label className="field">Colours <span className="font-normal text-zinc-400">(one per line)</span><textarea className="input min-h-24" {...register('colors')} /></label>
        <label className="field md:col-span-2">Specifications <span className="font-normal text-zinc-400">(one `Name: value` per line)</span><textarea className="input min-h-28" {...register('specifications')} /></label>
      </div>
      <div className="mt-6 flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" {...register('isAvailable')} />Available for sale</label>
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" {...register('isFeatured')} />Featured product</label>
      </div>
      <button disabled={isSubmitting} className="btn-primary mt-7">{isSubmitting ? 'Saving…' : 'Save product'}</button>
    </form>
  </>;
}
