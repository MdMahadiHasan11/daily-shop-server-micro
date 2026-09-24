import { AppError } from "../../core/errors/errors";

export type AllocationStrategy =
  | "FEFO_FIRST"
  | "COST_FIRST"
  | "CENTRAL_HUB_FIRST";

export interface CartItem {
  variantId: string;
  quantity: number;
  strategy?: AllocationStrategy;
}

export interface BranchStock {
  branchId: string;
  distanceKm: number;
  isCentralHub?: boolean;
  variants: Record<string, { stock: number; expiryDate?: Date }>;
}

export interface AllocationResult {
  branchId: string;
  variantId: string;
  allocatedQty: number;
}

export function smartAllocateInventoryWithStrategies(
  cartItems: CartItem[],
  availableBranches: BranchStock[],
  defaultStrategy: AllocationStrategy = "FEFO_FIRST",
  currentDate: Date = new Date(),
): AllocationResult[] {
  const allocationPlan: AllocationResult[] = [];

  for (const item of cartItems) {
    let remainingQty = item.quantity;
    const strategy = item.strategy || defaultStrategy;

    while (remainingQty > 0) {
      const scoredBranches = availableBranches
        .map((branch) => {
          const variantInfo = branch.variants[item.variantId];
          const stock = variantInfo?.stock || 0;
          if (stock <= 0) return null;

          let score = 0;

          if (strategy === "FEFO_FIRST" && variantInfo.expiryDate) {
            const daysToExpiry = Math.ceil(
              (variantInfo.expiryDate.getTime() - currentDate.getTime()) /
                (1000 * 60 * 60 * 24),
            );

            score += Math.max(0, 10000 - daysToExpiry * 10);
          } else if (strategy === "CENTRAL_HUB_FIRST" && branch.isCentralHub) {
            score += 15000;
          }

          if (stock >= remainingQty) score += 5000;
          score += Math.max(0, 500 - branch.distanceKm * 10);

          return { branch, stock, score, variantInfo };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => b.score - a.score);

      if (scoredBranches.length === 0) {
        throw new AppError(
          `Out of stock for variant ${item.variantId}. Needed: ${remainingQty}`,
        );
      }

      const best = scoredBranches[0];
      const takeQty = Math.min(remainingQty, best.stock);

      allocationPlan.push({
        branchId: best.branch.branchId,
        variantId: item.variantId,
        allocatedQty: takeQty,
      });

      best.variantInfo.stock -= takeQty;
      remainingQty -= takeQty;
    }
  }

  return allocationPlan;
}
