import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { event_id, swiper_id, swiped_id, direction } = body;

  if (!event_id || !swiper_id || !swiped_id || !direction) {
    console.error("[POST /api/swipes] Missing fields:", body);
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const { error: swipeError } = await supabaseAdmin
    .from("swipes")
    .insert({ event_id, swiper_id, swiped_id, direction });

  if (swipeError) {
    console.error("[POST /api/swipes] Insert error:", swipeError.message);
    return NextResponse.json({ error: swipeError.message }, { status: 400 });
  }

  let match = null;

  if (direction === "right") {
    const { data: reciprocal } = await supabaseAdmin
      .from("swipes")
      .select("id")
      .eq("swiper_id", swiped_id)
      .eq("swiped_id", swiper_id)
      .eq("direction", "right")
      .single();

    if (reciprocal) {
      const [userA, userB] =
        swiper_id < swiped_id ? [swiper_id, swiped_id] : [swiped_id, swiper_id];

      const { data: newMatch, error: matchError } = await supabaseAdmin
        .from("matches")
        .insert({ event_id, user_a_id: userA, user_b_id: userB })
        .select()
        .single();

      if (matchError) {
        console.error("[POST /api/swipes] Match creation error:", matchError.message);
      } else {
        match = newMatch;
        console.log("[POST /api/swipes] Match created:", match.id);
      }
    }
  }

  return NextResponse.json({ match });
}
