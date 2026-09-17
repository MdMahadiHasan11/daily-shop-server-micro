import express from "express";
import { DirectFileUploader } from "../../helper/directFileUploader";
import { filesController } from "./upload.controller";

const router = express.Router();

/**
 * =========================
 * UPLOAD SINGLE FILE
 * =========================
 */
router.post(
  "/upload",
  DirectFileUploader.uploadCloud.single("file"),
  filesController.uploadSingle,
);

/**
 * =========================
 * UPLOAD MULTIPLE FILES
 * =========================
 */
router.post(
  "/upload/multiple",
  DirectFileUploader.uploadCloud.array("files", 10),
  filesController.uploadMultiple,
);

/**
 * =========================
 * UPLOAD PDF
 * =========================
 */
router.post(
  "/upload/pdf",
  DirectFileUploader.uploadCloud.single("file"),
  filesController.uploadPdf,
);

/**
 * =========================
 * DELETE ROUTES
 * =========================
 */
router.delete("/delete", filesController.deleteById);

router.delete("/delete-folder/:folder", filesController.deleteFolder);

export const FilesUploadRoutes = router;
