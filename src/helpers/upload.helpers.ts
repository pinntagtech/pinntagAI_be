import { extname } from 'path';

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
