/**
 * app/layout.tsx – Root layout: Convex provider, Auth provider, Sonner toaster.
 */
import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "UNKLAB Lost & Found – Sistem Barang Hilang & Temuan",
  description:
    "Platform digital resmi pelaporan barang hilang dan penemuan di Universitas Klabat (UNKLAB). Laporkan, cari, dan klaim barang Anda dengan mudah.",
  keywords: [
    "UNKLAB",
    "lost and found",
    "barang hilang",
    "Universitas Klabat",
    "sistem barang hilang",
  ],
  openGraph: {
    title: "UNKLAB Lost & Found",
    description: "Sistem Barang Hilang & Temuan – Universitas Klabat",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background min-h-screen antialiased">
        <ConvexClientProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              richColors
              closeButton
              toastOptions={{
                style: { fontFamily: "Inter, sans-serif" },
              }}
            />
          </AuthProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
