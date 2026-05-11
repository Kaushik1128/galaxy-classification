import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Galaxy Classifier — morphology from a single image",
  description:
    "A neural network trained on the Galaxy Zoo 2 dataset to classify galaxy morphology. Watch it work on curated galaxies, or upload your own.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body className="cosmic-radial min-h-screen">{children}</body>
    </html>
  );
}
