import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/careerforgeai';
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
};

export const closeDB = async (): Promise<void> => {
  await mongoose.disconnect();
};
