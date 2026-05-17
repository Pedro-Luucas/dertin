import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

const MALE_NAMES = ["Lucas", "Gabriel", "Pedro", "Rafael", "Matheus", "Bruno", "Thiago", "Felipe", "Gustavo", "André"];
const FEMALE_NAMES = ["Julia", "Maria", "Ana", "Beatriz", "Larissa", "Camila", "Fernanda", "Isabela", "Letícia", "Mariana"];
const BIOS = [
  "Curtindo a noite 🎶",
  "Aqui pra conhecer gente nova",
  "Dançar é meu cardio",
  "Só vim pela música",
  "Bora trocar ideia?",
  "Primeira vez aqui 👀",
  "Adoro um open bar",
  "Solteiro(a) e pronto pra festa",
  "Me chama pra dançar",
  "Vim com amigos mas quero mais",
];
const DRINKS = ["Cerveja", "Gin tônica", "Vodka", "Whisky", "Caipirinha", "Água", "Vinho", "Tequila", "Aperol", "Suco"];
const SEXUALITIES = ["hetero", "bi", "homo", "pan"];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAge(): number {
  return Math.floor(Math.random() * 12) + 20;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;

  const { data: event, error: eventError } = await supabaseAdmin
    .from("events")
    .select("id")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    console.error("[POST /api/admin/events/[id]/seed] Event not found:", eventId, eventError?.message);
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const users: Array<{
    event_id: string;
    device_fingerprint: string;
    first_name: string;
    age: number;
    bio: string;
    gender: string;
    sexuality: string;
    drink_preference: string;
    instagram: string;
  }> = [];

  for (let i = 0; i < 10; i++) {
    users.push({
      event_id: eventId,
      device_fingerprint: `seed-male-${i}-${Date.now()}`,
      first_name: MALE_NAMES[i],
      age: randomAge(),
      bio: randomItem(BIOS),
      gender: "homem",
      sexuality: randomItem(SEXUALITIES),
      drink_preference: randomItem(DRINKS),
      instagram: `@${MALE_NAMES[i].toLowerCase()}${Math.floor(Math.random() * 99)}`,
    });
  }

  for (let i = 0; i < 10; i++) {
    users.push({
      event_id: eventId,
      device_fingerprint: `seed-female-${i}-${Date.now()}`,
      first_name: FEMALE_NAMES[i],
      age: randomAge(),
      bio: randomItem(BIOS),
      gender: "mulher",
      sexuality: randomItem(SEXUALITIES),
      drink_preference: randomItem(DRINKS),
      instagram: `@${FEMALE_NAMES[i].toLowerCase()}${Math.floor(Math.random() * 99)}`,
    });
  }

  const { data: createdUsers, error: insertError } = await supabaseAdmin
    .from("event_users")
    .insert(users)
    .select();

  if (insertError) {
    console.error("[POST /api/admin/events/[id]/seed] Insert error:", insertError.message);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Add placeholder photos using picsum
  const photoInserts = (createdUsers || []).flatMap((user) => {
    const count = Math.floor(Math.random() * 3) + 1;
    return Array.from({ length: count }, (_, i) => ({
      event_user_id: user.id,
      photo_url: `https://picsum.photos/seed/${user.id}-${i}/400/600`,
      position: i,
    }));
  });

  const { error: photoError } = await supabaseAdmin
    .from("profile_photos")
    .insert(photoInserts);

  if (photoError) {
    console.error("[POST /api/admin/events/[id]/seed] Photo insert error:", photoError.message);
  }

  console.log(`[POST /api/admin/events/[id]/seed] Seeded ${createdUsers?.length} users with photos`);
  return NextResponse.json({ count: createdUsers?.length || 0 });
}
