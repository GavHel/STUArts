import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Artists | STUArts",
  description:
    "Discover student artists and original artwork in the STUArts community.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
