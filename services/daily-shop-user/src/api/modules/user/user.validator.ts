import { z } from "zod";
import { BaseValidator } from "../../../core/base/base.validator";

export class UserValidators extends BaseValidator {
  private static userSchema = z.object({
    firstName: z
      .string()
      .trim()
      .min(3, "First name must be at least 3 characters")
      .optional()
      .or(z.literal("")),
    lastName: z
      .string()
      .trim()
      .min(3, "Last name must be at least 3 characters")
      .optional()
      .or(z.literal("")),
    genderId: z.coerce.number().default(0).optional(),
    dateOfBirth: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: "Invalid date format for date of birth",
      }),
    bio: z
      .string()
      .max(255, "Bio cannot exceed 255 characters")
      .optional()
      .or(z.literal("")),
    image: z.string().optional(),
  });

  // User validators
  static createUser = z.object({
    body: this.userSchema,
  });

  static updateUser = z.object({
    body: this.userSchema.partial(),
  });

  static listUsers = z.object({
    query: this.pagination(["firstName", "lastName", "email"]).safeExtend({
      isDeleted: z
        .string()
        .transform((val) => val === "true")
        .default(false),
      searchIn: z
        .string()
        .transform((val) => val.split(","))
        .default(["firstName", "lastName", "email"]),
    }),
  });

  static getUserById = z.object({
    params: z.object({
      id: z.string(),
    }),
  });
}

// Infer TypeScript type from Zod schema
export type CreateUserBody = z.infer<typeof UserValidators.createUser>;
export type UpdateUserBody = z.infer<typeof UserValidators.updateUser>;
export type UserListQuery = z.infer<typeof UserValidators.listUsers>;
