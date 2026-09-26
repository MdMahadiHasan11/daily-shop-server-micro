import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { logger } from "../utils/logger.utils";

export class HttpClientService {
  protected readonly instance: AxiosInstance;

  constructor(baseURL: string, timeout = 5000) {
    this.instance = axios.create({
      baseURL,
      timeout,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.initializeInterceptors();
  }

  /**
   * Request/Response Interceptors for Logging & Error Handling
   */
  private initializeInterceptors(): void {
    // Request Interceptor
    this.instance.interceptors.request.use(
      (config) => {
        logger.debug(
          { url: config.url, method: config.method },
          "[HTTP Request]",
        );
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response Interceptor
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error(
          {
            url: error.config?.url,
            status: error.response?.status,
            message: error.message,
          },
          "[HTTP Request Failed]",
        );
        return Promise.reject(error);
      },
    );
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.get(url, config);
    return response.data;
  }

  public async post<T, B = unknown>(
    url: string,
    body: B,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.post(
      url,
      body,
      config,
    );
    return response.data;
  }

  public async put<T, B = unknown>(
    url: string,
    body: B,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.put(
      url,
      body,
      config,
    );
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.delete(url, config);
    return response.data;
  }
}
