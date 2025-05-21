import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard2 } from 'src/auth/guards2/jwt2.guard';
import { AddressAutofillDto } from './dto/address-autofill.dto';
import { GoogleService } from './google.service';

@Controller('google')
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @Post()
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

  @Post('placeDetails')
  @UseGuards(JwtGuard2)
  async getPlaceDetails(
    @Res() res: any,
    @Body('placeId') placeId: string,
    @Body('sessionToken') sessionToken: string,
    @Body('selectedAddress') selectedAddress: string,
  ) {
    const result = await this.googleService.getPlaceDetails(
      placeId,
      sessionToken,
      selectedAddress,
    );

    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
        // sessionToken: result.sessionToken,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('reverseGeocode')
  @UseGuards(JwtGuard2)
  async getAddressFromCoordinates(
    @Res() res: any,
    @Body('latitude') latitude: number,
    @Body('longitude') longitude: number,
  ) {
    const result = await this.googleService.getAddressFromCoordinates(
      latitude,
      longitude,
    );

    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
        postalCode: result.postalCode,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
}
