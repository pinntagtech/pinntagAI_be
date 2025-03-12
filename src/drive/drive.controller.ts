import { Controller, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards/jwt.guard';

@Controller('drive')
export class DriveController {
  constructor() {}

   @Post('fileUpload')
    @UseGuards(JwtGuard)
    @UseInterceptors(
      FileInterceptor(
        'file',
        // , {
        //   dest: './uploads',
        //   fileFilter: imageFileFilter,
        //   storage: diskStorage({
        //     destination: './uploads',
        //     filename: editFileName,
        //   }),
        // }
        {
          // storage: memoryStorage(),
          fileFilter: (req, file, cb) => {
            if (
              allowedMimeTypes.images.includes(file.mimetype) ||
              allowedMimeTypes.videos.includes(file.mimetype)
            ) {
              cb(null, true);
            } else {
              cb(
                new BadRequestException(
                  'Invalid file type. Only images and videos are allowed.',
                ),
                false,
              );
            }
          },
          limits: { fileSize: 100 * 1024 * 1024 }, // ✅ Set file size limit to 100MB
        },
      ),
    )

}
