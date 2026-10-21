import { asyncHandler } from '../utils/asyncHandler.js';
import { getBusinessSettings, publicBusinessDetails } from '../services/business-settings.service.js';
import { BusinessSettings } from '../models/business-settings.model.js';

export const getPublicBusinessSettings = asyncHandler(async (req, res) => {
  const settings = await getBusinessSettings();
  res.json({
    success: true,
    message: 'Business details retrieved successfully',
    data: { business: publicBusinessDetails(settings) },
  });
});

export const updateBusinessSettings = asyncHandler(async (req, res) => {
  const settings = await BusinessSettings.findOneAndUpdate(
    { key: 'default' },
    { $set: req.body, $setOnInsert: { key: 'default' } },
    { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
  );
  res.json({
    success: true,
    message: 'Business details updated successfully',
    data: { business: publicBusinessDetails(settings) },
  });
});
