import { EmailService } from "../api/modules/email/email.service";
import { SmsService } from "../api/modules/phone/sms.service";
import { eventBus } from "../core/services/event-bus-rabit.service";
import { redisSubscriberService } from "../core/services/redis-subscriber.service";
import { logger } from "../core/utils/logger.utils";
import { EVENTS, EventType } from "./event.constants";

interface LoginInitiate {
  name?: string;
  email?: string;
  phone?: string;
  otp: string;
  expirySeconds: number;
}

export async function bootstrapListeners(): Promise<void> {
  await redisSubscriberService.start();

  await eventBus.subscribe(
    EVENTS.LOGIN_INITIATE,
    async (event: EventType<any>) => {
      try {
        const { name, phone, email, otp, expirySeconds } =
          event?.payload?.payload || event?.payload || event;

        const expiryMinutes = Math.ceil(expirySeconds / 60);
        const userName = name || "User";
        const templatePayload = {
          name: userName,
          otp: otp,
          expiryMinutes: expiryMinutes,
        };

        if (email) {
          const emailService = new EmailService();
          await emailService.sendEmail({
            to: email,
            templateName: "OTP_VERIFICATION",
            payload: templatePayload,
          });
          logger.info(
            { email, otp },
            "Login OTP email sent successfully via event 🚀",
          );
        }

        if (phone) {
          const smsService = new SmsService();
          await smsService.sendMessage({
            to: phone,
            templateName: "OTP_VERIFICATION_SMS",
            payload: templatePayload,
          });
          logger.info(
            { phone, otp },
            "Login OTP SMS sent successfully via event 📱",
          );
        }

        if (!email && !phone) {
          logger.warn(
            "Neither email nor phone provided in login initiate event.",
          );
        }
      } catch (error) {
        logger.error(
          { error },
          "Failed to process login OTP notification from queue ❌",
        );
      }
    },
    "notification_service_group",
  );
}
