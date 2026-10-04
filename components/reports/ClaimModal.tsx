/**
 * components/reports/ClaimModal.tsx
 * Modal for submitting an ownership claim on a Found item.
 * Theme: Purple #6a046a. Border-radius: 8px. No emojis.
 */
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { X, FileText, AlertCircle, Loader2, ShieldCheck, Send } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface ClaimModalProps {
  reportId: string;
  reportTitle: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ClaimModal({
  reportId,
  reportTitle,
  onClose,
  onSuccess,
}: ClaimModalProps) {
  const { user } = useAuth();
  const [proof, setProof] = useState("");
  const [loading, setLoading] = useState(false);
  const submitClaim = useMutation(api.claims.submitClaim);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("Silakan masuk terlebih dahulu untuk mengajukan klaim.");
      return;
    }
    if (proof.trim().length < 30) {
      toast.error("Deskripsi bukti terlalu singkat (minimal 30 karakter).");
      return;
    }

    setLoading(true);
    try {
      await submitClaim({
        reportId: reportId as Id<"itemReports">,
        userId: user.userId as Id<"users">,
        proofDescription: proof.trim(),
      });
      toast.success("Klaim berhasil diajukan! Admin akan segera meninjau.");
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengajukan klaim.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card (8px radius) */}
      <div className="relative z-[100] bg-white rounded-lg shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden animate-slide-up my-8">
        {/* Top Accent Bar */}
        <div className="gradient-primary h-1.5 w-full" />

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#f5e6f5] rounded flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-[#6a046a]" />
            </div>
            <div>
              <h2
                id="claim-modal-title"
                className="font-heading font-bold text-slate-800 text-base"
              >
                Ajukan Klaim Kepemilikan
              </h2>
              <p className="text-xs text-slate-500 truncate max-w-[260px]">
                {reportTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Tutup modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="mx-4 sm:mx-5 mt-4 flex gap-2.5 bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-900 leading-relaxed">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p>
            Berikan rincian bukti kepemilikan spesifik — nomor seri, ciri khas unik,
            nama pada barang, warna casing, atau isi kantong untuk verifikasi administrator.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div>
            <label
              htmlFor="claim-proof"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Deskripsi Bukti Kepemilikan <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="claim-proof"
              required
              rows={4}
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              placeholder="Jelaskan secara detail bukti bahwa ini barang milik Anda..."
              className="input-field resize-none"
              minLength={30}
              maxLength={1000}
            />
            <p
              className={`text-[11px] mt-1 text-right font-medium ${
                proof.trim().length < 30 ? "text-amber-600" : "text-slate-400"
              }`}
            >
              {proof.trim().length}/1000 (minimal 30 karakter)
            </p>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-outline text-xs py-2.5"
            >
              Batal
            </button>
            <button
              id="submit-claim-btn"
              type="submit"
              disabled={loading || proof.trim().length < 30}
              className="flex-1 btn-primary text-xs py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Kirim Klaim
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
