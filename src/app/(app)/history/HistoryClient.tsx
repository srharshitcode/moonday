"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { format } from "date-fns";
import { Loader2, Search, LayoutGrid, List } from "lucide-react";

export default function HistoryClient() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [searchTerm, setSearchTerm] = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function fetchHistory() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("log_date", { ascending: false });

      if (data) setLogs(data);
      setLoading(false);
    }
    fetchHistory();
  }, []);

  // AGGRESSIVE PARSING: Destroys stray "[]" strings and formats arrays cleanly
  const formatArrayData = (data: any) => {
    if (!data) return "—";

    let parsedData = data;

    if (typeof data === "string") {
      const trimmed = data.trim();
      // Catch exact raw empty strings
      if (trimmed === "[]" || trimmed === '["[]"]') return "—";

      if (trimmed.startsWith("[")) {
        try {
          parsedData = JSON.parse(trimmed);
        } catch (e) {
          return trimmed;
        }
      }
    }

    if (Array.isArray(parsedData)) {
      // Filter out any stray "[]" strings that got mixed in with real data
      const cleanedArray = parsedData.filter((item) => item && item !== "[]");
      if (cleanedArray.length === 0) return "—";
      return cleanedArray.join(", ");
    }

    return parsedData;
  };

  const filteredLogs = logs.filter((log) => {
    const searchStr = searchTerm.toLowerCase();
    const symptomsMatch = log.symptoms
      ? JSON.stringify(log.symptoms).toLowerCase().includes(searchStr)
      : false;
    const moodMatch = log.mood
      ? JSON.stringify(log.mood).toLowerCase().includes(searchStr)
      : false;
    const dateMatch = log.log_date.includes(searchStr);
    return symptomsMatch || moodMatch || dateMatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#d990a8]" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300 max-w-[1000px] mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-[30px]">
        <div>
          <h2 className="text-[24px] font-bold text-ink mb-1">
            History & Search
          </h2>
          <p className="text-[13px] text-muted">
            Review and filter your past logs.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search symptoms, moods..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#eadfe4] rounded-[12px] bg-white outline-none focus:border-[#d990a8] text-[13px] w-full md:w-[250px]"
            />
          </div>
          <div className="flex bg-white border border-[#eadfe4] rounded-[12px] p-1 shadow-sm">
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "cards" ? "bg-[#fff0f3] text-[#a55f78]" : "text-muted hover:text-ink"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "table" ? "bg-[#fff0f3] text-[#a55f78]" : "text-muted hover:text-ink"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="bg-white border border-[#fbeaf0] rounded-[24px] p-[40px] text-center shadow-sm">
          <p className="text-[14px] text-muted font-medium">
            No logs found matching your criteria.
          </p>
        </div>
      ) : (
        <>
          {viewMode === "cards" ? (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white border border-[#fbeaf0] rounded-[20px] p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4 border-b border-[#fbeaf0] pb-3">
                    <h3 className="text-[15px] font-bold text-ink flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#d990a8]"></span>
                      {format(new Date(log.log_date), "EEEE, MMMM d, yyyy")}
                    </h3>
                    {log.is_period_start && (
                      <span className="text-[10px] font-extrabold text-[#841617] bg-[#fff0f3] px-2 py-1 rounded-md tracking-wide">
                        Moonday Start
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-[11px] font-bold text-[#765f6b] uppercase tracking-wider mb-1">
                        Flow / Color
                      </p>
                      <p className="text-[13px] text-ink font-medium">
                        {log.flow && log.flow !== "[]" ? log.flow : "—"}
                        {log.period_color && log.period_color !== "[]"
                          ? ` / ${formatArrayData(log.period_color)}`
                          : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#765f6b] uppercase tracking-wider mb-1">
                        Moods
                      </p>
                      <p className="text-[13px] text-ink font-medium capitalize leading-relaxed">
                        {formatArrayData(log.mood)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#765f6b] uppercase tracking-wider mb-1">
                        Symptoms
                      </p>
                      <p className="text-[13px] text-ink font-medium capitalize leading-relaxed">
                        {formatArrayData(log.symptoms)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#fbeaf0] rounded-[24px] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-[#eadfe4]">
                      <th className="p-4 text-[12px] font-bold text-[#765f6b] uppercase tracking-wider">
                        Date
                      </th>
                      <th className="p-4 text-[12px] font-bold text-[#765f6b] uppercase tracking-wider">
                        Bleeding
                      </th>
                      <th className="p-4 text-[12px] font-bold text-[#765f6b] uppercase tracking-wider">
                        Flow / Color
                      </th>
                      <th className="p-4 text-[12px] font-bold text-[#765f6b] uppercase tracking-wider">
                        Symptoms
                      </th>
                      <th className="p-4 text-[12px] font-bold text-[#765f6b] uppercase tracking-wider">
                        Moods
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-[#fbeaf0] hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="p-4 text-[13px] font-bold text-ink whitespace-nowrap">
                          {format(new Date(log.log_date), "MMM d, yyyy")}
                        </td>
                        <td className="p-4 text-[13px] font-medium text-ink">
                          {log.is_period_start
                            ? "Start"
                            : log.is_period_end
                              ? "End"
                              : "—"}
                        </td>
                        <td className="p-4 text-[13px] font-medium text-ink capitalize">
                          {log.flow && log.flow !== "[]" ? log.flow : "—"}
                          {log.period_color && log.period_color !== "[]"
                            ? ` / ${formatArrayData(log.period_color)}`
                            : ""}
                        </td>
                        <td className="p-4 text-[13px] font-medium text-ink capitalize">
                          {formatArrayData(log.symptoms)}
                        </td>
                        <td className="p-4 text-[13px] font-medium text-ink capitalize">
                          {formatArrayData(log.mood)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
