"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LogOut,
  Menu,
  X,
  Home,
  Calendar,
  PenLine,
  PieChart,
  BarChart2,
  Heart,
  Cloud,
  Settings,
  Coffee,
  Bell,
  Search,
} from "lucide-react";

export default function Header() {
  const [userName, setUserName] = useState<string>("Beautiful");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .single();
        if (data?.display_name) setUserName(data.display_name);
      }
    }
    getUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const mainLinks = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "History & Search", href: "/history", icon: Search },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Log your MoonDay", href: "/log", icon: PenLine },
    { name: "Cycle insights", href: "/insights", icon: PieChart },
    { name: "Reports", href: "/reports", icon: BarChart2 },
    { name: "Medical Report", href: "/medical-report", icon: LogOut },
    { name: "Education", href: "/education", icon: LogOut },
  ];

  const personalLinks = [
    { name: "Personal journal", href: "/journal", icon: Heart },
    { name: "Private notes", href: "/notes", icon: Cloud },
    { name: "Self-Care", href: "/self-care", icon: Coffee },
    { name: "Reminders", href: "/reminders", icon: Bell },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      <header className="flex justify-between items-center w-full">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-2 text-ink hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-[14px] md:text-[16px] font-bold text-ink">
              Hello, {userName} ✨
            </h2>
            <p className="text-[11px] md:text-[12px] text-muted">
              Take a deep breath. You're doing great.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex w-[35px] h-[35px] bg-[#f9e5eb] rounded-full items-center justify-center text-[#a55f78] font-bold text-[14px]">
            {userName.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 border border-line bg-white rounded-[10px] md:rounded-[12px] text-[12px] md:text-[13px] font-bold text-[#826f79] hover:bg-[#fff0f3] hover:text-[#9e5872] hover:border-[#d990a8] transition-all"
          >
            <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="relative w-[280px] h-full bg-surface border-r border-line shadow-xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-5 flex justify-between items-center border-b border-line">
              <h1 className="text-[20px] font-extrabold text-[#a55f78] flex items-center gap-2">
                MoonDay 🌙
              </h1>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-muted hover:bg-slate-50 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div>
                <div className="text-[10px] font-bold text-[#b6a5ad] uppercase tracking-[1px] px-3 mb-2">
                  Your Space
                </div>
                <nav className="space-y-1">
                  {mainLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] font-bold transition-all ${pathname === link.href ? "bg-[#fff0f3] text-[#a55f78]" : "text-[#66545f]"}`}
                    >
                      <link.icon
                        className="w-[18px] h-[18px]"
                        strokeWidth={pathname === link.href ? 2.5 : 2}
                      />{" "}
                      {link.name}
                    </Link>
                  ))}
                </nav>
              </div>
              <div>
                <div className="text-[10px] font-bold text-[#b6a5ad] uppercase tracking-[1px] px-3 mb-2">
                  Personal Space
                </div>
                <nav className="space-y-1">
                  {personalLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] font-bold transition-all ${pathname === link.href ? "bg-[#fff0f3] text-[#a55f78]" : "text-[#66545f]"}`}
                    >
                      <link.icon
                        className="w-[18px] h-[18px]"
                        strokeWidth={pathname === link.href ? 2.5 : 2}
                      />{" "}
                      {link.name}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
