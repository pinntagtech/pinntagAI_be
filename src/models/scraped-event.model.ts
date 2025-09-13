import mongoose, { Schema, Document } from "mongoose";
import {
  ScrapedEvent,
  GenderType,
  EventStatus,
  EventType,
  CreatorType,
} from "../utils/types/event.types";

const LocationCoordinatesSchema = new Schema({
  type: { type: String, default: "Point" },
  coordinates: {
    type: [Number],
    validate: {
      validator: function (v: number[]) {
        return (
          v.length === 2 &&
          v[0] >= -180 &&
          v[0] <= 180 &&
          v[1] >= -90 &&
          v[1] <= 90
        );
      },
      message: "Invalid coordinates format",
    },
  },
});

const EventLocationSchema = new Schema({
  location: LocationCoordinatesSchema,
  address1: { type: String, required: true },
  address2: { type: String, default: "" },
  city: { type: String, required: true },
  state: { type: String, default: "" },
  zip: { type: String, default: "" },
  website: { type: String, default: "" },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  distance: { type: Number, default: 0 },
});

const FixedScheduleSchema = new Schema({
  date: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
});

const EventScheduleSchema = new Schema({
  scheduleType: {
    type: String,
    required: true,
    enum: ["Fixed Schedule", "Recurring Schedule", "Flexible Schedule"],
  },
  fixedSchedule: FixedScheduleSchema,
  recurringSchedule: Schema.Types.Mixed,
});

const CategorySchema = new Schema({
  name: { type: String, required: true },
  darkIcon: { type: String, required: true },
  lightIcon: { type: String, required: true },
  activeColor: { type: String, required: true },
});

const BusinessProfileSchema = new Schema({
  name: { type: String, required: true },
  cover: { type: String, default: "" },
  logo: { type: String, default: "" },
  email: { type: String, default: "" },
  bio: { type: String, default: "" },
  description: { type: String, default: "" },
  followersCount: { type: Number, default: 0 },
  isFollowedByMe: { type: Boolean, default: false },
  profileType: {
    type: String,
    required: true,
    enum: ["BusinessProfile", "PersonalProfile"],
  },
  phone: { type: String, default: "" },
  website: { type: String, default: "" },
  isDeleted: { type: Boolean, default: false },
  isMe: { type: Boolean, default: false },
});

const OrganizerSchema = new Schema({
  businessName: { type: String, required: true },
  businessId: { type: String, required: true },
});

const QRCodeSchema = new Schema({
  url: { type: String, default: "" },
  code: { type: String, default: "" },
});

export interface IScrapedEvent extends Document, Omit<ScrapedEvent, "_id"> {}

const ScrapedEventSchema = new Schema<IScrapedEvent>(
  {
    title: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 200,
      trim: true,
    },
    keywords: [{ type: String, trim: true }],
    description: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 2000,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(EventType),
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(EventStatus),
      default: EventStatus.PUBLISHED,
    },
    notifyFollowers: { type: Boolean, default: true },
    targetGenders: [
      {
        type: String,
        enum: Object.values(GenderType),
      },
    ],
    promotionCode: { type: String, default: "" },
    isFree: { type: Boolean, default: true },
    participationCost: {
      type: Number,
      min: 0,
      validate: {
        validator: function (this: IScrapedEvent, value: number) {
          return this.isFree
            ? value === null || value === undefined
            : value > 0;
        },
        message: "Cost validation failed",
      },
    },
    bookingUrl: [{ type: String }],
    termsAndConditions: { type: String, default: "" },
    creatorType: {
      type: String,
      required: true,
      enum: Object.values(CreatorType),
    },
    businessProfileDetails: BusinessProfileSchema,
    QR_CODE: { type: QRCodeSchema, default: () => ({}) },
    isLiked: { type: Boolean, default: false },
    isSaved: { type: Boolean, default: false },
    locations: [EventLocationSchema],
    organizer: { type: OrganizerSchema, required: true },
    websites: [{ type: String }],
    audience: [{ type: String }],
    images: [{ type: String }],
    score: {
      type: Number,
      default: 0.0,
      min: 0.0,
      max: 1.0,
    },
    schedules: [EventScheduleSchema],
    categories: [CategorySchema],
    creatorDetails: BusinessProfileSchema,
    highlights: [{ type: String, trim: true }],

    // Metadata fields
    scrapedAt: { type: Date, default: Date.now },
    scrapedFrom: { type: String },
    scraperVersion: { type: String },
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for better query performance
ScrapedEventSchema.index({ status: 1, type: 1 });
ScrapedEventSchema.index({ "locations.city": 1, "locations.state": 1 });
ScrapedEventSchema.index({ keywords: 1 });
ScrapedEventSchema.index({ "schedules.fixedSchedule.startDate": 1 });
ScrapedEventSchema.index({ score: -1 });
ScrapedEventSchema.index({ scrapedAt: -1 });

// Text search index
ScrapedEventSchema.index({
  title: "text",
  description: "text",
  keywords: "text",
  highlights: "text",
});

// Virtual for URL generation
ScrapedEventSchema.virtual("eventUrl").get(function () {
  return `/events/${this._id}`;
});

// Instance methods
ScrapedEventSchema.methods.toJSON = function () {
  const event = this.toObject();
  event.eventUrl = this.eventUrl;
  return event;
};

// Static methods
ScrapedEventSchema.statics.findByCity = function (city: string) {
  return this.find({ "locations.city": new RegExp(city, "i") });
};

ScrapedEventSchema.statics.findUpcoming = function () {
  const now = new Date();
  return this.find({
    "schedules.fixedSchedule.startDate": { $gte: now },
    status: EventStatus.PUBLISHED,
  }).sort({ "schedules.fixedSchedule.startDate": 1 });
};

export const ScrapedEventModel = mongoose.model<IScrapedEvent>(
  "ScrapedEvent",
  ScrapedEventSchema
);
