import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [PdfModule],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
