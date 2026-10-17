import { env } from '../config/env.js';

export const getCodAdvancePaymentInstructions = () => {
  const instructions = {
    provider: env.COD_ADVANCE_PAYMENT_PROVIDER,
    accountTitle: env.COD_ADVANCE_PAYMENT_ACCOUNT_TITLE,
    accountNumber: env.COD_ADVANCE_PAYMENT_ACCOUNT_NUMBER,
    iban: env.COD_ADVANCE_PAYMENT_IBAN,
  };
  return Object.values(instructions).some(Boolean) ? instructions : null;
};

export const getBankTransferPaymentInstructions = () => [
  env.PAYMENT_EASYPAISA_ACCOUNT_NUMBER && {
    method: 'EasyPaisa',
    accountTitle: env.PAYMENT_EASYPAISA_ACCOUNT_TITLE || '',
    accountNumber: env.PAYMENT_EASYPAISA_ACCOUNT_NUMBER,
  },
  env.PAYMENT_JAZZCASH_ACCOUNT_NUMBER && {
    method: 'JazzCash',
    accountTitle: env.PAYMENT_JAZZCASH_ACCOUNT_TITLE || '',
    accountNumber: env.PAYMENT_JAZZCASH_ACCOUNT_NUMBER,
  },
  (env.PAYMENT_BANK_ACCOUNT_NUMBER || env.PAYMENT_BANK_IBAN) && {
    method: 'Bank transfer',
    bankName: env.PAYMENT_BANK_NAME || '',
    accountTitle: env.PAYMENT_BANK_ACCOUNT_TITLE || '',
    accountNumber: env.PAYMENT_BANK_ACCOUNT_NUMBER || '',
    iban: env.PAYMENT_BANK_IBAN || '',
  },
].filter(Boolean);
