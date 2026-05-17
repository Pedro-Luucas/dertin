import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  const eventId = searchParams.get("eventId");

  if (!userId || !eventId) {
    console.error("[GET /api/matches] Missing userId or eventId");
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const { data: matchRows, error } = await supabaseAdmin
    .from("matches")
    .select("*")
    .eq("event_id", eventId)
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/matches] Query error:", error.message);
    return NextResponse.json({ matches: [] });
  }

  if (!matchRows || matchRows.length === 0) {
    return NextResponse.json({ matches: [] });
  }

  const otherUserIds = matchRows.map((m) =>
    m.user_a_id === userId ? m.user_b_id : m.user_a_id
  );

  const { data: users } = await supabaseAdmin
    .from("event_users")
    .select("*")
    .in("id", otherUserIds);

  const { data: photos } = await supabaseAdmin
    .from("profile_photos")
    .select("*")
    .in("event_user_id", otherUserIds)
    .order("position");

  const matches = matchRows
    .map((match) => {
      const otherId = match.user_a_id === userId ? match.user_b_id : match.user_a_id;
      const user = users?.find((u) => u.id === otherId);
      if (!user) return null;
      const userPhotos = photos?.filter((p) => p.event_user_id === otherId) || [];
      return { ...match, other_user: { ...user, photos: userPhotos } };
    })
    .filter(Boolean);

  return NextResponse.json({ matches });
}
