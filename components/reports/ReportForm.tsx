/**
 * components/reports/ReportForm.tsx
 * Unified form for creating Lost or Found item reports.
 * Supports image upload to Convex Storage.
 * Theme: Purple #6a046a. Border-radius: 8px. No emojis.
 */
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import {
  Upload,
  X,
  MapPin,
  Calendar,
  FileText,
  Tag,
  Loader2,
  ImageIcon,
  Search,
  Package,
  ZoomIn,
  Eye,
  Trash2,
} from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface ReportFormProps {
  defaultType?: "Lost" | "Found";
}

const FALLBACK_CATEGORIES = [
  "Elektronik",
  "Dokumen & Kartu",
  "Aksesori & Perhiasan",
  "Pakaian & Sepatu",
  "Kunci & Gantungan",
  "Buku & Alat Tulis",
  "Tas & Dompet",
  "Lainnya",
];

export default function ReportForm({ defaultType = "Lost" }: ReportFormProps) {
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  const [type, setType] = useState<"Lost" | "Found">(defaultType);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Close lightbox on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowPreviewModal(false);
      }
    }
    if (showPreviewModal) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showPreviewModal]);


  const categories = useQuery(api.reports.listCategories);
  const initCategories = useMutation(api.reports.initCategories);
  const generateUploadUrl = useMutation(api.reports.generateUploadUrl);
  const createReport = useMutation(api.reports.createReport);

  // Auto-seed categories if query finishes and returns empty
  useEffect(() => {
    if (categories !== undefined && categories.length === 0) {
      initCategories().catch(() => { });
    }
  }, [categories, initCategories]);

  // Set first category automatically once loaded if not chosen
  useEffect(() => {
    if (categories && categories.length > 0 && !categoryId) {
      setCategoryId(categories[0]._id);
    }
  }, [categories, categoryId]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto maksimum 5MB.");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setImagePreview(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    setShowPreviewModal(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("Anda harus masuk untuk membuat laporan.");
      router.push("/auth/login");
      return;
    }
    if (isAdmin) {
      toast.error("Administrator tidak diizinkan membuat laporan. Fokus admin adalah memantau dan memverifikasi klaim.");
      return;
    }
    if (!title.trim()) {
      toast.error("Nama barang harus diisi.");
      return;
    }
    if (!location.trim()) {
      toast.error("Lokasi barang harus diisi.");
      return;
    }

    setLoading(true);
    try {
      let storageId: string | undefined;

      if (imageFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": imageFile.type },
          body: imageFile,
        });
        const json = await result.json();
        storageId = json.storageId;
      }

      const reportId = await createReport({
        userId: user.userId as Id<"users">,
        type,
        title: title.trim(),
        categoryId: categoryId ? (categoryId as Id<"categories">) : undefined,
        description: description.trim(),
        location: location.trim(),
        date,
        storageId,
      });

      toast.success(
        `Laporan ${type === "Lost" ? "kehilangan" : "penemuan"} berhasil dibuat!`
      );
      router.push(`/reports/${reportId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden"
      noValidate
    >
      {/* ─── Type Toggle ─────────────────────────────────────────────── */}
      <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50">
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Jenis Laporan <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(["Lost", "Found"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-lg border text-sm font-semibold transition-all ${type === t
                  ? t === "Lost"
                    ? "border-rose-400 bg-rose-50 text-rose-700 shadow-sm"
                    : "border-[#6a046a] bg-[#fbf4fb] text-[#6a046a] shadow-sm"
                  : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
                }`}
            >
              {t === "Lost" ? (
                <Search className="w-4 h-4 text-rose-600" />
              ) : (
                <Package className="w-4 h-4 text-[#6a046a]" />
              )}
              <span>{t === "Lost" ? "Barang Hilang" : "Barang Ditemukan"}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-4">
        {/* ─── Title ─────────────────────────────────────────────────── */}
        <div>
          <label
            htmlFor="report-title"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            Nama Barang <span className="text-rose-500">*</span>
          </label>
          <div className="input-icon-wrapper">
            <FileText className="input-icon" />
            <input
              id="report-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Dompet kulit cokelat, Laptop Asus ROG, Kunci motor..."
              className="input-field"
              maxLength={100}
            />
          </div>
        </div>

        {/* ─── Category ───────────────────────────────────────────────── */}
        <div>
          <label
            htmlFor="report-category"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            Kategori Barang <span className="text-rose-500">*</span>
          </label>
          <div className="input-icon-wrapper">
            <Tag className="input-icon" />
            <select
              id="report-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="input-field"
            >
              {categories && categories.length > 0 ? (
                categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))
              ) : (
                FALLBACK_CATEGORIES.map((cat, idx) => (
                  <option key={idx} value="">
                    {cat}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* ─── Description ────────────────────────────────────────────── */}
        <div>
          <label
            htmlFor="report-desc"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            Deskripsi Detail <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="report-desc"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Jelaskan ciri-ciri barang secara spesifik (warna, merek, kondisi, nomor seri, tanda khusus)..."
            className="input-field resize-none"
            maxLength={1000}
          />
          <p className="text-[11px] text-slate-400 mt-1 text-right">
            {description.length}/1000
          </p>
        </div>

        {/* ─── Location ───────────────────────────────────────────────── */}
        <div>
          <label
            htmlFor="report-location"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            Lokasi {type === "Lost" ? "Terakhir Dilihat" : "Ditemukan"}{" "}
            <span className="text-rose-500">*</span>
          </label>
          <div className="input-icon-wrapper">
            <MapPin className="input-icon" />
            <input
              id="report-location"
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Contoh: Gedung GK2 Lantai 3, Kantin Utama UNKLAB, Perpustakaan..."
              className="input-field"
              maxLength={200}
            />
          </div>
        </div>

        {/* ─── Date ───────────────────────────────────────────────────── */}
        <div>
          <label
            htmlFor="report-date"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            Tanggal Kehilangan <span className="text-rose-500">*</span>
          </label>
          <div className="input-icon-wrapper">
            <Calendar className="input-icon" />
            <input
              id="report-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="input-field"
            />
          </div>
        </div>

        {/* ─── Photo Upload (Optional) ─────────────────────────────────── */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Foto Barang (Opsional)
          </label>

          {imagePreview ? (
            <div className="space-y-2">
              <div
                onClick={() => setShowPreviewModal(true)}
                className="relative rounded-lg overflow-hidden border-2 border-dashed border-[#6a046a]/30 hover:border-[#6a046a] w-full max-w-sm h-52 bg-slate-100 shadow-sm group cursor-pointer transition-all"
                title="Ketuk untuk melihat preview ukuran penuh"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Preview barang"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Tap to Preview Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-lg">
                    <ZoomIn className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-semibold bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm shadow">
                    Tap untuk Preview Layar Penuh
                  </span>
                </div>

                {/* Badge visible for touch / mobile */}
                <div className="absolute bottom-2 left-2 pointer-events-none group-hover:hidden">
                  <span className="text-[11px] font-semibold bg-black/70 text-white px-2 py-0.5 rounded flex items-center gap-1 backdrop-blur-sm">
                    <ZoomIn className="w-3 h-3" /> Tap untuk Preview
                  </span>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage();
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-rose-600 text-white rounded-md transition-colors shadow z-10"
                  aria-label="Hapus foto"
                  title="Hapus foto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons under thumbnail */}
              <div className="flex items-center gap-2 max-w-sm">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="flex-1 text-xs font-semibold py-2 px-3 border border-[#6a046a]/30 text-[#6a046a] hover:bg-[#fbf4fb] rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Tap untuk Preview
                </button>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="text-xs font-medium py-2 px-3 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Ganti Foto
                </button>
                <button
                  type="button"
                  onClick={removeImage}
                  className="text-xs font-medium py-2 px-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg flex items-center justify-center transition-colors"
                  title="Hapus foto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-[#6a046a] rounded-lg p-5 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-[#fbf4fb]"
            >
              <Upload className="w-7 h-7 text-[#6a046a] mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-slate-700">
                Klik untuk unggah foto barang
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Format JPG, PNG, WEBP (maks. 5MB)
              </p>
            </div>
          )}

          <input
            ref={fileRef}
            id="report-file-input"
            type="file"
            accept="image/*"
            onClick={(e) => {
              (e.target as HTMLInputElement).value = "";
            }}
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        {/* ─── Submit Button ───────────────────────────────────────────── */}
        <div className="pt-2 border-t border-slate-100">
          <button
            id="report-submit-btn"
            type="submit"
            disabled={loading || !title.trim() || !location.trim()}
            className="w-full btn-primary py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menyimpan Laporan...
              </>
            ) : (
              `Publikasikan Laporan ${type === "Lost" ? "Kehilangan" : "Penemuan"}`
            )}
          </button>
        </div>
      </div>

      {/* ─── Tap to Preview Modal (Lightbox) ─────────────────────────── */}
      {showPreviewModal && imagePreview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#6a046a]" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Preview Foto Barang
                </span>
                {imageFile && (
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    ({(imageFile.size / 1024).toFixed(0)} KB)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                aria-label="Tutup preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Image */}
            <div className="p-3 sm:p-4 bg-slate-900/5 flex items-center justify-center overflow-auto max-h-[70vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Preview barang layar penuh"
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-md"
              />
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-white">
              <p className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-xs">
                {imageFile?.name ?? "Foto barang"}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    fileRef.current?.click();
                    setShowPreviewModal(false);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors"
                >
                  Ganti Foto
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-1.5 text-xs font-semibold bg-[#6a046a] hover:bg-[#520352] text-white rounded-lg transition-colors shadow-sm"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
