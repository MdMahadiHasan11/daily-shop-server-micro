import { Request, Response } from "express";
import { BaseController } from "../../../core/base/base.controller";
import { SSLService } from "./ssl.service";
import { SSLCommerzService } from "../../../core/services/ssl/ssl.service";
import { env } from "../../../core/config/env.config";

export class SSLController extends BaseController {
  private service: SSLService;

  constructor() {
    super();
    this.service = new SSLService();
  }

  sslSuccess = this.asyncHandler(async (req: Request, res: Response) => {
    const { val_id, tran_id } = req.body;

    // const tran_id = "PAY-56714959192";

    if (!val_id || !tran_id) {
      return res.redirect(
        `${env.SSL_FAIL_FRONTEND_URL}?error=missing_parameters`,
      );
    }

    const validation = await SSLCommerzService.validateSslPayment(
      val_id as string,
    );

    if (!validation.valid) {
      return res.redirect(
        `${env.SSL_FAIL_FRONTEND_URL}?error=invalid_payment`,
      );
    }

     await this.service.confirmPayment(tran_id, validation.data);

    return res.redirect(
      `${env.SSL_SUCCESS_FRONTEND_URL}?tran_id=${tran_id}`,
    );
  });
}
