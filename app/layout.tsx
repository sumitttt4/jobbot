import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "JobBot — personal job search agent",
  description:
    "Parses your resume, scores jobs against it, and writes tailored cover letters.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="relative min-h-screen text-ink antialiased">
        {/* Ambient sky background — blurred, with a white wash so content stays
            readable. Drop your image at public/sky.jpg (see public/README.md).
            If the file is absent it gracefully falls back to plain white. */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
          <div
            className="absolute inset-0 scale-110 bg-cover bg-center blur-[2px]"
            style={{
              // Real photo on top; a sky gradient underneath so it still looks
              // intentional before public/sky.jpg is added.
              backgroundImage:
                "url('/sky.jpg'), linear-gradient(to bottom, #6ba8e6 0%, #9cc8ef 45%, #d9e9f8 100%)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/80 to-white" />
        </div>
        {children}
      </body>
    </html>
  );
}
