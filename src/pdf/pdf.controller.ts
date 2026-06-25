import { Controller, Post, Body, Res, Get, Param, StreamableFile, InternalServerErrorException } from '@nestjs/common';
import type { Response } from 'express';
import { PdfService } from './pdf.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller('pdf')
export class PdfController {
  // Define where we will save the temporary files on the server
  private readonly tempFolder = path.join(process.cwd(), 'temp-pdfs');

  constructor(private readonly pdfService: PdfService) {
    // This automatically creates the "temp-pdfs" folder when your server starts 
    // so it doesn't crash when trying to save the first file!
    if (!fs.existsSync(this.tempFolder)) {
      fs.mkdirSync(this.tempFolder, { recursive: true });
    }
  }

  // ------------------------------------------------------------------
  // ENDPOINT 1: THE GENERATOR (Takes 30-60 seconds)
  // Angular calls this in the background. It returns JSON, not a file.
  // ------------------------------------------------------------------
  @Post('export')
  async exportPdf(@Body() payload: { css: string, html: string }) {
    const pdfBuffer = await this.pdfService.generatePdf(payload.css, payload.html);

    // 2. Create a unique filename (e.g., report-1683459123.pdf)
    const fileName = `report-${Date.now()}-${Math.floor(Math.random() * 1000)}.pdf`;
    const filePath = path.join(this.tempFolder, fileName);

    // 3. Save the buffer directly to the server's hard drive
    fs.writeFileSync(filePath, pdfBuffer);

    // 4. Return a JSON object containing the URL to download it
    return {
      status: 'success',
      fileName: fileName,
      // This URL points to the GET endpoint we are creating below!
      downloadUrl: `http://localhost:3000/pdf/download/${fileName}`
    };
  }


  // ------------------------------------------------------------------
  // ENDPOINT 2: THE DOWNLOADER (Takes 1 millisecond)
  // The user physically clicks a link in Angular that hits this route.
  // ------------------------------------------------------------------
  @Get('download/:fileName')
  downloadFile(
    @Param('fileName') fileName: string,
    @Res({ passthrough: true }) res: Response
  ): StreamableFile {
    const filePath = path.join(this.tempFolder, fileName);

    // Security check: Make sure the file actually exists
    if (!fs.existsSync(filePath)) {
      throw new InternalServerErrorException('File not found. It may have expired.');
    }

    // Read the file from the hard drive
    const file = fs.createReadStream(filePath);

    // Set the headers so the browser knows to download it as a PDF
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });

    // Stream the file back to the browser instantly!
    return new StreamableFile(file);
  }
}