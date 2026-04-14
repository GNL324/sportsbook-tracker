import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GNL Hub",
  description: "Sports betting arbitrage tools",
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
