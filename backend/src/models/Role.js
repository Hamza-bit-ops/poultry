import mongoose from 'mongoose';

/**
 * Application roles with optional permission strings for future RBAC expansion.
 */
const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    permissions: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

export const Role = mongoose.model('Role', roleSchema);
