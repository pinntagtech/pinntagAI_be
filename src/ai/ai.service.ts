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
    @InjectModel(Business.name) private readonly businessModel: Model<BusinessDocument>,
    private readonly httpService: HttpService) {}

  async getEventDescription(businessId:string) {
    try {
      const business = await this.businessModel.findById(businessId).select('name businessCategories businessIndustry').populate('businessIndustry', 'name').populate('businessCategories', 'name');
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
          Generate a compelling and engaging description for a event titled "${business.name}".  
          Category: ${business.businessIndustry['name']}.  
          The description should be concise, persuasive, and relevant to the category.  
          Use a professional yet inviting tone.  
          Avoid generic phrases and focus on making the content stand out.  
          Keep it under 80 words.
        `,
        },
      ];
      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: messages,
            max_tokens: 100,
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
      }
    } catch (error) {
      console.error('Error fetching AI description:', error);
      return {
        success: false,
        message: 'Failed to generate description',
      };
    }
  }
}
