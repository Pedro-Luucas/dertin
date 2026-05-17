import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const body = await req.json();
  const { reported_id, event_id, reason } = body;

  if (!reported_id || !event_id || !reason) {
    console.error("[POST /api/users/[userId]/report] Missing fields:", body);
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("reports")
    .insert({ reporter_id: userId, reported_id, event_id, reason });

  if (error) {
    console.error("[POST /api/users/[userId]/report] Insert error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
