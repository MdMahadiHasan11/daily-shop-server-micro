import handlebars from "handlebars";
import nodemailer, { SendMailOptions, Transporter } from "nodemailer";
import puppeteer from "puppeteer";
import { env } from "../../core/config/env.config";

class EmailSenderUtil {
  private transporter: Transporter;

  constructor() {
    this.registerHelpers();
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.SMTP_EMAIL,
        pass: env.SMTP_PASS,
      },
    });
  }

  private registerHelpers() {
    handlebars.registerHelper("formatNumber", (value) => {
      if (value == null) return "";
      const num = Number(value);
      return isNaN(num) ? value : num.toLocaleString("en-US");
    });
    handlebars.registerHelper("subtract", (a, b) => a - b);
  }

  public compileTemplate(
    templateString: string,
    data: Record<string, any>,
  ): string {
    const template = handlebars.compile(templateString);
    return template(data);
  }

  public async generatePdfFromHtml(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" as any });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", bottom: "20px", left: "10px", right: "10px" },
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
  }

  public async sendMail(mailOptions: SendMailOptions): Promise<void> {
    await this.transporter.sendMail(mailOptions);
  }
}

export const emailSender = new EmailSenderUtil();
