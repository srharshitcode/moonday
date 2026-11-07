"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  addDays,
  subDays,
} from "date-fns";
import { ChevronLeft, ChevronRight, Droplet, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState<any[]>([]);
  const [profile, setProfile] = useState<{
    cycle_length: number;
    luteal_length: number;
  }>({ cycle_length: 28, luteal_length: 14 });
  const [loading, setLoading] = useState(true);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchMonthData();
  }, [currentDate]);

  const fetchMonthData = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileData) {
      setProfile({
        cycle_length: profileData.cycle_length || 28,
        luteal_length: profileData.luteal_phase_length || 14,
      });
    }

    const searchStart = format(subMonths(currentDate, 3), "yyyy-MM-dd");
    const searchEnd = format(addMonths(currentDate, 3), "yyyy-MM-dd");

    const { data } = await supabase
      .from("daily_logs")
      .select("log_date, is_period_start, flow, is_spotting")
      .eq("user_id", user.id)
      .gte("log_date", searchStart)
      .lte("log_date", searchEnd);

    if (data) setLogs(data);
    setLoading(false);
  };

  // --- BULLETPROOF ENGINE ---
  const ovulationDays = new Set<string>();
  const fertileDays = new Set<string>();

  logs.forEach((log) => {
    // Explicit true check
    if (log.is_period_start === true && log.log_date) {
      const [year, month, day] = log.log_date.split("-").map(Number);
      const startDate = new Date(year, month - 1, day, 12, 0, 0);

      const cycle = parseInt(profile.cycle_length as any) || 28;
      const luteal = parseInt(profile.luteal_length as any) || 14;

      // 1. Backward Calculation
      const pastOvulation = subDays(startDate, luteal);
      ovulationDays.add(format(pastOvulation, "yyyy-MM-dd"));
      for (let i = 1; i <= 5; i++) {
        fertileDays.add(format(subDays(pastOvulation, i), "yyyy-MM-dd"));
      }

      // 2. Forward Calculation
      const nextExpectedPeriod = addDays(startDate, cycle);
      const futureOvulation = subDays(nextExpectedPeriod, luteal);
      ovulationDays.add(format(futureOvulation, "yyyy-MM-dd"));
      for (let i = 1; i <= 5; i++) {
        fertileDays.add(format(subDays(futureOvulation, i), "yyyy-MM-dd"));
      }
    }
  });

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    router.push(`/log?date=${dateStr}`);
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const startDayOfWeek = startOfMonth(currentDate).getDay();
  const emptyDays = Array.from({ length: startDayOfWeek }, (_, i) => i);

  return (
    <div className="animate-in fade-in duration-300 max-w-[1000px] mx-auto pb-10">
      <div className="mb-[30px] flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-bold text-ink mb-1 flex items-center gap-2">
            MoonDay Calendar 📅
          </h2>
          <p className="text-[13px] text-muted">
            Track your cycle, view predictions, and log your daily symptoms.
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#fbeaf0] rounded-[24px] p-[24px] md:p-[35px] shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-[20px] md:text-[24px] font-extrabold text-[#765f6b] tracking-tight">
            {format(currentDate, "MMMM yyyy")}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2.5 border border-[#eadfe4] rounded-xl hover:bg-[#fff0f3] hover:border-[#d990a8] hover:text-[#a55f78] text-[#826f79] transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2.5 border border-[#eadfe4] rounded-xl hover:bg-[#fff0f3] hover:border-[#d990a8] hover:text-[#a55f78] text-[#826f79] transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-4 text-center">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-[12px] font-bold text-[#b6a5ad] uppercase tracking-[1px]"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2 md:gap-3">
          {emptyDays.map((empty) => (
            <div
              key={`empty-${empty}`}
              className="h-[90px] md:h-[110px] rounded-[16px] bg-slate-50 border border-transparent"
            ></div>
          ))}

          {daysInMonth.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayLog = logs.find((l) => l.log_date === dateStr);
            const isTodayDate = isToday(day);

            let fertilityStatus = "none";
            if (ovulationDays.has(dateStr)) fertilityStatus = "ovulation";
            else if (fertileDays.has(dateStr)) fertilityStatus = "fertile";

            // Standard Tailwind Built-in Colors
            let bgClass = "bg-white";
            let borderClass = "border-slate-200 hover:border-pink-300";
            let textClass = "text-slate-600";

            if (dayLog) {
              bgClass = "bg-pink-50";
              borderClass = "border-pink-200 hover:border-pink-500";
              textClass = "text-red-900";
            } else if (fertilityStatus === "ovulation") {
              bgClass = "bg-blue-100";
              borderClass = "border-blue-300 hover:border-blue-500";
              textClass = "text-blue-800";
            } else if (fertilityStatus === "fertile") {
              bgClass = "bg-blue-50";
              borderClass = "border-blue-200 hover:border-blue-300";
              textClass = "text-blue-600";
            }

            if (isTodayDate) {
              borderClass = "border-[#a55f78] ring-2 ring-[#fff0f3]";
            }

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                disabled={loading}
                className={`h-[90px] md:h-[110px] flex flex-col items-center p-2 md:p-3 rounded-[16px] border transition-all shadow-sm hover:shadow-md relative group ${bgClass} ${borderClass}`}
              >
                <span
                  className={`text-[14px] md:text-[15px] font-bold mb-1 ${textClass}`}
                >
                  {format(day, "d")}
                </span>

                <div className="mt-auto flex flex-col items-center gap-1">
                  {dayLog?.is_period_start === true && (
                    <span className="text-[9px] md:text-[10px] font-extrabold text-white bg-red-900 px-2 py-0.5 rounded-md tracking-wide">
                      START
                    </span>
                  )}

                  {dayLog &&
                    dayLog.is_period_start !== true &&
                    !dayLog.is_spotting && (
                      <Droplet className="w-3.5 h-3.5 md:w-4 md:h-4 text-pink-500 fill-pink-500" />
                    )}

                  {dayLog?.is_spotting && (
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-300"></span>
                  )}

                  {/* Explicit Text Label so you can physically see the math engine working */}
                  {!dayLog && fertilityStatus === "ovulation" && (
                    <span className="text-[8px] md:text-[9px] font-extrabold text-blue-700 bg-white/70 px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
                      <Sparkles className="w-2 h-2" /> OVULATE
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 pt-6 border-t border-[#fbeaf0] justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-red-900 flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">S</span>
            </div>
            <span className="text-[13px] font-medium text-[#765f6b]">
              Period Start
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-pink-50 border border-pink-200 flex items-center justify-center">
              <Droplet className="w-2.5 h-2.5 text-pink-500 fill-pink-500" />
            </div>
            <span className="text-[13px] font-medium text-[#765f6b]">
              Period Day
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-blue-100 border border-blue-300 flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-blue-700" />
            </div>
            <span className="text-[13px] font-medium text-[#765f6b]">
              Predicted Ovulation
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-blue-50 border border-blue-200"></div>
            <span className="text-[13px] font-medium text-[#765f6b]">
              Fertile Window
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
