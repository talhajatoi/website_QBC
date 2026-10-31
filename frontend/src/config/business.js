export const DEFAULT_BUSINESS = Object.freeze({
  storeName: 'Store',
  whatsappNumber: '',
  contactPhone: '',
  contactEmail: '',
  address: '',
  mapsUrl: '',
  aboutMessage: '',
  socialLinks: Object.freeze({
    facebook: '',
    instagram: '',
    tiktok: '',
    youtube: '',
  }),
  paymentMethods: Object.freeze({
    cashOnDelivery: Object.freeze({
      enabled: true,
      name: 'Cash on delivery',
      description: 'Confirm your order on WhatsApp.',
    }),
    bankTransfer: Object.freeze({
      enabled: true,
      name: 'Bank transfer',
      description: 'Pay by bank transfer.',
    }),
    walletTransfer: Object.freeze({
      enabled: true,
      name: 'Wallet transfer',
      description: 'Pay using EasyPaisa or JazzCash.',
    }),
  }),
});
