import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateBrandDto {
  @IsNotEmpty()
  @IsString()
  name: string;
  @IsString()
  tagline: string;

  @IsString()
  businessId: string;
  @IsString()
  industryId: string;
  @IsString()
  slug: string;
  @IsString()
  description: string;
  @IsNumber()
  establishedYear: number;
  @IsString()
  status: string;
  @IsString()
  logoUrl: string;
  @IsString()
  bannerImageUrl: string;
  @IsString()
  slogan: string;
  @IsString()
  email: string;
  @IsString()
  phone: string;
  @IsString()
  websiteUrl: string;
  @IsString()
  eCommerceUrl: string;
  @IsBoolean()
  isRegisteredTrademark: boolean;

  trademarks: string[];
  outletIds: string[];
}
