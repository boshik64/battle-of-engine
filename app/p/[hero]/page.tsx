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
    alternates: { canonical: `/p/${hero}` },
    openGraph: {
      title: data.shareText,
      description: "А с кем отправишься ты?",
      url: `/p/${hero}`,
      images: [
        {
          url: data.og,
          width: 1200,
          height: 630,
          alt: `${data.actor}, ${data.name}`,
        },
      ],
      locale: "ru_RU",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: data.shareText,
      description: "А с кем отправишься ты?",
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
