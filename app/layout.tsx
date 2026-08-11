import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/organisms/Header/Header";
import BottomNav from "@/components/organisms/BottomNav/BottomNav";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Questlog — my games",
  description: "Track games I want, own, am playing, finished, or dropped.",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
      <body className="min-h-dvh bg-zinc-950 text-zinc-100">
        <Header />
        <main className="mx-auto max-w-6xl pb-24 pt-4 md:pb-12">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
