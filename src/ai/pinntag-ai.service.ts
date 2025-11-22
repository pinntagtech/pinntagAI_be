// src/pinntag-ai/pinntag-ai.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PinntagAiService {
  private baseUrl = 'http://localhost:4200'; // same instance, internal call
  private internalKey = 'change-me';

  async createAgent(payload: any) {
    console.log("payload:",payload);
    const response = await axios.post(
      `${this.baseUrl}/ai/create-agent`,
      payload,
      {
        headers: {
          'x-internal-api-key': this.internalKey,
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  }
  async updateAgent(payload: any,businessId: string) {
    console.log("payload:",payload);
    const response = await axios.put(
      `${this.baseUrl}/ai/update-agent/${businessId}`,
      payload,
      {
        headers: {
          'x-internal-api-key': this.internalKey,
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  }

  
  async generateBusinessDescription(businessId: string) {
    console.log("businessId:",businessId);
    const response = await axios.post(
      `${this.baseUrl}/ai/generate-description/${businessId}`,
      {
        headers: {
          'x-internal-api-key': this.internalKey,
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  }
  async getTitleSuggestions(businessId: string) {
    const response = await axios.post(
      `${this.baseUrl}/ai/generate-tags/${businessId}`,
      {
        headers: {
          'x-internal-api-key': this.internalKey,
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  }

}
