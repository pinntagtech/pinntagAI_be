import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Res,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard2 } from 'src/auth/guards2/jwt2.guard';
import { AddressAutofillDto } from './dto/address-autofill.dto';
import { GoogleService } from './google.service';

@Controller('google')
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @Get()
  @UseGuards(JwtGuard2)
  async googleRecommendation(
    @Res() res: any,
    @Body() data: AddressAutofillDto,
  ) {
    const result = await this.googleService.googleRecommendation(data);

    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
        sessionToken: result.sessionToken,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Get('placeDetails')
  @UseGuards(JwtGuard2)
  async getPlaceDetails(
    @Res() res: any,
    @Body('placeId') placeId: string,
    @Body('sessionToken') sessionToken: string,
  ) {
    const result = await this.googleService.getPlaceDetails(placeId,sessionToken);

    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
        sessionToken: result.sessionToken,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
}
