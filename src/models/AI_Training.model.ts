import mongoose, { Document, Schema, HydratedDocument } from "mongoose";

export interface ITrainingResponse {
  questionId: string;
  answer: string | string[] | number | boolean;
  answeredAt: Date;
}

export interface IAI_Training {
  businessId: mongoose.Types.ObjectId;
  assistantId: string;
  industry: string;
  subCategory?: string;
  responses: ITrainingResponse[];
  trainingStatus: "not_started" | "in_progress" | "completed";
  completedAt?: Date;
  lastUpdated: Date;
  metadata?: {
    totalQuestions: number;
    answeredQuestions: number;
    requiredQuestions: number;
    completionPercentage: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type AI_TrainingDocument = HydratedDocument<IAI_Training>;

const TrainingResponseSchema = new Schema<ITrainingResponse>(
  {
    questionId: { type: String, required: true },
    answer: { type: Schema.Types.Mixed, required: true },
    answeredAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

export const AI_TrainingSchema = new Schema<IAI_Training>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
      ref: "Business",
    },
    assistantId: {
      type: String,
      required: true,
      index: true,
    },
    industry: {
      type: String,
      required: true,
      enum: [
        "Food & Drink",
        "Retail",
        "Health & Beauty",
        "Fitness & Wellness",
        "Entertainment",
        "Automotive Services",
        "Home Services",
        "Pet Services",
        "Hospitality",
        "Professional Services",
      ],
    },
    subCategory: {
      type: String,
      required: false,
    },
    responses: {
      type: [TrainingResponseSchema],
      default: [],
    },
    trainingStatus: {
      type: String,
      enum: ["not_started", "in_progress", "completed"],
      default: "not_started",
      required: true,
    },
    completedAt: {
      type: Date,
      required: false,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: {
        totalQuestions: { type: Number },
        answeredQuestions: { type: Number },
        requiredQuestions: { type: Number },
        completionPercentage: { type: Number },
      },
      required: false,
    },
  },
  { timestamps: true, versionKey: false }
);

// Indexes for efficient querying
AI_TrainingSchema.index({ trainingStatus: 1 });
AI_TrainingSchema.index({ industry: 1 });
AI_TrainingSchema.index({ completedAt: -1 });
AI_TrainingSchema.index({ businessId: 1, assistantId: 1 });

// Pre-save hook to update metadata and status
AI_TrainingSchema.pre("save", function (next) {
  const doc = this as AI_TrainingDocument;
  doc.lastUpdated = new Date();

  // Update completion percentage
  if (doc.metadata && doc.metadata.totalQuestions) {
    const answeredCount = doc.responses.length;
    doc.metadata.answeredQuestions = answeredCount;
    doc.metadata.completionPercentage = Math.round(
      (answeredCount / doc.metadata.totalQuestions) * 100
    );

    // Auto-update training status
    if (answeredCount === 0) {
      doc.trainingStatus = "not_started";
    } else if (answeredCount < doc.metadata.totalQuestions) {
      doc.trainingStatus = "in_progress";
    } else {
      doc.trainingStatus = "completed";
      if (!doc.completedAt) {
        doc.completedAt = new Date();
      }
    }
  }

  next();
});

export const AI_TrainingModel = mongoose.model<IAI_Training>(
  "AI_Training",
  AI_TrainingSchema
);
