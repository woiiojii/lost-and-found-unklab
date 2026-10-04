/**
 * reports.ts – Convex queries & mutations for Lost/Found item reports.
 * Covers use cases: Create Lost Report, Create Found Report,
 * Search & Browse Reports, View Item Details, Update Item Status,
 * and Moderate Content (admin hide/delete).
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const DEFAULT_CATEGORIES = [
  "Elektronik",
  "Dokumen & Kartu",
  "Aksesori & Perhiasan",
  "Pakaian & Sepatu",
  "Kunci & Gantungan",
  "Buku & Alat Tulis",
  "Tas & Dompet",
  "Lainnya",
];

// ─── List & Search Reports ────────────────────────────────────────────────────
export const listReports = query({
  args: {
    type: v.optional(v.union(v.literal("Lost"), v.literal("Found"))),
    categoryId: v.optional(v.id("categories")),
    status: v.optional(
      v.union(
        v.literal("Open"),
        v.literal("Under Review"),
        v.literal("Menuju Pos Admin"),
        v.literal("Sudah di Pos Admin"),
        v.literal("Returned"),
        v.literal("Closed"),
        v.literal("all")
      )
    ),
    searchQuery: v.optional(v.string()),
    /** Include hidden reports (admin only) */
    includeHidden: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let reports = await ctx.db.query("itemReports").collect();

    // Sort descending by creation time
    reports.sort((a, b) => (b.createdAt ?? b._creationTime) - (a.createdAt ?? a._creationTime));

    // Filter hidden unless admin explicitly requests them
    if (!args.includeHidden) {
      reports = reports.filter((r) => !r.isHidden);
    }

    if (args.type) {
      reports = reports.filter((r) => r.type === args.type);
    }

    if (args.categoryId) {
      reports = reports.filter((r) => r.categoryId === args.categoryId);
    }

    if (args.status && args.status !== "all") {
      reports = reports.filter((r) => r.status === args.status);
    } else if (!args.status) {
      // Default: exclude Returned and Closed
      reports = reports.filter((r) => r.status !== "Returned" && r.status !== "Closed");
    }

    if (args.searchQuery && args.searchQuery.trim()) {
      const q = args.searchQuery.toLowerCase().trim();
      reports = reports.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q)
      );
    }

    // Enrich with author + category names
    const enriched = await Promise.all(
      reports.map(async (r) => {
        const user = await ctx.db.get(r.userId);
        const category = await ctx.db.get(r.categoryId);
        // Generate image URL if storageId exists
        let imageUrl: string | null = null;
        if (r.storageId) {
          try {
            imageUrl = await ctx.storage.getUrl(r.storageId);
          } catch {
            imageUrl = null;
          }
        }
        return {
          ...r,
          authorName: user?.name ?? "Pengguna UNKLAB",
          authorCampusId: user?.campusId ?? "",
          categoryName: category?.name ?? "Lainnya",
          imageUrl,
        };
      })
    );

    return enriched;
  },
});

// ─── Get Single Report ────────────────────────────────────────────────────────
export const getReport = query({
  args: { reportId: v.id("itemReports") },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) return null;

    const user = await ctx.db.get(report.userId);
    const category = await ctx.db.get(report.categoryId);
    let imageUrl: string | null = null;
    if (report.storageId) {
      try {
        imageUrl = await ctx.storage.getUrl(report.storageId);
      } catch {
        imageUrl = null;
      }
    }

    // Fetch status history for the timeline
    const history = await ctx.db
      .query("statusHistory")
      .withIndex("by_reportId", (q) => q.eq("reportId", args.reportId))
      .collect();
    history.sort((a, b) => a.updatedAt - b.updatedAt);

    // Fetch pending claims count
    const claims = await ctx.db
      .query("claims")
      .withIndex("by_reportId", (q) => q.eq("reportId", args.reportId))
      .collect();

    return {
      ...report,
      authorName: user?.name ?? "Pengguna UNKLAB",
      authorEmail: user?.email ?? "",
      authorCampusId: user?.campusId ?? "",
      categoryName: category?.name ?? "Lainnya",
      imageUrl,
      statusHistory: history,
      claimsCount: claims.length,
      pendingClaimsCount: claims.filter((c) => c.status === "Pending").length,
    };
  },
});

