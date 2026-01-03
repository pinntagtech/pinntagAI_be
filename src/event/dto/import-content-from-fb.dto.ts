import { IsNotEmpty, IsOptional } from 'class-validator';

export class FacebookImportedPost {
  @IsNotEmpty()
  facebookPageId: string;

  @IsNotEmpty()
  postId: string;

  @IsNotEmpty()
  mongoId: string;

  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  description: string;

  @IsOptional()
  images: string[];

  @IsOptional()
  type:string;

}
