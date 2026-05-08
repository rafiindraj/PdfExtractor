"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var PdfService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfService = void 0;
const common_1 = require("@nestjs/common");
const puppeteer = __importStar(require("puppeteer"));
let PdfService = PdfService_1 = class PdfService {
    logger = new common_1.Logger(PdfService_1.name);
    async generatePdf(css, htmlContent) {
        let browser = null;
        try {
            this.logger.log('Launching browser for single-pass generation...');
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });
            const page = await browser.newPage();
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
            await page.setContent(fullHtml, { waitUntil: 'domcontentloaded', timeout: 0 });
            this.logger.log('Waiting for fonts and images to load...');
            await page.evaluate(async () => {
                const images = Array.from(document.querySelectorAll('img'));
                images.forEach(img => img.removeAttribute('loading'));
                await document.fonts.ready;
                const imagePromises = images.map(img => {
                    if (img.complete)
                        return Promise.resolve();
                    return new Promise((resolve) => {
                        img.addEventListener('load', resolve);
                        img.addEventListener('error', resolve);
                    });
                });
                await Promise.all(imagePromises);
            });
            this.logger.log('Rendering multiple pages... this might take 30-60 seconds...');
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                timeout: 0,
                margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
            });
            return Buffer.from(pdfBuffer);
        }
        catch (error) {
            this.logger.error('Failed to generate PDF', error);
            throw new common_1.InternalServerErrorException('Failed to generate PDF document');
        }
        finally {
            if (browser)
                await browser.close();
        }
    }
};
exports.PdfService = PdfService;
exports.PdfService = PdfService = PdfService_1 = __decorate([
    (0, common_1.Injectable)()
], PdfService);
//# sourceMappingURL=pdf.service.js.map