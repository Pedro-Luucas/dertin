import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const bucket = formData.get("bucket") as string | null;
  const customPath = formData.get("path") as string | null;
  const eventId = formData.get("event_id") as string | null;
  const userId = formData.get("user_id") as string | null;
  const position = formData.get("position") as string | null;

  if (!file) {
    console.error("[POST /api/upload] No file provided");
    return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const targetBucket = bucket || "profile-photos";
  const path = customPath || `${eventId}/${userId}/${position}-${Date.now()}.jpg`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(targetBucket)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("[POST /api/upload] Storage upload error:", uploadError.message);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(targetBucket)
    .getPublicUrl(path);

  if (targetBucket === "event-covers" || bucket === "event-covers") {
    return NextResponse.json({ url: urlData.publicUrl });
  }

  if (!userId) {
    console.error("[POST /api/upload] Missing user_id for profile photo");
    return NextResponse.json({ error: "user_id obrigatório" }, { status: 400 });
  }

  const { data: photo, error: photoError } = await supabaseAdmin
    .from("profile_photos")
    .insert({
      event_user_id: userId,
      photo_url: urlData.publicUrl,
      position: parseInt(position || "0"),
    })
    .select()
    .single();

  if (photoError) {
    console.error("[POST /api/upload] Photo record insert error:", photoError.message);
    return NextResponse.json({ error: photoError.message }, { status: 500 });
  }

  return NextResponse.json({ photo });
}
