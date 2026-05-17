import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { data: event, error } = await supabaseAdmin
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) {
    console.error("[GET /api/events/[slug]] Error fetching event:", error.message);
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const now = new Date();
  const endsAt = new Date(event.ends_at);
  if (endsAt < now) {
    console.error("[GET /api/events/[slug]] Event expired:", slug);
    return NextResponse.json({ error: "Evento encerrado" }, { status: 410 });
  }

  return NextResponse.json({ event });
}
