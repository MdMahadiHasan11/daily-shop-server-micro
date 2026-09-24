import { Prisma, PrismaClient } from "@prisma/client";
import { buildSearchWhere } from "../../api/utils/build-where";
import {
  ListWithSummary,
  PaginationResult,
} from "../../common/interfaces/pagination.types";
import db from "../lib/prisma";
import { microserviceClient } from "../services/axios.service";
import { eventBus } from "../services/event-bus-rabit.service";
import { redisService } from "../services/redis.service";

function setNestedDateFilter(
  obj: any,
  path: string[],
  filter: Record<string, any>,
) {
  const key = path[0];

  if (path.length === 1) {
    obj[key] = {
      ...(obj[key] || {}),
      ...filter,
    };
  } else {
    obj[key] = obj[key] || {};
    setNestedDateFilter(obj[key], path.slice(1), filter);
  }
}

export abstract class BaseRepository<T extends keyof PrismaClient> {
  protected prisma: PrismaClient;
  protected modelName: T;
  //   protected redis: typeof db.redis;
  protected service = microserviceClient;
  protected readonly eventBus = eventBus;
  protected readonly cache = redisService;

  constructor(modelName: T) {
    this.prisma = db.prisma;
    this.modelName = modelName;
    // this.redis = db.redis;
  }

  protected get model() {
    return this.prisma[this.modelName];
  }

  // Basic CRUD Operations

  async create<U>(
    data: Prisma.Args<PrismaClient[T], "create">["data"],
    options?: {
      include?: Prisma.Args<PrismaClient[T], "create">["include"];
      select?: Prisma.Args<PrismaClient[T], "create">["select"];
    },
    tx?: Prisma.TransactionClient,
  ): Promise<U> {
    return db.withRetry(async () => {
      const createPrisma = tx ?? this.prisma;
      // @ts-ignore - Dynamic model access
      const result = await createPrisma[this.modelName].create({
        data,
        ...options,
      });
      return result as U;
    });
  }

  async findById<U = any>(
    id: string | number,
    options?: {
      include?: Prisma.Args<PrismaClient[T], "findUnique">["include"];
      select?: Prisma.Args<PrismaClient[T], "findUnique">["select"];
      deleted?: boolean;
    },
  ): Promise<U | null> {
    const where: any = {
      id,
    };
    delete options?.deleted;
    return db.withRetry(async () => {
      // @ts-ignore - Dynamic model access
      return this.prisma[this.modelName].findFirst({
        where,
        ...options,
      });
    });
  }

  async findOne<U>(
    where: Prisma.Args<PrismaClient[T], "findFirst">["where"],
    options?: {
      include?: Prisma.Args<PrismaClient[T], "findFirst">["include"];
      select?: Prisma.Args<PrismaClient[T], "findFirst">["select"];
    },
  ): Promise<U | null> {
    return db.withRetry(async () => {
      // @ts-ignore - Dynamic model access
      return this.prisma[this.modelName].findFirst({
        where,
        ...options,
      });
    });
  }

  async findAll<U>(params?: {
    where?: Prisma.Args<PrismaClient[T], "findMany">["where"];
    orderBy?: Prisma.Args<PrismaClient[T], "findMany">["orderBy"];
    skip?: Prisma.Args<PrismaClient[T], "findMany">["skip"];
    take?: Prisma.Args<PrismaClient[T], "findMany">["take"];
    include?: Prisma.Args<PrismaClient[T], "findMany">["include"];
    select?: Prisma.Args<PrismaClient[T], "findMany">["select"];
  }): Promise<U[]> {
    return db.withRetry(async () => {
      // @ts-ignore - Dynamic model access

      return this.prisma[this.modelName].findMany({
        // ...(params?.where && { where: params.where }),
        ...params,
      });
    });
  }

