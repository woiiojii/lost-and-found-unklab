/**
 * app/(main)/layout.tsx – Shared layout for authenticated main app pages.
 * Includes the Header navigation with purple gradient theme.
 */
import Header from "@/components/layout/Header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #f5e6f5 0%, #f8fafc 30%, #f8fafc 100%)" }}>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
