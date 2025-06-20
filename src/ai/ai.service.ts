import { Injectable } from '@nestjs/common';
import { AiDescriptionDto } from './dto/aiDescription.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { Business, BusinessDocument } from 'src/business/model/business.model';
import { Model } from 'mongoose';

@Injectable()
export class AiService {
  private readonly apiKey: string = process.env.OPENAI_KEY;
  constructor(
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
    private readonly httpService: HttpService,
  ) {}

  async getEventDescription(
    businessId: string,
    contentType: string,
    category: string,
    dealType: string,
    title: string,
  ) {
    try {
      const business = await this.businessModel
        .findById(businessId)
        .select('name businessCategories businessIndustry')
        .populate('businessIndustry', 'name')
        .populate('businessCategories', 'name');
      if (!business) {
        return {
          success: false,
          message: 'Business not found',
        };
      }
      const messages = [
        {
          role: 'system',
          content: 'You are a helpful assistant.',
        },
        {
          role: 'user',
          content: `
          Generate a compelling, and professionally engaging description for a content item.
          Business Name: ${business.name}
          Business Category: ${business.businessIndustry['name']}
          Content Type: ${contentType}
          Content Category: ${category}
          Deal Type: ${dealType}
          Title: ${title}
          Guidelines:
          Keep it under 100 words.
          Use a professional yet friendly inviting tone.
          Make it relevant to the business category and content type.
          Highlight what makes the content unique or valuable to the audience.
          Avoid generic filler (e.g., “Don't miss out”, "Welcome to" or “This is the best”).
          Focus on clarity, persuasion, and specificity.
          Prefer not to use business name in the description and keep it focused on the content.
        `,
        },
      ];
      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: messages,
            max_tokens: 512,
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      return {
        success: true,
        message: 'Description generated successfully',
        data: response.data.choices[0].message.content,
      };
    } catch (error) {
      console.error('Error fetching AI description:', error);
      return {
        success: false,
        message: 'Failed to generate description',
      };
    }
  }
  async getBusinessDescription(businessId: string) {
    try {
      const business = await this.businessModel
        .findById(businessId)
        .select('name businessCategories businessIndustry')
        .populate('businessIndustry', 'title')
        .populate('businessCategories', 'title');
      if (!business) {
        return {
          success: false,
          message: 'Business not found',
        };
      }
      const messages = [
        // {
        //   role: 'system',
        //   content: 'You are a helpful assistant.',
        // },
        {
          role: 'user',
          content: `
         Write a compelling and professional business description for the following business. The tone should be clear, engaging, and business-friendly, suitable for a general audience.

          Business Name: "${business.name}"
          Industry: ${business.businessIndustry?.['title'] || 'N/A'}
          Categories: ${Array.isArray(business.businessCategories) ? business.businessCategories.map((c) => c['title']).join(', ') : business.businessCategories?.['title'] || 'N/A'}
          Location: ${[
            business.addressLine1,
            business.addressLine2,
            business.city,
            business.country,
            business.postalCode,
          ]
            .filter(Boolean)
            .join(', ')}
          Phone: (${business.countryCode}) ${business.phone}
          Email: ${business.email}
          ${business.website ? 'Website: ' + business.website : ''}

          Instructions:
          - Focus on what the business does and the value it provides to its customers.
          - Highlight unique offerings, expertise, or competitive advantages.
          - Emphasize relevance in its industry or local market.
          - Keep it between **100 and 150 words**.
          - Avoid generic phrases, assumptions, or technical jargon.
          - Do not use bullet points — write in natural, well-formed paragraphs.
          - Every sentence should add value — avoid filler content.

          The goal is to produce a description that builds trust and interest, and clearly conveys the business's purpose and strengths.
        `.trim(),
        },
      ];
      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: messages,
            max_tokens: 512,
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      return {
        success: true,
        message: 'Description generated successfully',
        data: response.data.choices[0].message.content,
      };
    } catch (error) {
      console.error('Error fetching AI description:', error);
      return {
        success: false,
        message: 'Failed to generate description',
      };
    }
  }
}
