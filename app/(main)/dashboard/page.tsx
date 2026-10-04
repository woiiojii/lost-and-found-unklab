/**
 * app/(main)/dashboard/page.tsx – User Dashboard
 * Shows user's reports, claims, and recent notifications.
 * Theme: Purple #6a046a. Border-radius: 8px. No emojis.
 */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import {
  PlusCircle,
  FileText,
  ShieldCheck,
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle,
  Inbox,
  Bookmark,
  Shield,
} from "lucide-react";
import {
  formatDate,
  timeAgo,
  statusBadgeClass,
  statusLabel,
  typeBadgeClass,
  typeLabel,
} from "@/lib/utils";
import { CategoryIcon } from "@/components/reports/CategoryIcon";
import type { Id } from "@/convex/_generated/dataModel";

export default function DashboardPage() {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login?redirect=/dashboard");
    }
  }, [user, isLoading, router]);

  const myReports = useQuery(
    api.reports.getMyReports,
    user ? { userId: user.userId as Id<"users"> } : "skip"
  );
  const myClaims = useQuery(
    api.claims.getMyClaims,
    user ? { userId: user.userId as Id<"users"> } : "skip"
  );
  const myNotifs = useQuery(
    api.notifications.getMyNotifications,
    user ? { userId: user.userId as Id<"users"> } : "skip"
  );

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#6a046a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeReports =
    myReports?.filter(
      (r) => r.status !== "Closed" && r.status !== "Returned"
    ).length ?? 0;

  const pendingClaims =
    myClaims?.filter((c) => c.status === "Pending").length ?? 0;
  const unreadNotifs =
    myNotifs?.filter((n) => !n.isRead).length ?? 0;

  return (
    <div className="animate-fade-in space-y-6">
      {/* ─── Welcome Header ─────────────────────────────────────────── */}
      <div className="gradient-primary rounded-lg p-6 sm:p-7 text-white shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-xl font-bold border border-white/30">
            {user.name.charAt(0)}
          </div>
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold flex items-center gap-2">
              Halo, {user.name.split(" ")[0]}!
              {isAdmin && (
                <span className="text-[11px] bg-[#969e00] text-white px-2.5 py-0.5 rounded-full font-semibold">
                  Administrator
                </span>
              )}
            </h1>
            <p className="text-purple-100 text-xs">
              {isAdmin ? "Fokus Utama: Memantau Laporan & Menyetujui Klaim Barang" : `${user.campusId} · ${user.email}`}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Quick Stats ────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3.5">
        {[
          {
            icon: <FileText className="w-4 h-4 text-[#6a046a]" />,
            label: "Laporan Aktif",
            value: activeReports,
            bg: "bg-[#fbf4fb] border-[#eccdec]",
          },
          {
            icon: <ShieldCheck className="w-4 h-4 text-amber-600" />,
            label: "Klaim Menunggu",
            value: pendingClaims,
            bg: "bg-amber-50 border-amber-200",
          },
          {
            icon: <Bell className="w-4 h-4 text-purple-700" />,
            label: "Notifikasi Baru",
            value: unreadNotifs,
            bg: "bg-purple-50 border-purple-200",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`${s.bg} rounded-lg p-4 text-center border shadow-sm`}
          >
            <div className="flex justify-center mb-1.5">{s.icon}</div>
            <div className="font-heading text-2xl font-extrabold text-slate-800">
              {s.value}
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5 font-semibold">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ─── Quick Actions ──────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2.5">
        {isAdmin ? (
          <>
            <Link
              href="/admin"
              className="btn-primary text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Shield className="w-3.5 h-3.5" />
              Panel Moderasi &amp; Tinjau Klaim
            </Link>
            <Link
              href="/reports"
              className="btn-outline text-xs flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              Pantau Semua Laporan
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/reports/new"
              className="btn-primary text-xs flex items-center gap-1.5 shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Buat Laporan Baru
            </Link>
            <Link
              href="/reports"
              className="btn-outline text-xs flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              Cari Barang
            </Link>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ─── My Reports ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <h1 className="section-title text-base mb-3 flex items-center gap-1.5 uppercase tracking-wide">
            <FileText className="w-4 h-4 text-[#6a046a]" />
            Laporan Saya
          </h1>

          {myReports === undefined ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-white rounded-lg border border-slate-200 animate-pulse"
                />
              ))}
            </div>
          ) : myReports.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center shadow-sm">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600 text-xs font-semibold mb-3">
                Belum ada laporan yang Anda buat.
              </p>
              <Link href="/reports/new" className="btn-primary text-xs inline-block">
                Buat Laporan Pertama
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {myReports.map((r) => (
                <Link
                  key={r._id}
                  href={`/reports/${r._id}`}
                  className="flex items-center gap-3.5 bg-white rounded-lg border border-slate-200 p-3.5 hover:border-[#6a046a] transition-all group shadow-sm"
                >
                  <div className="w-11 h-11 bg-[#fbf4fb] rounded flex items-center justify-center text-slate-500 flex-shrink-0 border border-slate-100 overflow-hidden">
                    {r.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <CategoryIcon name={r.categoryName} className="w-5 h-5 text-[#6a046a]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={statusBadgeClass(r.status)}>
                        {statusLabel(r.status)}
                      </span>
                    </div>
                    <p className="font-bold text-slate-800 text-xs truncate group-hover:text-[#6a046a] transition-colors">
                      {r.title}
                    </p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {timeAgo(r.createdAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ─── Sidebar ───────────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* My Claims */}
          <div>
            <h2 className="section-title text-base mb-3 flex items-center gap-1.5 uppercase tracking-wide">
              <Bookmark className="w-4 h-4 text-[#6a046a]" />
              Klaim Saya
            </h2>

            {myClaims === undefined ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-14 bg-white rounded-lg border border-slate-200 animate-pulse"
                  />
                ))}
              </div>
            ) : myClaims.length === 0 ? (
              <div className="bg-white rounded-lg border border-slate-200 p-5 text-center shadow-sm">
                <Bookmark className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                <p className="text-slate-400 text-xs">Belum ada klaim diajukan.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {myClaims.slice(0, 4).map((c) => (
                  <div
                    key={c._id}
                    className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-xs font-bold text-slate-800 line-clamp-1">
                        {c.reportTitle}
                      </p>
                      <span
                        className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          c.status === "Pending"
                            ? "bg-amber-100 text-amber-800"
                            : c.status === "Verified"
                              ? "bg-[#f5e6f5] text-[#6a046a]"
                              : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {c.status === "Pending"
                          ? "Menunggu"
                          : c.status === "Verified"
                            ? "Diverifikasi"
                            : "Ditolak"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Diajukan {formatDate(c.submitDate)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Notifications */}
          <div>
            <h2 className="section-title text-base mb-3 flex items-center gap-1.5 uppercase tracking-wide">
              <Bell className="w-4 h-4 text-[#6a046a]" />
              Notifikasi
            </h2>
            {myNotifs === undefined ? (
              <div className="h-20 bg-white rounded-lg border border-slate-200 animate-pulse" />
            ) : myNotifs.length === 0 ? (
              <div className="bg-white rounded-lg border border-slate-200 p-5 text-center shadow-sm">
                <Bell className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                <p className="text-slate-400 text-xs">Tidak ada notifikasi.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {myNotifs.slice(0, 4).map((n) => (
                  <div
                    key={n._id}
                    className={`flex items-start gap-2 p-3 rounded-lg border transition-colors ${
                      n.isRead
                        ? "bg-white border-slate-200 shadow-sm"
                        : "bg-[#fbf4fb] border-[#eccdec] shadow-sm"
                    }`}
                  >
                    {n.isRead ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-[#6a046a] flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-xs text-slate-800 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
