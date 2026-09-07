import { Gender } from "@prisma/client";
import { z } from "zod";
import { BaseValidator } from "../../../core/base/base.validator";

export class UserValidators extends BaseValidator {
  static listUsers = z.object({
    query: this.pagination(["email", "phoneNumber"]).safeExtend({
      isDeleted: z
        .string()
        .transform((val) => val === "true")
        .default(false),
      searchIn: z
        .string()
        .transform((val) => val.split(","))
        .default(["email", "phoneNumber"]),
    }),
  });
  static getMeSchema = z.object({
    query: z.object({
      include: z.enum(["location", "locations"]).optional(),
    }),
  });

  static updateFullProfile = z.object({
    body: z.object({
      image: z.string().url("Invalid image URL").optional(),
      email: z.string().email("Invalid email format").optional(),
      phoneNumber: z.string().optional(),
      profile: z
        .object({
          firstName: z.string().min(1).optional(),
          lastName: z.string().min(1).optional(),
          gender: z.nativeEnum(Gender).optional(),
          dateOfBirth: z.string().datetime().optional(),
          bio: z.string().optional(),
        })
        .optional(),
      addresses: z
        .array(
          z.object({
            id: z.string().optional(),
            fullName: z.string().min(1, "Full name is required").optional(),
            phoneNumber: z
              .string()
              .min(1, "Phone number is required")
              .optional(),
            addressLine: z
              .string()
              .min(1, "Address line is required")
              .optional(),
            city: z.string().min(1, "City is required").optional(),
            area: z.string().optional(),
            postalCode: z.string().optional(),
            country: z.string().optional(),
            isDefault: z.boolean().optional(),
            isDeleted: z.boolean().optional(),
          }),
        )
        .optional(),
    }),
  });
}

export type UserListQuery = z.infer<typeof UserValidators.listUsers>;
export type GetMeQuery = z.infer<typeof UserValidators.getMeSchema>;
