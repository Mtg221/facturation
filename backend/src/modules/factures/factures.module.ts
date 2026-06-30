import { Module } from '@nestjs/common';
import { FacturesService } from './factures.service';
import { FacturesController } from './factures.controller';
import { FacturesNumberService } from './factures-number.service';
import { PdfModule } from '../pdf/pdf.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PdfModule, NotificationsModule],
  controllers: [FacturesController],
  providers: [FacturesService, FacturesNumberService],
  exports: [FacturesService],
})
export class FacturesModule {}
