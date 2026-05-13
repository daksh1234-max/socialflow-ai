import { supabase } from './client';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export const StorageService = {
  /**
   * Uploads an image from a remote URL (like AI generated images) to Supabase Storage
   */
  async uploadFromUrl(url: string, path: string): Promise<string> {
    try {
      // 1. Download the image as base64
      const response = await fetch(url);
      const blob = await response.blob();
      
      // 2. Upload to Supabase
      const { data, error } = await supabase.storage
        .from('post-media')
        .upload(path, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/png'
        });

      if (error) throw error;

      // 3. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('post-media')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (e) {
      console.error('Upload from URL failed:', e);
      throw e;
    }
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
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // 3. Define path: posts/{user_id}/{timestamp}_{filename}
      const filePath = `posts/${userId}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const contentType = 'image/jpeg';

      // 4. Upload to Supabase
      const { data, error } = await supabase.storage
        .from('post-media')
        .upload(filePath, decode(base64), {
          contentType,
          upsert: true
        });

      if (error) throw error;

      // 5. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('post-media')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (e) {
      console.error('Local upload failed:', e);
      throw e;
    }
  }
};
