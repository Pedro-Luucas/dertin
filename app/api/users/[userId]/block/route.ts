import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const body = await req.json();
  const { blocked_id } = body;

  if (!blocked_id) {
    console.error("[POST /api/users/[userId]/block] Missing blocked_id");
    return NextResponse.json({ error: "blocked_id obrigatório" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("blocked_users")
    .insert({ blocker_id: userId, blocked_id });

  if (error) {
    console.error("[POST /api/users/[userId]/block] Insert error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
