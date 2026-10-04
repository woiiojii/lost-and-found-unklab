/**
 * claims.ts – Convex mutations & queries for item ownership claims.
 * Covers use cases: Submit Claim (user) and Review Claim (admin).
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Submit a Claim ───────────────────────────────────────────────────────────
export const submitClaim = mutation({
  args: {
    reportId: v.id("itemReports"),
    userId: v.id("users"),
    proofDescription: v.string(),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Laporan tidak ditemukan.");
    const isFinderClaimingFound = report.type === "Found" && report.userId !== args.userId;
    const isOwnerRetrievingLost = report.type === "Lost" && report.userId === args.userId && report.status === "Sudah di Pos Admin";

    if (!isFinderClaimingFound && !isOwnerRetrievingLost) {
      throw new Error("Klaim hanya dapat diajukan untuk laporan barang ditemukan atau pengambilan barang hilang yang sudah di pos admin.");
    }
    const claimantUser = await ctx.db.get(args.userId);
    if (claimantUser?.role === "admin") {
      throw new Error("Administrator tidak dapat mengajukan klaim barang.");
    }

    if (report.status === "Returned" || report.status === "Closed") {
      throw new Error("Laporan ini sudah ditutup atau barang sudah dikembalikan.");
    }

    // Prevent duplicate pending/verified claims from the same user.
    // Rejected claims are allowed to re-submit with better proof.
    const reportClaims = await ctx.db
      .query("claims")
      .withIndex("by_reportId", (q) => q.eq("reportId", args.reportId))
      .collect();

    const existingPending = reportClaims.find(
      (c) => c.userId === args.userId && c.status === "Pending"
    );
    if (existingPending) {
      throw new Error("Anda sudah memiliki klaim yang sedang diproses untuk laporan ini.");
    }

    const existingVerified = reportClaims.find(
      (c) => c.userId === args.userId && c.status === "Verified"
    );
    if (existingVerified) {
      throw new Error("Klaim Anda untuk laporan ini sudah diverifikasi.");
    }

    const today = new Date().toISOString().split("T")[0];
    const claimId = await ctx.db.insert("claims", {
      reportId: args.reportId,
      userId: args.userId,
      proofDescription: args.proofDescription.trim(),
      status: "Pending",
      submitDate: today,
    });

    // Move item status to "Under Review"
    await ctx.db.patch(args.reportId, { status: "Under Review" });

    // Status history
    await ctx.db.insert("statusHistory", {
      reportId: args.reportId,
      statusName: "Under Review",
      changedBy: args.userId,
      note: "Klaim kepemilikan baru diajukan oleh pengguna.",
      updatedAt: Date.now(),
    });

    // Notify the report owner
    const claimant = await ctx.db.get(args.userId);
    await ctx.db.insert("notifications", {
      userId: report.userId,
      message: `${claimant?.name ?? "Seseorang"} mengajukan klaim untuk barang "${report.title}" Anda. Menunggu verifikasi admin.`,
      isRead: false,
      reportId: args.reportId,
      createdAt: Date.now(),
    });

    return claimId;
  },
});

// ─── Get Claims for a Report ──────────────────────────────────────────────────
export const getClaimsForReport = query({
  args: { reportId: v.id("itemReports") },
  handler: async (ctx, args) => {
    const claims = await ctx.db
      .query("claims")
      .withIndex("by_reportId", (q) => q.eq("reportId", args.reportId))
      .collect();

    claims.sort((a, b) => b._creationTime - a._creationTime);

    return Promise.all(
      claims.map(async (c) => {
        const user = await ctx.db.get(c.userId);
        return {
          ...c,
          claimantName: user?.name ?? "Unknown",
          claimantCampusId: user?.campusId ?? "",
          claimantEmail: user?.email ?? "",
        };
      })
    );
  },
});

// ─── Get All Claims (Admin) ───────────────────────────────────────────────────
export const getAllClaims = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("Pending"),
        v.literal("Verified"),
        v.literal("Rejected")
      )
    ),
  },
  handler: async (ctx, args) => {
    let claims = await ctx.db.query("claims").collect();
    claims.sort((a, b) => b._creationTime - a._creationTime);

    if (args.status) {
      claims = claims.filter((c) => c.status === args.status);
    }

    return Promise.all(
      claims.map(async (c) => {
        const user = await ctx.db.get(c.userId);
        const report = await ctx.db.get(c.reportId);
        return {
          ...c,
          claimantName: user?.name ?? "Unknown",
          claimantCampusId: user?.campusId ?? "",
          claimantEmail: user?.email ?? "",
          reportTitle: report?.title ?? "Laporan Dihapus",
          reportType: report?.type ?? "Found",
        };
      })
    );
  },
});

// ─── Review Claim (Admin) ────────────────────────────────────────────────────
export const reviewClaim = mutation({
  args: {
    claimId: v.id("claims"),
    decision: v.union(v.literal("Verified"), v.literal("Rejected")),
    adminUserId: v.id("users"),
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const claim = await ctx.db.get(args.claimId);
    if (!claim) throw new Error("Klaim tidak ditemukan.");

    await ctx.db.patch(args.claimId, {
      status: args.decision,
      adminNote: args.adminNote,
      reviewedAt: Date.now(),
      handoverStatus: args.decision === "Verified" ? "Belum Diambil" : undefined,
    });

    const report = await ctx.db.get(claim.reportId);

    // If verified → mark item as "Under Review" or "Returned" (Menunggu Pengambilan)
    if (args.decision === "Verified" && report) {
      await ctx.db.patch(claim.reportId, { status: "Under Review" });
      await ctx.db.insert("statusHistory", {
        reportId: claim.reportId,
        statusName: "Under Review",
        changedBy: args.adminUserId,
        note: `Klaim disetujui/diverifikasi oleh admin. Status: Belum diambil oleh pemilik (menunggu pengambilan di pos security). ${args.adminNote ? `Catatan: ${args.adminNote}` : ""}`,
        updatedAt: Date.now(),
      });
    }

    // Notify the claimant
    const decisionLabel =
      args.decision === "Verified"
        ? "✅ disetujui / diverifikasi. Silakan ambil barang Anda di pos keamanan/security UNKLAB."
        : "❌ ditolak oleh administrator.";

    await ctx.db.insert("notifications", {
      userId: claim.userId,
      message: `Klaim Anda untuk "${report?.title ?? "barang"}" ${decisionLabel}${args.adminNote ? ` Catatan: ${args.adminNote}` : ""}`,
      isRead: false,
      reportId: claim.reportId,
      createdAt: Date.now(),
    });

    // If decision is verified, reject other pending claims for the same report
    if (args.decision === "Verified" && report) {
      const allReportClaims = await ctx.db
        .query("claims")
        .withIndex("by_reportId", (q) => q.eq("reportId", claim.reportId))
        .collect();

      const otherClaims = allReportClaims.filter(
        (c) => c._id !== args.claimId && c.status === "Pending"
      );

      for (const other of otherClaims) {
        await ctx.db.patch(other._id, {
          status: "Rejected",
          adminNote: "Klaim lain untuk barang ini sudah diverifikasi.",
          reviewedAt: Date.now(),
        });
        await ctx.db.insert("notifications", {
          userId: other.userId,
          message: `Klaim Anda untuk "${report.title}" ditutup karena klaim lain telah diverifikasi oleh admin.`,
          isRead: false,
          reportId: claim.reportId,
          createdAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});

// ─── Update Handover Status (Admin) ──────────────────────────────────────────
export const updateHandoverStatus = mutation({
  args: {
    claimId: v.id("claims"),
    adminUserId: v.id("users"),
    handoverStatus: v.union(v.literal("Belum Diambil"), v.literal("Sudah Diambil")),
    handoverNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminUserId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Hanya administrator yang dapat memperbarui keterangan pengambilan barang.");
    }

    const claim = await ctx.db.get(args.claimId);
    if (!claim) throw new Error("Klaim tidak ditemukan.");

    const today = new Date().toISOString().split("T")[0];
    await ctx.db.patch(args.claimId, {
      handoverStatus: args.handoverStatus,
      handoverNotes: args.handoverNotes?.trim(),
      handoverDate: args.handoverStatus === "Sudah Diambil" ? today : undefined,
    });

    const report = await ctx.db.get(claim.reportId);
    if (report) {
      const newReportStatus = args.handoverStatus === "Sudah Diambil" ? "Returned" : "Under Review";
      await ctx.db.patch(claim.reportId, { status: newReportStatus });

      await ctx.db.insert("statusHistory", {
        reportId: claim.reportId,
        statusName: newReportStatus,
        changedBy: args.adminUserId,
        note: `Keterangan pengambilan: Barang ${args.handoverStatus.toLowerCase()} oleh pihak yang kehilangan.${args.handoverNotes?.trim() ? ` Catatan: ${args.handoverNotes.trim()}` : ""}`,
        updatedAt: Date.now(),
      });

      // Notify the claimant
      await ctx.db.insert("notifications", {
        userId: claim.userId,
        message:
          args.handoverStatus === "Sudah Diambil"
            ? `Barang "${report.title}" telah tercatat SUDAH DIAMBIL oleh Anda. Proses klaim selesai.`
            : `Status barang "${report.title}": Tercatat BELUM DIAMBIL. Silakan hubungi/datangi pos security UNKLAB untuk pengambilan.`,
        isRead: false,
        reportId: claim.reportId,
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// ─── My Claims ────────────────────────────────────────────────────────────────
export const getMyClaims = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const claims = await ctx.db
      .query("claims")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    claims.sort((a, b) => b._creationTime - a._creationTime);

    return Promise.all(
      claims.map(async (c) => {
        const report = await ctx.db.get(c.reportId);
        const category = report ? await ctx.db.get(report.categoryId) : null;
        return {
          ...c,
          reportTitle: report?.title ?? "Laporan Dihapus",
          reportStatus: report?.status ?? "Closed",
          categoryName: category?.name ?? "",
        };
      })
    );
  },
});
