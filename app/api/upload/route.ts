import { NextRequest, NextResponse } from "next/server";
import { getCloudflareEnv } from "../../../lib/cloudflare";
import { authenticateRequest } from "../../../lib/auth";
import { optimizeCloudinaryUrl } from "../../../lib/cloudinary";
import { errorMessage } from '../../../lib/errors';
import {
  IMAGE_CACHE_CONTROL,
  buildImageKey,
  detectImageType,
  getImagesBaseUrl,
  publicImageUrl,
} from '../../../lib/imageStorage';

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const uploadRateMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_UPLOADS_PER_WINDOW = 15;

function checkUploadRateLimit(key: string): boolean {
  const now = Date.now();
  if (uploadRateMap.size > 200) {
    for (const [k, times] of uploadRateMap.entries()) {
      const active = times.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
      if (active.length === 0) {
        uploadRateMap.delete(k);
      } else {
        uploadRateMap.set(k, active);
      }
    }
  }

  const timestamps = (uploadRateMap.get(key) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  if (timestamps.length >= MAX_UPLOADS_PER_WINDOW) {
    return false;
  }
  timestamps.push(now);
  uploadRateMap.set(key, timestamps);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const env = getCloudflareEnv();
    const auth = await authenticateRequest(request, env);

    if (!auth.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "غير مصرح: يجب تسجيل الدخول للتمكن من رفع الصور",
        },
        { status: 401 },
      );
    }

    const rateLimitKey = auth.editorId || auth.email || "anonymous";
    if (!checkUploadRateLimit(rateLimitKey)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "تم تجاوز الحد المسموح لرفع الصور (الحد الأقصى 15 صورة/دقيقة). يرجى الانتظار قليلاً والمحاولة مجدداً.",
        },
        { status: 429 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { success: false, error: "لم يتم إرفاق ملف صورة للرفع" },
        { status: 400 },
      );
    }

    const blob = file as Blob;
    if (blob.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: "حجم الصورة كبير جداً، الحد الأقصى المسموح به هو 10 ميجابايت",
        },
        { status: 400 },
      );
    }

    if (blob.type && !ALLOWED_MIME_TYPES.has(blob.type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "نوع الملف غير مدعوم. يرجى رفع صورة بصيغة (JPEG, PNG, WebP, GIF, AVIF)",
        },
        { status: 400 },
      );
    }

    const detected = await detectImageType(blob);
    if (!detected) {
      return NextResponse.json(
        {
          success: false,
          error: "الملف المرفوع غير صالح أو لا يحتوي على بنية صورة مدعومة.",
        },
        { status: 400 },
      );
    }

    if (env?.IMAGES) {
      const key = buildImageKey(detected.ext);
      await env.IMAGES.put(key, await blob.arrayBuffer(), {
        httpMetadata: {
          contentType: detected.mime,
          cacheControl: IMAGE_CACHE_CONTROL,
        },
      });

      return NextResponse.json({
        success: true,
        url: publicImageUrl(getImagesBaseUrl(), key),
        key,
        format: detected.ext,
        bytes: blob.size,
      });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName) {
      return NextResponse.json(
        {
          success: false,
          error: "خدمة الرفع السحابي تتطلب ضبط أسرار Cloudinary في متغيرات البيئة.",
        },
        { status: 500 },
      );
    }

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append("file", file);
    cloudinaryFormData.append("folder", "scope_media_articles");

    const timestamp = Math.round(Date.now() / 1000);

    if (apiKey && apiSecret) {
      const stringToSign = `folder=scope_media_articles&timestamp=${timestamp}${apiSecret}`;
      const msgBuffer = new TextEncoder().encode(stringToSign);
      const hashBuffer = await crypto.subtle.digest("SHA-1", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const signature = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      cloudinaryFormData.append("api_key", apiKey);
      cloudinaryFormData.append("timestamp", timestamp.toString());
      cloudinaryFormData.append("signature", signature);
    } else if (uploadPreset) {
      cloudinaryFormData.append("upload_preset", uploadPreset);
    } else {
      return NextResponse.json(
        {
          success: false,
          error:
            "يرجى توفير إما CLOUDINARY_UPLOAD_PRESET أو (CLOUDINARY_API_KEY و CLOUDINARY_API_SECRET) في الخادم.",
        },
        { status: 500 },
      );
    }

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const res = await fetch(cloudinaryUrl, {
      method: "POST",
      body: cloudinaryFormData,
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      return NextResponse.json(
        {
          success: false,
          error: data.error?.message || "فشل الرفع إلى خوادم Cloudinary.",
          details: data,
        },
        { status: 400 },
      );
    }

    const rawUrl = data.secure_url || data.url;
    return NextResponse.json({
      success: true,
      url: optimizeCloudinaryUrl(rawUrl),
      publicId: data.public_id,
      width: data.width,
      height: data.height,
      format: data.format,
      bytes: data.bytes,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: errorMessage(error) || "خطأ أثناء معالجة رفع الصورة" },
      { status: 500 },
    );
  }
}
