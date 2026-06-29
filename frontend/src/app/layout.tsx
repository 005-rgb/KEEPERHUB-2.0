import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/i18n/i18nContext";

export const metadata: Metadata = {
  title: "KeeperHub 2.0",
  description: "Multi-Tenant Asset & Maintenance Management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
