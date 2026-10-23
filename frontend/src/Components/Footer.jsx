import { Link } from 'react-router-dom';
import { useBusiness } from '../hooks/useBusiness';
import { Mail, MapPin, Phone } from 'lucide-react';
import SocialIcon from './SocialIcon';

const socialNames = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

export default function Footer() {
  const { business } = useBusiness();
  const storeName = business.storeName || 'Store';
  const socialLinks = Object.entries(business?.socialLinks || {}).filter(([, url]) => url);

  return (
    <footer className="site-footer mt-20">
      <div className="container-page grid gap-10 py-14 md:grid-cols-3">
        <div>
          <Link to="/" className="site-brand" aria-label={`${storeName} home`}>
            <img className="site-logo-image site-footer-logo" src="/quetta-bikes-club-logo.png" alt={storeName} />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-zinc-400">
            Quality rides for everyday journeys and weekend adventures.
          </p>
        </div>
        <div>
          <h3 className="site-footer-heading font-black uppercase tracking-wider">Explore</h3>
          <div className="mt-3 grid gap-2 text-sm text-zinc-400">
            <Link to="/products">Shop bicycles</Link>
            <Link to="/categories">Categories</Link>
            <Link to="/about">About us</Link>
          </div>
        </div>
        <div>
          <h3 className="site-footer-heading font-black uppercase tracking-wider">Need help?</h3>
          <div className="mt-4 grid gap-3 text-sm text-zinc-300">
            {business?.contactPhone && <a className="flex items-center gap-2 hover:text-brand" href={`tel:${business.contactPhone}`}><Phone className="h-4 w-4 shrink-0" />{business.contactPhone}</a>}
            {business?.contactEmail && <a className="flex min-w-0 items-center gap-2 break-all hover:text-brand" href={`mailto:${business.contactEmail}`}><Mail className="h-4 w-4 shrink-0" />{business.contactEmail}</a>}
            {business?.address && <Link className="flex items-center gap-2 hover:text-brand" to="/contact"><MapPin className="h-4 w-4 shrink-0" />Visit us</Link>}
          </div>
          {socialLinks.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-3">
              {socialLinks.map(([platform, url]) => (
                <a
                  key={platform}
                  className="grid h-10 w-10 place-items-center rounded-full border border-zinc-700 text-zinc-300 transition hover:border-brand hover:text-brand"
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={socialNames[platform]}
                  title={socialNames[platform]}
                >
                  <SocialIcon platform={platform} className="h-5 w-5" />
                </a>
              ))}
            </div>
          )}
          {!business?.contactPhone && !business?.contactEmail && !socialLinks.length && (
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Contact details will be available soon.
            </p>
          )}
          <div className="mt-4">
            <Link className="text-sm font-bold text-brand hover:underline" to="/contact">All contact details</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-zinc-800 py-5 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} {storeName}
      </div>
    </footer>
  );
}
