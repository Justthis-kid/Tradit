export const MAX_SHOE_PHOTO_BYTES = 3 * 1024 * 1024;

const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function readShoePhoto(file) {
  if (!supportedTypes.has(file.type)) {
    return Promise.reject(new Error("Choose a JPEG, PNG, or WebP photo."));
  }

  if (file.size === 0 || file.size > MAX_SHOE_PHOTO_BYTES) {
    return Promise.reject(new Error("Choose a photo under 3 MB."));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("We couldn't read that photo. Please choose another."));
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("We couldn't read that photo. Please choose another."));
        return;
      }
      resolve(reader.result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  });
}
