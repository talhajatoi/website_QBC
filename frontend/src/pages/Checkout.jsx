import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../hooks/useCart';
import { createOrder, getPaymentInstructions } from '../services/order.service';
import EmptyState from '../Components/EmptyState';
import PaymentInstructions from '../Components/PaymentInstructions';
import { formatCurrency } from '../utils/formatCurrency';
import { useBusiness } from '../hooks/useBusiness';

const paymentMethodOptions = [
  ['cash_on_delivery', 'cashOnDelivery'],
  ['bank_transfer', 'bankTransfer'],
  ['wallet_transfer', 'walletTransfer'],
];

export default function Checkout() {
  const { cart, clear } = useCart();
  const { business } = useBusiness();
  const { register, handleSubmit, control, setValue, formState: { errors, isSubmitting } } = useForm({ defaultValues: { paymentMethod: 'cash_on_delivery' } });
  const paymentMethod = useWatch({ control, name: 'paymentMethod' });
  const availablePaymentMethods = useMemo(() => paymentMethodOptions
    .map(([value, key]) => ({ value, ...business.paymentMethods?.[key], key }))
    .filter((method) => method.enabled), [business.paymentMethods]);
  const selectedPaymentMethod = paymentMethodOptions.find(([value]) => value === paymentMethod)?.[1];
  const selectedPaymentSettings = selectedPaymentMethod
    ? business.paymentMethods?.[selectedPaymentMethod]
    : null;
  const advanceAmount = Math.round((cart.subtotal || 0) * 0.2);
  const nav = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');
  const [transferInstructions, setTransferInstructions] = useState({ bankTransfer: [], walletTransfer: [] });
  const [loadingInstructions, setLoadingInstructions] = useState(false);
  const [instructionsError, setInstructionsError] = useState('');

  useEffect(() => {
    if (availablePaymentMethods.some((method) => method.value === paymentMethod)) return;
    setValue('paymentMethod', availablePaymentMethods[0]?.value || '');
  }, [availablePaymentMethods, paymentMethod, setValue]);

  useEffect(() => {
    if (paymentMethod !== 'bank_transfer' && paymentMethod !== 'wallet_transfer') {
      setInstructionsError('');
      return undefined;
    }
    let active = true;
    setLoadingInstructions(true);
    setInstructionsError('');
    getPaymentInstructions().then((response) => {
      if (active) setTransferInstructions({
        bankTransfer: response.data.bankTransfer || [],
        walletTransfer: response.data.walletTransfer || [],
      });
    }).catch((error) => {
      if (active) setInstructionsError(error.message);
    }).finally(() => {
      if (active) setLoadingInstructions(false);
    });
    return () => { active = false; };
  }, [paymentMethod]);
  const visibleTransferInstructions = paymentMethod === 'wallet_transfer'
    ? transferInstructions.walletTransfer
    : transferInstructions.bankTransfer;

  if (!cart.items?.length) return <main className="container-page py-16"><EmptyState title="Your cart is empty" text="Add an item before starting checkout." /></main>;

  const submit = async (values) => {
    setServerError('');
    try {
      const attribution = Object.fromEntries(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid', 'ig_source'].map((key) => [key, new URLSearchParams(location.search).get(key) || undefined]));
      const response = await createOrder({ customer: { name: values.name, whatsapp: values.whatsapp, address: values.address }, items: cart.items.map((item) => ({ productId: item.productId, quantity: item.quantity, selectedOptions: item.selectedOptions || {} })), paymentMethod: values.paymentMethod, customerNotes: values.notes || '', attribution }, crypto.randomUUID().replaceAll('-', ''));
      sessionStorage.setItem(`qb_order_${response.data.order.orderNumber}`, response.data.orderAccessToken);
      sessionStorage.setItem(`qb_whatsapp_${response.data.order.orderNumber}`, response.data.whatsappUrl);
      await clear();
      nav(`/order-success/${response.data.order.orderNumber}`, { state: response.data });
    } catch (error) {
      setServerError(error.message);
      toast.error(error.message);
    }
  };

  return <main className="container-page py-12"><h1 className="section-title">Checkout</h1><p className="mt-2 text-zinc-600">Your final price and stock are verified by the store before the WhatsApp draft opens.</p><div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]"><form onSubmit={handleSubmit(submit)} className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8"><h2 className="text-xl font-black">Delivery details</h2>{serverError && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{serverError}</p>}<div className="mt-5 grid gap-5"><label className="field">Full name<input className="input" {...register('name', { required: 'Your name is required', minLength: { value: 2, message: 'Enter at least 2 characters' } })} />{errors.name && <small>{errors.name.message}</small>}</label><label className="field">WhatsApp number<input placeholder="+923001234567" className="input" {...register('whatsapp', { required: 'A WhatsApp number is required', pattern: { value: /^\+?[0-9\s-]{8,20}$/, message: 'Enter a valid phone number' } })} />{errors.whatsapp && <small>{errors.whatsapp.message}</small>}</label><label className="field">Delivery address<textarea className="input min-h-28" {...register('address', { required: 'Delivery address is required', minLength: { value: 10, message: 'Add a complete address' } })} />{errors.address && <small>{errors.address.message}</small>}</label><label className="field">Payment method<select className="input" {...register('paymentMethod')} disabled={!availablePaymentMethods.length}><option value="">No payment methods are currently available</option>{availablePaymentMethods.map((method) => <option key={method.value} value={method.value}>{method.name}</option>)}</select></label>
    {!availablePaymentMethods.length && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">No payment methods are currently available. Please contact the store.</p>}
    {paymentMethod === 'cash_on_delivery' && <div className="rounded-xl border border-brand/50 bg-yellow-50 p-4 text-sm"><p className="font-black">{selectedPaymentSettings?.name}</p>{selectedPaymentSettings?.description && <p className="mt-1 text-zinc-600">{selectedPaymentSettings.description}</p>}<p className="mt-3 font-bold">20% advance required: {formatCurrency(advanceAmount)}</p><p className="mt-1 text-zinc-600">Calculated on the bicycle subtotal (delivery excluded). The remaining balance, including delivery, is due on delivery. Confirm your order with the store on WhatsApp.</p></div>}
    {(paymentMethod === 'bank_transfer' || paymentMethod === 'wallet_transfer') && <div className="rounded-xl border border-brand/50 bg-yellow-50 p-4 text-sm"><p className="font-black">{selectedPaymentSettings?.name}</p>{selectedPaymentSettings?.description && <p className="mt-1 text-zinc-600">{selectedPaymentSettings.description}</p>}{loadingInstructions ? <p className="mt-2 text-zinc-600">Loading payment details…</p> : instructionsError ? <p className="mt-2 text-red-700">{instructionsError}</p> : visibleTransferInstructions.length ? <div className="mt-3"><PaymentInstructions instructions={visibleTransferInstructions} /></div> : <p className="mt-2 text-red-700">{paymentMethod === 'wallet_transfer' ? 'Wallet account details' : 'Bank account details'} have not been configured. Please contact the store.</p>}</div>}
    <label className="field">Order notes <span className="font-normal text-zinc-400">(optional)</span><textarea className="input min-h-24" {...register('notes')} /></label></div><button disabled={isSubmitting || !availablePaymentMethods.length || ((paymentMethod === 'bank_transfer' || paymentMethod === 'wallet_transfer') && (loadingInstructions || !visibleTransferInstructions.length || Boolean(instructionsError)))} className="btn-primary mt-7">{isSubmitting ? 'Creating secure order…' : 'Create order & continue'}</button></form><aside className="h-fit rounded-3xl bg-zinc-950 p-7 text-white"><h2 className="text-xl font-black">Your order</h2><div className="mt-5 grid gap-3">{cart.items.map((item) => <div key={item.id} className="flex justify-between gap-3 text-sm text-zinc-300"><span>{item.name} × {item.quantity}</span><span>{formatCurrency(item.lineTotal)}</span></div>)}</div><div className="mt-6 flex justify-between border-t border-zinc-700 pt-5 text-lg font-black"><span>Subtotal</span><span>{formatCurrency(cart.subtotal)}</span></div><p className="mt-4 text-xs leading-5 text-zinc-400">Delivery charges are calculated by the backend and shown after order creation.</p></aside></div></main>;
}
