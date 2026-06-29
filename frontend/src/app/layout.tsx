import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/i18n/i18nContext";
import { ThemeProvider } from "@/lib/theme";

export const metadata: Metadata = {
  title: "KeeperHub 2.0",
  description: "Multi-Tenant Asset & Maintenance Management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('kh_theme');
                if (t === 'light') document.documentElement.classList.remove('dark');
                else document.documentElement.classList.add('dark');
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="bg-decor">
        <ThemeProvider>
          <I18nProvider>{children}</I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
