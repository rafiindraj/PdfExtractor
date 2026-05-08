export declare class PdfService {
    private readonly logger;
    generatePdf(css: string, htmlContent: string): Promise<Buffer>;
}
