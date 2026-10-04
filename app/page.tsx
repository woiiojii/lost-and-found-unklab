/**
 * app/page.tsx – Landing / Home Page
 * Single viewport (no scroll) landing page matching UNKLAB reference design.
 * Features:
 * - Customizable background image with rich purple gradient overlay
 * - Bold title with lime underline accent
 * - Floating UNKLAB logo
 * - Direct action pill buttons (Sign-In, Cari Barang, Laporkan)
 * - Animated multi-layer wave ribbon at footer
 */
"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import {
  Search,
  PlusCircle,
  MapPin,
  User,
  Shield,
} from "lucide-react";

export default function HomePage() {
  const { user, isAdmin } = useAuth();
  const stats = useQuery(api.reports.getDashboardStats);

  return (
    <div className="relative min-h-screen lg:h-screen w-full lg:overflow-hidden bg-[#520352] text-white flex flex-col justify-between select-none">
      {/* ─── Background Layer (Ganti Foto & Warna Background di sini) ───────── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Foto Background */}
        <img
          src="/unklab.png"
          alt="Landing Background"
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity scale-105 transition-all duration-700"
          onError={(e) => {
            // Sembunyikan jika file gambar belum dimasukkan
            e.currentTarget.style.display = "none";
          }}
        />

        {/* Gradien Ungu UNKLAB (Overlay warna tema di atas gambar) */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#420242]/90 via-[#6a046a]/85 to-[#380138]/90" />

        {/* Ambient Glows Aksen */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#9e2a9e]/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-[500px] h-[500px] bg-[#d946ef]/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-[#a3e635]/10 rounded-full blur-3xl" />
      </div>

      {/* ─── Top Navigation Bar ────────────────────────────────────────────── */}
      <header className="relative z-20 w-full px-6 sm:px-12 pt-4 sm:pt-6 pb-2 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex items-center gap-2">
            <span className="font-heading font-extrabold text-lg sm:text-xl tracking-tight text-white">
              UNKLAB
            </span>
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#969e00] text-white shadow-sm">
              Lost &amp; Found
            </span>
          </div>
        </Link>

        {/* Navigation Links & User Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href={isAdmin ? "/admin" : "/dashboard"}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-white text-[#520352] hover:bg-white/90 shadow-md transition-all"
              >
                {isAdmin ? <Shield className="w-4 h-4 text-[#6a046a]" /> : <User className="w-4 h-4" />}
                <span>{isAdmin ? "Panel Admin" : `Dashboard (${user.name.split(" ")[0]})`}</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm transition-all"
              >
                Log In
              </Link>
              <Link
                href="/auth/register"
                className="px-5 py-2 rounded-full text-xs sm:text-sm font-medium bg-[#969e00] hover:bg-[#858c00] text-white shadow-md transition-all font-heading"
              >
                Daftar
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* ─── Main Hero Section (Split Screen) ──────────────────────────────── */}
      <main className="relative z-10 w-full flex-1 max-w-7xl mx-auto px-6 sm:px-12 flex items-center my-auto py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center w-full">
          {/* Left Column: Heading & Calls to Action */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center text-left py-2 sm:py-4">
            {/* Main Headline */}
            <h1 className="font-heading text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight text-white leading-[1.12] mb-4 sm:mb-5">
              {" "}
              <span className="relative inline-block text-white">
                <span className="relative z-10">Lost &amp; Found</span>
                <span className="absolute bottom-1 left-0 w-full h-2.5 sm:h-3 bg-[#969e00] -z-0 opacity-90 rounded-sm" />
              </span>{" "}
              Unklab
            </h1>

            {/* Description Subtitle */}
            <p className="text-white/85 text-sm sm:text-base xl:text-lg leading-relaxed max-w-xl mb-6 sm:mb-8 font-normal">
              Sistem ini dirancang untuk mengelola dan memfasilitasi pelaporan
              serta pencarian barang hilang dan temuan di lingkungan Universitas Klabat
              secara online dengan verifikasi keamanan terpusat dan real-time.
            </p>

            {/* Call to Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <Link
                href="/reports"
                id="landing-search-btn"
                className="px-8 py-3.5 rounded-full bg-[#969e00] hover:bg-[#858c00] active:scale-95 text-white font-medium text-base sm:text-lg shadow-lg shadow-black/20 flex items-center justify-center transition-all"
              >
                Cari Barang Hilang
              </Link>

              {isAdmin ? (
                <Link
                  href="/admin"
                  id="landing-admin-btn"
                  className="px-8 py-3.5 rounded-full bg-[#969e00] hover:bg-[#858c00] active:scale-95 text-white font-medium text-base sm:text-lg shadow-lg shadow-black/20 flex items-center justify-center transition-all"
                >
                  Panel Pemantauan Admin
                </Link>
              ) : (
                <Link
                  href={user ? "/reports/new" : "/auth/login?redirect=/reports/new"}
                  id="landing-report-btn"
                  className="px-8 py-3.5 rounded-full bg-[#969e00] hover:bg-[#858c00] active:scale-95 text-white font-medium text-base sm:text-lg shadow-lg shadow-black/20 flex items-center justify-center transition-all"
                >
                  Laporkan Barang
                </Link>
              )}
            </div>


          </div>

          {/* Right Column: Logo Universitas Klabat */}
          <div className="lg:col-span-6 xl:col-span-5 relative flex items-center justify-center py-4">
            <a 
              href="https://www.unklab.ac.id/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="relative flex items-center justify-center cursor-pointer">
              <img
                src="/LOGO_UNIVERSITAS_KLABAT.png"
                alt="Logo Universitas Klabat"
                className="w-52 sm:w-64 md:w-72 lg:w-80 max-h-[260px] sm:max-h-[300px] object-contain drop-shadow-2xl transition-transform duration-300 hover:scale-105 select-none"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = "none";
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
            </a>
          </div>
        </div>
      </main>

      {/* ─── Bottom Flowing Wave Ribbon (Multi-Layer Animated SVG) ──────────── */}
      <div className="relative z-10 w-full pointer-events-none overflow-hidden leading-none">
        <svg
          className="hero-waves w-full"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          viewBox="0 24 150 28"
          preserveAspectRatio="none"
        >
          <defs>
            <path
              id="wave-path"
              d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
            />
          </defs>
          <g className="wave1">
            <use xlinkHref="#wave-path" x="50" y="3" fill="rgba(255,255,255, .1)" />
          </g>
          <g className="wave2">
            <use xlinkHref="#wave-path" x="50" y="0" fill="rgba(255,255,255, .2)" />
          </g>
          <g className="wave3">
            <use xlinkHref="#wave-path" x="50" y="9" fill="#fff" />
          </g>
        </svg>
      </div>
    </div>
  );
}
