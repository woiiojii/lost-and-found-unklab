import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * UNKLAB Lost & Found – Convex Database Schema
 * Matches the 6 entities in the academic paper's Class Diagram.
 */
export default defineSchema({
  // ─── 1. Users ──────────────────────────────────────────────────────────────
  users: defineTable({
    /** NIM (students) or NIP (staff) – campus ID */
    campusId: v.string(),
    name: v.string(),
    email: v.string(),
    /** bcrypt-hashed password stored server-side */
    passwordHash: v.string(),
    role: v.union(v.literal("user"), v.literal("admin")),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_campusId", ["campusId"]),

  // ─── 2. Categories ─────────────────────────────────────────────────────────
  categories: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),

  // ─── 3. Item Reports ───────────────────────────────────────────────────────
  itemReports: defineTable({
    /** Author's user _id */
    userId: v.id("users"),
    type: v.union(v.literal("Lost"), v.literal("Found")),
    title: v.string(),
    categoryId: v.id("categories"),
    description: v.string(),
    location: v.string(),
    /** ISO date string e.g. "2024-01-15" */
    date: v.string(),
    status: v.union(
      v.literal("Open"),
      v.literal("Under Review"),
      v.literal("Menuju Pos Admin"),
      v.literal("Sudah di Pos Admin"),
      v.literal("Returned"),
      v.literal("Closed")
    ),
    /** Convex storage ID for uploaded photo (optional) */
    storageId: v.optional(v.union(v.id("_storage"), v.string())),
    /** Whether admin has hidden/moderated this report */
    isHidden: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_categoryId", ["categoryId"])
    .index("by_createdAt", ["createdAt"]),

  // ─── 4. Claims ─────────────────────────────────────────────────────────────
  claims: defineTable({
    reportId: v.id("itemReports"),
    /** Claimant's user _id */
    userId: v.id("users"),
    proofDescription: v.string(),
    status: v.union(
      v.literal("Pending"),
      v.literal("Verified"),
      v.literal("Rejected")
    ),
    submitDate: v.string(),
    /** Optional admin notes on decision */
    adminNote: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    /** Status pengambilan barang setelah klaim disetujui */
    handoverStatus: v.optional(
      v.union(v.literal("Belum Diambil"), v.literal("Sudah Diambil"))
    ),
    /** Keterangan / catatan pengambilan dari admin */
    handoverNotes: v.optional(v.string()),
    /** Tanggal pengambilan barang */
    handoverDate: v.optional(v.string()),
  })
    .index("by_reportId", ["reportId"])
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),

  // ─── 5. Notifications ──────────────────────────────────────────────────────
  notifications: defineTable({
    userId: v.id("users"),
    message: v.string(),
    isRead: v.boolean(),
    /** Link to relevant report (optional) */
    reportId: v.optional(v.id("itemReports")),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_isRead", ["userId", "isRead"]),

  // ─── 6. Status History ─────────────────────────────────────────────────────
  statusHistory: defineTable({
    reportId: v.id("itemReports"),
    statusName: v.string(),
    /** Who made the change: userId */
    changedBy: v.optional(v.id("users")),
    note: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_reportId", ["reportId"]),

  // ─── Session tokens ────────────────────────────────────────────────────────
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"]),
});
