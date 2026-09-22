export class PaymentUtils {
  /**
   * Generates a unique, human-readable order number.
   * Format: ORD-[Last 8 digits of timestamp][3 random digits]
   * Example: ORD-83920145487
   */
  static generatePaymentNumber(): string {
    const timestampPart = Date.now().toString().slice(-8);
    const randomPart = Math.floor(100 + Math.random() * 900);
    return `PAY-${timestampPart}${randomPart}`;
  }
}

export class Utils {
  static payment = PaymentUtils;
}
