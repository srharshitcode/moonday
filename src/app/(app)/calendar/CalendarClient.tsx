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
  differenceInDays,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Droplet,
  Sparkles,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [visibleLogs, setVisibleLogs] = useState<any[]>([]);
  const [allStartDates, setAllStartDates] = useState<Date[]>([]);
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

    const { data: windowLogs } = await supabase
      .from("daily_logs")
      .select("log_date, is_period_start, flow, is_spotting")
      .eq("user_id", user.id)
      .gte("log_date", searchStart)
      .lte("log_date", searchEnd);

    if (windowLogs) setVisibleLogs(windowLogs);

    const { data: historyLogs } = await supabase
      .from("daily_logs")
      .select("log_date")
      .eq("user_id", user.id)
      .eq("is_period_start", true)
      .order("log_date", { ascending: true });

    if (historyLogs && historyLogs.length > 0) {
      const dates = historyLogs.map((l) => {
        const [year, month, day] = l.log_date.split("-").map(Number);
        return new Date(year, month - 1, day, 12, 0, 0);
      });
      setAllStartDates(dates);
    }

    setLoading(false);
  };

  // === THE SMART CALCULATION ENGINE ===
  let dynamicCycle = Number(profile.cycle_length) || 28;
  const luteal = Number(profile.luteal_length) || 14;

  if (allStartDates.length >= 2) {
    let totalDays = 0;
    for (let i = 1; i < allStartDates.length; i++) {
      totalDays += differenceInDays(allStartDates[i], allStartDates[i - 1]);
    }
    dynamicCycle = Math.round(totalDays / (allStartDates.length - 1));
  }

  const ovulationDays = new Set<string>();
  const fertileDays = new Set<string>();
  const lutealPhaseDays = new Set<string>();

  // 1. HISTORICAL CYCLES
  allStartDates.forEach((startDate) => {
    const pastOvulation = subDays(startDate, luteal);
    ovulationDays.add(format(pastOvulation, "yyyy-MM-dd"));

    for (let i = 1; i <= 5; i++)
      fertileDays.add(format(subDays(pastOvulation, i), "yyyy-MM-dd"));
    for (let i = 1; i <= 2; i++)
      fertileDays.add(format(addDays(pastOvulation, i), "yyyy-MM-dd"));

    const lutealStart = addDays(pastOvulation, 3);
    const daysInLuteal = differenceInDays(startDate, lutealStart);
    for (let i = 0; i < daysInLuteal; i++) {
      lutealPhaseDays.add(format(addDays(lutealStart, i), "yyyy-MM-dd"));
    }
  });

  // 2. FUTURE CYCLES
  if (allStartDates.length > 0) {
    const latestStartDate = allStartDates[allStartDates.length - 1];

    for (let cycleNum = 1; cycleNum <= 3; cycleNum++) {
      const projectedNextPeriod = addDays(
        latestStartDate,
        dynamicCycle * cycleNum,
      );
      const predictedOvulation = subDays(projectedNextPeriod, luteal);

      ovulationDays.add(format(predictedOvulation, "yyyy-MM-dd"));

      for (let i = 1; i <= 5; i++)
        fertileDays.add(format(subDays(predictedOvulation, i), "yyyy-MM-dd"));
      for (let i = 1; i <= 2; i++)
        fertileDays.add(format(addDays(predictedOvulation, i), "yyyy-MM-dd"));

      const lutealStart = addDays(predictedOvulation, 3);
      const daysInLuteal = differenceInDays(projectedNextPeriod, lutealStart);
      for (let i = 0; i < daysInLuteal; i++) {
        lutealPhaseDays.add(format(addDays(lutealStart, i), "yyyy-MM-dd"));
      }
    }
  }

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    router.push(`/log?date=${dateStr}`);
  };

  const handleMonthSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [year, month] = e.target.value.split("-").map(Number);
    setCurrentDate(new Date(year, month - 1, 1, 12, 0, 0));
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const startDayOfWeek = startOfMonth(currentDate).getDay();
  const emptyDays = Array.from({ length: startDayOfWeek }, (_, i) => i);

  return (
    <div className="animate-in fade-in duration-300 w-full max-w-[900px] mx-auto pb-10 px-3 md:px-0">
      {/* PAGE HEADER */}
      <div className="mb-4 md:mb-[20px]">
        <h2 className="text-[20px] md:text-[24px] font-bold text-ink mb-1 flex items-center gap-2">
          MoonDay Calendar <CalendarIcon className="w-5 h-5 text-[#d990a8]" />
        </h2>
        <p className="text-[12px] md:text-[13px] text-muted">
          {allStartDates.length >= 2
            ? `Dynamic Average Cycle: ${dynamicCycle} days`
            : "Log more cycles to unlock personalized average predictions."}
        </p>
      </div>

      <div className="bg-white border border-[#fbeaf0] rounded-[16px] md:rounded-[24px] p-3 sm:p-5 md:p-[24px] shadow-sm w-full">
        {/* CALENDAR CONTROLS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mb-4 md:mb-6">
          <h3 className="text-[16px] sm:text-[18px] md:text-[22px] font-extrabold text-[#765f6b] tracking-tight">
            {format(currentDate, "MMMM yyyy")}
          </h3>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <input
              type="month"
              value={format(currentDate, "yyyy-MM")}
              onChange={handleMonthSelect}
              className="p-1.5 sm:p-2 border border-[#eadfe4] rounded-lg sm:rounded-xl text-[12px] sm:text-[13px] font-bold text-[#765f6b] outline-none hover:border-[#d990a8] focus:border-[#a55f78] bg-slate-50 cursor-pointer flex-1 sm:flex-none"
            />

            <div className="flex gap-1 sm:gap-1.5">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-1.5 sm:p-2 border border-[#eadfe4] rounded-lg sm:rounded-xl hover:bg-[#fff0f3] hover:border-[#d990a8] hover:text-[#a55f78] text-[#826f79] transition-all"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-1.5 sm:p-2 border border-[#eadfe4] rounded-lg sm:rounded-xl hover:bg-[#fff0f3] hover:border-[#d990a8] hover:text-[#a55f78] text-[#826f79] transition-all"
              >
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* DAYS OF WEEK */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2 mb-2 text-center">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-[9px] sm:text-[10px] md:text-[11px] font-bold text-[#b6a5ad] uppercase tracking-wider"
            >
              {day.slice(0, 3)}
            </div>
          ))}
        </div>

        {/* CALENDAR GRID */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2.5">
          {emptyDays.map((empty) => (
            <div
              key={`empty-${empty}`}
              className="min-h-[55px] sm:min-h-[70px] md:min-h-[90px] rounded-[8px] sm:rounded-[10px] md:rounded-[12px] bg-slate-50 border border-transparent"
            ></div>
          ))}

          {daysInMonth.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayLog = visibleLogs.find((l) => l.log_date === dateStr);
            const isTodayDate = isToday(day);

            let fertilityStatus = "none";
            if (ovulationDays.has(dateStr)) fertilityStatus = "ovulation";
            else if (fertileDays.has(dateStr)) fertilityStatus = "fertile";
            else if (lutealPhaseDays.has(dateStr)) fertilityStatus = "luteal";

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
            } else if (fertilityStatus === "luteal") {
              bgClass = "bg-[#fcf8fa]";
              borderClass = "border-[#f5e6ec] hover:border-[#d990a8]";
              textClass = "text-[#8a7280]";
            }

            if (isTodayDate) {
              borderClass = "border-[#a55f78] ring-2 ring-[#fff0f3]";
            }

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                disabled={loading}
                className={`min-h-[55px] sm:min-h-[70px] md:min-h-[90px] w-full flex flex-col items-center p-1 sm:p-1.5 md:p-2 rounded-[8px] sm:rounded-[10px] md:rounded-[14px] border transition-all shadow-sm hover:shadow-md overflow-hidden ${bgClass} ${borderClass}`}
              >
                <span
                  className={`text-[11px] sm:text-[13px] md:text-[14px] font-bold mb-0.5 sm:mb-1 ${textClass}`}
                >
                  {format(day, "d")}
                </span>

                {/* BOTTOM BADGE CONTAINER */}
                <div className="mt-auto flex flex-col items-center gap-0.5 w-full">
                  {dayLog?.is_period_start === true && (
                    <span className="text-[7px] sm:text-[8px] md:text-[9px] font-extrabold text-white bg-red-900 px-1 sm:px-1.5 py-0.5 rounded shadow-sm tracking-wide truncate w-[90%] text-center">
                      START
                    </span>
                  )}

                  {dayLog &&
                    dayLog.is_period_start !== true &&
                    !dayLog.is_spotting && (
                      <Droplet className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 text-pink-500 fill-pink-500 drop-shadow-sm flex-shrink-0" />
                    )}

                  {dayLog?.is_spotting && (
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-pink-300 shadow-sm flex-shrink-0"></span>
                  )}

                  {!dayLog && fertilityStatus === "ovulation" && (
                    <span className="text-[7px] md:text-[8px] font-extrabold text-blue-700 bg-white/80 px-1 py-0.5 rounded shadow-sm flex items-center justify-center gap-0.5 w-[95%] truncate">
                      <Sparkles className="w-2 h-2 flex-shrink-0" />
                      <span className="hidden sm:inline truncate">OVULATE</span>
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* RESPONSIVE LEGEND */}
        <div className="mt-5 sm:mt-8 flex flex-wrap gap-x-3 sm:gap-x-6 gap-y-2 sm:gap-y-3 pt-4 sm:pt-5 border-t border-[#fbeaf0] justify-center">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-red-900 shadow-sm"></div>
            <span className="text-[9px] sm:text-[11px] font-bold text-[#765f6b]">
              Moonday Start
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-pink-50 border border-pink-200 flex items-center justify-center shadow-sm">
              <Droplet className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-pink-500 fill-pink-500" />
            </div>
            <span className="text-[9px] sm:text-[11px] font-bold text-[#765f6b]">
              Moonday Day
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-blue-100 border border-blue-300 flex items-center justify-center shadow-sm">
              <Sparkles className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-blue-700" />
            </div>
            <span className="text-[9px] sm:text-[11px] font-bold text-[#765f6b]">
              Ovulation
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-blue-50 border border-blue-200 shadow-sm"></div>
            <span className="text-[9px] sm:text-[11px] font-bold text-[#765f6b]">
              Fertile Window
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-[#fcf8fa] border border-[#f5e6ec] shadow-sm"></div>
            <span className="text-[9px] sm:text-[11px] font-bold text-[#765f6b]">
              Luteal Phase
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
