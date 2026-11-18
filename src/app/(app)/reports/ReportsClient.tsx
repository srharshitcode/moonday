"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import CyclePhaseRing from "@/components/CyclePhaseRing";
import {
  Download,
  FileJson,
  Printer,
  Sparkles,
  Activity,
  Calendar,
  Droplet,
  Smile,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Layers,
  Filter,
  Ruler,
  Crosshair,
  Eye,
} from "lucide-react";
import { differenceInDays, parseISO, format, subDays, isAfter } from "date-fns";

type TimeRange = "all" | "180d" | "90d" | "30d";

interface CyclePoint {
  index: number;
  cycle: string;
  dateLabel: string;
  length: number;
  periodDays: number;
  sma: number;
  delta: number;
}

const DEMO_CYCLE_POINTS: CyclePoint[] = [
  {
    index: 0,
    cycle: "Cycle 1",
    dateLabel: "May 14",
    length: 27,
    periodDays: 5,
    sma: 27.0,
    delta: 0,
  },

  {
    index: 1,
    cycle: "Cycle 2",
    dateLabel: "Jun 10",
    length: 29,
    periodDays: 5,
    sma: 28.0,
    delta: 2,
  },
  
  {
    index: 2,
    cycle: "Cycle 3",
    dateLabel: "Jul 09",
    length: 28,
    periodDays: 4,
    sma: 28.0,
    delta: -1,
  },

  {
    index: 3,
    cycle: "Cycle 4",
    dateLabel: "Aug 06",
    length: 26,
    periodDays: 5,
    sma: 27.7,
    delta: -2,
  },

  {
    index: 4,
    cycle: "Cycle 5",
    dateLabel: "Sep 01",
    length: 28,
    periodDays: 5,
    sma: 27.3,
    delta: 2,
  },

  {
    index: 5,
    cycle: "Cycle 6",
    dateLabel: "Sep 29",
    length: 30,
    periodDays: 6,
    sma: 28.0,
    delta: 2,
  },

  {
    index: 6,
    cycle: "Cycle 7",
    dateLabel: "Oct 29",
    length: 27,
    periodDays: 5,
    sma: 28.3,
    delta: -3,
  },

  {
    index: 7,
    cycle: "Cycle 8",
    dateLabel: "Nov 25",
    length: 28,
    periodDays: 5,
    sma: 28.3,
    delta: 1,
  },

];

/**
 * Interactive Chart with Theme-Adaptive CSS Variables & Ruler Tool
 */

function TradingViewCycleChart({
  data,
  metric,
  targetAvg,
}: {
  data: CyclePoint[];
  metric: "cycle" | "period";
  targetAvg: number;
}) 

