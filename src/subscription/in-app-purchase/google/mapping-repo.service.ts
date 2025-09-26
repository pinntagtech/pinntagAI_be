// src/subscription/services/mapping-repo.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ObfuscatedIdMap,
  ObfuscatedIdMapDocument,
  PurchaseTokenMap,
  PurchaseTokenMapDocument,
} from 'src/subscription/models/iap-mapping.model';

interface UpsertPurchaseTokenArgs {
  purchaseToken: string;
  businessId: Types.ObjectId;
  packageName: string;
  productId: string; // subscriptionId or in-app productId
}

interface UpsertObfIdArgs {
  obfuscatedExternalAccountId: string;
  businessId: Types.ObjectId;
}

@Injectable()
export class MappingRepoService {
  constructor(
    @InjectModel(ObfuscatedIdMap.name)
    private readonly obfModel: Model<ObfuscatedIdMapDocument>,
    @InjectModel(PurchaseTokenMap.name)
    private readonly purchaseTokenMapModel: Model<PurchaseTokenMapDocument>,
  ) {}

  async upsertPurchaseTokenMapping({
    purchaseToken,
    businessId,
    packageName,
    productId,
  }: UpsertPurchaseTokenArgs): Promise<void> {
    await this.purchaseTokenMapModel.updateOne(
      { purchaseToken },
      {
        $set: { businessId, packageName, productId, platform: 'google' },
        $setOnInsert: { lastSeenAt: new Date() },
      },
      { upsert: true },
    );
  }

  async touchPurchaseToken(purchaseToken: string): Promise<void> {
    await this.purchaseTokenMapModel.updateOne(
      { purchaseToken },
      { $set: { lastSeenAt: new Date() } },
    );
  }

  async upsertObfuscatedIdMapping({
    obfuscatedExternalAccountId,
    businessId,
  }: UpsertObfIdArgs): Promise<void> {
    await this.obfModel.updateOne(
      { obfuscatedExternalAccountId },
      { $set: { businessId } },
      { upsert: true },
    );
  }

  async findBusinessByObfuscatedId(
    obfuscatedExternalAccountId: string,
  ): Promise<Types.ObjectId | null> {
    const doc = await this.obfModel
      .findOne({ obfuscatedExternalAccountId })
      .lean();
    return doc?.businessId ?? null;
  }

  async findBusinessByPurchaseToken(
    purchaseToken: string,
  ): Promise<Types.ObjectId | null> {
    const doc = await this.purchaseTokenMapModel
      .findOne({ purchaseToken })
      .lean();
    return doc?.businessId ?? null;
  }

  async getTokenRow(purchaseToken: string) {
    return this.purchaseTokenMapModel.findOne({ purchaseToken }).lean();
  }
}