  async update<U>(
    id: string | number,
    data: Prisma.Args<PrismaClient[T], "update">["data"],
    options?: {
      include?: Prisma.Args<PrismaClient[T], "update">["include"];
      select?: Prisma.Args<PrismaClient[T], "update">["select"];
    },
  ): Promise<U> {
    return db.withRetry(async () => {
      // @ts-ignore - Dynamic model access
      return this.prisma[this.modelName].update({
        where: { id },
        data,
        ...options,
      });
    });
  }

  // * hard delete
  async hardDelete<U = any>(
    id: string | number,
    options?: {
      include?: Prisma.Args<PrismaClient[T], "delete">["include"];
      select?: Prisma.Args<PrismaClient[T], "delete">["select"];
    },
  ): Promise<U> {
    return await db.withRetry(async () => {
      // @ts-ignore - Dynamic model access
      return await this.prisma[this.modelName].delete({
        where: { id },
        ...options,
      });
    });
  }

  // * soft delete
  async softDelete<U = any>(
    id: string | number,
    options?: {
      include?: Prisma.Args<PrismaClient[T], "update">["include"];
      select?: Prisma.Args<PrismaClient[T], "update">["select"];
    },
  ): Promise<U> {
    return await db.withRetry(async () => {
      // @ts-ignore - Dynamic model access
      return await this.prisma[this.modelName].update({
        where: { id },
        data: { isDeleted: true },
        ...options,
      });
    });
  }
  // * Recover soft deleted record
  async recover<T = any>(
    id: string | number,
    companyId: string | number,
  ): Promise<T> {
    return await db.withRetry(async () => {
      // @ts-ignore - Dynamic model access
      return await this.prisma[this.modelName].update({
        where: { id, companyId },
        data: { isDeleted: false },
      });
    });
  }

  // Pagination

