import { Module } from '@nestjs/common';
import { SocietesController } from './societes.controller';
import { SocietesService } from './societes.service';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [FilesModule],
  controllers: [SocietesController],
  providers: [SocietesService],
  exports: [SocietesService],
})
export class SocietesModule {}
