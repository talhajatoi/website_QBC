import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ImagePlus, Plus, X } from 'lucide-react';
import { createProduct, getAdminProducts, getProductImageUrl, updateProduct } from '../../services/product.service';
import { getAdminCategories } from '../../services/category.service';
import LoadingSpinner from '../../Components/LoadingSpinner';

const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const split = (value) => value.split('\n').map((line) => line.trim()).filter(Boolean);
const specificationNames = [
  'Material',
  'Fork',
  'Groupset',
  'Speed',
  'Frame Size',
  'Wheel Size',
  'Tyre Brand',
  'Tyre Size',
  'Bottom Bracket',
  'Axle Type',
  'Suspension Brand',
  'Suspension Type',
  'Suspension Travel',
];
const componentNames = ['Stem', 'Handlebar', 'Seatpost', 'Saddle', 'Wheels'];
const emptySpecifications = () => specificationNames.map((name) => ({ name, value: '' }));
const emptyComponents = () => componentNames.map((name) => ({ name, value: '' }));
const acceptedImage = (file) => ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type) || /\.(jpe?g|png)$/i.test(file.name);

export default function ProductForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ defaultValues: { isAvailable: true, isFeatured: false, stockQuantity: 0, sizes: '', colors: '', specifications: '' } });
  const [categories, setCategories] = useState();
  const [existingImages, setExistingImages] = useState([]);
  const [initialImages, setInitialImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedPreviews, setSelectedPreviews] = useState([]);
  const [specificationRows, setSpecificationRows] = useState(emptySpecifications);
  const [customSpecifications, setCustomSpecifications] = useState([]);
  const [componentRows, setComponentRows] = useState(emptyComponents);
  const [customComponents, setCustomComponents] = useState([]);

  useEffect(() => {
    Promise.all([getAdminCategories(), editing ? getAdminProducts({ limit: 100 }) : Promise.resolve(null)])
      .then(([categoryResponse, productResponse]) => {
        setCategories(categoryResponse.data.categories);
        if (!productResponse) {
          setSpecificationRows(emptySpecifications());
          setCustomSpecifications([]);
          setComponentRows(emptyComponents());
          setCustomComponents([]);
          return;
        }
        const product = productResponse.data.products.find((item) => item._id === id);
        if (!product) {
          toast.error('Product not found');
          return;
        }
        setExistingImages(product.images || []);
        setInitialImages(product.images || []);
        const productSpecifications = Object.entries(product.specifications || {});
        const savedValues = new Map(productSpecifications.map(([name, value]) => [name.toLocaleLowerCase(), value]));
        setSpecificationRows(specificationNames.map((name) => ({
          name,
          value: savedValues.get(name.toLocaleLowerCase()) || '',
        })));
        const savedCondition = savedValues.get('condition');
        const knownNames = new Set([...specificationNames, 'condition'].map((name) => name.toLocaleLowerCase()));
        setCustomSpecifications(productSpecifications
          .filter(([name]) => !knownNames.has(name.toLocaleLowerCase()))
          .map(([name, value]) => ({ name, value })));
        const productComponents = Object.entries(product.components || {});
        const savedComponents = new Map(productComponents.map(([name, value]) => [name.toLocaleLowerCase(), value]));
        setComponentRows(componentNames.map((name) => ({
          name,
          value: savedComponents.get(name.toLocaleLowerCase()) || '',
        })));
        const fixedComponentNames = new Set(componentNames.map((name) => name.toLocaleLowerCase()));
        setCustomComponents(productComponents
          .filter(([name]) => !fixedComponentNames.has(name.toLocaleLowerCase()))
          .map(([name, value]) => ({ name, value })));
        reset({
          ...product,
          category: product.category?._id || product.category,
          condition: product.condition || savedCondition || '',
          salePrice: product.salePrice ?? '',
          sizes: product.sizes?.join('\n') || '',
          colors: product.colors?.join('\n') || '',
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
    const specifications = {};
    const usedNames = new Set();
    for (const row of specificationRows) {
      const name = row.name;
      const value = row.value.trim();
      if (!value) continue;
      specifications[name] = value;
      usedNames.add(name.toLocaleLowerCase());
    }
    for (const [index, row] of customSpecifications.entries()) {
      const name = row.name.trim();
      const value = row.value.trim();
      if (!name && !value) continue;
      if (!name || !value) {
        toast.error(`Complete both the name and value for custom specification ${index + 1}.`);
        return;
      }
      const normalizedName = name.toLocaleLowerCase();
      if (usedNames.has(normalizedName)) {
        toast.error(`Specification name "${name}" is already in use.`);
        return;
      }
      usedNames.add(normalizedName);
      specifications[name] = value;
    }
    const components = {};
    const usedComponentNames = new Set();
    for (const row of componentRows) {
      const value = row.value.trim();
      if (!value) continue;
      components[row.name] = value;
      usedComponentNames.add(row.name.toLocaleLowerCase());
    }
    for (const [index, row] of customComponents.entries()) {
      const name = row.name.trim();
      const value = row.value.trim();
      if (!name && !value) continue;
      if (!name || !value) {
        toast.error(`Complete both the name and value for custom component ${index + 1}.`);
        return;
      }
      const normalizedName = name.toLocaleLowerCase();
      if (usedComponentNames.has(normalizedName)) {
        toast.error(`Component name "${name}" is already in use.`);
        return;
      }
      usedComponentNames.add(normalizedName);
      components[name] = value;
    }
    const payload = {
      ...values,
      slug: values.slug || slugify(values.name),
      price: Number(values.price),
      salePrice: values.salePrice === '' ? null : Number(values.salePrice),
      stockQuantity: Number(values.stockQuantity),
      images: [...existingImages],
      ...(editing && existingImages.length === initialImages.length &&
        existingImages.every((imageUrl, index) => imageUrl === initialImages[index])
        ? { images: undefined }
        : {}),
      productImages: selectedImages,
      sizes: split(values.sizes),
      colors: split(values.colors),
      specifications,
      components,
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
        <label className="field">Condition<input className="input" maxLength="100" placeholder="e.g. 9.5/10, New, or Used" {...register('condition')} /></label>
        <label className="field">Category<select className="input" {...register('category', { required: 'Choose a category' })}><option value="">Select category</option>{categories.map((category) => <option value={category._id} key={category._id}>{category.name}</option>)}</select></label>
        <label className="field">Price (PKR)<input className="input" type="number" min="0" {...register('price', { required: 'Price is required' })} /></label>
        <label className="field">Sale price (optional)<input className="input" type="number" min="0" {...register('salePrice')} /></label>
        <label className="field">Stock quantity<input className="input" type="number" min="0" {...register('stockQuantity', { required: true })} /></label>
        <label className="field md:col-span-2">Description<textarea className="input min-h-32" {...register('description', { required: 'Description is required', minLength: { value: 10, message: 'Use at least 10 characters' } })} />{errors.description && <small>{errors.description.message}</small>}</label>
        <label className="field">Available sizes <span className="font-normal text-zinc-400">(one per line)</span><textarea className="input min-h-24" {...register('sizes')} /></label>
        <label className="field">Colours <span className="font-normal text-zinc-400">(one per line)</span><textarea className="input min-h-24" {...register('colors')} /></label>
        <fieldset className="min-w-0 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 md:col-span-2 sm:p-5">
          <legend className="px-2 text-sm font-bold text-zinc-900">Specifications</legend>
          <p className="mb-4 text-sm text-zinc-500">Enter only the specifications that apply. Blank fields are not shown to customers.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {specificationRows.map((row) => <div className="grid min-w-0 gap-1.5 rounded-xl border border-zinc-200 bg-white p-2 sm:grid-cols-[0.8fr_1.2fr]" key={row.name}>
              <label className="field"><span className="text-xs font-semibold text-zinc-500">Specification</span><input className="input bg-zinc-50" value={row.name} readOnly /></label>
              <label className="field"><span className="text-xs font-semibold text-zinc-500">Value</span><input className="input" placeholder="Optional" maxLength="500" value={row.value} onChange={(event) => setSpecificationRows((rows) => rows.map((item) => item.name === row.name ? { ...item, value: event.target.value } : item))} /></label>
            </div>)}
            {customSpecifications.map((row, index) => <div className="grid min-w-0 gap-3 rounded-xl border border-zinc-200 bg-white p-3 sm:grid-cols-[1fr_1fr_auto]" key={`custom-${index}`}>
              <label className="field"><span className="text-xs font-semibold text-zinc-500">Custom name</span><input className="input" placeholder="e.g. Model year" maxLength="80" value={row.name} onChange={(event) => setCustomSpecifications((rows) => rows.map((item, rowIndex) => rowIndex === index ? { ...item, name: event.target.value } : item))} /></label>
              <label className="field"><span className="text-xs font-semibold text-zinc-500">Value</span><input className="input" placeholder="Enter a value" maxLength="500" value={row.value} onChange={(event) => setCustomSpecifications((rows) => rows.map((item, rowIndex) => rowIndex === index ? { ...item, value: event.target.value } : item))} /></label>
              <button type="button" className="btn-icon self-end text-red-600" aria-label={`Remove custom specification ${index + 1}`} onClick={() => setCustomSpecifications((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}><X className="h-4 w-4" /></button>
            </div>)}
          </div>
          <button type="button" className="btn-secondary mt-4 w-fit" onClick={() => setCustomSpecifications((rows) => [...rows, { name: '', value: '' }])}>
            <Plus className="h-4 w-4" />Add custom specification
          </button>
        </fieldset>
        <fieldset className="min-w-0 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 md:col-span-2 sm:p-5">
          <legend className="px-2 text-sm font-bold text-zinc-900">Components</legend>
          <p className="mb-4 text-sm text-zinc-500">Add values for the product components. Leave unused fields blank.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {componentRows.map((row) => <div className="grid min-w-0 gap-1.5 rounded-xl border border-zinc-200 bg-white p-2 sm:grid-cols-[0.8fr_1.2fr]" key={row.name}>
              <label className="field"><span className="text-xs font-semibold text-zinc-500">Component</span><input className="input bg-zinc-50" value={row.name} readOnly /></label>
              <label className="field"><span className="text-xs font-semibold text-zinc-500">Value</span><input className="input" placeholder="Optional" maxLength="500" value={row.value} onChange={(event) => setComponentRows((rows) => rows.map((item, rowIndex) => rowIndex === componentNames.indexOf(row.name) ? { ...item, value: event.target.value } : item))} /></label>
            </div>)}
            {customComponents.map((row, index) => <div className="grid min-w-0 gap-1.5 rounded-xl border border-zinc-200 bg-white p-2 sm:grid-cols-[1fr_1fr_auto]" key={`custom-component-${index}`}>
              <label className="field"><span className="text-xs font-semibold text-zinc-500">Custom name</span><input className="input" placeholder="e.g. Crankset" maxLength="80" value={row.name} onChange={(event) => setCustomComponents((rows) => rows.map((item, rowIndex) => rowIndex === index ? { ...item, name: event.target.value } : item))} /></label>
              <label className="field"><span className="text-xs font-semibold text-zinc-500">Value</span><input className="input" placeholder="Enter a value" maxLength="500" value={row.value} onChange={(event) => setCustomComponents((rows) => rows.map((item, rowIndex) => rowIndex === index ? { ...item, value: event.target.value } : item))} /></label>
              <button type="button" className="btn-icon self-end text-red-600" aria-label={`Remove custom component ${index + 1}`} onClick={() => setCustomComponents((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}><X className="h-4 w-4" /></button>
            </div>)}
          </div>
          <button type="button" className="btn-secondary mt-4 w-fit" onClick={() => setCustomComponents((rows) => [...rows, { name: '', value: '' }])}>
            <Plus className="h-4 w-4" />Add custom component
          </button>
        </fieldset>
      </div>
      <div className="mt-6 flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" {...register('isAvailable')} />Available for sale</label>
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" {...register('isFeatured')} />Featured product</label>
      </div>
      <div className="field mt-6">
        <span>Product images <span className="font-normal text-zinc-400">(JPEG, JPG, or PNG · up to 50 MB each · maximum 12 images)</span></span>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-zinc-300 p-4 text-sm font-bold hover:border-zinc-600">
          <ImagePlus className="h-5 w-5" />Choose product images
          <input className="sr-only" type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" multiple onChange={chooseImages} />
        </label>
        {(existingImages.length > 0 || selectedPreviews.length > 0) && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
      <button disabled={isSubmitting} className="btn-primary mt-7">{isSubmitting ? 'Saving…' : 'Save product'}</button>
    </form>
  </>;
}
