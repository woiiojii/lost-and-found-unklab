/**
 * app/(main)/admin/page.tsx – Admin Dashboard
 * Comprehensive admin panel: stats, reports moderation, claims review.
 * Theme: Purple #6a046a. Border-radius: 8px. No emojis.
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { toast } from "sonner";
import {
  Shield,
  BarChart3,
  FileText,
  Users,
  ShieldCheck,
  EyeOff,
  Eye,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Search,
  Package,
  Check,
  X,
  Edit3,
} from "lucide-react";
import {
  formatDate,
  timeAgo,
  statusBadgeClass,
  statusLabel,
  typeBadgeClass,
  typeLabel,
} from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

type AdminTab = "overview" | "reports" | "claims";

export default function AdminPage() {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [claimStatusFilter, setClaimStatusFilter] = useState<
    "" | "Pending" | "Verified" | "Rejected"
  >("");

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [user, isAdmin, isLoading, router]);

  const stats = useQuery(api.reports.getDashboardStats);
  const allReports = useQuery(api.reports.listReports, { includeHidden: true });
  const allClaims = useQuery(api.claims.getAllClaims, {
    status: claimStatusFilter || undefined,
  });

  const hideReport = useMutation(api.reports.hideReport);
  const deleteReport = useMutation(api.reports.deleteReport);
  const updateStatus = useMutation(api.reports.updateReportStatus);
  const reviewClaim = useMutation(api.claims.reviewClaim);
  const updateHandoverStatus = useMutation(api.claims.updateHandoverStatus);

  const [editingHandoverClaimId, setEditingHandoverClaimId] = useState<string | null>(null);
  const [handoverStatusChoice, setHandoverStatusChoice] = useState<"Belum Diambil" | "Sudah Diambil">("Sudah Diambil");
  const [handoverNotesInput, setHandoverNotesInput] = useState("");
  const [submittingHandover, setSubmittingHandover] = useState(false);

  if (isLoading || !user || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#6a046a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  async function handleHide(reportId: string, hide: boolean) {
    await hideReport({
      reportId: reportId as Id<"itemReports">,
      hide,
      adminUserId: user!.userId as Id<"users">,
    });
    toast.success(hide ? "Laporan disembunyikan." : "Laporan ditampilkan kembali.");
  }

  async function handleDelete(reportId: string) {
    if (!confirm("Yakin ingin menghapus laporan ini secara permanen?")) return;
    await deleteReport({
      reportId: reportId as Id<"itemReports">,
      adminUserId: user!.userId as Id<"users">,
    });
    toast.success("Laporan berhasil dihapus.");
  }

  async function handleStatusChange(reportId: string, status: string) {
    await updateStatus({
      reportId: reportId as Id<"itemReports">,
      status: status as "Open" | "Under Review" | "Returned" | "Closed",
      adminUserId: user!.userId as Id<"users">,
    });
    toast.success("Status diperbarui.");
  }

  async function handleReview(claimId: string, decision: "Verified" | "Rejected") {
    await reviewClaim({
      claimId: claimId as Id<"claims">,
      decision,
      adminUserId: user!.userId as Id<"users">,
    });
    toast.success(decision === "Verified" ? "Klaim diverifikasi!" : "Klaim ditolak.");
  }

  async function handleSaveHandover(claimId: string) {
    if (!user) return;
    setSubmittingHandover(true);
    try {
      await updateHandoverStatus({
        claimId: claimId as Id<"claims">,
        adminUserId: user.userId as Id<"users">,
        handoverStatus: handoverStatusChoice,
        handoverNotes: handoverNotesInput,
      });
      toast.success(
        handoverStatusChoice === "Sudah Diambil"
          ? "Status diperbarui: Barang telah diambil oleh pihak yang kehilangan."
          : "Status diperbarui: Barang belum diambil (menunggu di pos satpam)."
      );
      setEditingHandoverClaimId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui status.";
      toast.error(msg);
    } finally {
      setSubmittingHandover(false);
    }
  }

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Ringkasan", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "reports", label: "Moderasi Laporan", icon: <FileText className="w-4 h-4" /> },
    { id: "claims", label: "Tinjauan Klaim", icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* ─── Admin Header ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center shadow-sm">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">
            Panel Administrator
          </h1>
          <p className="text-xs text-slate-500">Sistem Keamanan &amp; Moderasi UNKLAB</p>
        </div>
      </div>

      {/* ─── Tabs (8px Radius) ───────────────────────────────────────── */}
      <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-lg w-fit overflow-x-auto border border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`admin-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-white text-[#6a046a] shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Overview Tab ────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-5 animate-fade-in">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {[
              {
                icon: <TrendingUp className="w-4 h-4 text-white" />,
                label: "Total Laporan",
                value: stats?.totalReports ?? 0,
                bg: "gradient-primary",
              },
              {
                icon: <Users className="w-4 h-4 text-white" />,
                label: "Total Pengguna",
                value: stats?.totalUsers ?? 0,
                bg: "bg-purple-800",
              },
              {
                icon: <ShieldCheck className="w-4 h-4 text-white" />,
                label: "Klaim Menunggu",
                value: stats?.pendingClaims ?? 0,
                bg: "bg-amber-600",
              },
              {
                icon: <CheckCircle2 className="w-4 h-4 text-white" />,
                label: "Dikembalikan",
                value: stats?.returnedReports ?? 0,
                bg: "bg-[#6a046a]",
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`${s.bg} rounded-lg p-4 text-white shadow-sm`}
              >
                <div className="mb-1.5">{s.icon}</div>
                <div className="font-heading text-2xl font-extrabold">
                  {s.value}
                </div>
                <div className="text-white/80 text-[11px] font-medium">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Additional stats */}
          <div className="grid sm:grid-cols-3 gap-3.5">
            {[
              {
                label: "Laporan Barang Hilang",
                value: stats?.lostReports ?? 0,
                icon: <Search className="w-5 h-5 text-rose-600" />,
                color: "text-rose-600",
                bg: "bg-rose-50 border-rose-100",
              },
              {
                label: "Laporan Barang Temuan",
                value: stats?.foundReports ?? 0,
                icon: <Package className="w-5 h-5 text-[#6a046a]" />,
                color: "text-[#6a046a]",
                bg: "bg-[#fbf4fb] border-[#eccdec]",
              },
              {
                label: "Laporan Tersembunyi",
                value: stats?.hiddenReports ?? 0,
                icon: <EyeOff className="w-5 h-5 text-slate-600" />,
                color: "text-slate-600",
                bg: "bg-slate-50 border-slate-200",
              },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-lg p-4 border`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded border border-slate-100 shadow-sm">{s.icon}</div>
                  <div>
                    <div className={`font-heading text-xl font-bold ${s.color}`}>
                      {s.value}
                    </div>
                    <div className="text-xs text-slate-600 font-medium">{s.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pending alerts */}
          {stats && stats.pendingClaims > 0 && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p>
                <strong>{stats.pendingClaims} klaim kepemilikan</strong> sedang menunggu
                verifikasi administrator.{" "}
                <button
                  onClick={() => setActiveTab("claims")}
                  className="underline font-bold text-amber-950 ml-1"
                >
                  Tinjau sekarang →
                </button>
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── Reports Moderation Tab ───────────────────────────────────── */}
      {activeTab === "reports" && (
        <div className="animate-fade-in">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                Semua Laporan ({allReports?.length ?? 0})
              </h2>
              <span className="text-xs text-slate-500">Termasuk laporan tersembunyi</span>
            </div>

            {allReports === undefined ? (
              <div className="p-8 text-center text-xs text-slate-400">Memuat laporan...</div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {allReports.map((r) => (
                  <div
                    key={r._id}
                    className={`p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors ${
                      r.isHidden ? "opacity-60 bg-rose-50/40" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className={typeBadgeClass(r.type)}>
                          {typeLabel(r.type)}
                        </span>
                        <span className={statusBadgeClass(r.status)}>
                          {statusLabel(r.status)}
                        </span>
                        {r.isHidden && (
                          <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold">
                            TERSEMBUNYI
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/reports/${r._id}`}
                        className="font-bold text-slate-800 text-xs hover:text-[#6a046a] hover:underline line-clamp-1"
                      >
                        {r.title}
                      </Link>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {r.authorName} · {timeAgo(r.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* Status selector */}
                      <select
                        value={r.status}
                        onChange={(e) =>
                          handleStatusChange(r._id, e.target.value)
                        }
                        className="text-xs border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#6a046a] bg-white"
                      >
                        <option value="Open">Aktif</option>
                        <option value="Under Review">Tinjauan</option>
                        <option value="Returned">Dikembalikan</option>
                        <option value="Closed">Ditutup</option>
                      </select>

                      <button
                        onClick={() => handleHide(r._id, !r.isHidden)}
                        title={r.isHidden ? "Tampilkan" : "Sembunyikan"}
                        className={`p-1.5 rounded transition-colors ${
                          r.isHidden
                            ? "bg-[#f5e6f5] text-[#6a046a] hover:bg-[#eccdec]"
                            : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                        }`}
                      >
                        {r.isHidden ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(r._id)}
                        title="Hapus"
                        className="p-1.5 rounded bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Claims Review Tab ────────────────────────────────────────── */}
      {activeTab === "claims" && (
        <div className="animate-fade-in space-y-4">
          {/* Status filter */}
          <div className="flex gap-2 flex-wrap">
            {(
              [
                { val: "", label: "Semua Klaim" },
                { val: "Pending", label: "Menunggu" },
                { val: "Verified", label: "Diverifikasi" },
                { val: "Rejected", label: "Ditolak" },
              ] as const
            ).map((f) => (
              <button
                key={f.val}
                onClick={() => setClaimStatusFilter(f.val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  claimStatusFilter === f.val
                    ? "bg-[#6a046a] text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-700 hover:border-[#6a046a]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50">
              <h2 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                Klaim Kepemilikan ({allClaims?.length ?? 0})
              </h2>
            </div>

            {allClaims === undefined ? (
              <div className="p-8 text-center text-xs text-slate-400">Memuat klaim...</div>
            ) : allClaims.length === 0 ? (
              <div className="p-12 text-center">
                <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-xs font-semibold">
                  Tidak ada klaim{claimStatusFilter ? ` dengan status ini` : ""}.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {allClaims.map((c) => (
                  <div key={c._id} className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4 mb-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
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
                        <Link
                          href={`/reports/${c.reportId}`}
                          className="font-bold text-slate-800 text-sm hover:text-[#6a046a] hover:underline"
                        >
                          {c.reportTitle}
                        </Link>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-slate-800">
                          {c.claimantName}
                        </p>
                        <p className="text-[10px] text-slate-400">{c.claimantCampusId}</p>
                        <p className="text-[10px] text-slate-400">{c.claimantEmail}</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded p-3 mb-3 border border-slate-200">
                      <p className="text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-[#6a046a]" />
                        Bukti Kepemilikan:
                      </p>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {c.proofDescription}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                        <Clock className="w-3 h-3" />
                        Diajukan: {formatDate(c.submitDate)}
                      </div>
                      {c.status === "Pending" && (
                        <div className="flex gap-1.5">
                          <button
                            id={`verify-claim-${c._id}`}
                            onClick={() => handleReview(c._id, "Verified")}
                            className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#6a046a] text-white text-xs font-bold hover:bg-[#520352] transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Verifikasi Klaim
                          </button>
                          <button
                            id={`reject-claim-${c._id}`}
                            onClick={() => handleReview(c._id, "Rejected")}
                            className="flex items-center gap-1 px-3 py-1.5 rounded bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            Tolak
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ─── Handover Management for Verified Claims ─── */}
                    {c.status === "Verified" && (
                      <div className="mt-3 p-3.5 rounded-lg border border-slate-200 bg-white space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="text-xs font-bold text-slate-700">
                              Status Pengambilan:
                            </span>
                            {c.handoverStatus === "Sudah Diambil" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Sudah Diambil oleh Pihak yang Kehilangan
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                Belum Diambil (Menunggu Pengambilan)
                              </span>
                            )}
                            {c.handoverDate && (
                              <span className="text-[11px] text-slate-400">
                                • Diambil pada: {formatDate(c.handoverDate)}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (editingHandoverClaimId === c._id) {
                                setEditingHandoverClaimId(null);
                              } else {
                                setEditingHandoverClaimId(c._id);
                                setHandoverStatusChoice(
                                  c.handoverStatus === "Sudah Diambil" ? "Sudah Diambil" : "Belum Diambil"
                                );
                                setHandoverNotesInput(c.handoverNotes ?? "");
                              }
                            }}
                            className="text-xs font-semibold px-2.5 py-1 rounded-md border border-[#6a046a]/30 text-[#6a046a] hover:bg-[#fbf4fb] transition-colors flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            {editingHandoverClaimId === c._id ? "Tutup Form" : "Update Keterangan"}
                          </button>
                        </div>

                        {c.handoverNotes && editingHandoverClaimId !== c._id && (
                          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 flex items-start gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-[#6a046a] mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-semibold text-slate-700">Keterangan Pengambilan:</span>{" "}
                              {c.handoverNotes}
                            </div>
                          </div>
                        )}

                        {/* Inline Form to Update Handover Status & Notes */}
                        {editingHandoverClaimId === c._id && (
                          <div className="pt-2 border-t border-slate-100 space-y-3 bg-[#fbf4fb]/60 p-3 rounded-lg border border-[#eccdec]/60">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                                Pilih Status Pengambilan:
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setHandoverStatusChoice("Sudah Diambil")}
                                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold text-left transition-all ${
                                    handoverStatusChoice === "Sudah Diambil"
                                      ? "bg-emerald-50 border-emerald-400 text-emerald-800 shadow-sm"
                                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                  }`}
                                >
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                  <div>
                                    <p className="font-bold">Sudah Diambil</p>
                                    <p className="text-[10px] text-slate-400 font-normal">Barang sudah diserahkan ke pemilik</p>
                                  </div>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setHandoverStatusChoice("Belum Diambil")}
                                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold text-left transition-all ${
                                    handoverStatusChoice === "Belum Diambil"
                                      ? "bg-amber-50 border-amber-400 text-amber-800 shadow-sm"
                                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                  }`}
                                >
                                  <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                  <div>
                                    <p className="font-bold">Belum Diambil</p>
                                    <p className="text-[10px] text-slate-400 font-normal">Menunggu pengambilan di pos security</p>
                                  </div>
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                                Keterangan Tambahan (Opsional):
                              </label>
                              <textarea
                                value={handoverNotesInput}
                                onChange={(e) => setHandoverNotesInput(e.target.value)}
                                placeholder="Contoh: Barang diambil di pos satpam dengan menunjukkan KTM dan KTP."
                                rows={2}
                                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#6a046a] bg-white resize-none"
                              />
                            </div>

                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingHandoverClaimId(null)}
                                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                disabled={submittingHandover}
                                onClick={() => handleSaveHandover(c._id)}
                                className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                              >
                                {submittingHandover ? "Menyimpan..." : "Simpan Keterangan"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
