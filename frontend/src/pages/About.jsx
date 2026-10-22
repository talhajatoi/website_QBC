import { useBusiness } from '../hooks/useBusiness';

export default function About() {
  const { business } = useBusiness();
  const storeName = business.storeName || 'The store';
  const message = business.aboutMessage || `${storeName} brings together a clear online catalogue and a practical, human ordering process. Explore the current collection, choose your options, and confirm your order directly with the store on WhatsApp.`;
  return <main className="container-page py-16"><p className="eyebrow">About {storeName}</p><h1 className="section-title max-w-3xl">Bicycles selected for everyday journeys and open roads.</h1><p className="mt-6 max-w-2xl whitespace-pre-line leading-8 text-zinc-600">{message}</p></main>;
}
