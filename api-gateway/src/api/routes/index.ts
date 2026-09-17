import { Router } from "express";
import { AuthProxyRoute } from "./auth.proxy";
import { UserProxyRoute } from "./user.proxy";
import { FileProxyRoute } from "./file.proxy";

const gatewayRouter = Router();

const userProxy = new UserProxyRoute();
const authProxy = new AuthProxyRoute();
const fileProxy = new FileProxyRoute();

gatewayRouter.use(userProxy.router);
gatewayRouter.use(authProxy.router);

export default gatewayRouter;
