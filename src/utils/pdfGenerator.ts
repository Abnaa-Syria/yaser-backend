import puppeteer from 'puppeteer';
import ejs from 'ejs';
import path from 'path';
import { resolveCertificateLogoBase64 } from './certificateLogo.js';

interface CertificateData {
  studentName: string;
  courseName: string;
  date: string;
  serialNumber: string;
  logoBase64?: string;
}

export const generateCertificatePDF = async (data: CertificateData): Promise<Buffer> => {
  const templatePath = path.join(process.cwd(), 'views', 'certificate.ejs');
  const htmlContent = await ejs.renderFile(templatePath, {
    ...data,
    logoBase64: data.logoBase64 || resolveCertificateLogoBase64(),
  });

  // 2. Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // Crucial for production servers
  });

  const page = await browser.newPage();
  
  // 3. Set content and wait for fonts to load
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  // 4. Generate PDF as a Buffer
  const pdfBuffer = await page.pdf({
    format: 'A4',
    landscape: true,
    printBackground: true, 
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  await browser.close();
  
  return Buffer.from(pdfBuffer);
};

export interface EvaluationReportData {
  title: string;
  subtitle: string;
  overallRating: number;
  totalResponses: number;
  distribution: Record<number, number>;
  questionBreakdown: Array<{
    question: string;
    avgRating: number;
    responses: number;
  }>;
}

export const generateEvaluationReportPDF = async (data: EvaluationReportData): Promise<Buffer> => {
  const templatePath = path.join(process.cwd(), 'views', 'evaluation_report.ejs');
  const htmlContent = await ejs.renderFile(templatePath, {
    ...data,
    logoBase64: resolveCertificateLogoBase64(),
  });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    landscape: false,
    printBackground: true,
    margin: { top: '1.5cm', right: '1.5cm', bottom: '1.5cm', left: '1.5cm' }
  });

  await browser.close();
  
  return Buffer.from(pdfBuffer);
};