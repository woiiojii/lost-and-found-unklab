/**
 * notifications.ts – Convex queries & mutations for real-time notifications.
 * Used by the notification bell in the header (live subscription).
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Get My Notifications (real-time subscription) ────────────────────────────
export const getMyNotifications = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);
  },
});

// ─── Unread Count ─────────────────────────────────────────────────────────────
export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();
    return unread.length;
  },
});

// ─── Mark as Read ─────────────────────────────────────────────────────────────
export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});

// ─── Mark All as Read ─────────────────────────────────────────────────────────
export const markAllAsRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    await Promise.all(
      unread.map((n) => ctx.db.patch(n._id, { isRead: true }))
    );
  },
});

// ─── Delete a Notification ────────────────────────────────────────────────────
export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.notificationId);
  },
});
