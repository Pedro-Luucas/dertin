import { supabaseAdmin } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import { EventLanding } from "./event-landing";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;

  const { data: event, error } = await supabaseAdmin
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !event) {
    console.error("[EventPage] Event not found:", slug, error?.message);
    notFound();
  }

  const now = new Date();
  const endsAt = new Date(event.ends_at);
  if (endsAt < now) {
    console.error("[EventPage] Event expired:", slug);
    notFound();
  }

  return <EventLanding event={event} />;
}
