import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PromoApp } from "@/components/promo-app";
import { HEROES, isHeroId } from "@/lib/heroes";
import { readCounts } from "@/lib/store";
import type { Counts } from "@/lib/vote-rules";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hero: string }>;
}): Promise<Metadata> {
  const { hero } = await params;
  if (!isHeroId(hero)) {
    return { title: { absolute: "Битва моторов" } };
  }
  const data = HEROES[hero];
  return {
    title: { absolute: `${data.name} — Битва моторов` },
    description: data.shareText,
    openGraph: {
      title: "Битва моторов",
      description: data.shareText,
      images: [{ url: data.og, width: 1200, height: 630, alt: data.name }],
      locale: "ru_RU",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Битва моторов",
      description: data.shareText,
      images: [data.og],
    },
  };
}

export default async function FriendPage({
  params,
}: {
  params: Promise<{ hero: string }>;
}) {
  const { hero } = await params;
  if (!isHeroId(hero)) redirect("/");
  let stats: Counts | null = null;
  try {
    stats = await readCounts();
  } catch {
    stats = null;
  }
  return <PromoApp initialStats={stats} mode="friend" friendHero={hero} />;
}
