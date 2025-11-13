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
  const extenstion = extname(filename);
  const nameWithoutExtension = filename.replace(extenstion, '');
  return `${nameWithoutExtension}${Date.now()}${extenstion}`;
};

export class FileUploadUtils {
  // static Image = {
  //   limits: { fileSize: 1000000 },
  //   fileFilter: FileFilter,
  //   storage: null,
  //   preservePath: false,
  // };
  static compressImage = async function (
    file: Express.Multer.File,
  ): Promise<Express.Multer.File> {
    const compressedImageBuffer = await sharp(file.buffer)
      .jpeg({ quality: 80 })
      .toBuffer();
    return {
      ...file,
      buffer: compressedImageBuffer,
      mimetype: 'image/jpeg',
      size: compressedImageBuffer.length,
    };
  };
  static compressThumbnail = async function (
    file: Express.Multer.File,
  ): Promise<Express.Multer.File> {
    try {
      const compressedThumbnailBuffer = await sharp(file.buffer)
        .resize(200, 200, { fit: 'cover' })
        .jpeg({ quality: 50 })
        .toBuffer();
      return {
        ...file,
        buffer: compressedThumbnailBuffer,
        mimetype: 'image/jpeg',
        size: compressedThumbnailBuffer.length,
      };
    } catch (err) {
      console.error('Error:', err);
    }
  };
}
