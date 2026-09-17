import twilio from "twilio";
import { env } from "../../core/config/env.config";

class SmsSenderUtil {
  private client: ReturnType<typeof twilio> | null = null;

  constructor() {
    if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
      this.client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    }
  }

  public async sendSms(to: string, message: string): Promise<void> {
    let smsSent = false;

    if (this.client && env.TWILIO_PHONE_NUMBER) {
      try {
        await this.client.messages.create({
          body: message,
          from: env.TWILIO_PHONE_NUMBER,
          to: to,
        });
        smsSent = true;
        console.log("✅ SMS sent successfully via Twilio");
      } catch (error: any) {
        console.warn(
          "⚠️ Twilio failed (Trial/Limit error), falling back to Telegram:",
          error.message,
        );
      }
    }

    if (!smsSent && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
      try {
        const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: env.TELEGRAM_CHAT_ID,
            text: `🔔 *Daily Shop Notification*\n📱 To: ${to}\n\n💬 ${message}`,
            parse_mode: "Markdown",
          }),
        });

        const result = await response.json();
        if (result.ok) {
          console.log(
            "✅ OTP Notification sent successfully via Telegram Bot!",
          );
        } else {
          console.error("❌ Telegram API Error:", result);
        }
      } catch (tgError: any) {
        console.error("❌ Failed to send Telegram message:", tgError.message);
      }
    }
  }
}

export const smsSender = new SmsSenderUtil();
