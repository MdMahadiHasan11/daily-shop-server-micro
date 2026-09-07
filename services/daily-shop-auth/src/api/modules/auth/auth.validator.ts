import { z } from "zod";
import { BaseValidator } from "../../../core/base/base.validator";
const phoneRegex = /^(?:\+?880|0)?1[3-9]\d{8}$/;
export class AuthValidators extends BaseValidator {
  static login = z.object({
    body: z
      .object({
        phone: z
          .string()
          .min(10, "Phone number must be at least 10 digits")
          .regex(phoneRegex, "Invalid phone number format")
          .optional()
          .or(z.literal("")),

        email: z
          .string()
          .email("Invalid email format")
          .optional()
          .or(z.literal("")),

        password: z
          .string()
          .min(6, "Password must be at least 6 characters")
          .optional(),
      })
      .refine(
        (data) => {
          const hasValidPhone = data.phone && phoneRegex.test(data.phone);
          const hasValidEmail =
            data.email && z.string().email().safeParse(data.email).success;
          return hasValidPhone || hasValidEmail;
        },
        {
          message: "At least one valid phone number or email must be provided",
          path: ["phone"],
        },
      ),
  });

  static verify = z.object({
    body: z
      .object({
        phone: z.string().optional(),
        email: z.string().email("Invalid email format").optional(),
        otp: z.string().min(6, "OTP must be at least 6 characters"),
      })
      .refine((data) => data.phone || data.email, {
        message: "At least one of phone or email must be provided",
        path: ["phone"],
      }),
  });
}

// @Types
export type LoginDto = z.infer<typeof AuthValidators.login>;
