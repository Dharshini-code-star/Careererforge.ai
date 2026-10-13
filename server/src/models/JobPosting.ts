import mongoose, { Document, Schema } from 'mongoose';

export interface IJobPosting extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  company: string;
  description: string;
  source: 'user-provided' | 'remotive' | 'arbeitnow' | 'adzuna';
  providerId?: string;
  url?: string;
  location?: string;
  remote?: boolean;
  workplace?: 'remote' | 'hybrid' | 'on-site' | '';
  employmentType?: string;
  experienceLevel?: string;
  salary?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  tags: string[];
  postedAt?: Date;
  isSaved: boolean;
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const JobPostingSchema = new Schema<IJobPosting>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
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
  },
  { timestamps: true }
);

JobPostingSchema.index({ userId: 1, updatedAt: -1 });
JobPostingSchema.index(
  { userId: 1, source: 1, providerId: 1 },
  { unique: true, partialFilterExpression: { providerId: { $type: 'string' } } }
);

export default mongoose.model<IJobPosting>('JobPosting', JobPostingSchema);
