import { Router } from "express";
import { AuthProxyRoute } from "./auth.proxy";
import { UserProxyRoute } from "./user.proxy";

const gatewayRouter = Router();

const userProxy = new UserProxyRoute();
const authProxy = new AuthProxyRoute();

// gatewayRouter.use(userProxy.router);
gatewayRouter.use(authProxy.router);

export default gatewayRouter;
