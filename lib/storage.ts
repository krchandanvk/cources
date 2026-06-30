import { supabase, isSupabaseConfigured } from "./supabase";

export type BucketName = "pdfs" | "certificates" | "thumbnails" | "assignments" | "downloads";

/**
 * Uploads a file to a specific Supabase storage bucket
 */
export async function uploadToStorage(
  bucket: BucketName,
  filePath: string,
  fileBody: File | Buffer | ArrayBuffer | Blob,
  contentType?: string
) {
  try {
    if (!isSupabaseConfigured || !supabase) {
      console.warn(`Supabase Storage is not configured. Mocking upload of ${filePath} to bucket: ${bucket}.`);
      return { success: true, path: filePath, publicUrl: `/mock-storage/${bucket}/${filePath}` };
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBody, {
        cacheControl: "3600",
        upsert: true,
        contentType: contentType,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return {
      success: true,
      path: data.path,
      publicUrl: urlData.publicUrl,
    };
  } catch (error: any) {
    console.error(`Error uploading to Supabase Storage (${bucket}):`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Retrieves the public URL of an existing asset in storage
 */
export function getStoragePublicUrl(bucket: BucketName, filePath: string): string {
  if (!isSupabaseConfigured || !supabase) {
    return `/mock-storage/${bucket}/${filePath}`;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Downloads a file from Supabase Storage bucket
 */
export async function downloadFromStorage(bucket: BucketName, filePath: string) {
  try {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error(`Supabase Storage is not configured to download: ${filePath}`);
    }

    const { data, error } = await supabase.storage.from(bucket).download(filePath);
    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error(`Error downloading from Supabase Storage (${bucket}):`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Deletes a file from Supabase Storage bucket
 */
export async function deleteFromStorage(bucket: BucketName, filePath: string) {
  try {
    if (!isSupabaseConfigured || !supabase) {
      console.warn(`Supabase Storage not configured. Mocking delete of ${filePath} from bucket: ${bucket}.`);
      return { success: true };
    }

    const { data, error } = await supabase.storage.from(bucket).remove([filePath]);
    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error(`Error deleting from Supabase Storage (${bucket}):`, error);
    return { success: false, error: error.message };
  }
}
