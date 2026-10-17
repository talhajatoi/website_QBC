import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { deleteProduct, getAdminProducts, updateStock } from '../../services/product.service';
import LoadingSpinner from '../../Components/LoadingSpinner';
import EmptyState from '../../Components/EmptyState';
import ErrorMessage from '../../Components/ErrorMessage';
import { formatCurrency } from '../../utils/formatCurrency';

export default function ProductsManagement() {
  const [data, setData] = useState(); const [error, setError] = useState(''); const [savingId, setSavingId] = useState('');
  const load = useCallback(() => { setError(''); return getAdminProducts({ limit: 100 }).then((response) => setData(response.data)).catch((requestError) => setError(requestError.message)); }, []);
  useEffect(() => { load(); }, [load]);
  const remove = async (product) => { if (!window.confirm(`Delete ${product.name}? This cannot be undone.`)) return; try { await deleteProduct(product._id); toast.success('Product deleted'); load(); } catch (requestError) { toast.error(requestError.message); } };
  const setStock = async (product) => { const value = window.prompt(`Set stock quantity for ${product.name}`, product.stockQuantity); if (value === null) return; const stockQuantity = Number(value); if (!Number.isInteger(stockQuantity) || stockQuantity < 0) { toast.error('Stock must be a whole number of zero or more.'); return; } try { setSavingId(product._id); await updateStock(product._id, stockQuantity); toast.success('Stock updated'); load(); } catch (requestError) { toast.error(requestError.message); } finally { setSavingId(''); } };
  if (error && !data) return <><ErrorMessage message={error} /><button className="btn-secondary mt-5" onClick={load}><RefreshCw className="h-4 w-4" />Try again</button></>;
  if (!data) return <LoadingSpinner label="Loading products" />;
  return <><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Catalogue</p><h1 className="section-title">Products</h1></div><Link className="btn-primary" to="/admin/products/new"><Plus className="h-4 w-4" />New product</Link></div>{error && <div className="mt-6"><ErrorMessage message={error} /></div>}{data.products.length ? <div className="mt-8 overflow-x-auto rounded-3xl bg-white shadow-sm"><table className="w-full min-w-200 text-left text-sm"><thead className="border-b text-zinc-500"><tr><th className="p-4">Product</th><th>SKU</th><th>Price</th><th>Stock</th><th>Status</th><th className="p-4">Actions</th></tr></thead><tbody>{data.products.map((product) => <tr className="border-b border-zinc-100" key={product._id}><td className="p-4 font-bold">{product.name}</td><td>{product.sku}</td><td>{formatCurrency(product.salePrice ?? product.price)}</td><td><button disabled={savingId === product._id} onClick={() => setStock(product)} className="rounded-lg border border-zinc-200 px-2 py-1 font-bold hover:border-zinc-950">{savingId === product._id ? 'Saving…' : product.stockQuantity}</button></td><td>{product.isAvailable ? 'Active' : 'Hidden'}</td><td className="p-4"><div className="flex gap-2"><Link className="btn-icon" aria-label={`Edit ${product.name}`} to={`/admin/products/edit/${product._id}`}><Pencil className="h-4 w-4" /></Link><button className="btn-icon text-red-600" aria-label={`Delete ${product.name}`} onClick={() => remove(product)}><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div> : <div className="mt-8"><EmptyState title="No products created" action={<Link className="btn-primary" to="/admin/products/new">Create first product</Link>} /></div>}</>;
}
