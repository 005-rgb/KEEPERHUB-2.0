"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/i18n/i18nContext";
import { useTheme } from "@/lib/theme";
import { TokenPayload } from "@/lib/auth";
import {
  LayoutDashboard, Boxes, Wrench, Users, LogOut,
  Sun, Moon, Globe, Shield, ChevronRight
} from "lucide-react";
import clsx from "clsx";

interface SidebarProps {
  session: TokenPayload;
}

export default function Sidebar({ session }: SidebarProps) {
  const { t, lang, setLang } = useI18n();
  const { theme, toggleTheme } = useTheme();
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
    <aside className="sidebar w-60 min-h-screen flex flex-col fixed top-0 left-0 z-40">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-[var(--card-border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center shadow-glow-purple">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)] leading-none">KeeperHub</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">2.0</p>
          </div>
        </div>
      </div>

      {/* User Badge */}
      <div className="px-4 py-4 border-b border-[var(--card-border)]">
        <div className="glass-card px-3 py-2.5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {session.role === "OWNER" ? "O" : "S"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{session.role}</p>
            <p className="text-[10px] text-[var(--text-muted)] truncate">{session.preferredLanguage === "ID" ? "🇮🇩 Indonesia" : "🇺🇸 English"}</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] px-3 mb-3">MENU</p>
        {navItems.map(item => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx("nav-item group", active && "active")}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Controls */}
      <div className="px-3 py-4 border-t border-[var(--card-border)] space-y-1">
        <button
          onClick={() => setLang(lang === "ID" ? "EN" : "ID")}
          className="nav-item w-full"
        >
          <Globe className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{lang === "ID" ? "Bahasa Indonesia" : "English"}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 font-semibold">{lang}</span>
        </button>
        <button
          onClick={toggleTheme}
          className="nav-item w-full"
        >
          {theme === "dark"
            ? <Sun className="w-4 h-4 flex-shrink-0 text-amber-400" />
            : <Moon className="w-4 h-4 flex-shrink-0 text-violet-400" />}
          <span className="flex-1">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>
        <button
          onClick={handleLogout}
          className="nav-item w-full text-red-400 hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{t("logout")}</span>
        </button>
      </div>
    </aside>
  );
}
