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
          Write a professionally engaging, under-100-word description for the content item, using a friendly, persuasive tone. The description should be:Relevant to the business category and content type
          Business Name: ${business.name}
          Business Category: ${business.businessIndustry['name']}
          Content Type: ${contentType}
          Content Category: ${category}
          Deal Type: ${dealType}
          Title: ${title}
          Tailored to the deal type and category
          Specific, informative, and value-driven
          Unique each time — use different phrasings, sentence structures, or angles
          Avoid using the business name
          DO NOT use generic phrases like “Don't miss out”, “This is the best”, “Welcome to”, etc.
          Include subtle creative variation each time it's run (change lead-ins, highlight different benefits, or use analogies when appropriate)
          Optionally vary the tone slightly within a professional range (e.g., slightly more dynamic, thoughtful, or bold — depending on the content type or category)
          Example styles to vary between:
          Focused on benefits
          Focused on insights or takeaways
          Emphasizing urgency or timeliness (without clichés)
          Using a question hook
          Using a metaphor or comparison
          Using a stat or data point if contextually relevant
          Output format:
          Just the description text.
          Do not include titles, headers, or repeat the input fields.
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
      const cleanDescription = response.data.choices[0].message.content
        .replace(/\n/g, ' ')
        .replace(/\\"/g, '"')
        .replace(/\"/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
      return {
        success: true,
        message: 'Description generated successfully',
        data: cleanDescription,
      };
    } catch (error) {
      console.error('Error fetching AI description:', error);
      return {
        success: false,
        message: 'Failed to generate description',
      };
    }
  }
  async getRewardDescription(
    businessId: string,
    rewardType: string,
    title: string,
    activityType: string,
    targetCount: number,
    startDate: string,
    endDate: string,
  ) {
    try {
      const business = await this.businessModel
        .findById(businessId)
        .select('name businessCategories businessIndustry')
        .populate('businessIndustry', 'name')
        .populate('businessCategories', 'name');
      console.log('BUSINESS:', business);
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
          Business Industry: ${business.businessIndustry['name']}
          Business Category: ${business.businessCategories['name']}
          Reward Type: ${rewardType}
          Activity Type: ${activityType}
          Target Count: ${targetCount}
          Start Date: ${startDate}
          End Date: ${endDate}
          Title: ${title}
          Guidelines:
          Keep it under 150 words.
          Use a professional, friendly, and motivating tone.
          Make the description relevant to the business category and the activity type.
          Clearly explain what the user needs to do (based on activity type and target count).
          Highlight the reward's value and what makes it appealing or worth the effort.
          Include the date range only if it's relevant to urgency or eligibility (but avoid hype).
          Avoid generic phrases like “Don't miss out” or “Act fast.”
          Focus on clarity, motivation, and relevance to the user's experience.
          Do not include the business name in the description—keep it focused on the reward and activity.
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
      const cleanDescription = response.data.choices[0].message.content.replace(
        /\n/g,
        ' ',
      );
      return {
        success: true,
        message: 'Description generated successfully',
        data: cleanDescription,
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
      const cleanDescription = response.data.choices[0].message.content.replace(
        /\n/g,
        ' ',
      );
      return {
        success: true,
        message: 'Description generated successfully',
        data: cleanDescription,
      };
    } catch (error) {
      console.error('Error fetching AI description:', error);
      return {
        success: false,
        message: 'Failed to generate description',
      };
    }
  }
  async getTitleSuggestions(
    contentType: string,
    category: string,
    dealType: string,
    suggestion: string,
  ) {
    try {
      const messages = [
        {
          role: 'user',
          content: `
          Suggest 4 catchy and creative titles for a ${contentType} in the ${category} category, focused on the ${dealType} deal type. Make them engaging, attention-grabbing, and tailored to appeal to the target audience. Use ${suggestion} as inspiration or a guiding theme if relevant.
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
      let suggestions = response.data.choices[0].message.content
        .split('\n')
        .map((line) =>
          line
            .trim()
            .replace(/^\d+[\).\s-]+/, '')
            .replace(/^"(.*)"$/, '$1'),
        )
        .filter(Boolean);
      console.log('SUGGESTIONS:', suggestions);
      return {
        success: true,
        message: 'Title suggestions generated successfully',
        data: suggestions,
      };
    } catch (error) {
      console.error('Error fetching AI title suggestions:', error);
      return {
        success: false,
        message: 'Failed to generate title suggestions',
      };
    }
  }
}
