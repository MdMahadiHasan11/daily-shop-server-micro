import axios, { AxiosRequestConfig } from "axios";
import { handleAxiosError } from "../../api/middlewares/globalErrorHandler";
import { env } from "../config/env.config";
import { AppError } from "../errors/errors";
import { IMetaData } from "../utils/request-metadata";

 

const getServiceUrl = (serviceName: string): string => {
  const urls: Record<string, string> = {
    user: env.USER_SERVICE_URL || "http://localhost:5011/v1",
    // auth: process.env.AUTH_SERVICE_URL || "http://localhost:5000/v1",
  };

  const url = urls[serviceName.toLowerCase()];
  if (!url) {
    throw new AppError(
      `Service URL for '${serviceName}' is not configured`,
      500,
    );
  }
  return url;
};

const extractMetadataHeaders = (
  meta?: Partial<IMetaData>,
): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (!meta) return headers;

  for (const [key, value] of Object.entries(meta)) {
    if (value !== undefined && value !== null) {
      let headerKey: string;
      if (["userId", "email", "phoneNumber", "jti", "role"].includes(key)) {
        const formattedKey = key === "userId" ? "user-id" : key.toLowerCase();
        headerKey = `x-auth-${formattedKey}`;
      } else {
        const kebabKey = key
          .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
          .toLowerCase();
        headerKey = `x-${kebabKey}`;
      }
      headers[headerKey] = String(value);
    }
  }
  return headers;
};

const createRequestConfig = (
  meta?: Partial<IMetaData>,
  config?: AxiosRequestConfig,
): AxiosRequestConfig => {
  const headers: Record<string, string> = {
    "x-internal-secret": env.AUTH_INTERNAL_SECRET,
    ...extractMetadataHeaders(meta),
    ...(config?.headers as Record<string, string>),
  };
  return { ...config, headers };
};

export const microserviceClient = {
  get: async <T = any>(
    serviceName: string,
    endpoint: string,
    meta?: Partial<IMetaData>,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    try {
      const baseUrl = getServiceUrl(serviceName);
      const finalConfig = createRequestConfig(meta, config);
      const response = await axios.get(`${baseUrl}${endpoint}`, finalConfig);
      return response.data;
    } catch (error) {
      return handleAxiosError(
        error,
        `Failed to communicate with ${serviceName} service`,
      );
    }
  },

  post: async <T = any>(
    serviceName: string,
    endpoint: string,
    data?: any,
    meta?: Partial<IMetaData>,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    try {
      const baseUrl = getServiceUrl(serviceName);
      const finalConfig = createRequestConfig(meta, config);
      const response = await axios.post(
        `${baseUrl}${endpoint}`,
        data,
        finalConfig,
      );
      return response.data;
    } catch (error) {
      return handleAxiosError(
        error,
        `Failed to communicate with ${serviceName} service`,
      );
    }
  },
};