// ─── Create Report ────────────────────────────────────────────────────────────
export const createReport = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(v.literal("Lost"), v.literal("Found")),
    title: v.string(),
    categoryId: v.optional(v.id("categories")),
    description: v.string(),
    location: v.string(),
    date: v.string(),
    storageId: v.optional(v.union(v.id("_storage"), v.string())),
  },
  handler: async (ctx, args) => {
    // Admin cannot create reports (focus is monitoring and verifying claims)
    const author = await ctx.db.get(args.userId);
    if (!author) {
      throw new Error("Pengguna tidak ditemukan.");
    }
    if (author.role === "admin") {
      throw new Error(
        "Administrator tidak diizinkan membuat laporan. Fokus utama admin adalah memantau dan menyetujui klaim barang."
      );
    }

    let catId = args.categoryId;

    // Fallback if categoryId is missing or invalid: find or create "Lainnya"
    if (!catId) {
      let defaultCat = await ctx.db
        .query("categories")
        .withIndex("by_name", (q) => q.eq("name", "Lainnya"))
        .first();
      if (!defaultCat) {
        const id = await ctx.db.insert("categories", { name: "Lainnya" });
        catId = id;
      } else {
        catId = defaultCat._id;
      }
    }

    const reportId = await ctx.db.insert("itemReports", {
      userId: args.userId,
      type: args.type,
      title: args.title.trim(),
      categoryId: catId,
      description: args.description.trim(),
      location: args.location.trim(),
      date: args.date,
      status: "Open",
      storageId: args.storageId,
      isHidden: false,
      createdAt: Date.now(),
    });

    // Create initial status history entry
    await ctx.db.insert("statusHistory", {
      reportId,
      statusName: "Open",
      changedBy: args.userId,
      note: `Laporan ${args.type === "Lost" ? "kehilangan" : "penemuan"} baru dibuat.`,
      updatedAt: Date.now(),
    });

    return reportId;
  },
});

