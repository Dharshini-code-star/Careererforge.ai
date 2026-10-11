"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_js_1 = __importDefault(require("./app.js"));
const db_js_1 = require("./config/db.js");
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    try {
        if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
            throw new Error('JWT_SECRET must be configured with at least 32 characters.');
        }
        await (0, db_js_1.connectDB)();
        app_js_1.default.listen(PORT, () => {
            console.log(`
🚀 =================================================== 🚀
   CareerForgeAI Server Running on http://localhost:${PORT}
   Environment: ${process.env.NODE_ENV || 'development'}
🚀 =================================================== 🚀
      `);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
