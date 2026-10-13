"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_js_1 = __importDefault(require("../models/User.js"));
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        res.status(401).json({
            success: false,
            message: 'Not authorized to access this route. Missing authentication token.',
        });
        return;
    }
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret || secret.length < 32) {
            res.status(500).json({ success: false, message: 'Authentication is not configured on this server.' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        const user = await User_js_1.default.findById(decoded.id).select('-password');
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'The user belonging to this token no longer exists.',
            });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: 'Not authorized. Token verification failed or expired.',
        });
    }
};
exports.protect = protect;
