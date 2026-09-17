import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "HydraGuard | Wasserschaden-Management",
  description:
    "Professionelles Wasserschaden-Management für Eigentümer, Sanierer und Versicherer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${plexSans.variable} ${plexMono.variable} font-sans antialiased bg-hg-canvas text-hg-ink`}
      >
        {children}
      </body>
    </html>
  );
}
