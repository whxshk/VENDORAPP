import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StreamShelf",
  description: "Local-only macOS media center"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
