import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import OwnerTopNav from "@/components/OwnerTopNav";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (session.role !== "OWNER") redirect("/login");

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <OwnerTopNav preferredLanguage={session.preferredLanguage} />
      <main className="max-w-6xl mx-auto px-6 pb-16 pt-8">
        {children}
      </main>
    </div>
  );
}
