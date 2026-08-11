import puppeteer from 'puppeteer';
import ejs from 'ejs';
import path from 'path';
import { resolveCertificateLogoBase64 } from './certificateLogo.js';
function buildLaunchOptions() {
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH?.trim() ||
        process.env.CHROME_PATH?.trim() ||
        process.env.CHROMIUM_PATH?.trim() ||
        undefined;
    return {
        headless: true,
        ...(executablePath ? { executablePath } : {}),
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--font-render-hinting=none',
            '--disable-software-rasterizer',
        ],
    };
}
async function withBrowser(fn) {
    let browser = null;
    try {
        browser = await puppeteer.launch(buildLaunchOptions());
        return await fn(browser);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`PDF generation failed to launch Chromium/Chrome. ` +
            `Set PUPPETEER_EXECUTABLE_PATH to a system browser (e.g. /usr/bin/chromium) ` +
            `and install browser OS dependencies. Underlying error: ${message}`);
    }
    finally {
        if (browser) {
            await browser.close().catch(() => undefined);
        }
    }
}
export const generateCertificatePDF = async (data) => {
    const templatePath = path.join(process.cwd(), 'views', 'certificate.ejs');
    const htmlContent = await ejs.renderFile(templatePath, {
        ...data,
        logoBase64: data.logoBase64 || (await resolveCertificateLogoBase64()),
    });
    return withBrowser(async (browser) => {
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: true,
            printBackground: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
        });
        return Buffer.from(pdfBuffer);
    });
};
export const generateEvaluationReportPDF = async (data) => {
    const templatePath = path.join(process.cwd(), 'views', 'evaluation_report.ejs');
    const htmlContent = await ejs.renderFile(templatePath, {
        ...data,
        logoBase64: await resolveCertificateLogoBase64(),
    });
    return withBrowser(async (browser) => {
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: false,
            printBackground: true,
            margin: { top: '1.5cm', right: '1.5cm', bottom: '1.5cm', left: '1.5cm' },
        });
        return Buffer.from(pdfBuffer);
    });
};
//# sourceMappingURL=pdfGenerator.js.map