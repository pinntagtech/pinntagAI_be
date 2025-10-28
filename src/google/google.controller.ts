import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Res,
  UseGuards,
  BadRequestException,
  Headers,
  Param,
} from '@nestjs/common';
import { JwtGuard2 } from 'src/auth/guards2/jwt2.guard';
import { AddressAutofillDto } from './dto/address-autofill.dto';
import { GoogleService } from './google.service';
import { RateLimitGuard } from 'src/auth/guards/rateLimiter.guard';
import { ApiHeader, ApiResponse } from '@nestjs/swagger';

@Controller('google')
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @Post()
  @UseGuards(JwtGuard2)
  // @UseGuards(RateLimitGuard)
  async googleRecommendation(@Body() data: AddressAutofillDto) {
    const result = await this.googleService.googleRecommendation(data);

    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        sessionToken: result.sessionToken,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('placeDetails')
  @UseGuards(JwtGuard2)
  // @UseGuards(RateLimitGuard)
  async getPlaceDetails(
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
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }
  
  @Post('placeDetailsMetaData/:placeId')
  @UseGuards(JwtGuard2)
  // @UseGuards(RateLimitGuard)
  async getPlaceDetailsWithMetaData(
    @Param('placeId') placeId: string,
  ) {
    const result = await this.googleService.getPlaceDetailsWithMetaData(
      placeId
    );

    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('reverseGeocode')
  // @UseGuards(JwtGuard2)
  @UseGuards(RateLimitGuard)
   @ApiHeader({
    name: 'X-Goog-Api-Key',
    description: 'Google Maps API key',
    required: true,
  })
  async getAddressFromCoordinates(
    @Body('latitude') latitude: number,
    @Body('longitude') longitude: number,
     @Headers('X-Goog-Api-Key') apiKey: string,
  ) {
    const result = await this.googleService.getAddressFromCoordinates(
      latitude,
      longitude,
      apiKey,
    );

    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        postalCode: result.postalCode,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }
}
