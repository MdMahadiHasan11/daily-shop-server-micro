type AllocationStrategy = "FEFO_FIRST" | "COST_FIRST" | "CENTRAL_HUB_FIRST";

interface CartItem {
  variantId: string;
  quantity: number;
  strategy?: AllocationStrategy;
}

interface BranchStock {
  branchId: string;
  distanceKm: number;
  isCentralHub?: boolean;
  variants: Map<string, { stock: number; expiryDate?: Date }>;
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
          const variantInfo = branch.variants.get(item.variantId);
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
            // Priority 1: Danger Zone Expiry Clearance
            if (isDangerZone) {
              priorityScore += 10000;
            } else if (daysToExpiry < 9999) {
              // Closer expiry date gets higher score
              priorityScore += Math.max(0, 1000 - daysToExpiry);
            }
          }

          // ==========================================
          // STRATEGY 2: HIGH VALUE ITEMS (CENTRAL_HUB_FIRST)
          // ==========================================
          if (activeStrategy === "CENTRAL_HUB_FIRST") {
            if (branch.isCentralHub) {
              priorityScore += 15000; // Highest priority for Central Hub
            }
          }

          // ==========================================
          // COMMON RULES FOR ALL STRATEGIES (Minimize Splits & Proximity)
          // ==========================================

          // Rule 2: Minimize Branch Splits / Consolidate Stock
          if (currentStock >= remainingQty) {
            priorityScore += 5000; // Bonus score if branch can fulfill entire remaining quantity
          } else {
            priorityScore += currentStock * 10; // More available stock gets higher preference
          }

          // Rule 3: Customer Proximity / Cost Saving (Shorter distance = higher score)
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
        .filter((b) => b.currentStock > 0) // Filter out branches with zero stock
        .sort((a, b) => b.priorityScore - a.priorityScore); // Sort descending by priority score

      if (sortedBranches.length === 0) {
        throw new Error(
          `Out of stock for variant ${item.variantId}. Missing ${remainingQty} units.`,
        );
      }

      // Select the best matched branch
      const bestMatch = sortedBranches[0];
      const takeQty = Math.min(remainingQty, bestMatch.currentStock);

      // Push to allocation plan
      allocationPlan.push({
        branchId: bestMatch.branch.branchId,
        variantId: item.variantId,
        allocatedQty: takeQty,
      });

      // Update local branch stock state for subsequent iterations
      const targetVariant = bestMatch.branch.variants.get(item.variantId)!;
      targetVariant.stock -= takeQty;

      // Decrement remaining quantity
      remainingQty -= takeQty;
    }
  }

  return allocationPlan;
}

function getDaysDiff(d1: Date, d2: Date): number {
  return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

// [
//   {
//     branchId: "branch-dhaka-01",
//     variantId: "v-4",
//     allocatedQty: 10
//   },
//   {
//     branchId: "branch-gazipur-02",
//     variantId: "v-4",
//     allocatedQty: 2
//   },
//   {
//     branchId: "branch-dhaka-01",
//     variantId: "v-8",
//     allocatedQty: 1
//   }
// ]
