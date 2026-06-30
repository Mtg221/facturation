import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PdfService } from '../pdf/pdf.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    private readonly pdfService: PdfService,
    private readonly prisma: PrismaService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('MAIL_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASS'),
      },
    });
  }

  async sendFacture(factureId: string) {
    const facture = await this.prisma.facture.findUnique({
      where: { id: factureId },
      include: { client: true, details: true, user: true },
    });

    if (!facture || !facture.client.email) {
      this.logger.warn(`Cannot send facture ${factureId}: no client email`);
      return;
    }

    const pdfBuffer = await this.pdfService.generateFacturePdf(facture as Record<string, unknown>);
    const companyName = this.configService.get('COMPANY_NAME', 'Ma Société');

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM'),
      to: facture.client.email,
      subject: `Facture ${facture.numero} - ${companyName}`,
      html: `
        <p>Bonjour,</p>
        <p>Veuillez trouver ci-joint votre facture <strong>${facture.numero}</strong> d'un montant de <strong>${facture.montantTTC} FCFA</strong>.</p>
        <p>Date d'échéance : ${new Date(facture.dateEcheance).toLocaleDateString('fr-FR')}</p>
        <p>Cordialement,<br>${companyName}</p>
      `,
      attachments: [
        {
          filename: `facture-${facture.numero}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    await this.prisma.facture.update({
      where: { id: factureId },
      data: { statut: 'ENVOYEE' },
    });

    this.logger.log(`Facture ${facture.numero} envoyée à ${facture.client.email}`);
  }
}
