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
  mapsUrl: settings.mapsUrl,
  aboutMessage: settings.aboutMessage,
  socialLinks: {
    facebook: settings.socialLinks.facebook,
    instagram: settings.socialLinks.instagram,
    tiktok: settings.socialLinks.tiktok,
    youtube: settings.socialLinks.youtube,
  },
  paymentMethods: {
    cashOnDelivery: {
      enabled: settings.paymentMethods?.cashOnDelivery?.enabled ?? true,
      name: settings.paymentMethods?.cashOnDelivery?.name || 'Cash on delivery',
      description: settings.paymentMethods?.cashOnDelivery?.description || '',
    },
    bankTransfer: {
      enabled: settings.paymentMethods?.bankTransfer?.enabled ?? true,
      name: settings.paymentMethods?.bankTransfer?.name || 'Bank transfer',
      description: settings.paymentMethods?.bankTransfer?.description || '',
    },
    walletTransfer: {
      enabled: settings.paymentMethods?.walletTransfer?.enabled ?? true,
      name: settings.paymentMethods?.walletTransfer?.name || 'Wallet transfer',
      description: settings.paymentMethods?.walletTransfer?.description || '',
    },
  },
});
