"use client";

import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Sparkles, ChevronLeft, ChevronRight, Hand } from "lucide-react";

export interface CyclePhaseRingProps {
  currentCycleDay: number;
  avgCycleLength?: number;
  avgPeriodLength?: number;
  lastPeriodStart?: string | null;
  compact?: boolean;
  onSelectDay?: (cycleDay: number) => void;
}

interface PhaseMetadata {
  id: "menstrual" | "follicular" | "ovulatory" | "luteal";
  name: string;
  seasonLabel: string;
  colorHex: string;
  bgTintHex: string;
  borderHex: string;
  hormoneSummary: string;
  bodyAndMindGuidance: string;
  nutritionFocus: string;
}

const PHASE_DETAILS: Record<PhaseMetadata["id"], PhaseMetadata> = {
  menstrual: {
    id: "menstrual",
    name: "Menstrual Phase",
    seasonLabel: "Inner Winter • Rest & Release",
    colorHex: "#D96B8A",
    bgTintHex: "#FFF0F3",
    borderHex: "#F4C2C2",
    hormoneSummary:
      "Estrogen and progesterone are at their lowest baseline levels as the uterine lining sheds.",
    bodyAndMindGuidance:
      "Energy and social battery naturally dip. Prioritize restorative sleep, gentle warmth, and low-impact stretching.",
    nutritionFocus:
      "Iron-rich foods (lentils, spinach, dark chocolate) paired with Vitamin C and warm herbal teas.",
  },

  follicular: {
    id: "follicular",
    name: "Follicular Phase",
    seasonLabel: "Inner Spring • Renewal & Focus",
    colorHex: "#5B9BD5",
    bgTintHex: "#F0F7FF",
    borderHex: "#BFDBFE",
    hormoneSummary:
      "Follicle-stimulating hormone (FSH) matures ovarian follicles while estradiol steadily climbs.",
    bodyAndMindGuidance:
      "Cognitive sharpness, creativity, and physical stamina rise. Ideal window for deep study, planning, and strength training.",
    nutritionFocus:
      "Light, vibrant proteins, fermented foods, and cruciferous vegetables to support estrogen metabolism.",
  },

  ovulatory: {
    id: "ovulatory",
    name: "Ovulatory Window",
    seasonLabel: "Inner Summer • Peak Radiance",
    colorHex: "#2AB3A3",
    bgTintHex: "#ECFDF5",
    borderHex: "#A7F3D0",
    hormoneSummary:
      "Peak estradiol triggers a luteinizing hormone (LH) surge, releasing the dominant egg.",
    bodyAndMindGuidance:
      "Peak verbal fluency, confidence, and cardiovascular energy. Great days for presentations, interviews, and high-output workouts.",
    nutritionFocus:
      "Extra hydration, electrolytes, antioxidant-rich berries, and fiber.",
  },

  luteal: {
    id: "luteal",
    name: "Luteal Phase",
    seasonLabel: "Inner Autumn • Grounding & Nesting",
    colorHex: "#C47D9B",
    bgTintHex: "#FBF3F6",
    borderHex: "#EADFE4",
    hormoneSummary:
      "The corpus luteum secretes thermogenic progesterone (+0.3°C basal temperature) alongside a secondary estrogen wave.",
    bodyAndMindGuidance:
      "Metabolic rate increases by 100–250 kcal/day. Detail-oriented focus early on, transitioning to inward nesting pre-menses.",
    nutritionFocus:
      "Complex slow-release carbohydrates (sweet potato, oats), magnesium-rich seeds, and B-vitamins to buffer cravings.",
  },
};

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleInDegrees: number,
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy + r * Math.sin(angleInRadians),
  };
}

function describeSvgArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M",
    start.x,
    start.y,
    "A",
    r,
    r,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
}

