import { Request, Response } from "express";
import { BaseController } from "../../../core/base/base.controller";
import { SSLService } from "./ssl.service";

export class SSLController extends BaseController {
  private service: SSLService;

  constructor() {
    super();
    this.service = new SSLService();
  }

  sslSuccess = this.asyncHandler(async (req: Request, res: Response) => {
    // const { val_id, tran_id } = req.body;

    const tran_id = "PAY-56714959192";

    // if (!val_id || !tran_id) {
    //   return res.redirect(
    //     `http://localhost:3000/checkout/fail?error=missing_parameters`,
    //   );
    // }

    // const validation = await SSLCommerzService.validateSslPayment(
    //   val_id as string,
    // );

    // if (!validation.valid) {
    //   return res.redirect(
    //     `http://localhost:3000/checkout/fail?error=invalid_payment`,
    //   );
    // }

    const result = await this.service.confirmPayment(tran_id, validData);

    return this.successResponse(res, result, 200, {
      message: "Pending payment create successfully",
    });

    // return res.redirect(
    //   `http://localhost:3000/checkout/success?tran_id=${tran_id}`,
    // );
  });
}

const validData = {
  status: "VALID",
  tran_date: "2026-09-22 14:56:06",
  tran_id: "PAY-56714959192",
  val_id: "260922145618o1tOUwqtiQQMiYV",
  amount: "162.00",
  store_amount: "157.95",
  currency: "BDT",
  bank_tran_id: "260922145618IaW3vxKrBnX2yut",
  card_type: "BKASH-BKash",
  card_no: "",
  card_issuer: "BKash Mobile Banking",
  card_brand: "MOBILEBANKING",
  card_category: "MOBILE",
  card_sub_brand: "",
  card_issuer_country: "Bangladesh",
  card_issuer_country_code: "BD",
  currency_type: "BDT",
  currency_amount: "162.00",
  currency_rate: "1.0000",
  base_fair: "0.00",
  value_a: "a72a2b9f-1203-49cd-9292-8df6b1731a89",
  value_b: "ecommerce",
  value_c: "",
  value_d: "online_payment",
  emi_instalment: "0",
  emi_amount: "0.00",
  emi_description: "",
  emi_issuer: "BKash Mobile Banking",
  account_details: "",
  risk_title: "Safe",
  risk_level: "0",
  discount_percentage: "0",
  discount_amount: "0.00",
  discount_remarks: "",
  APIConnect: "DONE",
  validated_on: "2026-09-22 14:56:23",
  gw_version: "",
  offer_avail: 1,
  card_ref_id:
    "dc1da4f52669828139e81ef5eb0f48a5a99ea054a131e00a562887d455417dd914",
  isTokeizeSuccess: 0,
  campaign_code: "",
};
