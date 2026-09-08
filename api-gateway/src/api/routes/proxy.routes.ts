import { Application } from "express";
import { AuthProxyRoute } from "./auth.proxy";
import { UserProxyRoute } from "./user.proxy";

export const setupProxyRoutes = (app: Application) => {
  const authProxy = new AuthProxyRoute();
  const userProxy = new UserProxyRoute();

  app.use("/v1/auth", authProxy.router);
  app.use("/v1/users", userProxy.router);
};