  async paginate<U>(
    params: {
      where?: Prisma.Args<PrismaClient[T], "findMany">["where"];
      orderBy?: Prisma.Args<PrismaClient[T], "findMany">["orderBy"];
      include?: Prisma.Args<PrismaClient[T], "findMany">["include"];
      select?: Prisma.Args<PrismaClient[T], "findMany">["select"];
    } = {},
    inPage: number,
    inLimit: number,
  ): Promise<PaginationResult<U>> {
    const page = inPage || 1;
    const limit = inLimit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.findAll<U>({
        ...params,
        skip,
        take: limit,
      }),
      this.count(params.where),
    ]);

    const totalPages = Math.ceil(total / limit);

    const pagination = {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    return {
      data,
      pagination,
    };
  }

  async getList<U>(
    query: any,
    params: {
      include?: Prisma.Args<PrismaClient[T], "findMany">["include"];
      select?: Prisma.Args<PrismaClient[T], "findMany">["select"];
      where?: Prisma.Args<PrismaClient[T], "findMany">["where"];
      metaData?: {
        companyId?: string;
      };
    } = {},
  ): Promise<PaginationResult<U>> {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      searchIn = [],
      search = "",
      dateFilterBy = null,
      startDate = null,
      endDate = null,
      fields = [],
      ...restFilters
    } = query;

    const skip = (page - 1) * limit;

    // order by
    const orderBy = {
      [sortBy]: sortOrder,
    };

    // where condition
    if (params.metaData?.companyId) {
      params.where = {
        companyId: params.metaData.companyId,
        isDeleted: false,
        ...params.where,
      };
    } else {
      params.where = {
        isDeleted: false,
        ...params.where,
      };
    }

    // merge search if provided
    if (search) {
      buildSearchWhere(params.where, searchIn, search);
    }

    // merge normal filters
    for (const key in restFilters) {
      if (Object.prototype.hasOwnProperty.call(restFilters, key)) {
        params.where[key] = restFilters[key];
      }
    }

    if (dateFilterBy) {
      const filter: Record<string, any> = {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {}),
      };

      if (Object.keys(filter).length > 0) {
        const path = dateFilterBy.split(".");
        setNestedDateFilter(params.where, path, filter);
      }
    }

    const [data, total] = await Promise.all([
      this.findAll<U>({
        where: params.where,
        select: params.select,
        include: params.include,
        skip,
        take: limit,
        orderBy,
      }),
      this.count(params.where),
    ]);

    const totalPages = Math.ceil(total / limit);

    const pagination = {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    return {
      data,
      pagination,
    };
  }

  // * Get list with summary
  async getListWithSummary<U>(
    query: any,
    params: {
      include?: Prisma.Args<PrismaClient[T], "findMany">["include"];
      select?: Prisma.Args<PrismaClient[T], "findMany">["select"];
      where?: Prisma.Args<PrismaClient[T], "findMany">["where"];
      summary?: Prisma.Args<PrismaClient[T], "findMany">["select"];
    } = {},
  ): Promise<ListWithSummary<U>> {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      searchIn = [],
      search = "",
      dateFilterBy = null,
      startDate = null,
      endDate = null,
      fields = [],
      ...restFilters
    } = query;

    const skip = (page - 1) * limit;

    // order by
    const orderBy = {
      [sortBy]: sortOrder,
    };

    // ensure where exists
    params.where = params.where ?? {};

    // merge search if provided
    if (search) {
      buildSearchWhere(params.where, searchIn, search);
    }

    // merge normal filters
    for (const key in restFilters) {
      if (Object.prototype.hasOwnProperty.call(restFilters, key)) {
        params.where[key] = restFilters[key];
      }
    }

    if (dateFilterBy) {
      const filter: Record<string, any> = {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {}),
      };

      if (Object.keys(filter).length > 0) {
        const path = dateFilterBy.split(".");
        setNestedDateFilter(params.where, path, filter);
      }
    }

    const [summary, results, total] = await Promise.all([
      this.summary(params.summary, params.where),
      this.findAll<U>({
        select: params.select,
        include: params.include,
        where: params.where,
        skip,
        take: limit,
        orderBy,
      }),
      this.count(params.where),
    ]);

    const totalPages = Math.ceil(total / limit);

    const pagination = {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    return {
      summary,
      results,
      pagination,
    };
  }

  async summary(
    summary?: Prisma.Args<PrismaClient[T], "findMany">["select"],
    where?: Prisma.Args<PrismaClient[T], "count">["where"],
  ) {
    const prismaModel = this.prisma[this.modelName] as any;

    // Fetch all data with select
    const data = (await prismaModel.findMany({
      where,
      select: summary,
    })) as any[];

    const result: Record<string, number> = {};

    // Recursive sum helper
    const sumValues = (obj: any, prefix = "") => {
      for (const key in obj) {
        const value = obj[key];
        const fieldName = prefix ? `${prefix}.${key}` : key;

        if (typeof value === "number") {
          result[fieldName] = (result[fieldName] || 0) + value;
        } else if (Array.isArray(value)) {
          value.forEach((v) => sumValues(v, fieldName));
        } else if (value && typeof value === "object") {
          sumValues(value, fieldName);
        }
      }
    };

    data.forEach((item) => sumValues(item));

    return result;
  }

  async count(
    where?: Prisma.Args<PrismaClient[T], "count">["where"],
  ): Promise<number> {
    return db.withRetry(async () => {
      // @ts-ignore - Dynamic model access
      return this.prisma[this.modelName].count({ where });
    });
  }

  // Advanced Operations

  async executeRaw<U>(query: string, values?: any[]): Promise<U> {
    return db.withRetry(async () => {
      // @ts-ignore - Dynamic model access
      return this.prisma.$executeRaw(query, values);
    }) as U;
  }

  async queryRaw<U>(query: string, values?: any[]): Promise<U> {
    return db.withRetry(async () => {
      // @ts-ignore - Dynamic model access
      return this.prisma.$queryRaw(query, values);
    });
  }

  async transaction<U>(
    operations: (
      prisma: Omit<
        PrismaClient,
        | "$connect"
        | "$disconnect"
        | "$on"
        | "$transaction"
        | "$use"
        | "$extends"
      >,
    ) => Promise<U>,
  ): Promise<U> {
    return db.withRetry(async () => {
      return this.prisma.$transaction(operations);
    }) as U;
  }
}
