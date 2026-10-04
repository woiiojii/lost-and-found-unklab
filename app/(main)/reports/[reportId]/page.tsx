/**
 * app/(main)/reports/[reportId]/page.tsx – Report Detail Page
 * Shows full item info, photo, status timeline, claims, and submit claim CTA.
 * Theme: Purple #6a046a. Border-radius: 8px. No emojis.
 */
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import ClaimModal from "@/components/reports/ClaimModal";
import { CategoryIcon } from "@/components/reports/CategoryIcon";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Tag,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Trash2,
  EyeOff,
  Eye,
  FileText,
  Check,
  X,
  ZoomIn,
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

export default function ReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);

  const report = useQuery(api.reports.getReport, {
    reportId: reportId as Id<"itemReports">,
  });
  const claims = useQuery(api.claims.getClaimsForReport, {
    reportId: reportId as Id<"itemReports">,
  });

  const hideReport = useMutation(api.reports.hideReport);
  const deleteReport = useMutation(api.reports.deleteReport);
  const updateStatus = useMutation(api.reports.updateReportStatus);
  const reviewClaim = useMutation(api.claims.reviewClaim);
  const updateHandoverStatus = useMutation(api.claims.updateHandoverStatus);

  const [editingHandoverId, setEditingHandoverId] = useState<string | null>(null);
  const [handoverChoice, setHandoverChoice] = useState<"Belum Diambil" | "Sudah Diambil">("Sudah Diambil");
  const [handoverNotes, setHandoverNotes] = useState("");
  const [savingHandover, setSavingHandover] = useState(false);

  if (report === undefined) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-32 mb-6" />
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="h-64 bg-slate-100" />
          <div className="p-6 space-y-3">
            <div className="h-6 bg-slate-200 rounded w-2/3" />
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-4 bg-slate-100 rounded w-4/5" />
          </div>
        </div>
      </div>
    );
  }

  if (report === null) {
    return (
      <div className="text-center py-16 bg-white rounded-lg border border-slate-200 shadow-sm max-w-lg mx-auto">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="font-heading text-lg font-bold text-slate-800 mb-1">
          Laporan Tidak Ditemukan
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Laporan mungkin telah dihapus atau URL tidak valid.
        </p>
        <Link href="/reports" className="btn-primary text-xs inline-block">
          Kembali ke Daftar Laporan
        </Link>
      </div>
    );
  }

  async function handleHide() {
    if (!user) return;
    await hideReport({
      reportId: reportId as Id<"itemReports">,
      hide: !report!.isHidden,
      adminUserId: user.userId as Id<"users">,
    });
    toast.success(
      report!.isHidden ? "Laporan ditampilkan kembali." : "Laporan disembunyikan."
    );
  }

  async function handleDelete() {
    if (!user) return;
    if (!confirm("Yakin ingin menghapus laporan ini secara permanen?")) return;
    await deleteReport({
      reportId: reportId as Id<"itemReports">,
      adminUserId: user.userId as Id<"users">,
    });
    toast.success("Laporan berhasil dihapus.");
    router.push("/reports");
  }

  async function handleStatusChange(
    newStatus: "Open" | "Under Review" | "Menuju Pos Admin" | "Sudah di Pos Admin" | "Returned" | "Closed"
  ) {
    if (!user) return;
    await updateStatus({
      reportId: reportId as Id<"itemReports">,
      status: newStatus,
      adminUserId: user.userId as Id<"users">,
      note: `Status diperbarui oleh admin menjadi ${newStatus}.`,
    });
    toast.success("Status laporan diperbarui.");
  }

  async function handleReviewClaim(
    claimId: string,
    decision: "Verified" | "Rejected"
  ) {
    if (!user) return;
    await reviewClaim({
      claimId: claimId as Id<"claims">,
      decision,
      adminUserId: user.userId as Id<"users">,
    });
    toast.success(
      decision === "Verified" ? "Klaim berhasil diverifikasi!" : "Klaim ditolak."
    );
  }

  async function handleSaveHandover(claimId: string) {
    if (!user) return;
    setSavingHandover(true);
    try {
      await updateHandoverStatus({
        claimId: claimId as Id<"claims">,
        adminUserId: user.userId as Id<"users">,
        handoverStatus: handoverChoice,
        handoverNotes,
      });
      toast.success(
        handoverChoice === "Sudah Diambil"
          ? "Status pengambilan: Barang telah diambil oleh pihak yang kehilangan."
          : "Status pengambilan: Belum Diambil."
      );
      setEditingHandoverId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui status.";
      toast.error(msg);
    } finally {
      setSavingHandover(false);
    }
  }

  // Ambil klaim milik user yang sedang login (prioritaskan Pending/Verified, lalu Rejected)
  const userClaim = claims?.find(
    (c) => c.userId === user?.userId && (c.status === "Pending" || c.status === "Verified")
  ) ?? claims?.find((c) => c.userId === user?.userId && c.status === "Rejected");

  // User bisa klaim jika belum ada klaim aktif (Pending/Verified). Jika sudah Rejected, boleh klaim ulang.
  const hasActiveClaim = !!(claims?.find(
    (c) => c.userId === user?.userId && (c.status === "Pending" || c.status === "Verified")
  ));

  const canClaim =
    user &&
    !isAdmin &&
    !hasActiveClaim &&
    report.status !== "Returned" &&
    report.status !== "Closed" &&
    ((report.type === "Found" && user.userId !== report.userId) ||
      (report.type === "Lost" && user.userId === report.userId && report.status === "Sudah di Pos Admin"));

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Back */}
      <Link
        href="/reports"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#6a046a] mb-5 transition-colors font-semibold"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Kembali ke Daftar Laporan
      </Link>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* ─── Main Content ──────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-5">
          {/* Image & Header Card */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            {report.imageUrl ? (
              <div
                onClick={() => setShowImagePreview(true)}
                className="relative h-72 sm:h-80 w-full bg-slate-100 cursor-pointer group overflow-hidden"
                title="Tap untuk preview foto penuh"
              >
                <Image
                  src={report.imageUrl}
                  alt={report.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  priority
                />
                {/* Overlay Tap untuk Preview */}
                <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-lg">
                    <ZoomIn className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-semibold bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm shadow">
                    Tap untuk Preview Layar Penuh
                  </span>
                </div>
                {/* Badge mobile */}
                <div className="absolute bottom-2.5 right-2.5 sm:hidden pointer-events-none">
                  <span className="text-[11px] font-semibold bg-black/70 text-white px-2 py-1 rounded flex items-center gap-1 backdrop-blur-sm">
                    <ZoomIn className="w-3 h-3" /> Tap untuk Preview
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-44 bg-[#fbf4fb] flex flex-col items-center justify-center gap-2 border-b border-slate-100">
                <CategoryIcon name={report.categoryName} className="w-12 h-12 text-[#6a046a]/60" />
                <span className="text-xs text-slate-500 font-semibold">{report.categoryName}</span>
              </div>
            )}

            {/* Badges & Description */}
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={statusBadgeClass(report.status)}>
                  {statusLabel(report.status)}
                </span>
                {report.isHidden && (
                  <span className="bg-rose-500 text-white px-2 py-0.5 rounded text-[11px] font-bold">
                    Tersembunyi
                  </span>
                )}
              </div>

              <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 mb-2.5">
                {report.title}
              </h1>

              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                {report.description}
              </p>
            </div>
          </div>

          {/* Meta Info */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 text-xs mb-3.5 flex items-center gap-1.5 uppercase tracking-wide">
              <FileText className="w-4 h-4 text-[#6a046a]" />
              Detail Informasi
            </h2>
            <div className="space-y-3 text-xs">
              {[
                {
                  icon: <MapPin className="w-4 h-4 text-[#6a046a]" />,
                  label: report.type === "Lost" ? "Lokasi Terakhir Dilihat" : "Lokasi Ditemukan",
                  value: report.location,
                },
                {
                  icon: <Calendar className="w-4 h-4 text-[#6a046a]" />,
                  label: "Tanggal Kejadian",
                  value: formatDate(report.date),
                },
                {
                  icon: <Tag className="w-4 h-4 text-purple-600" />,
                  label: "Kategori Barang",
                  value: report.categoryName,
                },
                {
                  icon: <User className="w-4 h-4 text-slate-600" />,
                  label: "Dilaporkan Oleh",
                  value: `${report.authorName} (${report.authorCampusId})`,
                },
                {
                  icon: <Clock className="w-4 h-4 text-slate-400" />,
                  label: "Waktu Pembuatan",
                  value: timeAgo(report.createdAt),
                },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2.5 border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
                  <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
                  <div>
                    <span className="text-slate-400 block font-medium text-[11px]">
                      {item.label}
                    </span>
                    <span className="text-slate-800 font-semibold">
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status History Timeline */}
          {report.statusHistory && report.statusHistory.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
              <h2 className="font-semibold text-slate-800 text-xs mb-4 flex items-center gap-1.5 uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4 text-[#6a046a]" />
                Riwayat Status Laporan
              </h2>
              <div className="relative pl-1">
                {report.statusHistory.map((h, idx) => (
                  <div key={h._id} className="flex gap-3 mb-3.5 last:mb-0">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          idx === report.statusHistory.length - 1
                            ? "bg-[#6a046a] text-white"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        <Check className="w-3 h-3" />
                      </div>
                      {idx < report.statusHistory.length - 1 && (
                        <div className="w-0.5 h-full bg-slate-200 mt-1" />
                      )}
                    </div>
                    <div className="pb-3">
                      <span
                        className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded mb-1 ${statusBadgeClass(
                          h.statusName
                        )}`}
                      >
                        {statusLabel(h.statusName)}
                      </span>
                      {h.note && (
                        <p className="text-xs text-slate-600 mt-0.5">{h.note}</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {timeAgo(h.updatedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── Sidebar ────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Action Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
            {canClaim ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-[#6a046a]" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    {user.userId === report.userId ? "Ajukan Pengambilan" : "Klaim Kepemilikan"}
                  </h3>
                </div>
                {userClaim?.status === "Rejected" && (
                  <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 leading-relaxed">
                    <span className="font-bold block mb-0.5">Klaim sebelumnya ditolak.</span>
                    {userClaim.adminNote && <span className="text-rose-700">Catatan admin: {userClaim.adminNote}</span>}
                    <span className="block mt-1 text-rose-600">Anda dapat mengajukan klaim baru dengan bukti yang lebih lengkap.</span>
                  </div>
                )}
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  {user.userId === report.userId 
                    ? "Barang Anda telah diamankan di pos admin. Silakan ajukan pengambilan untuk memproses serah terima."
                    : "Jika barang ini adalah milik Anda, silakan ajukan klaim dan berikan rincian bukti kepemilikan."}
                </p>
                <button
                  id="claim-btn"
                  onClick={() => setClaimModalOpen(true)}
                  className="btn-primary w-full flex items-center justify-center gap-1.5 text-xs py-2.5 shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {user.userId === report.userId ? "Ajukan Pengambilan Barang" : userClaim?.status === "Rejected" ? "Ajukan Klaim Ulang" : "Ajukan Klaim Sekarang"}
                </button>
              </div>
            ) : userClaim?.status === "Pending" ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-slate-800 text-sm">Klaim Sedang Diproses</h3>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-900 leading-relaxed">
                  <p className="font-semibold mb-1">Klaim Anda sedang menunggu verifikasi admin.</p>
                  <p className="text-amber-700">Kami akan menghubungi Anda setelah admin melakukan peninjauan. Harap bersabar.</p>
                  <p className="mt-2 text-[11px] text-amber-600">Diajukan: {userClaim.submitDate}</p>
                </div>
              </div>
            ) : userClaim?.status === "Verified" ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-slate-800 text-sm">Klaim Diverifikasi</h3>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-xs text-emerald-900 leading-relaxed">
                  <p className="font-semibold mb-1">Klaim kepemilikan Anda telah disetujui!</p>
                  {userClaim.handoverStatus === "Belum Diambil" ? (
                    <p className="text-emerald-700">Silakan datang ke pos keamanan UNKLAB untuk mengambil barang Anda.</p>
                  ) : (
                    <p className="text-emerald-700">Barang telah berhasil diambil. Proses selesai.</p>
                  )}
                  {userClaim.adminNote && (
                    <p className="mt-2 text-[11px] italic text-emerald-600">Catatan: {userClaim.adminNote}</p>
                  )}
                </div>
              </div>
            ) : report.type === "Lost" && user?.userId === report.userId && userClaim ? (
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#6a046a] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-800 mb-0.5">
                    Pengambilan Diproses
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Segera ke pos admin untuk melakukan pengambilan barang Anda.
                  </p>
                </div>
              </div>
            ) : report.type === "Lost" ? (
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-800 mb-0.5">
                    Barang Hilang
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Jika Anda menemukan barang ini di kampus, serahkan ke pos keamanan UNKLAB.
                  </p>
                </div>
              </div>
            ) : report.status === "Returned" || report.status === "Closed" ? (
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#6a046a] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-800 mb-0.5">
                    {report.status === "Returned"
                      ? "Barang Sudah Dikembalikan"
                      : "Laporan Telah Ditutup"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Proses laporan ini telah selesai.
                  </p>
                </div>
              </div>
            ) : !user ? (
              <div>
                <p className="text-xs font-bold text-slate-800 mb-1">
                  Klaim Barang Ini
                </p>
                <p className="text-xs text-slate-500 mb-3">
                  Masuk dengan akun UNKLAB untuk mengajukan klaim kepemilikan.
                </p>
                <Link
                  href="/auth/login"
                  className="btn-primary w-full text-xs text-center block"
                >
                  Masuk Akun
                </Link>
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-1">
                Laporan ini dibuat oleh akun Anda.
              </div>
            )}
          </div>

          {/* Claims Count Banner */}
          {report.claimsCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 font-medium">
              <p>
                {report.claimsCount} klaim telah diajukan
                {report.pendingClaimsCount > 0 &&
                  ` (${report.pendingClaimsCount} menunggu verifikasi)`}
              </p>
            </div>
          )}

          {/* Admin Controls */}
          {isAdmin && (
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4 text-[#6a046a]" />
                Moderasi Admin
              </h3>

              {/* Status changer */}
              <div>
                <label htmlFor="admin-status" className="text-xs text-slate-600 mb-1 block font-semibold">
                  Ubah Status
                </label>
                <select
                  id="admin-status"
                  value={report.status}
                  onChange={(e) =>
                    handleStatusChange(
                      e.target.value as "Open" | "Under Review" | "Menuju Pos Admin" | "Sudah di Pos Admin" | "Returned" | "Closed"
                    )
                  }
                  className="input-field text-xs py-2"
                >
                  <option value="Open">Aktif (Open)</option>
                  <option value="Under Review">Dalam Tinjauan (Under Review)</option>
                  <option value="Menuju Pos Admin">Menuju Pos Admin</option>
                  <option value="Sudah di Pos Admin">Sudah di Pos Admin</option>
                  <option value="Returned">Dikembalikan (Returned)</option>
                  <option value="Closed">Ditutup (Closed)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleHide}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded transition-colors ${
                    report.isHidden
                      ? "bg-[#f5e6f5] text-[#6a046a] hover:bg-[#eccdec]"
                      : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                  }`}
                >
                  {report.isHidden ? (
                    <>
                      <Eye className="w-3.5 h-3.5" /> Tampilkan
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> Sembunyikan
                    </>
                  )}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus
                </button>
              </div>

              {/* Claims review list */}
              {claims && claims.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-700 mb-2">
                    Daftar Klaim ({claims.length})
                  </p>
                  <div className="space-y-2.5 max-h-60 overflow-y-auto">
                    {claims.map((c) => (
                      <div
                        key={c._id}
                        className="bg-slate-50 rounded p-2.5 text-xs border border-slate-200"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800">
                            {c.claimantName}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
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
                        <p className="text-slate-600 text-[11px] leading-relaxed mb-2 line-clamp-3">
                          {c.proofDescription}
                        </p>
                        {c.status === "Pending" && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() =>
                                handleReviewClaim(c._id, "Verified")
                              }
                              className="flex-1 py-1 rounded bg-[#6a046a] text-white text-[11px] font-bold hover:bg-[#520352] transition-colors flex items-center justify-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Verifikasi
                            </button>
                            <button
                              onClick={() =>
                                handleReviewClaim(c._id, "Rejected")
                              }
                              className="flex-1 py-1 rounded bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700 transition-colors flex items-center justify-center gap-1"
                            >
                              <X className="w-3 h-3" /> Tolak
                            </button>
                          </div>
                        )}

                        {/* Handover status info for verified claims */}
                        {c.status === "Verified" && (
                          <div className="mt-2 pt-2 border-t border-slate-200/70 space-y-1.5">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                                Pengambilan:
                              </span>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (editingHandoverId === c._id) {
                                      setEditingHandoverId(null);
                                    } else {
                                      setEditingHandoverId(c._id);
                                      setHandoverChoice(c.handoverStatus === "Sudah Diambil" ? "Sudah Diambil" : "Belum Diambil");
                                      setHandoverNotes(c.handoverNotes ?? "");
                                    }
                                  }}
                                  className="text-[10px] text-[#6a046a] font-bold hover:underline flex items-center gap-0.5"
                                >
                                  <Edit3 className="w-2.5 h-2.5" />
                                  {editingHandoverId === c._id ? "Tutup" : "Ubah Status"}
                                </button>
                              )}
                            </div>

                            <div>
                              {c.handoverStatus === "Sudah Diambil" ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Sudah Diambil oleh Pemilik
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  <Clock className="w-3 h-3" />
                                  Belum Diambil (Menunggu di Pos Security)
                                </span>
                              )}
                            </div>

                            {c.handoverNotes && editingHandoverId !== c._id && (
                              <p className="text-[10px] text-slate-500 italic bg-white p-1.5 rounded border border-slate-100">
                                Catatan: {c.handoverNotes}
                              </p>
                            )}

                            {/* Admin edit form */}
                            {isAdmin && editingHandoverId === c._id && (
                              <div className="mt-2 p-2 bg-white rounded border border-slate-200 space-y-2">
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setHandoverChoice("Sudah Diambil")}
                                    className={`flex-1 py-1 px-2 rounded text-[10px] font-bold border text-center transition-all ${
                                      handoverChoice === "Sudah Diambil"
                                        ? "bg-emerald-50 border-emerald-400 text-emerald-800"
                                        : "bg-slate-50 border-slate-200 text-slate-600"
                                    }`}
                                  >
                                    Sudah Diambil
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setHandoverChoice("Belum Diambil")}
                                    className={`flex-1 py-1 px-2 rounded text-[10px] font-bold border text-center transition-all ${
                                      handoverChoice === "Belum Diambil"
                                        ? "bg-amber-50 border-amber-400 text-amber-800"
                                        : "bg-slate-50 border-slate-200 text-slate-600"
                                    }`}
                                  >
                                    Belum Diambil
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  value={handoverNotes}
                                  onChange={(e) => setHandoverNotes(e.target.value)}
                                  placeholder="Catatan pengambilan..."
                                  className="w-full text-[10px] p-1.5 rounded border border-slate-200 bg-slate-50"
                                />
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setEditingHandoverId(null)}
                                    className="px-2 py-0.5 text-[10px] text-slate-500 hover:text-slate-800"
                                  >
                                    Batal
                                  </button>
                                  <button
                                    type="button"
                                    disabled={savingHandover}
                                    onClick={() => handleSaveHandover(c._id)}
                                    className="px-2.5 py-0.5 text-[10px] font-bold bg-[#6a046a] text-white rounded hover:bg-[#520352] disabled:opacity-50"
                                  >
                                    {savingHandover ? "..." : "Simpan"}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Claim Modal */}
      {claimModalOpen && (
        <ClaimModal
          reportId={reportId}
          reportTitle={report.title}
          onClose={() => setClaimModalOpen(false)}
        />
      )}

      {/* ─── Tap to Preview Lightbox Modal ───────────────────────────── */}
      {showImagePreview && report?.imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
          onClick={() => setShowImagePreview(false)}
        >
          <div
            className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#6a046a]" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide truncate max-w-xs sm:max-w-md">
                  {report.title} – Foto Barang
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowImagePreview(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                aria-label="Tutup preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 sm:p-4 bg-slate-900/5 flex items-center justify-center overflow-auto max-h-[72vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={report.imageUrl}
                alt={report.title}
                className="max-h-[68vh] w-auto max-w-full object-contain rounded-lg shadow-md"
              />
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-white">
              <p className="text-xs text-slate-500">
                {report.location} • {formatDate(report.date)}
              </p>
              <button
                type="button"
                onClick={() => setShowImagePreview(false)}
                className="px-4 py-1.5 text-xs font-semibold bg-[#6a046a] hover:bg-[#520352] text-white rounded-lg transition-colors shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
