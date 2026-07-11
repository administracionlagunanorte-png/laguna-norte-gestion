import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "600", "800", "900"],
});

export const metadata: Metadata = {
  title: "Laguna Norte - Gestión Operativa",
  description: "Sistema de gestión de órdenes de trabajo para Laguna Norte",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Laguna Norte",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f2044",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Prevenir zoom en iOS para inputs */}
        <style>{`
          input, select, textarea {
            font-size: 16px !important;
          }
          @media (max-width: 640px) {
            input, select, textarea {
              font-size: 16px !important;
            }
          }
        `}</style>
      </head>
      <body className={`${inter.variable} antialiased`} style={{ fontFamily: "'Inter', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
