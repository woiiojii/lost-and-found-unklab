/**
 * app/(main)/reports/new/page.tsx – Create Report Page
 * Theme: Purple #6a046a. Border-radius: 8px.
 */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import ReportForm from "@/components/reports/ReportForm";
import { ArrowLeft, PlusCircle, ShieldAlert, Shield, FileText } from "lucide-react";
import Link from "next/link";

export default function NewReportPage() {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login?redirect=/reports/new");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#6a046a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  // Admin cannot create reports (focus is monitoring and reviewing claims)
  if (isAdmin) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in space-y-4">
        <Link
          href="/reports"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#6a046a] transition-colors font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Daftar Laporan
        </Link>

        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200 shadow-sm">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="font-heading text-lg sm:text-xl font-bold text-slate-900">
              Akses Pembuatan Laporan Dibatasi
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Sebagai <strong>Administrator</strong>, Anda tidak dapat membuat laporan barang hilang maupun penemuan. Peran utama admin adalah <strong>memantau laporan kampus</strong>, <strong>menyetujui klaim barang</strong>, dan <strong>memperbarui keterangan pengambilan barang</strong>.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/admin"
              className="btn-primary text-xs py-2.5 px-5 flex items-center gap-2 shadow-sm"
            >
              <Shield className="w-4 h-4" />
              Buka Panel Administrator
            </Link>
            <Link
              href="/reports"
              className="btn-outline text-xs py-2.5 px-5 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Pantau Daftar Laporan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in space-y-4">
      {/* Back link */}
      <Link
        href="/reports"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#6a046a] transition-colors font-semibold"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Kembali ke Daftar Laporan
      </Link>

      {/* Page title */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 gradient-primary rounded-lg flex items-center justify-center shadow-sm">
          <PlusCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-bold text-slate-900">
            Buat Laporan Baru
          </h1>
          <p className="text-xs text-slate-500">
            Isi rincian barang hilang atau temuan Anda di kampus UNKLAB
          </p>
        </div>
      </div>

      <ReportForm />
    </div>
  );
}
