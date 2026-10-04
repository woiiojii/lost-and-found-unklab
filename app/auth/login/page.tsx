/**
 * app/auth/login/page.tsx – Login Page
 * Premium glassmorphism design matching UNKLAB purple theme.
 */
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
} from "lucide-react";

export default function LoginPage() {
  const { setToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const loginMutation = useMutation(api.auth.login);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Silakan isi email dan password.");
      return;
    }

    setLoading(true);
    try {
      const result = await loginMutation({
        email: email.trim().toLowerCase(),
        password,
      });
      setToken(result.token);
      toast.success(`Selamat datang kembali, ${result.name}!`);
      if (!searchParams.get("redirect") && result.role === "admin") {
        router.push("/admin");
      } else {
        router.push(redirectTo);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Email atau password salah.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const inputBase =
    "w-full bg-transparent text-slate-800 text-sm placeholder-slate-400 focus:outline-none";

  const fieldWrap =
    "group flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3 bg-white/80 focus-within:border-[#6a046a] focus-within:ring-2 focus-within:ring-[#6a046a]/15 focus-within:bg-white transition-all shadow-sm";

  const iconClass =
    "w-4 h-4 text-slate-400 group-focus-within:text-[#6a046a] shrink-0 transition-colors";

  return (
    <div
      className="rounded-2xl shadow-2xl border border-white/20 overflow-hidden"
      style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)" }}
    >
      {/* Top accent bar */}
      <div
        className="h-1.5 w-full"
        style={{ background: "linear-gradient(90deg, #420242, #6a046a, #969e00)" }}
      />

      <div className="px-6 sm:px-9 pt-8 pb-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
            style={{ background: "linear-gradient(135deg, #420242, #6a046a)" }}
          >
            <LogIn className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Masuk ke Akun
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            UNKLAB Lost &amp; Found System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 ml-0.5">
              Email Kampus
            </label>
            <div className={fieldWrap}>
              <Mail className={iconClass} />
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@unklab.ac.id"
                className={inputBase}
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 ml-0.5">
              Password
            </label>
            <div className={fieldWrap}>
              <Lock className={iconClass} />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password Anda"
                className={`${inputBase} pr-1`}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-[#6a046a] focus:outline-none transition-colors flex-shrink-0"
                tabIndex={-1}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              id="login-submit-btn"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-lg transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: loading
                  ? "#9e2a9e"
                  : "linear-gradient(135deg, #420242 0%, #6a046a 100%)",
                boxShadow: "0 4px 20px rgba(106,4,106,0.35)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t border-slate-100">
          <p className="text-xs sm:text-sm text-slate-500">
            Belum punya akun?{" "}
            <Link
              href="/auth/register"
              className="font-bold hover:underline"
              style={{ color: "#6a046a" }}
            >
              Daftar di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
