"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { format, subDays, parseISO, differenceInDays } from "date-fns";
import { Printer, AlertCircle } from "lucide-react";

const formatSymptoms = (data: any) => {
  // Catch null, undefined, or explicitly empty stringified arrays
  if (!data || data === "[]" || data === "{}") return "-";

  // If it's a real array, check if it has items before joining
  if (Array.isArray(data)) {
    return data.length > 0 ? data.join(", ") : "-";
  }

  // If it's a string, aggressively clean it
  if (typeof data === "string") {
    let cleanString = data
      .replace(/^\[|\]$/g, "") // Remove outer brackets [ ]
      .replace(/^\{|\}$/g, "") // Remove outer curly braces { }
      .replace(/"/g, "") // Remove all quote marks
      .trim();

    return cleanString.length > 0 ? cleanString : "-";
  }

  return "-";
};

export default function MedicalReportPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ avgCycle: 0, avgDuration: 0 });
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (userProfile) setProfile(userProfile);

      // Fetch last 90 days of logs for the medical report
      const ninetyDaysAgo = format(subDays(new Date(), 90), "yyyy-MM-dd");
      const { data: recentLogs } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("log_date", ninetyDaysAgo)
        .order("log_date", { ascending: false });

      if (recentLogs) {
        setLogs(recentLogs);

        // Calculate strict metrics for the doctor
        const starts = recentLogs
          .filter((l) => l.is_period_start)
          .map((l) => l.log_date)
          .reverse();
        let cycles = [];
        for (let i = 1; i < starts.length; i++) {
          cycles.push(
            differenceInDays(parseISO(starts[i]), parseISO(starts[i - 1])),
          );
        }

        setStats({
          avgCycle:
            cycles.length > 0
              ? Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length)
              : userProfile?.cycle_length || 28,
          avgDuration: userProfile?.period_length || 5,
        });
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading)
    return (
      <div className="p-8 text-center text-muted">
        Generating medical report...
      </div>
    );

  return (
    <div className="animate-in fade-in duration-300 max-w-[800px] bg-white text-black min-h-screen p-4 md:p-8">
      {/* Non-printable header for the user */}
      <div className="print:hidden mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-line pb-6">
        <div>
          <h2 className="text-[22px] font-bold text-ink">
            Medical Appointment Report
          </h2>
          <p className="text-[13px] text-muted">
            A clean, objective summary designed for healthcare providers.
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-ink text-white rounded-[8px] text-[13px] font-bold hover:bg-black transition-all"
        >
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>
      </div>

      {/* Printable Report Content */}
      <div className="print:block">
        <div className="mb-8 border-b-2 border-black pb-4">
          <h1 className="text-[24px] font-bold uppercase tracking-wide mb-1">
            Patient Cycle History Report
          </h1>
          <p className="text-[14px]">
            Generated on: {format(new Date(), "MMMM d, yyyy")}
          </p>
          {profile?.display_name && (
            <p className="text-[14px]">Patient Name: {profile.display_name}</p>
          )}
        </div>

        <div className="flex items-start gap-3 bg-slate-50 p-4 border border-slate-200 mb-8 print:border-black print:bg-transparent">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-[12px] leading-relaxed">
            This report contains self-reported symptom and cycle data spanning
            the last 90 days. Cycle lengths are calculated strictly from
            explicitly confirmed menstrual start dates.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Cycle Averages
            </h3>
            <p className="text-[16px]">
              <b>Average Cycle Length:</b> {stats.avgCycle} days
            </p>
            <p className="text-[16px]">
              <b>Average Period Duration:</b> {stats.avgDuration} days
            </p>
          </div>
        </div>

        <h3 className="text-[16px] font-bold border-b border-slate-200 pb-2 mb-4">
          90-Day Symptom & Flow Diary
        </h3>

        {logs.length > 0 ? (
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Bleeding</th>
                <th className="py-2 pr-4">Flow/Color</th>
                <th className="py-2 pr-4">Symptoms</th>
                <th className="py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.log_date}
                  className="border-b border-slate-200 print:border-slate-300 align-top"
                >
                  <td className="py-3 pr-4 font-bold whitespace-nowrap">
                    {format(parseISO(log.log_date), "MMM d, yyyy")}
                  </td>
                  <td className="py-3 pr-4">
                    {log.is_period_start
                      ? "Start"
                      : log.is_period_end
                        ? "End"
                        : log.is_spotting
                          ? "Spotting"
                          : log.flow
                            ? "Ongoing"
                            : "-"}
                  </td>
                  <td className="py-3 pr-4 max-w-[200px]">
                    {formatSymptoms(log.symptoms)}
                  </td>
                  <td className="py-3 pr-4 max-w-[200px]">
                    {formatSymptoms(log.symptoms)}
                  </td>
                  <td className="py-3 text-slate-600 italic">
                    {log.note || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-[13px] text-slate-500">
            No logs recorded in the last 90 days.
          </p>
        )}
      </div>
    </div>
  );
}
