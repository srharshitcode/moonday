"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import CyclePhaseRing from "@/components/CyclePhaseRing";
import { createClient } from "@/utils/supabase/client";
import {
  format,
  differenceInCalendarDays,
  addDays,
  subDays,
  isWithinInterval,
  isSameDay,
  parseISO,
  startOfDay,
} from "date-fns";
import {
  Sparkles,
  Droplet,
  Calendar as CalendarIcon,
  ArrowRight,
  ArrowUpRight,
  Loader2,
  Activity,
  PieChart,
  Heart,
  FileText,
  Clock,
  Coffee,
  Check,
  RefreshCw,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

interface PhaseCareGuide {
  roman: string;
  seasonBadge: string;
  tagline: string;
  hormoneState: string;
  whispers: string[];
  nourishTitle: string;
  nourishTips: string[];
  movementTitle: string;
  movementTips: string[];
  skinGlowTitle: string;
  skinGlowTips: string[];
  mindFocusTitle: string;
  mindFocusTips: string[];
  rituals: string[];
}

const PHASE_CONCIERGE: Record<string, PhaseCareGuide> = {
  "Menstrual Phase": {
    roman: "Phase I",
    seasonBadge: "Inner Winter • Rest & Release",
    tagline:
      "Hormones are at their quietest baseline. Grant yourself permission to slow down, conserve warmth, and rest without guilt.",
    hormoneState: "Estrogen & Progesterone at baseline • Uterine renewal",
    whispers: [
      "Your worth is not measured by your productivity. Resting during your inner winter is a biological necessity, not a flaw.",
      "As your body releases and renews, give yourself permission to move at half-speed and protect your warmth.",
      "Stillness is not falling behind—your endocrine system is resetting the foundation for your entire month.",
    ],
    nourishTitle: "Warm, Iron-Rich Replenishment",
    nourishTips: [
      "Prioritize bioavailable iron (lentils, spinach, dark leafy greens, pumpkin seeds) paired with Vitamin C.",
      "Soothe smooth muscle tension with warm ginger, red raspberry leaf, or chamomile infusions.",
      "Rich dark cacao (70%+) supplies natural magnesium to ease pelvic cramping.",
    ],
    movementTitle: "Restorative Mobility & Nervous System Rest",
    movementTips: [
      "Trade high-cortisol training for restorative yin stretching, pelvic floor release, or unhurried walks.",
      "Honor earlier sleep windows as your body dedicates energy to cellular renewal.",
    ],
    skinGlowTitle: "Lipid Barrier Repair & Deep Hydration",
    skinGlowTips: [
      "Baseline estrogen can leave skin drier or more reactive—layer ceramides, squalane, and hyaluronic acid.",
      "Pause strong exfoliating acids in favor of calming, occlusive evening balms.",
    ],
    mindFocusTitle: "Intuitive Clarity & Low Social Bandwidth",
    mindFocusTips: [
      "Left-and-right hemisphere connectivity peaks—an ideal window for journaling and honest gut-check decisions.",
      "Guard your solitude and decline non-essential commitments.",
    ],
    rituals: [
      "Rest with a warm compress or herbal infusion for 15 quiet minutes",
      "Complete an evening lipid-barrier skincare ritual",
      "Record three unfiltered lines in your Personal Journal Studio",
    ],
  },
  "Follicular Phase": {
    roman: "Phase II",
    seasonBadge: "Inner Spring • Renewal & Curiosity",
    tagline:
      "Estradiol is climbing steadily, bringing fresh mental clarity, cognitive sharpness, and renewed physical stamina.",
    hormoneState: "Rising Estradiol (E2) • Follicular maturation",
    whispers: [
      "Your inner spring has arrived—let rising curiosity guide what you build, study, and begin this week.",
      "As estradiol climbs, your mind is naturally primed for fresh architecture, learning, and creative courage.",
      "Plant small, intentional seeds today; you do not need to rush the bloom.",
    ],
    nourishTitle: "Vibrant, Light & Phytonutrient-Dense Fare",
    nourishTips: [
      "Support estrogen metabolism with cruciferous greens (broccoli sprouts, kale, bok choy, cauliflower).",
      "Incorporate fermented foods and clean proteins to fuel rising metabolic and cognitive output.",
      "Ground flaxseeds and pumpkin seeds nourish healthy follicular development.",
    ],
    movementTitle: "Progressive Strength & Skill Acquisition",
    movementTips: [
      "Rising estradiol enhances muscle recovery and collagen synthesis—an optimal window for resistance training.",
      "Lean into complex movement patterns, brisk cardio, or strength intervals while stamina climbs.",
    ],
    skinGlowTitle: "Natural Collagen Synthesis & Elasticity",
    skinGlowTips: [
      "Climbing estrogen plumps the dermis and balances sebum—your skin responds well to Vitamin C and gentle resurfacing.",
      "Maintain dewy luminosity with lightweight mineral hydration.",
    ],
    mindFocusTitle: "Deep Architecture, Study & Strategy",
    mindFocusTips: [
      "Verbal memory and neuroplasticity rise—ideal for complex problem-solving, research, and initiating new projects.",
      "Channel fresh curiosity into long-term planning and creative architecture.",
    ],
    rituals: [
      "Map your top three creative or strategic priorities for the week",
      "Complete 25 minutes of energizing strength or mobility work",
      "Replenish with 2,000 ml of mineral-rich water",
    ],
  },
  "Fertile Window": {
    roman: "Phase III",
    seasonBadge: "Inner Summer • Peak Radiance",
    tagline:
      "Peak estradiol triggers your ovulatory wave—verbal fluency, confidence, and outward energy are at their highest.",
    hormoneState: "Peak Estradiol Surge • Luteinizing Hormone (LH) Wave",
    whispers: [
      "You are in your inner summer—your voice, presence, and creative conviction are at their monthly peak.",
      "Channel your natural outward warmth into the conversations and ambitions that matter most to you.",
      "Let yourself be seen and heard without shrinking your radiance.",
    ],
    nourishTitle: "Antioxidant Cooling & Cellular Hydration",
    nourishTips: [
      "Emphasize antioxidant-rich berries, leafy greens, and glutathione precursors (avocado, asparagus) to support ovulation.",
      "Increase trace electrolytes and water intake as basal activity and cervical fluid peak.",
      "Sunflower seeds and Brazil nuts supply selenium and Vitamin E for luteal transition.",
    ],
    movementTitle: "High-Output Conditioning & Peak Output",
    movementTips: [
      "Cardiovascular output and pain tolerance peak—ideal days for personal bests, dynamic flow, or endurance sessions.",
      "Warm up joints thoroughly, as peak estrogen temporarily increases ligament laxity.",
    ],
    skinGlowTitle: "Peak Luminosity & Pore Refinement",
    skinGlowTips: [
      "Natural skin radiance and micro-circulation reach their monthly high during the ovulatory window.",
      "Use a gentle niacinamide or BHA serum in the evening to keep pores clear before progesterone rises.",
    ],
    mindFocusTitle: "High-Stakes Communication & Connection",
    mindFocusTips: [
      "Articulation and social magnetism peak—schedule interviews, presentations, negotiations, or meaningful conversations.",
      "Capture outward momentum while your social battery is naturally full.",
    ],
    rituals: [
      "Advance a key conversation, pitch, or presentation you care about",
      "Include an extra glass of mineral or citrus-infused water",
      "Document a recent personal milestone in your journal",
    ],
  },
  "Ovulation Day": {
    roman: "Phase III",
    seasonBadge: "Inner Summer • Ovulatory Peak",
    tagline:
      "Your ovulatory peak has arrived—heightened sensory awareness, expressive warmth, and peak vitality.",
    hormoneState: "LH Surge Peak • Ovum release & corpus luteum transition",
    whispers: [
      "Today marks your ovulatory peak—honor your heightened vitality with deep hydration and joyful movement.",
      "Your capacity for connection and clear expression is at its zenith today.",
      "Notice the subtle signals of your body as your cycle prepares to transition inward.",
    ],
    nourishTitle: "Anti-Inflammatory & Mineral-Rich Balance",
    nourishTips: [
      "Omega-3 fatty acids (walnuts, chia, wild fish) help calm mild mid-cycle pelvic sensitivity.",
      "Pair crisp hydration with potassium-rich greens and citrus.",
    ],
    movementTitle: "Dynamic Flow & Mindful Alignment",
    movementTips: [
      "Channel peak energy into fluid strength or brisk outdoor movement.",
      "Incorporate gentle hip and pelvic mobility if you notice mid-cycle ovulatory fullness.",
    ],
    skinGlowTitle: "Balanced Sebum & Evening Clarification",
    skinGlowTips: [
      "Double-cleanse gently at night as your endocrine system transitions toward progesterone dominance.",
      "Lock in calm hydration with botanical mists and lightweight emulsions.",
    ],
    mindFocusTitle: "Expressive Poise & Relational Warmth",
    mindFocusTips: [
      "An optimal day for leadership, collaborative synthesis, and heartfelt connection.",
      "Anchor your creative ideas in writing before your focus turns inward next week.",
    ],
    rituals: [
      "Log mid-cycle physical observations in your daily check-in",
      "Dedicate 20 minutes to movement that feels effortless and strong",
      "Share a quiet, present moment with someone you cherish",
    ],
  },
  "Luteal Phase": {
    roman: "Phase IV",
    seasonBadge: "Inner Autumn • Grounding & Nesting",
    tagline:
      "Thermogenic progesterone is dominant. Your basal metabolic rate naturally rises—honor your need for slow carbohydrates, warmth, and firm boundaries.",
    hormoneState: "Dominant Progesterone (P4) • Basal temperature +0.3°C",
    whispers: [
      "It is biologically normal to require more nourishment in your luteal phase—your metabolism is working harder to care for you.",
      "Your heightened sensitivity before your moonday is also your sharpest intuition—treat it with warmth, not criticism.",
      "Protect your peace fiercely during your inner autumn; saying no is an act of self-stewardship.",
    ],
    nourishTitle: "Complex Slow Carbohydrates, Magnesium & Vitamin B6",
    nourishTips: [
      "Resting energy expenditure increases by 100–250 kcal/day—heightened appetite is a biological requirement, not a lack of discipline.",
      "Stabilize serotonin and blood glucose with roasted root vegetables, oats, brown rice, and warm soups.",
      "Magnesium-rich seeds, almonds, and B6 support fluid balance and emotional steadiness.",
    ],
    movementTitle: "Pilates, Incline Walking & Measured Strength",
    movementTips: [
      "Progesterone elevates core temperature and perceived exertion—scale back breathless high-intensity intervals.",
      "Favor controlled Pilates, steady strength with longer rest intervals, and restorative evening walks.",
    ],
    skinGlowTitle: "Progesterone Sebum Balance & Lymphatic Care",
    skinGlowTips: [
      "Progesterone stimulates sebaceous activity—incorporate niacinamide, azelaic acid, or kaolin clay to prevent congestion.",
      "Gentle upward facial massage supports lymphatic drainage against luteal fluid retention.",
    ],
    mindFocusTitle: "Editorial Completion & Protective Boundaries",
    mindFocusTips: [
      "Early luteal sharpens attention to detail—ideal for editing, organizing, and closing open loops.",
      "Late luteal calls for inward nesting—reduce sensory clutter and protect your evening wind-down.",
    ],
    rituals: [
      "Enjoy a warm, complex-carbohydrate meal with complete self-compassion",
      "Hold one firm boundary to protect your evening rest",
      "Dim screens 30 minutes early and transition into quiet reading or reflection",
    ],
  },
};

const QUICK_MOODS = [
  "Calm",
  "Grounded",
  "Radiant",
  "Focused",
  "Tired",
  "Sensitive",
  "Reflective",
];

const QUICK_FLOWS = ["Light", "Medium", "Heavy", "Spotting", "No bleeding"];

export default function DashboardClient() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("there");
  const [cycleStatus, setCycleStatus] = useState({
    day: 1,
    dynamicCycle: 28,
    periodLength: 5,
    lutealLength: 14,
    phase: "Follicular Phase",
    lastPeriodStartStr: null as string | null,
    nextPeriod: null as Date | null,
    ovulation: null as Date | null,
    fertileStart: null as Date | null,
    daysUntilPeriod: 28,
  });

  const [todayLog, setTodayLog] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [latestJournal, setLatestJournal] = useState<any>(null);
  const [dbQuotes, setDbQuotes] = useState<string[]>([]);

  const [heroView, setHeroView] = useState<"timeline" | "ring">("timeline");
  const [conciergeTab, setConciergeTab] = useState<
    "nourish" | "movement" | "skin" | "mind"
  >("nourish");
  const [whisperIdx, setWhisperIdx] = useState(0);
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickSavedToast, setQuickSavedToast] = useState("");

  const [waterGlasses, setWaterGlasses] = useState(0);
  const [checkedRituals, setCheckedRituals] = useState<Record<number, boolean>>(
    {},
  );

  const supabase = createClient();
  const today = useMemo(() => startOfDay(new Date()), []);
  const todayStr = useMemo(() => format(today, "yyyy-MM-dd"), [today]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(
          localStorage.getItem(`moonday_rituals_${todayStr}`) || "{}",
        );
        if (typeof saved.water === "number") setWaterGlasses(saved.water);
        if (saved.rituals) setCheckedRituals(saved.rituals);
      } catch {}
    }
  }, [todayStr]);

  const saveLocalRituals = (
    nextWater: number,
    nextRituals: Record<number, boolean>,
  ) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          `moonday_rituals_${todayStr}`,
          JSON.stringify({
            water: nextWater,
            rituals: nextRituals,
          }),
        );
      } catch {}
    }
  };

  const loadDashboard = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setUserId(user.id);

    const sevenDaysAgo = format(subDays(today, 7), "yyyy-MM-dd");

    const [
      { data: profile },
      { data: recent },
      { data: allLogs },
      { data: journalRows },
      { data: quotesData },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "display_name, cycle_length, period_length, luteal_phase_length",
        )
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("log_date", sevenDaysAgo)
        .order("log_date", { ascending: false }),
      supabase
        .from("daily_logs")
        .select("log_date, is_period_start, flow")
        .eq("user_id", user.id)
        .lte("log_date", todayStr)
        .order("log_date", { ascending: true }),
      supabase
        .from("personal_notes")
        .select("id, title, content, entry_date, tags")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false })
        .limit(1),
      supabase.from("daily_quotes").select("quote_text").limit(25),
    ]);

    const resolvedName =
      profile?.display_name?.trim() ||
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "there";
    setUserName(resolvedName);

    if (quotesData && quotesData.length > 0) {
      const validQuotes = quotesData
        .map((q: any) => q.quote_text)
        .filter(Boolean);
      if (validQuotes.length > 0) setDbQuotes(validQuotes);
    }

    if (journalRows && journalRows.length > 0) {
      setLatestJournal(journalRows[0]);
    }

    if (recent) {
      setRecentLogs(recent.filter((l) => l.log_date !== todayStr).slice(0, 5));
      const todayData = recent.find((l) => l.log_date === todayStr);
      setTodayLog(todayData || null);
    }

    let dynamicCycle = Number(profile?.cycle_length) || 28;
    const periodLen = Number(profile?.period_length) || 5;
    const luteal = Number(profile?.luteal_phase_length) || 14;

    const explicitStarts = (allLogs || []).filter(
      (l: any) => l.is_period_start,
    );
    let startLogs = explicitStarts;

    if (startLogs.length === 0 && allLogs && allLogs.length > 0) {
      const bleedLogs = allLogs.filter(
        (l: any) =>
          l.flow &&
          l.flow !== "No bleeding" &&
          l.flow !== "None" &&
          l.flow !== "Spotting",
      );
      if (bleedLogs.length > 0) {
        startLogs = [bleedLogs[bleedLogs.length - 1]];
      }
    }

    if (startLogs && startLogs.length > 0) {
      const startDates = startLogs.map((l: any) =>
        startOfDay(parseISO(l.log_date)),
      );

      if (startDates.length >= 2) {
        let totalDays = 0;
        let validIntervals = 0;
        for (let i = 1; i < startDates.length; i++) {
          const diff = differenceInCalendarDays(
            startDates[i],
            startDates[i - 1],
          );
          if (diff >= 15 && diff <= 55) {
            totalDays += diff;
            validIntervals++;
          }
        }
        if (validIntervals > 0) {
          dynamicCycle = Math.round(totalDays / validIntervals);
        }
      }

      const lastPeriod = startDates[startDates.length - 1];
      const currentDay = differenceInCalendarDays(today, lastPeriod) + 1;

      const nextExpected = addDays(lastPeriod, dynamicCycle);
      const expectedOvulation = subDays(nextExpected, luteal);
      const fertileStart = subDays(expectedOvulation, 5);
      const daysUntil = differenceInCalendarDays(nextExpected, today);

      let phase = "Follicular Phase";
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
        day: currentDay > 0 ? currentDay : 1,
        dynamicCycle,
        periodLength: periodLen,
        lutealLength: luteal,
        phase,
        lastPeriodStartStr: format(lastPeriod, "MMM d, yyyy"),
        nextPeriod: nextExpected,
        ovulation: expectedOvulation,
        fertileStart,
        daysUntilPeriod: daysUntil,
      });
    } else {
      setCycleStatus({
        day: 1,
        dynamicCycle,
        periodLength: periodLen,
        lutealLength: luteal,
        phase: "Follicular Phase",
        lastPeriodStartStr: null,
        nextPeriod: addDays(today, dynamicCycle),
        ovulation: subDays(addDays(today, dynamicCycle), luteal),
        fertileStart: subDays(addDays(today, dynamicCycle), luteal + 5),
        daysUntilPeriod: dynamicCycle,
      });
    }

    setLoading(false);
  }, [supabase, today, todayStr]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ displayName?: string }>;
      if (customEvent.detail?.displayName?.trim()) {
        setUserName(customEvent.detail.displayName.trim());
      }
      loadDashboard();
    };
    window.addEventListener("moonday:profile-updated", handleProfileUpdate);
    return () =>
      window.removeEventListener(
        "moonday:profile-updated",
        handleProfileUpdate,
      );
  }, [loadDashboard]);

  const handleQuickLogUpdate = async (
    field: "mood" | "flow" | "period_start",
    value: string,
  ) => {
    if (!userId) return;
    setQuickSaving(true);

    try {
      const currentMoods = todayLog?.mood
        ? todayLog.mood.split(", ").filter(Boolean)
        : [];
      let nextMoodStr = todayLog?.mood || null;
      let nextFlow = todayLog?.flow || null;
      let nextPeriodStart = Boolean(todayLog?.is_period_start);

      if (field === "mood") {
        const exists = currentMoods.includes(value);
        const updated = exists
          ? currentMoods.filter((m: string) => m !== value)
          : [...currentMoods, value];
        nextMoodStr = updated.length > 0 ? updated.join(", ") : null;
      } else if (field === "flow") {
        nextFlow = todayLog?.flow === value ? null : value;
        if (
          nextFlow &&
          nextFlow !== "No bleeding" &&
          nextFlow !== "Spotting" &&
          cycleStatus.day > cycleStatus.periodLength
        ) {
          nextPeriodStart = true;
        }
      } else if (field === "period_start") {
        nextPeriodStart = !nextPeriodStart;
        if (nextPeriodStart && !nextFlow) nextFlow = "Medium";
      }

      const nowIso = new Date().toISOString();
      const payload = {
        user_id: userId,
        log_date: todayStr,
        mood: nextMoodStr,
        flow: nextFlow,
        is_period_start: nextPeriodStart,
        created_at: todayLog?.created_at || nowIso,
        updated_at: nowIso,
      };

      const { data, error } = await supabase
        .from("daily_logs")
        .upsert(payload, { onConflict: "user_id,log_date" })
        .select()
        .single();

      if (!error && data) {
        setTodayLog(data);
        setQuickSavedToast("Synchronized");
        setTimeout(() => setQuickSavedToast(""), 2200);
        await loadDashboard();
      }
    } finally {
      setQuickSaving(false);
    }
  };

  const upcomingCycles = useMemo(() => {
    const baseDate = cycleStatus.nextPeriod || addDays(today, 14);
    return [0, 1, 2].map((idx) => {
      const start = addDays(baseDate, idx * cycleStatus.dynamicCycle);
      const end = addDays(start, cycleStatus.periodLength - 1);
      const nextStart = addDays(start, cycleStatus.dynamicCycle);
      const ovul = subDays(nextStart, cycleStatus.lutealLength);
      return {
        indexLabel: `0${idx + 1}`,
        label: idx === 0 ? "Upcoming Cycle" : `Horizon Cycle +${idx}`,
        bleedRange: `${format(start, "MMM d")} – ${format(end, "MMM d")}`,
        ovulationDate: format(ovul, "MMM d"),
      };
    });
  }, [
    cycleStatus.nextPeriod,
    cycleStatus.dynamicCycle,
    cycleStatus.periodLength,
    cycleStatus.lutealLength,
    today,
  ]);

  const activeGuide =
    PHASE_CONCIERGE[cycleStatus.phase] || PHASE_CONCIERGE["Follicular Phase"];

  const whisperPool = useMemo(() => {
    return [...activeGuide.whispers, ...dbQuotes];
  }, [activeGuide.whispers, dbQuotes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[420px]">
        <Loader2 className="w-7 h-7 animate-spin text-[#d990a8]" />
      </div>
    );
  }

  const safeCycleDay = Math.max(
    1,
    Math.min(cycleStatus.day || 1, cycleStatus.dynamicCycle),
  );
  const progressPercentage = Math.min(
    98,
    Math.max(2, (safeCycleDay / cycleStatus.dynamicCycle) * 100),
  );

  const menstrualWidth =
    (cycleStatus.periodLength / cycleStatus.dynamicCycle) * 100;
  const lutealWidth = (14 / cycleStatus.dynamicCycle) * 100;
  const fertileWidth = (6 / cycleStatus.dynamicCycle) * 100;
  const follicularWidth = Math.max(
    10,
    100 - menstrualWidth - lutealWidth - fertileWidth,
  );

  const activeMoodList = todayLog?.mood
    ? todayLog.mood.split(", ").filter(Boolean)
    : [];

  return (
    <div className="animate-in fade-in duration-300 max-w-[1280px] mx-auto pb-16 text-ink space-y-6">
      {/* 1. BESPOKE EDITORIAL MASTHEAD & PHASE-SYNCED SANCTUARY WHISPER */}
      <section className="bg-white border border-line rounded-[28px] p-6 sm:p-8 shadow-soft">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#a55f78] mb-2">
              <Sparkles
                className="w-3.5 h-3.5 text-[#d990a8]"
                strokeWidth={1.75}
              />
              <span>
                {activeGuide.seasonBadge} • Day {safeCycleDay}
              </span>
            </div>

            <h1
              style={{
                fontFamily: "'Georgia', 'Cambria', 'Times New Roman', serif",
              }}
              className="text-[28px] sm:text-[36px] font-normal text-ink tracking-tight leading-[1.15]"
            >
              Welcome to your sanctuary,{" "}
              <span className="italic font-semibold">{userName}</span>
            </h1>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-2.5 text-[12px] text-muted font-medium mt-2.5">
              <span className="inline-flex items-center gap-1.5 text-ink font-semibold">
                <Clock
                  className="w-3.5 h-3.5 text-[#a55f78]"
                  strokeWidth={1.75}
                />
                {format(today, "EEEE, MMMM do, yyyy")}
              </span>
              <span className="opacity-40">•</span>
              <span className="text-[#a55f78] font-semibold">
                {activeGuide.hormoneState}
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 p-5 rounded-2xl bg-[#fff8fa] border border-[#f4c2c2]/70 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d990a8]" />
                <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#a55f78]">
                  Daily Sanctuary Whisper ({activeGuide.roman})
                </span>
              </div>
              <p
                style={{
                  fontFamily: "'Georgia', 'Cambria', 'Times New Roman', serif",
                }}
                className="text-[13.5px] text-ink italic leading-relaxed"
              >
                &ldquo;{whisperPool[whisperIdx % whisperPool.length]}&rdquo;
              </p>
            </div>
            <button
              type="button"
              onClick={() => setWhisperIdx((p) => p + 1)}
              title="Cycle reflection note"
              aria-label="Next sanctuary whisper"
              className="w-8 h-8 rounded-xl bg-white border border-line flex items-center justify-center text-muted hover:text-[#a55f78] hover:border-[#d990a8] transition-colors shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </section>

      {/* 2. UNIFIED ARCHITECTURAL INSTRUMENT & DAILY CHECK-IN LEDGER */}
      <section className="bg-white border border-line rounded-[28px] shadow-soft overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-line">
          <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-line/70">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#fff0f3] border border-[#f4c2c2] text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#a55f78]">
                    {activeGuide.roman}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                    Cycle Telemetry &amp; Endocrine Horizon
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={quickSaving}
                    onClick={() =>
                      handleQuickLogUpdate("period_start", "toggle")
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      todayLog?.is_period_start
                        ? "bg-[#a55f78] text-white border-[#a55f78]"
                        : "bg-[#fcf9fa] text-ink border-line hover:border-[#d990a8]"
                    }`}
                  >
                    <Droplet className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>
                      {todayLog?.is_period_start
                        ? "Bleed Day One Confirmed"
                        : "Mark Bleed Start"}
                    </span>
                  </button>

                  <div className="inline-flex bg-[#fcf9fa] border border-line rounded-xl p-0.5">
                    <button
                      type="button"
                      onClick={() => setHeroView("timeline")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        heroView === "timeline"
                          ? "bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2]"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      Horizon
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeroView("ring")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        heroView === "ring"
                          ? "bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2]"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      Orbital Dial
                    </button>
                  </div>
                </div>
              </div>

              {heroView === "ring" ? (
                <div className="py-1">
                  <CyclePhaseRing
                    currentCycleDay={safeCycleDay}
                    avgCycleLength={cycleStatus.dynamicCycle}
                    avgPeriodLength={cycleStatus.periodLength}
                    lastPeriodStart={cycleStatus.lastPeriodStartStr}
                  />
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted mb-1">
                        Current Cycle Position
                      </div>
                      <div className="flex items-baseline gap-3">
                        <span
                          style={{
                            fontFamily:
                              "'Georgia', 'Cambria', 'Times New Roman', serif",
                          }}
                          className="text-[54px] sm:text-[64px] font-normal text-ink leading-none tracking-tight tabular-nums"
                        >
                          Day {safeCycleDay}
                        </span>
                        <span className="text-[16px] font-semibold text-muted tabular-nums">
                          of {cycleStatus.dynamicCycle}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <Activity
                          className="w-4 h-4 text-[#a55f78]"
                          strokeWidth={1.75}
                        />
                        <span className="text-[15px] font-bold text-[#a55f78] tracking-tight">
                          {cycleStatus.phase}
                        </span>
                      </div>

                      <p className="text-[13px] text-muted mt-2.5 max-w-[490px] leading-relaxed">
                        {activeGuide.tagline}
                      </p>
                    </div>

                    <div className="sm:text-right shrink-0 w-full sm:w-auto">
                      <div className="p-5 rounded-2xl bg-[#fcf9fa] border border-line min-w-[185px]">
                        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted mb-1.5">
                          Next Moonday Window
                        </div>
                        <div
                          style={{
                            fontFamily:
                              "'Georgia', 'Cambria', 'Times New Roman', serif",
                          }}
                          className="text-[28px] font-normal text-ink leading-none tabular-nums"
                        >
                          {cycleStatus.daysUntilPeriod > 0
                            ? `${cycleStatus.daysUntilPeriod} Days`
                            : cycleStatus.daysUntilPeriod === 0
                              ? "Expected Today"
                              : `${Math.abs(cycleStatus.daysUntilPeriod)}d Past`}
                        </div>
                        <div className="text-[11px] font-semibold text-[#a55f78] mt-2 tabular-nums">
                          {cycleStatus.nextPeriod
                            ? `Est. ${format(cycleStatus.nextPeriod, "MMMM d")}`
                            : "Log start date to project"}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {heroView === "timeline" && (
              <div className="pt-3">
                <div className="grid grid-cols-4 gap-2 mb-2 text-[10.5px] font-bold uppercase tracking-[0.12em]">
                  <div className="text-[#a55f78]">
                    I. Menses (D1–{cycleStatus.periodLength})
                  </div>
                  <div className="text-ink">II. Follicular</div>
                  <div className="text-[#a55f78]">III. Ovulatory</div>
                  <div className="text-muted text-right">IV. Luteal</div>
                </div>

                <div className="w-full h-5 bg-[#fcf9fa] border border-line rounded-full flex items-center gap-1 p-1 relative">
                  <div
                    className="h-full bg-[#a55f78] rounded-l-full transition-all"
                    style={{ width: `${menstrualWidth}%` }}
                    title="Menstrual Phase"
                  />
                  <div
                    className="h-full bg-[#d990a8] transition-all"
                    style={{ width: `${follicularWidth}%` }}
                    title="Follicular Phase"
                  />
                  <div
                    className="h-full bg-[#f0b6c8] transition-all"
                    style={{ width: `${fertileWidth}%` }}
                    title="Ovulatory Window"
                  />
                  <div
                    className="h-full bg-[#c47d97] rounded-r-full transition-all"
                    style={{ width: `${lutealWidth}%` }}
                    title="Luteal Phase"
                  />

                  <div
                    className="absolute -top-1.5 -bottom-1.5 flex flex-col items-center z-20 transition-all duration-700"
                    style={{ left: `calc(${progressPercentage}% - 6px)` }}
                  >
                    <div className="w-3.5 h-full rounded-full bg-ink border-2 border-white shadow-md" />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-6 mt-6 border-t border-line/70">
                  <div className="p-3.5 rounded-2xl bg-[#fcf9fa] border border-line">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted block">
                      Fertile Window
                    </span>
                    <span className="text-[14px] font-bold text-ink tabular-nums mt-1 block">
                      {cycleStatus.fertileStart && cycleStatus.ovulation
                        ? `${format(cycleStatus.fertileStart, "MMM d")} – ${format(cycleStatus.ovulation, "MMM d")}`
                        : "—"}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#fcf9fa] border border-line">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted block">
                      Target Ovulation
                    </span>
                    <span className="text-[14px] font-bold text-ink tabular-nums mt-1 block">
                      {cycleStatus.ovulation
                        ? format(cycleStatus.ovulation, "MMM do")
                        : "—"}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#fff8fa] border border-[#f4c2c2]">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#a55f78] block">
                      Cycle Cadence
                    </span>
                    <span className="text-[14px] font-bold text-[#a55f78] tabular-nums mt-1 block">
                      {cycleStatus.dynamicCycle} Days
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#fcf9fa] border border-line">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted block">
                      Bleed Duration
                    </span>
                    <span className="text-[14px] font-bold text-ink tabular-nums mt-1 block">
                      {cycleStatus.periodLength} Days
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT 4 COLUMNS: CONNECTED DAILY CHECK-IN LEDGER */}
          
          <div className="lg:col-span-4 p-6 sm:p-8 bg-[#fcf9fa] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 pb-4 mb-5 border-b border-line/80">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a55f78] block">
                    Daily Check-In Ledger
                  </span>
                  <h3 className="text-[16px] font-bold text-ink tracking-tight mt-0.5">
                    Today&apos;s Observations
                  </h3>
                </div>
                {quickSavedToast ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#a55f78] bg-[#fff0f3] border border-[#f4c2c2] px-2.5 py-0.5 rounded-full">
                    <Check className="w-3 h-3" strokeWidth={2} />
                    {quickSavedToast}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-muted tabular-nums">
                    {format(today, "MMM dd")}
                  </span>
                )}
              </div>

              <div className="mb-5">
                <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted mb-2.5">
                  Affective State
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_MOODS.map((label) => {
                    const selected = activeMoodList.includes(label);
                    return (
                      <button
                        key={label}
                        type="button"
                        disabled={quickSaving}
                        onClick={() => handleQuickLogUpdate("mood", label)}
                        className={`px-3 py-1.5 rounded-lg text-[11.5px] font-semibold border transition-all cursor-pointer ${
                          selected
                            ? "bg-[#a55f78] text-white border-[#a55f78]"
                            : "bg-white text-ink border-line hover:border-[#d990a8]"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted mb-2.5">
                  Menstrual Flow Volume
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_FLOWS.map((f) => {
                    const selected = todayLog?.flow === f;
                    return (
                      <button
                        key={f}
                        type="button"
                        disabled={quickSaving}
                        onClick={() => handleQuickLogUpdate("flow", f)}
                        className={`px-3 py-1.5 rounded-lg text-[11.5px] font-semibold border transition-all cursor-pointer ${
                          selected
                            ? "bg-[#d990a8] text-white border-[#d990a8]"
                            : "bg-white text-muted border-line hover:text-ink"
                        }`}
                      >
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-line space-y-2.5 text-[12px]">
                <div className="flex justify-between items-center">
                  <span className="text-muted">Physical Symptoms</span>
                  <span className="font-bold text-ink tabular-nums">
                    {todayLog?.symptoms?.length > 0
                      ? `${todayLog.symptoms.length} logged`
                      : "None recorded"}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-line/60">
                  <span className="text-muted">Daily Notes &amp; Cravings</span>
                  <span className="font-bold text-ink truncate max-w-[150px]">
                    {todayLog?.cravings ||
                      (todayLog?.note ? "Entry saved" : "Unrecorded")}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href={`/log?date=${todayStr}`}
              className="mt-6 w-full py-3.5 px-4 bg-[#d990a8] hover:brightness-95 text-white font-bold text-[12.5px] rounded-xl transition-all flex items-center justify-between shadow-2xs"
            >
              <span>Open Complete Clinical Check-In</span>
              <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. INNER-SEASON PHYSIOLOGICAL DOSSIER & DAILY RITUAL LEDGER */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white border border-line rounded-[28px] p-6 sm:p-8 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4 pb-5 mb-6 border-b border-line/70">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a55f78] block">
                  Endocrine Care Dossier
                </span>
                <h3
                  style={{
                    fontFamily:
                      "'Georgia', 'Cambria', 'Times New Roman', serif",
                  }}
                  className="text-[20px] sm:text-[22px] font-normal text-ink tracking-tight mt-0.5"
                >
                  Physiological Guidance for {cycleStatus.phase}
                </h3>
              </div>

              <div className="flex flex-wrap gap-1 bg-[#fcf9fa] border border-line rounded-xl p-1">
                {(
                  [
                    { id: "nourish", num: "01", label: "Nourishment" },
                    { id: "movement", num: "02", label: "Movement" },
                    { id: "skin", num: "03", label: "Dermal Care" },
                    { id: "mind", num: "04", label: "Cognition" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setConciergeTab(tab.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      conciergeTab === tab.id
                        ? "bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2]"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    <span className="opacity-60 tabular-nums">{tab.num}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-[#fcf9fa] border border-line space-y-3.5">
              <div className="text-[14px] font-bold text-[#a55f78] tracking-tight">
                {conciergeTab === "nourish"
                  ? activeGuide.nourishTitle
                  : conciergeTab === "movement"
                    ? activeGuide.movementTitle
                    : conciergeTab === "skin"
                      ? activeGuide.skinGlowTitle
                      : activeGuide.mindFocusTitle}
              </div>

              <ul className="space-y-3">
                {(conciergeTab === "nourish"
                  ? activeGuide.nourishTips
                  : conciergeTab === "movement"
                    ? activeGuide.movementTips
                    : conciergeTab === "skin"
                      ? activeGuide.skinGlowTips
                      : activeGuide.mindFocusTips
                ).map((tip, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-[13px] text-ink leading-relaxed"
                  >
                    <span className="text-[10px] font-extrabold text-[#a55f78] bg-[#fff0f3] border border-[#f4c2c2] rounded px-1.5 py-0.5 tabular-nums shrink-0 mt-0.5">
                      0{i + 1}
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-line/70">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-muted">
                Three-Cycle Forward Projection
              </span>
              <Link
                href="/calendar"
                className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#a55f78] hover:underline"
              >
                <span>Full Calendar</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {upcomingCycles.map((cyc) => (
                <div
                  key={cyc.label}
                  className="p-3.5 rounded-xl bg-[#fcf9fa] border border-line flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                    <span>{cyc.label}</span>
                    <span className="text-[#a55f78] tabular-nums">
                      {cyc.indexLabel}
                    </span>
                  </div>
                  <div className="text-[13.5px] font-bold text-ink tabular-nums">
                    {cyc.bleedRange}
                  </div>
                  <div className="text-[11px] text-muted mt-1 tabular-nums">
                    Ovulation Window: ~{cyc.ovulationDate}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-line rounded-[28px] p-6 sm:p-8 shadow-soft flex flex-col justify-between space-y-6">
          <div>
            <div className="pb-5 mb-5 border-b border-line/70">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a55f78] block">
                Daily Practice &amp; Hydration
              </span>
              <h3
                style={{
                  fontFamily: "'Georgia', 'Cambria', 'Times New Roman', serif",
                }}
                className="text-[20px] sm:text-[22px] font-normal text-ink tracking-tight mt-0.5"
              >
                Sanctuary Rituals
              </h3>
            </div>

            <div className="p-4 rounded-2xl bg-[#fcf9fa] border border-line mb-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[12px] font-bold text-ink block">
                    Cellular Hydration Cadence
                  </span>
                  <span className="text-[11px] text-muted">
                    Select segments to log 250 ml increments
                  </span>
                </div>
                <span className="text-[12px] font-extrabold text-[#a55f78] tabular-nums">
                  {waterGlasses * 250} / 2,000 ml
                </span>
              </div>

              <div className="grid grid-cols-8 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((seg) => {
                  const active = seg <= waterGlasses;
                  return (
                    <button
                      key={seg}
                      type="button"
                      onClick={() => {
                        const next = waterGlasses === seg ? seg - 1 : seg;
                        setWaterGlasses(next);
                        saveLocalRituals(next, checkedRituals);
                      }}
                      className={`h-8 rounded-lg border text-[10px] font-bold tabular-nums transition-all cursor-pointer ${
                        active
                          ? "bg-[#a55f78] text-white border-[#a55f78]"
                          : "bg-white text-muted border-line hover:border-[#d990a8]"
                      }`}
                      title={`${seg * 250} ml`}
                    >
                      {seg}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted mb-2">
                Recommended {cycleStatus.phase} Practices
              </div>
              {activeGuide.rituals.map((ritual, idx) => {
                const done = Boolean(checkedRituals[idx]);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const next = { ...checkedRituals, [idx]: !done };
                      setCheckedRituals(next);
                      saveLocalRituals(waterGlasses, next);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                      done
                        ? "bg-[#fff0f3] border-[#f4c2c2] text-[#a55f78]"
                        : "bg-[#fcf9fa] border-line text-ink hover:border-[#d990a8]"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        done
                          ? "bg-[#a55f78] border-[#a55f78] text-white"
                          : "bg-white border-line"
                      }`}
                    >
                      {done && <Check className="w-3 h-3" strokeWidth={2.5} />}
                    </span>
                    <span
                      className={`text-[12.5px] font-medium leading-snug ${
                        done ? "line-through opacity-70" : ""
                      }`}
                    >
                      {ritual}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#fff8fa] border border-[#f4c2c2]/80 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a55f78]">
                <BookOpen className="w-3 h-3" />
                <span>Personal Journal Studio</span>
              </div>
              <div className="text-[13px] font-bold text-ink truncate mt-1">
                {latestJournal
                  ? latestJournal.title
                  : "Begin a reflection on ruled stationery"}
              </div>
            </div>
            <Link
              href="/journal"
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#f4c2c2] text-[11.5px] font-bold text-[#a55f78] hover:bg-[#fff0f3] transition-colors"
            >
              <span>Studio</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. RECENT 7-DAY CLINICAL LEDGER & SANCTUARY DIRECTORY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 bg-white border border-line rounded-[28px] p-7 sm:p-9 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-5 mb-6 border-b border-line/70">
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#a55f78] block">
                  Recent Observations
                </span>
                <h3
                  style={{
                    fontFamily:
                      "'Georgia', 'Cambria', 'Times New Roman', serif",
                  }}
                  className="text-[22px] font-normal text-ink tracking-tight mt-0.5"
                >
                  Seven-Day Cycle Ledger
                </h3>
              </div>
              <Link
                href="/history"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#fcf9fa] border border-line text-[12px] font-bold text-[#a55f78] hover:border-[#d990a8] transition-colors"
              >
                <span>Complete Archive</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentLogs.length > 0 ? (
              <div className="space-y-3">
                {recentLogs.map((log, i) => {
                  const symList: string[] = Array.isArray(log.symptoms)
                    ? log.symptoms
                    : [];
                  const previewSyms = symList.slice(0, 2).join(", ");
                  const extraCount =
                    symList.length > 2 ? symList.length - 2 : 0;

                  return (
                    <Link
                      key={i}
                      href={`/log?date=${log.log_date}`}
                      className="p-4 rounded-2xl bg-[#fcf9fa] border border-line hover:border-[#d990a8] flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 ${
                            log.flow && log.flow !== "No bleeding"
                              ? "bg-[#fff0f3] border-[#f4c2c2] text-[#a55f78]"
                              : "bg-white border-line text-muted group-hover:text-[#a55f78]"
                          }`}
                        >
                          {log.flow && log.flow !== "No bleeding" ? (
                            <Droplet className="w-4 h-4" strokeWidth={1.75} />
                          ) : (
                            <Activity className="w-4 h-4" strokeWidth={1.75} />
                          )}
                        </div>
                        <div>
                          <span className="text-[15px] font-bold text-ink block tabular-nums">
                            {format(parseISO(log.log_date), "EEEE, MMMM d")}
                          </span>
                          <span className="text-[12px] text-muted mt-0.5 block">
                            {previewSyms
                              ? `${previewSyms}${extraCount > 0 ? ` +${extraCount} more` : ""}`
                              : "Tap to view or update daily record"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
                        {log.flow && (
                          <span className="px-3 py-1 rounded-full bg-[#fff0f3] border border-[#f4c2c2] text-[#a55f78] font-bold">
                            Flow: {log.flow}
                          </span>
                        )}
                        {log.mood && (
                          <span className="px-3 py-1 rounded-full bg-white border border-line text-ink font-semibold">
                            Mood: {log.mood.split(",")[0]}
                          </span>
                        )}
                        {symList.length > 0 && (
                          <span className="px-3 py-1 rounded-full bg-white border border-line text-muted font-semibold tabular-nums">
                            {symList.length}{" "}
                            {symList.length === 1 ? "symptom" : "symptoms"}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-10 bg-[#fcf9fa] rounded-2xl border border-dashed border-line text-center">
                <p className="text-[13.5px] text-muted mb-3">
                  No daily check-ins recorded over the past seven days.
                </p>
                <Link
                  href={`/log?date=${todayStr}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#d990a8] text-white text-[12.5px] font-bold"
                >
                  <span>Record Today&apos;s Check-In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Columns: Sanctuary Directory */}
        <div className="lg:col-span-4 bg-white border border-line rounded-[28px] p-7 sm:p-9 shadow-soft flex flex-col justify-between">
          <div>
            <div className="pb-5 mb-6 border-b border-line/70">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#a55f78] block">
                Navigation Index
              </span>
              <h3
                style={{
                  fontFamily: "'Georgia', 'Cambria', 'Times New Roman', serif",
                }}
                className="text-[22px] font-normal text-ink tracking-tight mt-0.5"
              >
                Sanctuary Directory
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <Link
                href="/calendar"
                className="p-4 bg-[#fcf9fa] hover:bg-[#fff0f3] hover:border-[#d990a8] border border-line rounded-2xl transition-all flex flex-col justify-between min-h-[108px]"
              >
                <CalendarIcon
                  className="w-5 h-5 text-[#a55f78]"
                  strokeWidth={1.75}
                />
                <div>
                  <span className="text-[14px] font-bold text-ink block">
                    Calendar
                  </span>
                  <span className="text-[11.5px] text-muted mt-0.5 block">
                    Monthly cycle map
                  </span>
                </div>
              </Link>

              <Link
                href="/reports"
                className="p-4 bg-[#fcf9fa] hover:bg-[#fff0f3] hover:border-[#d990a8] border border-line rounded-2xl transition-all flex flex-col justify-between min-h-[108px]"
              >
                <PieChart
                  className="w-5 h-5 text-[#a55f78]"
                  strokeWidth={1.75}
                />
                <div>
                  <span className="text-[14px] font-bold text-ink block">
                    Analytics
                  </span>
                  <span className="text-[11.5px] text-muted mt-0.5 block">
                    Ruler &amp; phase ring
                  </span>
                </div>
              </Link>

              <Link
                href="/journal"
                className="p-4 bg-[#fcf9fa] hover:bg-[#fff0f3] hover:border-[#d990a8] border border-line rounded-2xl transition-all flex flex-col justify-between min-h-[108px]"
              >
                <Heart className="w-5 h-5 text-[#a55f78]" strokeWidth={1.75} />
                <div>
                  <span className="text-[14px] font-bold text-ink block">
                    Journal Studio
                  </span>
                  <span className="text-[11.5px] text-muted mt-0.5 block">
                    Stationery &amp; audio
                  </span>
                </div>
              </Link>

              <Link
                href="/self-care"
                className="p-4 bg-[#fcf9fa] hover:bg-[#fff0f3] hover:border-[#d990a8] border border-line rounded-2xl transition-all flex flex-col justify-between min-h-[108px]"
              >
                <Coffee className="w-5 h-5 text-[#a55f78]" strokeWidth={1.75} />
                <div>
                  <span className="text-[14px] font-bold text-ink block">
                    Self-Care
                  </span>
                  <span className="text-[11.5px] text-muted mt-0.5 block">
                    685 care guides
                  </span>
                </div>
              </Link>
            </div>
          </div>

          <Link
            href="/medical-report"
            className="mt-4 flex items-center justify-between p-4 bg-[#fff8fa] hover:bg-[#fff0f3] border border-[#f4c2c2] rounded-2xl transition-all"
          >
            <div className="flex items-center gap-3.5">
              <FileText
                className="w-5 h-5 text-[#a55f78] shrink-0"
                strokeWidth={1.75}
              />
              <div>
                <span className="text-[13.5px] font-bold text-ink block leading-tight">
                  Clinical Physician Dossier
                </span>
                <span className="text-[11.5px] text-muted mt-0.5 block">
                  Export OB-GYN cycle &amp; symptom PDF
                </span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-[#a55f78] shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  );
}
