import type { Metadata } from "next";
import Script from "next/script";
import { angst } from "@/lib/fonts";
import "./globals.css";

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:47231";
const metrikaId = process.env.NEXT_PUBLIC_METRIKA_ID;

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: "Битва моторов",
    template: "%s — Битва моторов",
  },
  description:
    "Выбирай попутчика и зови друзей — посмотрим, с кем поедет больше зрителей.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${angst.variable} ${angst.className} min-h-full`}>
      <body className="min-h-full">
        <Script id="share-reload" strategy="beforeInteractive">
          {`(function(){try{var p=location.pathname;if(!/^\\/p\\/(andrey|dmitry)\\/?$/.test(p))return;var n=performance.getEntriesByType("navigation")[0];if(n&&n.type==="reload")location.replace("/");}catch(e){}})();`}
        </Script>
        {children}
        {metrikaId ? (
          <Script id="yandex-metrika" strategy="afterInteractive">
            {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");ym(${Number(metrikaId)},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true});`}
          </Script>
        ) : null}
      </body>
    </html>
  );
}
