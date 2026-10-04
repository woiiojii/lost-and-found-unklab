/**
 * auth.ts – Convex mutations & queries for integrated authentication.
 * Uses Web Crypto (crypto.subtle) for secure password hashing (runs natively in Convex isolate).
 * Both mutations and action wrappers are exported to support all client calling styles.
 */
import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// ─── Password Hashing with Web Crypto ─────────────────────────────────────────
async function hashPassword(password: string): Promise<string> {
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}`);
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  const hashHex = Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${salt}:${hashHex}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (storedHash.includes(":")) {
    const [salt, expectedHash] = storedHash.split(":");
    const enc = new TextEncoder();
    const data = enc.encode(`${salt}:${password}`);
    const hashBuf = await crypto.subtle.digest("SHA-256", data);
    const hashHex = Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex === expectedHash;
  }
  // Plain text fallback or demo accounts
  return password === storedHash;
}

function generateToken(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ─── Register (Mutation) ──────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// KONFIGURASI AKUN ADMINISTRATOR UNKLAB
// Admin TIDAK PERLU DAFTAR. Anda dapat menginput/mengubah email dan password
// admin di bawah ini kapan saja, sehingga admin tinggal langsung Log In.
// ─────────────────────────────────────────────────────────────────────────────
export const ADMIN_CREDENTIALS = {
  email: "georgechristj21@gmail.com",
  password: "admin123",
  name: "Administrator George",
  campusId: "ADM001",
};

// ─── Register (Mutation) ──────────────────────────────────────────────────────
export const register = mutation({
  args: {
    campusId: v.string(),
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: v.optional(v.union(v.literal("user"), v.literal("admin"))),
  },
  handler: async (ctx, args): Promise<{ token: string; userId: string }> => {
    const normalizedEmail = args.email.trim().toLowerCase();
    const normalizedCampusId = args.campusId.trim().toUpperCase();

    // Prevent registering with admin email (Admin does not register)
    if (normalizedEmail === ADMIN_CREDENTIALS.email.trim().toLowerCase()) {
      throw new Error(
        "Email ini adalah email Administrator kampus. Admin tidak perlu mendaftar, silakan langsung masuk di halaman Log In."
      );
    }

    // Check for existing email or campusId
    const existingEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();
    if (existingEmail) {
      throw new Error("Email sudah terdaftar. Gunakan email lain.");
    }

    const existingCampusId = await ctx.db
      .query("users")
      .withIndex("by_campusId", (q) => q.eq("campusId", normalizedCampusId))
      .first();
    if (existingCampusId) {
      throw new Error("NIM/NIP sudah terdaftar. Hubungi administrator.");
    }

    const passwordHash = await hashPassword(args.password);

    // Public registration is ALWAYS role: "user" (Admin is pre-configured)
    const userId = await ctx.db.insert("users", {
      campusId: normalizedCampusId,
      name: args.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "user",
      createdAt: Date.now(),
    });

    const token = generateToken();
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
    await ctx.db.insert("sessions", { userId, token, expiresAt });

    // Auto-seed default categories if empty
    const existingCats = await ctx.db.query("categories").collect();
    if (existingCats.length === 0) {
      const defaultCats = [
        "Elektronik",
        "Dokumen & Kartu",
        "Aksesori & Perhiasan",
        "Pakaian & Sepatu",
        "Kunci & Gantungan",
        "Buku & Alat Tulis",
        "Tas & Dompet",
        "Lainnya",
      ];
      for (const name of defaultCats) {
        await ctx.db.insert("categories", { name });
      }
    }

    return { token, userId };
  },
});

// ─── Set / Update Admin Credentials Mutation ─────────────────────────────────
export const setAdminCredentials = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
    campusId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();
    const hash = await hashPassword(args.password);

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        passwordHash: hash,
        role: "admin",
        name: args.name?.trim() ?? existing.name,
        campusId: args.campusId?.trim().toUpperCase() ?? existing.campusId,
      });
      return { success: true, message: `Akun admin (${normalizedEmail}) berhasil diperbarui.` };
    } else {
      await ctx.db.insert("users", {
        campusId: args.campusId?.trim().toUpperCase() ?? "ADM001",
        name: args.name?.trim() ?? "Administrator Kampus",
        email: normalizedEmail,
        passwordHash: hash,
        role: "admin",
        createdAt: Date.now(),
      });
      return { success: true, message: `Akun admin (${normalizedEmail}) berhasil dibuat.` };
    }
  },
});

// ─── Login (Mutation) ─────────────────────────────────────────────────────────
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ token: string; userId: string; role: string; name: string }> => {
    const normalizedEmail = args.email.trim().toLowerCase();

    let user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    // ── 1. Check if logging in as the pre-configured Admin ──
    const isAdminEmail =
      normalizedEmail === ADMIN_CREDENTIALS.email.trim().toLowerCase();

    if (isAdminEmail) {
      if (!user) {
        // Auto-provision admin user if not exists yet
        const hash = await hashPassword(ADMIN_CREDENTIALS.password);
        const uid = await ctx.db.insert("users", {
          campusId: ADMIN_CREDENTIALS.campusId,
          name: ADMIN_CREDENTIALS.name,
          email: normalizedEmail,
          passwordHash: hash,
          role: "admin",
          createdAt: Date.now(),
        });
        user = await ctx.db.get(uid);
      } else {
        // Ensure role is admin
        if (user.role !== "admin") {
          await ctx.db.patch(user._id, { role: "admin" });
          user = await ctx.db.get(user._id);
        }
      }

      // If user inputs the configured ADMIN_CREDENTIALS.password
      if (args.password === ADMIN_CREDENTIALS.password) {
        const hash = await hashPassword(ADMIN_CREDENTIALS.password);
        await ctx.db.patch(user!._id, { passwordHash: hash });
        const token = generateToken();
        const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7;
        await ctx.db.insert("sessions", { userId: user!._id, token, expiresAt });
        return {
          token,
          userId: user!._id,
          role: "admin",
          name: user!.name,
        };
      }
    }

    // Auto-provision demo user account if requested
    if (!user && normalizedEmail === "user@unklab.ac.id" && args.password === "password123") {
      const hash = await hashPassword("password123");
      const uid = await ctx.db.insert("users", {
        campusId: "S1010101",
        name: "Mahasiswa UNKLAB",
        email: "user@unklab.ac.id",
        passwordHash: hash,
        role: "user",
        createdAt: Date.now(),
      });
      user = await ctx.db.get(uid);
    }

    if (!user) {
      throw new Error("Email atau password salah.");
    }

    const valid = await verifyPassword(args.password, user.passwordHash);
    if (!valid) {
      throw new Error("Email atau password salah.");
    }

    const token = generateToken();
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt,
    });

    return {
      token,
      userId: user._id,
      role: user.role,
      name: user.name,
    };
  },
});

// ─── Actions (for backwards compatibility if client calls useAction) ──────────
export const registerAction = action({
  args: {
    campusId: v.string(),
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: v.union(v.literal("user"), v.literal("admin")),
  },
  handler: async (ctx, args): Promise<{ token: string; userId: string }> => {
    return await ctx.runMutation(api.auth.register, args);
  },
});

export const loginAction = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ token: string; userId: string; role: string; name: string }> => {
    return await ctx.runMutation(api.auth.login, args);
  },
});

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (!args.token) return;
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

// ─── Validate Session ─────────────────────────────────────────────────────────
export const validateSession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (!args.token) return null;
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) return null;
    if (session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user) return null;

    return {
      userId: user._id,
      campusId: user.campusId,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.trim().toLowerCase()))
      .first();
  },
});

export const getUserByCampusId = query({
  args: { campusId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("users")
      .withIndex("by_campusId", (q) => q.eq("campusId", args.campusId.trim().toUpperCase()))
      .first();
  },
});

export const createUser = mutation({
  args: {
    campusId: v.string(),
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    role: v.union(v.literal("user"), v.literal("admin")),
  },
  handler: async (ctx, args): Promise<{ token: string; userId: string }> => {
    const userId = await ctx.db.insert("users", {
      campusId: args.campusId.trim().toUpperCase(),
      name: args.name.trim(),
      email: args.email.trim().toLowerCase(),
      passwordHash: args.passwordHash,
      role: args.role,
      createdAt: Date.now(),
    });

    const token = generateToken();
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7;
    await ctx.db.insert("sessions", { userId, token, expiresAt });

    return { token, userId };
  },
});

export const createSession = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<{ token: string }> => {
    const token = generateToken();
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7;
    await ctx.db.insert("sessions", {
      userId: args.userId,
      token,
      expiresAt,
    });
    return { token };
  },
});

export const seedCategories = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("categories").collect();
    if (existing.length > 0) return;

    const cats = [
      "Elektronik",
      "Dokumen & Kartu",
      "Aksesori & Perhiasan",
      "Pakaian & Sepatu",
      "Kunci & Gantungan",
      "Buku & Alat Tulis",
      "Tas & Dompet",
      "Lainnya",
    ];
    for (const name of cats) {
      await ctx.db.insert("categories", { name });
    }
  },
});
