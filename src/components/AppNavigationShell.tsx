"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  type LucideIcon,
  Home,
  Search,
  Calendar,
  PenLine,
  PieChart,
  BarChart3,
  FileText,
  BookOpen,
  Heart,
  Cloud,
  Coffee,
  Bell,
  Settings,
  EyeOff,
  Eye,
  Sparkles,
  Plus,
  LogOut,
  LayoutGrid,
  X,
  ChevronRight,
  Timer,
} from "lucide-react";

interface DesktopNavItem {
  id: string;
  label: string;
  href: string;
  altHref?: string;
  icon: LucideIcon;
  highlight?: boolean;
}

interface DesktopNavGroup {
  groupLabel: string;
  items: DesktopNavItem[];
}

interface MobileDrawerItem {
  id: string;
  label: string;
  subtitle: string;
  href: string;
  altHref?: string;
  icon: LucideIcon;
}

interface MobileDrawerGroup {
  groupLabel: string;
  items: MobileDrawerItem[];
}

export const MoonDayBrandLogo = ({
  className = "w-7 h-7",
}: {
  className?: string;
}) => (
  <svg
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect
      width="36"
      height="36"
      rx="10"
      fill="#FFF0F3"
      stroke="#F4C2C2"
      strokeWidth="1.2"
    />
    <path
      d="M21.8 10.2C17.2 10.8 13.8 14.7 13.8 19.5C13.8 24.7 18.0 28.9 23.2 28.9C24.9 28.9 26.5 28.4 27.8 27.6C25.9 29.7 23.1 31 20.0 31C14.2 31 9.5 26.3 9.5 20.5C9.5 14.9 13.9 10.3 19.5 10.0C20.3 10.0 21.1 10.0 21.8 10.2Z"
      fill="#D990A8"
      stroke="#A55F78"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="24.5" cy="13.5" r="2" fill="#A55F78" />
  </svg>
);

