import { useEffect, useState } from 'react';
import { Banknote, Boxes, CheckCheck, Clock3, MessageSquareText, PackageCheck } from 'lucide-react';
import { getDashboard } from '../../services/admin.service';
import LoadingSpinner from '../../Components/LoadingSpinner';
import ErrorMessage from '../../Components/ErrorMessage';
import { formatCurrency } from '../../utils/formatCurrency';

const orderStatuses = [
  ['pending_confirmation', 'Pending confirmation'],
  ['confirmed', 'Confirmed'],
  ['processing', 'Processing'],
  ['shipped', 'Shipped'],
  ['delivered', 'Delivered'],
  ['cancelled', 'Cancelled'],
  ['failed', 'Failed'],
];

const metrics = [
  { key: 'products', label: 'Total products', icon: Boxes },
  { key: 'pendingOrders', label: 'Pending confirmation', icon: Clock3 },
];

export default function Dashboard() {
  const [data, setData] = useState();
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard()
      .then((response) => setData(response.data))
      .catch((requestError) => setError(requestError.message));
  }, []);

  if (error) return <ErrorMessage message={error} />;
  if (!data) return <LoadingSpinner label="Loading dashboard" />;

  return <>
    <p className="eyebrow">Overview</p>
    <h1 className="section-title">Dashboard</h1>
    <p className="mt-2 text-sm text-zinc-600">Live sales, order, product, and review metrics.</p>

    <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {metrics.map(({ key, label, icon: Icon }) => <article className="flex aspect-square min-w-0 flex-col rounded-2xl bg-white p-4 shadow-sm sm:p-5" key={key}>
        <Icon className="h-5 w-5 shrink-0 text-brand-dark sm:h-6 sm:w-6" />
        <p className="mt-auto break-words text-3xl font-black leading-none sm:text-4xl">{data[key]}</p>
        <p className="mt-2 text-xs font-bold leading-snug text-zinc-500 sm:text-sm">{label}</p>
      </article>)}
      <article className="flex aspect-square min-w-0 flex-col rounded-2xl bg-white p-4 shadow-sm sm:p-5">
        <Banknote className="h-5 w-5 shrink-0 text-brand-dark sm:h-6 sm:w-6" />
        <p className="mt-auto break-words text-xl font-black leading-tight sm:text-2xl">{formatCurrency(data.sales.deliveredRevenue)}</p>
        <p className="mt-2 text-xs font-bold leading-snug text-zinc-500 sm:text-sm">Revenue from delivered orders</p>
        <p className="mt-1 text-[11px] leading-snug text-zinc-400 sm:text-xs">{data.sales.deliveredOrders} delivered orders</p>
      </article>
      <article className="flex aspect-square min-w-0 flex-col rounded-2xl bg-white p-4 shadow-sm sm:p-5">
        <MessageSquareText className="h-5 w-5 shrink-0 text-brand-dark sm:h-6 sm:w-6" />
        <p className="mt-auto break-words text-3xl font-black leading-none sm:text-4xl">{data.reviews.published}</p>
        <p className="mt-2 text-xs font-bold leading-snug text-zinc-500 sm:text-sm">Published customer reviews</p>
      </article>
    </div>

    <div className="mt-8 grid gap-6 xl:grid-cols-2">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <PackageCheck className="h-6 w-6 text-brand-dark" />
          <div><h2 className="text-xl font-black">Orders by status</h2><p className="mt-1 text-sm text-zinc-500">{Object.values(data.ordersByStatus).reduce((total, count) => total + count, 0)} total orders</p></div>
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          {orderStatuses.map(([key, label]) => <div className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3" key={key}>
            <dt className="text-sm font-medium text-zinc-600">{label}</dt>
            <dd className="text-lg font-black">{data.ordersByStatus[key]}</dd>
          </div>)}
        </dl>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <MessageSquareText className="h-6 w-6 text-brand-dark" />
          <div><h2 className="text-xl font-black">Customer reviews</h2><p className="mt-1 text-sm text-zinc-500">Demo reviews are excluded from these metrics.</p></div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-zinc-50 p-4"><p className="text-2xl font-black">{data.reviews.total}</p><p className="mt-1 text-sm text-zinc-500">Total customer reviews</p></div>
          <div className="rounded-xl bg-zinc-50 p-4"><p className="text-2xl font-black">{data.reviews.published}</p><p className="mt-1 text-sm text-zinc-500">Published</p></div>
          <div className="rounded-xl bg-zinc-50 p-4"><p className="text-2xl font-black">{data.reviews.pending}</p><p className="mt-1 text-sm text-zinc-500">Awaiting moderation</p></div>
          <div className="rounded-xl bg-zinc-50 p-4"><div className="flex items-center gap-2"><CheckCheck className="h-5 w-5 text-brand-dark" /><p className="text-2xl font-black">{data.reviews.averageRating} / 5</p></div><p className="mt-1 text-sm text-zinc-500">Average published rating</p></div>
        </div>
      </section>
    </div>
  </>;
}
