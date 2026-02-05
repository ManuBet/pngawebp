
export enum ImageFormat {
  PNG = 'image/png',
  JPEG = 'image/jpeg',
  WEBP = 'image/webp',
  GIF = 'image/gif'
}

export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'converting' | 'completed' | 'error';
  targetFormat: ImageFormat;
  quality: number;
  resultUrl?: string;
  aiName?: string;
  aiCaption?: string;
}

export interface ConversionOptions {
  format: ImageFormat;
  quality: number;
}
