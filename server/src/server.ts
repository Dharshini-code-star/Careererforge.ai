import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be configured with at least 32 characters.');
    }
    await connectDB();

    app.listen(PORT, () => {
      console.log(`
🚀 =================================================== 🚀
   CareerForgeAI Server Running on http://localhost:${PORT}
   Environment: ${process.env.NODE_ENV || 'development'}
🚀 =================================================== 🚀
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
