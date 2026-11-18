"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  format,
  differenceInCalendarDays,
  addDays,
  subDays,
  parseISO,
  startOfDay,
} from "date-fns";
import {
  Bell,
  Save,
  Loader2,
  VolumeX,
  Volume2,
  Clock,
  Sparkles,
  ShieldCheck,
  Trash2,
  Check,
  Send,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Timer,
  AlarmClock,
  X,
} from "lucide-react";

type AcousticTone =
  | "velvet_harp"
  | "singing_bowl"
  | "kalimba_drop"
  | "raindrop_chime"
  | "music_box"
  | "solfeggio528"
  | "whisper_bell"
  | "silent";

interface SoundOption {
  id: AcousticTone;
  name: string;
  desc: string;
}

const SOFT_SOUND_LIBRARY: SoundOption[] = [
  {
    id: "velvet_harp",
    name: "Velvet Harp",
    desc: "Warm, plucked 3-note harp arpeggio",
  },

  {
    id: "singing_bowl",
    name: "Singing Bowl",
    desc: "Deep 432Hz sanctuary resonance",
  },

  {
    id: "kalimba_drop",
    name: "Rosewood Kalimba",
    desc: "Gentle wooden thumb-piano chime",
  },

  {
    id: "raindrop_chime",
    name: "Morning Raindrop",
    desc: "Soft double water-droplet tone",
  },

  {
    id: "music_box",
    name: "Music Box Lullaby",
    desc: "Delicate celesta three-note melody",
  },

  {
    id: "solfeggio528",
    name: "528Hz Soft Bloom",
    desc: "Warm, breath-like harmonic swell",
  },

  {
    id: "whisper_bell",
    name: "Silk Whisper Bell",
    desc: "Ultra-quiet single evening tone",
  },

  {
    id: "silent",
    name: "Silent Visual",
    desc: "Visual banner only, zero audio",
  },
];

interface HealthTimerPreset {
  id: string;
  code: string;
  title: string;
  durationSec: number;
  tag: string;
  benefit: string;
}

const HEALTH_TIMER_PRESETS: HealthTimerPreset[] = [
  {
    id: "preset-heat",
    code: "T-01",
    title: "Heating Pad Cramp Relief",
    durationSec: 20 * 60,
    tag: "20 Mins • Pelvic Warmth",
    benefit:
      "Relaxes contracting uterine muscles and boosts pelvic blood flow.",
  },

  {
    id: "preset-tea",
    code: "T-02",
    title: "Herbal Tea Covered Steep",
    durationSec: 8 * 60,
    tag: "8 Mins • Raspberry / Ginger",
    benefit: "Optimal steep window to extract cramp-soothing plant oils.",
  },

  {

    id: "preset-legs",
    code: "T-03",
    title: "Legs-Up-The-Wall De-Bloat",
    durationSec: 10 * 60,
    tag: "10 Mins • Circulation",
    benefit:
      "Drains pooled fluid from ankles and pelvis while calming heart rate.",
  },

  {
    id: "preset-nap",
    code: "T-04",
    title: "Luteal Power Nap",
    durationSec: 20 * 60,
    tag: "20 Mins • Energy Reset",
    benefit: "Recharges brain energy without entering groggy deep sleep.",
  },

  {
    id: "preset-walk",
    code: "T-05",
    title: "Post-Meal Blood-Sugar Walk",
    durationSec: 12 * 60,
    tag: "12 Mins • Digestion",
    benefit: "Helps muscles absorb glucose smoothly to prevent mood crashes.",
  },

  {
    id: "preset-breath",
    code: "T-06",
    title: "Nervous System Breath Reset",
    durationSec: 5 * 60,
    tag: "5 Mins • Vagus Nerve",
    benefit:
      "Slow belly breathing to lower cortisol and ease pre-moonday anxiety.",
  },

  {
    id: "preset-soak",
    code: "T-07",
    title: "Warm Epsom Magnesium Soak",
    durationSec: 15 * 60,
    tag: "15 Mins • Sleep Prep",
    benefit: "Soothes full-body aches and warms feet for faster sleep onset.",
  },

  {
    id: "preset-pelvic",
    code: "T-08",
    title: "Pelvic Floor & Hip Unwind",
    durationSec: 7 * 60,
    tag: "7 Mins • Mobility",
    benefit:
      "Child's pose and gentle hip stretches to release lower-back tension.",
  },

  {

    id: "preset-eyes",
    code: "T-09",
    title: "Eye & Migraine Screen Break",
    durationSec: 20 * 60,
    tag: "20 Mins • Visual Rest",
    benefit: "Prevents hormone-drop headaches and dry eyes during screen work.",
  },

  {
    id: "preset-pad",
    code: "T-10",
    title: "Pad / Cup Hygiene Check",
    durationSec: 180 * 60,
    tag: "3 Hours • Moonday Care",
    benefit: "Gentle reminder to refresh your pad, tampon, or menstrual cup.",
  },

];

interface CustomAlarmItem {
  id: string;
  label: string;
  time: string;
  tag: string;
  enabled: boolean;
}


const DEFAULT_CUSTOM_ALARMS: CustomAlarmItem[] = [
  {
    id: "alm-1",
    label: "Morning Warm Lemon Water",
    time: "07:30",
    tag: "Hydration & Digestion",
    enabled: true,
  },

  {
    id: "alm-2",
    label: "Afternoon Posture & Stretch Break",
    time: "15:30",
    tag: "Spine & Pelvic Relief",
    enabled: true,
  },

  {
    id: "alm-3",
    label: "Evening Herbal Tea & Journal",
    time: "21:15",
    tag: "Night Unwind",
    enabled: true,
  },

];


interface AlertChannelConfig {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  category: "Cycle & Moonday Alerts" | "Daily Self-Care" | "Body & Sleep Rhythm";
  enabled: boolean;
  triggerTime: string;
  leadDays?: number;
  intervalMins?: number;
  testTitle: string;
  testBody: string;
}

interface SupplementItem {
  id: string;
  name: string;
  dosage: string;
  time: string;
  phaseNote: string;
}


const DEFAULT_CHANNELS: AlertChannelConfig[] = [
  {
    id: "moonday_onset",
    code: "01",
    title: "Upcoming Moonday Reminder",
    subtitle: "Gentle heads-up before your next Moonday is expected to start.",
    category: "Cycle & Moonday Alerts",
    enabled: true,
    triggerTime: "08:30",
    leadDays: 2,
    testTitle: "Upcoming Moonday Reminder",
    testBody:
      "Your next Moonday is expected in 2 days. Time to stock up on herbal tea, comfort snacks, and protection.",
  },

  {
    id: "ovulatory_window",
    code: "02",
    title: "Fertile & Ovulation Window",
    subtitle: "Notifies you when rising estrogen opens your mid-cycle peak.",
    category: "Cycle & Moonday Alerts",
    enabled: true,
    triggerTime: "09:00",
    leadDays: 1,
    testTitle: "Inner Summer • Fertile Window",
    testBody:
      "You are entering your ovulatory window—your natural energy, confidence, and hydration needs are at their peak.",
  },

  {
    id: "luteal_boundary",
    code: "03",
    title: "Pre-Moonday Rest & Nesting Cue",
    subtitle:
      "Reminds you 5 days before your Moonday to slow down and eat nourishing carbs.",
    category: "Cycle & Moonday Alerts",
    enabled: true,
    triggerTime: "18:00",
    leadDays: 5,
    testTitle: "Inner Autumn • Luteal Self-Care",
    testBody:
      "Your body is burning extra energy this week. Be gentle with your schedule and enjoy complex carbs without guilt.",
  },
  {
    id: "daily_ledger",
    code: "04",
    title: "Evening Daily Check-In",
    subtitle: "A calm evening nudge to log your mood, flow, and symptoms.",
    category: "Daily Self-Care",
    enabled: true,
    triggerTime: "20:30",
    testTitle: "Evening Sanctuary Check-In",
    testBody:
      "Take 60 quiet seconds to log how your body and heart felt today.",
  },

  {
    id: "hydration_cadence",
    code: "05",
    title: "Gentle Water & Hydration Nudge",
    subtitle: "Repeating daytime reminder to sip water or warm herbal tea.",
    category: "Daily Self-Care",
    enabled: true,
    triggerTime: "10:00",
    intervalMins: 120,
    testTitle: "Hydration Sanctuary Check-In",
    testBody:
      "Pause for a tall glass of water or warm herbal infusion to keep your energy and skin glowing.",
  },

  {
    id: "endocrine_protocol",
    code: "06",
    title: "Daily Vitamin & Pill Reminder",
    subtitle:
      "Time-locked alert for your daily vitamins, iron, or birth control.",
    category: "Body & Sleep Rhythm",
    enabled: true,
    triggerTime: "09:30",
    testTitle: "Daily Vitamin & Supplement Cue",
    testBody: "Time for your scheduled morning vitamins or cycle support.",
  },

  {
    id: "bbt_morning",
    code: "07",
    title: "Morning Basal Temperature Check",
    subtitle:
      "First-morning cue to check temperature before getting out of bed.",
    category: "Body & Sleep Rhythm",
    enabled: false,
    triggerTime: "07:00",
    testTitle: "Morning Temperature Check",
    testBody:
      "Good morning, beautiful. Measure your basal temperature before rising.",
  },

  {
    id: "circadian_winddown",
    code: "08",
    title: "Evening Wind-Down & Screen Dim",
    subtitle: "Nightly prompt to dim bright lights and prepare for deep sleep.",
    category: "Body & Sleep Rhythm",
    enabled: true,
    triggerTime: "21:45",
    testTitle: "Evening Sanctuary Wind-Down",
    testBody:
      "Time to dim your screens, put on warm lighting, and let your mind unwind for sleep.",
  },
];

