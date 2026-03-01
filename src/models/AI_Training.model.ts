import mongoose, { Document, Schema, HydratedDocument } from "mongoose";

export interface ITrainingResponse {
  questionId: string;
  answer: string | string[] | number | boolean;
  answeredAt: Date;
}

export interface IGooglePlacesData {
  regularOpeningHours?: {
    openNow?: boolean;
    periods?: Array<{
      open: { day: number; hour: number; minute: number };
      close: { day: number; hour: number; minute: number };
    }>;
    weekdayDescriptions?: string[];
  };
  photos?: Array<{
    name: string;
    widthPx: number;
    heightPx: number;
    authorAttributions?: Array<{
      displayName: string;
      uri: string;
      photoUri: string;
    }>;
  }>;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  formattedAddress?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  types?: string[];
  displayName?: {
    text: string;
    languageCode: string;
  };
  primaryTypeDisplayName?: {
    text: string;
    languageCode: string;
  };
  lastUpdated?: Date;
}

export interface IAI_Training {
  businessId: mongoose.Types.ObjectId;
  assistantId: string;
  industry: string;
  subCategory?: string;
  responses: ITrainingResponse[];
  trainingStatus: "not_started" | "in_progress" | "completed";
  currentPhase: "basic" | "standard" | "advanced";
  completedPhases: ("basic" | "standard" | "advanced")[];
  completedAt?: Date;
  lastUpdated: Date;
  googlePlacesData?: IGooglePlacesData;
  metadata?: {
    totalQuestions: number;
    answeredQuestions: number;
    requiredQuestions: number;
    completionPercentage: number;
    phaseProgress?: {
      basic: { total: number; answered: number; completed: boolean };
      standard: { total: number; answered: number; completed: boolean };
      advanced: { total: number; answered: number; completed: boolean };
    };
  };
  questions?: any[];
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
  { _id: false },
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
        "Entertainment",
        "Classes and Workshops",
        "Classes & Workshops",
        "Food & Drink",
        "Sports & Outdoor",
        "Local Attractions",
        "Retail & Shopping",
        "Health & Wellness",
        "Home & Professional Services",
        "Places to Stay",
        "Mobile Businesses",
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
    currentPhase: {
      type: String,
      enum: ["basic", "standard", "advanced"],
      default: "basic",
      required: true,
    },
    completedPhases: {
      type: [String],
      enum: ["basic", "standard", "advanced"],
      default: [],
    },
    completedAt: {
      type: Date,
      required: false,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    googlePlacesData: {
      type: Schema.Types.Mixed,
      required: false,
    },
    metadata: {
      type: {
        totalQuestions: { type: Number },
        answeredQuestions: { type: Number },
        requiredQuestions: { type: Number },
        completionPercentage: { type: Number },
        phaseProgress: {
          type: {
            basic: {
              type: {
                total: { type: Number },
                answered: { type: Number },
                completed: { type: Boolean },
              },
            },
            standard: {
              type: {
                total: { type: Number },
                answered: { type: Number },
                completed: { type: Boolean },
              },
            },
            advanced: {
              type: {
                total: { type: Number },
                answered: { type: Number },
                completed: { type: Boolean },
              },
            },
          },
        },
      },
      required: false,
    },
    questions: {
      type: [Schema.Types.Mixed],
      required: false,
      default: [],
    },
  },
  { timestamps: true, versionKey: false },
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
      (answeredCount / doc.metadata.totalQuestions) * 100,
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
  AI_TrainingSchema,
);
