"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_js_1 = __importDefault(require("./routes/authRoutes.js"));
const userRoutes_js_1 = __importDefault(require("./routes/userRoutes.js"));
const workspaceRoutes_js_1 = __importDefault(require("./routes/workspaceRoutes.js"));
const errorMiddleware_js_1 = require("./middleware/errorMiddleware.js");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...(process.env.CLIENT_ORIGIN ? [process.env.CLIENT_ORIGIN] : []),
];
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'CareerForgeAI API server is healthy and running',
        timestamp: new Date().toISOString(),
    });
});
// API Routes
app.use('/api/auth', authRoutes_js_1.default);
app.use('/api/user', userRoutes_js_1.default);
app.use('/api/workspace', workspaceRoutes_js_1.default);
// 404 & Error Handlers
app.use(errorMiddleware_js_1.notFound);
app.use(errorMiddleware_js_1.errorHandler);
exports.default = app;
