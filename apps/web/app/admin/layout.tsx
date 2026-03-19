import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const auth = cookieStore.get("admin_auth");

  if (!auth || auth.value !== process.env.ADMIN_PASSWORD) {
    redirect("/admin-login");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="border-b border-white/[0.08] bg-[#0a0a0a]">
        <div className="mx-auto flex max-w-7xl items-center gap-8 px-6 py-4">
          <span className="text-lg font-bold tracking-tight">
            <span className="text-orange-500">Zap</span>Sight Admin
          </span>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <NavLink href="/admin">Leads</NavLink>
            <NavLink href="/admin/preview-jobs">All Jobs</NavLink>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="transition-colors hover:text-white">
      {children}
    </Link>
  );
}
