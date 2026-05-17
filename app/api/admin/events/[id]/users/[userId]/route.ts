import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id, userId } = await params;
  const body = await req.json();

  const { error } = await supabaseAdmin
    .from("event_users")
    .update({ is_banned: body.is_banned })
    .eq("id", userId)
    .eq("event_id", id);

  if (error) {
    console.error("[PATCH /api/admin/events/[id]/users/[userId]] Update error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  console.log(`[PATCH /api/admin/events/[id]/users/[userId]] User ${userId} ban=${body.is_banned}`);
  return NextResponse.json({ success: true });
}
