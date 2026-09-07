import { UserService } from "../api/modules/user/user.service";
import { eventBus } from "../core/services/event-bus-rabit.service";
import { redisSubscriberService } from "../core/services/redis-subscriber.service";
import { logger } from "../core/utils/logger.utils";
import { IMetaData } from "../core/utils/request-metadata";
import { EVENTS, EventType } from "./event.constants";

interface LoginInitiate {
  name?: string;
  email?: string;
  phone?: string;
  otp: string;
  expiryMinutes: number;
}

export async function bootstrapListeners(): Promise<void> {
  // 2. Register OTP Expiration Event Handler
  redisSubscriberService.onKeyExpired("otp", (fullKey, keyParts) => {
    // Expected key format: otp:<identifier>
    const identifier = keyParts;
    logger.info(`redis key expired: ${fullKey}`);
  });

  redisSubscriberService.onKeyExpired("forgot", (fullKey, keyParts) => {
    const email = keyParts[1];
    logger.info(
      `[Auth Listener] Password reset token/OTP expired for email: ${email}`,
    );
  });

  await redisSubscriberService.start();

  // 2. ✅ RabbitMQ EventBus Subscriptions (Example Setup)
  await eventBus.subscribe(
    EVENTS.LOGIN_INITIATE,
    async (event: EventType<LoginInitiate>) => {
      const { name, phone, email, otp, expiryMinutes } = event.payload;
      const identifier = phone ? phone : email;
      logger.info({ otp: event.payload }, `OTP send`);
    },
    "user_service_group",
  );

  await eventBus.subscribe(
    EVENTS.AFTER_LOGIN_USER_CREATE,
    async (event: any) => {
      try {
        const rawData = event?.payload?.payload || event?.payload || event;

        const authId = rawData?.authId || rawData?.id;
        const phoneNumber = rawData?.phoneNumber;
        const email = rawData?.email;

        if (!authId) {
          logger.error(
            "Auth ID is still missing! Publisher did not send it correctly.",
          );
          return;
        }

        const metaData: IMetaData = {
          authId: authId,
          email: email || null,
          phoneNumber: phoneNumber || null,
        };
        const userService = new UserService();
        await userService.createUsers(metaData);

        logger.info(
          { authId },
          "User profile created successfully via event 🚀",
        );
      } catch (error) {
        logger.error(
          { error },
          "Failed to create user profile from event queue ❌",
        );
      }
    },
    "user_service_group",
  );
}
