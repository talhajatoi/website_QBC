import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useBusiness } from '../hooks/useBusiness';

export default function Contact() {
  const { business, error } = useBusiness();
  const whatsapp = business?.whatsappNumber?.replace(/\D/g, '');

  return (
    <main className="container-page py-16">
      <p className="eyebrow">Get in touch</p>
      <h1 className="section-title">Questions before you ride?</h1>
      <p className="mt-5 max-w-xl leading-7 text-zinc-600">
        Contact the store using the details below, or create an order and continue through its WhatsApp confirmation message.
      </p>
      {error && <p role="alert" className="mt-5 max-w-2xl rounded-xl bg-red-50 p-4 text-sm text-red-700">Store contact details could not be loaded. Please try again later.</p>}
      <div className="mt-8 grid max-w-2xl gap-4">
        {whatsapp && (
          <a className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-5 font-bold" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
            <MessageCircle className="h-5 w-5 text-brand-dark" />WhatsApp
          </a>
        )}
        {business?.contactPhone && (
          <a className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-5 font-bold" href={`tel:${business.contactPhone}`}>
            <Phone className="h-5 w-5 text-brand-dark" />{business.contactPhone}
          </a>
        )}
        {business?.contactEmail && (
          <a className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-5 font-bold" href={`mailto:${business.contactEmail}`}>
            <Mail className="h-5 w-5 text-brand-dark" />{business.contactEmail}
          </a>
        )}
        {business?.address && (
          <p className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-5">
            <MapPin className="h-5 w-5 shrink-0 text-brand-dark" />{business.address}
          </p>
        )}
      </div>
    </main>
  );
}
