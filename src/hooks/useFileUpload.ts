import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

export function useFileUpload() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File): Promise<UploadedFile | null> => {
    if (!user) return null;

    setUploading(true);
    setProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      setProgress(100);
      return {
        name: file.name,
        url: publicUrl,
        size: file.size,
        type: file.type,
      };
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const uploadMultiple = async (files: File[]): Promise<UploadedFile[]> => {
    const results: UploadedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const result = await uploadFile(files[i]);
      if (result) results.push(result);
      setProgress(((i + 1) / files.length) * 100);
    }
    return results;
  };

  const deleteFile = async (url: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const path = url.split('/attachments/')[1];
      if (!path) return false;

      const { error } = await supabase.storage
        .from('attachments')
        .remove([path]);

      return !error;
    } catch {
      return false;
    }
  };

  return {
    uploadFile,
    uploadMultiple,
    deleteFile,
    uploading,
    progress,
  };
}
