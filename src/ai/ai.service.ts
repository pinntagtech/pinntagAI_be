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
      console.log(
        'contentType category dealType title',
        contentType,
        category,
        dealType,
        title,
      );
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
         Write a professionally engaging, under-100-word description for this content item.

          Business Category: ${business.businessIndustry['name']}
          Content Type: ${contentType}
          Content Category: ${category}
          Deal Type: ${dealType}
          Title: ${title}

          Requirements:
          - Friendly, persuasive tone tailored to ${dealType} and ${category}
          - Specific, informative, and value-driven
          - Never use the business name
          - Avoid clichés: "Don't miss out," "This is the best," "Welcome to," "limited time," "amazing opportunity"

          CRITICAL - Enforce uniqueness by randomly selecting ONE approach:
          1. Lead with a compelling question that addresses a pain point
          2. Open with a surprising statistic or industry insight
          4. Start with a bold statement about transformation or results
          5. Begin with a contrasting comparison (before/after, traditional vs. innovative)
          6. Use sensory or experiential language
          7. Open with a specific problem this solves
          8. Frame around a common misconception or myth

          Vary sentence structure: alternate between short punchy sentences, compound sentences, and different clause orders. Change your opening word each time (avoid starting with "Join," "Discover," "Learn," "Get" repeatedly).

          Output only the description text.
        `,
        },
      ];
      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o',
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
            model: 'gpt-4o',
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
        Write a compelling and professional business description for the following business.

          Business Name: "${business.name}"
          Industry: ${business.businessIndustry?.['title'] || 'N/A'}
          Categories: ${Array.isArray(business.businessCategories) ? business.businessCategories.map((c) => c['title']).join(', ') : business.businessCategories?.['title'] || 'N/A'}
          Location: ${[business.addressLine1, business.addressLine2, business.city, business.country, business.postalCode].filter(Boolean).join(', ')}
          Phone: (${business.countryCode}) ${business.phone}
          Email: ${business.email}
          ${business.website ? 'Website: ' + business.website : ''}

          Core Requirements:
          - 100-150 words in natural, well-formed paragraphs (no bullet points)
          - Clear, engaging, business-friendly tone for general audiences
          - Focus on what the business does and customer value delivered
          - Build trust and interest while conveying purpose and strengths
          - Every sentence must add value—no filler content
          - Avoid generic phrases like "committed to excellence," "proud to serve," "your trusted partner," "premier provider"
          - Do not make assumptions about services not indicated by the category/industry

          CRITICAL - Enforce structural diversity by selecting ONE narrative framework:

          1. **Problem-Solution Arc**: Open with a customer need/challenge in this industry, then explain how this business addresses it, close with the outcome/benefit

          2. **Expertise-First**: Lead with specialized knowledge or years of experience, follow with service range, end with customer-centric philosophy

          3. **Local-Community Angle**: Start with location/community connection, describe how the business serves that market, finish with accessibility/convenience

          4. **Service-Spectrum**: Open by defining the breadth of offerings, detail key categories, conclude with what sets the approach apart

          5. **Customer-Journey**: Begin from the customer's perspective (when someone needs X...), walk through the experience, end with results

          6. **Category-Authority**: Start with industry positioning, explain specialized focus areas, close with distinguishing qualities

          7. **Value-Proposition Lead**: Open with the primary benefit/outcome customers receive, support with how it's delivered, finish with business philosophy

          8. **Modern-Traditional Balance**: Contrast traditional industry values with modern approach/innovation, explain the synthesis

          Variation tactics:
          - Rotate sentence length patterns (short-long-medium vs. medium-short-long)
          - Alternate between starting with the business name vs. starting with the industry/service
          - Vary how you reference location (early mention vs. late mention vs. woven throughout)
          - Mix direct statements with implied benefits
          - Change the role of the final sentence (call-to-action vs. values statement vs. breadth summary)

          Output only the description text.
        `.trim(),
        },
      ];
      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o',
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
            model: 'gpt-4o',
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
