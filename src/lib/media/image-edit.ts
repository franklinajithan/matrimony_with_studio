import type { Area } from "react-easy-crop";

export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.crossOrigin = "anonymous";
    image.src = src;
  });
}

export async function cropImageToBlob(
  imageSrc: string,
  crop: Area,
  options?: { size?: number; mimeType?: string; quality?: number }
): Promise<Blob> {
  const size = options?.size ?? 1024;
  const mimeType = options?.mimeType ?? "image/jpeg";
  const quality = options?.quality ?? 0.92;
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare the photo editor.");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, size, size);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Could not crop that photo."));
        else resolve(blob);
      },
      mimeType,
      quality
    );
  });
}
