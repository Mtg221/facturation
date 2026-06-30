import { Module } from '@nestjs/common';
import { SecteursService } from './secteurs.service';
import { SecteursController } from './secteurs.controller';

@Module({
  controllers: [SecteursController],
  providers: [SecteursService],
  exports: [SecteursService],
})
export class SecteursModule {}
