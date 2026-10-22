import { ExternalLink, Mail, MapPin, MessageCircle, Phone, Store } from 'lucide-react';
import { useBusiness } from '../hooks/useBusiness';

const socialNames = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

const isGoogleMapsLink = (value) => {
  try {
    const { protocol, hostname } = new URL(value);
    const host = hostname.toLowerCase();
    return ['http:', 'https:'].includes(protocol) &&
      (host === 'goo.gl' || host === 'maps.app.goo.gl' || host === 'google.com' || host.endsWith('.google.com'));
  } catch {
    return false;
  }
};

export default function Contact() {
  const { business, loading, error } = useBusiness();
  const whatsapp = business?.whatsappNumber?.replace(/\D/g, '');
  const socials = Object.entries(business?.socialLinks || {}).filter(([, url]) => url);
  const addressIsMapsLink = isGoogleMapsLink(business?.address || '');
  const mapsUrl = business?.mapsUrl || (addressIsMapsLink
    ? business.address
    : business?.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`
      : '');
  const hasContactDetails = whatsapp || business?.contactPhone || business?.contactEmail || business?.address || socials.length;

  return (
    <main className="container-page py-16">
      <p className="eyebrow">Get in touch</p>
      <h1 className="section-title">Questions before you ride?</h1>
      <p className="mt-5 max-w-xl leading-7 text-zinc-600">
        Reach {business?.storeName || 'our store'} using the contact details below.
      </p>
      <section aria-label="Public store details" className="mt-8 max-w-3xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3 border-b border-zinc-100 pb-5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-yellow-50 text-brand-dark">
            <Store className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-black">{business?.storeName || 'Store contact details'}</h2>
            <p className="mt-1 text-sm text-zinc-500">Public contact information</p>
          </div>
        </div>

        {loading ? (
          <p className="py-6 text-sm text-zinc-500">Loading store contact details…</p>
        ) : error ? (
          <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            Store contact details could not be loaded. Please try again later.
          </p>
        ) : !hasContactDetails ? (
          <p className="py-6 text-sm text-zinc-500">Contact information has not been added yet.</p>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {whatsapp && (
              <a className="flex min-w-0 items-center gap-3 rounded-2xl border border-zinc-200 p-4 font-bold transition hover:border-zinc-400" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
                <MessageCircle className="h-5 w-5 shrink-0 text-brand-dark" />
                <span className="min-w-0"><span className="block text-xs font-semibold text-zinc-500">WhatsApp</span><span className="block break-all">Chat with us</span></span>
                <ExternalLink className="ml-auto h-4 w-4 shrink-0 text-zinc-400" />
              </a>
            )}
            {business?.contactPhone && (
              <a className="flex min-w-0 items-center gap-3 rounded-2xl border border-zinc-200 p-4 font-bold transition hover:border-zinc-400" href={`tel:${business.contactPhone}`}>
                <Phone className="h-5 w-5 shrink-0 text-brand-dark" />
                <span className="min-w-0"><span className="block text-xs font-semibold text-zinc-500">Phone</span><span className="block break-all">{business.contactPhone}</span></span>
              </a>
            )}
            {business?.contactEmail && (
              <a className="flex min-w-0 items-center gap-3 rounded-2xl border border-zinc-200 p-4 font-bold transition hover:border-zinc-400" href={`mailto:${business.contactEmail}`}>
                <Mail className="h-5 w-5 shrink-0 text-brand-dark" />
                <span className="min-w-0"><span className="block text-xs font-semibold text-zinc-500">Email</span><span className="block break-all">{business.contactEmail}</span></span>
              </a>
            )}
            {business?.address && (
              <a className="flex min-w-0 items-start gap-3 rounded-2xl border border-zinc-200 p-4 transition hover:border-zinc-400 sm:col-span-2" href={mapsUrl} target="_blank" rel="noreferrer">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-dark" />
                <span className="min-w-0"><span className="block text-xs font-semibold text-zinc-500">Address</span><span className="block whitespace-pre-line break-words font-medium">{addressIsMapsLink ? 'Open exact store location in Google Maps' : business.address}</span></span>
                <ExternalLink className="ml-auto mt-1 h-4 w-4 shrink-0 text-zinc-400" />
              </a>
            )}
            {socials.map(([platform, url]) => (
              <a key={platform} className="flex min-w-0 items-center gap-3 rounded-2xl border border-zinc-200 p-4 font-bold transition hover:border-zinc-400" href={url} target="_blank" rel="noreferrer">
                <ExternalLink className="h-5 w-5 shrink-0 text-brand-dark" />
                <span className="min-w-0"><span className="block text-xs font-semibold text-zinc-500">Social media</span><span className="block break-all">{socialNames[platform]}</span></span>
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
