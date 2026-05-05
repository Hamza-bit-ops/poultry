import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/** Register first user or additional users (admin-only expansion can be added later). */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, roleId } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required' });
  }
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already registered' });
  }
  let role = roleId ? await Role.findById(roleId) : await Role.findOne({ name: 'Operator' });
  if (!role) {
    role = await Role.create({ name: 'Operator', description: 'Default role' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: role._id,
  });
  const token = signToken(user._id);
  const populated = await User.findById(user._id).select('-passwordHash').populate('role');
  res.status(201).json({ success: true, data: { user: populated, token } });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }
  const user = await User.findOne({ email: email.toLowerCase() }).populate('role');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Account disabled' });
  }
  const token = signToken(user._id);
  user.passwordHash = undefined;
  res.json({ success: true, data: { user, token } });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});
