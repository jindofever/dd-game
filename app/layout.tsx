import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quest Unit",
  description: "AI narrated idle RPG paper prototype",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

