// src/subscription/models/iap-mapping.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MSchema, Types } from 'mongoose';

export type ObfuscatedIdMapDocument = HydratedDocument<ObfuscatedIdMap>;
export type PurchaseTokenMapDocument = HydratedDocument<PurchaseTokenMap>;

@Schema({ timestamps: true, collection: 'iap_obfuscated_id_map' })
export class ObfuscatedIdMap {
  @Prop({ required: true, unique: true, index: true })
  obfuscatedExternalAccountId: string;

  // Your Business/User ObjectId (adjust field name to your domain model)
  @Prop({ type: MSchema.Types.ObjectId, required: true, ref: 'Business' })
  businessId: Types.ObjectId;
}
export const ObfuscatedIdMapSchema =
  SchemaFactory.createForClass(ObfuscatedIdMap);

@Schema({ timestamps: true, collection: 'iap_purchase_token_map' })
export class PurchaseTokenMap {
  // @Prop({ required: true, unique: true, index: true })
  @Prop({ required: true, index: true })
  purchaseToken: string;

  @Prop({ type: MSchema.Types.ObjectId, required: true, ref: 'Business' })
  businessId: Types.ObjectId;

  @Prop({ required: true })
  packageName: string;

  // subscriptionId (for subs) or productId (for in-app products)
  @Prop({ required: true })
  productId: string;

  // helps you know the last time you saw/validated this token
  @Prop({ default: Date.now })
  lastSeenAt: Date;

  // optional metadata
  @Prop({ default: 'google' })
  platform: 'google' | 'apple' | 'other';
}
export const PurchaseTokenMapSchema =
  SchemaFactory.createForClass(PurchaseTokenMap);

// Useful compound index for quick lookups by (pkg, product)
PurchaseTokenMapSchema.index({ packageName: 1, productId: 1 });
