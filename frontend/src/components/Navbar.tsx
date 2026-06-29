"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/i18n/i18nContext";
import { LayoutDashboard, Boxes, Wrench, Users, LogOut } from "lucide-react";
import { TokenPayload } from "@/lib/auth";
import clsx from "clsx";

interface NavbarProps {
  session: TokenPayload;
}

export default function Navbar({ session }: NavbarProps) {
  const { t, lang, setLang } = useI18n();
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: "/dashboard/assets", icon: Boxes, label: t("assets") },
    { href: "/dashboard/maintenance", icon: Wrench, label: t("maintenance") },
    { href: "/dashboard/staff", icon: Users, label: t("staff") },
  ];

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-6">
          <Link href="/dashboard/assets" className="text-lg font-bold text-brand-700 flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5" />
            {t("app_name")}
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition",
                  pathname === item.href
                    ? "bg-brand-100 text-brand-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === "ID" ? "EN" : "ID")}
            className="text-xs px-3 py-1.5 rounded-full border border-gray-300 hover:bg-gray-100 transition font-medium"
          >
            {lang === "ID" ? "🇮🇩 ID" : "🇺🇸 EN"}
          </button>
          <span className="hidden md:block text-sm text-gray-500">{session.role}</span>
          <button onClick={handleLogout} className="flex items-center gap-1 p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
