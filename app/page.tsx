import type { Metadata } from "next";
import { PromoApp } from "@/components/promo-app";
import { readCounts } from "@/lib/store";
import type { Counts } from "@/lib/vote-rules";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Битва моторов — выбери попутчика" },
  description:
    "Выбирай попутчика и зови друзей — посмотрим, с кем поедет больше зрителей.",
  openGraph: {
    title: "Битва моторов",
    description:
      "Выбирай попутчика и зови друзей — посмотрим, с кем поедет больше зрителей.",
    images: [{ url: "/og/home.jpg", width: 1200, height: 630, alt: "Битва моторов" }],
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Битва моторов",
    description:
      "Выбирай попутчика и зови друзей — посмотрим, с кем поедет больше зрителей.",
    images: ["/og/home.jpg"],
  },
};

export default async function Page() {
  let stats: Counts | null = null;
  try {
    stats = await readCounts();
  } catch {
    stats = null;
  }
  return <PromoApp initialStats={stats} mode="start" />;
}
