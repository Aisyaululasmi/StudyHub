import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/navbar";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "StudyHub - Platform Sharing Materi Kuliah",
    template: "%s | StudyHub"
  },
  description: "Platform sharing materi kuliah untuk mahasiswa Indonesia. Temukan dan bagikan link, ringkasan, soal UTS/UAS, dan materi kuliah terbaik.",
  keywords: ["sharing materi kuliah", "studyhub", "materi kuliah indonesia", "forum mahasiswa", "belajar online"],
  authors: [{ name: "StudyHub" }],
  creator: "StudyHub",
  publisher: "StudyHub",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://studyhub.vercel.app'),
  openGraph: {
    title: "StudyHub - Platform Sharing Materi Kuliah",
    description: "Platform sharing materi kuliah untuk mahasiswa Indonesia. Temukan dan bagikan link, ringkasan, soal UTS/UAS, dan materi kuliah terbaik.",
    type: "website",
    locale: "id_ID",
    siteName: "StudyHub",
  },
  twitter: {
    card: "summary_large_image",
    title: "StudyHub - Platform Sharing Materi Kuliah",
    description: "Platform sharing materi kuliah untuk mahasiswa Indonesia",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
