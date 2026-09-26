import { redisSubscriberService } from "../core/services/redis-subscriber.service";

interface LoginInitiate {
  name?: string;
  email?: string;
  phone?: string;
  otp: string;
  expiryMinutes: number;
}

export async function bootstrapListeners(): Promise<void> {
  await redisSubscriberService.start();
}
