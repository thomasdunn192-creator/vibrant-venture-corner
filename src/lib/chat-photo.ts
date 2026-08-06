import { supabase } from "@/integrations/supabase/client";

/** Reads a photo into a base64 data URL so it can be sent to the AI. */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
}

function extensionFor(file: File): string {
  const match = /\.(jpe?g|png|webp|heic|heif)$/i.exec(file.name);
  if (match) return match[1]!.toLowerCase();
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/heic" || file.type === "image/heif") return "heic";
  return "jpg";
}

/**
 * Stores a chat photo for the signed-in user under `<user id>/...`, matching the
 * chat-photos bucket RLS policies. Returns null when nobody is signed in — guest
 * photos are never persisted, they only go to the AI for that single message.
 */
export async function uploadChatPhoto(file: File): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return null;

  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const path = `${userId}/${id}.${extensionFor(file)}`;

  const { error } = await supabase.storage.from("chat-photos").upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
}
