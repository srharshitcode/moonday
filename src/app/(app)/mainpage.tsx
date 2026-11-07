"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  format,
  differenceInDays,
  addDays,
  subDays,
  isWithinInterval,
  isSameDay,
} from "date-fns";
import {
  Sparkles,
  Droplet,
  PenLine,
  Calendar as CalendarIcon,
  ArrowRight,
  Loader2,
  Activity,
  PieChart,
  Book,
  Heart,
  FileText,
  Clock,
} from "lucide-react";
import Link from "next/link";

export default function DashboardClient() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Beautiful");
  const [cycleStatus, setCycleStatus] = useState({
    day: 0,
    dynamicCycle: 28,
    periodLength: 5,
    phase: "Loading...",
    nextPeriod: null as Date | null,
    ovulation: null as Date | null,
    daysUntilPeriod: 0,
  });
  const [todayLog, setTodayLog] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  const supabase = createClient();
  const today = new Date();

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "display_name, cycle_length, period_length, luteal_phase_length",
        )
        .eq("id", user.id)
        .single();

      if (profile?.display_name) setUserName(profile.display_name);

      const todayStr = format(today, "yyyy-MM-dd");
      const sevenDaysAgo = format(subDays(today, 7), "yyyy-MM-dd");

      const { data: recent } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("log_date", sevenDaysAgo)
        .order("log_date", { ascending: false });

      if (recent) {
        setRecentLogs(
          recent.filter((l) => l.log_date !== todayStr).slice(0, 4),
        );
        const todayData = recent.find((l) => l.log_date === todayStr);
        if (todayData) setTodayLog(todayData);
      }

      const { data: historyLogs } = await supabase
        .from("daily_logs")
        .select("log_date")
        .eq("user_id", user.id)
        .eq("is_period_start", true)
        .order("log_date", { ascending: true });

      let dynamicCycle = Number(profile?.cycle_length) || 28;
      const periodLen = Number(profile?.period_length) || 5;
      const luteal = Number(profile?.luteal_phase_length) || 14;

      if (historyLogs && historyLogs.length > 0) {
        const startDates = historyLogs.map((l: any) => {
          const [year, month, day] = l.log_date.split("-").map(Number);
          return new Date(year, month - 1, day, 12, 0, 0);
        });

        if (startDates.length >= 2) {
          let totalDays = 0;
          for (let i = 1; i < startDates.length; i++) {
            totalDays += differenceInDays(startDates[i], startDates[i - 1]);
          }
          dynamicCycle = Math.round(totalDays / (startDates.length - 1));
        }

        const lastPeriod = startDates[startDates.length - 1];
        const currentDay = differenceInDays(today, lastPeriod) + 1;

        const nextExpected = addDays(lastPeriod, dynamicCycle);
        const expectedOvulation = subDays(nextExpected, luteal);
        const daysUntil = differenceInDays(nextExpected, today);

        let phase = "Follicular Phase";
        const fertileStart = subDays(expectedOvulation, 5);

        if (currentDay <= periodLen) {
          phase = "Menstrual Phase";
        } else if (isSameDay(today, expectedOvulation)) {
          phase = "Ovulation Day";
        } else if (
          isWithinInterval(today, {
            start: fertileStart,
            end: expectedOvulation,
          })
        ) {
          phase = "Fertile Window";
        } else if (today > expectedOvulation) {
          phase = "Luteal Phase";
        }

        setCycleStatus({
          day: currentDay > 0 ? currentDay : 0,
          dynamicCycle,
          periodLength: periodLen,
          phase,
          nextPeriod: nextExpected,
          ovulation: expectedOvulation,
          daysUntilPeriod: daysUntil,
        });
      } else {
        setCycleStatus((prev) => ({
          ...prev,
          phase: "No cycle data yet",
          dynamicCycle,
          periodLength: periodLen,
        }));
      }

      setLoading(false);
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#d990a8]" />
      </div>
    );
  }

  const safeCycleDay = Math.min(cycleStatus.day, cycleStatus.dynamicCycle);
  const progressPercentage = (safeCycleDay / cycleStatus.dynamicCycle) * 100;

  const menstrualWidth =
    (cycleStatus.periodLength / cycleStatus.dynamicCycle) * 100;
  const lutealWidth = (14 / cycleStatus.dynamicCycle) * 100;
  const fertileWidth = (6 / cycleStatus.dynamicCycle) * 100;
  const follicularWidth = 100 - menstrualWidth - lutealWidth - fertileWidth;

  return (
    <div className="animate-in fade-in duration-300 max-w-[1200px] mx-auto pb-10">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-extrabold text-ink tracking-tight mb-1">
            Dashboard
          </h1>
          <p className="text-[13px] text-muted font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" /> {format(today, "EEEE, MMMM do, yyyy")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* MAIN INSTRUMENT CLUSTER */}
        <div className="md:col-span-8 bg-white border border-[#fbeaf0] rounded-[24px] p-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#fff0f3] to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row justify-between items-start mb-8 relative z-10">
            <div>
              <p className="text-[12px] font-bold text-[#a55f78] uppercase tracking-[2px] mb-2">
                Live Cycle Status
              </p>
              <div className="flex items-baseline gap-3">
                <h2 className="text-[56px] font-extrabold text-ink leading-none tracking-tighter">
                  Day {cycleStatus.day > 0 ? cycleStatus.day : "—"}
                </h2>
                <span className="text-[16px] font-bold text-muted">
                  / {cycleStatus.dynamicCycle}
                </span>
              </div>
              <p className="text-[16px] font-bold text-[#a55f78] mt-2 flex items-center gap-2">
                <Activity className="w-5 h-5" /> {cycleStatus.phase}
              </p>
            </div>

            <div className="mt-4 sm:mt-0 text-left sm:text-right">
              <div className="inline-block bg-[#fff0f3] border border-[#f4c2c2] rounded-2xl p-4">
                <p className="text-[11px] font-bold text-[#a55f78] uppercase tracking-wider mb-1">
                  Next Moonday In
                </p>
                <p className="text-[28px] font-extrabold text-[#841617] leading-none">
                  {cycleStatus.daysUntilPeriod > 0
                    ? `${cycleStatus.daysUntilPeriod} Days`
                    : cycleStatus.daysUntilPeriod === 0
                      ? "Today"
                      : "Late"}
                </p>
              </div>
            </div>
          </div>

          {/* CYCLE TIMELINE GRAPH */}
          <div className="relative z-10 w-full">
            <div className="flex justify-between text-[10px] font-bold text-muted uppercase tracking-wider mb-2">
              <span>Menstrual</span>
              <span>Follicular</span>
              <span>Fertile</span>
              <span>Luteal</span>
            </div>

            <div className="w-full h-5 bg-slate-100 rounded-full flex overflow-hidden relative shadow-inner">
              <div
                className="h-full bg-[#d990a8] transition-all"
                style={{ width: `${menstrualWidth}%` }}
              ></div>
              <div
                className="h-full bg-slate-200 transition-all"
                style={{ width: `${follicularWidth}%` }}
              ></div>
              <div
                className="h-full bg-[#4a90e2] transition-all"
                style={{ width: `${fertileWidth}%` }}
              ></div>
              <div
                className="h-full bg-[#e3b5c4] transition-all"
                style={{ width: `${lutealWidth}%` }}
              ></div>

              {cycleStatus.day > 0 && (
                <div
                  className="absolute top-0 bottom-0 w-1.5 bg-ink shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 transition-all duration-1000 ease-out"
                  style={{ left: `calc(${progressPercentage}% - 3px)` }}
                >
                  <div className="absolute -top-6 -left-3 bg-ink text-white text-[10px] font-bold py-0.5 px-2 rounded-md whitespace-nowrap">
                    Today
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* REDESIGNED ACTION CENTER */}
        <div className="md:col-span-4 bg-white border border-[#fbeaf0] rounded-[24px] p-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col relative overflow-hidden">
          {/* Subtle accent color top bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#d990a8]"></div>

          <h3 className="text-[16px] font-bold text-ink mb-6 flex items-center gap-2 mt-2">
            <PenLine className="w-4 h-4 text-[#d990a8]" /> Today's Log
          </h3>

          {todayLog ? (
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-line pb-3">
                  <span className="text-[13px] text-muted font-medium">
                    Flow
                  </span>
                  <span className="text-[14px] font-bold text-ink">
                    {todayLog.flow || "None"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-line pb-3">
                  <span className="text-[13px] text-muted font-medium">
                    Mood
                  </span>
                  <span className="text-[14px] font-bold text-ink">
                    {todayLog.mood || "None"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-muted font-medium">
                    Symptoms
                  </span>
                  <span className="text-[14px] font-bold text-ink text-right truncate w-[150px]">
                    {todayLog.symptoms?.length > 0 ? "Recorded" : "None"}
                  </span>
                </div>
              </div>
              <Link
                href={`/log?date=${format(today, "yyyy-MM-dd")}`}
                className="mt-6 w-full py-3 border border-[#d990a8] text-[#a55f78] hover:bg-[#fff0f3] font-bold text-[13px] rounded-[14px] transition-all text-center"
              >
                Update Log
              </Link>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center">
              <div className="w-12 h-12 bg-[#fff0f3] rounded-full flex items-center justify-center mb-4 border border-[#fbeaf0]">
                <Activity className="w-5 h-5 text-[#d990a8]" />
              </div>
              <p className="text-[13px] text-muted mb-6 leading-relaxed">
                No data recorded for today. Keep your insights accurate.
              </p>
              <Link
                href={`/log?date=${format(today, "yyyy-MM-dd")}`}
                className="w-full py-3.5 bg-ink text-white hover:bg-black font-bold text-[14px] rounded-[14px] transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                Log Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* BOTTOM ROW: VITAL STATS & RECENT LOGS */}
        <div className="md:col-span-8 bg-white border border-[#fbeaf0] rounded-[24px] p-[24px] shadow-sm">
          <h3 className="text-[16px] font-bold text-ink mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#d990a8]" /> Recent History
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="p-4 bg-slate-50 border border-[#eadfe4] rounded-[16px]">
              <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                Target Ovulation
              </p>
              <p className="text-[14px] font-bold text-ink">
                {cycleStatus.ovulation
                  ? format(cycleStatus.ovulation, "MMM do")
                  : "--"}
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-[#eadfe4] rounded-[16px]">
              <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                Target Moonday
              </p>
              <p className="text-[14px] font-bold text-ink">
                {cycleStatus.nextPeriod
                  ? format(cycleStatus.nextPeriod, "MMM do")
                  : "--"}
              </p>
            </div>
            <div className="p-4 bg-[#fff0f3] border border-[#fbeaf0] rounded-[16px]">
              <p className="text-[11px] font-bold text-[#a55f78] uppercase tracking-wider mb-1">
                Avg Cycle
              </p>
              <p className="text-[14px] font-bold text-[#841617]">
                {cycleStatus.dynamicCycle} Days
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-[#eadfe4] rounded-[16px]">
              <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                Avg Moonday 
              </p>
              <p className="text-[14px] font-bold text-ink">
                {cycleStatus.periodLength} Days
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-[12px] font-bold text-muted uppercase tracking-wider mb-3">
              Past 7 Days Highlights
            </h4>
            {recentLogs.length > 0 ? (
              <div className="space-y-2">
                {recentLogs.map((log, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 border border-[#eadfe4] rounded-[12px] hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${log.flow ? "bg-[#fff0f3] text-[#d990a8]" : "bg-slate-100 text-muted"}`}
                      >
                        {log.flow ? (
                          <Droplet className="w-4 h-4 fill-current" />
                        ) : (
                          <Activity className="w-4 h-4" />
                        )}
                      </div>
                      <span className="text-[13px] font-bold text-ink">
                        {format(new Date(log.log_date), "MMM do")}
                      </span>
                    </div>
                    <div className="flex gap-4 text-[12px] text-muted">
                      {log.flow && (
                        <span className="font-medium">Flow: {log.flow}</span>
                      )}
                      {log.mood && (
                        <span className="hidden sm:inline font-medium">
                          Mood: {log.mood.split(",")[0]}
                        </span>
                      )}
                      {log.symptoms?.length > 0 && (
                        <span className="hidden sm:inline font-medium">
                          Symp: {log.symptoms.length}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-muted p-4 bg-slate-50 rounded-[12px] border border-[#eadfe4] text-center">
                No logs recorded in the past 7 days.
              </p>
            )}
          </div>
        </div>

        {/* BOTTOM ROW: NAVIGATION SHORTCUTS */}
        <div className="md:col-span-4 bg-white border border-[#fbeaf0] rounded-[24px] p-[24px] shadow-sm flex flex-col">
          <h3 className="text-[16px] font-bold text-ink mb-5 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#d990a8]" /> Quick Shortcuts
          </h3>

          <div className="grid grid-cols-2 gap-3 flex-1">
            <Link
              href="/calendar"
              className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-[#fff0f3] hover:border-[#d990a8] border border-[#eadfe4] rounded-[16px] transition-all group"
            >
              <CalendarIcon className="w-6 h-6 text-muted group-hover:text-[#a55f78] mb-2" />
              <span className="text-[12px] font-bold text-ink">Calendar</span>
            </Link>

            <Link
              href="/insights"
              className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-[#fff0f3] hover:border-[#d990a8] border border-[#eadfe4] rounded-[16px] transition-all group"
            >
              <PieChart className="w-6 h-6 text-muted group-hover:text-[#a55f78] mb-2" />
              <span className="text-[12px] font-bold text-ink">Insights</span>
            </Link>

            <Link
              href="/notes"
              className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-[#fff0f3] hover:border-[#d990a8] border border-[#eadfe4] rounded-[16px] transition-all group"
            >
              <Book className="w-6 h-6 text-muted group-hover:text-[#a55f78] mb-2" />
              <span className="text-[12px] font-bold text-ink">Notes</span>
            </Link>

            <Link
              href="/journal"
              className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-[#fff0f3] hover:border-[#d990a8] border border-[#eadfe4] rounded-[16px] transition-all group"
            >
              <Heart className="w-6 h-6 text-muted group-hover:text-[#a55f78] mb-2" />
              <span className="text-[12px] font-bold text-ink">Journal</span>
            </Link>

            <Link
              href="/reports"
              className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-[#fff0f3] hover:border-[#d990a8] border border-[#eadfe4] rounded-[16px] transition-all group col-span-2"
            >
              <FileText className="w-5 h-5 text-muted group-hover:text-[#a55f78] mb-1" />
              <span className="text-[12px] font-bold text-ink">
                Medical Reports
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
