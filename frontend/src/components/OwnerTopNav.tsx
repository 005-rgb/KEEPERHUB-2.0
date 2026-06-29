"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/i18n/i18nContext";
import { useTheme } from "@/lib/theme";
import { Sun, Moon, ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

interface Props {
  preferredLanguage: "ID" | "EN";
}

export default function OwnerTopNav({ preferredLanguage }: Props) {
  const { t, lang, setLang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navLinks = [
    { href: "/owner/dashboard", label: t("menu_asset_input"), exact: true },
    { href: "/owner/dashboard/financial", label: t("menu_financial"), exact: false },
  ];

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        background: theme === "dark"
          ? "rgba(8,12,20,0.85)"
          : "rgba(255,255,255,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderColor: "var(--card-border)",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/owner/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
          <span className="text-sm font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            KeeperHub
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-md font-bold"
            style={{ background: "rgba(124,58,237,0.12)", color: "#7c3aed" }}
          >
            OWNER
          </span>
        </Link>

        {/* Center Nav */}
        <div className="flex items-center gap-1">
          {navLinks.map(link => {
            const active = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                  active
                    ? "text-violet-500 dark:text-violet-400"
                    : "hover:opacity-80"
                )}
                style={{
                  color: active ? "#7c3aed" : "var(--text-secondary)",
                  background: active ? "rgba(124,58,237,0.08)" : "transparent",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* i18n toggle */}
          <button
            onClick={() => setLang(lang === "ID" ? "EN" : "ID")}
            className="h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
            style={{
              background: "var(--card)",
              border: "1px solid var(--card-border)",
              color: "var(--text-secondary)",
            }}
          >
            <span>{lang === "ID" ? "🇮🇩" : "🇺🇸"}</span>
            <span>{lang}</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{
              background: "var(--card)",
              border: "1px solid var(--card-border)",
              color: "var(--text-secondary)",
            }}
          >
            {theme === "dark"
              ? <Sun className="w-3.5 h-3.5 text-amber-400" />
              : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* User dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(o => !o)}
              className="h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
              style={{
                background: "var(--card)",
                border: "1px solid var(--card-border)",
                color: "var(--text-secondary)",
              }}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{ background: "linear-gradient(135deg,#7c3aed,#3b82f6)" }}
              >O</span>
              <span>Owner</span>
              <ChevronDown className="w-3 h-3 opacity-50" />
            </button>
            {userMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-36 rounded-xl overflow-hidden shadow-xl z-50"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--card-border)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                }}
              >
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium transition-all hover:bg-red-500/10"
                  style={{ color: "#ef4444" }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {t("logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
