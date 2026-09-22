import axios from "axios";
import qs from "qs";
import { env } from "../../config/env.config";
import { AppError } from "../../errors/errors";
import { ISSLPaymentPayload } from "./ssl.interface";

export class SSLCommerzService {
  static async sslPaymentInit(payload: ISSLPaymentPayload) {
    const data = {
      store_id: env.SSL_STORE_ID,
      store_passwd: env.SSL_STORE_PASS,
      total_amount: Number(payload.amount).toFixed(2),
      currency: "BDT",
      tran_id: payload.transactionId,

      success_url: `${env.SSL_SUCCESS_BACKEND_URL}?tran_id=${encodeURIComponent(payload.transactionId)}`,
      fail_url: `${env.SSL_FAIL_BACKEND_URL}?tran_id=${encodeURIComponent(payload.transactionId)}`,
      cancel_url: `${env.SSL_CANCEL_BACKEND_URL}?tran_id=${encodeURIComponent(payload.transactionId)}`,
      ipn_url: env.SSL_IPN_URL,

      shipping_method: "NO",
      num_of_item: 1,
      product_name: payload.productInfo.name || "Ecommerce Products",
      product_category: payload.productInfo.category || "Ecommerce",
      product_profile: "general",

      // customer and shipping info
      cus_name: payload.customer.name || "Customer",
      cus_email: payload.customer.email || "customer@example.com",
      cus_add1: payload.customer.address || "N/A",
      cus_add2: "N/A",
      cus_city: payload.customer.city || "Dhaka",
      cus_state: "Dhaka",
      cus_postcode: payload.customer.postcode || "1200",
      cus_country: payload.customer.country || "Bangladesh",
      cus_phone: payload.customer.phone || "01700000000",

      //   id pass after success and fail use
      value_a: payload.orderId,
      value_b: "ecommerce",
      value_c: "",
      value_d: "online_payment",
    };

    try {
      const response = await axios({
        method: "POST",
        url: env.SSL_PAYMENT_API,
        data: qs.stringify(data),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (!response.data?.GatewayPageURL) {
        throw new AppError(
          "SSLCommerz initialization failed",
          400,
          true,
          undefined,
          "SSL_INIT_FAILED",
        );
      }

      return response.data; //  GatewayPageURL success
    } catch (err: any) {
      console.error("SSL init error:", err.response?.data || err.message);
      throw new AppError(
        "Payment gateway communication error",
        500,
        true,
        undefined,
        "GATEWAY_ERROR",
      );
    }
  }

  /**
   * validate (ipn and success)
   */
  static async validateSslPayment(val_id: string) {
    try {
      const params = {
        val_id,
        store_id: env.SSL_STORE_ID,
        store_passwd: env.SSL_STORE_PASS,
        format: "json",
      };

      const response = await axios.get(env.SSL_VALIDATION_API, {
        params,
      });

      const data = response.data;

      if (data.status !== "VALID" && data.status !== "VALIDATED") {
        return { valid: false, data };
      }

      return { valid: true, data };
    } catch (err: any) {
      console.error("SSL validation failed:", err.message);
      return { valid: false, error: err.message };
    }
  }
}
