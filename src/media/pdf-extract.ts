/**
 * Simple PDF text extraction using pdf-parse.
 * This replaces the complex pdfjs-dist approach that had worker issues in Node.js.
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfParseModule = (await import("pdf-parse")) as any;
  const pdfParse = pdfParseModule.default || pdfParseModule;
  const result = await pdfParse(buffer);
  return result.text || "";
}

export type PdfExtractedImage = {
  type: "image";
  data: string;
  mimeType: string;
};

export type PdfExtractedContent = {
  text: string;
  images: PdfExtractedImage[];
};

export async function extractPdfContent(params: {
  buffer: Buffer;
  maxPages: number;
  maxPixels: number;
  minTextChars: number;
  pageNumbers?: number[];
  onImageExtractionError?: (error: unknown) => void;
}): Promise<PdfExtractedContent> {
  // Use simple pdf-parse for text extraction - no worker issues
  const text = await extractPdfText(params.buffer);
  return { text, images: [] };
}
