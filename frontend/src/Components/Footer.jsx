import { Link } from 'react-router-dom';
import { useBusiness } from '../hooks/useBusiness';

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
          {socialLinks.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-4 text-sm text-zinc-300">
              {socialLinks.map(([platform, url]) => (
                <a key={platform} href={url} target="_blank" rel="noreferrer">
                  {socialNames[platform]}
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3 className="site-footer-heading font-black uppercase tracking-wider">Need help?</h3>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Create an order online, then confirm it manually on WhatsApp. Your order remains pending until the store confirms it.
          </p>
          <div className="mt-3 grid gap-2 text-sm text-zinc-300">
            {business?.contactPhone && <a href={`tel:${business.contactPhone}`}>{business.contactPhone}</a>}
            {business?.contactEmail && <a href={`mailto:${business.contactEmail}`}>{business.contactEmail}</a>}
          </div>
        </div>
      </div>
      <div className="border-t border-zinc-800 py-5 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} {storeName}
      </div>
    </footer>
  );
}
