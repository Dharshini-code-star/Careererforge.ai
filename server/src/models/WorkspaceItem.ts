import mongoose, { Schema, Document } from 'mongoose';

export type WorkspaceKind = 'resume' | 'portfolio' | 'coverLetter' | 'application';

export interface IWorkspaceItem extends Document {
  userId: mongoose.Types.ObjectId;
  kind: WorkspaceKind;
  title: string;
  data: Record<string, unknown>;
  isPublished: boolean;
  slug?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceItemSchema = new Schema<IWorkspaceItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: {
      type: String,
      enum: ['resume', 'portfolio', 'coverLetter', 'application'],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    data: { type: Schema.Types.Mixed, default: {} },
    isPublished: { type: Boolean, default: false },
    slug: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

WorkspaceItemSchema.index({ userId: 1, kind: 1, updatedAt: -1 });

export default mongoose.model<IWorkspaceItem>('WorkspaceItem', WorkspaceItemSchema);
