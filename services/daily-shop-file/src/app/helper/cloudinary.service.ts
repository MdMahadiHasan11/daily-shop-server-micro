import { cloudinaryUploadConfig } from "../../config/cloudinary.config";
import ApiError from "../errors/ApiError";

/**
 * DELETE SINGLE FILE (image/pdf)
 */
const deleteFile = async (publicId: string) => {
  try {
    const result = await cloudinaryUploadConfig.uploader.destroy(publicId, {
      resource_type: "image", // auto works in most cases
    });

    return result;
  } catch (error: any) {
    throw new ApiError(400, "Failed to delete file");
  }
};

/**
 * DELETE BY URL (extract public_id)
 */
const deleteByUrl = async (url: string) => {
  const match = url.match(
    /upload\/(?:v\d+\/)?(.+)\.(jpg|jpeg|png|gif|webp|pdf)$/i,
  );

  if (!match) {
    throw new Error("Invalid Cloudinary URL");
  }

  const publicId = match[1];

  // detect file type
  const isPdf = url.includes("/pdf/");

  return await cloudinaryUploadConfig.uploader.destroy(publicId, {
    resource_type: isPdf ? "raw" : "image",
  });
};

/**
 * DELETE ALL FILES IN FOLDER
 */
const deleteByFolder = async (folder: string) => {
  try {
    const prefix = folder.replace(/\/$/, ""); // remove trailing slash if any

    const result =
      await cloudinaryUploadConfig.api.delete_resources_by_prefix(prefix);

    return result;
  } catch (error: any) {
    throw new ApiError(400, `Failed to delete folder: ${folder}`);
  }
};

export const CloudinaryService = {
  deleteFile,
  deleteByUrl,
  deleteByFolder,
};
