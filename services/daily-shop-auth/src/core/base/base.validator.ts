import { z } from "zod";

function parseLocalDate(dateStr: string, endOfDay = false) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  if (endOfDay) d.setHours(23, 59, 59, 999);
  else d.setHours(0, 0, 0, 0);
  return d;
}

export const dateRangeSchema = z
  .object({
    startDate: z.coerce
      .date()
      .transform((val) => (val ? new Date(val) : undefined)),
    endDate: z.coerce
      .date()
      .transform((val) => (val ? new Date(val) : undefined)),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    {
      message: "End date must be after or equal to start date",
      path: ["endDate"],
    },
  );

export const createPaginationValidator = <T extends readonly string[]>(
  allowedSortFields: T,
) => {
  const baseSchema = z.object({
    page: z
      .string()
      .transform(Number)
      .pipe(z.number().positive().min(1).max(500))
      .default(1)
      .catch(1),

    limit: z
      .string()
      .transform(Number)
      .pipe(z.number().positive().min(1).max(2500))
      .default(10)
      .catch(50),

    sortBy: z.enum(allowedSortFields).optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc").catch("desc"),
    search: z.string().optional(),
  });

  return baseSchema;
};

type BaseValidatorOptions = {
  minPasswordLength?: number;
  maxNameLength?: number;
};

export abstract class BaseValidator {
  // *---------common---------* \\

  static coerceNumber = <T extends z.ZodTypeAny>(schema: T) =>
    z.preprocess((v) => {
      if (typeof v === "string") {
        const t = v.trim();
        if (t === "") return v; // let further validation handle empty if needed
        const n = Number(t);
        return Number.isFinite(n) ? n : v;
      }
      return v;
    }, schema);

  static optionalStringAllowEmpty = z.preprocess((v) => {
    if (typeof v === "string") {
      const t = v.trim();
      return t === "" ? undefined : t;
    }
    return v;
  }, z.string().optional());

  static string = z.string();

  static idSchema = z.object({
    id: this.string,
  });
  static idParams = z.object({
    params: this.idSchema,
  });

  static dateSchema = z.string().transform((val) => new Date(val));
  static startDate = z
    .string()
    .default(() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 1); // ⬅️ 1 year previous
      return d.toISOString().slice(0, 10); // YYYY-MM-DD
    })
    .transform((val) => parseLocalDate(val));

  static endDate = z
    .string()
    .default(() => new Date().toISOString().slice(0, 10))
    .transform((val) => parseLocalDate(val, true));

  static page = z
    .string()
    .transform(Number)
    .pipe(z.number().positive().min(1).max(100))
    .default(1)
    .catch(1);

  static limit = z
    .string()
    .transform(Number)
    .pipe(z.number().positive().min(1).max(2500))
    .default(50)
    .catch(50);

  // * pagination schema
  static querySchema = z.object({
    sortBy: z.string().optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc").catch("desc"),
    search: z.string().optional(),
    startDate: this.startDate,
    endDate: this.endDate,
    page: this.page,
    limit: this.limit,
  });

  private static options: BaseValidatorOptions = {
    minPasswordLength: 8,
    maxNameLength: 100,
  };

  static configure(options: BaseValidatorOptions) {
    this.options = { ...this.options, ...options };
  }

  protected static readonly email = z.string().email("Invalid email format");

  protected static get password() {
    return z
      .string()
      .min(
        this.options.minPasswordLength!,
        `Password must be at least ${this.options.minPasswordLength} characters`,
      );
  }

  protected static get nameSchema() {
    return z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(this.options.maxNameLength!);
  }

  //   protected static readonly userType = z.nativeEnum(UserTypeEnum);

  protected static pagination<T extends readonly string[]>(sortFields: T) {
    return createPaginationValidator(sortFields);
  }

  // * 2025-08-31
  static dateRangeSchema = {
    startDate: this.startDate,
    endDate: this.endDate,
  };

  static paginationQuery = z.object({
    query: this.pagination([]),
  });

  /** Helpers */
  protected static toDate = z.preprocess((val) => {
    if (val instanceof Date) return val;
    if (typeof val === "string" || typeof val === "number") {
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d;
    }
    return val;
  }, z.date());

  protected static decimalString = z.preprocess(
    (val) => {
      if (typeof val === "number") return val.toString();
      if (typeof val === "string") return val.trim();
      return val;
    },
    z.string().regex(/^-?\d+(\.\d+)?$/, "Invalid decimal number"),
  );

  // * ------------ common ----------------

  // --- Base schemas for common patterns ---

  static companyIdSchema = z.string().cuid();
  static optionalStringSchema = z
    .string()
    .min(1)
    .max(500, "Terms too long")
    .optional();
  static requiredStringSchema = z.string().min(1, "Required");
  static numberSchema = z.number().int().positive();
  static booleanSchema = z.boolean().default(false);
  static file = z.any();
  static urlSchema = z.string().url("Invalid URL").optional().or(z.literal(""));
  static dateFormatSchema = z
    .string()
    .regex(/^(MM\/DD\/YYYY|DD\/MM\/YYYY|YYYY-MM-DD)$/, "Invalid date format");
  static numberFormatSchema = z
    .string()
    .regex(/^(1,000\.00|1\.000,00|1'000\.00)$/, "Invalid number format");
  static currencyCodeSchema = z
    .string()
    .length(3, "Currency code must be 3 characters");
  static documentPrefixSchema = z
    .string()
    .max(10, "Prefix too long")
    .optional();
}

// @Types
export type DateRangeInput = z.input<typeof dateRangeSchema>;
export type IdParamsDto = z.infer<typeof BaseValidator.idParams>;
export type paginationQueryDto = z.infer<typeof BaseValidator.paginationQuery>;
export type QuerySchemaDto = z.infer<typeof BaseValidator.querySchema>;
