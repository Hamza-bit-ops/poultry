import mongoose from 'mongoose';

/**
 * Connects to MongoDB using MONGODB_URI from environment.
 * Throws on failure so the server can exit cleanly.
 */
export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment');
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  return mongoose.connection;
}
