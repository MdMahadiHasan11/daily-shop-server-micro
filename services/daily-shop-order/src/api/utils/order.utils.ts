export class OrderUtils {
  /**
   * Generates a unique, human-readable order number.
   * Format: ORD-[Last 8 digits of timestamp][3 random digits]
   * Example: ORD-83920145487
   */
  static generateOrderNumber(): string {
    const timestampPart = Date.now().toString().slice(-8);
    const randomPart = Math.floor(100 + Math.random() * 900);
    return `ORD-${timestampPart}${randomPart}`;
  }
}

export class Utils {
  static order = OrderUtils;
  // অন্য কোনো ইউটিলিটি থাকলে এখানে থাকতে পারে...
}
