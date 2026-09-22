export function buildSearchWhere(
  where: any = {},
  searchFields: string[],
  search: string
) {
  const OR: any[] = [];

  for (const field of searchFields) {
    const path = field.split("."); // handles multi-level
    let condition: any = { contains: search, mode: "insensitive" };

    // build nested object backwards
    for (let i = path.length - 1; i >= 0; i--) {
      condition = { [path[i]]: condition };
    }

    OR.push(condition);
  }

  // Merge with existing OR (if present)
  where.OR = [...(where.OR || []), ...OR];

  return where;
}
