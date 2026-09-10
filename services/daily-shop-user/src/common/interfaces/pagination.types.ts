/**
 * Pagination request options
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Pagination response data
 */
export interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
export interface ListWithSummary<T> {
  summary: any;
  results: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Default pagination values
 */
export const DEFAULT_PAGINATION: Required<PaginationOptions> = {
  page: 1,
  limit: 10,
  search: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

/**
 * Calculates pagination parameters
 */
export function getPaginationParams(options?: PaginationOptions): {
  skip: number;
  take: number;
  orderBy: Record<string, "asc" | "desc">;
} {
  const {
    page = DEFAULT_PAGINATION.page,
    limit = DEFAULT_PAGINATION.limit,
    sortBy = DEFAULT_PAGINATION.sortBy,
    sortOrder = DEFAULT_PAGINATION.sortOrder,
  } = options || {};

  return {
    skip: (page - 1) * limit,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  };
}

/**
 * Builds pagination response
 */
export function buildPaginationResult<T>(
  data: T[],
  total: number,
  options?: PaginationOptions,
): PaginationResult<T> {
  const { page = DEFAULT_PAGINATION.page, limit = DEFAULT_PAGINATION.limit } =
    options || {};
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

interface PaginationMetaParams {
  total: number;
  page: number;
  limit: number;
}

interface PaginationMeta {
  total: number;
  limit: number;
  page: number;
  totalPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function buildPaginationMeta({
  total,
  page,
  limit,
}: PaginationMetaParams): PaginationMeta {
  const safeSize = limit > 0 ? limit : 1;
  const totalPage = Math.ceil(total / safeSize);

  return {
    total,
    page: +page,
    limit: +safeSize,
    totalPage,
    hasNextPage: page < totalPage,
    hasPrevPage: page > 1,
  };
}
