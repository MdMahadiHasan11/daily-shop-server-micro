import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { DirectFileUploader } from "../../helper/directFileUploader";

const uploadSingle = catchAsync(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    throw new Error("No file uploaded");
  }
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "File uploaded successfully",
    data: {
      url: (file as any).path,
      public_id: (file as any).filename,
    },
  });
});

const uploadMultiple = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    throw new Error("No files uploaded");
  }
  const fileData = files.map((file) => ({
    url: (file as any).path,
    public_id: (file as any).filename,
  }));

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Files uploaded successfully",
    data: fileData,
  });
});

const uploadPdf = catchAsync(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    throw new Error("No PDF uploaded");
  }
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "PDF uploaded successfully",
    data: {
      url: (file as any).path,
      public_id: (file as any).filename,
    },
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const rawValue = req.query.public_id || req.query.url;

  const targetValue =
    typeof rawValue === "string"
      ? rawValue
      : Array.isArray(rawValue)
      ? (rawValue[0] as string)
      : undefined;

  if (!targetValue) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Public ID or URL is required in query parameters",
      data: null,
    });
  }

  const deleteResult = await DirectFileUploader.deleteImageFromCloudinary(targetValue);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "File deleted successfully",
    data: deleteResult,
  });
});

const deleteFolder = catchAsync(async (req: Request, res: Response) => {
  const rawFolder = req.params.folder;

  // TypeScript string | string[] type safety check
  const folderName =
    typeof rawFolder === "string"
      ? rawFolder
      : Array.isArray(rawFolder)
      ? (rawFolder[0] as string)
      : undefined;

  if (!folderName) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Folder name is required",
      data: null,
    });
  }

  const result = await DirectFileUploader.deleteByFolder(folderName);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Folder '${folderName}' resources deleted successfully`,
    data: result,
  });
});

export const filesController = {
  uploadSingle,
  uploadMultiple,
  uploadPdf,
  deleteById,
  deleteFolder,
};