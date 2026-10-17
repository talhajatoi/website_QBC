import { ApiError } from '../utils/ApiError.js';

export const validate = (schema, target = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[target]);
  if (!result.success) return next(new ApiError(422, 'Validation failed', result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))));
  if (target === 'query') req.validatedQuery = result.data;
  else req[target] = result.data;
  next();
};
