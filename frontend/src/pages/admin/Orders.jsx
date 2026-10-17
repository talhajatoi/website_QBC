import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ExternalLink } from 'lucide-react';
import { getAdminOrders } from '../../services/order.service';
import LoadingSpinner from '../../Components/LoadingSpinner';
import EmptyState from '../../Components/EmptyState';
import Pagination from '../../Components/Pagination';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

const statuses = ['', 'pending_confirmation', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'failed'];
export default function Orders() {
  const [status, setStatus] = useState('');
  const [data, setData] = useState();
  const load = useCallback((page = 1) => getAdminOrders({ status: status || undefined, page, limit: 20 }).then((response) => setData(response.data)).catch((error) => toast.error(error.message)), [status]);
  useEffect(() => { load(); }, [load]);
  if (!data) return <LoadingSpinner label="Loading orders" />;
  return <><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Sales workflow</p><h1 className="section-title">Orders</h1></div><label className="field w-56">Status<select className="input" value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((item) => <option key={item} value={item}>{item ? item.replaceAll('_', ' ') : 'All statuses'}</option>)}</select></label></div>
    {data.orders.length ? <><div className="mt-8 overflow-x-auto rounded-3xl bg-white shadow-sm"><table className="w-full min-w-200 text-left text-sm"><thead className="border-b text-zinc-500"><tr><th className="p-4">Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th>Payment</th><th className="p-4">View</th></tr></thead><tbody>{data.orders.map((order) => <tr className="border-b border-zinc-100" key={order._id}><td className="p-4 font-black">{order.orderNumber}</td><td><p className="font-bold">{order.customer.name}</p><p className="text-xs text-zinc-500">{order.customer.whatsapp}</p></td><td>{formatDate(order.createdAt)}</td><td>{formatCurrency(order.grandTotal)}</td><td><span className="rounded-full bg-yellow-50 px-2 py-1 text-xs font-bold capitalize">{order.status.replaceAll('_', ' ')}</span></td><td className="capitalize">{order.paymentStatus}</td><td className="p-4"><Link className="btn-icon" aria-label={`View ${order.orderNumber}`} to={`/admin/orders/${order._id}`}><ExternalLink className="h-4 w-4" /></Link></td></tr>)}</tbody></table></div><Pagination pagination={data.pagination} onChange={load} /></> : <div className="mt-8"><EmptyState title="No orders found" text="New checkout orders will appear here." /></div>}</>;
}