export default function CyclePhaseRing({
  currentCycleDay = 14,
  avgCycleLength = 28,
  avgPeriodLength = 5,
  lastPeriodStart = "Nov 4, 2026",
  compact = false,
  onSelectDay,
  
}: CyclePhaseRingProps) {
  const safeCycleLen = Math.max(21, Math.min(45, avgCycleLength || 28));
  const safePeriodLen = Math.max(2, Math.min(10, avgPeriodLength || 5));
  const clampedCurrentDay = Math.max(
    1,
    Math.min(currentCycleDay, safeCycleLen),
  );

  const [inspectedDay, setInspectedDay] = useState<number>(clampedCurrentDay);
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    setInspectedDay(Math.max(1, Math.min(currentCycleDay, safeCycleLen)));
  }, [currentCycleDay, safeCycleLen]);

  const boundaries = useMemo(() => {
    const ovulationDay = Math.max(safePeriodLen + 4, safeCycleLen - 14);
    const fertileStart = Math.max(safePeriodLen + 1, ovulationDay - 3);
    const fertileEnd = Math.min(safeCycleLen - 2, ovulationDay + 1);

    return {
      menstrualEnd: safePeriodLen,
      follicularStart: safePeriodLen + 1,
      follicularEnd: fertileStart - 1,
      ovulatoryStart: fertileStart,
      ovulationPeak: ovulationDay,
      ovulatoryEnd: fertileEnd,
      lutealStart: fertileEnd + 1,
      lutealEnd: safeCycleLen,
    };
  }, [safeCycleLen, safePeriodLen]);

  const getPhaseForDay = (day: number): PhaseMetadata => {
    if (day <= boundaries.menstrualEnd) return PHASE_DETAILS.menstrual;
    if (day <= boundaries.follicularEnd) return PHASE_DETAILS.follicular;
    if (day <= boundaries.ovulatoryEnd) return PHASE_DETAILS.ovulatory;
    return PHASE_DETAILS.luteal;
  };

  const activePhase = getPhaseForDay(inspectedDay);
  const daysUntilNextPeriod = Math.max(0, safeCycleLen - clampedCurrentDay + 1);

  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 116;
  const gapDeg = 3.5;

  const dayToAngle = (dayIndex: number) =>
    ((dayIndex - 1) / safeCycleLen) * 360;

  const menstrualArc = describeSvgArc(
    cx,
    cy,
    radius,
    gapDeg / 2,
    dayToAngle(boundaries.menstrualEnd + 1) - gapDeg / 2,
  );

  const follicularArc = describeSvgArc(
    cx,
    cy,
    radius,
    dayToAngle(boundaries.follicularStart) + gapDeg / 2,
    dayToAngle(boundaries.follicularEnd + 1) - gapDeg / 2,
  );

  const ovulatoryArc = describeSvgArc(
    cx,
    cy,
    radius,
    dayToAngle(boundaries.ovulatoryStart) + gapDeg / 2,
    dayToAngle(boundaries.ovulatoryEnd + 1) - gapDeg / 2,
  );

  const lutealArc = describeSvgArc(
    cx,
    cy,
    radius,
    dayToAngle(boundaries.lutealStart) + gapDeg / 2,
    360 - gapDeg / 2,
  );

  const puckAngle = ((inspectedDay - 0.5) / safeCycleLen) * 360;
  const puckCoords = polarToCartesian(cx, cy, radius, puckAngle);

  // Converts pointer X/Y coordinates into exact Cycle Day (1..safeCycleLen)

  const updateDayFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = clientX - centerX;
      const dy = clientY - centerY;

      // Ignore clicks deep inside the center text button area unless already dragging

      const distFromCenter = Math.sqrt(dx * dx + dy * dy);
      const innerDeadZone = rect.width * 0.22;
      if (!isDragging && distFromCenter < innerDeadZone) return;

      let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (angleDeg < 0) angleDeg += 360;

      const rawDay = Math.ceil((angleDeg / 360) * safeCycleLen);
      const nextDay = Math.max(1, Math.min(safeCycleLen, rawDay));

      setInspectedDay((prev) => {
        if (prev !== nextDay) {
          onSelectDay?.(nextDay);
        }
        return nextDay;
      });
    },
    [isDragging, safeCycleLen, onSelectDay],
  );

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    if (Math.sqrt(dx * dx + dy * dy) < rect.width * 0.22) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    updateDayFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    updateDayFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      setIsDragging(false);
    }
  };

  // Mouse wheel scrubbing over the ring

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const direction = e.deltaY > 0 ? 1 : -1;
    setInspectedDay((prev) => {
      let next = prev + direction;
      if (next > safeCycleLen) next = 1;
      if (next < 1) next = safeCycleLen;
      onSelectDay?.(next);
      return next;
    });
  };

  const stepDay = (delta: number) => {
    setInspectedDay((prev) => {
      let next = prev + delta;
      if (next > safeCycleLen) next = 1;
      if (next < 1) next = safeCycleLen;
      onSelectDay?.(next);
      return next;
    });
  };

  return (
    <div className="w-full bg-white border border-line rounded-2xl p-5 sm:p-6 shadow-soft text-ink select-none">
      <div
        className={
          compact
            ? "flex flex-col gap-5 items-center"
            : "grid grid-cols-1 lg:grid-cols-12 gap-7 items-center"
        }
      >

        {/* ORBITAL DIAL WITH 360° DRAG & WHEEL SCRUBBING */}

        <div
          className={
            compact
              ? "w-full flex flex-col items-center"
              : "lg:col-span-5 flex flex-col items-center"
          }
        >

          {/* Interactive Hint Pill */}

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fcf9fa] border border-line text-[10.5px] font-bold text-muted mb-2">
            <Hand className="w-3 h-3 text-[#d990a8]" />
            <span>Hold & slide around ring or scroll wheel</span>
          </div>

          <div
            onWheel={handleWheel}
            className="relative w-[265px] h-[265px] sm:w-[285px] sm:h-[285px] flex items-center justify-center"
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${size} ${size}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`w-full h-full overflow-visible touch-none ${
                isDragging ? "cursor-grabbing" : "cursor-grab"
              }`}
            >
              <circle
                cx={cx}
                cy={cy}
                r={radius + 16}
                fill="none"
                stroke="#F4EFF2"
                strokeWidth="1"
                strokeDasharray="3 3"
                className="opacity-35"
              />

              {/* Invisible Wide Touch/Drag Track */}

              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke="transparent"
                strokeWidth="44"
              />

              <path
                d={menstrualArc}
                fill="none"
                stroke="#D990A8"
                strokeWidth="18"
                strokeLinecap="round"
              />
              <path
                d={follicularArc}
                fill="none"
                stroke="#7BA7BC"
                strokeWidth="18"
                strokeLinecap="round"
              />
              <path
                d={ovulatoryArc}
                fill="none"
                stroke="#48A999"
                strokeWidth="18"
                strokeLinecap="round"
              />
              <path
                d={lutealArc}
                fill="none"
                stroke="#A55F78"
                strokeWidth="18"
                strokeLinecap="round"
              />

              {Array.from({ length: safeCycleLen }).map((_, i) => {
                const dayNum = i + 1;
                const angle = ((dayNum - 0.5) / safeCycleLen) * 360;
                const dotPos = polarToCartesian(cx, cy, radius, angle);
                const isPeakOvulation = dayNum === boundaries.ovulationPeak;

                return (
                  <circle
                    key={dayNum}
                    cx={dotPos.x}
                    cy={dotPos.y}
                    r={isPeakOvulation ? 3.5 : 2}
                    fill="#FFFFFF"
                    opacity={isPeakOvulation ? 0.95 : 0.6}
                    className="pointer-events-none"
                  />
                );
              })}

              {/* Draggable Day Selector Puck (Instant 0ms response while dragging) */}


              <g
                className={`pointer-events-none ${
                  isDragging ? "" : "transition-all duration-150"
                }`}
              >
                <circle
                  cx={puckCoords.x}
                  cy={puckCoords.y}
                  r={isDragging ? 22 : 17}
                  fill={activePhase.colorHex}
                  opacity={isDragging ? "0.32" : "0.2"}
                />
                <circle
                  cx={puckCoords.x}
                  cy={puckCoords.y}
                  r={isDragging ? 14 : 12.5}
                  fill="#FFFFFF"
                  stroke={activePhase.colorHex}
                  strokeWidth="3.5"
                />
                <text
                  x={puckCoords.x}
                  y={puckCoords.y + 3.5}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="800"
                  fill="#1E171B"
                >
                  {inspectedDay}
                </text>
              </g>
            </svg>

            {/* Center Readout Hub */}


            <div className="absolute inset-[54px] rounded-full bg-[#FAF7F8] border border-line/80 flex flex-col items-center justify-center text-center p-4 shadow-inner pointer-events-auto">
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border mb-1.5 bg-[#fff0f3]"
                style={{
                  color: activePhase.colorHex,
                  borderColor: activePhase.colorHex,
                }}
              >
                {activePhase.name}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => stepDay(-1)}
                  aria-label="Previous cycle day"
                  className="w-6 h-6 rounded-full bg-[#fcf9fa] border border-line flex items-center justify-center text-muted hover:text-ink cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <div className="text-[28px] sm:text-[30px] font-extrabold text-ink tracking-tight leading-none tabular-nums min-w-[82px]">
                  Day {inspectedDay}
                </div>
                <button
                  type="button"
                  onClick={() => stepDay(1)}
                  aria-label="Next cycle day"
                  className="w-6 h-6 rounded-full bg-[#fcf9fa] border border-line flex items-center justify-center text-muted hover:text-ink cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[11px] font-semibold text-muted mt-1.5 tabular-nums">
                {inspectedDay === clampedCurrentDay ? (
                  <>
                    Next period in{" "}
                    <strong className="text-ink">
                      ~{daysUntilNextPeriod}d
                    </strong>{" "}
                    <span className="text-[10px]">(±2d)</span>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setInspectedDay(clampedCurrentDay)}
                    className="text-[#a55f78] underline font-bold cursor-pointer"
                  >
                    Return to Today (CD {clampedCurrentDay})
                  </button>
                )}
              </p>

              {lastPeriodStart && (
                <span className="text-[10px] text-muted mt-1">
                  LMP: {lastPeriodStart}
                </span>
              )}
            </div>
          </div>

          {/* Linear Quick-Scrub Slider Bar */}


          <div className="w-full max-w-[260px] mt-2 px-2">
            <input
              type="range"
              min={1}
              max={safeCycleLen}
              value={inspectedDay}
              aria-label="Scrub cycle day"
              onChange={(e) => {
                const val = Number(e.target.value);
                setInspectedDay(val);
                onSelectDay?.(val);
              }}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[#d990a8] bg-[#fcf9fa] border border-line"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-2.5 text-[11px] font-bold text-[#66545f]">
            <button
              type="button"
              onClick={() => setInspectedDay(1)}
              className="flex items-center gap-1.5 hover:text-ink cursor-pointer"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#D990A8]" />
              <span>Menses (CD 1–{boundaries.menstrualEnd})</span>
            </button>
            <button
              type="button"
              onClick={() => setInspectedDay(boundaries.follicularStart)}
              className="flex items-center gap-1.5 hover:text-ink cursor-pointer"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#7BA7BC]" />
              <span>Follicular</span>
            </button>
            <button
              type="button"
              onClick={() => setInspectedDay(boundaries.ovulationPeak)}
              className="flex items-center gap-1.5 hover:text-ink cursor-pointer"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#48A999]" />
              <span>Ovulatory (~CD {boundaries.ovulationPeak})</span>
            </button>
            <button
              type="button"
              onClick={() => setInspectedDay(boundaries.lutealStart + 2)}
              className="flex items-center gap-1.5 hover:text-ink cursor-pointer"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#A55F78]" />
              <span>Luteal</span>
            </button>
          </div>
        </div>

        {/* PHYSIOLOGY & HORMONE CURVE (DARK-MODE CONTRAST FIXED) */}


        <div
          className={compact ? "w-full space-y-3.5" : "lg:col-span-7 space-y-4"}
        >
          {/* Uses bg-[#fcf9fa] so globals.css cleanly maps it to #282026 in Dark Mode */}


          <div
            className="p-4 rounded-2xl bg-[#fcf9fa] border border-line transition-colors"
            style={{
              borderLeftWidth: "4px",
              borderLeftColor: activePhase.colorHex,
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <Sparkles
                  className="w-4 h-4"
                  style={{ color: activePhase.colorHex }}
                />
                <span
                  className="text-[10.5px] font-extrabold uppercase tracking-[0.12em]"
                  style={{ color: activePhase.colorHex }}
                >
                  {activePhase.seasonLabel}
                </span>
              </div>
              <span className="text-[11px] font-bold text-muted tabular-nums">
                CD {inspectedDay} / {safeCycleLen}
              </span>
            </div>

            <h3 className="text-[16px] font-extrabold text-ink tracking-tight mb-1">
              {activePhase.name} Physiology
            </h3>
            <p className="text-[12.5px] text-muted leading-relaxed">
              {activePhase.hormoneSummary}
            </p>
          </div>

          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = Math.max(
                0,
                Math.min(1, (e.clientX - rect.left) / rect.width),
              );
              const targetDay = Math.max(
                1,
                Math.min(safeCycleLen, Math.round(ratio * safeCycleLen)),
              );
              setInspectedDay(targetDay);
            }}
            className="p-3.5 rounded-xl bg-[#fcf9fa] border border-line cursor-ew-resize"
            title="Click anywhere along the hormone curve to jump to that cycle day"
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-[#66545f] mb-2">
              <span>Ovarian Hormone Curve (E2 & P4)</span>
              <div className="flex items-center gap-2.5">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-[#D990A8] inline-block" />
                  E2
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-[#A55F78] inline-block" />
                  P4
                </span>
              </div>
            </div>

            <div className="relative h-14 w-full">
              <svg
                viewBox="0 0 280 60"
                preserveAspectRatio="none"
                className="w-full h-full overflow-visible"
              >
                <path
                  d="M 0 50 Q 45 48, 85 32 T 135 8 Q 160 42, 195 26 T 280 48"
                  fill="none"
                  stroke="#D990A8"
                  strokeWidth="2.5"
                />
                <path
                  d="M 0 54 L 135 52 Q 175 48, 210 12 Q 245 12, 280 52"
                  fill="none"
                  stroke="#A55F78"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                />
                <line
                  x1={(inspectedDay / safeCycleLen) * 280}
                  y1="0"
                  x2={(inspectedDay / safeCycleLen) * 280}
                  y2="60"
                  stroke={activePhase.colorHex}
                  strokeWidth="1.5"
                />
                <circle
                  cx={(inspectedDay / safeCycleLen) * 280}
                  cy="30"
                  r="4.5"
                  fill={activePhase.colorHex}
                />
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
            <div className="p-3.5 rounded-xl bg-[#fcf9fa] border border-line">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#a55f78] mb-1">
                Energy & Movement
              </div>
              <p className="text-muted leading-relaxed">
                {activePhase.bodyAndMindGuidance}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#fcf9fa] border border-line">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#a55f78] mb-1">
                Phase Nutrition
              </div>
              <p className="text-muted leading-relaxed">
                {activePhase.nutritionFocus}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