// ─── Update Report Status (Admin) ────────────────────────────────────────────
export const updateReportStatus = mutation({
  args: {
    reportId: v.id("itemReports"),
    status: v.union(
      v.literal("Open"),
      v.literal("Under Review"),
      v.literal("Menuju Pos Admin"),
      v.literal("Sudah di Pos Admin"),
      v.literal("Returned"),
      v.literal("Closed")
    ),
    adminUserId: v.id("users"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Laporan tidak ditemukan.");

    await ctx.db.patch(args.reportId, { status: args.status });

    await ctx.db.insert("statusHistory", {
      reportId: args.reportId,
      statusName: args.status,
      changedBy: args.adminUserId,
      note: args.note ?? `Status diperbarui menjadi ${args.status}.`,
      updatedAt: Date.now(),
    });

    // Notify the report owner
    const statusLabels: Record<string, string> = {
      Open: "dibuka kembali",
      "Under Review": "sedang ditinjau",
      "Menuju Pos Admin": "ditemukan dan sedang menuju pos admin",
      "Sudah di Pos Admin": "sudah di pos admin",
      Returned: "telah dikembalikan",
      Closed: "ditutup",
    };
    await ctx.db.insert("notifications", {
      userId: report.userId,
      message: `Status laporan "${report.title}" Anda telah diperbarui menjadi: ${statusLabels[args.status] ?? args.status}.`,
      isRead: false,
      reportId: args.reportId,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// ─── Mark Report as Found By Finder ───────────────────────────────────────────
export const markAsFoundByFinder = mutation({
  args: {
    reportId: v.id("itemReports"),
    finderUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Laporan tidak ditemukan.");

    const finder = await ctx.db.get(args.finderUserId);
    if (!finder) throw new Error("Pengguna tidak valid.");

    await ctx.db.patch(args.reportId, { status: "Menuju Pos Admin" });

    await ctx.db.insert("statusHistory", {
      reportId: args.reportId,
      statusName: "Menuju Pos Admin",
      changedBy: args.finderUserId,
      note: `Barang ditemukan oleh ${finder.name}. Penemu sedang menuju pos admin untuk menyerahkan barang.`,
      updatedAt: Date.now(),
    });

    // Notify the owner
    await ctx.db.insert("notifications", {
      userId: report.userId,
      message: `Kabar baik! Laporan "${report.title}" Anda telah ditemukan oleh seseorang. Saat ini sedang dalam perjalanan menuju pos admin. Pantau terus statusnya.`,
      isRead: false,
      reportId: args.reportId,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// ─── Hide Report (Admin Moderate) ────────────────────────────────────────────
export const hideReport = mutation({
  args: {
    reportId: v.id("itemReports"),
    hide: v.boolean(),
    adminUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Laporan tidak ditemukan.");

    await ctx.db.patch(args.reportId, { isHidden: args.hide });

    await ctx.db.insert("statusHistory", {
      reportId: args.reportId,
      statusName: args.hide ? "Hidden" : "Visible",
      changedBy: args.adminUserId,
      note: args.hide
        ? "Laporan disembunyikan oleh admin (moderasi)."
        : "Laporan ditampilkan kembali oleh admin.",
      updatedAt: Date.now(),
    });

    // Notify the owner
    await ctx.db.insert("notifications", {
      userId: report.userId,
      message: args.hide
        ? `Laporan "${report.title}" Anda disembunyikan oleh administrator karena peninjauan.`
        : `Laporan "${report.title}" Anda telah ditampilkan kembali.`,
      isRead: false,
      reportId: args.reportId,
      createdAt: Date.now(),
    });
  },
});

// ─── Delete Report (Admin Moderate) ──────────────────────────────────────────
export const deleteReport = mutation({
  args: {
    reportId: v.id("itemReports"),
    adminUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Laporan tidak ditemukan.");

    // Cascade delete claims
    const claims = await ctx.db
      .query("claims")
      .withIndex("by_reportId", (q) => q.eq("reportId", args.reportId))
      .collect();
    for (const claim of claims) {
      await ctx.db.delete(claim._id);
    }

    // Cascade delete status history
    const history = await ctx.db
      .query("statusHistory")
      .withIndex("by_reportId", (q) => q.eq("reportId", args.reportId))
      .collect();
    for (const h of history) {
      await ctx.db.delete(h._id);
    }

    // Notify owner
    await ctx.db.insert("notifications", {
      userId: report.userId,
      message: `Laporan "${report.title}" Anda telah dihapus oleh administrator.`,
      isRead: false,
      createdAt: Date.now(),
    });

    await ctx.db.delete(args.reportId);
  },
});

// ─── Get Upload URL ────────────────────────────────────────────────────────────
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// ─── Get My Reports ───────────────────────────────────────────────────────────
export const getMyReports = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const reports = await ctx.db
      .query("itemReports")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    reports.sort((a, b) => (b.createdAt ?? b._creationTime) - (a.createdAt ?? a._creationTime));

    return Promise.all(
      reports.map(async (r) => {
        const category = await ctx.db.get(r.categoryId);
        let imageUrl: string | null = null;
        if (r.storageId) {
          try {
            imageUrl = await ctx.storage.getUrl(r.storageId);
          } catch {
            imageUrl = null;
          }
        }
        return { ...r, categoryName: category?.name ?? "Lainnya", imageUrl };
      })
    );
  },
});

// ─── List Categories ──────────────────────────────────────────────────────────
export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});

// ─── Initialize Default Categories (Auto-seed) ────────────────────────────────
export const initCategories = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("categories").collect();
    if (existing.length === 0) {
      for (const name of DEFAULT_CATEGORIES) {
        await ctx.db.insert("categories", { name });
      }
    }
    return await ctx.db.query("categories").collect();
  },
});

// ─── Stats for Dashboard ──────────────────────────────────────────────────────
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const allReports = await ctx.db.query("itemReports").collect();
    const allUsers = await ctx.db.query("users").collect();
    const allClaims = await ctx.db.query("claims").collect();

    return {
      totalReports: allReports.length,
      lostReports: allReports.filter((r) => r.type === "Lost").length,
      foundReports: allReports.filter((r) => r.type === "Found").length,
      openReports: allReports.filter((r) => r.status === "Open").length,
      returnedReports: allReports.filter((r) => r.status === "Returned").length,
      totalUsers: allUsers.filter((u) => u.role === "user").length,
      pendingClaims: allClaims.filter((c) => c.status === "Pending").length,
      hiddenReports: allReports.filter((r) => r.isHidden).length,
    };
  },
});
