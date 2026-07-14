import type { Metadata } from "next";
import { Geist_Mono, Instrument_Sans } from "next/font/google";
import { Footer } from "@/components/sections/Footer";
import { Header } from "@/components/sections/Header";
import { RouteTransition } from "@/components/transition/RouteTransition";
import "./globals.css";

// Two families, not three. Instrument Sans carries headings AND UI — hierarchy
// comes from weight and size, not from two similar sans fighting each other.
// Geist Mono is the only second face, on a real contrast axis, for data.
const instrumentSans = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arcus — AI oral image classification",
  description:
    "Upload an oral image and see what the model predicts, with its confidence and full probability distribution. Not a substitute for professional medical advice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Header />
        <RouteTransition>{children}</RouteTransition>
        <Footer />
      </body>
    </html>
  );
}
