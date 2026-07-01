import { Module } from '@nestjs/common';
import { SocietesController } from './societes.controller';
import { SocietesService } from './societes.service';

@Module({
  controllers: [SocietesController],
  providers: [SocietesService],
  exports: [SocietesService],
})
export class SocietesModule {}
