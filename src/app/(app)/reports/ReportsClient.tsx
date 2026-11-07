"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Download } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [rawLogs, setRawLogs] = useState<any[]>([]);

  // Chart states
  const [cycleData, setCycleData] = useState<any[]>([]);
  const [symptomData, setSymptomData] = useState<any[]>([]);
  const [moodData, setMoodData] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: logs } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("log_date", { ascending: true });

    if (logs) {
      setRawLogs(logs);

      // 1. Cycle Length Data
      const starts = logs
        .filter((l) => l.is_period_start)
        .map((l) => l.log_date);
      const chartData = [];
      for (let i = 1; i < starts.length; i++) {
        chartData.push({
          cycle: `Cycle ${i}`,
          length: differenceInDays(
            parseISO(starts[i]),
            parseISO(starts[i - 1]),
          ),
        });
      }
      setCycleData(chartData);

      // 2. Symptom Frequency Data
      const sympCounts: Record<string, number> = {};
      const moodCounts: Record<string, number> = {};

      logs.forEach((log) => {
        if (log.symptoms && Array.isArray(log.symptoms)) {
          log.symptoms.forEach((s: string) => {
            if (s !== "None") sympCounts[s] = (sympCounts[s] || 0) + 1;
          });
        }
        if (log.mood) {
          log.mood.split(", ").forEach((m: string) => {
            if (m !== "Fine") moodCounts[m] = (moodCounts[m] || 0) + 1;
          });
        }
      });

      setSymptomData(
        Object.entries(sympCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      );
      setMoodData(
        Object.entries(moodCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      );
    }
    setLoading(false);
  };

  const handleExportCSV = () => {
    if (rawLogs.length === 0) return;
    const headers = [
      "Date",
      "Moonday Start",
      "Flow",
      "Color",
      "Moods",
      "Symptoms",
      "Cravings",
      "Notes",
    ];
    const rows = rawLogs.map((log) => [
      log.log_date,
      log.is_period_start ? "Yes" : "No",
      log.flow || "None",
      log.period_color || "None",
      `"${log.mood || ""}"`,
      `"${(log.symptoms || []).join(", ")}"`,
      `"${log.cravings || ""}"`,
      `"${log.note || ""}"`,
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((e) => e.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", "moonday_personal_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading)
    return <div className="p-8 text-center text-muted">Loading reports...</div>;

  return (
    <div className="animate-in fade-in duration-300 max-w-[900px]">
      <div className="flex items-center justify-between mb-[20px]">
        <div>
          <h2 className="text-[22px] font-bold text-ink">
            Reports & Analytics 📊
          </h2>
          <p className="text-[13px] text-muted">
            Visualize your cycle trends and export your private data.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#d990a8] text-white rounded-[12px] text-[13px] font-bold hover:brightness-95 transition-all"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
        {/* Cycle Trend */}
        <div className="bg-surface border border-line rounded-xl p-[22px] shadow-soft md:col-span-2">
          <h3 className="text-[15px] font-bold text-ink mb-6">
            Cycle Length Trend
          </h3>
          {cycleData.length >= 1 ? (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={cycleData}
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <Line
                    type="monotone"
                    dataKey="length"
                    stroke="#d990a8"
                    strokeWidth={3}
                    activeDot={{ r: 6 }}
                  />
                  <CartesianGrid
                    stroke="#f4ecef"
                    strokeDasharray="5 5"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="cycle"
                    stroke="#b6a5ad"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#b6a5ad"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #eadfe4",
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-[12px] text-muted p-8 text-center border border-dashed border-line rounded-[12px]">
              Record two moondays to see cycle trends.
            </div>
          )}
        </div>

        {/* Symptoms Chart */}
        <div className="bg-surface border border-line rounded-xl p-[22px] shadow-soft">
          <h3 className="text-[15px] font-bold text-ink mb-6">Top Symptoms</h3>
          {symptomData.length > 0 ? (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={symptomData}
                  layout="vertical"
                  margin={{ top: 0, right: 0, bottom: 0, left: 30 }}
                >
                  <CartesianGrid
                    stroke="#f4ecef"
                    strokeDasharray="3 3"
                    horizontal={false}
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#66545f"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#fff8fa" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #eadfe4",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#d990a8"
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-[12px] text-muted p-8 text-center">
              No symptoms logged yet.
            </div>
          )}
        </div>

        {/* Moods Chart */}
        <div className="bg-surface border border-line rounded-xl p-[22px] shadow-soft">
          <h3 className="text-[15px] font-bold text-ink mb-6">Top Moods</h3>
          {moodData.length > 0 ? (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={moodData}
                  layout="vertical"
                  margin={{ top: 0, right: 0, bottom: 0, left: 30 }}
                >
                  <CartesianGrid
                    stroke="#f4ecef"
                    strokeDasharray="3 3"
                    horizontal={false}
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#66545f"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#fff8fa" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #eadfe4",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#a55f78"
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-[12px] text-muted p-8 text-center">
              No moods logged yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
