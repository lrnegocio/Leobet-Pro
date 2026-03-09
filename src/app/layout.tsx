import type { Metadata } from "next";
import { PT_Sans, Source_Code_Pro } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const ptSans = PT_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-pt-sans",
});

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-source-code",
});

export const metadata: Metadata = {
  title: "LEOBET PRO - Studio",
  description: "Plataforma profissional de apostas e bingos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${ptSans.variable} ${sourceCodePro.variable} font-body bg-muted/30`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
