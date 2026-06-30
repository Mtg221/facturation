import { Module } from '@nestjs/common';
import { PaiementsService } from './paiements.service';
import { PaiementsController } from './paiements.controller';
import { FacturesModule } from '../factures/factures.module';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [FacturesModule, PdfModule],
  controllers: [PaiementsController],
  providers: [PaiementsService],
  exports: [PaiementsService],
})
export class PaiementsModule {}
