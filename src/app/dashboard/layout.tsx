"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import {
  LayoutDashboard,
  UploadCloud,
  FileSpreadsheet,
  Settings,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Code2
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || userRole !== "admin")) {
      router.push("/login");
    }
  }, [user, userRole, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const navItems = [
    { name: "ภาพรวมสถิติ", href: "/dashboard", icon: LayoutDashboard },
    { name: "นำเข้าคะแนน", href: "/dashboard/upload", icon: UploadCloud },
    { name: "สรุปรายงาน", href: "/dashboard/reports", icon: FileSpreadsheet },
    { name: "ตั้งค่าระบบ", href: "/dashboard/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-emerald-100/60 sticky top-0 h-screen z-20 transition-all">
        <div className="p-6 border-b border-emerald-50 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md shadow-emerald-600/10 bg-white border border-emerald-100/40">
            <img src="/Logo.png" alt="BookMark Pro Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">BookMark Pro</h1>
            <p className="text-xs text-emerald-600 font-semibold tracking-wide">Hongson Academy</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-4 mb-4 mt-2">เมนูหลัก</div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-600 hover:bg-stone-50 hover:text-slate-900"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-emerald-600 rounded-r-full" />
                )}
                <item.icon className={clsx("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-600")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Developer Badge in sidebar */}
        <div className="px-4 py-3 border-t border-emerald-50">
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50/60 rounded-lg">
            <Code2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <p className="text-[10px] font-medium text-slate-500 leading-tight">พัฒนาโดย: <span className="font-bold text-emerald-700">นายสาธิต ศิริวัชน์</span></p>
          </div>
        </div>

        <div className="p-4 border-t border-emerald-50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3.5 w-full rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 group"
          >
            <LogOut className="w-5 h-5 text-red-400 group-hover:text-red-500 transition-colors" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Mobile Header overlay */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-lg border-b border-emerald-100/60 z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center p-0.5">
            <img src="/Logo.png" alt="BookMark Pro Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-base font-bold text-slate-900">BookMark Pro</h1>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 -mr-2 text-slate-600 hover:bg-stone-100 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Content */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-20 pt-16 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-y-0 right-0 w-3/4 max-w-sm bg-white shadow-2xl flex flex-col pt-4 pb-6 animate-in slide-in-from-right duration-300">
             <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-4 mb-4 mt-2">เมนูหลัก</div>
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={clsx(
                        "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-600 hover:bg-stone-50"
                      )}
                    >
                      <item.icon className={clsx("w-5 h-5", isActive ? "text-emerald-600" : "text-slate-400")} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Developer Badge */}
              <div className="px-4 py-3 border-t border-emerald-50">
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50/60 rounded-lg">
                  <Code2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <p className="text-[10px] font-medium text-slate-500">พัฒนาโดย: <span className="font-bold text-emerald-700">นายสาธิต ศิริวัชน์</span></p>
                </div>
              </div>

              <div className="px-4 mt-auto pt-6 border-t border-emerald-50">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3.5 w-full rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                  <LogOut className="w-5 h-5 text-red-400" />
                  ออกจากระบบ
                </button>
              </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 pt-16 md:pt-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
