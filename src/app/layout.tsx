import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Resolv-HQ — Agent Console",
  description:
    "A bounded, explainable AI agent: retrieval, tools, memory, evaluation and human approval, all inspectable.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", montserrat.variable, "font-sans")}
    >
      <body className="min-h-screen bg-background text-foreground font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}