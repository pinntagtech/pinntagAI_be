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

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('/event-description')
  @UseGuards(JwtGuard2)
  async getAiDescription(@Res() res: Response, @Body() body: AiDescriptionDto) {
    const result = await this.aiService.getEventDescription(body);
    console.log("RESULT:",result);
    return { data: result.data,message:result.message }
    // if (result.success) {
    //   return res.status(HttpStatus.CREATED).json({
    //     message: result.message,
    //     data: result.data,
    //   });
    // } else {
    //   return res.status(HttpStatus.BAD_REQUEST).json({
    //     message: result.message,
    //   });
    // }
  }
}
