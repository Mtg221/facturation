import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(private readonly configService: ConfigService) {
    this.registerHelpers();
  }

  async generateFacturePdf(facture: Record<string, unknown>): Promise<Buffer> {
    const templatePath = path.join(__dirname, 'templates', 'facture.template.hbs');
    const template = fs.readFileSync(templatePath, 'utf-8');
    const compiled = Handlebars.compile(template);

    const safeFacture = this.sanitizeData(facture);
    const safeCompany = this.sanitizeData({
      nom: this.configService.get('COMPANY_NAME', 'Ma Société'),
      adresse: this.configService.get('COMPANY_ADDRESS', 'Dakar, Sénégal'),
      telephone: this.configService.get('COMPANY_PHONE', ''),
      email: this.configService.get('COMPANY_EMAIL', ''),
      ninea: this.configService.get('COMPANY_NINEA', ''),
      rc: this.configService.get('COMPANY_RC', ''),
      banque: this.configService.get('COMPANY_BANK', ''),
    });

    const html = compiled({
      facture: safeFacture,
      company: safeCompany,
      generatedAt: new Date().toLocaleDateString('fr-FR'),
    });

    return this.renderToPdf(html);
  }

  async generateRecuPdf(paiement: Record<string, unknown>): Promise<Buffer> {
    const templatePath = path.join(__dirname, 'templates', 'recu.template.hbs');
    const template = fs.readFileSync(templatePath, 'utf-8');
    const compiled = Handlebars.compile(template);

    const safePaiement = this.sanitizeData(paiement);
    const safeCompany = this.sanitizeData({
      nom: this.configService.get('COMPANY_NAME', 'Ma Société'),
      adresse: this.configService.get('COMPANY_ADDRESS', 'Dakar, Sénégal'),
      telephone: this.configService.get('COMPANY_PHONE', ''),
    });

    const html = compiled({
      paiement: safePaiement,
      company: safeCompany,
      generatedAt: new Date().toLocaleDateString('fr-FR'),
    });

    return this.renderToPdf(html);
  }

  private async renderToPdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });

      const buffer = await page.pdf({
        format: 'A4',
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
        printBackground: true,
      });

      return Buffer.from(buffer);
    } finally {
      await browser.close();
    }
  }

  private sanitizeData(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.escapeHtml(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value as Record<string, unknown>);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item) => 
          typeof item === 'object' ? this.sanitizeData(item as Record<string, unknown>) : 
          typeof item === 'string' ? this.escapeHtml(item) : item
        );
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private escapeHtml(text: string): string {
    const htmlEntities: Record<string, string> = {
      '&': '&',
      '<': '<',
      '>': '>',
      '"': '"',
      ["'"]: '&#x27;',
      '/': '&#x2F;',
    };
    return text.replace(/[&<>"'\/]/g, (char) => htmlEntities[char] || char);
  }

  private registerHelpers() {
    Handlebars.registerHelper('formatMoney', (value: number) => {
      return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(value);
    });

    Handlebars.registerHelper('formatDate', (value: string | Date) => {
      return new Date(value).toLocaleDateString('fr-FR');
    });

    Handlebars.registerHelper('multiply', (a: number, b: number) => a * b);

    Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);

    Handlebars.registerHelper('statutLabel', (statut: string) => {
      const labels: Record<string, string> = {
        BROUILLON: 'Brouillon',
        ENVOYEE: 'Envoyée',
        PARTIELLEMENT_PAYEE: 'Part. payée',
        PAYEE: 'Payée',
        ANNULEE: 'Annulée',
        EN_RETARD: 'En retard',
      };
      return labels[statut] ?? statut;
    });
  }
}
