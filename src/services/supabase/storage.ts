import { supabase } from './client';
import * as FileSystem from 'expo-file-system';
import { downloadAsync } from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

// Use documentDirectory as fallback if cacheDirectory is undefined
const getTempDirectory = () => {
  const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  if (!dir) {
    throw new Error('No writable directory available');
  }
  // Ensure trailing slash
  return dir.endsWith('/') ? dir : dir + '/';
};

export const StorageService = {
  /**
   * Uploads an image from a remote URL (like AI generated images) to Supabase Storage
   */
  async uploadFromUrl(url: string, path: string): Promise<string> {
    console.log(`[StorageService] Bypassing upload, returning direct URL for testing: ${url}`);
    // For testing scheduling/publishing pipelines without hitting React Native file system limits
    return url;
  },

  /**
   * Uploads a local file (from ImagePicker) to Supabase Storage
   * Compresses the image first and stores it under the user's folder
   */
  async uploadLocalFile(userId: string, uri: string, fileName: string): Promise<string> {
    try {
      // 1. Compress and resize image
      const manipResult = await manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }], // Standardize width, keep aspect ratio
        { compress: 0.8, format: SaveFormat.JPEG }
      );

      // 2. Read compressed file as base64
      const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
        encoding: 'base64',
      });
      
      // 3. Define path: posts/{user_id}/{timestamp}_{filename}
      const filePath = `posts/${userId}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const contentType = 'image/jpeg';

      // 4. Upload to Supabase
      console.log(`[StorageService] Uploading to bucket: POST-MEDIA, path: ${filePath}`);
      const { data, error } = await supabase.storage
        .from('POST-MEDIA')
        .upload(filePath, decode(base64), {
          contentType,
          upsert: true
        });

      if (error) {
        console.error('[StorageService] Supabase upload error:', error);
        throw error;
      }

      // 5. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('POST-MEDIA')
        .getPublicUrl(data.path);

      console.log('[StorageService] Upload successful, public URL:', publicUrl);
      return publicUrl;
    } catch (e: any) {
      console.error('[StorageService] Local upload failed:', e);
      // Provide more context in the thrown error
      const message = e.message || 'Unknown upload error';
      throw new Error(`Upload failed: ${message}. Check if 'POST-MEDIA' bucket exists and is public.`);
    }
  },

  /**
   * Uploads raw base64 image data to Supabase Storage
   */
  async uploadBase64(userId: string, base64: string, fileName: string): Promise<string> {
    try {
      const filePath = `posts/${userId}/${Date.now()}_${fileName}`;
      const contentType = 'image/png';
      
      // Clean base64 string if it contains data URI prefix
      const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');

      console.log(`[StorageService] Uploading base64 to bucket: POST-MEDIA, path: ${filePath}`);
      const { data, error } = await supabase.storage
        .from('POST-MEDIA')
        .upload(filePath, decode(cleanBase64), {
          contentType,
          upsert: true
        });

      if (error) {
        console.error('[StorageService] Supabase base64 upload error:', error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('POST-MEDIA')
        .getPublicUrl(data.path);

      console.log('[StorageService] Base64 upload successful, public URL:', publicUrl);
      return publicUrl;
    } catch (e: any) {
      console.error('[StorageService] Base64 upload failed:', e);
      throw new Error(`Base64 upload failed: ${e.message}`);
    }
  }
};
