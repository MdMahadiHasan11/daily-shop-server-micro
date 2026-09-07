import { z } from "zod";

function parseLocalDate(dateStr: string, endOfDay = false) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  if (endOfDay) d.setHours(23, 59, 59, 999);
  else d.setHours(0, 0, 0, 0);
  return d;
}

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

export abstract class BaseValidator {
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
      d.setFullYear(d.getFullYear() - 1);
      return d.toISOString().slice(0, 10);
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

  static querySchema = z.object({
    sortBy: z.string().optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc").catch("desc"),
    search: z.string().optional(),
    startDate: this.startDate,
    endDate: this.endDate,
    page: this.page,
    limit: this.limit,
  });

  protected static pagination<T extends readonly string[]>(sortFields: T) {
    return createPaginationValidator(sortFields);
  }

  static paginationQuery = z.object({
    query: this.pagination([]),
  });

  static numberSchema = z.number().int().positive();
  static booleanSchema = z.boolean().default(false);
  static file = z.any();
  static urlSchema = z.string().url("Invalid URL").optional().or(z.literal(""));
}

export type IdParamsDto = z.infer<typeof BaseValidator.idParams>;
export type paginationQueryDto = z.infer<typeof BaseValidator.paginationQuery>;
export type QuerySchemaDto = z.infer<typeof BaseValidator.querySchema>;
