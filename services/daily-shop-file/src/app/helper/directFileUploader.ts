import { UploadApiResponse } from "cloudinary";
import fs from "fs";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import stream from "stream";
import { cloudinaryUploadConfig } from "../../config/cloudinary.config";
import ApiError from "../errors/ApiError";

/**
 * =========================
 * CLOUDINARY STORAGE (FIXED)
 * =========================
 */
const storageCloud = new CloudinaryStorage({
  cloudinary: cloudinaryUploadConfig,

  params: async (_req, file) => {
    const fileName = file.originalname
      .toLowerCase()
      .split(".")[0]
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");

    const ext = file.originalname.split(".").pop();

    return {
      folder: "uploads",
      public_id: `${fileName}-${Date.now()}.${ext}`,
    } as any;
  },
});

const uploadCloud = multer({ storage: storageCloud });

/**
 * =========================
 * NORMAL FILE UPLOAD (DISK → CLOUD)
 * =========================
 */
const uploadToCloudinary = async (file: Express.Multer.File) => {
  try {
    const uploadResult = await cloudinaryUploadConfig.uploader.upload(
      file.path,
      {
        folder: "uploads",
        public_id: `${file.originalname}-${Date.now()}`,
      },
    );

    fs.unlinkSync(file.path); // remove local temp file

    return uploadResult;
  } catch (error: any) {
    throw new ApiError(500, error.message);
  }
};

/**
 * =========================
 * BUFFER UPLOAD (PDF / STREAM)
 * =========================
 */
const uploadBufferToCloudinary = async (
  buffer: Buffer,
  fileName: string,
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const cleanName = fileName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");

    const public_id = `pdf/${cleanName}-${Date.now()}`;

    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    cloudinaryUploadConfig.uploader
      .upload_stream(
        {
          resource_type: "auto",
          folder: "pdf",
          public_id,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result as UploadApiResponse);
        },
      )
      .end(buffer);
  });
};

/**
 * =========================
 * DELETE BY URL OR PUBLIC ID (SMART FIX)
 * =========================
 */
/**
 * =========================
 * DELETE BY URL OR PUBLIC ID (FIXED)
 * =========================
 */
const deleteImageFromCloudinary = async (input: string) => {
  try {
    let publicId = input;

    if (input.includes("/upload/")) {
      const parts = input.split("/upload/");
      if (parts.length < 2) {
        throw new ApiError(400, "Invalid Cloudinary URL");
      }

      let pathWithoutVersion = parts[1];

      if (/^v\d+\//.test(pathWithoutVersion)) {
        pathWithoutVersion = pathWithoutVersion.replace(/^v\d+\//, "");
      }

      const lastDotIndex = pathWithoutVersion.lastIndexOf(".");
      publicId = lastDotIndex !== -1
        ? pathWithoutVersion.substring(0, lastDotIndex)
        : pathWithoutVersion;
    }

    if (!publicId) {
      throw new ApiError(400, "Could not resolve public ID");
    }

    // ✅ Fix here: Change resource_type from "auto" to "image" (or remove resource_type option)
    const result = await cloudinaryUploadConfig.uploader.destroy(publicId, {
      resource_type: "image", 
    });

    if (result.result === "not found") {
      throw new ApiError(404, "File not found in Cloudinary! It may already be deleted.");
    }

    return result;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, error.message || "Cloudinary delete failed");
  }
};

/**
 * =========================
 * DELETE BY PREFIX (FOLDER DELETE)
 * =========================
 */
const deleteByFolder = async (folder: string) => {
  try {
    const result =
      await cloudinaryUploadConfig.api.delete_resources_by_prefix(folder);

    return result;
  } catch (error: any) {
    throw new ApiError(500, "Folder delete failed");
  }
};

export const DirectFileUploader = {
  uploadCloud,
  uploadToCloudinary,
  uploadBufferToCloudinary,
  deleteImageFromCloudinary,
  deleteByFolder,
};