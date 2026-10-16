import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import React from "react";

export const metadata: Metadata = {
  title: "SIM-LB3 POLIMDO - Portal Sintes Akademika",
  description: "Portal Pelaporan & Pengelolaan Limbah B3 POLIMDO",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#f8fafc] text-slate-800 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
