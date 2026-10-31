import { asyncHandler } from '../utils/asyncHandler.js';
import { getBankTransferPaymentInstructions, getWalletTransferPaymentInstructions } from '../services/payment.service.js';

export const paymentInstructions = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Payment instructions retrieved successfully',
    data: {
      bankTransfer: getBankTransferPaymentInstructions(),
      walletTransfer: getWalletTransferPaymentInstructions(),
    },
  });
});
