import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import NestedLayout from "./components/nested-layout";
import { Providers } from "./components/providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Security Hub",
  description: "Gerencie e controle suas portas de acesso de forma inteligente",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <NestedLayout>{children}</NestedLayout>
        </Providers>
      </body>
    </html>
  );
}
