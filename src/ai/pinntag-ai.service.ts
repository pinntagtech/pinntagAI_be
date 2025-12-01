// src/pinntag-ai/pinntag-ai.service.ts
import { Injectable } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { error } from 'console';

@Injectable()
export class PinntagAiService {
  private baseUrl = 'https://ai.pinntag.com'; // same instance, internal call
  private internalKey = 'change-me';

  async createAgent(payload: any) {
    try {
      console.log('payload:', payload);
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
    } catch (Error: AxiosError | any) {
      console.error('Error creating agent:', error)
    }
  }
  async updateAgent(payload: any, businessId: string) {
    try {
      console.log('payload:', payload);
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
    } catch (error) {
      console.error('Error updating agent:', error);
      throw error;
    }
  }

  async generateBusinessDescription(businessId: string) {
    try {
      console.log('businessId:', businessId);
      console.log("WHY IT IS COMING HEREEEE:");
      const response = await axios.get(
        `${this.baseUrl}/ai/generate-description/${businessId}`,
        {
          headers: {
            'x-internal-api-key': this.internalKey,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error generating business description:', error);
      throw error;
    }
  }
  async generateBusinessDescriptionWithTagsUpdate(
    payload: any,
  ) {
    try {
      const body = JSON.stringify(payload);
      console.log("BODY:::",body);
      const response = await axios.post(
        `${this.baseUrl}/ai-assist/update-tags-and-description`,
        body,
        {
          headers: {
            'x-internal-api-key': this.internalKey,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error generating business description:', error);
      throw error;
    }
  }

  async generateBusinessTagsSuggestions(businessId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/ai/generate-tags/${businessId}`,
        {
          headers: {
            'x-internal-api-key': this.internalKey,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error generating title suggestions:', error);
      throw error;
    }
  }
}
