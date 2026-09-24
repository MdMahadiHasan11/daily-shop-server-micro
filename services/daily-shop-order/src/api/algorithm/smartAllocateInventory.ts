type AllocationStrategy = "FEFO_FIRST" | "COST_FIRST" | "CENTRAL_HUB_FIRST";

interface CartItem {
  variantId: string;
  quantity: number;
  strategy?: AllocationStrategy;
}

// Map এর বদলে এখানে সাধারণ Record অবজেক্ট ব্যবহার করা হলো
interface BranchStock {
  branchId: string;
  distanceKm: number;
  isCentralHub?: boolean;
  variants: Record<string, { stock: number; expiryDate?: Date }>;
}

interface AllocationResult {
  branchId: string;
  variantId: string;
  allocatedQty: number;
}

/**
 * Advanced Dynamic Inventory Allocation Engine supporting multiple strategies:
 * - GROCERY_MEDICINE (FEFO_FIRST): Danger zone expiry priority + Minimize splits
 * - ELECTRONICS_FASHION (COST_FIRST): Distance & Single Branch / Cost saving priority
 * - HIGH_VALUE (CENTRAL_HUB_FIRST): Central Hub priority for secure/expensive items
 */
export function smartAllocateInventoryWithStrategies(
  cartItems: CartItem[],
  availableBranches: BranchStock[],
  defaultStrategy: AllocationStrategy = "FEFO_FIRST",
  currentDate: Date = new Date(),
): AllocationResult[] {
  const allocationPlan: AllocationResult[] = [];

  for (const item of cartItems) {
    let remainingQty = item.quantity;
    const activeStrategy = item.strategy || defaultStrategy;

    while (remainingQty > 0) {
      const sortedBranches = [...availableBranches]
        .map((branch) => {
          const variantInfo = branch.variants[item.variantId];
          const currentStock = variantInfo?.stock || 0;
          const expiryDate = variantInfo?.expiryDate;

          const daysToExpiry = expiryDate
            ? getDaysDiff(currentDate, expiryDate)
            : 9999;
          const isDangerZone = daysToExpiry >= 10 && daysToExpiry <= 15;

          let priorityScore = 0;

          // ==========================================
          // STRATEGY 1: GROCERY & MEDICINE (FEFO_FIRST)
          // ==========================================
          if (activeStrategy === "FEFO_FIRST") {
            if (isDangerZone) {
              priorityScore += 10000;
            } else if (daysToExpiry < 9999) {
              priorityScore += Math.max(0, 1000 - daysToExpiry);
            }
          }

          // ==========================================
          // STRATEGY 2: HIGH VALUE ITEMS (CENTRAL_HUB_FIRST)
          // ==========================================
          if (activeStrategy === "CENTRAL_HUB_FIRST") {
            if (branch.isCentralHub) {
              priorityScore += 15000;
            }
          }

          // ==========================================
          // COMMON RULES FOR ALL STRATEGIES
          // ==========================================
          if (currentStock >= remainingQty) {
            priorityScore += 5000;
          } else {
            priorityScore += currentStock * 10;
          }

          const distanceWeight = activeStrategy === "COST_FIRST" ? 200 : 100;
          const distanceScore = Math.max(
            0,
            distanceWeight -
              branch.distanceKm * (activeStrategy === "COST_FIRST" ? 2 : 1),
          );
          priorityScore += distanceScore;

          return {
            branch,
            currentStock,
            priorityScore,
            daysToExpiry,
          };
        })
        .filter((b) => b.currentStock > 0)
        .sort((a, b) => b.priorityScore - a.priorityScore);

      if (sortedBranches.length === 0) {
        throw new Error(
          `Out of stock for variant ${item.variantId}. Missing ${remainingQty} units.`,
        );
      }

      const bestMatch = sortedBranches[0];
      const takeQty = Math.min(remainingQty, bestMatch.currentStock);

      allocationPlan.push({
        branchId: bestMatch.branch.branchId,
        variantId: item.variantId,
        allocatedQty: takeQty,
      });
      const targetVariant = bestMatch.branch.variants[item.variantId];
      if (targetVariant) {
        targetVariant.stock -= takeQty;
      }

      remainingQty -= takeQty;
    }
  }

  return allocationPlan;
}

function getDaysDiff(d1: Date, d2: Date): number {
  return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}