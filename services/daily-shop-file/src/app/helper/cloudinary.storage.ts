// import multer from "multer";
// import { CloudinaryStorage } from "multer-storage-cloudinary";
// import { cloudinaryUploadConfig } from "../../config/cloudinary.config";

// const createStorage = (folder: string) =>
//   new CloudinaryStorage({
//     cloudinary: cloudinaryUploadConfig,
//     params: async (_req, file) => {
//       const fileName = file.originalname
//         .toLowerCase()
//         .replace(/\s+/g, "-")
//         .replace(/\./g, "-")
//         .replace(/[^a-z0-9\-]/g, "");

//       return {
//         folder,
//         public_id: `${folder}/${fileName}-${Date.now()}`, // 🔥 IMPORTANT FIX
//       };
//     },
//   });
// // Image upload
// export const uploadImage = multer({
//   storage: createStorage("images"),
// });

// // PDF upload
// export const uploadPdf = multer({
//   storage: createStorage("pdf"),
// });
