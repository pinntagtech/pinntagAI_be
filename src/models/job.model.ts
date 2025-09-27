import mongoose, { Schema, Document } from "mongoose";

export type JobLifecycleStatus =
  | "created"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface IJob extends Document {
  jobId: string;
  groupId?: string;
  source?: string;
  urls?: string[];
  output_formats?: string[];
  status: JobLifecycleStatus;
  error?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    groupId: { type: String, index: true },
    source: { type: String },
    urls: [{ type: String }],
    output_formats: [{ type: String }],
    status: {
      type: String,
      enum: ["created", "running", "completed", "failed", "cancelled"],
      default: "created",
      index: true,
    },
    error: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true, versionKey: false }
);

JobSchema.index({ status: 1, createdAt: -1 });
JobSchema.index({ groupId: 1, createdAt: -1 });

export const JobModel = mongoose.model<IJob>("Job", JobSchema);
