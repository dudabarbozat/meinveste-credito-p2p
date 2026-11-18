import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import "@fontsource/aileron/400.css";
import "@fontsource/aileron/700.css";
import "@fontsource/aileron/800.css";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--f-inter", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--f-montserrat", display: "swap" });

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: { default: "MEInveste", template: "%s · MEInveste" },
  description: "Protótipo de marketplace de empréstimo entre pessoas e microempreendedores individuais.",
  icons: { icon: `${BASE}/img/favicon.png`, apple: `${BASE}/img/apple-touch-icon.png` },
};

export const viewport: Viewport = {
  themeColor: "#FFF7F5",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${montserrat.variable}`}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
