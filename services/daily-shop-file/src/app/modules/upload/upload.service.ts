import { Request } from "express";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import { CloudinaryService } from "../../helper/cloudinary.service";

/**
 * =========================
 * UPLOAD SINGLE FILE
 * =========================
 */
const uploadSingle = async (req: Request) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "File not found");
  }

  return {
    url: req.file.path,
    public_id: req.file.filename,
  };
};

/**
 * =========================
 * UPLOAD MULTIPLE FILES
 * =========================
 */
const uploadMultiple = async (req: Request) => {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) return [];

  return files.map((file) => ({
    url: file.path,
    public_id: file.filename,
  }));
};

/**
 * =========================
 * UPLOAD PDF
 * =========================
 */
const uploadPdf = async (req: Request) => {
  if (!req.file) return null;

  return {
    url: req.file.path,
    public_id: req.file.filename,
  };
};

/**
 * =========================
 * DELETE BY PUBLIC ID
 * =========================
 */
const deleteById = async (publicId: string) => {
  return await CloudinaryService.deleteFile(publicId);
};

/**
 * =========================
 * DELETE BY URL
 * =========================
 */
const deleteByUrl = async (url: string) => {
  return await CloudinaryService.deleteByUrl(url);
};

/**
 * =========================
 * DELETE BY FOLDER
 * =========================
 */
const deleteFolder = async (folder: string) => {
  return await CloudinaryService.deleteByFolder(folder);
};

export const fileUploadService = {
  uploadSingle,
  uploadMultiple,
  uploadPdf,
  deleteById,
  deleteByUrl,
  deleteFolder,
};
