import { Request, Response } from "express";

type IApiResponse<T> = {
  statusCode?: number;
  success: boolean;
  message?: string | null;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
  data?: T | null;
};

const sendResponse = <T>(
  _req: Request,
  res: Response,
  data: IApiResponse<T>
): void => {
  const responseData: IApiResponse<T> = {
    statusCode: data.statusCode || 200,
    success: data.success,
    message: data.message,
    meta: data.meta || null || undefined,
    data: data.data || null || undefined,
  };
  res.status(data.statusCode || 200).send(responseData);
};

export default sendResponse;

type ZodIssue = {
  code: string;
  path: (string | number)[];
  message: string;
  values?: any[];
};

export function humanizeZodErrors(nestedIssues: ZodIssue[][]) {
  const issues = nestedIssues?.flat(); // flatten nested arrays

  return issues?.map((issue) => {
    const field = issue.path.length > 0 ? issue.path.join(".") : "value";

    if (issue.code === "invalid_enum_value" || issue.code === "invalid_value") {
      return `${field}: must be one of [${issue.values?.join(", ")}]`;
    }

    return `${field}: ${issue.message}`;
  });
}