const DEFAULT_SUPPLEMENTS: SupplementItem[] = [
  {
    id: "supp-mag",
    name: "Magnesium Bisglycinate",
    dosage: "300 mg",
    time: "21:00",
    phaseNote: "Relaxes cramps & supports deep sleep",
  },

  {
    id: "supp-iron",
    name: "Gentle Iron + Vitamin C",
    dosage: "25 mg",
    time: "09:00",
    phaseNote: "Rebuilds energy & iron stores",
  },

  {
    id: "supp-omega",
    name: "Omega-3 Fish / Flax Oil",
    dosage: "1,000 mg",
    time: "13:00",
    phaseNote: "Soothes inflammation & dry skin",
  },
];

const CHANNEL_CATEGORIES: Array<AlertChannelConfig["category"]> = [
  "Cycle & Moonday Alerts",
  "Daily Self-Care",
  "Body & Sleep Rhythm",
];


function playSoftSanctuaryChime(tone: AcousticTone, volumePct = 65) {
  if (typeof window === "undefined" || tone === "silent") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx: AudioContext = new AudioCtx();
    const masterGain = ctx.createGain();
    const safeVol = Math.max(0.02, Math.min(1, volumePct / 100)) * 0.24;
    masterGain.gain.setValueAtTime(safeVol, ctx.currentTime);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2200, ctx.currentTime);
    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    const playNote = (
      freq: number,
      startOffset: number,
      duration: number,
      wave: OscillatorType = "sine",
      noteGain = 1,
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);

      gain.gain.setValueAtTime(0.0001, ctx.currentTime + startOffset);
      gain.gain.linearRampToValueAtTime(
        noteGain,
        ctx.currentTime + startOffset + 0.045,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + startOffset + duration,
      );

      osc.connect(gain);
      gain.connect(filter);
      osc.start(ctx.currentTime + startOffset);
      osc.stop(ctx.currentTime + startOffset + duration + 0.05);
    };

    if (tone === "velvet_harp") {
      playNote(523.25, 0.0, 1.4, "triangle", 0.7);
      playNote(659.25, 0.14, 1.4, "sine", 0.8);
      playNote(783.99, 0.28, 1.5, "sine", 0.85);
      playNote(987.77, 0.42, 1.8, "sine", 0.65);
    } else if (tone === "singing_bowl") {
      playNote(432, 0.0, 2.4, "sine", 1.0);
      playNote(648, 0.02, 2.1, "sine", 0.45);
      playNote(864, 0.04, 1.6, "sine", 0.2);
    } else if (tone === "kalimba_drop") {
      playNote(528, 0.0, 0.9, "sine", 0.9);
      playNote(792, 0.16, 1.2, "triangle", 0.75);
    } else if (tone === "raindrop_chime") {
      playNote(698.46, 0.0, 0.7, "sine", 0.8);
      playNote(1046.5, 0.12, 1.1, "sine", 0.7);
    } else if (tone === "music_box") {
      playNote(659.25, 0.0, 0.9, "sine", 0.75);
      playNote(783.99, 0.22, 0.9, "sine", 0.75);
      playNote(1046.5, 0.44, 1.5, "sine", 0.85);
    } else if (tone === "solfeggio528") {
      playNote(264, 0.0, 2.0, "sine", 0.5);
      playNote(528, 0.05, 2.2, "sine", 0.9);
    } else if (tone === "whisper_bell") {
      playNote(493.88, 0.0, 1.5, "sine", 0.55);
    }

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 3000);
  } catch {}
}


function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Registers /moonday-sw.js, creates an encrypted Web Push subscription with /api/push,
 * and saves the subscription on the server so pushes work when the tab/browser is closed.
 */

async function getOrSubscribeWebPush(): Promise<PushSubscription | null> {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register("/moonday-sw.js");
    await navigator.serviceWorker.ready;

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const res = await fetch("/api/push");
      if (!res.ok) return null;
      const { publicKey } = await res.json();
      if (!publicKey) return null;

      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          publicKey,
        ) as unknown as BufferSource,
      });
    }

    await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "subscribe",
        subscription: sub.toJSON(),
      }),
    });

    return sub;
  } catch {
    return null;
  }
}

