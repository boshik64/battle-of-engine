import { HEROES, isHeroId } from "@/lib/heroes";

function escapeAttr(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export async function GET(request: Request, context: { params: Promise<{ hero: string }> }) {
  const { hero } = await context.params;
  if (!isHeroId(hero)) return new Response("Not found", { status: 404 });
  const data = HEROES[hero];
  const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin).replace(/\/$/, "");
  const page = `${origin}/p/${hero}`;
  const image = `${origin}${data.og}`;
  const title = escapeAttr(data.shareText);
  const html = `<!doctype html><html lang="ru"><head>
<meta charset="utf-8">
<title>${title}</title>
<link rel="canonical" href="${page}">
<meta property="og:type" content="website">
<meta property="og:locale" content="ru_RU">
<meta property="og:url" content="${page}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="А с кем отправишься ты?">
<meta property="og:image" content="${image}">
<meta property="og:image:secure_url" content="${image}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escapeAttr(`${data.actor}, ${data.name}`)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="А с кем отправишься ты?">
<meta name="twitter:image" content="${image}">
</head><body></body></html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
