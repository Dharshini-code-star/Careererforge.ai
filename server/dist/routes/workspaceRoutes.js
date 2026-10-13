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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const node_crypto_1 = require("node:crypto");
const multer_1 = __importStar(require("multer"));
const ResumeSource_js_1 = __importDefault(require("../models/ResumeSource.js"));
const WorkspaceItem_js_1 = __importDefault(require("../models/WorkspaceItem.js"));
const JobPosting_js_1 = __importDefault(require("../models/JobPosting.js"));
const User_js_1 = __importDefault(require("../models/User.js"));
const authMiddleware_js_1 = require("../middleware/authMiddleware.js");
const resumeService_js_1 = require("../services/resumeService.js");
const jobProviderService_js_1 = require("../services/jobProviderService.js");
const router = (0, express_1.Router)();
const kinds = ['resume', 'portfolio', 'coverLetter', 'application'];
const resumeUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});
const portfolioImageUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 1024 * 1024, files: 1 },
});
const supportedImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const validImageBuffer = (mimeType, buffer) => {
    if (mimeType === 'image/jpeg')
        return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (mimeType === 'image/png')
        return buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (mimeType === 'image/webp')
        return buffer.length > 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    return false;
};
const validKind = (kind) => kinds.includes(kind);
const validWorkspaceData = (kind, data) => {
    if (kind === 'portfolio') {
        if (typeof data.name !== 'string' || !data.name.trim() || data.name.trim().length > 120) {
            return 'Add your name to the portfolio before saving it.';
        }
    }
    if (kind === 'application') {
        const statuses = ['Saved', 'Planned', 'Applied', 'Interview', 'Offer', 'Rejected'];
        if (typeof data.company !== 'string' || !data.company.trim() ||
            typeof data.role !== 'string' || !data.role.trim()) {
            return 'Applications require a company and role.';
        }
        if (typeof data.status !== 'string' || !statuses.includes(data.status)) {
            return 'Choose a valid application stage.';
        }
    }
    return null;
};
router.get('/public/portfolio/:slug', async (req, res, next) => {
    try {
        const item = await WorkspaceItem_js_1.default.findOne({
            slug: req.params.slug,
            kind: 'portfolio',
            isPublished: true,
        }).populate('userId', 'name headline');
        if (!item) {
            res.status(404).json({ success: false, message: 'Published portfolio not found.' });
            return;
        }
        res.json({ success: true, item });
    }
    catch (error) {
        next(error);
    }
});
router.use(authMiddleware_js_1.protect);
router.post('/portfolio/:id/image', (req, res, next) => {
    portfolioImageUpload.single('image')(req, res, (error) => {
        if (error instanceof multer_1.MulterError) {
            res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
                success: false,
                message: error.code === 'LIMIT_FILE_SIZE' ? 'Portfolio images must be 1 MB or smaller.' : 'Upload one PNG, JPEG, or WebP image.',
            });
            return;
        }
        if (error) {
            next(error);
            return;
        }
        next();
    });
}, async (req, res, next) => {
    try {
        if (!mongoose_1.default.isValidObjectId(req.params.id)) {
            res.status(400).json({ success: false, message: 'Invalid portfolio ID.' });
            return;
        }
        const image = req.file;
        if (!image || !supportedImageMimeTypes.has(image.mimetype) || !validImageBuffer(image.mimetype, image.buffer)) {
            res.status(400).json({ success: false, message: 'Upload a valid PNG, JPEG, or WebP image.' });
            return;
        }
        const item = await WorkspaceItem_js_1.default.findOne({ _id: req.params.id, userId: req.user._id, kind: 'portfolio' });
        if (!item) {
            res.status(404).json({ success: false, message: 'Portfolio not found.' });
            return;
        }
        const photoUrl = `data:${image.mimetype};base64,${image.buffer.toString('base64')}`;
        item.data = { ...(item.data || {}), photoUrl };
        item.markModified('data');
        await item.save();
        res.json({ success: true, item, photoUrl });
    }
    catch (error) {
        next(error);
    }
});
router.post('/resume/upload', (req, res, next) => {
    resumeUpload.single('resume')(req, res, (error) => {
        if (error instanceof multer_1.MulterError) {
            res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
                success: false,
                message: error.code === 'LIMIT_FILE_SIZE'
                    ? 'The resume file must be 5 MB or smaller.'
                    : 'Upload one PDF or DOCX resume file.',
            });
            return;
        }
        if (error) {
            next(error);
            return;
        }
        next();
    });
}, async (req, res, next) => {
    try {
        const file = req.file;
        if (!file) {
            res.status(400).json({ success: false, message: 'Choose a PDF or DOCX resume to upload.' });
            return;
        }
        const filename = file.originalname.replace(/^.*[\\/]/, '').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 255);
        const extension = filename.split('.').pop()?.toLowerCase();
        const isPdf = extension === 'pdf' && file.mimetype === 'application/pdf' &&
            file.buffer.subarray(0, 5).toString('ascii') === '%PDF-';
        const docxMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        const isDocx = extension === 'docx' && file.mimetype === docxMime &&
            file.buffer.subarray(0, 4).toString('hex') === '504b0304';
        if (!isPdf && !isDocx) {
            res.status(415).json({ success: false, message: 'The file extension, MIME type, and file contents must match a valid PDF or DOCX resume.' });
            return;
        }
        let extracted;
        try {
            extracted = await (0, resumeService_js_1.extractResume)(file.buffer, isPdf ? 'application/pdf' : docxMime);
        }
        catch (error) {
            res.status(422).json({
                success: false,
                message: error instanceof Error && /^(?:No readable resume text|The extracted resume is longer|The PDF contains more than 60 pages|The DOCX expands beyond the supported)/.test(error.message)
                    ? error.message
                    : 'The resume could not be extracted. Check that the PDF is not password-protected and the DOCX is valid, then try again.',
            });
            return;
        }
        const source = await ResumeSource_js_1.default.create({
            userId: req.user._id,
            filename,
            mimeType: isPdf ? 'application/pdf' : docxMime,
            fileSize: file.size,
            fileHash: (0, node_crypto_1.createHash)('sha256').update(file.buffer).digest('hex'),
            extractedText: extracted.text,
            extractedFields: extracted.fields,
            pageCount: extracted.pageCount,
            originalFile: file.buffer,
        });
        res.status(201).json({
            success: true,
            source: {
                _id: source._id,
                filename: source.filename,
                mimeType: source.mimeType,
                fileSize: source.fileSize,
                pageCount: source.pageCount,
                extractedFields: source.extractedFields,
                createdAt: source.createdAt,
            },
            analysis: (0, resumeService_js_1.analyzeResume)(extracted.fields, undefined, extracted.pageCount),
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/resume/sources', async (req, res, next) => {
    try {
        const sources = await ResumeSource_js_1.default.find({ userId: req.user._id })
            .select('filename mimeType fileSize pageCount extractedFields createdAt')
            .sort({ createdAt: -1 })
            .lean();
        res.json({ success: true, sources });
    }
    catch (error) {
        next(error);
    }
});
router.get('/resume/sources/:id', async (req, res, next) => {
    try {
        if (!mongoose_1.default.isValidObjectId(req.params.id)) {
            res.status(400).json({ success: false, message: 'Invalid original resume ID.' });
            return;
        }
        const source = await ResumeSource_js_1.default.findOne({ _id: req.params.id, userId: req.user._id })
            .select('filename mimeType fileSize pageCount extractedFields createdAt');
        if (!source) {
            res.status(404).json({ success: false, message: 'Original resume not found.' });
            return;
        }
        res.json({ success: true, source });
    }
    catch (error) {
        next(error);
    }
});
router.get('/resume/sources/:id/file', async (req, res, next) => {
    try {
        if (!mongoose_1.default.isValidObjectId(req.params.id)) {
            res.status(400).json({ success: false, message: 'Invalid original resume ID.' });
            return;
        }
        const source = await ResumeSource_js_1.default.findOne({ _id: req.params.id, userId: req.user._id })
            .select('+originalFile');
        if (!source) {
            res.status(404).json({ success: false, message: 'Original resume not found.' });
            return;
        }
        res.set({
            'Content-Type': source.mimeType,
            'Content-Length': source.fileSize.toString(),
            'Content-Disposition': `attachment; filename="resume.${source.mimeType === 'application/pdf' ? 'pdf' : 'docx'}"; filename*=UTF-8''${encodeURIComponent(source.filename)}`,
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': 'private, no-store',
        }).send(source.originalFile);
    }
    catch (error) {
        next(error);
    }
});
router.post('/resume/sources/:id/versions', async (req, res, next) => {
    try {
        if (!mongoose_1.default.isValidObjectId(req.params.id)) {
            res.status(400).json({ success: false, message: 'Invalid original resume ID.' });
            return;
        }
        const { title, data } = req.body;
        if (typeof title !== 'string' || !title.trim() || title.length > 120 ||
            !data || typeof data !== 'object' || Array.isArray(data)) {
            res.status(400).json({ success: false, message: 'A valid title and resume data are required to create a version.' });
            return;
        }
        const source = await ResumeSource_js_1.default.findOne({ _id: req.params.id, userId: req.user._id })
            .select('filename');
        if (!source) {
            res.status(404).json({ success: false, message: 'Original resume not found.' });
            return;
        }
        const item = await WorkspaceItem_js_1.default.create({
            userId: req.user._id,
            kind: 'resume',
            title: title.trim(),
            data: { ...data, sourceId: source._id.toString(), sourceFileName: source.filename },
        });
        res.status(201).json({ success: true, item });
    }
    catch (error) {
        next(error);
    }
});
router.post('/resume/ats-analysis', async (req, res) => {
    const { resume, jobDescription, pageCount } = req.body;
    if (!resume || typeof resume !== 'object' || Array.isArray(resume) ||
        Object.values(resume).some((value) => typeof value !== 'string' || value.length > 12000)) {
        res.status(400).json({ success: false, message: 'Resume fields must be text no longer than 12,000 characters each.' });
        return;
    }
    if (jobDescription !== undefined &&
        (typeof jobDescription !== 'string' || jobDescription.length > 30000 ||
            (jobDescription.trim().length > 0 && jobDescription.trim().length < 30))) {
        res.status(400).json({ success: false, message: 'A job description must contain at least 30 characters and no more than 30,000.' });
        return;
    }
    if (pageCount !== undefined && (typeof pageCount !== 'number' || !Number.isInteger(pageCount) || pageCount < 1 || pageCount > 60)) {
        res.status(400).json({ success: false, message: 'Page count must be a number between 1 and 60.' });
        return;
    }
    const analysis = (0, resumeService_js_1.analyzeResume)(resume, typeof jobDescription === 'string' ? jobDescription : undefined, typeof pageCount === 'number' ? pageCount : undefined);
    res.json({ success: true, analysis });
});
router.get('/resume-selection', async (req, res, next) => {
    try {
        const user = await User_js_1.default.findById(req.user._id).select('selectedResumeId').lean();
        const resumeId = user?.selectedResumeId || '';
        const item = resumeId
            ? await WorkspaceItem_js_1.default.findOne({ _id: resumeId, userId: req.user._id, kind: 'resume' }).lean()
            : null;
        if (resumeId && !item) {
            await User_js_1.default.updateOne({ _id: req.user._id }, { $set: { selectedResumeId: '' } });
        }
        res.json({ success: true, resumeId: item?._id.toString() || '', resume: item });
    }
    catch (error) {
        next(error);
    }
});
router.put('/resume-selection', async (req, res, next) => {
    try {
        const resumeId = req.body?.resumeId;
        if (typeof resumeId !== 'string' || !mongoose_1.default.isValidObjectId(resumeId)) {
            res.status(400).json({ success: false, message: 'Select a valid saved resume.' });
            return;
        }
        const resume = await WorkspaceItem_js_1.default.findOne({ _id: resumeId, userId: req.user._id, kind: 'resume' }).lean();
        if (!resume) {
            res.status(404).json({ success: false, message: 'Saved resume not found in your workspace.' });
            return;
        }
        await User_js_1.default.updateOne({ _id: req.user._id }, { $set: { selectedResumeId: resume._id.toString() } });
        res.json({ success: true, resumeId: resume._id.toString(), resume });
    }
    catch (error) {
        next(error);
    }
});
router.post('/jobs/discover', async (req, res, next) => {
    try {
        const { resumeId, role, location, market } = req.body;
        if (typeof resumeId !== 'string' || !mongoose_1.default.isValidObjectId(resumeId)) {
            res.status(400).json({ success: false, message: 'Select a saved resume before discovering jobs.' });
            return;
        }
        if (role !== undefined && (typeof role !== 'string' || role.length > 120) ||
            location !== undefined && (typeof location !== 'string' || location.length > 120)) {
            res.status(400).json({ success: false, message: 'Role and location filters must be 120 characters or fewer.' });
            return;
        }
        if (market !== undefined && !['india', 'international', 'remote'].includes(String(market))) {
            res.status(400).json({ success: false, message: 'Choose India, international, or remote worldwide for the job market.' });
            return;
        }
        const resume = await WorkspaceItem_js_1.default.findOne({ _id: resumeId, userId: req.user._id, kind: 'resume' }).lean();
        if (!resume) {
            res.status(404).json({ success: false, message: 'Saved resume not found in your workspace.' });
            return;
        }
        const fields = Object.fromEntries(Object.entries(resume.data).filter((entry) => typeof entry[1] === 'string'));
        const discovery = await (0, jobProviderService_js_1.discoverProviderJobs)(fields, {
            role: typeof role === 'string' ? role : undefined,
            location: typeof location === 'string' ? location : undefined,
            market: market === 'international' || market === 'remote' ? market : 'india',
        });
        const now = new Date();
        if (discovery.jobs.length) {
            const operations = discovery.jobs.map((job) => {
                const description = [job.title, job.description, ...job.tags].filter(Boolean).join('\n');
                const { requiredSkills, preferredSkills } = (0, resumeService_js_1.extractJobSkills)(description);
                return {
                    updateOne: {
                        filter: { userId: req.user._id, source: job.source, providerId: job.providerId },
                        update: {
                            $set: {
                                title: job.title,
                                company: job.company,
                                description: job.description,
                                url: job.url,
                                location: job.location,
                                remote: job.remote,
                                workplace: job.workplace,
                                employmentType: job.employmentType,
                                experienceLevel: job.experienceLevel,
                                salary: job.salary,
                                requiredSkills,
                                preferredSkills,
                                tags: job.tags,
                                postedAt: job.postedAt,
                                lastSeenAt: now,
                            },
                            $setOnInsert: { userId: req.user._id, source: job.source, providerId: job.providerId, isSaved: false },
                        },
                        upsert: true,
                    },
                };
            });
            await JobPosting_js_1.default.bulkWrite(operations, { ordered: false });
        }
        const providerListings = discovery.jobs.map((job) => ({ source: job.source, providerId: job.providerId }));
        const storedJobs = providerListings.length ? await JobPosting_js_1.default.find({
            userId: req.user._id,
            $or: providerListings,
        }).sort({ postedAt: -1, lastSeenAt: -1 }).limit(300).lean() : [];
        const results = storedJobs.map((job) => {
            const jobText = [job.title, job.description, ...job.tags].filter(Boolean).join('\n');
            const analysis = (0, resumeService_js_1.matchResumeToJob)(fields, jobText);
            return {
                _id: job._id.toString(),
                title: job.title,
                company: job.company,
                description: job.description,
                source: job.source,
                providerId: job.providerId,
                url: job.url,
                location: job.location,
                remote: job.remote,
                workplace: job.workplace,
                employmentType: job.employmentType,
                experienceLevel: job.experienceLevel,
                salary: job.salary,
                requiredSkills: job.requiredSkills,
                preferredSkills: job.preferredSkills,
                tags: job.tags,
                postedAt: job.postedAt,
                isSaved: job.isSaved,
                isStale: !job.lastSeenAt || job.lastSeenAt.getTime() < now.getTime() - 30 * 24 * 60 * 60 * 1000,
                ...analysis,
            };
        }).filter((job) => job.matchScore > 0 || job.matchedSkills.length > 0)
            .sort((first, second) => second.matchScore - first.matchScore)
            .slice(0, 100);
        res.json({
            success: true,
            resumeId: resume._id.toString(),
            resumeTitle: resume.title,
            providers: discovery.providers,
            searchLinks: discovery.searchLinks,
            jobs: results,
            refreshedAt: now.toISOString(),
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/jobs', async (req, res, next) => {
    try {
        const jobs = await JobPosting_js_1.default.find({ userId: req.user._id, source: 'user-provided' }).sort({ updatedAt: -1 }).lean();
        res.json({ success: true, jobs });
    }
    catch (error) {
        next(error);
    }
});
router.post('/jobs', async (req, res, next) => {
    try {
        const { title, company, description } = req.body;
        if (typeof title !== 'string' || !title.trim() || title.trim().length > 150 ||
            typeof company !== 'string' || !company.trim() || company.trim().length > 150 ||
            typeof description !== 'string' || description.trim().length < 30 || description.length > 30000) {
            res.status(400).json({ success: false, message: 'Provide a job title and company (up to 150 characters each) and a job description between 30 and 30,000 characters.' });
            return;
        }
        const job = await JobPosting_js_1.default.create({
            userId: req.user._id,
            title: title.trim(),
            company: company.trim(),
            description: description.trim(),
        });
        res.status(201).json({ success: true, job });
    }
    catch (error) {
        next(error);
    }
});
router.put('/jobs/:id', async (req, res, next) => {
    try {
        if (!mongoose_1.default.isValidObjectId(req.params.id)) {
            res.status(400).json({ success: false, message: 'Invalid job ID.' });
            return;
        }
        const { title, company, description } = req.body;
        if (typeof title !== 'string' || !title.trim() || title.trim().length > 150 ||
            typeof company !== 'string' || !company.trim() || company.trim().length > 150 ||
            typeof description !== 'string' || description.trim().length < 30 || description.length > 30000) {
            res.status(400).json({ success: false, message: 'Provide a job title and company (up to 150 characters each) and a job description between 30 and 30,000 characters.' });
            return;
        }
        const job = await JobPosting_js_1.default.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { title: title.trim(), company: company.trim(), description: description.trim() }, { new: true, runValidators: true });
        if (!job) {
            res.status(404).json({ success: false, message: 'Job description not found.' });
            return;
        }
        res.json({ success: true, job });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/jobs/:id', async (req, res, next) => {
    try {
        if (!mongoose_1.default.isValidObjectId(req.params.id)) {
            res.status(400).json({ success: false, message: 'Invalid job ID.' });
            return;
        }
        const job = await JobPosting_js_1.default.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!job) {
            res.status(404).json({ success: false, message: 'Job description not found.' });
            return;
        }
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
});
router.put('/jobs/:id/save', async (req, res, next) => {
    try {
        if (!mongoose_1.default.isValidObjectId(req.params.id) || typeof req.body?.isSaved !== 'boolean') {
            res.status(400).json({ success: false, message: 'A valid job ID and saved state are required.' });
            return;
        }
        const job = await JobPosting_js_1.default.findOneAndUpdate({ _id: req.params.id, userId: req.user._id, source: { $ne: 'user-provided' } }, { isSaved: req.body.isSaved }, { new: true, runValidators: true }).lean();
        if (!job) {
            res.status(404).json({ success: false, message: 'Discovered job not found.' });
            return;
        }
        res.json({ success: true, job });
    }
    catch (error) {
        next(error);
    }
});
router.post('/jobs/:id/track', async (req, res, next) => {
    try {
        if (!mongoose_1.default.isValidObjectId(req.params.id)) {
            res.status(400).json({ success: false, message: 'Invalid job ID.' });
            return;
        }
        const job = await JobPosting_js_1.default.findOne({ _id: req.params.id, userId: req.user._id, source: { $ne: 'user-provided' } }).lean();
        if (!job) {
            res.status(404).json({ success: false, message: 'Discovered job not found.' });
            return;
        }
        let application = await WorkspaceItem_js_1.default.findOne({
            userId: req.user._id,
            kind: 'application',
            'data.sourceJobId': job._id.toString(),
        });
        if (!application) {
            application = await WorkspaceItem_js_1.default.create({
                userId: req.user._id,
                kind: 'application',
                title: `${job.company} — ${job.title}`.slice(0, 120),
                data: {
                    company: job.company,
                    role: job.title,
                    status: 'Saved',
                    date: '',
                    notes: `Added from ${job.source}. Apply through the original listing.`,
                    link: job.url || '',
                    sourceJobId: job._id.toString(),
                },
            });
        }
        res.status(201).json({ success: true, application });
    }
    catch (error) {
        next(error);
    }
});
router.post('/jobs/:id/match', async (req, res, next) => {
    try {
        if (!mongoose_1.default.isValidObjectId(req.params.id)) {
            res.status(400).json({ success: false, message: 'Invalid job ID.' });
            return;
        }
        const resumeId = req.body?.resumeId;
        if (typeof resumeId !== 'string' || !mongoose_1.default.isValidObjectId(resumeId)) {
            res.status(400).json({ success: false, message: 'Select a saved resume before matching jobs.' });
            return;
        }
        const [job, resume] = await Promise.all([
            JobPosting_js_1.default.findOne({ _id: req.params.id, userId: req.user._id }).lean(),
            WorkspaceItem_js_1.default.findOne({ _id: resumeId, userId: req.user._id, kind: 'resume' }).lean(),
        ]);
        if (!job) {
            res.status(404).json({ success: false, message: 'Job description not found.' });
            return;
        }
        if (!resume) {
            res.status(404).json({ success: false, message: 'Saved resume not found in your workspace.' });
            return;
        }
        const fields = Object.fromEntries(Object.entries(resume.data).filter((entry) => typeof entry[1] === 'string'));
        const sourceId = fields.sourceId;
        const source = sourceId && mongoose_1.default.isValidObjectId(sourceId)
            ? await ResumeSource_js_1.default.findOne({ _id: sourceId, userId: req.user._id }).select('pageCount').lean()
            : null;
        const analysis = (0, resumeService_js_1.matchResumeToJob)(fields, job.description, source?.pageCount);
        res.json({
            success: true,
            result: {
                resumeId: resume._id.toString(),
                resumeTitle: resume.title,
                resumeUpdatedAt: resume.updatedAt,
                jobId: job._id.toString(),
                jobTitle: job.title,
                company: job.company,
                source: job.source,
                jobUpdatedAt: job.updatedAt,
                ...analysis,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:kind', async (req, res, next) => {
    try {
        if (!validKind(req.params.kind)) {
            res.status(400).json({ success: false, message: 'Unsupported workspace type.' });
            return;
        }
        const items = await WorkspaceItem_js_1.default.find({ userId: req.user._id, kind: req.params.kind })
            .sort({ updatedAt: -1 })
            .lean();
        res.json({ success: true, items });
    }
    catch (error) {
        next(error);
    }
});
router.post('/:kind', async (req, res, next) => {
    try {
        if (!validKind(req.params.kind)) {
            next();
            return;
        }
        const { title, data } = req.body;
        if (typeof title !== 'string' || !title.trim() || title.length > 120) {
            res.status(400).json({ success: false, message: 'Title is required and must be 120 characters or fewer.' });
            return;
        }
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            res.status(400).json({ success: false, message: 'Workspace data must be an object.' });
            return;
        }
        const validationError = validWorkspaceData(req.params.kind, data);
        if (validationError) {
            res.status(400).json({ success: false, message: validationError });
            return;
        }
        const item = await WorkspaceItem_js_1.default.create({
            userId: req.user._id,
            kind: req.params.kind,
            title: title.trim(),
            data,
        });
        res.status(201).json({ success: true, item });
    }
    catch (error) {
        next(error);
    }
});
router.put('/:kind/:id', async (req, res, next) => {
    try {
        if (!validKind(req.params.kind) || !mongoose_1.default.isValidObjectId(req.params.id)) {
            res.status(400).json({ success: false, message: 'Invalid workspace type or item ID.' });
            return;
        }
        const { title, data } = req.body;
        if (typeof title !== 'string' || !title.trim() || title.length > 120 ||
            !data || typeof data !== 'object' || Array.isArray(data)) {
            res.status(400).json({ success: false, message: 'A valid title and workspace data are required.' });
            return;
        }
        const validationError = validWorkspaceData(req.params.kind, data);
        if (validationError) {
            res.status(400).json({ success: false, message: validationError });
            return;
        }
        const item = await WorkspaceItem_js_1.default.findOneAndUpdate({ _id: req.params.id, userId: req.user._id, kind: req.params.kind }, { title: title.trim(), data }, { new: true, runValidators: true });
        if (!item) {
            res.status(404).json({ success: false, message: 'Workspace item not found.' });
            return;
        }
        res.json({ success: true, item });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:kind/:id', async (req, res, next) => {
    try {
        if (!validKind(req.params.kind) || !mongoose_1.default.isValidObjectId(req.params.id)) {
            res.status(400).json({ success: false, message: 'Invalid workspace type or item ID.' });
            return;
        }
        const deleted = await WorkspaceItem_js_1.default.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
            kind: req.params.kind,
        });
        if (!deleted) {
            res.status(404).json({ success: false, message: 'Workspace item not found.' });
            return;
        }
        if (req.params.kind === 'resume') {
            await User_js_1.default.updateOne({ _id: req.user._id, selectedResumeId: req.params.id }, { $set: { selectedResumeId: '' } });
        }
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
});
router.post('/portfolio/:id/publish', async (req, res, next) => {
    try {
        if (!mongoose_1.default.isValidObjectId(req.params.id)) {
            res.status(400).json({ success: false, message: 'Invalid portfolio ID.' });
            return;
        }
        const item = await WorkspaceItem_js_1.default.findOne({
            _id: req.params.id,
            userId: req.user._id,
            kind: 'portfolio',
        });
        if (!item) {
            res.status(404).json({ success: false, message: 'Portfolio not found.' });
            return;
        }
        if (!item.slug) {
            item.slug = `${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'portfolio'}-${item._id.toString().slice(-6)}`;
        }
        item.isPublished = true;
        await item.save();
        res.json({ success: true, item, slug: item.slug });
    }
    catch (error) {
        next(error);
    }
});
router.post('/portfolio/:id/unpublish', async (req, res, next) => {
    try {
        if (!mongoose_1.default.isValidObjectId(req.params.id)) {
            res.status(400).json({ success: false, message: 'Invalid portfolio ID.' });
            return;
        }
        const item = await WorkspaceItem_js_1.default.findOneAndUpdate({ _id: req.params.id, userId: req.user._id, kind: 'portfolio' }, { $set: { isPublished: false } }, { new: true });
        if (!item) {
            res.status(404).json({ success: false, message: 'Portfolio not found.' });
            return;
        }
        res.json({ success: true, item });
    }
    catch (error) {
        next(error);
    }
});
router.post('/improve-resume', async (req, res) => {
    const { resume, jobDescription } = req.body;
    if (!resume || typeof resume !== 'object' || Array.isArray(resume)) {
        res.status(400).json({ success: false, message: 'Resume content is required.' });
        return;
    }
    const resumeFields = resume;
    if (Object.values(resumeFields).some((value) => typeof value !== 'string' || value.length > 12000)) {
        res.status(400).json({ success: false, message: 'Resume sections must be text and no longer than 12,000 characters each.' });
        return;
    }
    if (jobDescription !== undefined &&
        (typeof jobDescription !== 'string' || jobDescription.length > 30000 ||
            (jobDescription.trim().length > 0 && jobDescription.trim().length < 30))) {
        res.status(400).json({ success: false, message: 'Job description must be text under 30,000 characters.' });
        return;
    }
    const sourceText = Object.entries(resumeFields)
        .filter(([field]) => !['sourceId', 'sourceFileName', 'template'].includes(field))
        .map(([, value]) => value)
        .join('\n');
    if (sourceText.trim().length < 40) {
        res.status(422).json({ success: false, message: 'Add or upload more resume content before requesting improvement suggestions.' });
        return;
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        res.status(503).json({ success: false, message: 'AI improvement is not configured. Add GEMINI_API_KEY to the server environment.' });
        return;
    }
    try {
        const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(30000),
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Review this candidate's resume and return up to 8 concise, individually reviewable suggestions as a JSON array. Improve clarity, structure, action verbs, and relevance to the supplied job description where appropriate. Cover an existing professional summary and specific experience bullets, prioritizing weak bullets. Each item must have exactly these useful fields: "field" (one of summary, experience, skills, education, projects, certifications, languages, additional, headline), "originalText" (an exact, contiguous quote from that field's existing resume text), "suggestedText" (a revised replacement for only that quoted text), "reason" (one short sentence), and "category" (clarity, action verb, relevance, or measurable impact). Only return suggestions whose originalText is an exact substring of that field. Use only facts, tools, qualifications, employers, dates, and outcomes stated explicitly in the resume. Never invent or infer details, metrics, scale, or impact. A measurable-impact suggestion must not add a figure: instead, rewrite only stated facts or explain in its reason that the candidate may add a verified metric. Do not add job-description requirements as candidate qualifications. Do not propose empty, duplicate, or unchanged text. If no grounded improvement is possible, return [].\n\n${typeof jobDescription === 'string' && jobDescription.trim() ? `Job description (context only; never treat it as candidate evidence):\n${jobDescription}\n\n` : ''}Resume fields:\n${JSON.stringify(resumeFields)}\n\nReturn only a valid JSON array.` }] }],
                generationConfig: { temperature: 0.15, maxOutputTokens: 1800, responseMimeType: 'application/json' },
            }),
        });
        const result = await response.json();
        if (!response.ok) {
            res.status(502).json({ success: false, message: result.error?.message || 'The configured AI provider could not improve this resume.' });
            return;
        }
        const suggestion = result.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
        if (!suggestion) {
            res.status(502).json({ success: false, message: 'The AI provider returned an empty response.' });
            return;
        }
        let generated;
        try {
            generated = JSON.parse(suggestion);
        }
        catch {
            res.status(502).json({ success: false, message: 'The AI provider returned suggestions in an invalid format. Please try again.' });
            return;
        }
        if (!Array.isArray(generated)) {
            res.status(502).json({ success: false, message: 'The AI provider returned an invalid suggestions list.' });
            return;
        }
        const allowedFields = new Set(['summary', 'experience', 'skills', 'education', 'projects', 'certifications', 'languages', 'additional', 'headline']);
        const suggestions = generated.slice(0, 8).flatMap((entry) => {
            if (!entry || typeof entry !== 'object')
                return [];
            const candidate = entry;
            const field = candidate.field;
            const originalText = candidate.originalText;
            const suggestedText = candidate.suggestedText;
            const reason = candidate.reason;
            const category = candidate.category;
            if (typeof field !== 'string' || !allowedFields.has(field) ||
                typeof originalText !== 'string' || !originalText.trim() || originalText.length > 2000 ||
                typeof suggestedText !== 'string' || !suggestedText.trim() || suggestedText.length > 2000 ||
                typeof reason !== 'string' || !reason.trim() || reason.length > 400 ||
                typeof category !== 'string' || !['clarity', 'action verb', 'relevance', 'measurable impact'].includes(category.toLowerCase()) ||
                suggestedText.trim() === originalText.trim() ||
                !resumeFields[field].includes(originalText)) {
                return [];
            }
            const proposedNumbers = suggestedText.match(/\b\d[\d,.]*(?:%|x)?\b/g) || [];
            if (proposedNumbers.some((number) => !originalText.toLowerCase().includes(number.toLowerCase())))
                return [];
            return [{
                    id: (0, node_crypto_1.createHash)('sha256').update(`${field}\n${originalText}\n${suggestedText}`).digest('hex').slice(0, 16),
                    field,
                    originalText,
                    suggestedText: suggestedText.trim(),
                    reason: reason.trim(),
                    category,
                }];
        });
        if (!suggestions.length) {
            res.status(422).json({
                success: false,
                message: 'No verifiable suggestions were returned. Your resume has not been changed; try again or add more detail.',
            });
            return;
        }
        res.json({
            success: true,
            suggestions,
            suggestion: suggestions.find((item) => item.field === 'summary')?.suggestedText || '',
        });
    }
    catch (error) {
        console.error('Resume improvement provider request failed:', error);
        res.status(502).json({ success: false, message: 'Could not reach the configured AI provider.' });
    }
});
router.post('/generate-cover-letter', async (req, res, next) => {
    const { jobDescription, company, position, resumeId } = req.body;
    if (typeof jobDescription !== 'string' || jobDescription.trim().length < 30 || jobDescription.length > 30000 ||
        typeof company !== 'string' || !company.trim() || company.length > 150 ||
        typeof position !== 'string' || !position.trim() || position.length > 150 ||
        typeof resumeId !== 'string' || !mongoose_1.default.isValidObjectId(resumeId)) {
        res.status(400).json({ success: false, message: 'A saved resume, company, position, and a job description of at least 30 characters are required.' });
        return;
    }
    const findResume = () => WorkspaceItem_js_1.default.findOne({
        _id: resumeId,
        userId: req.user._id,
        kind: 'resume',
    }).lean();
    let resume;
    try {
        resume = await findResume();
    }
    catch (error) {
        next(error);
        return;
    }
    if (!resume) {
        res.status(404).json({ success: false, message: 'The selected saved resume was not found in your workspace.' });
        return;
    }
    const resumeFields = Object.fromEntries(Object.entries(resume.data).filter((entry) => typeof entry[1] === 'string' && entry[1].length <= 12000 &&
        !['sourceId', 'sourceFileName', 'template'].includes(entry[0])));
    if (!Object.keys(resumeFields).length) {
        res.status(422).json({ success: false, message: 'The selected resume has no usable text. Add resume content before generating a letter.' });
        return;
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        res.status(503).json({ success: false, message: 'AI generation is not configured. Add GEMINI_API_KEY to the server environment.' });
        return;
    }
    try {
        const profile = JSON.stringify(resumeFields);
        const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(30000),
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Write a concise, professional, personalized cover letter for the ${position} role at ${company}. Use only facts present in the candidate profile; do not invent achievements. Return only the letter body.\n\nCandidate profile: ${profile}\n\nJob description:\n${jobDescription}` }] }],
                generationConfig: { temperature: 0.5, maxOutputTokens: 900 },
            }),
        });
        const result = await response.json();
        if (!response.ok) {
            res.status(502).json({ success: false, message: result.error?.message || 'The configured AI provider could not generate a letter.' });
            return;
        }
        const text = result.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
        if (!text) {
            res.status(502).json({ success: false, message: 'The AI provider returned an empty response.' });
            return;
        }
        res.json({ success: true, content: text });
    }
    catch (error) {
        console.error('Cover letter provider request failed:', error);
        res.status(502).json({ success: false, message: 'Could not reach the configured AI provider.' });
    }
});
exports.default = router;
