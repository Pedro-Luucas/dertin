import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const searchParams = req.nextUrl.searchParams;
  const fingerprint = searchParams.get("fingerprint");
  const excludeUserId = searchParams.get("exclude");

  const { data: event, error: eventError } = await supabaseAdmin
    .from("events")
    .select("id")
    .eq("slug", slug)
    .single();

  if (eventError || !event) {
    console.error("[GET /api/events/[slug]/users] Event not found:", slug, eventError?.message);
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  if (fingerprint) {
    const { data: user, error } = await supabaseAdmin
      .from("event_users")
      .select("*")
      .eq("event_id", event.id)
      .eq("device_fingerprint", fingerprint)
      .single();

    if (error) {
      console.error("[GET /api/events/[slug]/users] Fingerprint lookup error:", error.message);
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user: user && !user.is_banned ? user : null });
  }

  if (excludeUserId) {
    // Fetch the requesting user to apply gender/sexuality filtering
    const { data: currentUser } = await supabaseAdmin
      .from("event_users")
      .select("gender, sexuality")
      .eq("id", excludeUserId)
      .single();

    const { data: swipedIds } = await supabaseAdmin
      .from("swipes")
      .select("swiped_id")
      .eq("swiper_id", excludeUserId);

    const { data: blockedIds } = await supabaseAdmin
      .from("blocked_users")
      .select("blocked_id")
      .eq("blocker_id", excludeUserId);

    const excludeIds = [
      excludeUserId,
      ...(swipedIds?.map((s) => s.swiped_id) || []),
      ...(blockedIds?.map((b) => b.blocked_id) || []),
    ];

    let query = supabaseAdmin
      .from("event_users")
      .select("*")
      .eq("event_id", event.id)
      .eq("is_banned", false)
      .not("id", "in", `(${excludeIds.join(",")})`);

    // Gender/sexuality filtering
    // Non-binary users always see everyone, and always appear for everyone
    if (currentUser && currentUser.gender !== "non-binary" && currentUser.gender !== "other") {
      const sexuality = currentUser.sexuality || "heterosexual";

      if (sexuality === "heterosexual") {
        const oppositeGender = currentUser.gender === "male" ? "female" : "male";
        query = query.in("gender", [oppositeGender, "non-binary", "other"]);
      } else if (sexuality === "homosexual") {
        query = query.in("gender", [currentUser.gender, "non-binary", "other"]);
      }
      // bi, pan, other sexualities → no gender filter, show everyone
    }

    const { data: users, error } = await query;

    if (error) {
      console.error("[GET /api/events/[slug]/users] Candidates query error:", error.message);
      return NextResponse.json({ candidates: [] });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ candidates: [] });
    }

    // Fisher-Yates shuffle so the order is independent of registration time
    const shuffledUsers = [...users];
    for (let i = shuffledUsers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledUsers[i], shuffledUsers[j]] = [shuffledUsers[j], shuffledUsers[i]];
    }

    const { data: photos } = await supabaseAdmin
      .from("profile_photos")
      .select("*")
      .in("event_user_id", shuffledUsers.map((u) => u.id))
      .order("position");

    const candidates = shuffledUsers.map((user) => ({
      ...user,
      photos: photos?.filter((p) => p.event_user_id === user.id) || [],
    }));

    return NextResponse.json({ candidates });
  }

  return NextResponse.json({ error: "Missing query params" }, { status: 400 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await req.json();

  const { data: event, error: eventError } = await supabaseAdmin
    .from("events")
    .select("id")
    .eq("slug", slug)
    .single();

  if (eventError || !event) {
    console.error("[POST /api/events/[slug]/users] Event not found:", slug, eventError?.message);
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const { data: user, error } = await supabaseAdmin
    .from("event_users")
    .insert({
      event_id: event.id,
      device_fingerprint: body.device_fingerprint,
      first_name: body.first_name,
      age: body.age,
      bio: body.bio || null,
      gender: body.gender,
      sexuality: body.sexuality || null,
      drink_preference: body.drink_preference || null,
      instagram: body.instagram || null,
      phone_number: body.phone_number || null,
    })
    .select()
    .single();

  if (error) {
    console.error("[POST /api/events/[slug]/users] Insert error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ user });
}
