import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  Registry,
} from "prom-client";

class MetricsService {
  public readonly registry: Registry;

  // HTTP Metrics
  public readonly httpRequests: Counter<"method" | "route" | "status">;
  public readonly httpRequestDuration: Histogram<"method" | "route">;
  public readonly activeRequests: Gauge<string>;
  public readonly activeUsers: Gauge<"type">;

  // System Metrics
  public readonly memoryUsage: Gauge<"type">;
  public readonly cpuUsage: Gauge<string>;

  constructor() {
    this.registry = new Registry();

    // Node.js
    collectDefaultMetrics({ register: this.registry });

    // Custom metrics
    this.httpRequests = new Counter({
      name: "http_requests_total",
      help: "Total HTTP requests",
      labelNames: ["method", "route", "status"],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: "http_request_duration_seconds",
      help: "HTTP request duration in seconds",
      labelNames: ["method", "route"],
      buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.memoryUsage = new Gauge({
      name: "process_memory_usage_bytes",
      help: "Node.js process memory usage",
      labelNames: ["type"],
      registers: [this.registry],
    });

    this.cpuUsage = new Gauge({
      name: "process_cpu_usage_percent",
      help: "Node.js process CPU usage",
      registers: [this.registry],
    });

    this.activeUsers = new Gauge({
      name: "app_active_users",
      help: "Number of currently active users",
      labelNames: ["type"],
      registers: [this.registry],
    });

    this.activeRequests = new Gauge({
      name: "app_active_requests",
      help: "Number of currently active HTTP requests",
      registers: [this.registry],
    });
  }

  public async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  public userConnected(userType = "guest"): void {
    this.activeUsers.inc({ type: userType });
  }

  public userDisconnected(userType = "guest"): void {
    this.activeUsers.dec({ type: userType });
  }
}

export const metrics = new MetricsService();
