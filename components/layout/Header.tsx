/**
 * components/layout/Header.tsx
 * Main navigation header with UNKLAB branding, search bar (top-right),
 * notification bell, and user menu.
 * Theme: Purple gradient (#520352 → #6a046a) matching landing page.
 */
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import { timeAgo } from "@/lib/utils";
import {
  Bell,
  LogOut,
  User,
  Shield,
  Search,
  PlusCircle,
  Menu,
  X,
  ChevronDown,
  CheckCheck,
  Inbox,
  MapPin,
} from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

export default function Header() {
  const { user, logout, token, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Real-time notifications
  const notifications = useQuery(
    api.notifications.getMyNotifications,
    user ? { userId: user.userId as Id<"users"> } : "skip"
  );
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    user ? { userId: user.userId as Id<"users"> } : "skip"
  );

  const markAllRead = useMutation(api.notifications.markAllAsRead);
  const markRead = useMutation(api.notifications.markAsRead);
  const logoutMutation = useMutation(api.auth.logout);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Sync search input if already on reports page
  useEffect(() => {
    if (!pathname?.startsWith("/reports")) {
      setSearchValue("");
    }
  }, [pathname]);

  async function handleLogout() {
    if (token) {
      try {
        await logoutMutation({ token });
      } catch {
        // ignore
      }
    }
    logout();
    router.push("/");
  }

  async function handleNotifClick(notifId: string, reportId?: string) {
    try {
      await markRead({ notificationId: notifId as Id<"notifications"> });
    } catch {
      // ignore
    }
    setNotifOpen(false);
    if (reportId) {
      router.push(`/reports/${reportId}`);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchValue.trim();
    if (q) {
      router.push(`/reports?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/reports");
    }
  }

  return (
    <header className="sticky top-0 z-40 shadow-lg" style={{ background: "linear-gradient(90deg, #420242 0%, #6a046a 60%, #520352 100%)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">

          {/* ─── Logo / Brand ─────────────────────────────────────────── */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group flex-shrink-0"
            aria-label="UNKLAB Lost & Found – Beranda"
          >
            <div className="hidden sm:block">
              <span className="font-heading font-extrabold text-lg text-white leading-none">
                UNKLAB
              </span>
              <span className="text-[10px] text-white/70 block leading-none font-medium tracking-wide">
                Lost &amp; Found
              </span>
            </div>
          </Link>

          {/* ─── Search Bar (center/right) ─────────────────────────────── */}
          <form
            onSubmit={handleSearch}
            className="flex-1 max-w-sm lg:max-w-md xl:max-w-lg hidden md:flex items-center"
          >
            <div className="relative w-full group">
              {searchValue && (
                <button
                  type="button"
                  onClick={() => setSearchValue("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* ─── Right Side Actions ─────────────────────────────────────── */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">

            {/* Quick "Buat Laporan" pill – only for regular users (not admin) */}
            {user && !isAdmin && (
              <Link
                href="/reports/new"
                id="header-new-report-btn"
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#969e00] hover:bg-[#858c00] text-white shadow transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Buat Laporan
              </Link>
            )}

            {/* Quick "Panel Admin" button for Admin */}
            {user && isAdmin && (
              <Link
                href="/admin"
                id="header-admin-btn"
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#969e00] hover:bg-[#858c00] text-white shadow transition-all"
              >
                <Shield className="w-3.5 h-3.5" />
                Panel Admin
              </Link>
            )}

            {user ? (
              <>
                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    id="notification-bell-btn"
                    onClick={() => {
                      setNotifOpen((o) => !o);
                      setUserMenuOpen(false);
                    }}
                    className="relative p-2 rounded-lg hover:bg-white/15 text-white/80 hover:text-white transition-all"
                    aria-label={`Notifikasi${unreadCount ? ` (${unreadCount} belum dibaca)` : ""}`}
                  >
                    <Bell className="w-5 h-5" />
                    {!!unreadCount && unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-[#cbf846] rounded-full text-[10px] font-bold text-[#420242] flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden z-50">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-[#520352] to-[#6a046a]">
                        <h3 className="font-semibold text-white text-sm">
                          Notifikasi
                        </h3>
                        {unreadCount && unreadCount > 0 ? (
                          <button
                            onClick={() =>
                              markAllRead({
                                userId: user.userId as Id<"users">,
                              })
                            }
                            className="text-xs text-white/80 hover:text-white flex items-center gap-1 font-semibold"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Tandai semua dibaca
                          </button>
                        ) : null}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {!notifications || notifications.length === 0 ? (
                          <div className="py-10 text-center text-slate-400">
                            <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="text-xs">Tidak ada notifikasi baru</p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <button
                              key={n._id}
                              onClick={() =>
                                handleNotifClick(
                                  n._id,
                                  n.reportId as string | undefined
                                )
                              }
                              className={`w-full text-left px-4 py-3 hover:bg-[#fbf4fb]/70 transition-colors ${
                                !n.isRead ? "bg-[#fbf4fb]" : ""
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                {!n.isRead && (
                                  <span className="mt-1.5 w-2 h-2 rounded-full bg-[#6a046a] flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-xs leading-relaxed ${
                                      !n.isRead
                                        ? "text-slate-900 font-semibold"
                                        : "text-slate-600"
                                    }`}
                                  >
                                    {n.message}
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-1">
                                    {timeAgo(n.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>

                      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 text-center">
                        <Link
                          href="/dashboard"
                          onClick={() => setNotifOpen(false)}
                          className="text-xs text-[#6a046a] hover:underline font-semibold inline-block"
                        >
                          Lihat semua di Dashboard →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    id="user-menu-btn"
                    onClick={() => {
                      setUserMenuOpen((o) => !o);
                      setNotifOpen(false);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-full hover:bg-white/15 border border-white/20 transition-all"
                    aria-label="Menu pengguna"
                  >
                    <div className="w-6 h-6 bg-[#cbf846] rounded-full flex items-center justify-center text-[#420242] text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-xs font-semibold text-white/90 max-w-[90px] truncate">
                      {user.name.split(" ")[0]}
                    </span>
                    {isAdmin && (
                      <Shield className="hidden sm:block w-3.5 h-3.5 text-[#cbf846]" />
                    )}
                    <ChevronDown className="w-3.5 h-3.5 text-white/60" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-[#520352] to-[#6a046a]">
                        <p className="text-xs font-bold text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-white/70">{user.campusId}</p>
                        {isAdmin && (
                          <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-[#cbf846] font-bold">
                            <Shield className="w-2.5 h-2.5" />
                            Administrator
                          </span>
                        )}
                      </div>
                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-[#fbf4fb] transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        Dashboard Saya
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-[#fbf4fb] transition-colors"
                        >
                          <Shield className="w-4 h-4 text-[#6a046a]" />
                          Panel Admin
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-100"
                      >
                        <LogOut className="w-4 h-4" />
                        Keluar
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="hidden sm:block text-xs font-semibold text-white/80 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-all"
                >
                  Masuk
                </Link>
                <Link
                  href="/auth/register"
                  id="register-btn"
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-[#cbf846] hover:bg-[#b8e030] text-[#420242] shadow transition-all"
                >
                  Daftar
                </Link>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/15 text-white transition-colors"
              onClick={() => {
                setMobileOpen((o) => !o);
                setNotifOpen(false);
                setUserMenuOpen(false);
              }}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Mobile Nav Drawer ──────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 px-4 py-4 shadow-lg" style={{ background: "linear-gradient(180deg, #520352 0%, #420242 100%)" }}>
          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Cari barang hilang atau temuan..."
                className="w-full pl-9 pr-4 py-2.5 rounded-full text-sm bg-white/15 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:bg-white/25 transition-all"
              />
            </div>
          </form>
          <nav className="flex flex-col gap-1">
            <Link
              href="/reports"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10"
            >
              <Search className="w-4 h-4" /> Cari Barang
            </Link>
            {user && !isAdmin && (
              <Link
                href="/reports/new"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10"
              >
                <PlusCircle className="w-4 h-4" /> Buat Laporan
              </Link>
            )}
            {user && (
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10"
              >
                <User className="w-4 h-4" /> Dashboard Saya
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10"
              >
                <Shield className="w-4 h-4" /> Admin Panel
              </Link>
            )}
            {!user && (
              <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10"
                >
                  Masuk
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold bg-[#cbf846] text-[#420242] shadow"
                >
                  Daftar Sekarang
                </Link>
              </div>
            )}
            {user && (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-rose-300 hover:bg-white/10 text-left mt-2 border-t border-white/10"
              >
                <LogOut className="w-4 h-4" /> Keluar
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
