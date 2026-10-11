import mongoose, { Document, Schema } from 'mongoose';

export interface IResumeSource extends Document {
  userId: mongoose.Types.ObjectId;
  filename: string;
  mimeType: string;
  fileSize: number;
  fileHash: string;
  extractedText: string;
  extractedFields: Record<string, string>;
  pageCount?: number;
  originalFile: Buffer;
  createdAt: Date;
}

const ResumeSourceSchema = new Schema<IResumeSource>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    filename: { type: String, required: true, maxlength: 255 },
    mimeType: { type: String, required: true, enum: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] },
    fileSize: { type: Number, required: true },
    fileHash: { type: String, required: true },
    extractedText: { type: String, required: true, select: false },
    extractedFields: { type: Schema.Types.Mixed, required: true },
    pageCount: { type: Number },
    originalFile: { type: Buffer, required: true, select: false },
  },
  { timestamps: true }
);

ResumeSourceSchema.index({ userId: 1, createdAt: -1 });
ResumeSourceSchema.index({ userId: 1, fileHash: 1 });

export default mongoose.model<IResumeSource>('ResumeSource', ResumeSourceSchema);
