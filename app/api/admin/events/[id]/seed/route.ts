import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// ============================================================================
// Pools de dados
// ============================================================================

const MALE_NAMES = [
  "Lucas", "Gabriel", "Pedro", "Rafael", "Matheus", "Bruno", "Thiago",
  "Felipe", "Gustavo", "André", "João", "Vitor", "Caio", "Diego", "Henrique",
  "Leonardo", "Murilo", "Otávio", "Renato", "Igor", "Davi", "Eduardo",
];
const FEMALE_NAMES = [
  "Julia", "Maria", "Ana", "Beatriz", "Larissa", "Camila", "Fernanda",
  "Isabela", "Letícia", "Mariana", "Carolina", "Bianca", "Helena", "Sophia",
  "Manuela", "Valentina", "Gabriela", "Yasmin", "Laura", "Rafaela", "Clara",
];

const SHORT_BIOS = [
  "Curtindo a noite 🎶",
  "Bora trocar ideia?",
  "Solteiro(a) e pronto pra festa",
  "Me chama pra dançar",
  "Só vim pela música",
  "Primeira vez aqui 👀",
  "Aqui pra conhecer gente nova",
];

const LONG_BIOS = [
  "Engenheiro de software de dia, DJ amador de noite. Apaixonado por música eletrônica, viagens e boas conversas. Se você curte cinema cult e cerveja artesanal, manda DM 🍻",
  "Designer, viciada em café e em descobrir bares novos pela cidade. Adoro um rolê espontâneo, festival de música e gente que sabe rir de si mesma.",
  "Médica residente, mas hoje tô só aqui pra esquecer o plantão. Curto tatuagem, vinil e gatos. Procurando alguém que topa um rolê às 3 da manhã.",
  "Sócio de uma cafeteria no centro. Maratono séries, jogo basquete aos domingos e nunca digo não a um sushi. Vamos conversar?",
  "Estudante de arquitetura, fotógrafa nas horas vagas. Apaixonada por viagens de mochila, plantas e qualquer lugar com vista pro mar.",
  "Personal trainer e nutricionista. Curto trilha, surf e um happy hour bem feito. Sapiosexual confessa.",
  "Publicitário, escritor de bolso e fã de stand-up. Adoro um plot twist na conversa. Se topa bar de esquina, somos compatíveis.",
];

const DRINKS = [
  "Cerveja", "Gin tônica", "Vodka", "Whisky", "Caipirinha",
  "Água", "Vinho", "Tequila", "Aperol Spritz", "Suco", "Drink sem álcool", "Espumante",
];

// Distribuição realista de sexualidade (Brasil, pesquisas recentes)
const SEXUALITY_WEIGHTS: Array<[string, number]> = [
  ["hetero", 0.7],
  ["bi", 0.18],
  ["homo", 0.08],
  ["pan", 0.04],
];

type Archetype = "enthusiastic" | "shy" | "normal";

// ============================================================================
// Utilidades aleatórias
// ============================================================================

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedPick<T>(pairs: Array<[T, number]>): T {
  const r = Math.random();
  let acc = 0;
  for (const [value, weight] of pairs) {
    acc += weight;
    if (r < acc) return value;
  }
  return pairs[pairs.length - 1][0];
}

// Box-Muller: idade ~ N(24, 4), clamp em [18, 45]
function randomAge(): number {
  const u1 = Math.random() || 1e-9;
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const age = Math.round(24 + z * 4);
  return Math.max(18, Math.min(45, age));
}

function randomArchetype(): Archetype {
  return weightedPick<Archetype>([
    ["normal", 0.5],
    ["enthusiastic", 0.3],
    ["shy", 0.2],
  ]);
}

function instagramHandle(name: string): string {
  const base = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const variants = [
    `@${base}`,
    `@${base}.${Math.floor(Math.random() * 99)}`,
    `@${base}_oficial`,
    `@${base}${Math.floor(Math.random() * 9999)}`,
    `@_${base}_`,
  ];
  return randomItem(variants);
}

// ============================================================================
// Fontes de foto
// ============================================================================

type Gender = "homem" | "mulher";

