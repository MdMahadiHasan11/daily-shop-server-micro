import { Router } from "express";
import { AuthProxyRoute } from "./auth.proxy";
import { FileProxyRoute } from "./file.proxy";
import { ProductProxyRoute } from "./product.proxy";
import { UserProxyRoute } from "./user.proxy";

const gatewayRouter = Router();

const userProxy = new UserProxyRoute();
const authProxy = new AuthProxyRoute();
const fileProxy = new FileProxyRoute();
const productProxy = new ProductProxyRoute();

gatewayRouter.use(userProxy.router);
gatewayRouter.use(authProxy.router);
gatewayRouter.use(fileProxy.router);
gatewayRouter.use(productProxy.router);

export default gatewayRouter;
