"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/i18n/i18nContext";
import { useTheme } from "@/lib/theme";
import { TokenPayload } from "@/lib/auth";
import {
  LayoutDashboard, Boxes, Wrench, Users, LogOut,
  Sun, Moon, Globe, Shield, ChevronRight,
} from "lucide-react";
import clsx from "clsx";

export default function Sidebar({ session }: { session: TokenPayload }) {
  const { t, lang, setLang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Overview", exact: true },
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
    <aside className="sidebar w-60 min-h-screen flex flex-col fixed top-0 left-0 z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: "var(--card-border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #7c3aed, #3b82f6)" }}>
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold leading-none" style={{ color: "var(--text-primary)" }}>KeeperHub</p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>2.0 · Multi-Tenant</p>
          </div>
        </div>
      </div>

      {/* User Badge */}
      <div className="px-4 py-3 border-b" style={{ borderColor: "var(--card-border)" }}>
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #7c3aed, #3b82f6)" }}>
            {session.role.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{session.role}</p>
            <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
              {session.preferredLanguage === "ID" ? "🇮🇩 Indonesia" : "🇺🇸 English"}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2" style={{ color: "var(--text-muted)" }}>MENU</p>
        {navItems.map(item => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href) && item.href !== "/dashboard";
          const overviewActive = item.exact && pathname === "/dashboard";
          const isActive = active || overviewActive;
          return (
            <Link key={item.href} href={item.href} className={clsx("nav-item group", isActive && "active")}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-sm">{item.label}</span>
              {isActive && <ChevronRight className="w-3 h-3 opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t space-y-0.5" style={{ borderColor: "var(--card-border)" }}>
        <button onClick={() => setLang(lang === "ID" ? "EN" : "ID")} className="nav-item w-full">
          <Globe className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-sm">{lang === "ID" ? "Bahasa Indonesia" : "English"}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa" }}>{lang}</span>
        </button>
        <button onClick={toggleTheme} className="nav-item w-full">
          {theme === "dark"
            ? <Sun className="w-4 h-4 flex-shrink-0 text-amber-400" />
            : <Moon className="w-4 h-4 flex-shrink-0" style={{ color: "#7c3aed" }} />}
          <span className="flex-1 text-sm">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>
        <button onClick={handleLogout} className="nav-item w-full" style={{ color: "#ef4444" }}>
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-sm">{t("logout")}</span>
        </button>
      </div>
    </aside>
  );
}
