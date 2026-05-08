import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  async generatePdf(css: string, htmlContent: string): Promise<Buffer> {
    let browser: puppeteer.Browser | null = null;

    try {
      this.logger.log('Launching browser for single-pass generation...');
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();

      // 1. Construct the HTML
      // Notice the <base> tag! Change the href to your production URL when you deploy.
      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <base href="http://localhost:4200/"> 
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
              ${css}
            </style>
          </head>
          <body>${htmlContent}</body>
        </html>
      `;

      // 2. Load the HTML into the browser
      await page.setContent(fullHtml, { waitUntil: 'domcontentloaded', timeout: 0 });

      // 3. The Asset Waiter + Lazy Loading Stripper
      this.logger.log('Waiting for fonts and images to load...');
      await page.evaluate(async () => {
        // Force all lazy-loaded images to load immediately
        const images = Array.from(document.querySelectorAll('img'));
        images.forEach(img => img.removeAttribute('loading'));

        // Wait for Google Fonts
        await document.fonts.ready;

        // Wait for all images to finish downloading
        const imagePromises = images.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.addEventListener('load', resolve);
            img.addEventListener('error', resolve);
          });
        });

        await Promise.all(imagePromises);
      });

      // 4. Generate the final multiple-page PDF in one shot
      this.logger.log('Rendering multiple pages... this might take 30-60 seconds...');
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        timeout: 0,
        margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
      });

      return Buffer.from(pdfBuffer);

    } catch (error) {
      this.logger.error('Failed to generate PDF', error);
      throw new InternalServerErrorException('Failed to generate PDF document');
    } finally {
      if (browser) await browser.close();
    }
  }
}