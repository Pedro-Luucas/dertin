import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: event, error: eventError } = await supabaseAdmin
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (eventError || !event) {
    console.error("[GET /api/admin/events/[id]] Event not found:", id, eventError?.message);
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const { data: users } = await supabaseAdmin
    .from("event_users")
    .select("*")
    .eq("event_id", id)
    .order("created_at", { ascending: false });

  const { count: swipeCount } = await supabaseAdmin
    .from("swipes")
    .select("*", { count: "exact", head: true })
    .eq("event_id", id);

  const { count: matchCount } = await supabaseAdmin
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("event_id", id);

  return NextResponse.json({
    event,
    users: users || [],
    stats: {
      users: users?.length || 0,
      swipes: swipeCount || 0,
      matches: matchCount || 0,
    },
  });
}
