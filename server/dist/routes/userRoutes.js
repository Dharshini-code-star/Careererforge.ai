"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_js_1 = require("../controllers/userController.js");
const authMiddleware_js_1 = require("../middleware/authMiddleware.js");
const router = (0, express_1.Router)();
router.put('/profile', authMiddleware_js_1.protect, userController_js_1.updateProfile);
router.get('/dashboard', authMiddleware_js_1.protect, userController_js_1.getDashboardSummary);
exports.default = router;
