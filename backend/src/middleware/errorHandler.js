import mongoose from 'mongoose';

/**
 * Central Express error handler — keeps API responses consistent.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error('[API Error]', err);

  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: 'Validation failed', errors: messages });
  }

  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: 'Duplicate key', detail: err.keyValue });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  return res.status(status).json({ success: false, message });
}
