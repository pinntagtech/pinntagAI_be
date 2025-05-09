import { Body, Controller, HttpStatus, Post, Res, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtGuard2 } from 'src/auth/guards2/jwt2.guard';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { TokenDecoder } from 'src/decorators/tokenDecoder.decorator';
import { CreateRewardDto } from './dto/create-reward.dto';
import { Response } from 'express';
import { RewardsService } from './rewards.service';

@Controller('rewards')
export class RewardsController {

    constructor(
        private readonly rewardService: RewardsService
    ) {}

     @Post()
      @UseGuards(JwtGuard2)
      @UseInterceptors(
        FilesInterceptor('images', 4, {
          //   dest: './uploads',
          //   fileFilter: imageFileFilter,
          //   storage: diskStorage({
          //     destination: './uploads',
          //     filename: editFileName,
          //   }),
          //   //Setting file size limit to 1 MB
          limits: { fileSize: 1000000 },
        }),
        FileInterceptor('qrCode', {
            //   dest: './uploads',
            //   fileFilter: imageFileFilter,
            //   storage: diskStorage({
            //     destination: './uploads',
            //     filename: editFileName,
            //   }),
            //   //Setting file size limit to 1 MB
            limits: { fileSize: 1000000 },
          }),
      )
      async createReward(
        @Res() res: Response,
        @Body() data: CreateRewardDto,
        @TokenDecoder() user: DecodedUser,
        @UploadedFiles() images: Express.Multer.File[],
        @UploadedFile() qrCode: Express.Multer.File,
      ) {
        console.log("controller image:",images);
        if(!qrCode){
          return res.status(HttpStatus.BAD_REQUEST).json({
            message: 'Please provide an image',
          });
        }
        const result = await this.rewardService.createReward(data, user, images,qrCode);
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