{
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [rulerMode, setRulerMode] = useState(true);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measureStart, setMeasureStart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [measureEnd, setMeasureEnd] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [showSma, setShowSma] = useState(true);

  const W = 760;
  const H = 295;
  const PAD = { top: 30, right: 58, bottom: 38, left: 44 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const values = data.map((d) =>
    metric === "cycle" ? d.length : d.periodDays,
  );
  
  const rawMin = Math.min(...values, metric === "cycle" ? 20 : 2);
  const rawMax = Math.max(...values, metric === "cycle" ? 32 : 8);
  const yMin = Math.max(0, Math.floor(rawMin - 3));
  const yMax = Math.ceil(rawMax + 3);

  const xForIndex = (idx: number) => {
    if (data.length <= 1) return PAD.left + plotW / 2;
    return PAD.left + (idx / (data.length - 1)) * plotW;
  };

  const yForValue = (val: number) => {
    const ratio = (val - yMin) / Math.max(1, yMax - yMin);
    return PAD.top + plotH - ratio * plotH;
  };

  const valueForY = (yPx: number) => {
    const clampedY = Math.max(PAD.top, Math.min(PAD.top + plotH, yPx));
    const ratio = (PAD.top + plotH - clampedY) / plotH;
    return yMin + ratio * (yMax - yMin);
  };

  const floatIndexForX = (xPx: number) => {
    if (data.length <= 1) return 0;
    const clampedX = Math.max(PAD.left, Math.min(PAD.left + plotW, xPx));
    return ((clampedX - PAD.left) / plotW) * (data.length - 1);
  };

  const interpolatedValueAtX = (xPx: number) => {
    if (data.length === 0) return 0;
    if (data.length === 1) return values[0];
    const fIdx = floatIndexForX(xPx);
    const i0 = Math.max(0, Math.min(data.length - 1, Math.floor(fIdx)));
    const i1 = Math.max(0, Math.min(data.length - 1, Math.ceil(fIdx)));
    const t = fIdx - i0;
    return values[i0] + (values[i1] - values[i0]) * t;
  };

  const points = data.map((d, i) => {
    const val = metric === "cycle" ? d.length : d.periodDays;
    return {
      ...d,
      val,
      x: xForIndex(i),
      y: yForValue(val),
      smaY: yForValue(d.sma),
    };
  });


  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(
          PAD.top + plotH
        ).toFixed(1)} L ${points[0].x.toFixed(1)} ${(PAD.top + plotH).toFixed(
          1,
        )} Z`
      : "";

  const smaPath = points
    .map(
      (p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.smaY.toFixed(1)}`,
    )
    .join(" ");

  const toSvgCoords = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return { x: PAD.left, y: PAD.top };
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    return {
      x: Math.max(
        PAD.left,
        Math.min(PAD.left + plotW, (e.clientX - rect.left) * scaleX),
      ),
      y: Math.max(
        PAD.top,
        Math.min(PAD.top + plotH, (e.clientY - rect.top) * scaleY),
      ),
    };
  };


  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!rulerMode) return;
    const pt = toSvgCoords(e);
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsMeasuring(true);
    setMeasureStart(pt);
    setMeasureEnd(pt);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = toSvgCoords(e);
    setCursor(pt);
    if (isMeasuring) {
      setMeasureEnd(pt);
    }
  };


  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isMeasuring) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      setIsMeasuring(false);
      if (
        measureStart &&
        measureEnd &&
        Math.abs(measureEnd.x - measureStart.x) < 6
      ) {
        setMeasureStart(null);
        setMeasureEnd(null);
      }
    }
  };


  const hoveredFloatIdx = cursor ? floatIndexForX(cursor.x) : data.length - 1;
  const nearestIdx = Math.max(
    0,
    Math.min(data.length - 1, Math.round(hoveredFloatIdx)),
  );
  const activePoint = points[nearestIdx] || points[points.length - 1];
  const liveInterpolatedVal = cursor
    ? interpolatedValueAtX(cursor.x)
    : activePoint?.val || 0;
  const liveCurveY = yForValue(liveInterpolatedVal);

  const rulerStats = useMemo(() => {
    if (!measureStart || !measureEnd) return null;
    if (Math.abs(measureEnd.x - measureStart.x) < 6) return null;

    const v1 = interpolatedValueAtX(measureStart.x);
    const v2 = interpolatedValueAtX(measureEnd.x);
    const diff = v2 - v1;
    const pct = v1 !== 0 ? (diff / v1) * 100 : 0;

    const idx1 = floatIndexForX(measureStart.x);
    const idx2 = floatIndexForX(measureEnd.x);
    const cycleSpan = Math.abs(idx2 - idx1);

    return {
      v1: v1.toFixed(1),
      v2: v2.toFixed(1),
      diff: (diff >= 0 ? "+" : "") + diff.toFixed(1),
      pct: (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%",
      cycleSpan: cycleSpan.toFixed(1),
      isPositive: diff >= 0,
      boxLeft: Math.min(measureStart.x, measureEnd.x),
      boxWidth: Math.abs(measureEnd.x - measureStart.x),
      y1: yForValue(v1),
      y2: yForValue(v2),
    };
  }, [measureStart, measureEnd, data, metric]);

  const yTicks = useMemo(() => {
    const step = Math.max(1, Math.round((yMax - yMin) / 4));
    const arr: number[] = [];
    for (let v = yMin; v <= yMax; v += step) arr.push(v);
    return arr;
  }, [yMin, yMax]);


  return (

    <div className="select-none">

      {/* Top Telemetry & Tool Bar */}

      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 mb-3 rounded-xl bg-[#fcf9fa] border border-line text-[11px]">
        <div className="flex flex-wrap items-center gap-3 tabular-nums">
          <span className="font-extrabold text-ink flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-[#d990a8]" />
            {activePoint?.cycle} ({activePoint?.dateLabel})
          </span>
          <span className="text-muted">
            VAL:{" "}
            <strong className="text-[#a55f78]">
              {liveInterpolatedVal.toFixed(1)}d
            </strong>
          </span>
          <span className="text-muted">
            NODE: <strong className="text-ink">{activePoint?.val}d</strong>
          </span>
          {metric === "cycle" && (
            <span className="text-muted">
              SMA(3):{" "}
              <strong className="text-[#a78bfa]">
                {activePoint?.sma.toFixed(1)}d
              </strong>
            </span>
          )}
          <span className="text-muted">
            Δ PREV:{" "}
            <strong
              className={
                (activePoint?.delta || 0) >= 0
                  ? "text-emerald-500"
                  : "text-rose-400"
              }
            >
              {(activePoint?.delta || 0) >= 0
                ? `+${activePoint?.delta}d`
                : `${activePoint?.delta}d`}
            </strong>
          </span>
        </div>


        <div className="flex items-center gap-1.5">
          {metric === "cycle" && (
            <button
              type="button"
              onClick={() => setShowSma((p) => !p)}
              className={`px-2.5 py-1 rounded-lg font-bold text-[10.5px] border transition-all cursor-pointer ${
                showSma
                  ? "bg-[#fff0f3] text-[#a55f78] border-[#f4c2c2]"
                  : "bg-white text-muted border-line"
              }`}
            >
              SMA(3)
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setRulerMode((p) => !p);
              setMeasureStart(null);
              setMeasureEnd(null);
            }}
            title="Drag across the chart to measure day & percentage change"
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[10.5px] border transition-all cursor-pointer ${
              rulerMode
                ? "bg-[#fff0f3] text-[#a55f78] border-[#f4c2c2]"
                : "bg-white text-muted border-line"
            }`}
          >
            <Ruler className="w-3 h-3" />
            <span>{rulerMode ? "Drag to Measure: ON" : "Ruler: OFF"}</span>
          </button>
          {rulerStats && (
            <button
              type="button"
              onClick={() => {
                setMeasureStart(null);
                setMeasureEnd(null);
              }}
              className="px-2 py-1 rounded-lg bg-white border border-line text-[10px] font-bold text-muted hover:text-ink cursor-pointer"
            >
              Clear Ruler
            </button>
          )}
        </div>
      </div>

      {/* High-Contrast Theme-Adaptive Canvas */}

      <div className="relative w-full overflow-hidden rounded-xl border border-line bg-background shadow-inner">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => {
            if (!isMeasuring) setCursor(null);
          }}
          className="w-full h-[275px] sm:h-[295px] block cursor-crosshair touch-none"
        >
          <defs>
            <linearGradient id="tvRoseArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d990a8" stopOpacity="0.36" />
              <stop offset="100%" stopColor="#d990a8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines & High-Contrast Y-Axis Labels */}


          {yTicks.map((tick) => {
            const y = yForValue(tick);
            return (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  y1={y}
                  x2={PAD.left + plotW}
                  y2={y}
                  style={{ stroke: "var(--line)" }}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={PAD.left - 10}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize="11"
                  fontWeight="700"
                  style={{ fill: "var(--muted)" }}
                >
                  {tick}d
                </text>
              </g>
            );
          })}

          {/* Vertical Grid Lines & High-Contrast X-Axis Labels */}


          {points.map((pt) => (
            <g key={pt.cycle}>
              <line
                x1={pt.x}
                y1={PAD.top}
                x2={pt.x}
                y2={PAD.top + plotH}
                style={{ stroke: "var(--line)" }}
                strokeWidth="1"
                strokeOpacity="0.65"
              />
              <text
                x={pt.x}
                y={H - 12}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                style={{ fill: "var(--muted)" }}
              >
                {pt.cycle}
              </text>
            </g>
          ))}

          {/* Target Average Baseline */}

          {metric === "cycle" && targetAvg >= yMin && targetAvg <= yMax && (
            <g>
              <line
                x1={PAD.left}
                y1={yForValue(targetAvg)}
                x2={PAD.left + plotW}
                y2={yForValue(targetAvg)}
                stroke="#d990a8"
                strokeWidth="1.2"
                strokeDasharray="5 4"
                strokeOpacity="0.75"
              />
              <rect
                x={PAD.left + plotW + 4}
                y={yForValue(targetAvg) - 9}
                width="48"
                height="18"
                rx="4"
                fill="#a55f78"
              />
              <text
                x={PAD.left + plotW + 28}
                y={yForValue(targetAvg) + 3.5}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="800"
                fill="#ffffff"
              >
                Avg {targetAvg}d
              </text>
            </g>
          )}

          {/* Area & Connected Trend Line */}

          {areaPath && <path d={areaPath} fill="url(#tvRoseArea)" />}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#d990a8"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* 3-Cycle SMA Overlay Line */}

          {metric === "cycle" && showSma && points.length >= 2 && (
            <path
              d={smaPath}
              fill="none"
              stroke="#a78bfa"
              strokeWidth="2"
              strokeDasharray="5 3"
              strokeLinecap="round"
            />
          )}


          {/* Connected Cycle Nodes & High-Contrast Value Badges */}


          {points.map((pt) => (
            <g key={pt.index}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="5.5"
                style={{ fill: "var(--surface)" }}
                stroke="#d990a8"
                strokeWidth="2.5"
              />
              <rect
                x={pt.x - 15}
                y={pt.y - 24}
                width="30"
                height="15"
                rx="4"
                style={{ fill: "var(--surface)", stroke: "var(--line)" }}
                strokeWidth="1"
              />
              <text
                x={pt.x}
                y={pt.y - 13.5}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="800"
                style={{ fill: "var(--ink)" }}
              >
                {pt.val}d
              </text>
            </g>
          ))}

          {/*Click-and-Drag Measurement Ruler Box */}


          {rulerStats && measureStart && measureEnd && (
            <g>
              <rect
                x={rulerStats.boxLeft}
                y={PAD.top}
                width={rulerStats.boxWidth}
                height={plotH}
                fill={rulerStats.isPositive ? "#10b981" : "#f43f5e"}
                fillOpacity="0.15"
                stroke={rulerStats.isPositive ? "#10b981" : "#f43f5e"}
                strokeWidth="1.2"
                strokeDasharray="4 3"
              />
              <line
                x1={measureStart.x}
                y1={rulerStats.y1}
                x2={measureEnd.x}
                y2={rulerStats.y2}
                stroke={rulerStats.isPositive ? "#10b981" : "#f43f5e"}
                strokeWidth="2"
              />
              <circle
                cx={measureStart.x}
                cy={rulerStats.y1}
                r="4.5"
                fill={rulerStats.isPositive ? "#10b981" : "#f43f5e"}
              />
              <circle
                cx={measureEnd.x}
                cy={rulerStats.y2}
                r="4.5"
                fill={rulerStats.isPositive ? "#10b981" : "#f43f5e"}
              />

              <g
                transform={`translate(${Math.min(
                  W - 190,
                  Math.max(
                    PAD.left + 8,
                    rulerStats.boxLeft + rulerStats.boxWidth / 2 - 84,
                  ),
                )}, ${PAD.top + 10})`}
              >
                <rect
                  width="168"
                  height="42"
                  rx="8"
                  fill="#1e181c"
                  stroke={rulerStats.isPositive ? "#10b981" : "#f43f5e"}
                  strokeWidth="1.5"
                />
                <text
                  x="84"
                  y="17"
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="800"
                  fill="#ffffff"
                >
                  {rulerStats.diff}d ({rulerStats.pct})
                </text>
                <text
                  x="84"
                  y="32"
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="600"
                  fill="#e2e8f0"
                >
                  {rulerStats.v1}d → {rulerStats.v2}d • Span:{" "}
                  {rulerStats.cycleSpan} cyc
                </text>
              </g>
            </g>
          )}

          {/* Continuous View Crosshair */}

          {cursor && (
            <g className="pointer-events-none">
              <line
                x1={cursor.x}
                y1={PAD.top}
                x2={cursor.x}
                y2={PAD.top + plotH}
                stroke="#d990a8"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
              <line
                x1={PAD.left}
                y1={cursor.y}
                x2={PAD.left + plotW}
                y2={cursor.y}
                stroke="#d990a8"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />

              <circle
                cx={cursor.x}
                cy={liveCurveY}
                r="6"
                fill="#d990a8"
                stroke="#ffffff"
                strokeWidth="2"
              />

              <rect
                x={PAD.left + plotW + 4}
                y={cursor.y - 10}
                width="48"
                height="20"
                rx="4"
                fill="#d990a8"
              />
              <text
                x={PAD.left + plotW + 28}
                y={cursor.y + 3.5}
                textAnchor="middle"
                fontSize="10"
                fontWeight="800"
                fill="#141013"
              >
                {valueForY(cursor.y).toFixed(1)}d
              </text>

              <rect
                x={cursor.x - 38}
                y={PAD.top + plotH + 4}
                width="76"
                height="19"
                rx="4"
                fill="#d990a8"
              />
              <text
                x={cursor.x}
                y={PAD.top + plotH + 17}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="800"
                fill="#141013"
              >
                {activePoint?.cycle} ({liveInterpolatedVal.toFixed(1)}d)
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}



export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [rawLogs, setRawLogs] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [chartMetric, setChartMetric] = useState<"cycle" | "period">("cycle");
  const [useDemoPreview, setUseDemoPreview] = useState(false);

  const [ringMetrics, setRingMetrics] = useState({
    currentCycleDay: 14,
    avgCycleLength: 28,
    avgPeriodLength: 5,
    lastPeriodStart: "Nov 4, 2026",
  });

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const [{ data: profile }, { data: logs }] = await Promise.all([
      supabase
        .from("profiles")
        .select("cycle_length, period_length")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("log_date", { ascending: true }),
    ]);

    const baseCycleLen = Number(profile?.cycle_length) || 28;
    const basePeriodLen = Number(profile?.period_length) || 5;

    if (logs && logs.length > 0) {
      setRawLogs(logs);

      const startLogs = logs.filter((l) => l.is_period_start);
      let computedAvgCycle = baseCycleLen;

      if (startLogs.length >= 2) {
        let total = 0;
        let validCount = 0;
        for (let i = 1; i < startLogs.length; i++) {
          const diff = differenceInDays(
            parseISO(startLogs[i].log_date),
            parseISO(startLogs[i - 1].log_date),
          );
          if (diff >= 15 && diff <= 60) {
            total += diff;
            validCount++;
          }
        }
        if (validCount > 0) {
          computedAvgCycle = Math.round(total / validCount);
        }
      }


      if (startLogs.length > 0) {
        const latestStartStr = startLogs[startLogs.length - 1].log_date;
        const latestStartDate = parseISO(latestStartStr);
        const rawDiff = differenceInDays(new Date(), latestStartDate) + 1;
        const clampedDay =
          rawDiff > 0 && rawDiff <= computedAvgCycle ? rawDiff : 14;

        setRingMetrics({
          currentCycleDay: clampedDay,
          avgCycleLength: computedAvgCycle,
          avgPeriodLength: basePeriodLen,
          lastPeriodStart: format(latestStartDate, "MMM d, yyyy"),
        });
      }
    }

    setLoading(false);
  };

  const filteredLogs = useMemo(() => {
    if (timeRange === "all") return rawLogs;
    const daysMap: Record<Exclude<TimeRange, "all">, number> = {
      "180d": 180,
      "90d": 90,
      "30d": 30,
    };
    const cutoff = subDays(new Date(), daysMap[timeRange]);
    return rawLogs.filter((l) => {
      try {
        return isAfter(parseISO(l.log_date), cutoff);
      } catch {
        return true;
      }
    });
  }, [rawLogs, timeRange]);


  const cycleData = useMemo<CyclePoint[]>(() => {
    if (useDemoPreview) return DEMO_CYCLE_POINTS;

    const starts = filteredLogs
      .filter((l) => l.is_period_start)
      .map((l) => l.log_date);

    const rawSeries: Array<{
      cycle: string;
      dateLabel: string;
      length: number;
      periodDays: number;
    }> = [];

    for (let i = 1; i < starts.length; i++) {
      const startCurr = parseISO(starts[i]);
      const startPrev = parseISO(starts[i - 1]);
      const len = differenceInDays(startCurr, startPrev);

      const logsInWindow = filteredLogs.filter(
        (l) => l.log_date >= starts[i - 1] && l.log_date < starts[i],
      );
      const bleedingDays =
        logsInWindow.filter(
          (l) =>
            l.is_period_start ||
            l.is_period_end ||
            (l.flow && l.flow !== "No bleeding" && l.flow !== "None"),
        ).length || ringMetrics.avgPeriodLength;

      rawSeries.push({
        cycle: `Cycle ${i}`,
        dateLabel: format(startPrev, "MMM d"),
        length: len,
        periodDays: bleedingDays,
      });
    }


    return rawSeries.map((item, idx) => {
      const windowSlice = rawSeries.slice(Math.max(0, idx - 2), idx + 1);
      const sma =
        windowSlice.reduce((acc, c) => acc + c.length, 0) / windowSlice.length;
      const delta = idx > 0 ? item.length - rawSeries[idx - 1].length : 0;
      return {
        index: idx,
        ...item,
        sma: Math.round(sma * 10) / 10,
        delta,
      };
    });
  }, [filteredLogs, ringMetrics.avgPeriodLength, useDemoPreview]);

  const analytics = useMemo(() => {
    const sympCounts: Record<string, number> = {};
    const moodCounts: Record<string, number> = {};
    const flowCounts: Record<string, number> = {
      "Very heavy": 0,
      Heavy: 0,
      Medium: 0,
      Low: 0,
      Spotting: 0,
    };

    const phaseSymptoms: Record<
      "Menstrual" | "Follicular" | "Ovulatory" | "Luteal",
      Record<string, number>
    > = {
      Menstrual: {},
      Follicular: {},
      Ovulatory: {},
      Luteal: {},
    };

    const starts = rawLogs
      .filter((l) => l.is_period_start)
      .map((l) => parseISO(l.log_date));

    filteredLogs.forEach((log) => {
      if (log.is_spotting || log.flow === "Spotting") {
        flowCounts.Spotting += 1;
      } else if (log.flow && flowCounts[log.flow] !== undefined) {
        flowCounts[log.flow] += 1;
      }

      let phaseKey: "Menstrual" | "Follicular" | "Ovulatory" | "Luteal" =
        "Follicular";
      if (
        log.is_period_start ||
        (log.flow && log.flow !== "No bleeding" && log.flow !== "None")
      ) {
        phaseKey = "Menstrual";
      } else if (starts.length > 0) {
        const logDate = parseISO(log.log_date);
        const priorStarts = starts.filter((s) => s <= logDate);
        if (priorStarts.length > 0) {
          const lastStart = priorStarts[priorStarts.length - 1];
          const cd = differenceInDays(logDate, lastStart) + 1;
          if (cd <= ringMetrics.avgPeriodLength) phaseKey = "Menstrual";
          else if (cd <= 11) phaseKey = "Follicular";
          else if (cd <= 16) phaseKey = "Ovulatory";
          else phaseKey = "Luteal";
        }
      }

      const sympList = Array.isArray(log.symptoms)
        ? log.symptoms
        : typeof log.symptoms === "string"
          ? log.symptoms.split(",").map((s: string) => s.trim())
          : [];

      sympList.forEach((s: string) => {
        if (s && s !== "None") {
          sympCounts[s] = (sympCounts[s] || 0) + 1;
          phaseSymptoms[phaseKey][s] = (phaseSymptoms[phaseKey][s] || 0) + 1;
        }
      });

      if (log.mood) {
        log.mood.split(", ").forEach((m: string) => {
          if (m && m !== "Fine") {
            moodCounts[m] = (moodCounts[m] || 0) + 1;
          }
        });
      }
    });


    const totalSymptomMentions =
      Object.values(sympCounts).reduce((a, b) => a + b, 0) || 1;
    const totalMoodMentions =
      Object.values(moodCounts).reduce((a, b) => a + b, 0) || 1;

    const topSymptoms = Object.entries(sympCounts)
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / totalSymptomMentions) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const topMoods = Object.entries(moodCounts)
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / totalMoodMentions) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const totalFlowDays =
      Object.values(flowCounts).reduce((a, b) => a + b, 0) || 1;
    const flowDistribution = Object.entries(flowCounts).map(
      ([label, count]) => ({
        label,
        count,
        pct: Math.round((count / totalFlowDays) * 100),
      }),
    );


    const phaseTopSymptom = (
      ["Menstrual", "Follicular", "Ovulatory", "Luteal"] as const
    ).map((phase) => {
      const entries = Object.entries(phaseSymptoms[phase]).sort(
        (a, b) => b[1] - a[1],
      );
      return {
        phase,
        topSymptom: entries[0]?.[0] || "No dominant symptom",
        occurrences: entries[0]?.[1] || 0,
      };
    });

    let cycleVariation = 0;
    let minCycle = ringMetrics.avgCycleLength;
    let maxCycle = ringMetrics.avgCycleLength;
    if (cycleData.length >= 2) {
      const lengths = cycleData.map((c) => c.length);
      minCycle = Math.min(...lengths);
      maxCycle = Math.max(...lengths);
      const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance =
        lengths.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        lengths.length;
      cycleVariation = Math.round(Math.sqrt(variance) * 10) / 10;
    }


    return {
      topSymptoms,
      topMoods,
      flowDistribution,
      phaseTopSymptom,
      cycleVariation,
      minCycle,
      maxCycle,
      isRegular: cycleVariation <= 4,
    };
  }, [filteredLogs, rawLogs, cycleData, ringMetrics]);


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
      `"${(Array.isArray(log.symptoms) ? log.symptoms : []).join(", ")}"`,
      `"${log.cravings || ""}"`,
      `"${(log.note || "").replace(/<[^>]*>/g, " ").replace(/"/g, '""')}"`,
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((e) => e.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute(
      "download",
      `moonday_analytics_${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const handleExportJSON = () => {
    if (rawLogs.length === 0) return;
    const payload = {
      exportedAt: new Date().toISOString(),
      summary: ringMetrics,
      totalLogs: rawLogs.length,
      logs: rawLogs,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute(
      "download",
      `moonday_analytics_${format(new Date(), "yyyy-MM-dd")}.json`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto space-y-5 animate-pulse">
        <div className="h-16 bg-white rounded-2xl border border-line" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-28 bg-white rounded-2xl border border-line"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300 max-w-[1440px] mx-auto pb-14 text-ink">

      {/* 1. EXECUTIVE ANALYTICS HEADER & ACTION BAR */}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#a55f78] mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#d990a8]" />
            <span>Longitudinal Cycle Intelligence & Biomarkers</span>
          </div>
          <h2 className="text-[24px] sm:text-[28px] font-extrabold text-ink tracking-tight leading-tight">
            Reports & Analytics 📊
          </h2>
          <p className="text-[13px] text-muted mt-0.5">
            Measure cycle-to-cycle intervals with the TradingView crosshair
            ruler and scrub your live orbital phase ring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center bg-white border border-line rounded-xl p-1 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-muted ml-2 mr-1" />
            {(
              [
                { id: "all", label: "All Time" },
                { id: "180d", label: "6M" },
                { id: "90d", label: "90D" },
                { id: "30d", label: "30D" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTimeRange(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  timeRange === tab.id
                    ? "bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2]"
                    : "text-muted hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-line text-[#66545f] hover:text-ink hover:border-[#d990a8] rounded-xl text-[12px] font-bold transition-all shadow-2xs cursor-pointer print:hidden"
          >
            <Printer className="w-3.5 h-3.5 text-[#a55f78]" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-line text-[#66545f] hover:text-ink hover:border-[#d990a8] rounded-xl text-[12px] font-bold transition-all shadow-2xs cursor-pointer print:hidden"
          >
            <FileJson className="w-3.5 h-3.5 text-[#a55f78]" />
            <span className="hidden sm:inline">JSON</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#d990a8] text-white rounded-xl text-[12.5px] font-bold hover:brightness-95 transition-all shadow-[0_6px_18px_-6px_rgba(217,144,168,0.65)] active:scale-[0.98] cursor-pointer print:hidden"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. TOP CLINICAL KPI BENTO STRIP */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-line rounded-2xl p-4 sm:p-5 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Avg Cycle Length
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                analytics.isRegular
                  ? "bg-[#fff0f3] text-[#a55f78] border-[#f4c2c2]"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {analytics.isRegular ? (
                <>
                  <CheckCircle2 className="w-3 h-3" /> Regular
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3" /> Variable
                </>
              )}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-extrabold text-ink tabular-nums leading-none">
              {ringMetrics.avgCycleLength}
            </span>
            <span className="text-[13px] font-bold text-muted">days</span>
          </div>
          <p className="text-[11px] text-muted mt-2">
            Clinical reference norm: 21–35 days
          </p>
        </div>

        <div className="bg-white border border-line rounded-2xl p-4 sm:p-5 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Cycle Regularity
            </span>
            <Activity className="w-4 h-4 text-[#d990a8]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-extrabold text-ink tabular-nums leading-none">
              ±{analytics.cycleVariation}
            </span>
            <span className="text-[13px] font-bold text-muted">days SD</span>
          </div>
          <p className="text-[11px] text-muted mt-2 tabular-nums">
            Range: {analytics.minCycle}d shortest • {analytics.maxCycle}d
            longest
          </p>
        </div>

        <div className="bg-white border border-line rounded-2xl p-4 sm:p-5 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Avg Moonday Bleed
            </span>
            <Droplet className="w-4 h-4 text-[#d990a8]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-extrabold text-ink tabular-nums leading-none">
              {ringMetrics.avgPeriodLength}
            </span>
            <span className="text-[13px] font-bold text-muted">days</span>
          </div>
          <p className="text-[11px] text-muted mt-2">
            LMP started {ringMetrics.lastPeriodStart}
          </p>
        </div>

        <div className="bg-white border border-line rounded-2xl p-4 sm:p-5 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Logged Check-Ins
            </span>
            <Calendar className="w-4 h-4 text-[#d990a8]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-extrabold text-ink tabular-nums leading-none">
              {filteredLogs.length}
            </span>
            <span className="text-[13px] font-bold text-muted">entries</span>
          </div>
          <p className="text-[11px] text-muted mt-2">
            Top mood: {analytics.topMoods[0]?.name || "Calm"}
          </p>
        </div>
      </div>

      {/* 3. MAIN 12-COLUMN SPLIT*/}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 space-y-6">
          <div className="bg-white border border-line rounded-2xl p-5 sm:p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-[16px] font-bold text-ink flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#a55f78]" />
                  <span>
                    {chartMetric === "cycle"
                      ? "Cycle Length Trend (Interactive Ruler)"
                      : "Moonday Bleeding Duration Trend"}
                  </span>
                </h3>
                <p className="text-[12px] text-muted mt-0.5">
                  Hover for crosshair coordinates • Click and drag across the
                  curve to measure interval delta
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUseDemoPreview((p) => !p)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                    useDemoPreview
                      ? "bg-[#fff0f3] text-[#a55f78] border-[#f4c2c2]"
                      : "bg-[#fcf9fa] text-muted border-line hover:text-ink"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>
                    {useDemoPreview ? "8-Cycle Demo: ON" : "8-Cycle Demo"}
                  </span>
                </button>

                <div className="inline-flex bg-[#fcf9fa] border border-line rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setChartMetric("cycle")}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      chartMetric === "cycle"
                        ? "bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2]"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    Cycle Length
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMetric("period")}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      chartMetric === "period"
                        ? "bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2]"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    Bleed Days
                  </button>
                </div>
              </div>
            </div>

            {cycleData.length >= 1 ? (
              <TradingViewCycleChart
                data={cycleData}
                metric={chartMetric}
                targetAvg={ringMetrics.avgCycleLength}
              />
            ) : (
              <div className="text-[12.5px] text-muted p-10 text-center border border-dashed border-line rounded-2xl bg-[#fcf9fa] space-y-3">
                <p>
                  Record at least two Moonday start dates to unlock your live
                  cycle trend curve.
                </p>
                <button
                  type="button"
                  onClick={() => setUseDemoPreview(true)}
                  className="px-4 py-2 rounded-xl bg-[#d990a8] text-white text-[12px] font-bold cursor-pointer"
                >
                  Preview 8-Cycle TradingView Ruler Demo
                </button>
              </div>
            )}
          </div>

          {/* Top Symptoms & Top Moods Dual Grid */}


          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-line rounded-2xl p-5 sm:p-6 shadow-soft flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[15px] font-bold text-ink flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#d990a8]" />
                    <span>Top Physical Symptoms</span>
                  </h3>
                  <span className="text-[11px] font-bold text-muted">
                    Frequency
                  </span>
                </div>

                {analytics.topSymptoms.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topSymptoms.map((item) => (
                      <div key={item.name} className="space-y-1">
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="font-bold text-ink truncate">
                            {item.name}
                          </span>
                          <span className="text-[11px] font-bold text-[#a55f78] tabular-nums">
                            {item.count}d ({item.pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-[#fcf9fa] border border-line/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#d990a8] to-[#a55f78] rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(12, item.pct)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[12px] text-muted py-12 text-center bg-[#fcf9fa] rounded-xl border border-dashed border-line">
                    No physical symptoms logged in this window yet.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-line rounded-2xl p-5 sm:p-6 shadow-soft flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[15px] font-bold text-ink flex items-center gap-2">
                    <Smile className="w-4 h-4 text-[#a55f78]" />
                    <span>Top Moods & Feelings</span>
                  </h3>
                  <span className="text-[11px] font-bold text-muted">
                    Share
                  </span>
                </div>

                {analytics.topMoods.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topMoods.map((item) => (
                      <div key={item.name} className="space-y-1">
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="font-bold text-ink truncate">
                            {item.name}
                          </span>
                          <span className="text-[11px] font-bold text-[#a55f78] tabular-nums">
                            {item.count}d ({item.pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-[#fcf9fa] border border-line/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#a55f78] rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(12, item.pct)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[12px] text-muted py-12 text-center bg-[#fcf9fa] rounded-xl border border-dashed border-line">
                    No moods logged in this window yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Flow Intensity Breakdown & Phase-Symptom Correlation Matrix */}


          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-line rounded-2xl p-5 sm:p-6 shadow-soft">
              <h3 className="text-[15px] font-bold text-ink flex items-center gap-2 mb-1">
                <Droplet className="w-4 h-4 text-[#d990a8]" />
                <span>Flow Volume Distribution</span>
              </h3>
              <p className="text-[11.5px] text-muted mb-4">
                Proportion of logged bleeding days by intensity
              </p>

              <div className="space-y-2.5">
                {analytics.flowDistribution.map((f) => (
                  <div
                    key={f.label}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#fcf9fa] border border-line/80 text-[12px]"
                  >
                    <span className="font-bold text-ink">{f.label}</span>
                    <div className="flex items-center gap-2.5">
                      <div className="w-24 h-2 bg-white border border-line rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#d990a8] rounded-full"
                          style={{ width: `${f.pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-[#a55f78] tabular-nums min-w-[48px] text-right">
                        {f.count}d ({f.pct}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-line rounded-2xl p-5 sm:p-6 shadow-soft">
              <h3 className="text-[15px] font-bold text-ink flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-[#a55f78]" />
                <span>Phase-Symptom Correlation</span>
              </h3>
              <p className="text-[11.5px] text-muted mb-4">
                Most frequent physical pattern detected per cycle phase
              </p>

              <div className="space-y-2.5">
                {analytics.phaseTopSymptom.map((row) => (
                  <div
                    key={row.phase}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#fcf9fa] border border-line/80 text-[12px]"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#a55f78] block">
                        {row.phase} Phase
                      </span>
                      <span className="font-bold text-ink">
                        {row.topSymptom}
                      </span>
                    </div>
                    {row.occurrences > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2] tabular-nums">
                        {row.occurrences}x logged
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT 5 COLUMNS: INTERACTIVE DRAGGABLE <CyclePhaseRing /> */}

        
        <div className="xl:col-span-5 xl:sticky xl:top-24 space-y-5">
          <CyclePhaseRing
            currentCycleDay={ringMetrics.currentCycleDay}
            avgCycleLength={ringMetrics.avgCycleLength}
            avgPeriodLength={ringMetrics.avgPeriodLength}
            lastPeriodStart={ringMetrics.lastPeriodStart}
            compact={true}
          />
        </div>
      </div>
    </div>
  );
}
