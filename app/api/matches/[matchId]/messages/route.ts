import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

const MAX_MESSAGES_PER_USER = 5;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const searchParams = req.nextUrl.searchParams;
  const meta = searchParams.get("meta");
  const currentUserId = searchParams.get("currentUserId");

  if (meta === "true" && currentUserId) {
    const { data: match } = await supabaseAdmin
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (!match) {
      console.error("[GET /api/matches/[matchId]/messages] Match not found:", matchId);
      return NextResponse.json({ error: "Match não encontrado" }, { status: 404 });
    }

    const otherId = match.user_a_id === currentUserId ? match.user_b_id : match.user_a_id;

    const { data: user } = await supabaseAdmin
      .from("event_users")
      .select("*")
      .eq("id", otherId)
      .single();

    const { data: photos } = await supabaseAdmin
      .from("profile_photos")
      .select("*")
      .eq("event_user_id", otherId)
      .order("position");

    if (!user) {
      console.error("[GET /api/matches/[matchId]/messages] Other user not found:", otherId);
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ user: { ...user, photos: photos || [] } });
  }

  const { data: messages, error } = await supabaseAdmin
    .from("chat_messages")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[GET /api/matches/[matchId]/messages] Query error:", error.message);
    return NextResponse.json({ messages: [] });
  }

  return NextResponse.json({ messages: messages || [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const body = await req.json();
  const { sender_id, content } = body;

  if (!sender_id || !content) {
    console.error("[POST /api/matches/[matchId]/messages] Missing fields:", body);
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const { count } = await supabaseAdmin
    .from("chat_messages")
    .select("*", { count: "exact", head: true })
    .eq("match_id", matchId)
    .eq("sender_id", sender_id);

  if ((count || 0) >= MAX_MESSAGES_PER_USER) {
    console.error("[POST /api/matches/[matchId]/messages] Message limit reached for user:", sender_id);
    return NextResponse.json({ error: "Limite de mensagens atingido" }, { status: 429 });
  }

  const { data: message, error } = await supabaseAdmin
    .from("chat_messages")
    .insert({ match_id: matchId, sender_id, content })
    .select()
    .single();

  if (error) {
    console.error("[POST /api/matches/[matchId]/messages] Insert error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ message });
}
