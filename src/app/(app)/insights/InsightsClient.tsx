
import { connection } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { format, differenceInDays, parseISO, addDays } from "date-fns";

export default async function InsightsPage() {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch all logs ordered by date
  const { data: logs } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("log_date", { ascending: true });

  const allLogs = logs || [];

  // STRICT RULE: Only use explicitly confirmed period start dates for cycle tracking
  const periodStarts = allLogs
    .filter((l) => l.is_period_start)
    .map((l) => l.log_date);

  // --- NEW: Calculate Average Bleeding Days (Period Length) ---
  const periodLengths: number[] = [];
  let currentStart: Date | null = null;

  allLogs.forEach((log) => {
    // 1. Anchor the start date
    if (log.is_period_start) {
      currentStart = parseISO(log.log_date);
    }
    // 2. Look for the next end date. If found, calculate the gap.
    if (log.is_period_end && currentStart) {
      const end = parseISO(log.log_date);
      // Add 1 to make it inclusive (e.g. starting and ending on the same day = 1 day of bleeding)
      const length = differenceInDays(end, currentStart) + 1;

      // Basic sanity check to prevent wild database outliers (e.g. forgetting to log an end date for 45 days)
      if (length > 0 && length <= 20) {
        periodLengths.push(length);
      }
      currentStart = null; // Reset the anchor
    }
  });

  const avgPeriodLength =
    periodLengths.length > 0
      ? Math.round(
          periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length,
        )
      : "—";
  // ------------------------------------------------------------

  // Calculate average cycle lengths
  let cycleLengths: number[] = [];
  if (periodStarts.length >= 2) {
    for (let i = 1; i < periodStarts.length; i++) {
      cycleLengths.push(
        differenceInDays(
          parseISO(periodStarts[i]),
          parseISO(periodStarts[i - 1]),
        ),
      );
    }
  }

  const avgCycle =
    cycleLengths.length > 0
      ? Math.round(
          cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length,
        )
      : 28;

  const sortedCycles = [...cycleLengths].sort((a, b) => a - b);
  const shortestCycle = sortedCycles.length > 0 ? sortedCycles[0] : "—";
  const longestCycle =
    sortedCycles.length > 0 ? sortedCycles[sortedCycles.length - 1] : "—";

  // Current cycle progress
  const latestStart =
    periodStarts.length > 0 ? periodStarts[periodStarts.length - 1] : null;
  const currentCycleDay = latestStart
    ? differenceInDays(new Date(), parseISO(latestStart)) + 1
    : null;

  let estimatedPhase = "Add a confirmed Moonday start date to see an estimate.";
  let ovulationDay = avgCycle > 14 ? avgCycle - 14 : 14;
  let progressPercent = 0;

  if (currentCycleDay) {
    progressPercent = Math.min(
      100,
      Math.max(0, (currentCycleDay / avgCycle) * 100),
    );
    if (currentCycleDay < ovulationDay - 5) {
      estimatedPhase = "Follicular phase";
    } else if (
      currentCycleDay >= ovulationDay - 4 &&
      currentCycleDay <= ovulationDay + 1
    ) {
      estimatedPhase = "Around estimated fertile window";
    } else {
      estimatedPhase = "Luteal phase";
    }
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="bg-surface border border-line rounded-xl p-[22px] shadow-soft mb-[18px]">
        <h2 className="text-[17px] font-bold text-ink mb-2">
          Cycle Calculations & Insights
        </h2>
        <p className="text-[12px] text-muted leading-relaxed">
          Cycle lengths are calculated using your explicitly confirmed Moonday
          start dates. Bleeding duration is tracked using your end dates.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-[14px] mb-[18px]">
        <div className="p-[18px] bg-[#fff8fa] rounded-[15px] border border-[#fbeaf0]">
          <div className="text-[11px] text-muted font-bold uppercase tracking-wider">
            Avg Cycle
          </div>
          <strong className="text-[22px] font-bold text-ink block my-1">
            {periodStarts.length >= 2 ? `${avgCycle}d` : "—"}
          </strong>
        </div>
        <div className="p-[18px] bg-[#fff8fa] rounded-[15px] border border-[#fbeaf0]">
          <div className="text-[11px] text-[#a55f78] font-bold uppercase tracking-wider">
            Avg Bleeding
          </div>
          <strong className="text-[22px] font-bold text-[#841617] block my-1">
            {avgPeriodLength !== "—" ? `${avgPeriodLength}d` : "—"}
          </strong>
        </div>
        <div className="p-[18px] bg-[#fff8fa] rounded-[15px] border border-[#fbeaf0]">
          <div className="text-[11px] text-muted font-bold uppercase tracking-wider">
            Shortest Cycle
          </div>
          <strong className="text-[22px] font-bold text-ink block my-1">
            {shortestCycle !== "—" ? `${shortestCycle}d` : "—"}
          </strong>
        </div>
        <div className="p-[18px] bg-[#fff8fa] rounded-[15px] border border-[#fbeaf0]">
          <div className="text-[11px] text-muted font-bold uppercase tracking-wider">
            Longest Cycle
          </div>
          <strong className="text-[22px] font-bold text-ink block my-1">
            {longestCycle !== "—" ? `${longestCycle}d` : "—"}
          </strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] mb-[27px]">
        <div className="bg-surface border border-line rounded-xl p-[22px] shadow-soft">
          <h3 className="text-[14px] font-bold text-ink mb-3">
            Cycle phase estimate
          </h3>
          <div className="text-[12px] text-muted mb-3">
            {currentCycleDay ? (
              <>
                <b>Cycle day {currentCycleDay}</b>
                <br />
                Estimated phase: {estimatedPhase}
                <br />
                Estimated ovulation day: Day {ovulationDay}
              </>
            ) : (
              "Add a Moonday start date to see an estimate."
            )}
          </div>
          <div className="h-[7px] rounded-full bg-[#f4e9ed] overflow-hidden my-3">
            <div
              className="h-full bg-[#d990a8] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="text-[12px] text-muted">
            Estimates are based on historical averages, not biological
            confirmation.
          </div>
        </div>

        <div className="bg-surface border border-line rounded-xl p-[22px] shadow-soft">
          <h3 className="text-[14px] font-bold text-ink mb-3">
            Moonday History
          </h3>
          {periodStarts.length > 0 ? (
            <div className="space-y-3 max-h-[150px] overflow-y-auto pr-2">
              {periodStarts
                .slice()
                .reverse()
                .map((start) => (
                  <div
                    key={start}
                    className="py-2 border-b border-line last:border-0 flex justify-between items-center"
                  >
                    <b className="text-[13px] text-ink">
                      {format(parseISO(start), "MMMM d, yyyy")}
                    </b>
                    <span className="text-[10px] font-bold text-[#a55f78] bg-[#fff0f3] px-2 py-1 rounded-full">
                      Confirmed Start
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-[12px] text-muted">
              No confirmed starts yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
