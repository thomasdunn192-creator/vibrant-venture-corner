export const MAX_MESSAGE_LENGTH = 1500;

/** Max photo upload size for the AI chat (5MB). */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const ACCEPTED_IMAGE_ACCEPT_ATTR =
  ".jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif";

/** Base64 data URLs are ~1.37x the raw byte size, plus room for the prefix. */
export const MAX_IMAGE_DATA_URL_LENGTH = Math.ceil(MAX_IMAGE_BYTES * 1.4) + 100;

export function validateImageFile(file: File): string | null {
  const name = file.name.toLowerCase();
  const extOk = /\.(jpe?g|png|webp|heic|heif)$/.test(name);
  const typeOk = (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type);
  if (!typeOk && !extOk) {
    return "Unsupported file type. Please use a JPG, PNG, WEBP, or HEIC image.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "That photo is too large. Please upload an image under 5MB.";
  }
  return null;
}
