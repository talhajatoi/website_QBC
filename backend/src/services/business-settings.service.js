import { BusinessSettings } from '../models/business-settings.model.js';
import { normalizeWhatsAppNumber } from '../utils/whatsapp-number.js';

export const getBusinessSettings = async () =>
  (await BusinessSettings.findOne({ key: 'default' })) ||
  new BusinessSettings({ key: 'default' });

export const publicBusinessDetails = (settings) => ({
  storeName: settings.storeName,
  whatsappNumber: normalizeWhatsAppNumber(settings.whatsappNumber),
  contactPhone: settings.contactPhone,
  contactEmail: settings.contactEmail,
  address: settings.address,
  socialLinks: {
    facebook: settings.socialLinks.facebook,
    instagram: settings.socialLinks.instagram,
    tiktok: settings.socialLinks.tiktok,
    youtube: settings.socialLinks.youtube,
  },
});
