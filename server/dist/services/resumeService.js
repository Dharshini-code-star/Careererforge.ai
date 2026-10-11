"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchResumeToJob = exports.extractJobSkills = exports.analyzeResume = exports.extractResume = exports.parseResumeFields = exports.validateDocxArchive = void 0;
const mammoth_1 = __importDefault(require("mammoth"));
const pdf_parse_1 = require("pdf-parse");
const validateDocxArchive = (buffer) => {
    const searchStart = Math.max(0, buffer.length - 65557);
    let endRecord = -1;
    for (let offset = buffer.length - 22; offset >= searchStart; offset--) {
        if (buffer.readUInt32LE(offset) === 0x06054b50) {
            endRecord = offset;
            break;
        }
    }
    if (endRecord < 0 || endRecord + 22 > buffer.length)
        return 'malformed';
    const currentDisk = buffer.readUInt16LE(endRecord + 4);
    const directoryDisk = buffer.readUInt16LE(endRecord + 6);
    const diskEntries = buffer.readUInt16LE(endRecord + 8);
    const entryCount = buffer.readUInt16LE(endRecord + 10);
    const directorySize = buffer.readUInt32LE(endRecord + 12);
    const directoryOffset = buffer.readUInt32LE(endRecord + 16);
    const directoryEnd = directoryOffset + directorySize;
    if (currentDisk !== 0 || directoryDisk !== 0 || diskEntries !== entryCount ||
        entryCount === 0 || entryCount >= 0xffff || directoryEnd > endRecord) {
        return 'malformed';
    }
    const maxExpandedBytes = 20 * 1024 * 1024;
    let expandedBytes = 0;
    let documentXmlFound = false;
    let offset = directoryOffset;
    for (let entry = 0; entry < entryCount; entry++) {
        if (offset + 46 > directoryEnd || buffer.readUInt32LE(offset) !== 0x02014b50)
            return 'malformed';
        const flags = buffer.readUInt16LE(offset + 8);
        const compression = buffer.readUInt16LE(offset + 10);
        const compressedBytes = buffer.readUInt32LE(offset + 20);
        const uncompressedBytes = buffer.readUInt32LE(offset + 24);
        const nameBytes = buffer.readUInt16LE(offset + 28);
        const extraBytes = buffer.readUInt16LE(offset + 30);
        const commentBytes = buffer.readUInt16LE(offset + 32);
        const entryEnd = offset + 46 + nameBytes + extraBytes + commentBytes;
        if (entryEnd > directoryEnd || !nameBytes || compressedBytes === 0xffffffff ||
            uncompressedBytes === 0xffffffff || ![0, 8].includes(compression) || (flags & 1) !== 0) {
            return 'malformed';
        }
        expandedBytes += uncompressedBytes;
        if (expandedBytes > maxExpandedBytes)
            return 'too-large';
        if (buffer.toString('utf8', offset + 46, offset + 46 + nameBytes) === 'word/document.xml') {
            documentXmlFound = true;
        }
        offset = entryEnd;
    }
    return documentXmlFound && offset <= directoryEnd ? null : 'malformed';
};
exports.validateDocxArchive = validateDocxArchive;
const sectionNames = {
    summary: 'summary|professional summary|profile|professional profile|objective|career objective|about me',
    experience: 'experience|work experience|professional experience|employment history|work history',
    education: 'education|education history|academic background',
    skills: 'skills|technical skills|core skills|core competencies|competencies|technologies',
    projects: 'projects|selected projects|personal projects',
    certifications: 'certifications|certificates|licenses|licences',
    languages: 'languages|language skills',
};
const sectionPattern = new RegExp(`^\\s*(?:${Object.values(sectionNames).join('|')}|achievements|awards|volunteer experience|publications|additional information)\\s*:?\\s*$`, 'i');
const parseResumeFields = (text) => {
    const lines = text.replace(/\r\n?/g, '\n').split('\n').map((line) => line.trim());
    const fields = {
        name: '',
        headline: '',
        email: '',
        phone: '',
        location: '',
        website: '',
        summary: '',
        experience: '',
        education: '',
        skills: '',
        projects: '',
        certifications: '',
        languages: '',
        additional: '',
        template: 'Meridian',
    };
    fields.email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '';
    fields.phone = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim() || '';
    fields.website = text.match(/\b(?:https?:\/\/|www\.)[^\s<>()]+/i)?.[0] || '';
    const locationLine = lines.find((line) => line && line.length < 100 && /,\s*[A-Z]{2}\b|,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/.test(line));
    if (locationLine && locationLine !== fields.email && locationLine !== fields.phone)
        fields.location = locationLine;
    const firstContentLine = lines.find((line) => line && line.length <= 100 && !sectionPattern.test(line));
    if (firstContentLine && firstContentLine !== fields.email && firstContentLine !== fields.phone) {
        fields.name = firstContentLine.replace(/^[•·▪◦*-]\s*/, '');
    }
    const nameIndex = lines.indexOf(firstContentLine || '');
    const possibleHeadline = lines.slice(nameIndex + 1).find((line) => line && line.length <= 120 && !sectionPattern.test(line) &&
        line !== fields.email && line !== fields.phone && !line.includes('@') && !/^https?:\/\//i.test(line));
    if (possibleHeadline && possibleHeadline !== fields.location)
        fields.headline = possibleHeadline;
    const sections = {};
    let currentSection = '';
    for (const line of lines) {
        if (sectionPattern.test(line)) {
            const normalizedHeading = line.replace(/:$/, '').toLowerCase();
            currentSection = Object.entries(sectionNames).find(([, aliases]) => new RegExp(`^(?:${aliases})$`, 'i').test(normalizedHeading))?.[0] || 'additional';
            sections[currentSection] ||= [];
            continue;
        }
        if (currentSection && line)
            sections[currentSection].push(line);
    }
    for (const [key, sectionLines] of Object.entries(sections)) {
        const content = sectionLines.join('\n').trim();
        fields[key] = key === 'skills'
            ? sectionLines.map((skill) => skill.replace(/^[•·▪◦*-]\s*/, '').trim()).filter(Boolean).join(', ')
            : content;
    }
    return fields;
};
exports.parseResumeFields = parseResumeFields;
const extractResume = async (buffer, mimeType) => {
    let text;
    let pageCount;
    if (mimeType === 'application/pdf') {
        const parser = new pdf_parse_1.PDFParse({ data: buffer, isEvalSupported: false, verbosity: 0 });
        try {
            pageCount = (await parser.getInfo()).total;
            if (pageCount > 60) {
                throw new Error('The PDF contains more than 60 pages. Upload a shorter resume.');
            }
            text = (await parser.getText({ first: 60, pageJoiner: '\n' })).text;
        }
        finally {
            await parser.destroy();
        }
    }
    else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const archiveError = (0, exports.validateDocxArchive)(buffer);
        if (archiveError === 'too-large') {
            throw new Error('The DOCX expands beyond the supported 20 MB document limit.');
        }
        if (archiveError) {
            throw new Error('The DOCX is malformed or uses unsupported encryption or compression.');
        }
        const result = await mammoth_1.default.extractRawText({ buffer });
        text = result.value;
    }
    else {
        throw new Error('Upload a PDF or DOCX resume.');
    }
    text = text.replace(/\u0000/g, '').replace(/\r\n?/g, '\n').trim();
    if (text.length < 80) {
        throw new Error('No readable resume text was found. If this is a scanned PDF, upload a text-based PDF or DOCX.');
    }
    if (text.length > 80000) {
        throw new Error('The extracted resume is longer than the supported 80,000 characters.');
    }
    return { text, fields: (0, exports.parseResumeFields)(text), pageCount };
};
exports.extractResume = extractResume;
const stopWords = new Set([
    'with', 'that', 'this', 'from', 'will', 'your', 'have', 'years', 'work', 'team', 'role',
    'skills', 'experience', 'ability', 'strong', 'including', 'looking', 'candidate', 'their',
    'they', 'them', 'what', 'when', 'where', 'which', 'while', 'also', 'both', 'such', 'must',
    'more', 'than', 'using', 'used', 'into', 'across', 'about', 'within', 'other', 'well', 'each',
    'high', 'best', 'nice', 'join', 'help', 'responsibilities', 'requirements', 'required',
    'preferred', 'should', 'would', 'could', 'able', 'workplace', 'company', 'position',
]);
const actionVerbs = new Set([
    'achieved', 'analyzed', 'automated', 'built', 'created', 'delivered', 'designed', 'developed',
    'directed', 'drove', 'established', 'executed', 'improved', 'increased', 'implemented',
    'launched', 'led', 'managed', 'optimized', 'organized', 'reduced', 'resolved', 'scaled',
    'streamlined', 'transformed',
]);
const analyzeResume = (fields, jobDescription, pageCount) => {
    const sectionText = (key) => fields[key]?.trim() || '';
    const content = Object.entries(fields)
        .filter(([key]) => !['template', 'sourceId', 'sourceFileName'].includes(key))
        .map(([, value]) => value)
        .join('\n');
    const normalizedContent = content.toLowerCase();
    const words = content.match(/\b[\p{L}\p{N}][\p{L}\p{N}+#.-]*\b/gu) || [];
    const wordCount = words.length;
    const lines = sectionText('experience').split('\n').map((line) => line.trim()).filter(Boolean);
    const bulletLines = lines.filter((line) => /^[•·▪◦*-]\s*/.test(line));
    const achievementLines = lines.filter((line) => /\b\d+(?:[.,]\d+)?%?|\$\s?\d+|\b\d+\s*(?:users|customers|clients|projects|people|teams|hours|days|weeks|months|years)\b/i.test(line));
    const contact = [
        Boolean(sectionText('name')),
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sectionText('email')),
        Boolean(sectionText('phone')),
        Boolean(sectionText('location') || sectionText('website')),
    ];
    const contactScore = contact.filter(Boolean).length * 3.75;
    const sectionKeys = ['summary', 'experience', 'education', 'skills'];
    const filledSections = sectionKeys.filter((key) => sectionText(key));
    const structureScore = (filledSections.length / sectionKeys.length) * 20;
    const readabilityScore = wordCount >= 250 && wordCount <= 850
        ? 20
        : wordCount >= 150 && wordCount <= 1100
            ? 15
            : wordCount >= 80 && wordCount <= 1400
                ? 9
                : 3;
    const bulletRatio = lines.length ? bulletLines.length / lines.length : 0;
    const impactRatio = lines.length ? achievementLines.length / lines.length : 0;
    const actionRatio = lines.length
        ? lines.filter((line) => actionVerbs.has(line.replace(/^[•·▪◦*-]\s*/, '').split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '') || '')).length / lines.length
        : 0;
    const impactScore = Math.min(25, Math.round(8 * bulletRatio + 9 * actionRatio + 8 * impactRatio));
    const skills = sectionText('skills').split(/[,\n;|]/).map((skill) => skill.trim()).filter(Boolean);
    const skillScore = Math.min(10, skills.length ? Math.round(Math.min(skills.length, 8) / 8 * 10) : 0);
    const longLines = content.split('\n').filter((line) => line.length > 180).length;
    const replacementCharacters = (content.match(/\uFFFD/g) || []).length;
    const formattingScore = Math.max(0, 10 - Math.min(6, longLines * 2) - Math.min(4, replacementCharacters * 2) - (pageCount && pageCount > 2 ? 2 : 0));
    const components = [
        { name: 'Contact details', score: Math.round(contactScore), maxScore: 15, detail: `${contact.filter(Boolean).length} of 4 contact details are present.` },
        { name: 'Section completeness', score: Math.round(structureScore), maxScore: 20, detail: `${filledSections.length} of ${sectionKeys.length} core sections contain content. Projects and certifications are optional.` },
        { name: 'Resume length', score: readabilityScore, maxScore: 20, detail: `${wordCount} words; a concise one- to two-page resume is generally easier to scan.` },
        { name: 'Experience impact', score: impactScore, maxScore: 25, detail: `${bulletLines.length} bullet points, ${actionRatio ? Math.round(actionRatio * lines.length) : 0} action-led bullets, and ${achievementLines.length} quantified experience lines.` },
        { name: 'Skills coverage', score: skillScore, maxScore: 10, detail: `${skills.length} listed skills.` },
        { name: 'Text formatting', score: formattingScore, maxScore: 10, detail: `${longLines} unusually long lines and ${replacementCharacters} unreadable characters detected${pageCount ? ` across ${pageCount} PDF pages` : ''}.` },
    ];
    const issues = [];
    if (!contact[0] || !contact[1])
        issues.push({ severity: 'high', message: `Add ${!contact[0] ? 'your name' : 'a valid email address'} to the resume.` });
    if (!sectionText('experience'))
        issues.push({ severity: 'high', message: 'Add relevant work experience or clearly labeled projects.' });
    if (wordCount < 150)
        issues.push({ severity: 'medium', message: 'The extracted resume is brief; check that all relevant content was parsed.' });
    if (wordCount > 1100 || (pageCount && pageCount > 2))
        issues.push({ severity: 'medium', message: 'Review resume length; concise one- to two-page resumes are generally easier to scan.' });
    if (lines.length && !bulletLines.length)
        issues.push({ severity: 'medium', message: 'Use consistent bullet points to make responsibilities and outcomes easier to scan.' });
    if (lines.length && achievementLines.length < Math.ceil(lines.length / 3))
        issues.push({ severity: 'medium', message: 'Add verified scope or measurable outcomes where you can support them; do not estimate figures.' });
    if (lines.length && actionRatio < 0.5)
        issues.push({ severity: 'low', message: 'Start experience bullets with clear action verbs and keep each focused on one contribution.' });
    if (!sectionText('skills'))
        issues.push({ severity: 'medium', message: 'Add a concise skills section using tools and abilities you can substantiate.' });
    if (longLines)
        issues.push({ severity: 'low', message: 'Some extracted lines are unusually long; check the source layout and split dense paragraphs.' });
    if (replacementCharacters)
        issues.push({ severity: 'high', message: 'Some characters could not be extracted; review the original document and correct the affected text.' });
    const result = {
        score: components.reduce((total, component) => total + component.score, 0),
        wordCount,
        components,
        issues,
    };
    if (jobDescription?.trim()) {
        const terms = [...new Set((jobDescription.toLowerCase().match(/[a-z][a-z+#.]{2,}/g) || [])
                .filter((term) => term.length > 3 && !stopWords.has(term)))];
        const matchedKeywords = terms.filter((term) => normalizedContent.includes(term));
        result.jobMatch = {
            score: terms.length ? Math.round((matchedKeywords.length / terms.length) * 100) : 0,
            matchedKeywords,
            missingKeywords: terms.filter((term) => !matchedKeywords.includes(term)).slice(0, 25),
            analyzedKeywordCount: terms.length,
        };
        if (result.jobMatch.missingKeywords.length) {
            result.issues.push({ severity: 'low', message: `Review ${result.jobMatch.missingKeywords.length} job-description keywords and include only those that accurately describe your experience.` });
        }
    }
    return result;
};
exports.analyzeResume = analyzeResume;
const jobSkillCatalog = [
    'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Python',
    'Java', 'C#', 'C++', 'Go', 'Golang', 'Rust', 'Ruby', 'PHP', 'SQL', 'PostgreSQL',
    'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API', 'HTML', 'CSS', 'Tailwind CSS',
    'AWS', 'Azure', 'Google Cloud', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Linux',
    'Git', 'CI/CD', 'Jenkins', 'GitHub Actions', 'Machine Learning', 'Deep Learning',
    'Artificial Intelligence', 'Generative AI', 'NLP', 'TensorFlow', 'PyTorch', 'Pandas',
    'NumPy', 'Data Analysis', 'Data Analytics', 'Data Visualization', 'Tableau', 'Power BI',
    'Excel', 'Statistics', 'ETL', 'Apache Spark', 'Hadoop', 'Product Management',
    'Project Management', 'Agile', 'Scrum', 'Jira', 'User Research', 'UX Design',
    'UI Design', 'Figma', 'Wireframing', 'Prototyping', 'SEO', 'Digital Marketing',
    'Content Marketing', 'Salesforce', 'CRM', 'Financial Analysis', 'Accounting',
    'Budgeting', 'Forecasting', 'Communication', 'Leadership', 'Problem Solving',
    'Stakeholder Management', 'Business Analysis', 'Customer Service', 'Sales',
    'Cybersecurity', 'Information Security', 'Networking', 'Compliance', 'Risk Management',
    'Data Engineering', 'Software Engineering', 'Quality Assurance', 'Testing',
    'Microservices', 'System Design', 'Responsive Design', 'Accessibility',
];
const educationLevels = [
    { name: 'doctorate', pattern: /\b(?:ph\.?d\.?|doctorate|doctoral degree)\b/i },
    { name: 'master\'s degree', pattern: /\b(?:master(?:'s)?|m\.?s\.?|m\.?a\.?|mba)\b/i },
    { name: 'bachelor\'s degree', pattern: /\b(?:bachelor(?:'s)?|b\.?s\.?|b\.?a\.?|undergraduate degree)\b/i },
    { name: 'associate degree', pattern: /\b(?:associate(?:'s)? degree|a\.?a\.?|a\.?s\.?)\b/i },
];
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasTerm = (text, term) => {
    const escaped = escapeRegex(term.toLowerCase()).replace(/\\\./g, '[.]').replace(/\\\+/g, '[+]?');
    return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i').test(text.toLowerCase());
};
const extractJobSkills = (jobDescription) => {
    const requiredSkills = [];
    const preferredSkills = [];
    for (const skill of jobSkillCatalog) {
        if (!hasTerm(jobDescription, skill))
            continue;
        const escaped = escapeRegex(skill);
        const occurrence = new RegExp(`.{0,100}${escaped}.{0,100}`, 'i').exec(jobDescription);
        const context = occurrence?.[0] || '';
        const preferred = /\b(preferred|preferably|nice to have|bonus|desirable|a plus|would be a plus)\b/i.test(context);
        (preferred ? preferredSkills : requiredSkills).push(skill);
    }
    return { requiredSkills, preferredSkills };
};
exports.extractJobSkills = extractJobSkills;
const matchResumeToJob = (fields, jobDescription, pageCount) => {
    const sections = Object.entries(fields)
        .filter(([key]) => !['template', 'sourceId', 'sourceFileName'].includes(key))
        .filter(([, value]) => typeof value === 'string');
    const fullText = sections.map(([, value]) => value).join('\n');
    const normalizedText = fullText.toLowerCase();
    const normalizedJob = jobDescription.toLowerCase();
    const requirements = jobSkillCatalog.filter((skill) => hasTerm(normalizedJob, skill));
    const matchedSkills = requirements.filter((skill) => hasTerm(normalizedText, skill));
    const missingSkills = requirements.filter((skill) => !matchedSkills.includes(skill));
    const evidenceSections = sections
        .filter(([key]) => ['summary', 'experience', 'projects', 'education', 'skills'].includes(key))
        .map(([key, value]) => ({ key, lines: value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) }));
    const matchingEvidence = matchedSkills.flatMap((skill) => {
        const evidence = evidenceSections.flatMap((section) => section.lines
            .filter((line) => hasTerm(line, skill))
            .slice(0, 2)
            .map((line) => ({ section: section.key, line })));
        return evidence.slice(0, 2).map(({ section, line }) => ({
            skill,
            evidence: `${section[0].toUpperCase()}${section.slice(1)}: ${line.slice(0, 400)}`,
        }));
    });
    const jobTokens = [...new Set((normalizedJob.match(/[a-z][a-z0-9+#.-]{2,}/g) || [])
            .filter((term) => term.length > 3 && !stopWords.has(term)))].slice(0, 35);
    const matchedJobKeywords = jobTokens.filter((term) => hasTerm(normalizedText, term));
    const missingJobKeywords = jobTokens.filter((term) => !matchedJobKeywords.includes(term));
    const keywordCoverage = jobTokens.length ? Math.round((matchedJobKeywords.length / jobTokens.length) * 100) : 0;
    const skillCoverage = requirements.length ? Math.round((matchedSkills.length / requirements.length) * 100) : keywordCoverage;
    const requiredYearsMatch = normalizedJob.match(/\b(?:at least|minimum of|minimum|more than|over)\s+(\d{1,2})\+?\s+years?\b/i) ||
        normalizedJob.match(/\b(\d{1,2})\+?\s+years? of (?:relevant |professional )?experience\b/i);
    const requiredExperienceYears = requiredYearsMatch ? Number(requiredYearsMatch[1]) : null;
    const candidateYears = [...fullText.matchAll(/\b(\d{1,2})\+?\s+years?(?: of [a-z ]{0,30})?\b/gi)]
        .map((match) => Number(match[1]))
        .filter((years) => years > 0 && years < 60);
    const spelledYears = {
        one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
        nine: 9, ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20,
    };
    for (const [word, years] of Object.entries(spelledYears)) {
        if (new RegExp(`\\b${word} years?(?: of [a-z ]{0,30})?\\b`, 'i').test(fullText))
            candidateYears.push(years);
    }
    const candidateExperienceYears = candidateYears.length ? Math.max(...candidateYears) : null;
    const experienceStatus = requiredExperienceYears === null
        ? 'not-required'
        : candidateExperienceYears === null
            ? 'not-found'
            : candidateExperienceYears >= requiredExperienceYears
                ? 'met'
                : 'review';
    const requiredEducation = educationLevels.find((level) => level.pattern.test(jobDescription));
    const educationInResume = educationLevels.find((level) => level.pattern.test([fields.education, fields.experience, fields.summary].join('\n')));
    const educationStatus = !requiredEducation
        ? 'not-required'
        : !educationInResume
            ? 'not-found'
            : educationLevels.findIndex((level) => level.name === educationInResume.name) <=
                educationLevels.findIndex((level) => level.name === requiredEducation.name)
                ? 'met'
                : 'review';
    const coreFields = ['name', 'email', 'headline', 'summary', 'experience', 'education', 'skills'];
    const completeness = Math.round((coreFields.filter((key) => fields[key]?.trim()).length / coreFields.length) * 100);
    const experienceSections = evidenceSections.filter((section) => ['experience', 'projects'].includes(section.key));
    const experienceTerms = requirements.length ? requirements : jobTokens.slice(0, 20);
    const experienceTermsMatched = experienceTerms.filter((term) => experienceSections.some((section) => section.lines.some((line) => hasTerm(line, term)))).length;
    const experienceEvidenceCoverage = experienceTerms.length
        ? Math.round((experienceTermsMatched / experienceTerms.length) * 100)
        : Math.min(100, (fields.experience?.trim() ? 50 : 0) + (fields.projects?.trim() ? 50 : 0));
    const educationScore = educationStatus === 'not-required' ? 100 : educationStatus === 'met' ? 100 : educationStatus === 'review' ? 50 : 0;
    const scoreDetails = [
        { name: 'Required skills', score: Math.round(skillCoverage * 0.4), maxScore: 40, detail: requirements.length ? `${matchedSkills.length} of ${requirements.length} identified job skills appear in resume content.` : `No standard skills were identified; job-description keyword coverage is ${keywordCoverage}%.` },
        { name: 'Experience & project evidence', score: Math.round(experienceEvidenceCoverage * 0.25), maxScore: 25, detail: experienceTerms.length ? `${experienceTermsMatched} of ${experienceTerms.length} detected role terms appear in the saved experience or project sections.` : `${[fields.experience?.trim(), fields.projects?.trim()].filter(Boolean).length} of 2 experience/project sections contain text; no distinct role terms were detected.` },
        { name: 'Education & eligibility', score: Math.round(educationScore * 0.1), maxScore: 10, detail: educationStatus === 'not-required' ? 'No specific degree requirement was detected.' : educationStatus === 'met' ? `Resume content includes the requested ${requiredEducation?.name}.` : educationStatus === 'review' ? `The resume lists ${educationInResume?.name}, below the requested ${requiredEducation?.name}; verify eligibility.` : `No ${requiredEducation?.name} was found in the resume; this is not proof of ineligibility.` },
        { name: 'Resume completeness', score: Math.round(completeness * 0.1), maxScore: 10, detail: `${coreFields.filter((key) => fields[key]?.trim()).length} of ${coreFields.length} profile and core content fields are present. Quality score: ${(0, exports.analyzeResume)(fields, undefined, pageCount).score}/100.` },
        { name: 'Job-specific keywords', score: Math.round(keywordCoverage * 0.15), maxScore: 15, detail: `${matchedJobKeywords.length} of ${jobTokens.length} distinct job-description terms appear in resume content.` },
    ];
    const readinessScore = scoreDetails.reduce((total, score) => total + score.score, 0);
    const matchScore = Math.round(requirements.length
        ? skillCoverage * 0.55 + experienceEvidenceCoverage * 0.3 + keywordCoverage * 0.15
        : keywordCoverage * 0.7 + experienceEvidenceCoverage * 0.3);
    const strengths = [
        ...matchedSkills.slice(0, 8).map((skill) => `Resume content mentions ${skill}.`),
        ...(candidateExperienceYears && requiredExperienceYears
            ? [`Resume states ${candidateExperienceYears} years of experience against ${requiredExperienceYears} requested.`]
            : []),
        ...(educationStatus === 'met' ? [`Resume content includes the requested ${requiredEducation?.name}.`] : []),
    ];
    const gaps = [
        ...missingSkills.map((skill) => `Job requirement "${skill}" was not found in the resume; add it only if you genuinely have this skill.`),
        ...(experienceStatus === 'not-found' && requiredExperienceYears
            ? [`The resume does not state the requested ${requiredExperienceYears}+ years of experience; verify and state accurate dates or duration.`]
            : experienceStatus === 'review' && requiredExperienceYears && candidateExperienceYears
                ? [`The resume states ${candidateExperienceYears} years while the job asks for ${requiredExperienceYears}+; verify dates and eligibility.`]
                : []),
        ...(educationStatus === 'not-found' && requiredEducation
            ? [`No ${requiredEducation.name} was found; check the posting and your credentials before drawing conclusions.`]
            : educationStatus === 'review' && requiredEducation && educationInResume
                ? [`The resume lists ${educationInResume.name}; verify whether it satisfies the stated ${requiredEducation.name} requirement.`]
                : []),
        ...(!fields.experience?.trim() && !fields.projects?.trim() ? ['Add relevant experience or project details so job-related claims have supporting evidence.'] : []),
        ...(completeness < 100 ? ['Complete the missing profile and core resume sections before applying.'] : []),
    ];
    const recommendedActions = [
        ...(missingSkills.length ? [`Review the ${missingSkills.slice(0, 5).join(', ')} requirements; add only skills you can substantiate.`] : []),
        ...(missingJobKeywords.length ? ['Tailor relevant, truthful wording to the job description without claiming missing qualifications.'] : []),
        ...(experienceEvidenceCoverage < 60 ? ['Add a specific project or experience example that demonstrates relevant work and its verified outcome.'] : []),
        ...(completeness < 100 ? ['Complete the missing contact, headline, summary, experience, education, or skills fields in the resume builder.'] : []),
        ...(requiredExperienceYears && !candidateExperienceYears ? ['Confirm your relevant experience duration and list accurate dates if available.'] : []),
        ...(requiredEducation && educationStatus !== 'met' ? ['Review education or equivalent-experience eligibility directly in the job posting.'] : []),
    ];
    if (!recommendedActions.length)
        recommendedActions.push('Review the role-specific evidence and keep the resume tailored to this posting.');
    return {
        matchScore,
        readinessScore,
        scoreDetails,
        requirements,
        matchedSkills,
        missingSkills,
        matchingEvidence,
        strengths: strengths.length ? strengths : ['The current resume was compared with the complete job description; review evidence and gaps below.'],
        gaps,
        recommendedActions,
        skillsToLearn: missingSkills,
        educationRequirement: requiredEducation?.name || '',
        educationStatus,
        requiredExperienceYears,
        candidateExperienceYears,
        jobKeywords: jobTokens,
        matchedJobKeywords,
        missingJobKeywords,
        resumeQualityScore: (0, exports.analyzeResume)(fields, undefined, pageCount).score,
        requirementsDetected: requirements.length > 0 || jobTokens.length > 0,
    };
};
exports.matchResumeToJob = matchResumeToJob;
