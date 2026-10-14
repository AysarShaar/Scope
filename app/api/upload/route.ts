import { NextRequest, NextResponse } from "next/server";
import { getCloudflareEnv } from "../../../lib/cloudflare";
import { authenticateRequest } from "../../../lib/auth";
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

    if (!env?.IMAGES) {
      return NextResponse.json(
        {
          success: false,
          error: "خدمة تخزين الصور غير مهيأة: يرجى تفعيل مستودع R2 (IMAGES) في Cloudflare.",
        },
        { status: 503 },
      );
    }

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
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: errorMessage(error) || "خطأ أثناء معالجة رفع الصورة" },
      { status: 500 },
    );
  }
}
