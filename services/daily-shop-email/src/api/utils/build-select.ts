export const buildSelect = (fields: string[]) => {
  const baseSelect: any = {};

  for (const field of fields) {
    const trimField = field.trim();

    if (trimField.includes(".")) {
      const [relation, nestedField] = trimField.split(".");

      if (!baseSelect[relation]) {
        baseSelect[relation] = { select: {} };
      }

      baseSelect[relation].select[nestedField] = true;
    } else {
      baseSelect[trimField] = true;
    }
  }

  return baseSelect;
};
