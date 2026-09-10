import { Env } from "@/core/config/env.config";
import { UserRole } from "@prisma/client";
import { z } from "zod";

export interface IUser {
  id: string;
  role: UserRole;
  email: string | null;
  phone: string | null;
  jti: string | null;
}

// ==========================================
// Global Type Extensions
// ==========================================

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

// Strictly Typed Request for Zod Middlewares
export type ZodValidatedRequest<T extends z.ZodSchema> = Express.Request & {
  validatedBody: z.infer<T>;
};

export {};
