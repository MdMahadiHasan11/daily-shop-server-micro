import { Env } from "@/core/config/env.config";
import { z } from "zod";

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Env {}
  }

  namespace Express {
    interface Request {
      validatedBody?: any;
      user?: IUser;
    }
  }

  // Common Utility Types
  type Nullable<T> = T | null;
  type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
}

export type ZodValidatedRequest<T extends z.ZodSchema> = Express.Request & {
  validatedBody: z.infer<T>;
};

export {};