export default function RemindersClient() {
  const supabase = createClient();
  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const [saving, setSaving] = useState(false);
  const [statusBanner, setStatusBanner] = useState("");
  const [permission, setPermission] = useState<string>("default");
  const [swReady, setSwReady] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("--:--:--");


  const [liveToast, setLiveToast] = useState<{
    title: string;
    body: string;
    time: string;
  } | null>(null);

  const [channels, setChannels] =
    useState<AlertChannelConfig[]>(DEFAULT_CHANNELS);

  // Active Health Timer State

  const [activeTimerLabel, setActiveTimerLabel] = useState(
    "Heating Pad Cramp Relief",
  );
  const [timerTotalSec, setTimerTotalSec] = useState(20 * 60);
  const [timerRemainingSec, setTimerRemainingSec] = useState(20 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  // Custom Timer Builder Inputs

  const [customTimerLabel, setCustomTimerLabel] = useState("");
  const [customHours, setCustomHours] = useState(0);
  const [customMins, setCustomMins] = useState(15);
  const [customSecs, setCustomSecs] = useState(0);

  // Custom Alarms State

  const [customAlarms, setCustomAlarms] = useState<CustomAlarmItem[]>(
    DEFAULT_CUSTOM_ALARMS,
  );
  const [newAlarmLabel, setNewAlarmLabel] = useState("");
  const [newAlarmTime, setNewAlarmTime] = useState("08:00");
  const [newAlarmTag, setNewAlarmTag] = useState("Self-Care");

  const [quietStart, setQuietStart] = useState("22:30");
  const [quietEnd, setQuietEnd] = useState("07:00");
  const [acousticTone, setAcousticTone] = useState<AcousticTone>("velvet_harp");
  const [soundVolume, setSoundVolume] = useState<number>(65);

  const [hydrationCountdownSec, setHydrationCountdownSec] = useState(120 * 60);

  const [supplements, setSupplements] =
    useState<SupplementItem[]>(DEFAULT_SUPPLEMENTS);
  const [takenTodayMap, setTakenTodayMap] = useState<Record<string, boolean>>(
    {},
  );
  const [newSuppName, setNewSuppName] = useState("");
  const [newSuppDose, setNewSuppDose] = useState("");
  const [newSuppTime, setNewSuppTime] = useState("09:00");

  const [cycleForecast, setCycleForecast] = useState({
    nextMoondayDate: "Calibrating",
    nextOvulationDate: "Calibrating",
    daysUntilMoonday: 14,
  });

  // 1. Register Background Service Worker & Web Push Subscription on mount

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("Notification" in window) {
      setPermission(Notification.permission);
      if (Notification.permission === "granted") {
        getOrSubscribeWebPush().then((sub) => {
          setSwReady(Boolean(sub));
        });
      }
    }
  }, []);

  // 2. Load saved preferences safely

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedCfg = JSON.parse(
          localStorage.getItem("moonday_reminders_cockpit_v3") ||
            localStorage.getItem("moonday_reminders_cockpit_v2") ||
            "null",
        );
        if (savedCfg) {
          if (Array.isArray(savedCfg.channels)) {
            const mergedChannels = DEFAULT_CHANNELS.map((defCh) => {
              const found = savedCfg.channels.find(
                (sc: any) => sc.id === defCh.id,
              );
              if (!found) return defCh;
              return {
                ...defCh,
                enabled:
                  typeof found.enabled === "boolean"
                    ? found.enabled
                    : defCh.enabled,
                triggerTime: found.triggerTime || defCh.triggerTime,
                leadDays:
                  typeof found.leadDays === "number"
                    ? found.leadDays
                    : defCh.leadDays,
                intervalMins:
                  typeof found.intervalMins === "number"
                    ? found.intervalMins
                    : defCh.intervalMins,
              };
            });
            setChannels(mergedChannels);
          }
          if (savedCfg.quietStart) setQuietStart(savedCfg.quietStart);
          if (savedCfg.quietEnd) setQuietEnd(savedCfg.quietEnd);
          if (savedCfg.acousticTone) setAcousticTone(savedCfg.acousticTone);
          if (typeof savedCfg.soundVolume === "number")
            setSoundVolume(savedCfg.soundVolume);
          if (Array.isArray(savedCfg.supplements))
            setSupplements(savedCfg.supplements);
          if (Array.isArray(savedCfg.customAlarms))
            setCustomAlarms(savedCfg.customAlarms);
        }

        const savedTimer = JSON.parse(
          localStorage.getItem("moonday_active_health_timer") || "null",
        );
        if (savedTimer && savedTimer.endTs > Date.now()) {
          const left = Math.max(
            1,
            Math.round((savedTimer.endTs - Date.now()) / 1000),
          );
          setActiveTimerLabel(savedTimer.label || "Health Timer");
          setTimerTotalSec(savedTimer.totalSec || left);
          setTimerRemainingSec(left);
          setTimerRunning(true);
        }

        const savedTaken = JSON.parse(
          localStorage.getItem(`moonday_supp_taken_${todayStr}`) || "{}",
        );
        setTakenTodayMap(savedTaken);
      } catch {}
    }

    async function loadCycleForecast() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.user_metadata?.reminder_preferences) {
          supabase.auth.updateUser({ data: { reminder_preferences: null } });
        }
      });
      
      const [{ data: profile }, { data: starts }] = await Promise.all([
        supabase
          .from("profiles")
          .select("cycle_length, luteal_phase_length")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("daily_logs")
          .select("log_date")
          .eq("user_id", user.id)
          .eq("is_period_start", true)
          .lte("log_date", todayStr)
          .order("log_date", { ascending: true }),
      ]);

      const cycleLen = Number(profile?.cycle_length) || 28;
      const lutealLen = Number(profile?.luteal_phase_length) || 14;

      if (starts && starts.length > 0) {
        const lastStart = startOfDay(
          parseISO(starts[starts.length - 1].log_date),
        );
        const nextPeriod = addDays(lastStart, cycleLen);
        const nextOvul = subDays(nextPeriod, lutealLen);
        const daysLeft = differenceInCalendarDays(
          nextPeriod,
          startOfDay(new Date()),
        );

        setCycleForecast({
          nextMoondayDate: format(nextPeriod, "MMM d, yyyy"),
          nextOvulationDate: format(nextOvul, "MMM d, yyyy"),
          daysUntilMoonday: daysLeft,
        });
      }
    }
    loadCycleForecast();
  }, [supabase, todayStr]);

  const isQuietHoursActive = useMemo(() => {
    const now = format(new Date(), "HH:mm");
    if (quietStart <= quietEnd) {
      return now >= quietStart && now <= quietEnd;
    }
    return now >= quietStart || now <= quietEnd;
  }, [quietStart, quietEnd, currentTimeStr]);

  // 3. Immediate Notification & Web Push Dispatcher

  const dispatchNotification = useCallback(
    async (title: string, body: string, isManualOrTimer = false) => {
      if (isQuietHoursActive && !isManualOrTimer) return;

      playSoftSanctuaryChime(acousticTone, soundVolume);
      setLiveToast({
        title,
        body,
        time: format(new Date(), "h:mm a"),
      });

      if (typeof window === "undefined" || !("Notification" in window)) {
        return;
      }

      let currentPerm = Notification.permission;
      if (isManualOrTimer && currentPerm !== "granted") {
        currentPerm = await Notification.requestPermission();
        setPermission(currentPerm);
      }

      if (currentPerm === "granted") {
        const sub = await getOrSubscribeWebPush();
        if (sub) setSwReady(true);

        // Dispatch real Web Push packet from /api/push

        const pushed = await fetch("/api/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "send_test",
            title,
            body,
          }),
        })
          .then((r) => r.ok)
          .catch(() => false);

        if (!pushed && "serviceWorker" in navigator) {
          try {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg) {
              await reg.showNotification(title, {
                body,
                icon: "/icon.png",
                badge: "/icon.png",
              });
            }
          } catch {}
        }
      }
    },
    [isQuietHoursActive, acousticTone, soundVolume],
  );

  // 4. Sync all active Timers, Alarms, Supplements & Cycle Channels to the Server Push Daemon (/api/push)

  const syncSchedulesToServer = useCallback(
    async (
      activeChans: AlertChannelConfig[],
      activeSupps: SupplementItem[],
      activeAlarms: CustomAlarmItem[],
    ) => {
      if (typeof window === "undefined") return;
      try {
        const sub =
          "Notification" in window && Notification.permission === "granted"
            ? await getOrSubscribeWebPush()
            : null;
        if (sub) setSwReady(true);

        const serverSchedules: Array<{
          id: string;
          title: string;
          body: string;
          type: "once" | "daily" | "interval";
          fireAt?: number;
          timeHHMM?: string;
          intervalMins?: number;
          nextIntervalAt?: number;
        }> = [];

        activeChans.forEach((ch) => {
          if (!ch.enabled) return;
          if (ch.id === "hydration_cadence") {
            const savedTarget = Number(
              localStorage.getItem("moonday_next_hydration_ts") || 0,
            );
            serverSchedules.push({
              id: `hyd-${ch.id}`,
              title: ch.testTitle,
              body: ch.testBody,
              type: "interval",
              intervalMins: ch.intervalMins || 120,
              nextIntervalAt:
                savedTarget > Date.now()
                  ? savedTarget
                  : Date.now() + (ch.intervalMins || 120) * 60 * 1000,
            });
          } else {
            serverSchedules.push({
              id: `ch-${ch.id}`,
              title: ch.testTitle,
              body: ch.testBody,
              type: "daily",
              timeHHMM: ch.triggerTime,
            });
          }
        });

        activeSupps.forEach((s) => {
          serverSchedules.push({
            id: `supp-${s.id}`,
            title: `Vitamin Reminder • ${s.name}`,
            body: `Time for your ${s.dosage} of ${s.name} (${s.phaseNote}).`,
            type: "daily",
            timeHHMM: s.time,
          });
        });

        activeAlarms.forEach((alm) => {
          if (!alm.enabled) return;
          serverSchedules.push({
            id: `alm-${alm.id}`,
            title: `Sanctuary Alarm • ${alm.label}`,
            body: `Scheduled ${alm.tag} alarm (${alm.time}).`,
            type: "daily",
            timeHHMM: alm.time,
          });
        });

        const savedTimer = JSON.parse(
          localStorage.getItem("moonday_active_health_timer") || "null",
        );
        if (savedTimer && savedTimer.endTs > Date.now()) {
          serverSchedules.push({
            id: "active-health-timer",
            title: `Health Timer Complete • ${savedTimer.label}`,
            body: `Your ${savedTimer.label} session has finished!`,
            type: "once",
            fireAt: savedTimer.endTs,
          });
        }

        await fetch("/api/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "sync_schedules",
            subscription: sub ? sub.toJSON() : undefined,
            schedules: serverSchedules,
            quietStart,
            quietEnd,
          }),
        });
      } catch {}
    },
    [quietStart, quietEnd],
  );

  useEffect(() => {
    syncSchedulesToServer(channels, supplements, customAlarms);
  }, [channels, supplements, customAlarms, syncSchedulesToServer]);

  // 5. Schedule a 10-second Closed-Tab Web Push Test

  const handleClosedTabPushTest = async () => {

    if (typeof window === "undefined" || !("Notification" in window)) return;
    let perm = Notification.permission;
    if (perm !== "granted") {
      perm = await Notification.requestPermission();
      setPermission(perm);
    }
    if (perm !== "granted") {
      setStatusBanner(
        "Please allow browser notifications first so background Web Push can reach your desktop.",
      );
      return;
    }

    const sub = await getOrSubscribeWebPush();
    setSwReady(Boolean(sub));

    await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send_test",
        delaySec: 10,
        title: "Closed-Tab Web Push Verified!",
        body: "MoonDay pushed this notification from the server while your tab was closed.",
      }),
    });

    playSoftSanctuaryChime(acousticTone, soundVolume);
    setStatusBanner(
      "10-Second Background Push Armed! Close this MoonDay tab right now—your notification will pop up in 10 seconds.",
    );
  };

  // Start or Load Pre-Defined Health Timer

  const startHealthTimer = async (label: string, durationSeconds: number) => {
    const safeSec = Math.max(5, durationSeconds);
    setActiveTimerLabel(label);
    setTimerTotalSec(safeSec);
    setTimerRemainingSec(safeSec);
    setTimerRunning(true);

    if (typeof window !== "undefined") {
      if ("Notification" in window && Notification.permission === "default") {
        const perm = await Notification.requestPermission();
        setPermission(perm);
      }
      const endTs = Date.now() + safeSec * 1000;
      localStorage.setItem(
        "moonday_active_health_timer",
        JSON.stringify({
          label,
          totalSec: safeSec,
          endTs,
        }),
      );
    }
    await syncSchedulesToServer(channels, supplements, customAlarms);
  };

  const handleToggleTimerPause = async () => {
    if (timerRunning) {
      setTimerRunning(false);
      localStorage.removeItem("moonday_active_health_timer");
      await syncSchedulesToServer(channels, supplements, customAlarms);
    } else {
      const safeSec = timerRemainingSec > 0 ? timerRemainingSec : timerTotalSec;
      setTimerRemainingSec(safeSec);
      setTimerRunning(true);
      const endTs = Date.now() + safeSec * 1000;
      localStorage.setItem(
        "moonday_active_health_timer",
        JSON.stringify({
          label: activeTimerLabel,
          totalSec: timerTotalSec,
          endTs,
        }),
      );
      await syncSchedulesToServer(channels, supplements, customAlarms);
    }
  };

  const handleResetTimer = async () => {
    setTimerRunning(false);
    setTimerRemainingSec(timerTotalSec);
    localStorage.removeItem("moonday_active_health_timer");
    await syncSchedulesToServer(channels, supplements, customAlarms);
  };

  const handleStartCustomTimer = (e: React.FormEvent) => {
    e.preventDefault();
    const total =
      Math.max(0, Number(customHours) || 0) * 3600 +
      Math.max(0, Number(customMins) || 0) * 60 +
      Math.max(0, Number(customSecs) || 0);
    if (total <= 0) return;
    const label = customTimerLabel.trim() || "Custom Health Timer";
    startHealthTimer(label, total);
    setCustomTimerLabel("");
  };

  const hydrationChannel = useMemo(
    () => channels.find((c) => c.id === "hydration_cadence"),
    [channels],
  );

  useEffect(() => {
    if (typeof window === "undefined" || !hydrationChannel) return;
    const intervalMs = (hydrationChannel.intervalMins || 120) * 60 * 1000;
    const existing = Number(
      localStorage.getItem("moonday_next_hydration_ts") || 0,
    );
    if (!existing || existing < Date.now()) {
      const nextTs = Date.now() + intervalMs;
      localStorage.setItem("moonday_next_hydration_ts", String(nextTs));
    }
  }, [hydrationChannel?.intervalMins, hydrationChannel?.enabled]);

  // Master Second-by-Second Tick Engine (For in-app chime + live countdown when tab is open)

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTimeStr(format(now, "h:mm:ss a"));
      const currentHHMM = format(now, "HH:mm");
      const dateKey = format(now, "yyyy-MM-dd");

      // 1. Active Health Timer Countdown Check
      if (timerRunning) {
        const savedTimer = JSON.parse(
          localStorage.getItem("moonday_active_health_timer") || "null",
        );
        if (savedTimer && savedTimer.endTs) {
          const left = Math.max(
            0,
            Math.round((savedTimer.endTs - Date.now()) / 1000),
          );
          setTimerRemainingSec(left);
          if (left <= 0) {
            setTimerRunning(false);
            localStorage.removeItem("moonday_active_health_timer");
            playSoftSanctuaryChime(acousticTone, soundVolume);
            setLiveToast({
              title: `Health Timer Complete • ${savedTimer.label}`,
              body: `Your ${savedTimer.label} countdown has finished.`,
              time: format(new Date(), "h:mm a"),
            });
          }
        }
      }

      // 2. Hydration Interval Countdown Check

      if (hydrationChannel?.enabled) {
        const intervalMs = (hydrationChannel.intervalMins || 120) * 60 * 1000;
        let targetTs = Number(
          localStorage.getItem("moonday_next_hydration_ts") || 0,
        );
        if (!targetTs) {
          targetTs = Date.now() + intervalMs;
          localStorage.setItem("moonday_next_hydration_ts", String(targetTs));
        }

        const remainingSec = Math.max(
          0,
          Math.round((targetTs - Date.now()) / 1000),
        );
        setHydrationCountdownSec(remainingSec);

        if (Date.now() >= targetTs) {
          const nextTs = Date.now() + intervalMs;
          localStorage.setItem("moonday_next_hydration_ts", String(nextTs));
          playSoftSanctuaryChime(acousticTone, soundVolume);
          setLiveToast({
            title: hydrationChannel.testTitle,
            body: hydrationChannel.testBody,
            time: format(new Date(), "h:mm a"),
          });
        }
      }

      // 3. Exact HH:mm Time-Locked Channels, Custom Alarms & Supplements

      let firedMap: Record<string, boolean> = {};
      try {
        firedMap = JSON.parse(
          localStorage.getItem(`moonday_fired_log_${dateKey}`) || "{}",
        );
      } catch {}

      let updatedFired = false;

      channels.forEach((ch) => {
        if (!ch.enabled || ch.id === "hydration_cadence") return;
        const fireKey = `ch_${ch.id}_${currentHHMM}`;
        if (ch.triggerTime === currentHHMM && !firedMap[fireKey]) {
          firedMap[fireKey] = true;
          updatedFired = true;
          playSoftSanctuaryChime(acousticTone, soundVolume);
          setLiveToast({
            title: ch.testTitle,
            body: ch.testBody,
            time: format(new Date(), "h:mm a"),
          });
        }
      });

      customAlarms.forEach((alm) => {
        if (!alm.enabled) return;
        const fireKey = `alm_${alm.id}_${currentHHMM}`;
        if (alm.time === currentHHMM && !firedMap[fireKey]) {
          firedMap[fireKey] = true;
          updatedFired = true;
          playSoftSanctuaryChime(acousticTone, soundVolume);
          setLiveToast({
            title: `Sanctuary Alarm • ${alm.label}`,
            body: `It is ${alm.time} — time for your ${alm.label} (${alm.tag}).`,
            time: format(new Date(), "h:mm a"),
          });
        }
      });

      supplements.forEach((supp) => {
        const fireKey = `supp_${supp.id}_${currentHHMM}`;
        if (supp.time === currentHHMM && !firedMap[fireKey]) {
          firedMap[fireKey] = true;
          updatedFired = true;
          playSoftSanctuaryChime(acousticTone, soundVolume);
          setLiveToast({
            title: `Daily Vitamin Reminder • ${supp.name}`,
            body: `Time to take ${supp.dosage} of ${supp.name} (${supp.phaseNote}).`,
            time: format(new Date(), "h:mm a"),
          });
        }
      });

      if (updatedFired) {
        localStorage.setItem(
          `moonday_fired_log_${dateKey}`,
          JSON.stringify(firedMap),
        );
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [
    timerRunning,
    channels,
    customAlarms,
    supplements,
    hydrationChannel,
    acousticTone,
    soundVolume,
  ]);

  const requestBrowserPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setStatusBanner("Desktop notifications are unsupported in this browser.");
      return "denied";
    }
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm === "granted") {
      const sub = await getOrSubscribeWebPush();
      setSwReady(Boolean(sub));
      await syncSchedulesToServer(channels, supplements, customAlarms);
      await dispatchNotification(
        "MoonDay Background Web Push Active",
        "Your reminders, timers, and alarms will now push even when the tab is closed.",
        true,
      );
    }
    return perm;
  };

  const handleToggleChannel = async (channelId: string) => {
    const target = channels.find((c) => c.id === channelId);
    if (!target) return;

    const nextEnabled = !target.enabled;
    if (nextEnabled && permission !== "granted") {
      await requestBrowserPermission();
    }

    const updated = channels.map((c) =>
      c.id === channelId ? { ...c, enabled: nextEnabled } : c,
    );
    setChannels(updated);

    if (nextEnabled) {
      if (channelId === "hydration_cadence") {
        const nextTs = Date.now() + (target.intervalMins || 120) * 60 * 1000;
        localStorage.setItem("moonday_next_hydration_ts", String(nextTs));
      }
      dispatchNotification(target.testTitle, target.testBody, true);
    }
  };

  const updateChannelField = (
    channelId: string,
    field: "triggerTime" | "leadDays" | "intervalMins",
    value: string | number,
  ) => {
    const updated = channels.map((c) =>
      c.id === channelId ? { ...c, [field]: value } : c,
    );
    setChannels(updated);

    if (channelId === "hydration_cadence" && field === "intervalMins") {
      const nextTs = Date.now() + Number(value) * 60 * 1000;
      localStorage.setItem("moonday_next_hydration_ts", String(nextTs));
    }
  };

  const handleAddCustomAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlarmLabel.trim()) return;
    const item: CustomAlarmItem = {
      id: `alm-${Date.now()}`,
      label: newAlarmLabel.trim(),
      time: newAlarmTime || "08:00",
      tag: newAlarmTag || "Health Alarm",
      enabled: true,
    };
    const updated = [...customAlarms, item];
    setCustomAlarms(updated);
    setNewAlarmLabel("");
  };


  const toggleCustomAlarm = (id: string) => {
    setCustomAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
    );
  };


  const deleteCustomAlarm = (id: string) => {
    setCustomAlarms((prev) => prev.filter((a) => a.id !== id));
  };
  const handleSaveConfiguration = async () => {
    setSaving(true);
    const payload = {
      channels,
      quietStart,
      quietEnd,
      acousticTone,
      soundVolume,
      supplements,
      customAlarms,
      updatedAt: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "moonday_reminders_cockpit_v3",
        JSON.stringify(payload),
      );
    }


    await syncSchedulesToServer(channels, supplements, customAlarms);

    // Purge any large reminder_preferences object from Supabase JWT user_metadata
    // so the browser auth cookie stays tiny (<2 KB) and never triggers HTTP 431

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.user_metadata?.reminder_preferences) {
        await supabase.auth.updateUser({
          data: { reminder_preferences: null },
        });
      }
    } catch {}

    setSaving(false);
    setStatusBanner(
      "All timers, custom alarms, cycle reminders, and background Web Push schedules saved.",
    );
    setTimeout(() => setStatusBanner(""), 3500);
  };

  const toggleSupplementTaken = (id: string) => {
    const next = { ...takenTodayMap, [id]: !takenTodayMap[id] };
    setTakenTodayMap(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `moonday_supp_taken_${todayStr}`,
        JSON.stringify(next),
      );
    }
  };

  const handleAddSupplement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuppName.trim()) return;
    const item: SupplementItem = {
      id: `supp-${Date.now()}`,
      name: newSuppName.trim(),
      dosage: newSuppDose.trim() || "1 dose",
      time: newSuppTime || "09:00",
      phaseNote: "Custom daily reminder",
    };
    setSupplements((prev) => [...prev, item]);
    setNewSuppName("");
    setNewSuppDose("");
  };

  const handleDeleteSupplement = (id: string) => {
    setSupplements((prev) => prev.filter((s) => s.id !== id));
  };

  const activeChannelCount = useMemo(
    () => channels.filter((c) => c.enabled).length,
    [channels],
  );

  const formatDuration = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) {
      return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
    }
    return `${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  };

  const formatTimerClock = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const timerProgressPct = Math.min(
    100,
    Math.max(
      0,
      ((timerTotalSec - timerRemainingSec) / Math.max(1, timerTotalSec)) * 100,
    ),
  );

  return (
    <div className="animate-in fade-in duration-300 max-w-[1280px] mx-auto pb-20 text-ink space-y-7 relative">

      {/* LIVE IN-APP NOTIFICATION PREVIEW BANNER */}

      {liveToast && (
        <div className="fixed top-20 right-5 z-50 w-full max-w-[390px] bg-white border-2 border-[#d990a8] rounded-3xl p-5 shadow-[0_20px_50px_rgba(165,95,120,0.28)] animate-in slide-in-from-top-5 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#fff0f3] border border-[#f4c2c2] flex items-center justify-center text-[#a55f78] shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a55f78] block">
                  MoonDay Live Alert • {liveToast.time}
                </span>
                <h4 className="text-[14.5px] font-bold text-ink leading-snug">
                  {liveToast.title}
                </h4>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLiveToast(null)}
              className="p-1 text-muted hover:text-ink cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[13px] text-muted leading-relaxed mt-2.5 pl-11">
            {liveToast.body}
          </p>
        </div>
      )}

      {/* I. ELEGANT SANCTUARY MASTHEAD & LIVE STATUS BAR */}

      <section className="bg-white border border-line rounded-[28px] shadow-soft overflow-hidden">
        <div className="p-7 sm:p-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#a55f78] mb-2.5">
              <Sparkles
                className="w-3.5 h-3.5 text-[#d990a8]"
                strokeWidth={1.75}
              />
              <span>
                Health Timers, Custom Alarms &amp; Background Web Push
              </span>
            </div>
            <h1
              style={{
                fontFamily: "'Georgia', 'Cambria', 'Times New Roman', serif",
              }}
              className="text-[30px] sm:text-[38px] font-normal text-ink tracking-tight leading-[1.12]"
            >
              Sanctuary Timers, Alarms &amp; Chimes
            </h1>
            <p className="text-[13.5px] text-muted mt-2 max-w-[640px] leading-relaxed">
              Launch 1-click health timers, set custom daily alarms, and
              schedule encrypted Web Push notifications that arrive even when
              your tab is closed.
            </p>
          </div>



          <div className="flex flex-wrap items-center gap-2.5">
            {permission !== "granted" && (
              <button
                type="button"
                onClick={requestBrowserPermission}
                className="px-4 py-2.5 rounded-2xl bg-[#fff0f3] border border-[#f4c2c2] text-[#a55f78] text-[12.5px] font-bold hover:brightness-95 transition-all cursor-pointer flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" strokeWidth={1.75} />
                <span>Enable Background Push</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleClosedTabPushTest}
              className="px-4 py-2.5 rounded-2xl bg-[#fff0f3] border border-[#f4c2c2] hover:border-[#d990a8] text-[#a55f78] text-[12.5px] font-bold transition-all cursor-pointer flex items-center gap-2"
              title="Schedules a server push 10 seconds from now so you can close this tab and watch it arrive"
            >
              <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Test Closed-Tab Push (10s)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                dispatchNotification(
                  "Sanctuary Sound & Alert Check",
                  "Your soft chime and background Web Push engine are connected and working.",
                  true,
                )
              }
              className="px-4 py-2.5 rounded-2xl bg-[#fcf9fa] border border-line hover:border-[#d990a8] text-ink text-[12.5px] font-bold transition-all cursor-pointer flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5 text-[#a55f78]" strokeWidth={1.75} />
              <span>Test Now</span>
            </button>


            <button

              type="button"
              onClick={handleSaveConfiguration}
              disabled={saving}
              className="px-5 py-2.5 rounded-2xl bg-[#d990a8] hover:brightness-95 text-white text-[12.5px] font-bold transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" strokeWidth={1.75} />
              )}
              <span>{saving ? "Saving..." : "Save All Settings"}</span>
            </button>
          </div>
        </div>

        {/* 4-Column Clean Telemetry Strip */}


        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-line border-t border-line bg-[#fcf9fa]">
          <div className="px-6 py-4 flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted">
              Web Push Engine
            </span>
            <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-ink">
              <span
                className={`w-2 h-2 rounded-full ${
                  permission === "granted" && swReady
                    ? "bg-emerald-500"
                    : "bg-[#d990a8]"
                }`}
              />
              {permission === "granted"
                ? swReady
                  ? "Server Push Linked"
                  : "Authorized"
                : permission === "denied"
                  ? "Browser Blocked"
                  : "Tap Enable"}
            </span>
          </div>

          <div className="px-6 py-4 flex items-baseline justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted">
              Active Health Timer
            </span>
            <span
              style={{
                fontFamily: "'Georgia', 'Cambria', 'Times New Roman', serif",
              }}
              className="text-[20px] text-[#a55f78] tabular-nums"
            >
              {timerRunning ? formatTimerClock(timerRemainingSec) : "Standby"}
            </span>
          </div>

          <div className="px-6 py-4 flex items-baseline justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted">
              Next Water Nudge
            </span>
            <span
              style={{
                fontFamily: "'Georgia', 'Cambria', 'Times New Roman', serif",
              }}
              className="text-[20px] text-ink tabular-nums"
            >
              {hydrationChannel?.enabled
                ? formatDuration(hydrationCountdownSec)
                : "Paused"}
            </span>
          </div>

          <div className="px-6 py-4 flex items-baseline justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted">
              Live Clock
            </span>
            <span
              style={{
                fontFamily: "'Georgia', 'Cambria', 'Times New Roman', serif",
              }}
              className="text-[19px] text-ink tabular-nums"
            >
              {currentTimeStr}
            </span>
          </div>
        </div>
      </section>



      {statusBanner && (
        <div className="px-5 py-4 rounded-2xl bg-[#fff0f3] border border-[#f4c2c2] text-[#a55f78] text-[13px] font-semibold flex items-center justify-between gap-4">
          <span>{statusBanner}</span>
          <button
            type="button"
            onClick={() => setStatusBanner("")}
            className="text-[#a55f78] hover:text-ink cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* II. HEALTH TIMERS & CUSTOM ALARM CLOCK STUDIO */}


      <section className="bg-white border border-line rounded-[28px] shadow-soft overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-line">


          {/* LEFT 7 COLUMNS: ACTIVE COUNTDOWN CONSOLE + 10 PRE-DEFINED HEALTH TIMERS */}


          <div className="lg:col-span-7 p-7 sm:p-9 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line/70">
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#a55f78] block">
                  Section I • Instant Health Timers
                </span>
                <h2
                  style={{
                    fontFamily:
                      "'Georgia', 'Cambria', 'Times New Roman', serif",
                  }}
                  className="text-[24px] font-normal text-ink tracking-tight mt-0.5"
                >
                  Pre-Defined Health &amp; Comfort Timers
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#fff0f3] border border-[#f4c2c2] text-[11px] font-bold text-[#a55f78]">
                10 Clinical Presets
              </span>
            </div>

            {/* Active Timer Live Console */}


            <div className="p-6 rounded-3xl bg-[#fff8fa] border border-[#f4c2c2] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a55f78] block">
                    {timerRunning
                      ? "Timer Running (Server Web Push Armed)"
                      : "Selected Health Timer"}
                  </span>
                  <h3 className="text-[18px] font-bold text-ink mt-0.5">
                    {activeTimerLabel}
                  </h3>
                </div>

                <div
                  style={{
                    fontFamily:
                      "'Georgia', 'Cambria', 'Times New Roman', serif",
                  }}
                  className="text-[44px] sm:text-[50px] font-normal text-ink tabular-nums leading-none"
                >
                  {formatTimerClock(timerRemainingSec)}
                </div>
              </div>

              {/* Progress Bar */}
              
              <div className="w-full h-2 bg-white border border-line rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#a55f78] transition-all duration-500"
                  style={{ width: `${timerProgressPct}%` }}
                />
              </div>

              {/* Timer Action Buttons */}

              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleTimerPause}
                    className="px-5 py-2.5 rounded-xl bg-[#a55f78] hover:brightness-95 text-white text-[12.5px] font-bold flex items-center gap-2 cursor-pointer transition-all"
                  >
                    {timerRunning ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>Pause Timer</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>Start Timer</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleResetTimer}
                    className="px-3.5 py-2.5 rounded-xl bg-white border border-line text-muted hover:text-ink text-[12px] font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {[1, 5, 10].map((addMin) => (
                    <button
                      key={addMin}
                      type="button"
                      onClick={() =>
                        startHealthTimer(
                          activeTimerLabel,
                          timerRemainingSec + addMin * 60,
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-white border border-line hover:border-[#d990a8] text-[11.5px] font-bold text-[#a55f78] cursor-pointer"
                    >
                      +{addMin}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 10 Pre-Defined Health Timer Cards Grid */}



            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {HEALTH_TIMER_PRESETS.map((preset) => {
                const isSelected = activeTimerLabel === preset.title;
                return (
                  <div
                    key={preset.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                      isSelected
                        ? "bg-[#fff0f3] border-[#d990a8]"
                        : "bg-[#fcf9fa] border-line hover:border-[#d990a8]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#a55f78]">
                          {preset.code} • {preset.tag}
                        </span>
                      </div>
                      <h4 className="text-[14px] font-bold text-ink">
                        {preset.title}
                      </h4>
                      <p className="text-[12px] text-muted leading-relaxed mt-1">
                        {preset.benefit}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        startHealthTimer(preset.title, preset.durationSec)
                      }
                      className="w-full py-2 px-3 rounded-xl bg-white border border-line hover:border-[#a55f78] text-[12px] font-bold text-[#a55f78] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>
                        Start {Math.round(preset.durationSec / 60)}m Timer
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT 5 COLUMNS: CUSTOM TIMER BUILDER + PERSONAL ALARM CLOCK */}


          <div className="lg:col-span-5 p-7 sm:p-9 bg-[#fcf9fa] space-y-8">

            {/* A. Custom Countdown Timer Builder */}


            <div className="space-y-4">
              <div className="pb-3.5 border-b border-line/70">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#a55f78] block">
                  Custom Countdown
                </span>
                <h3
                  style={{
                    fontFamily:
                      "'Georgia', 'Cambria', 'Times New Roman', serif",
                  }}
                  className="text-[22px] font-normal text-ink tracking-tight mt-0.5"
                >
                  Set Any Custom Timer
                </h3>
              </div>

              <form
                onSubmit={handleStartCustomTimer}
                className="p-5 rounded-2xl bg-white border border-line space-y-4"
              >
                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-wider text-muted mb-1.5">
                    Timer Name
                  </label>
                  <input
                    type="text"
                    value={customTimerLabel}
                    onChange={(e) => setCustomTimerLabel(e.target.value)}
                    placeholder="e.g. Castor Oil Pack, Study Sprint, Face Mask..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#fcf9fa] border border-line text-[13px] text-ink outline-none focus:border-[#d990a8]"
                  />
                </div>


                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-[#fcf9fa] border border-line">
                    <label className="block text-[9.5px] font-bold uppercase tracking-wider text-muted mb-1">
                      Hours
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={customHours}
                      onChange={(e) => setCustomHours(Number(e.target.value))}
                      className="w-full bg-transparent text-[16px] font-bold text-ink tabular-nums outline-none"
                    />
                  </div>
                  <div className="p-3 rounded-xl bg-[#fcf9fa] border border-line">
                    <label className="block text-[9.5px] font-bold uppercase tracking-wider text-muted mb-1">
                      Minutes
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={customMins}
                      onChange={(e) => setCustomMins(Number(e.target.value))}
                      className="w-full bg-transparent text-[16px] font-bold text-ink tabular-nums outline-none"
                    />
                  </div>
                  <div className="p-3 rounded-xl bg-[#fcf9fa] border border-line">
                    <label className="block text-[9.5px] font-bold uppercase tracking-wider text-muted mb-1">
                      Seconds
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={customSecs}
                      onChange={(e) => setCustomSecs(Number(e.target.value))}
                      className="w-full bg-transparent text-[16px] font-bold text-ink tabular-nums outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-ink hover:bg-black text-white text-[12.5px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Timer className="w-4 h-4" />
                  <span>Start Custom Countdown</span>
                </button>
              </form>
            </div>


            {/* B. Personal Daily Alarm Clock */}


            <div className="space-y-4">
              <div className="pb-3.5 border-b border-line/70 flex items-center justify-between">
                <div>
                  <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#a55f78] block">
                    Daily Alarm Clock
                  </span>
                  <h3
                    style={{
                      fontFamily:
                        "'Georgia', 'Cambria', 'Times New Roman', serif",
                    }}
                    className="text-[22px] font-normal text-ink tracking-tight mt-0.5"
                  >
                    Custom Health Alarms
                  </h3>
                </div>
                <AlarmClock className="w-5 h-5 text-[#a55f78]" />
              </div>


              <div className="space-y-2.5">
                {customAlarms.map((alm) => (
                  <div
                    key={alm.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      alm.enabled
                        ? "bg-white border-[#f4c2c2]"
                        : "bg-white/60 border-line opacity-70"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span
                          style={{
                            fontFamily:
                              "'Georgia', 'Cambria', 'Times New Roman', serif",
                          }}
                          className="text-[20px] font-normal text-ink tabular-nums"
                        >
                          {alm.time}
                        </span>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#a55f78] px-2 py-0.5 rounded bg-[#fff0f3]">
                          {alm.tag}
                        </span>
                      </div>
                      <p className="text-[13.5px] font-bold text-ink truncate mt-0.5">
                        {alm.label}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          dispatchNotification(
                            `Sanctuary Alarm • ${alm.label}`,
                            `Scheduled ${alm.tag} alarm (${alm.time}).`,
                            true,
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-[#fcf9fa] border border-line text-[11px] font-bold text-muted hover:text-[#a55f78] cursor-pointer"
                      >
                        Test
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleCustomAlarm(alm.id)}
                        aria-label={`Toggle ${alm.label}`}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          alm.enabled ? "bg-[#a55f78]" : "bg-[#d6c8cf]"
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                            alm.enabled ? "left-6" : "left-1"
                          }`}
                        />
                      </button>


                      <button
                        type="button"
                        onClick={() => deleteCustomAlarm(alm.id)}
                        aria-label="Delete alarm"
                        className="p-1 text-muted hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>



              {/* Add New Alarm Form */}


              <form
                onSubmit={handleAddCustomAlarm}
                className="p-4 rounded-2xl bg-white border border-line space-y-2.5"
              >
                <input
                  type="text"
                  value={newAlarmLabel}
                  onChange={(e) => setNewAlarmLabel(e.target.value)}
                  placeholder="New alarm label (e.g. Afternoon Spearmint Tea)..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fcf9fa] border border-line text-[12.5px] text-ink outline-none focus:border-[#d990a8]"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={newAlarmTime}
                    onChange={(e) => setNewAlarmTime(e.target.value)}
                    aria-label="New alarm time"
                    className="px-3 py-2.5 rounded-xl bg-[#fcf9fa] border border-line text-[13px] font-bold text-ink tabular-nums outline-none"
                  />
                  <select
                    value={newAlarmTag}
                    onChange={(e) => setNewAlarmTag(e.target.value)}
                    aria-label="Alarm category"
                    className="flex-1 px-3 py-2.5 rounded-xl bg-[#fcf9fa] border border-line text-[12px] font-semibold text-ink outline-none"
                  >
                    <option value="Self-Care">Self-Care</option>
                    <option value="Hydration">Hydration</option>
                    <option value="Medication">Medication</option>
                    <option value="Movement">Movement</option>
                    <option value="Sleep Routine">Sleep Routine</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#a55f78] text-white text-[12px] font-bold hover:brightness-95 cursor-pointer shrink-0 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Alarm</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>



      {/* III. CYCLE REMINDERS (LEFT 7 COLS) + SOFT SOUNDS, QUIET HOURS & VITAMINS (RIGHT 5 COLS) */}


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">

        {/* LEFT 7 COLUMNS: ALL 8 CYCLE & DAILY CARE REMINDERS */}

        <div className="lg:col-span-7 bg-white border border-line rounded-[28px] p-7 sm:p-9 shadow-soft space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4 pb-5 border-b border-line/70">
            <div>
              <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#a55f78] block">
                Personalized Schedule
              </span>
              <h2
                style={{
                  fontFamily: "'Georgia', 'Cambria', 'Times New Roman', serif",
                }}
                className="text-[24px] font-normal text-ink tracking-tight mt-0.5"
              >
                Cycle &amp; Daily Care Reminders ({activeChannelCount} Active)
              </h2>
            </div>

            <div className="text-[12px] text-muted tabular-nums">
              Next Period:{" "}
              <strong className="text-ink">
                {cycleForecast.nextMoondayDate}
              </strong>{" "}
              • Ovulation:{" "}
              <strong className="text-ink">
                {cycleForecast.nextOvulationDate}
              </strong>
            </div>
          </div>



          {CHANNEL_CATEGORIES.map((cat) => {
            const groupItems = channels.filter((c) => c.category === cat);
            return (
              <div key={cat} className="space-y-3.5">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#a55f78] block">
                  {cat}
                </span>

                <div className="space-y-3">
                  {groupItems.map((ch) => (
                    <div
                      key={ch.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        ch.enabled
                          ? "bg-[#fff8fa] border-[#f4c2c2]"
                          : "bg-[#fcf9fa] border-line opacity-80"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2.5">
                            <span className="px-2 py-0.5 rounded-md bg-white border border-line text-[10px] font-extrabold text-[#a55f78] tabular-nums">
                              {ch.code}
                            </span>
                            <h4 className="text-[15.5px] font-bold text-ink">
                              {ch.title}
                            </h4>
                          </div>
                          <p className="text-[13px] text-muted leading-relaxed">
                            {ch.subtitle}
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              dispatchNotification(
                                ch.testTitle,
                                ch.testBody,
                                true,
                              )
                            }
                            className="px-3 py-1.5 rounded-xl bg-white border border-line hover:border-[#d990a8] text-[11.5px] font-bold text-muted hover:text-[#a55f78] cursor-pointer transition-colors"
                          >
                            Test
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleChannel(ch.id)}
                            aria-label={`Toggle ${ch.title}`}
                            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                              ch.enabled ? "bg-[#a55f78]" : "bg-[#d6c8cf]"
                            }`}
                          >
                            <span
                              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-2xs ${
                                ch.enabled ? "left-7" : "left-1"
                              }`}
                            />
                          </button>
                        </div>
                      </div>


                      <div className="mt-4 pt-3.5 border-t border-line/60 flex flex-wrap items-center justify-between gap-3 text-[12px]">
                        <div className="flex flex-wrap items-center gap-2.5">
                          {typeof ch.leadDays === "number" && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-line">
                              <span className="text-muted font-medium">
                                Notify:
                              </span>
                              <select
                                aria-label={`${ch.title} lead days`}
                                value={ch.leadDays}
                                onChange={(e) =>
                                  updateChannelField(
                                    ch.id,
                                    "leadDays",
                                    Number(e.target.value),
                                  )
                                }
                                className="bg-transparent font-bold text-ink outline-none cursor-pointer"
                              >
                                <option value={1}>1 day before</option>
                                <option value={2}>2 days before</option>
                                <option value={3}>3 days before</option>
                                <option value={5}>5 days before</option>
                              </select>
                            </div>
                          )}


                          {typeof ch.intervalMins === "number" && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-line">
                              <span className="text-muted font-medium">
                                Repeat:
                              </span>
                              <select
                                aria-label="Hydration interval"
                                value={ch.intervalMins}
                                onChange={(e) =>
                                  updateChannelField(
                                    ch.id,
                                    "intervalMins",
                                    Number(e.target.value),
                                  )
                                }
                                className="bg-transparent font-bold text-ink outline-none cursor-pointer"
                              >
                                <option value={30}>Every 30 mins</option>
                                <option value={60}>Every 1 hour</option>
                                <option value={90}>Every 90 mins</option>
                                <option value={120}>Every 2 hours</option>
                                <option value={180}>Every 3 hours</option>
                              </select>
                            </div>
                          )}


                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-line">
                            <Clock className="w-3.5 h-3.5 text-[#a55f78]" />
                            <span className="text-muted font-medium">At:</span>
                            <input
                              type="time"
                              aria-label={`${ch.title} time`}
                              value={ch.triggerTime}
                              onChange={(e) =>
                                updateChannelField(
                                  ch.id,
                                  "triggerTime",
                                  e.target.value,
                                )
                              }
                              className="bg-transparent font-bold text-ink tabular-nums outline-none cursor-pointer"
                            />
                          </div>
                        </div>


                        <span className="text-[11.5px] font-semibold text-[#a55f78]">
                          {ch.enabled
                            ? ch.id === "hydration_cadence"
                              ? `Next in ${formatDuration(hydrationCountdownSec)}`
                              : `Alerts daily at ${ch.triggerTime}`
                            : "Turned off"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>


        {/* RIGHT 5 COLUMNS: SOFT SOUND STUDIO, QUIET HOURS & VITAMIN CHECKLIST */}


        <div className="lg:col-span-5 space-y-7">


          {/* 1. SOFT ACOUSTIC SOUND STUDIO */}


          <div className="bg-white border border-line rounded-[28px] p-7 sm:p-8 shadow-soft space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-line/70">
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#a55f78] block">
                  Soft Acoustic Studio
                </span>
                <h3
                  style={{
                    fontFamily:
                      "'Georgia', 'Cambria', 'Times New Roman', serif",
                  }}
                  className="text-[22px] font-normal text-ink tracking-tight mt-0.5"
                >
                  Gentle Notification Sounds
                </h3>
              </div>
              <button
                type="button"
                onClick={() =>
                  playSoftSanctuaryChime(acousticTone, soundVolume)
                }
                className="px-3.5 py-1.5 rounded-xl bg-[#fff0f3] border border-[#f4c2c2] text-[11.5px] font-bold text-[#a55f78] hover:brightness-95 cursor-pointer flex items-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#fcf9fa] border border-line space-y-2">
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-bold text-ink">
                  Chime Softness &amp; Volume
                </span>
                <span className="font-extrabold text-[#a55f78] tabular-nums">
                  {soundVolume}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={soundVolume}
                onChange={(e) => setSoundVolume(Number(e.target.value))}
                onMouseUp={() =>
                  playSoftSanctuaryChime(acousticTone, soundVolume)
                }
                onTouchEnd={() =>
                  playSoftSanctuaryChime(acousticTone, soundVolume)
                }
                className="w-full accent-[#a55f78] cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SOFT_SOUND_LIBRARY.map((snd) => {
                const active = acousticTone === snd.id;
                return (
                  <button
                    key={snd.id}
                    type="button"
                    onClick={() => {
                      setAcousticTone(snd.id);
                      playSoftSanctuaryChime(snd.id, soundVolume);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      active
                        ? "bg-[#fff0f3] border-[#d990a8] text-[#a55f78] shadow-2xs"
                        : "bg-[#fcf9fa] border-line text-ink hover:border-[#d990a8]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 w-full mb-1">
                      <span className="text-[13px] font-bold">{snd.name}</span>
                      {snd.id === "silent" ? (
                        <VolumeX className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      )}
                    </div>
                    <span className="text-[11px] text-muted leading-snug">
                      {snd.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          

          {/* 2. QUIET HOURS (DO NOT DISTURB) */}


          <div className="bg-white border border-line rounded-[28px] p-7 sm:p-8 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-line/70">
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#a55f78] block">
                  Sleep Protection
                </span>
                <h3
                  style={{
                    fontFamily:
                      "'Georgia', 'Cambria', 'Times New Roman', serif",
                  }}
                  className="text-[22px] font-normal text-ink tracking-tight mt-0.5"
                >
                  Quiet Hours (Do Not Disturb)
                </h3>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                  isQuietHoursActive
                    ? "bg-[#fff0f3] text-[#a55f78] border-[#f4c2c2]"
                    : "bg-[#fcf9fa] text-muted border-line"
                }`}
              >
                {isQuietHoursActive ? "Quiet Hours Active" : "Alerts Open"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-2xl bg-[#fcf9fa] border border-line">
                <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-muted mb-1">
                  Silence From
                </label>
                <input
                  type="time"
                  value={quietStart}
                  onChange={(e) => setQuietStart(e.target.value)}
                  className="w-full bg-transparent text-[14px] font-bold text-ink tabular-nums outline-none cursor-pointer"
                />
              </div>
              <div className="p-3.5 rounded-2xl bg-[#fcf9fa] border border-line">
                <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-muted mb-1">
                  Resume At
                </label>
                <input
                  type="time"
                  value={quietEnd}
                  onChange={(e) => setQuietEnd(e.target.value)}
                  className="w-full bg-transparent text-[14px] font-bold text-ink tabular-nums outline-none cursor-pointer"
                />
              </div>
            </div>
            <p className="text-[12px] text-muted">
              Routine reminders are gently snoozed during your sleep window.
            </p>
          </div>


          {/* 3. DAILY VITAMINS & SUPPLEMENTS */}


          <div className="bg-white border border-line rounded-[28px] p-7 sm:p-8 shadow-soft space-y-5">
            <div className="pb-3.5 border-b border-line/70">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#a55f78] block">
                Daily Nourishment
              </span>
              <h3
                style={{
                  fontFamily: "'Georgia', 'Cambria', 'Times New Roman', serif",
                }}
                className="text-[22px] font-normal text-ink tracking-tight mt-0.5"
              >
                Vitamins &amp; Supplements
              </h3>
              <p className="text-[12px] text-muted mt-0.5">
                Each item below automatically chimes at its scheduled time.
              </p>
            </div>


            <div className="space-y-2.5">
              {supplements.map((supp) => {
                const taken = Boolean(takenTodayMap[supp.id]);
                return (
                  <div
                    key={supp.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      taken
                        ? "bg-[#fff0f3] border-[#f4c2c2]"
                        : "bg-[#fcf9fa] border-line"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSupplementTaken(supp.id)}
                      className="flex items-start gap-3 text-left flex-1 cursor-pointer"
                    >
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          taken
                            ? "bg-[#a55f78] border-[#a55f78] text-white"
                            : "bg-white border-line"
                        }`}
                      >
                        {taken && (
                          <Check className="w-3 h-3" strokeWidth={2.5} />
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span
                            className={`text-[14px] font-bold text-ink ${
                              taken ? "line-through opacity-65" : ""
                            }`}
                          >
                            {supp.name}
                          </span>
                          <span className="text-[11px] font-bold text-[#a55f78] tabular-nums">
                            {supp.dosage}
                          </span>
                        </div>
                        <span className="text-[11.5px] text-muted block tabular-nums mt-0.5">
                          Alerts at <strong>{supp.time}</strong> •{" "}
                          {supp.phaseNote}
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteSupplement(supp.id)}
                      aria-label="Remove supplement"
                      className="p-1.5 text-muted hover:text-red-500 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                );
              })}
            </div>



            <form
              onSubmit={handleAddSupplement}
              className="pt-4 border-t border-line/70 space-y-2.5"
            >
              <input
                type="text"
                value={newSuppName}
                onChange={(e) => setNewSuppName(e.target.value)}
                placeholder="Add vitamin or medication (e.g. Vitamin D3)..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#fcf9fa] border border-line text-[12.5px] text-ink outline-none focus:bg-white focus:border-[#d990a8]"
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSuppDose}
                  onChange={(e) => setNewSuppDose(e.target.value)}
                  placeholder="Dose (e.g. 2000 IU)"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#fcf9fa] border border-line text-[12.5px] text-ink outline-none focus:bg-white focus:border-[#d990a8]"
                />
                <input
                  type="time"
                  value={newSuppTime}
                  onChange={(e) => setNewSuppTime(e.target.value)}
                  aria-label="Supplement time"
                  className="px-3 py-2.5 rounded-xl bg-[#fcf9fa] border border-line text-[12.5px] font-bold text-ink tabular-nums outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-ink text-white text-[12px] font-bold hover:bg-black cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
