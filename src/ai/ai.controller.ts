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
import { JwtGuard2 } from 'src/auth/guards2/jwt2.guard';
import { TokenDecoder } from 'src/decorators/tokenDecoder.decorator';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('/event-description')
  @UseGuards(JwtGuard2)
  async getAiDescription(@Res() res: Response, @TokenDecoder() user: DecodedUser) {
    const result = await this.aiService.getEventDescription(user.businessProfile);
    console.log("RESULT:",result);
    if (result.success) {
      return res.status(HttpStatus.CREATED).json({
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
}
