import path from "path";
import { STORAGE_BUCKET, supabase } from "./supabase.js";

const extractFileName = (fileName: string) => {
  return path.parse(fileName).name;
};

const success = (urls: string[], message = "") => {
  return { success: true, message, urls };
};
const failure = (message = "", urls: string[] = []) => {
  return { success: false, message, urls };
};

export const uploadImages = async (userId: string, postId: string, files: Express.Multer.File[]) => {
  try {
    const uploadPromises = files.map(async (file) => {
      const fileExtension = file.originalname.split(".").pop() || "jpg";
      const fileName = `${userId}/${postId}/${Date.now()}_${crypto.randomUUID()}.${fileExtension}`;

      const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

      if (error) {
        throw error;
      }

      const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);

      return urlData.publicUrl;
    });

    const results = await Promise.allSettled(uploadPromises);
    const successfulUrls: string[] = [];
    const failedReasons: string[] = [];

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        successfulUrls.push(result.value);
      } else {
        failedReasons.push(String(result.reason));
      }
    });

    if (failedReasons.length > 0) {
      return failure(`Some uploads failed: ${failedReasons.join(", ")}`, successfulUrls);
    }

    return success(successfulUrls, "Uploaded successfully");
  } catch (err) {
    console.error("Error in uploadImages:", err);
    return failure(`Error while uploading files: ${err}`);
  }
};
