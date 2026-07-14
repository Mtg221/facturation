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

  async sendVerificationEmail(email: string, prenom: string, token: string) {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'https://facturation-rust.vercel.app');
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
    const companyName = this.configService.get('COMPANY_NAME', 'Facturation');

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM'),
      to: email,
      subject: `Vérifiez votre adresse email — ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e3a5f;">Bienvenue, ${prenom} !</h2>
          <p>Votre compte a été créé sur la plateforme de facturation.</p>
          <p>Cliquez sur le bouton ci-dessous pour vérifier votre adresse email et activer votre compte :</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verificationUrl}"
               style="background-color: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Vérifier mon email
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px;">Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte, ignorez cet email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">${companyName}</p>
        </div>
      `,
    });

    this.logger.log(`Email de vérification envoyé à ${email}`);
  }

  async sendSetPasswordEmail(email: string, prenom: string, token: string) {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'https://facturation-rust.vercel.app');
    const setPasswordUrl = `${frontendUrl}/set-password?token=${token}`;
    const companyName = this.configService.get('COMPANY_NAME', 'Facturation');

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM'),
      to: email,
      subject: `Définissez votre mot de passe — ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e3a5f;">Bienvenue, ${prenom} !</h2>
          <p>Votre compte administrateur a été créé sur la plateforme de facturation.</p>
          <p>Cliquez sur le bouton ci-dessous pour définir votre mot de passe et accéder à votre espace :</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${setPasswordUrl}"
               style="background-color: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Définir mon mot de passe
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px;">Ce lien expire dans 48 heures. Si vous n'attendiez pas ce message, ignorez cet email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">${companyName}</p>
        </div>
      `,
    });

    this.logger.log(`Email de définition de mot de passe envoyé à ${email}`);
  }

  async sendFacture(factureId: string) {
    const facture = await this.prisma.facture.findUnique({
      where: { id: factureId },
      include: { client: true, details: true, user: true, societe: true },
    });

    if (!facture || !facture.client.email) {
      this.logger.warn(`Cannot send facture ${factureId}: no client email`);
      return;
    }

    const pdfBuffer = await this.pdfService.generateFacturePdf(
      facture as Record<string, unknown>,
      facture.societeId,
    );
    const companyName = facture.societe?.nom ?? this.configService.get('COMPANY_NAME', 'Ma Société');

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
