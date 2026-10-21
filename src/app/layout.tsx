import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maya Linnea Chen | StartUArts",
  description:
    "Meet Maya Linnea Chen, a multidisciplinary student artist at the University of Calgary.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
