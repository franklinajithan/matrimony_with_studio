
import { ref, uploadBytes, getDownloadURL, UploadResult } from "firebase/storage";
import { storage } from "./config"; // Your Firebase storage instance

/**
 * Uploads a file to Firebase Storage.
 * @param file The file to upload.
 * @param path The path in Firebase Storage where the file should be saved (e.g., 'users/uid/profile.jpg').
 * @returns A promise that resolves with the download URL of the uploaded file.
 */
export const uploadFile = async (file: File, path: string): Promise<string> => {
  if (!file) {
    throw new Error("No file provided for upload.");
  }
  if (!path) {
    throw new Error("No path provided for upload.");
  }

  const storageRef = ref(storage, path);
  
  try {
    const snapshot: UploadResult = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    // Consider how to handle this error in your UI, e.g., by re-throwing or returning a specific error object
    throw new Error(`Failed to upload file to ${path}.`);
  }
};
