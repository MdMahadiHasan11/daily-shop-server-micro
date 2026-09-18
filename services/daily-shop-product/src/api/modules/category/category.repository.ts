import { BaseRepository } from "../../../core/base/base.repository";
import { CategoryListQuery } from "./category.validator";

export class CategoryRepository extends BaseRepository<"category"> {
  constructor() {
    super("category");
  }

  async getAllCategories(
    query: CategoryListQuery["query"],
  ): Promise<any> {
    const { parentId, isDeleted, view, ...paginationQuery } = query as any;

    const customWhere: any = {};
    if (parentId !== undefined) customWhere.parentId = parentId;
    if (isDeleted !== undefined) customWhere.isDeleted = isDeleted;

    if (view === "tree") {
      const rootCategories = await this.model.findMany({
        where: {
          parentId: null,
          isDeleted: isDeleted !== undefined ? isDeleted : false,
        },
        include: {
          children: {
            where: { isDeleted: false },
            include: {
              children: {
                where: { isDeleted: false },
              },
            },
          },
        },
      });

      return {
        data: rootCategories,
        pagination: {
          total: rootCategories.length,
          page: 1,
          limit: rootCategories.length,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }

    return await this.getList({
      ...paginationQuery,
      ...customWhere,
    });
  }

  async getCategoryById(id: string) {
    return await this.model.findUnique({
      where: { id, isDeleted: false },
      include: {
        parent: true,
        children: { where: { isDeleted: false } },
      },
    });
  }

  
  async getCategoryIncludingDeleted(id: string) {
    return await this.model.findUnique({
      where: { id },
    });
  }
}