const DESKTOP_NAV_GROUPS: DesktopNavGroup[] = [
  {
    groupLabel: "Your Cycle Space",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/", icon: Home },
      {
        id: "log",
        label: "Log your MoonDay",
        href: "/log",
        icon: PenLine,
      },

      { id: "calendar", label: "Calendar", href: "/calendar", icon: Calendar },
      {
        id: "history",
        label: "History & Search",
        href: "/history",
        icon: Search,
      },
    ],
  },

  {
    groupLabel: "Clinical & Insights",
    items: [
      {
        id: "insights",
        label: "Cycle Insights",
        href: "/insights",
        altHref: "/cycle-insights",
        icon: PieChart,
      },
      { id: "reports", label: "Reports", href: "/reports", icon: BarChart3 },
      {
        id: "medical-report",
        label: "Medical Report",
        href: "/medical-report",
        icon: FileText,
      },
      {
        id: "education",
        label: "Education",
        href: "/education",
        icon: BookOpen,
      },
    ],
  },

  {
    groupLabel: "Personal Sanctuary",
    items: [
      {
        id: "journal",
        label: "Personal Journal",
        href: "/journal",
        icon: Heart,
      },

      {
        id: "pomodoro",
        label: "Pomodoro Focus",
        href: "/pomodoro",
        icon: Timer,
      },

      {
        id: "notes",
        label: "Private Notes",
        href: "/notes",
        altHref: "/private-notes",
        icon: Cloud,
      },
      {
        id: "self-care",
        label: "Self-Care",
        href: "/self-care",
        icon: Coffee,
      },
      { id: "reminders", label: "Reminders", href: "/reminders", icon: Bell },
      {
        id: "settings",
        label: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];

const MOBILE_DRAWER_GROUPS: MobileDrawerGroup[] = [
  {
    groupLabel: "Clinical & Insights",
    items: [
      {
        id: "insights",
        label: "Cycle Insights",
        subtitle: "Phases & patterns",
        href: "/insights",
        altHref: "/cycle-insights",
        icon: PieChart,
      },

      {
        id: "reports",
        label: "Reports",
        subtitle: "Charts & trends",
        href: "/reports",
        icon: BarChart3,
      },

      {
        id: "medical-report",
        label: "Medical Report",
        subtitle: "Doctor PDF export",
        href: "/medical-report",
        icon: FileText,
      },

      {
        id: "education",
        label: "Education",
        subtitle: "Hormone guides",
        href: "/education",
        icon: BookOpen,
      },

    ],
  },
  {
    groupLabel: "Sanctuary & Utilities",
    items: [
      {
        id: "pomodoro",
        label: "Pomodoro Focus",
        subtitle: "Distraction-free timer",
        href: "/pomodoro",
        icon: Timer,
      },

      {
        id: "history",
        label: "History & Search",
        subtitle: "Past cycle logs",
        href: "/history",
        icon: Search,
      },

      {
        id: "notes",
        label: "Private Notes",
        subtitle: "Partner & encrypted",
        href: "/notes",
        altHref: "/private-notes",
        icon: Cloud,
      },

      {
        id: "self-care",
        label: "Self-Care",
        subtitle: "Rituals & comfort",
        href: "/self-care",
        icon: Coffee,
      },

      {
        id: "reminders",
        label: "Reminders",
        subtitle: "Cycle & pill alerts",
        href: "/reminders",
        icon: Bell,
      },
    ],
  },
];

const PRIMARY_MOBILE_IDS = ["dashboard", "calendar", "log", "journal"];

export default function AppNavigationShell({
  userName = "there",
  gentleReminderText = "It is completely normal to crave more food before your moonday. Your metabolic rate naturally rises in the luteal phase.",
  children,
}: {
  userName?: string;
  gentleReminderText?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [liveUserName, setLiveUserName] = useState(userName);
  const [privacyBlurActive, setPrivacyBlurActive] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [clickedId, setClickedId] = useState<string | null>(null);

  useEffect(() => {
    if (userName && userName !== "there") {
      setLiveUserName(userName);
    }
  }, [userName]);

  const syncDisplayNameFromProfile = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();

      const resolvedName =
        profile?.display_name?.trim() ||
        user.user_metadata?.display_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0];

      if (resolvedName) {
        setLiveUserName(resolvedName);
      }
    } catch {}
  }, [supabase]);

  useEffect(() => {
    syncDisplayNameFromProfile();
  }, [pathname, syncDisplayNameFromProfile]);

  useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ displayName?: string }>;
      const nextName = customEvent.detail?.displayName?.trim();
      if (nextName) {
        setLiveUserName(nextName);
      } else {
        syncDisplayNameFromProfile();
      }
    };

    window.addEventListener("moonday:profile-updated", handleProfileUpdated);
    return () =>
      window.removeEventListener(
        "moonday:profile-updated",
        handleProfileUpdated,
      );
  }, [syncDisplayNameFromProfile]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setClickedId(null);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "x") {
        e.preventDefault();
        setPrivacyBlurActive((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      window.location.href = "/login";
    } finally {
      setSigningOut(false);
    }
  };

  const activeNavId = useMemo(() => {
    if (clickedId) return clickedId;
    if (!pathname || pathname === "/" || pathname === "/dashboard") {
      return "dashboard";
    }

    const allItems: DesktopNavItem[] = DESKTOP_NAV_GROUPS.flatMap(
      (g) => g.items,
    );

    const exactMatch = allItems.find(
      (item) =>
        item.href !== "/" &&
        (pathname === item.href ||
          (item.altHref !== undefined && pathname === item.altHref)),
    );
    if (exactMatch) return exactMatch.id;

    const prefixMatch = allItems.find(
      (item) =>
        item.href !== "/" &&
        (pathname.startsWith(`${item.href}/`) ||
          (item.altHref !== undefined &&
            pathname.startsWith(`${item.altHref}/`))),
    );
    if (prefixMatch) return prefixMatch.id;

    return "dashboard";
  }, [pathname, clickedId]);

  const isSecondaryMobileRouteActive =
    !PRIMARY_MOBILE_IDS.includes(activeNavId);

  return (
    <div className="min-h-screen bg-[#FAF7F8] text-ink flex flex-col md:flex-row">
      {/* 1. DESKTOP EDITORIAL SIDEBAR */}
      <aside className="hidden md:flex md:w-[264px] shrink-0 bg-white border-r border-line flex-col justify-between p-5 select-none print:hidden sticky top-0 h-screen overflow-y-auto custom-scrollbar">
        <div>
          <Link
            className="flex items-center gap-3 px-2 pb-5 mb-5 border-b border-line/80 group"
            href="/"
            onClick={() => setClickedId("dashboard")}
          >
            <MoonDayBrandLogo className="w-9 h-9 shrink-0 transition-transform group-hover:scale-105" />
            <div>
              <span className="text-[20px] font-extrabold tracking-tight text-[#a55f78] block leading-none">
                MoonDay
              </span>
              <span className="text-[11px] font-medium text-muted block mt-1">
                Your cycle. Your space.
              </span>
            </div>
          </Link>

          <nav className="space-y-6">
            {DESKTOP_NAV_GROUPS.map((group) => (
              <div key={group.groupLabel}>
                <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#826f79]">
                  {group.groupLabel}
                </div>
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeNavId === item.id;

                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          onClick={() => setClickedId(item.id)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all border ${
                            isActive
                              ? "bg-[#fff0f3] text-[#a55f78] border-[#f4c2c2]/80 shadow-2xs"
                              : "text-[#66545f] border-transparent hover:bg-[#fcf9fa] hover:text-ink"
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <Icon
                              className={`w-4 h-4 ${
                                isActive ? "text-[#a55f78]" : "text-[#826f79]"
                              }`}
                            />
                            <span>{item.label}</span>
                          </span>
                          {item.highlight && !isActive && (
                            <span className="w-2 h-2 rounded-full bg-[#d990a8]" />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-6 space-y-3">
          <div className="p-4 rounded-2xl bg-[#fff8fa] border border-[#f4c2c2]/80">
            <div className="flex items-center gap-2 text-[12px] font-bold text-[#a55f78] mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#d990a8] shrink-0" />
              <span>A gentle reminder</span>
            </div>
            <p className="text-[11.5px] text-[#66545f] leading-relaxed">
              {gentleReminderText}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-bold text-red-500 bg-white border border-red-100 hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer disabled:opacity-60"
          >
            <LogOut className="w-4 h-4" />
            <span>{signingOut ? "Signing out..." : "Sign Out"}</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT COLUMN + TOP SANCTUARY BAR */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-0">
        <header className="bg-white/90 backdrop-blur-md border-b border-line px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-30 print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              onClick={() => setClickedId("dashboard")}
              className="md:hidden shrink-0"
            >
              <MoonDayBrandLogo className="w-8 h-8" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-[16px] sm:text-[18px] font-bold text-ink tracking-tight truncate">
                Hello, {liveUserName}
              </h1>
              <p className="text-[12px] text-muted truncate">
                Take a deep breath. You&apos;re doing great.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setPrivacyBlurActive((prev) => !prev)}
              title="Toggle Privacy Screen Blur (Ctrl+Shift+X)"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold border transition-all cursor-pointer ${
                privacyBlurActive
                  ? "bg-[#a55f78] text-white border-[#a55f78]"
                  : "bg-[#fcf9fa] text-[#66545f] border-line hover:border-[#d990a8] hover:text-[#a55f78]"
              }`}
            >
              {privacyBlurActive ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Unblur Screen</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Privacy Blur</span>
                </>
              )}
            </button>

            <Link
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#d990a8] text-white text-[12px] font-bold hover:brightness-95 transition-all shadow-2xs"
              href="/log"
              onClick={() => setClickedId("log")}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Quick Log</span>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              title="Sign Out"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold bg-[#fcf9fa] text-red-500 border border-line hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer disabled:opacity-60"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">
                {signingOut ? "Signing out..." : "Sign Out"}
              </span>
            </button>
          </div>
        </header>

        <main
          className={`flex-1 p-4 sm:p-6 md:p-8 transition-all duration-200 ${
            privacyBlurActive
              ? "blur-md select-none pointer-events-none opacity-40"
              : "opacity-100"
          }`}
        >
          {children}
        </main>
      </div>

      {/* 3. MOBILE "SPACES" SHEET */}

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex flex-col justify-end print:hidden">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-ink/30 backdrop-blur-xs animate-in fade-in duration-200"
          />

          <div className="relative bg-white border-t border-[#eadfe4] rounded-t-[28px] px-4 pt-3 pb-[84px] max-h-[88vh] overflow-y-auto shadow-[0_-16px_48px_rgba(30,23,27,0.16)] animate-in slide-in-from-bottom duration-200">
            <div className="w-10 h-1 rounded-full bg-[#eadfe4] mx-auto mb-3" />

            <div className="flex items-center justify-between px-1 pb-3 mb-3.5 border-b border-line/70">
              <div className="flex items-center gap-2.5">
                <MoonDayBrandLogo className="w-7 h-7" />
                <div>
                  <span className="text-[14px] font-extrabold text-ink tracking-tight block leading-none">
                    Explore MoonDay Spaces
                  </span>
                  <span className="text-[11px] text-muted block mt-0.5">
                    Clinical reports, insights & personal sanctuary
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-[#fcf9fa] border border-line flex items-center justify-center text-[#66545f] hover:text-ink cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {MOBILE_DRAWER_GROUPS.map((group) => (
                <div key={group.groupLabel}>
                  <div className="px-1 mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a55f78]">
                    {group.groupLabel}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeNavId === item.id;

                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => {
                            setClickedId(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`flex items-center gap-2.5 p-2.5 rounded-2xl transition-all border ${
                            isActive
                              ? "bg-[#fff0f3] text-[#a55f78] border-[#d990a8] shadow-2xs"
                              : "bg-[#fcf9fa] text-ink border-line/80 hover:bg-white hover:border-[#d990a8]/60"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                              isActive
                                ? "bg-white border-[#f4c2c2] text-[#a55f78]"
                                : "bg-white border-line text-[#a55f78]"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[12px] font-bold leading-tight truncate">
                              {item.label}
                            </div>
                            <div className="text-[10px] text-muted leading-tight truncate mt-0.5">
                              {item.subtitle}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <Link
                href="/settings"
                onClick={() => {
                  setClickedId("settings");
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-[12px] font-bold border transition-all ${
                  activeNavId === "settings"
                    ? "bg-[#fff0f3] text-[#a55f78] border-[#d990a8]"
                    : "bg-[#fcf9fa] text-[#66545f] border-line/80 hover:bg-white hover:text-ink"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#a55f78]" />
                  <span>Settings</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-muted" />
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl text-[12px] font-bold text-red-500 bg-red-50/60 border border-red-200/70 hover:bg-red-50 transition-all cursor-pointer disabled:opacity-60"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{signingOut ? "Signing out..." : "Sign Out"}</span>
              </button>
            </div>

            <div className="mt-3 p-3 rounded-2xl bg-[#fff8fa] border border-[#f4c2c2]/80 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#d990a8] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#66545f] leading-relaxed">
                <strong className="text-[#a55f78] font-bold">
                  Gentle reminder:{" "}
                </strong>
                {gentleReminderText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. MOBILE FROSTED-GLASS BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-[70] bg-white/95 backdrop-blur-md border-t border-line px-2 py-1.5 flex items-center justify-around print:hidden shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
        <Link
          href="/"
          onClick={() => setClickedId("dashboard")}
          className={`flex flex-col font-bold gap-0.5 items-center px-3 py-1 rounded-xl text-[10px] transition-colors ${
            activeNavId === "dashboard" && !mobileMenuOpen
              ? "text-[#a55f78]"
              : "text-muted hover:text-[#a55f78]"
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>

        <Link
          href="/calendar"
          onClick={() => setClickedId("calendar")}
          className={`flex flex-col font-bold gap-0.5 items-center px-3 py-1 rounded-xl text-[10px] transition-colors ${
            activeNavId === "calendar" && !mobileMenuOpen
              ? "text-[#a55f78]"
              : "text-muted hover:text-[#a55f78]"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Calendar</span>
        </Link>

        <Link
          href="/log"
          onClick={() => setClickedId("log")}
          className="flex flex-col items-center justify-center -mt-4 w-12 h-12 rounded-2xl bg-[#d990a8] text-white shadow-[0_6px_16px_-4px_rgba(217,144,168,0.6)] active:scale-95 transition-transform"
          aria-label="Log your MoonDay"
        >
          <Plus className="w-5 h-5" />
        </Link>

        <Link
          href="/journal"
          onClick={() => setClickedId("journal")}
          className={`flex flex-col font-bold gap-0.5 items-center px-3 py-1 rounded-xl text-[10px] transition-colors ${
            activeNavId === "journal" && !mobileMenuOpen
              ? "text-[#a55f78]"
              : "text-muted hover:text-[#a55f78]"
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Journal</span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className={`relative flex flex-col font-bold gap-0.5 items-center px-3 py-1 rounded-xl text-[10px] transition-colors cursor-pointer ${
            mobileMenuOpen || isSecondaryMobileRouteActive
              ? "text-[#a55f78]"
              : "text-muted hover:text-[#a55f78]"
          }`}
        >
          {mobileMenuOpen ? (
            <X className="w-4 h-4" />
          ) : (
            <LayoutGrid className="w-4 h-4" />
          )}
          <span>Spaces</span>
          {isSecondaryMobileRouteActive && !mobileMenuOpen && (
            <span className="absolute top-1 right-2.5 w-1.5 h-1.5 rounded-full bg-[#d990a8]" />
          )}
        </button>
      </nav>
    </div>
  );
}
