"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardSummary = exports.updateProfile = void 0;
const User_js_1 = __importDefault(require("../models/User.js"));
const WorkspaceItem_js_1 = __importDefault(require("../models/WorkspaceItem.js"));
const JobPosting_js_1 = __importDefault(require("../models/JobPosting.js"));
// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authorized' });
            return;
        }
        const { name, headline, bio, skills, targetRole, avatarUrl } = req.body;
        if (name !== undefined && (typeof name !== 'string' || !name.trim() || name.trim().length > 100)) {
            res.status(400).json({ success: false, message: 'Name must contain between 1 and 100 characters.' });
            return;
        }
        for (const [field, value, maximum] of [
            ['headline', headline, 160],
            ['bio', bio, 2000],
            ['targetRole', targetRole, 160],
            ['avatarUrl', avatarUrl, 2048],
        ]) {
            if (value !== undefined && (typeof value !== 'string' || value.length > maximum)) {
                res.status(400).json({ success: false, message: `${field} must be a string of at most ${maximum} characters.` });
                return;
            }
        }
        if (skills !== undefined &&
            (!Array.isArray(skills) || skills.length > 100 ||
                skills.some((skill) => typeof skill !== 'string' || !skill.trim() || skill.length > 80))) {
            res.status(400).json({ success: false, message: 'Skills must be a list of at most 100 non-empty strings, each 80 characters or fewer.' });
            return;
        }
        const user = await User_js_1.default.findById(req.user._id);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        if (name !== undefined)
            user.name = name.trim();
        if (headline !== undefined)
            user.headline = headline;
        if (bio !== undefined)
            user.bio = bio;
        if (skills !== undefined)
            user.skills = skills;
        if (targetRole !== undefined)
            user.targetRole = targetRole;
        if (avatarUrl !== undefined)
            user.avatarUrl = avatarUrl;
        const updatedUser = await user.save();
        res.json({
            success: true,
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                headline: updatedUser.headline,
                bio: updatedUser.bio,
                skills: updatedUser.skills,
                targetRole: updatedUser.targetRole,
                avatarUrl: updatedUser.avatarUrl,
                createdAt: updatedUser.createdAt,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error updating profile.',
        });
    }
};
exports.updateProfile = updateProfile;
// @desc    Get dashboard summary data for user
// @route   GET /api/user/dashboard
// @access  Private
const getDashboardSummary = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authorized' });
            return;
        }
        const [counts, recentItems, relevantJobs, savedJobs] = await Promise.all([
            WorkspaceItem_js_1.default.aggregate([
                { $match: { userId: req.user._id } },
                {
                    $group: {
                        _id: '$kind',
                        count: { $sum: 1 },
                        publishedCount: { $sum: { $cond: ['$isPublished', 1, 0] } },
                        interviewCount: { $sum: { $cond: [{ $eq: ['$data.status', 'Interview'] }, 1, 0] } },
                        offerCount: { $sum: { $cond: [{ $eq: ['$data.status', 'Offer'] }, 1, 0] } },
                        rejectedCount: { $sum: { $cond: [{ $eq: ['$data.status', 'Rejected'] }, 1, 0] } },
                    },
                },
            ]),
            WorkspaceItem_js_1.default.find({ userId: req.user._id }).sort({ updatedAt: -1 }).limit(5).lean(),
            JobPosting_js_1.default.countDocuments({ userId: req.user._id }),
            JobPosting_js_1.default.countDocuments({ userId: req.user._id, isSaved: true }),
        ]);
        const countFor = (kind) => counts.find((item) => item._id === kind);
        const applications = countFor('application');
        const decidedCount = (applications?.interviewCount || 0) +
            (applications?.offerCount || 0) + (applications?.rejectedCount || 0);
        const summary = {
            user: {
                id: req.user._id,
                name: req.user.name,
                headline: req.user.headline,
                targetRole: req.user.targetRole,
                skillsCount: req.user.skills.length,
            },
            stats: {
                totalResumes: countFor('resume')?.count || 0,
                publishedPortfolios: countFor('portfolio')?.publishedCount || 0,
                generatedCoverLetters: countFor('coverLetter')?.count || 0,
                trackedApplications: applications?.count || 0,
                relevantJobs,
                savedJobs,
                interviewRate: decidedCount
                    ? `${Math.round(((applications?.interviewCount || 0) / decidedCount) * 100)}%`
                    : '—',
            },
            recentActivities: recentItems.map((item) => ({
                id: item._id.toString(),
                title: item.title,
                description: `${item.kind === 'coverLetter' ? 'Cover letter' : item.kind} updated${item.isPublished ? ' · published' : ''}`,
                timestamp: item.updatedAt,
                type: item.kind,
            })),
            quickActions: [
                { title: 'Create ATS Resume', icon: 'FileText', path: '/resumes' },
                { title: 'Build Portfolio', icon: 'Globe', path: '/portfolio' },
                { title: 'Generate Cover Letter', icon: 'PenTool', path: '/cover-letters' },
                { title: 'Analyze Job Post', icon: 'Search', path: '/job-analyzer' },
            ],
        };
        res.json({
            success: true,
            data: summary,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching dashboard summary.',
        });
    }
};
exports.getDashboardSummary = getDashboardSummary;
