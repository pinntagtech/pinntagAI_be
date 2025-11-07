// src/pinntag-ai/pinntag-ai.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PinntagAiService {
  private baseUrl = 'http://localhost:4001'; // same instance, internal call
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
}
