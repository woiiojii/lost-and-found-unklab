/**
 * app/(main)/reports/page.tsx – Search & Browse Reports Page
 * Real-time filtering by keyword, type, category, and status.
 * Theme: Purple #6a046a. Border-radius: 8px. No emojis.
 */
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import ReportCard from "@/components/reports/ReportCard";
import { Search, SlidersHorizontal, X, PlusCircle, Inbox, Package } from "lucide-react";
import Link from "next/link";
import type { Id } from "@/convex/_generated/dataModel";

export default function ReportsPage() {
  const searchParams = useSearchParams();
  const initialQ = searchParams?.get("q") ?? "";
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [selectedType, setSelectedType] = useState<"" | "Lost" | "Found">("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Sync if user navigates from header search with a different ?q=
  useEffect(() => {
    const q = searchParams?.get("q") ?? "";
    setSearchQuery(q);
  }, [searchParams]);

  const categories = useQuery(api.reports.listCategories);

  const queryStatus = selectedStatus || undefined;

  // Convex real-time query
  const reports = useQuery(api.reports.listReports, {
    type: selectedType || undefined,
    categoryId: selectedCategory ? (selectedCategory as Id<"categories">) : undefined,
    status: queryStatus as any,
    searchQuery: searchQuery || undefined,
    includeHidden: false,
  });

  const hasFilters = selectedType || selectedCategory || selectedStatus;

  function clearFilters() {
    setSelectedType("");
    setSelectedCategory("");
    setSelectedStatus("");
    setSearchQuery("");
  }

  return (
    <div className="animate-fade-in space-y-5">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">
            Pencarian Barang
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {reports !== undefined
              ? `${reports.length} laporan ditemukan`
              : "Memuat laporan..."}
          </p>
        </div>
        <Link href="/reports/new" className="btn-primary text-xs flex items-center gap-1.5 shadow-sm">
          <PlusCircle className="w-4 h-4" />
          <span>Buat Laporan</span>
        </Link>
      </div>

      {/* ─── Search & Filters Card (8px radius) ──────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        {/* Search input with proper icon padding */}
        <div className="relative">
          <div className="input-icon-wrapper">
            <Search className="input-icon" />
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama barang, ciri fisik, lokasi penemuan..."
              className="input-field pr-10"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Hapus pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded transition-colors ${
              showFilters || hasFilters
                ? "bg-[#f5e6f5] text-[#6a046a]"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filter {hasFilters ? "" : ""}
          </button>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <X className="w-3 h-3" />
              Reset Filter
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100 grid sm:grid-cols-3 gap-3 animate-fade-in">
            {/* Type filter */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Jenis Laporan
              </label>
              <div className="flex gap-1.5">
                {(["", "Lost", "Found"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedType(t)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded border transition-all ${
                      selectedType === t
                        ? t === "Lost"
                          ? "border-rose-400 bg-rose-50 text-rose-700"
                          : t === "Found"
                            ? "border-[#6a046a] bg-[#fbf4fb] text-[#6a046a]"
                            : "border-slate-800 bg-slate-800 text-white"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {t === "" ? "Semua" : t === "Lost" ? "Hilang" : "Temuan"}
                  </button>
                ))}
              </div>
            </div>

            {/* Category filter */}
            <div>
              <label htmlFor="filter-category" className="text-xs font-semibold text-slate-700 mb-1 block">
                Kategori
              </label>
              <select
                id="filter-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-field"
              >
                <option value="">Semua Kategori</option>
                {categories?.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div>
              <label htmlFor="filter-status" className="text-xs font-semibold text-slate-700 mb-1 block">
                Status
              </label>
              <select
                id="filter-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input-field"
              >
                <option value="">Status Aktif</option>
                <option value="all">Semua (Termasuk Selesai)</option>
                <option value="Open">Aktif (Open)</option>
                <option value="Menuju Pos Admin">Menuju Pos Admin</option>
                <option value="Sudah di Pos Admin">Sudah di Pos Admin</option>
                <option value="Under Review">Dalam Tinjauan</option>
                <option value="Returned">Dikembalikan</option>
                <option value="Closed">Ditutup</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ─── Type Quick Tabs ─────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(
          [
            { val: "", label: "Semua Laporan" },
            { val: "Lost", label: "Barang Hilang" },
            { val: "Found", label: "Barang Ditemukan" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.val}
            onClick={() => setSelectedType(tab.val)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedType === tab.val
                ? "bg-[#6a046a] text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-700 hover:border-[#6a046a]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Reports Grid ─────────────────────────────────────────────── */}
      {reports === undefined ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-slate-200 h-64 animate-pulse"
            >
              <div className="h-40 bg-slate-100 rounded-t-lg" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
          <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
          <h3 className="font-heading font-bold text-slate-800 text-base mb-1">
            Tidak Ada Laporan Ditemukan
          </h3>
          <p className="text-slate-500 text-xs mb-4">
            Coba sesuaikan kata kunci pencarian atau ubah filter Anda.
          </p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="btn-outline text-xs"
            >
              Reset Semua Filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.map((r) => (
            <ReportCard key={r._id} report={r} />
          ))}
        </div>
      )}
    </div>
  );
}
