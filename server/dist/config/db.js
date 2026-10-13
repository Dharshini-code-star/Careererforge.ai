"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/careerforgeai';
    await mongoose_1.default.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log(`MongoDB connected: ${mongoose_1.default.connection.host}`);
};
exports.connectDB = connectDB;
const closeDB = async () => {
    await mongoose_1.default.disconnect();
};
exports.closeDB = closeDB;
