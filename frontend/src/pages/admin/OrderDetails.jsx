import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ExternalLink } from "lucide-react";
import {
  getAdminOrder,
  updateAdvancePaymentStatus,
  updateOrderNotes,
  updateOrderStatus,
  updatePaymentStatus,
} from "../../services/order.service";
import LoadingSpinner from "../../Components/LoadingSpinner";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";

const orderStatuses = [
  "pending_confirmation",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "failed",
];
const payments = ["unpaid", "pending", "paid", "refunded", "failed"];
export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState();
  const [notes, setNotes] = useState("");
  const load = useCallback(
    () =>
      getAdminOrder(id)
        .then((response) => {
          setOrder(response.data.order);
          setNotes(response.data.order.internalNotes || "");
        })
        .catch((error) => toast.error(error.message)),
    [id],
  );
  useEffect(() => {
    load();
  }, [load]);
  const mutate = async (action, message) => {
    try {
      await action();
      toast.success(message);
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };
  if (!order) return <LoadingSpinner label="Loading order" />;
  return (
    <>
      <Link className="text-sm font-bold underline" to="/admin/orders">
        ← Orders
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Order details</p>
          <h1 className="section-title">{order.orderNumber}</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Created {formatDate(order.createdAt)}
          </p>
        </div>
        <a
          className="btn-secondary"
          href={`https://wa.me/${order.customer.whatsapp.replace(/\D/g, "")}`}
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink className="h-4 w-4" />
          WhatsApp customer
        </a>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Items</h2>
          {order.items.map((item) => (
            <div
              className="mt-5 flex justify-between gap-4 border-b border-zinc-100 pb-4 text-sm"
              key={`${item.sku}-${item.name}`}
            >
              <div>
                <p className="font-bold">{item.name}</p>
                <p className="mt-1 text-zinc-500">
                  {item.sku} · {item.quantity} ×{" "}
                  {formatCurrency(item.unitPrice)}
                </p>
              </div>
              <strong>{formatCurrency(item.lineTotal)}</strong>
            </div>
          ))}
          <div className="mt-6 grid gap-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>{formatCurrency(order.deliveryCharge)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <span>{formatCurrency(order.discount)}</span>
            </div>
            <div className="flex justify-between border-t pt-3 text-base font-black">
              <span>Grand total</span>
              <span>{formatCurrency(order.grandTotal)}</span>
            </div>
            {order.advancePaymentAmount > 0 && (
              <>
                <div className="mt-2 flex justify-between border-t pt-3">
                  <span>20% advance</span>
                  <span>{formatCurrency(order.advancePaymentAmount)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Cash due on delivery</span>
                  <span>{formatCurrency(order.cashOnDeliveryAmount)}</span>
                </div>
              </>
            )}
          </div>
        </section>
        <aside className="grid gap-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="font-black">Customer & delivery</h2>
            <p className="mt-4 font-bold">{order.customer.name}</p>
            <p className="text-sm text-zinc-600">{order.customer.whatsapp}</p>
            <p className="mt-4 text-sm leading-6 text-zinc-600">
              {order.customer.address}
            </p>
            {order.customerNotes && (
              <p className="mt-4 rounded-xl bg-zinc-50 p-3 text-sm">
                Note: {order.customerNotes}
              </p>
            )}
          </section>
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="font-black">Update order</h2>
            <label className="field mt-4">
              Status
              <select
                className="input"
                value={order.status}
                onChange={(event) =>
                  mutate(
                    () => updateOrderStatus(id, event.target.value),
                    "Order status updated",
                  )
                }
              >
                <option value={order.status}>
                  {order.status.replaceAll("_", " ")}
                </option>
                {orderStatuses
                  .filter((item) => item !== order.status)
                  .map((item) => (
                    <option key={item} value={item}>
                      {item.replaceAll("_", " ")}
                    </option>
                  ))}
              </select>
            </label>
            <label className="field mt-4">
              Payment status
              <select
                className="input"
                value={order.paymentStatus}
                onChange={(event) =>
                  mutate(
                    () => updatePaymentStatus(id, event.target.value),
                    "Payment status updated",
                  )
                }
              >
                {payments.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            {order.advancePaymentAmount > 0 && (
              <label className="field mt-4">
                COD advance status
                <select
                  className="input"
                  value={order.advancePaymentStatus}
                  onChange={(event) =>
                    mutate(
                      () => updateAdvancePaymentStatus(id, event.target.value),
                      "COD advance status updated",
                    )
                  }
                >
                  <option value="pending">Pending proof/payment</option>
                  <option value="paid">Advance received</option>
                </select>
              </label>
            )}
            <label className="field mt-4">
              Internal notes
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="input min-h-28"
              />
            </label>
            <button
              className="btn-secondary mt-4"
              onClick={() =>
                mutate(() => updateOrderNotes(id, notes), "Notes saved")
              }
            >
              Save notes
            </button>
          </section>
        </aside>
      </div>
    </>
  );
}
