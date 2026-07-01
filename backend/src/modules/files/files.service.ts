import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class FilesService {
  constructor(private readonly config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get('CLOUDINARY_API_KEY'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadLogo(file: Express.Multer.File, societeId: string): Promise<string> {
    if (!file) throw new BadRequestException('Fichier manquant');
    if (!file.mimetype.startsWith('image/')) throw new BadRequestException('Le fichier doit être une image');
    if (file.size > 2 * 1024 * 1024) throw new BadRequestException('Image trop lourde (max 2 Mo)');

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'facturation/logos',
          public_id: `societe_${societeId}`,
          overwrite: true,
          resource_type: 'image',
          transformation: [{ width: 400, height: 200, crop: 'limit' }],
        },
        (error, result) => {
          if (error || !result) return reject(new BadRequestException('Erreur upload Cloudinary'));
          resolve(result.secure_url);
        },
      ).end(file.buffer);
    });
  }
}
