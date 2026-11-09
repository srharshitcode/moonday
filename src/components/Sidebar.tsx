"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
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
  FileText,
  X,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);

  
  const [dailyQuote, setDailyQuote] = useState(
    "Every body is different. Your experience is valid, and your data belongs to you.",
  );

  // 3. Close sidebar automatically when a link is clicked on mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

 
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      handleSwipe();
    };

    const handleSwipe = () => {
      const swipeDistanceX = touchEndX - touchStartX;
      const swipeDistanceY = Math.abs(touchEndY - touchStartY);

      // Require the swipe to be mostly horizontal (ignore if they scrolled up/down a lot)
      if (swipeDistanceY > 60) return;

      // SWIPE RIGHT TO OPEN
      // Widen the edge zone to 80px (much easier to hit with a phone case)
      // Lower the required swipe distance to just 35px for a quick flick
      if (swipeDistanceX > 35 && touchStartX < 80 && !isOpen) {
        setIsOpen(true);
      }

      // SWIPE LEFT TO CLOSE
      if (swipeDistanceX < -35 && isOpen) {
        setIsOpen(false);
      }
    };

    // Use capturing phase to guarantee we catch the touch before nested elements consume it
    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
      capture: true,
    });
    document.addEventListener("touchend", handleTouchEnd, {
      passive: true,
      capture: true,
    });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart, {
        capture: true,
      });
      document.removeEventListener("touchend", handleTouchEnd, {
        capture: true,
      });
    };
  }, [isOpen]);

  // 5. Fetch a random quote from Supabase on mount
  useEffect(() => {
    async function fetchQuote() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("daily_quotes")
        .select("quote_text")
        .limit(50);

      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        setDailyQuote(data[randomIndex].quote_text);
      }
    }
    fetchQuote();
  }, []);

  const mainLinks = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "History & Search", href: "/history", icon: Search },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Log your MoonDay", href: "/log", icon: PenLine },
    { name: "Cycle insights", href: "/insights", icon: PieChart },
    { name: "Reports", href: "/reports", icon: BarChart2 },
    { name: "Medical Report", href: "/medical-report", icon: FileText },
    { name: "Education", href: "/education", icon: FileText },
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
      {/* 6. Background Overlay for Mobile (Click to close) */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden transition-opacity animate-in fade-in duration-300"
        />
      )}

      {/* 7. The Sidebar Component */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-[260px] md:w-[245px] bg-surface flex flex-col border-r border-line overflow-y-auto shadow-2xl md:shadow-none
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <div className="p-[28px] pb-[18px] flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-extrabold text-[#a55f78] tracking-tight flex items-center gap-2">
              MoonDay <span className="text-[20px] opacity-80">🌙</span>
            </h1>
            <p className="text-[11px] text-[#826f79] mt-1 font-medium">
              Your cycle. Your space. Your story.
            </p>
          </div>
          {/* Close button for mobile users who prefer tapping over swiping */}
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2 text-muted hover:text-ink hover:bg-slate-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-[14px] flex-1 mt-4">
          <div className="mb-6">
            <div className="text-[10px] font-bold text-[#b6a5ad] uppercase tracking-[1px] px-[14px] mb-2">
              Your Space
            </div>
            <nav className="space-y-0.5">
              {mainLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-3 px-[14px] py-[10px] rounded-[12px] text-[13px] font-bold transition-all ${
                      isActive
                        ? "bg-[#fff0f3] text-[#a55f78]"
                        : "text-[#66545f] hover:bg-white hover:text-[#a55f78]"
                    }`}
                  >
                    <Icon
                      className="w-[18px] h-[18px]"
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mb-6">
            <div className="text-[10px] font-bold text-[#b6a5ad] uppercase tracking-[1px] px-[14px] mb-2">
              Personal Space
            </div>
            <nav className="space-y-0.5">
              {personalLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-3 px-[14px] py-[10px] rounded-[12px] text-[13px] font-bold transition-all ${
                      isActive
                        ? "bg-[#fff0f3] text-[#a55f78]"
                        : "text-[#66545f] hover:bg-white hover:text-[#a55f78]"
                    }`}
                  >
                    <Icon
                      className="w-[18px] h-[18px]"
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="p-[20px] mt-auto">
          <div className="bg-[#fff8fa] border border-[#fbeaf0] rounded-2xl p-[18px]">
            <div className="text-[14px] mb-2">🌷</div>
            <h4 className="text-[12px] font-bold text-[#a55f78] mb-1">
              A gentle reminder
            </h4>
            <p className="text-[11px] text-[#826f79] leading-relaxed">
              {dailyQuote}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
