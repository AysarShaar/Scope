import { useState, useRef } from 'react';
import { prepareImageForUpload } from '../../../lib/prepareImageForUpload';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Uploads a picked image to /api/upload and reports the resulting URL through `onUploaded`. */
export function useImageUpload(
  onUploaded: (url: string, key?: string) => void,
  {
    failureMessage = 'فشل رفع الصورة إلى الخادم',
    getTitle,
  }: { failureMessage?: string; getTitle?: () => string } = {},
) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    customHint?: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_BYTES) {
      setUploadError('حجم الصورة يجب ألا يتجاوز 10 ميجابايت');
      return;
    }

    setIsUploadingImage(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', await prepareImageForUpload(file));

      const hint = (typeof customHint === 'string' ? customHint : (getTitle ? getTitle() : ''))?.trim();
      if (hint) {
        formData.append('title', hint);
      }

      const res = await fetch('/api/upload', { method: 'POST', body: formData });

      const data = await res.json().catch(() => null);
      if (res.ok && (data?.url || data?.secure_url)) {
        onUploaded(data.url || data.secure_url, data?.key);
      } else {
        setUploadError(data?.error || failureMessage);
      }
    } catch {
      setUploadError('حدث خطأ أثناء الاتصال بالخادم لرفع الصورة');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return { isUploadingImage, uploadError, setUploadError, fileInputRef, handleFileUpload };
}
