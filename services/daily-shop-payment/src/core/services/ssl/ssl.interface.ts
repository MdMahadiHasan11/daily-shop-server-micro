export interface ISSLPaymentPayload {
  amount: number;
  transactionId: string;
  orderId: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
  productInfo: {
    name: string;
    category: string;
  };
}
