import { z } from 'zod';
import { normalizeWhatsAppNumber } from '../utils/whatsapp-number.js';

const optionalUrl = z.string().trim().max(2048).refine((value) => {
  if (!value) return true;
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}, 'Enter a valid HTTP or HTTPS URL');
const optionalMapsUrl = z.string().trim().max(2048).refine((value) => {
  if (!value) return true;
  try {
    const parsedUrl = new URL(value);
    const host = parsedUrl.hostname.toLowerCase();
    return ['http:', 'https:'].includes(parsedUrl.protocol) &&
      (host === 'goo.gl' || host === 'maps.app.goo.gl' || host === 'google.com' || host.endsWith('.google.com'));
  } catch {
    return false;
  }
}, 'Enter a Google Maps link');

export const businessSettingsSchema = z.object({
  storeName: z.string().trim().min(1).max(120),
  whatsappNumber: z.string().trim().min(8).max(40).transform(normalizeWhatsAppNumber).refine((value) => /^[1-9]\d{7,14}$/.test(value), 'Use a valid international WhatsApp number with country code'),
  contactPhone: z.string().trim().max(40).default(''),
  contactEmail: z.union([z.literal(''), z.string().trim().email().max(254)]).default(''),
  address: z.string().trim().max(500).default(''),
  mapsUrl: optionalMapsUrl.default(''),
  aboutMessage: z.string().trim().max(5000).default(''),
  socialLinks: z.object({
    facebook: optionalUrl.default(''),
    instagram: optionalUrl.default(''),
    tiktok: optionalUrl.default(''),
    youtube: optionalUrl.default(''),
  }).default({}),
});
