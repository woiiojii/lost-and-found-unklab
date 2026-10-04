/**
 * app/auth/layout.tsx – Layout for auth pages (login/register)
 * Centered card layout with UNKLAB purple branding matching landing theme.
 */
import Link from "next/link";
import { MapPin } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#520352] flex flex-col justify-between p-4 sm:p-6">
      {/* Background Gradient & Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#420242] via-[#6a046a] to-[#380138]" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#9e2a9e]/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-20 w-[450px] h-[450px] bg-[#d946ef]/15 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center max-w-5xl mx-auto w-full pt-2 pb-2">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-heading font-extrabold text-xl text-white tracking-tight">
            UNKLAB
          </span>
          <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#969e00] text-white shadow-sm">
            Lost &amp; Found
          </span>
        </Link>
        <Link
          href="/"
          className="text-xs text-white/80 hover:text-white underline underline-offset-4"
        >
          ← Kembali ke Beranda
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex items-center justify-center py-6 w-full">
        <div className="w-full max-w-md animate-slide-up">{children}</div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-3 text-xs text-white/60">
        © {new Date().getFullYear()} Universitas Klabat • Lost &amp; Found System
      </footer>
    </div>
  );
}
