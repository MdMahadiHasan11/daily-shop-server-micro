
import { redisSubscriberService } from "../core/services/redis-subscriber.service";
import { logger } from "../core/utils/logger.utils";

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
}
