import { Injectable } from '@nestjs/common';
import { AiDescriptionDto } from './dto/aiDescription.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AiService {
  private readonly apiKey: string = process.env.OPENAI_KEY;
  constructor(private readonly httpService: HttpService) {}

  async getEventDescription(body: AiDescriptionDto) {
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful assistant.',
      },
      {
        role: 'user',
        content: `
        Generate a compelling and engaging description for a event titled "${body.title}".  
        Category: ${body.category}.  
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
    return response.data.choices[0].message.content;
  }
}
