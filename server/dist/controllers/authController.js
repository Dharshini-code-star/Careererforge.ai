"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.loginUser = exports.registerUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_js_1 = __importDefault(require("../models/User.js"));
const generateToken = (id) => {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32)
        throw new Error('JWT_SECRET must be configured with at least 32 characters.');
    const expire = process.env.JWT_EXPIRE || '30d';
    return jsonwebtoken_1.default.sign({ id }, secret, { expiresIn: expire });
};
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, email, password, targetRole } = req.body;
        if (typeof name !== 'string' || !name.trim() || name.trim().length > 100 ||
            typeof email !== 'string' || typeof password !== 'string') {
            res.status(400).json({
                success: false,
                message: 'Please provide name, email, and password.',
            });
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({
                success: false,
                message: 'Please provide a valid email address.',
            });
            return;
        }
        if (password.length < 8 || password.length > 128) {
            res.status(400).json({
                success: false,
                message: 'Password must be between 8 and 128 characters long.',
            });
            return;
        }
        // Check if user already exists
        const existingUser = await User_js_1.default.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: 'User already exists with this email address.',
            });
            return;
        }
        // Create user
        const user = await User_js_1.default.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            targetRole: typeof targetRole === 'string' ? targetRole.trim() : '',
        });
        const token = generateToken(user._id.toString());
        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                headline: user.headline,
                bio: user.bio,
                skills: user.skills,
                targetRole: user.targetRole,
                avatarUrl: user.avatarUrl,
                createdAt: user.createdAt,
            },
        });
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error during registration.',
        });
    }
};
exports.registerUser = registerUser;
// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' ||
            password.length === 0 || password.length > 128) {
            res.status(400).json({
                success: false,
                message: 'Please provide both email and password.',
            });
            return;
        }
        // Find user by email and explicitly select password
        const user = await User_js_1.default.findOne({ email: email.toLowerCase().trim() }).select('+password');
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials. User not found.',
            });
            return;
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials. Password incorrect.',
            });
            return;
        }
        const token = generateToken(user._id.toString());
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                headline: user.headline,
                bio: user.bio,
                skills: user.skills,
                targetRole: user.targetRole,
                avatarUrl: user.avatarUrl,
                createdAt: user.createdAt,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error during login.',
        });
    }
};
exports.loginUser = loginUser;
// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authorized' });
            return;
        }
        res.json({
            success: true,
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                headline: req.user.headline,
                bio: req.user.bio,
                skills: req.user.skills,
                targetRole: req.user.targetRole,
                avatarUrl: req.user.avatarUrl,
                createdAt: req.user.createdAt,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error fetching user profile.',
        });
    }
};
exports.getMe = getMe;
