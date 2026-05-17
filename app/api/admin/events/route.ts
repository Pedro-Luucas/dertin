import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/admin/events] Query error:", error.message);
    return NextResponse.json({ events: [] });
  }

  return NextResponse.json({ events: data || [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, slug, venue_name, starts_at, ends_at, cover_image_url } = body;

  if (!title || !slug || !venue_name || !starts_at || !ends_at) {
    console.error("[POST /api/admin/events] Missing fields:", body);
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const { data: event, error } = await supabaseAdmin
    .from("events")
    .insert({
      title,
      slug,
      venue_name,
      starts_at,
      ends_at,
      cover_image_url: cover_image_url || null,
    })
    .select()
    .single();

  if (error) {
    console.error("[POST /api/admin/events] Insert error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  console.log("[POST /api/admin/events] Event created:", event.id, event.slug);
  return NextResponse.json({ event });
}
