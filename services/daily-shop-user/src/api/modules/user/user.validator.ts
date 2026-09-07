import { z } from "zod";
import { BaseValidator } from "../../../core/base/base.validator";

export class UserValidators extends BaseValidator {
  static listUsers = z.object({
    query: this.pagination([
      "firstName",
      "lastName",
      "email",
      "phoneNumber",
    ]).safeExtend({
      isDeleted: z
        .string()
        .transform((val) => val === "true")
        .default(false),
      searchIn: z
        .string()
        .transform((val) => val.split(","))
        .default(["firstName", "lastName", "email", "phoneNumber"]),
    }),
  });
}

export type UserListQuery = z.infer<typeof UserValidators.listUsers>;
