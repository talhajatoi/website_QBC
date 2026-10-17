import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import PaymentInstructions from '../Components/PaymentInstructions';
import { formatCurrency } from '../utils/formatCurrency';

export default function OrderSuccess() {
  const { orderNumber } = useParams();
  const state = useLocation().state || {};
  const whatsappUrl = state.whatsappUrl || sessionStorage.getItem(`qb_whatsapp_${orderNumber}`);
  const order = state.order;
  const paymentInstructions = state.paymentInstructions;

  return <main className="container-page py-16"><div className="mx-auto max-w-2xl rounded-[2rem] border border-zinc-200 bg-white p-8 text-center sm:p-12"><CheckCircle2 className="mx-auto h-14 w-14 text-green-600" /><p className="eyebrow mt-6">Order created</p><h1 className="section-title">Thank you for your order</h1><p className="mt-4 text-zinc-600">Order <strong>{orderNumber}</strong> is pending manual confirmation. Opening WhatsApp only prepares your message—you must press Send yourself.</p>{order && <div className="mt-7 rounded-2xl bg-zinc-50 p-5 text-left text-sm"><div className="flex justify-between"><span>Subtotal</span><strong>{formatCurrency(order.subtotal)}</strong></div><div className="mt-2 flex justify-between"><span>Delivery</span><strong>{formatCurrency(order.deliveryCharge)}</strong></div><div className="mt-3 flex justify-between border-t pt-3 text-base"><span>Grand total</span><strong>{formatCurrency(order.grandTotal)}</strong></div>{order.advancePaymentAmount > 0 && <><div className="mt-4 flex justify-between border-t pt-3"><span>20% advance due now</span><strong>{formatCurrency(order.advancePaymentAmount)}</strong></div><div className="mt-2 flex justify-between"><span>Remaining cash due on delivery</span><strong>{formatCurrency(order.cashOnDeliveryAmount)}</strong></div><div className="mt-3 rounded-xl bg-yellow-50 p-3 text-left leading-6 text-zinc-700"><strong>Advance payment details</strong><PaymentInstructions instructions={paymentInstructions} /></div></>}{order.paymentMethod === 'bank_transfer' && <div className="mt-4 rounded-xl bg-yellow-50 p-4 text-left text-zinc-700"><p className="font-black">Bank and mobile wallet payment details</p><div className="mt-3"><PaymentInstructions instructions={paymentInstructions} /></div></div>}</div>}{whatsappUrl ? <a className="btn-primary mt-8" href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" />Confirm on WhatsApp</a> : <p className="mt-6 text-sm text-red-600">The WhatsApp confirmation link is unavailable in this browser session.</p>}<div className="mt-6"><Link className="font-bold underline" to="/products">Continue shopping</Link></div></div></main>;
}
