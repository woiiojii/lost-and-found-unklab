/**
 * app/auth/register/page.tsx – Registration Page
 * Premium glassmorphism design matching UNKLAB purple theme.
 */
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { toast } from "sonner";
import {
  User,
  Mail,
  Lock,
  CreditCard,
  Loader2,
  Eye,
  EyeOff,
  ChevronDown,
  UserPlus,
  Check,
} from "lucide-react";

export default function RegisterPage() {
  const { setToken } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [campusId, setCampusId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [roleType, setRoleType] = useState("Student");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const roleDropdownRef = useRef<HTMLDivElement>(null);

  const ROLE_OPTIONS = [
    { value: "Student", label: "Student (Mahasiswa)" },
    { value: "Lecturer", label: "Lecturer / Dosen" },
    { value: "Staff", label: "Staff / Karyawan" },
  ];

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const registerMutation = useMutation(api.auth.register);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !campusId || !email || !password) {
      toast.error("Silakan lengkapi semua kolom yang wajib diisi.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Password dan konfirmasi password tidak sama.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);
    try {
      const result = await registerMutation({
        campusId: campusId.trim().toUpperCase(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: "user",
      });

      setToken(result.token);
      toast.success("Pendaftaran berhasil! Selamat datang di UNKLAB Lost & Found.");
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Pendaftaran gagal.";
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

      <div className="px-6 sm:px-9 pt-7 pb-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-7">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
            style={{ background: "linear-gradient(135deg, #420242, #6a046a)" }}
          >
            <UserPlus className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Buat Akun Baru
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Daftar sebagai civitas UNKLAB Lost &amp; Found
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          {/* Role Selector – Custom Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 ml-0.5">
              Peran / Jabatan
            </label>
            <div className="relative" ref={roleDropdownRef}>
              {/* Trigger button */}
              <button
                type="button"
                onClick={() => setRoleDropdownOpen((o) => !o)}
                className={`w-full ${fieldWrap} justify-between cursor-pointer`}
                aria-haspopup="listbox"
                aria-expanded={roleDropdownOpen}
              >
                <div className="flex items-center gap-3">
                  <User className={iconClass} />
                  <span className="text-sm font-medium text-slate-800">
                    {ROLE_OPTIONS.find((r) => r.value === roleType)?.label}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    roleDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown panel */}
              {roleDropdownOpen && (
                <ul
                  role="listbox"
                  className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-[#6a046a]/20 shadow-xl overflow-hidden z-50"
                  style={{ boxShadow: "0 8px 32px rgba(106,4,106,0.18)" }}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={roleType === opt.value}
                      onClick={() => {
                        setRoleType(opt.value);
                        setRoleDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between px-4 py-3 text-sm cursor-pointer transition-colors ${
                        roleType === opt.value
                          ? "bg-[#f5e6f5] text-[#6a046a] font-semibold"
                          : "text-slate-700 hover:bg-[#fbf4fb] hover:text-[#6a046a]"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {roleType === opt.value && (
                        <Check className="w-4 h-4 text-[#6a046a] flex-shrink-0" />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 ml-0.5">
              Nama Lengkap
            </label>
            <div className={fieldWrap}>
              <User className={iconClass} />
              <input
                id="reg-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap Anda"
                className={inputBase}
                autoComplete="name"
              />
            </div>
          </div>

          {/* Campus ID */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 ml-0.5">
              NIM / NIP / ID Kampus
            </label>
            <div className={fieldWrap}>
              <CreditCard className={iconClass} />
              <input
                id="reg-campusId"
                type="text"
                required
                value={campusId}
                onChange={(e) => setCampusId(e.target.value)}
                placeholder="Masukan Nim"
                className={inputBase}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 ml-0.5">
              Email Kampus
            </label>
            <div className={fieldWrap}>
              <Mail className={iconClass} />
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@unklab.ac.id"
                className={inputBase}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password row — 2 columns on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 ml-0.5">
                Password
              </label>
              <div className={fieldWrap}>
                <Lock className={iconClass} />
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 karakter"
                  className={`${inputBase} pr-1`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-[#6a046a] focus:outline-none transition-colors flex-shrink-0"
                  tabIndex={-1}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 ml-0.5">
                Konfirmasi
              </label>
              <div className={fieldWrap}>
                <Lock className={iconClass} />
                <input
                  id="reg-confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password"
                  className={`${inputBase} pr-1`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-slate-400 hover:text-[#6a046a] focus:outline-none transition-colors flex-shrink-0"
                  tabIndex={-1}
                  aria-label="Toggle konfirmasi password"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Password strength hint */}
          {password.length > 0 && (
            <p
              className={`text-[11px] ml-0.5 font-medium ${
                password.length >= 6 ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {password.length >= 6
                ? "✓ Password memenuhi syarat minimal"
                : `Password perlu ${6 - password.length} karakter lagi`}
            </p>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              id="register-submit-btn"
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
                  <span>Mendaftarkan...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Daftar Sekarang</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-5 pt-4 border-t border-slate-100">
          <p className="text-xs sm:text-sm text-slate-500">
            Sudah memiliki akun?{" "}
            <Link
              href="/auth/login"
              className="font-bold hover:underline"
              style={{ color: "#6a046a" }}
            >
              Masuk di sini
            </Link>
          </p>

          <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
            <p className="text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">Administrator Kampus:</span> Admin tidak perlu mendaftar. Silakan langsung masuk di{" "}
              <Link href="/auth/login" className="font-bold text-[#6a046a] hover:underline">
                Halaman Log In
              </Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
