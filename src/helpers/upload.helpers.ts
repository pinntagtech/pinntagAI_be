import { extname } from 'path';
import sharp from 'sharp';

export const imageFileFilter = (req, file, callback) => {
  const allowedExtensions = /\.(jpg|jpeg|png|gif)$/;
  const fileMimeType = file.mimetype.split('/')[0];

  // Check file extension and mimetype
  if (!file.originalname.match(allowedExtensions) || fileMimeType !== 'image') {
    req['invalidFile'] = true;
    callback(null, false);
  } else {
    callback(null, true);
  }
};

export const editFileName = (req, file, callback) => {
  const fileExtName = extname(file.originalname);
  const onlyName: string = file.originalname.split(`${fileExtName}`)[0];
  const updatedName = onlyName.replaceAll(' ', '-');
  const randomDigit = Date.now();
  callback(null, `${updatedName}-${randomDigit}${fileExtName}`);
};

export const manipulateImageName = (filename: string) => {
  const extension = extname(filename);
  const nameWithoutExtension = filename.replace(extension, '');
  const cleanedName = nameWithoutExtension.replace(/\s+/g, '');
  return `${cleanedName}${Date.now()}${extension}`;
};

export class FileUploadUtils {
  // static Image = {
  //   limits: { fileSize: 1000000 },
  //   fileFilter: FileFilter,
  //   storage: null,
  //   preservePath: false,
  // };
  static async convertToWebP(
    file: Express.Multer.File,
  ): Promise<Express.Multer.File> {
    try {
      const webpBuffer = await sharp(file.buffer)
        .webp({ quality: 90 }) // Adjust quality as needed (1-100)
        .toBuffer();

      // Update file properties
      return {
        ...file,
        buffer: webpBuffer,
        mimetype: 'image/webp',
        size: webpBuffer.length,
        originalname: file.originalname.replace(/\.[^.]+$/, '.webp'),
      };
    } catch (error) {
      console.error('Error converting to WebP:', error);
      throw new Error('Failed to convert image to WebP format');
    }
  }
  static async compressImage(
    file: Express.Multer.File,
  ): Promise<Express.Multer.File> {
    try {
      const compressedBuffer = await sharp(file.buffer)
        .webp({ quality: 80, effort: 6 }) // Higher effort = better compression
        .toBuffer();

      return {
        ...file,
        buffer: compressedBuffer,
        size: compressedBuffer.length,
      };
    } catch (error) {
      console.error('Error compressing image:', error);
      throw new Error('Failed to compress image');
    }
  }
  static async compressThumbnail(
    file: Express.Multer.File,
  ): Promise<Express.Multer.File> {
    try {
      const thumbnailBuffer = await sharp(file.buffer)
        .resize(200, 200, { fit: 'cover' }) // Adjust size as needed
        .webp({ quality: 70 })
        .toBuffer();

      return {
        ...file,
        buffer: thumbnailBuffer,
        mimetype: 'image/webp',
        size: thumbnailBuffer.length,
      };
    } catch (error) {
      console.error('Error creating thumbnail:', error);
      throw new Error('Failed to create thumbnail');
    }
  }
}
