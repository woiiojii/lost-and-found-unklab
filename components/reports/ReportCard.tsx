/**
 * components/reports/ReportCard.tsx
 * Reusable card for displaying a single item report in list/grid view.
 * Theme: Purple #6a046a. Border-radius: 8px. No emojis.
 */
"use client";

import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Calendar,
  Eye,
  Tag,
  Clock,
  Hand,
  ShieldCheck,
} from "lucide-react";
import {
  formatDate,
  statusBadgeClass,
  statusLabel,
  typeBadgeClass,
  typeLabel,
  truncate,
} from "@/lib/utils";
import { CategoryIcon } from "./CategoryIcon";
import { useAuth } from "@/lib/auth-context";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

interface ReportCardProps {
  report: {
    _id: string;
    userId: string;
    type: "Lost" | "Found";
    title: string;
    description: string;
    location: string;
    date: string;
    status: string;
    categoryName: string;
    authorName: string;
    imageUrl?: string | null;
    isHidden?: boolean;
    createdAt: number;
  };
  /** Show admin controls (hide/delete) */
  isAdmin?: boolean;
  onHide?: (id: string, hide: boolean) => void;
  onDelete?: (id: string) => void;
}

export default function ReportCard({
  report,
  isAdmin,
  onHide,
  onDelete,
}: ReportCardProps) {
  const { user } = useAuth();
  const markFound = useMutation(api.reports.markAsFoundByFinder);

  const handleFound = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Silakan login untuk melaporkan penemuan.");
      return;
    }
    const confirmed = window.confirm(
      "Tolong serahkan di pos admin\n\nTekan OK untuk mengonfirmasi bahwa Anda akan menyerahkan barang ini ke pos admin."
    );
    if (confirmed) {
      try {
        await markFound({
          reportId: report._id as Id<"itemReports">,
          finderUserId: user.userId as Id<"users">,
        });
        toast.success("Terima kasih! Silakan serahkan barang tersebut ke pos admin.");
      } catch (err: any) {
        toast.error(err.message || "Terjadi kesalahan.");
      }
    }
  };

  return (
    <article
      className={`group bg-white rounded-lg border border-slate-200 overflow-hidden card-hover transition-all duration-200 shadow-sm ${
        report.isHidden ? "opacity-60 ring-1 ring-rose-200" : ""
      }`}
    >
      {/* Image or Placeholder */}
      <div className="relative h-44 bg-slate-100 overflow-hidden border-b border-slate-100">
        {report.imageUrl ? (
          <Image
            src={report.imageUrl}
            alt={report.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 bg-[#fbf4fb]">
            <CategoryIcon name={report.categoryName} className="w-10 h-10 text-[#6a046a]/60" />
            <span className="text-xs font-semibold text-slate-500">
              {report.categoryName}
            </span>
          </div>
        )}

        {/* Type badges overlay */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5 z-10">
          {report.isHidden && (
            <span className="bg-rose-500 text-white px-2 py-0.5 rounded text-[11px] font-bold">
              Tersembunyi
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-heading font-bold text-slate-900 text-base leading-snug line-clamp-1 group-hover:text-[#6a046a] transition-colors">
            {report.title}
          </h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-2">
          {truncate(report.description, 90)}
        </p>

        <div className="space-y-1.5 mb-3.5 bg-slate-50 p-2.5 rounded border border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-[#6a046a] flex-shrink-0" />
            <span className="truncate">{report.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-[#6a046a] flex-shrink-0" />
            <span>{formatDate(report.date)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <Tag className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
            <span>{report.categoryName}</span>
          </div>
          <div className="pt-2 mt-1 border-t border-slate-200">
            <span className={`${statusBadgeClass(report.status)} w-full justify-center`}>
              {statusLabel(report.status)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 gradient-primary rounded flex items-center justify-center text-white text-[10px] font-bold">
              {report.authorName.charAt(0)}
            </div>
            <span className="text-xs text-slate-700 truncate max-w-[110px] font-medium">
              {report.authorName.split(" ")[0]}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {report.type === "Lost" && report.status === "Open" && user && user.userId !== report.userId && !isAdmin && (
              <button
                onClick={handleFound}
                className="flex items-center gap-1 text-[11px] px-2 py-1 rounded font-semibold bg-[#f5e6f5] text-[#6a046a] hover:bg-[#eccdec] transition-colors"
              >
                <Hand className="w-3.5 h-3.5" />
                Di Temukan
              </button>
            )}

            {report.type === "Found" && report.status !== "Returned" && report.status !== "Closed" && user && user.userId !== report.userId && !isAdmin && (
              <Link
                href={`/reports/${report._id}`}
                id={`claim-report-${report._id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-[11px] px-2 py-1 rounded font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Klaim
              </Link>
            )}

            {/* Admin controls */}
            {isAdmin && (
              <>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onHide?.(report._id, !report.isHidden);
                  }}
                  className={`text-[11px] px-2 py-1 rounded font-semibold transition-colors ${
                    report.isHidden
                      ? "bg-[#f5e6f5] text-[#6a046a] hover:bg-[#eccdec]"
                      : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                  }`}
                >
                  {report.isHidden ? "Tampilkan" : "Sembunyikan"}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete?.(report._id);
                  }}
                  className="text-[11px] px-2 py-1 rounded font-semibold bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors"
                >
                  Hapus
                </button>
              </>
            )}

            <Link
              href={`/reports/${report._id}`}
              id={`view-report-${report._id}`}
              className="flex items-center gap-1 text-xs font-bold text-[#6a046a] hover:text-[#520352] bg-[#fbf4fb] border border-[#eccdec] px-2.5 py-1 rounded transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Detail
            </Link>
          </div>
        </div>
      </div>

      {/* Posted time footer */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 text-slate-400">
        <Clock className="w-3 h-3" />
        <span className="text-[10px]">
          Dibuat {formatDate(report.createdAt)}
        </span>
      </div>
    </article>
  );
}
