import axios, { AxiosRequestConfig } from "axios";
import {
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router,
} from "express";
import { env } from "../../config/gateway.config";
import { middlewares } from "./auth.middleware";

type HttpMethod = "get" | "post" | "put" | "delete" | "patch";

export interface RouteDefinition {
  path: string;
  method: HttpMethod;
  middlewares?: RequestHandler[];
}

export abstract class BaseProxyRoute {
  public router = Router();
  protected abstract serviceUrl: string;
  protected middlewares = middlewares;

  protected registerRoutes(routes: RouteDefinition[]) {
    routes.forEach((route) => {
      const { path, method, middlewares = [] } = route;
      const handler = this.createHandler(path, method);
      this.router[method](path, ...middlewares, handler);
    });
  }

  private createHandler(path: string, method: HttpMethod): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        let rawTargetUrl = req.baseUrl
          ? req.originalUrl.replace(req.baseUrl, "")
          : req.originalUrl;

        let targetUrl = rawTargetUrl.split("?")[0];

        if (!targetUrl || targetUrl === "") {
          targetUrl = path;
          Object.entries(req.params).forEach(([key, value]) => {
            const strValue = Array.isArray(value) ? value[0] : value || "";
            targetUrl = targetUrl.replace(new RegExp(`:${key}`, "g"), strValue);
          });
        }

        const fullUrl = `${this.serviceUrl}${targetUrl}`;

        const clientIp =
          (req.headers["x-forwarded-for"] as string) ||
          req.socket.remoteAddress ||
          "";

        const headers: Record<string, any> = {
          ...req.headers,
          "x-gateway-secret": env.GATEWAY_SECRET || "gateway-secure-secret",
          "x-request-id": req.headers["x-request-id"] || Date.now().toString(),
          "x-forwarded-for": clientIp,
          "x-real-ip": clientIp,
          "user-agent": req.headers["user-agent"] || "",

          "x-user-id": req.headers["x-user-id"] || "",
          "x-user-email": req.headers["x-user-email"] || "",
          "x-user-role": req.headers["x-user-role"] || "",
          "x-user-phone": req.headers["x-user-phone"] || "",
        };

        if (req.headers.authorization) {
          headers.authorization = req.headers.authorization;
        }
        if (req.headers.cookie) {
          headers.cookie = req.headers.cookie;
        }

        // ফর্ম ডাটা/ইমেজ আপলোডের জন্য content-type ধরে রাখা অত্যন্ত জরুরি
        if (req.headers["content-type"]) {
          headers["content-type"] = req.headers["content-type"];
        }

        delete headers.host;
        delete headers.connection;
        delete headers.dnt;
        delete headers["content-length"]; // Axios নিজের মতো করে সঠিক content-length হিসাব করে নেবে
        delete headers["accept-encoding"];

        const axiosConfig: AxiosRequestConfig = {
          method,
          url: fullUrl,
          // GET বা DELETE ছাড়া অন্য মেথডের জন্য (যেমন POST/PUT) ইমেজ বা ফর্ম ডাটা স্ট্রিম হিসেবে সরাসরি req পাস করা হলো
          data: method === "get" ? undefined : req, 
          params: req.query,
          headers,
          timeout: 30000, // ফাইল আপলোড বড় হতে পারে, তাই সময় বাড়িয়ে দেওয়া হলো
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          validateStatus: () => true,
        };

        const response = await axios(axiosConfig);

        const setCookie = response.headers["set-cookie"];
        if (setCookie && setCookie.length) {
          res.setHeader("set-cookie", setCookie);
        }

        return res.status(response.status).json(response.data);
      } catch (error: any) {
        console.error(
          `🔥 Gateway Proxy Error [${method.toUpperCase()} ${path}]:`,
          error.message,
        );
        return res.status(502).json({
          success: false,
          message: "Bad Gateway - Microservice unreachable or timed out.",
        });
      }
    };
  }
}