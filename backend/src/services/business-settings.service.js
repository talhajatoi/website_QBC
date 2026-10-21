import { BusinessSettings } from '../models/business-settings.model.js';

export const getBusinessSettings = async () =>
  (await BusinessSettings.findOne({ key: 'default' })) ||
  new BusinessSettings({ key: 'default' });

export const publicBusinessDetails = (settings) => ({
  storeName: settings.storeName,
  whatsappNumber: settings.whatsappNumber.replace(/\D/g, ''),
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
