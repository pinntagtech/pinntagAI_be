import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { AiDescriptionDto } from './dto/aiDescription.dto';
import { Response } from 'express';
import { UserGuard } from 'src/auth/guards/user.guard';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('/event-description')
  @UseGuards(UserGuard)
  async getAiDescription(@Res() res: Response, @Body() body: AiDescriptionDto) {
    const aiResponse = await this.aiService.getEventDescription(body);
    return res.status(HttpStatus.OK).json({ data: aiResponse });
  }
}
