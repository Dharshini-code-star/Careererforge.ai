"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const JobPostingSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    company: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, default: '', trim: true, maxlength: 30000 },
    source: { type: String, enum: ['user-provided', 'remotive', 'arbeitnow', 'adzuna'], default: 'user-provided' },
    providerId: { type: String, trim: true, maxlength: 200 },
    url: { type: String, trim: true, maxlength: 2048 },
    location: { type: String, trim: true, maxlength: 300 },
    remote: { type: Boolean },
    workplace: { type: String, enum: ['remote', 'hybrid', 'on-site', ''], default: '' },
    employmentType: { type: String, trim: true, maxlength: 100 },
    experienceLevel: { type: String, trim: true, maxlength: 100 },
    salary: { type: String, trim: true, maxlength: 200 },
    requiredSkills: { type: [String], default: [] },
    preferredSkills: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    postedAt: { type: Date },
    isSaved: { type: Boolean, default: false },
    lastSeenAt: { type: Date },
}, { timestamps: true });
JobPostingSchema.index({ userId: 1, updatedAt: -1 });
JobPostingSchema.index({ userId: 1, source: 1, providerId: 1 }, { unique: true, partialFilterExpression: { providerId: { $type: 'string' } } });
exports.default = mongoose_1.default.model('JobPosting', JobPostingSchema);