async function fetchRandomUserPhotos(gender: Gender, count: number): Promise<string[]> {
  if (count <= 0) return [];
  const g = gender === "homem" ? "male" : "female";
  try {
    const res = await fetch(
      `https://randomuser.me/api/?gender=${g}&results=${count}&inc=picture&nat=br,us,es`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`randomuser.me ${res.status}`);
    const data = await res.json();
    return (data.results as Array<{ picture: { large: string } }>).map((r) => r.picture.large);
  } catch (err) {
    console.error("[seed] randomuser.me fetch failed:", err);
    return [];
  }
}

function picsumUrl(seed: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/600/800`;
}

// ============================================================================
// Handler
// ============================================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const url = new URL(req.url);

  // Query params
  const count = Math.max(1, Math.min(100, Number(url.searchParams.get("count")) || 20));
  const genderParam = (url.searchParams.get("gender") || "mixed").toLowerCase();
  const archetypeParam = (url.searchParams.get("archetype") || "mixed").toLowerCase();
  const withSwipes = url.searchParams.get("with_swipes") === "true";

  const { data: event, error: eventError } = await supabaseAdmin
    .from("events")
    .select("id")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    console.error("[POST /api/admin/events/[id]/seed] Event not found:", eventId, eventError?.message);
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  // Distribuição de gênero
  function pickGender(i: number): Gender {
    if (genderParam === "male") return "homem";
    if (genderParam === "female") return "mulher";
    return i % 2 === 0 ? "homem" : "mulher";
  }

  function pickArchetype(): Archetype {
    if (archetypeParam === "enthusiastic") return "enthusiastic";
    if (archetypeParam === "shy") return "shy";
    if (archetypeParam === "normal") return "normal";
    return randomArchetype();
  }

  // Monta usuários
  const maleNamePool = [...MALE_NAMES].sort(() => Math.random() - 0.5);
  const femaleNamePool = [...FEMALE_NAMES].sort(() => Math.random() - 0.5);
  let maleIdx = 0;
  let femaleIdx = 0;

  const userDrafts: Array<{
    insert: {
      event_id: string;
      device_fingerprint: string;
      first_name: string;
      age: number;
      bio: string | null;
      gender: string;
      sexuality: string;
      drink_preference: string;
      instagram: string | null;
    };
    archetype: Archetype;
    gender: Gender;
    photoCount: number;
  }> = [];

  for (let i = 0; i < count; i++) {
    const gender = pickGender(i);
    const archetype = pickArchetype();

    const name =
      gender === "homem"
        ? maleNamePool[maleIdx++ % maleNamePool.length]
        : femaleNamePool[femaleIdx++ % femaleNamePool.length];

    let bio: string | null;
    let instagram: string | null;
    let photoCount: number;
    if (archetype === "shy") {
      bio = null;
      instagram = Math.random() < 0.3 ? instagramHandle(name) : null;
      photoCount = 1;
    } else if (archetype === "enthusiastic") {
      bio = randomItem(LONG_BIOS);
      instagram = instagramHandle(name);
      photoCount = 3 + Math.floor(Math.random() * 2); // 3-4
    } else {
      bio = Math.random() < 0.8 ? randomItem(SHORT_BIOS) : null;
      instagram = Math.random() < 0.7 ? instagramHandle(name) : null;
      photoCount = 1 + Math.floor(Math.random() * 3); // 1-3
    }

    userDrafts.push({
      archetype,
      gender,
      photoCount,
      insert: {
        event_id: eventId,
        device_fingerprint: `seed-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        first_name: name,
        age: randomAge(),
        bio,
        gender,
        sexuality: weightedPick(SEXUALITY_WEIGHTS),
        drink_preference: randomItem(DRINKS),
        instagram,
      },
    });
  }

  // Insere usuários
  const { data: createdUsers, error: insertError } = await supabaseAdmin
    .from("event_users")
    .insert(userDrafts.map((u) => u.insert))
    .select();

  if (insertError || !createdUsers) {
    console.error("[POST /api/admin/events/[id]/seed] Insert error:", insertError?.message);
    return NextResponse.json({ error: insertError?.message || "Erro ao criar usuários" }, { status: 500 });
  }

  // Calcula total de fotos por gênero pra buscar tudo de uma vez no randomuser.me
  // (garante que toda foto de um homem venha de gender=male e toda foto de uma mulher venha de gender=female)
  const maleTotal = userDrafts.filter((u) => u.gender === "homem").reduce((sum, u) => sum + u.photoCount, 0);
  const femaleTotal = userDrafts.filter((u) => u.gender === "mulher").reduce((sum, u) => sum + u.photoCount, 0);
  const [malePhotos, femalePhotos] = await Promise.all([
    fetchRandomUserPhotos("homem", Math.min(maleTotal, 500)),
    fetchRandomUserPhotos("mulher", Math.min(femaleTotal, 500)),
  ]);
  const malePhotoCursor = { i: 0 };
  const femalePhotoCursor = { i: 0 };

  function nextPhoto(gender: Gender, userId: string, slot: number): string {
    const pool = gender === "homem" ? malePhotos : femalePhotos;
    const cursor = gender === "homem" ? malePhotoCursor : femalePhotoCursor;
    if (cursor.i < pool.length) {
      return pool[cursor.i++];
    }
    // Fallback (só usado se a API falhar): picsum não tem rostos mas é estável
    return picsumUrl(`${userId}-${slot}`);
  }

  // Monta fotos por arquétipo
  const photoInserts: Array<{ event_user_id: string; photo_url: string; position: number }> = [];
  createdUsers.forEach((user, idx) => {
    const draft = userDrafts[idx];
    for (let p = 0; p < draft.photoCount; p++) {
      photoInserts.push({
        event_user_id: user.id,
        photo_url: nextPhoto(draft.gender, user.id, p),
        position: p,
      });
    }
  });

  const { error: photoError } = await supabaseAdmin
    .from("profile_photos")
    .insert(photoInserts);

  if (photoError) {
    console.error("[POST /api/admin/events/[id]/seed] Photo insert error:", photoError.message);
  }

  // Swipes + matches opcionais
  let swipesCount = 0;
  let matchesCount = 0;
  if (withSwipes && createdUsers.length > 1) {
    const userIds = createdUsers.map((u) => u.id);
    const swipeRows: Array<{ event_id: string; swiper_id: string; swiped_id: string; direction: string }> = [];
    const rightSwipes = new Map<string, Set<string>>(); // swiper -> set of swiped

    for (const swiper of userIds) {
      const others = userIds.filter((id) => id !== swiper);
      // Cada usuário swipa em ~40-70% dos outros
      const ratio = 0.4 + Math.random() * 0.3;
      const targets = others
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.ceil(others.length * ratio));

      for (const target of targets) {
        // 60% direita, 40% esquerda
        const direction = Math.random() < 0.6 ? "right" : "left";
        swipeRows.push({
          event_id: eventId,
          swiper_id: swiper,
          swiped_id: target,
          direction,
        });
        if (direction === "right") {
          if (!rightSwipes.has(swiper)) rightSwipes.set(swiper, new Set());
          rightSwipes.get(swiper)!.add(target);
        }
      }
    }

    if (swipeRows.length > 0) {
      const { error: swipeError } = await supabaseAdmin.from("swipes").insert(swipeRows);
      if (swipeError) {
        console.error("[POST /api/admin/events/[id]/seed] Swipe insert error:", swipeError.message);
      } else {
        swipesCount = swipeRows.length;
      }
    }

    // Matches: pares com right mútuo (canonical user_a_id < user_b_id)
    const matchPairs = new Set<string>();
    const matchRows: Array<{ event_id: string; user_a_id: string; user_b_id: string }> = [];
    for (const [swiper, targets] of rightSwipes.entries()) {
      for (const target of targets) {
        if (rightSwipes.get(target)?.has(swiper)) {
          const [a, b] = swiper < target ? [swiper, target] : [target, swiper];
          const key = `${a}:${b}`;
          if (!matchPairs.has(key)) {
            matchPairs.add(key);
            matchRows.push({ event_id: eventId, user_a_id: a, user_b_id: b });
          }
        }
      }
    }

    if (matchRows.length > 0) {
      const { error: matchError } = await supabaseAdmin.from("matches").insert(matchRows);
      if (matchError) {
        console.error("[POST /api/admin/events/[id]/seed] Match insert error:", matchError.message);
      } else {
        matchesCount = matchRows.length;
      }
    }
  }

  console.log(
    `[POST /api/admin/events/[id]/seed] Seeded ${createdUsers.length} users, ${photoInserts.length} photos, ${swipesCount} swipes, ${matchesCount} matches`
  );

  return NextResponse.json({
    count: createdUsers.length,
    photos: photoInserts.length,
    swipes: swipesCount,
    matches: matchesCount,
  });
}
