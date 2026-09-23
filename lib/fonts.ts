import localFont from "next/font/local";

export const angst = localFont({
  src: [
    { path: "../app/fonts/Angst-Thin.otf", weight: "300", style: "normal" },
    { path: "../app/fonts/Angst-Normal.otf", weight: "400", style: "normal" },
    { path: "../app/fonts/Angst-Bold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-angst",
  display: "swap",
  fallback: ["Times New Roman", "Georgia", "serif"],
});
