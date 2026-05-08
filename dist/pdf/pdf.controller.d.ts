import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { PdfService } from './pdf.service';
export declare class PdfController {
    private readonly pdfService;
    private readonly tempFolder;
    constructor(pdfService: PdfService);
    exportPdf(payload: {
        css: string;
        html: string;
    }): Promise<{
        status: string;
        fileName: string;
        downloadUrl: string;
    }>;
    downloadFile(fileName: string, res: Response): StreamableFile;
}
