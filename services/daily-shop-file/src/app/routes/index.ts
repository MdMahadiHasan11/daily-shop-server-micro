import express from "express";
import { FilesUploadRoutes } from "../modules/upload/upload.route";
const router: express.Router = express.Router();

const moduleRoutes = [
  {
    path: "/files",
    route: FilesUploadRoutes,
  },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
