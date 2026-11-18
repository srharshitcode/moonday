"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Settings,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Plus,
  Minus,
  Trash2,
  Check,
  Upload,
  Volume2,
  Image as ImageIcon,
  Music,
  ArrowLeft,
  Maximize2,
  Minimize2,
  X,
  Download,
  Bell,
  Clock,
  Palette,
  Headphones,
  Sliders,
  Sparkles,
  Target,
} from "lucide-react";

type TimerMode = "focus" | "shortBreak" | "longBreak";

type AcousticTone =
  | "velvet_harp"
  | "singing_bowl"
  | "kalimba_drop"
  | "raindrop_chime"
  | "music_box"
  | "solfeggio528"
  | "whisper_bell"
  | "custom_upload"
  | "silent";

type AmbientSoundId =
  | "none"
  | "soft_rain"
  | "pink_noise"
  | "forest_wind"
  | "binaural_432"
  | "warm_drone"
  | "custom_audio";


type FontStyleId = "serif" | "sans" | "mono";
type TimerVisualStyle = "ring" | "minimal" | "bar";
type SettingsSectionId =
  | "pacing"
  | "scenes"
  | "dial"
  | "ambient"
  | "chimes"
  | "zen";

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  estPomodoros: number;
  completedPomodoros: number;
}

interface IllustratedTheme {
  id: string;
  name: string;
  subtitle: string;
  isDark: boolean;
  bgGradient: string;
  accentHex: string;
  cardBg: string;
  modalBg: string;
  textColor: string;
  mutedColor: string;
  horizonColors: [string, string, string];
  celestialColor: string;
}

// ============================================================================
// 18 MULTI-COLOR SOFT ILLUSTRATED SANCTUARY SCENES
// ============================================================================


const ILLUSTRATED_THEMES: IllustratedTheme[] = [
  {
    id: "rosewater_sanctuary",
    name: "Rosewater Valley",
    subtitle: "Dusty rose hills & warm silk mist",
    isDark: false,
    bgGradient:
      "linear-gradient(180deg, #f3e7eb 0%, #ead6dd 52%, #dfbec9 100%)",
    accentHex: "#a55f78",
    cardBg: "rgba(250, 245, 247, 0.72)",
    modalBg: "#f6eff2",
    textColor: "#2b2025",
    mutedColor: "#6e5a63",
    horizonColors: ["#e2c4ce", "#d5aebc", "#c392a3"],
    celestialColor: "#fff7f9",
  },

  {
    id: "amber_parchment",
    name: "Honey E-Ink Paper",
    subtitle: "Zero-glare warm antique parchment",
    isDark: false,
    bgGradient:
      "linear-gradient(180deg, #efeae1 0%, #e5decf 55%, #d8cebb 100%)",
    accentHex: "#8c6d46",
    cardBg: "rgba(248, 245, 239, 0.76)",
    modalBg: "#f3efe6",
    textColor: "#2b261f",
    mutedColor: "#6b6051",
    horizonColors: ["#dfd5c3", "#d1c3ac", "#bfad92"],
    celestialColor: "#fffdf7",
  },

  {
    id: "warm_chai_oat",
    name: "Warm Chai & Oat",
    subtitle: "Spiced cinnamon latte & soft linen",
    isDark: false,
    bgGradient:
      "linear-gradient(180deg, #ede5de 0%, #e2d5ca 55%, #d3c0b0 100%)",
    accentHex: "#8c583a",
    cardBg: "rgba(246, 241, 236, 0.76)",
    modalBg: "#f2ebe4",
    textColor: "#2b211b",
    mutedColor: "#6e5a4f",
    horizonColors: ["#dccbbd", "#cdb6a4", "#ba9d87"],
    celestialColor: "#fffaf4",
  },

  {
    id: "kyoto_matcha",
    name: "Kyoto Matcha Mist",
    subtitle: "Soft sage mountains & morning dew",
    isDark: false,
    bgGradient:
      "linear-gradient(180deg, #e8efe9 0%, #d8e5db 55%, #c2d6c7 100%)",
    accentHex: "#4d775b",
    cardBg: "rgba(245, 249, 246, 0.74)",
    modalBg: "#eff5f0",
    textColor: "#1f2e24",
    mutedColor: "#556b5c",
    horizonColors: ["#c5d8ca", "#adc6b4", "#8fb099"],
    celestialColor: "#fbfdf9",
  },

  {
    id: "eucalyptus_olive",
    name: "Eucalyptus Grove",
    subtitle: "Mediterranean olive & silver mist",
    isDark: false,
    bgGradient:
      "linear-gradient(180deg, #e7ebe4 0%, #d8dfd3 55%, #c4cebd 100%)",
    accentHex: "#556b48",
    cardBg: "rgba(243, 246, 241, 0.76)",
    modalBg: "#eef2eb",
    textColor: "#22291e",
    mutedColor: "#5c6855",
    horizonColors: ["#cbd4c4", "#b6c2ad", "#9dad92"],
    celestialColor: "#fafdf7",
  },

  {
    id: "lavender_dusk",
    name: "Lavender Meadow",
    subtitle: "Soft lilac twilight & calm hills",
    isDark: false,
    bgGradient:
      "linear-gradient(180deg, #eae7f3 0%, #dcd6ec 55%, #c8bfe0 100%)",
    accentHex: "#6b5b95",
    cardBg: "rgba(246, 244, 251, 0.74)",
    modalBg: "#f2eff9",
    textColor: "#241f31",
    mutedColor: "#605775",
    horizonColors: ["#cec6e4", "#b9aed6", "#9f90c4"],
    celestialColor: "#fcfaff",
  },

  {
    id: "terracotta_dunes",
    name: "Cashmere & Apricot",
    subtitle: "Warm desert sand & golden sun",
    isDark: false,
    bgGradient:
      "linear-gradient(180deg, #f4ebe4 0%, #ead9cc 55%, #dec3b0 100%)",
    accentHex: "#a6634b",
    cardBg: "rgba(251, 246, 242, 0.74)",
    modalBg: "#f7f0ea",
    textColor: "#2e221d",
    mutedColor: "#735b51",
    horizonColors: ["#e4cbb9", "#d6b49d", "#c49a7e"],
    celestialColor: "#fffaf5",
  },

  {
    id: "sunset_marigold",
    name: "Golden Hour Glow",
    subtitle: "Soft marigold dusk & coral horizon",
    isDark: false,
    bgGradient:
      "linear-gradient(180deg, #f4e8de 0%, #edd5c3 52%, #e0bba3 100%)",
    accentHex: "#b35c37",
    cardBg: "rgba(251, 244, 238, 0.76)",
    modalBg: "#f7eee6",
    textColor: "#2e1f18",
    mutedColor: "#755648",
    horizonColors: ["#e7c7b0", "#dbafa3", "#c99383"],
    celestialColor: "#fff6eb",
  },

  {
    id: "nordic_fjord",
    name: "Nordic Fjord Dawn",
    subtitle: "Serene glacier blue & misty pines",
    isDark: false,
    bgGradient:
      "linear-gradient(180deg, #e6eef4 0%, #d4e2ec 55%, #bccfde 100%)",
    accentHex: "#486b85",
    cardBg: "rgba(243, 247, 251, 0.74)",
    modalBg: "#edf3f8",
    textColor: "#1e2a33",
    mutedColor: "#536775",
    horizonColors: ["#c3d5e3", "#abc2d4", "#8eabc2"],
    celestialColor: "#f7fbff",
  },

  {
    id: "coastal_periwinkle",
    name: "Periwinkle Sea Glass",
    subtitle: "Soft hydrangea blue & calm tide",
    isDark: false,
    bgGradient:
      "linear-gradient(180deg, #e7ecf5 0%, #d6dff0 55%, #bfcbe3 100%)",
    accentHex: "#4f6591",
    cardBg: "rgba(244, 247, 252, 0.76)",
    modalBg: "#eef2f9",
    textColor: "#1d2433",
    mutedColor: "#56637a",
    horizonColors: ["#c6d2e8", "#b0c0dc", "#95a8cc"],
    celestialColor: "#f8faff",
  },

  {
    id: "sakura_cloud",
    name: "Sakura Cloud Blossom",
    subtitle: "Soft peach-blush sky & petals",
    isDark: false,
    bgGradient:
      "linear-gradient(180deg, #f6ecee 0%, #f0dce0 55%, #e6c8ce 100%)",
    accentHex: "#b36676",
    cardBg: "rgba(252, 246, 247, 0.76)",
    modalBg: "#f9eff1",
    textColor: "#2d2023",
    mutedColor: "#755a60",
    horizonColors: ["#ebd0d6", "#dfb9c2", "#cf9da9"],
    celestialColor: "#fff9fa",
  },

  {
    id: "velvet_mulberry",
    name: "Velvet Mulberry Night",
    subtitle: "Warm plum night & cameo rose moon",
    isDark: true,
    bgGradient:
      "linear-gradient(180deg, #1b1418 0%, #261b21 55%, #32222b 100%)",
    accentHex: "#dfa0b5",
    cardBg: "rgba(38, 28, 33, 0.74)",
    modalBg: "#231a1f",
    textColor: "#f6eff2",
    mutedColor: "#b8a3ad",
    horizonColors: ["#2d1f27", "#382630", "#462f3b"],
    celestialColor: "#f7d4e0",
  },

  {
    id: "bordeaux_cherry",
    name: "Bordeaux Black Cherry",
    subtitle: "Deep merlot wine & rose-gold moon",
    isDark: true,
    bgGradient:
      "linear-gradient(180deg, #1c1115 0%, #29171d 55%, #381f28 100%)",
    accentHex: "#e598ad",
    cardBg: "rgba(42, 23, 30, 0.76)",
    modalBg: "#26151b",
    textColor: "#f9eff2",
    mutedColor: "#c2a1ab",
    horizonColors: ["#301a22", "#3d212b", "#4d2936"],
    celestialColor: "#ffe0e9",
  },

  {
    id: "espresso_amber",
    name: "Espresso & Amber",
    subtitle: "Roasted cocoa & candlelight gold",
    isDark: true,
    bgGradient:
      "linear-gradient(180deg, #181412 0%, #241d19 55%, #302620 100%)",
    accentHex: "#d99f6c",
    cardBg: "rgba(36, 29, 25, 0.76)",
    modalBg: "#221b17",
    textColor: "#f5eee8",
    mutedColor: "#b5a395",
    horizonColors: ["#29211c", "#342923", "#42342c"],
    celestialColor: "#fce3c8",
  },

  {
    id: "midnight_forest",
    name: "Emerald Pine Nocturne",
    subtitle: "Deep forest twilight & soft moss",
    isDark: true,
    bgGradient:
      "linear-gradient(180deg, #111a16 0%, #18251f 55%, #20322a 100%)",
    accentHex: "#88c4a6",
    cardBg: "rgba(24, 37, 31, 0.74)",
    modalBg: "#17231e",
    textColor: "#eef6f2",
    mutedColor: "#9ab5a7",
    horizonColors: ["#1b2a23", "#23362d", "#2c4439"],
    celestialColor: "#d4f2e2",
  },

  {
    id: "abyssal_teal",
    name: "Midnight Ocean Cove",
    subtitle: "Deep sapphire sea & soft aqua glow",
    isDark: true,
    bgGradient:
      "linear-gradient(180deg, #0f171e 0%, #15222c 55%, #1c2f3c 100%)",
    accentHex: "#78c2c4",
    cardBg: "rgba(21, 34, 44, 0.76)",
    modalBg: "#142029",
    textColor: "#eef6f8",
    mutedColor: "#94b0b8",
    horizonColors: ["#182732", "#203340", "#294152"],
    celestialColor: "#d2f4f5",
  },

  {
    id: "kyoto_twilight",
    name: "Kyoto Dusk Violet",
    subtitle: "Velvet amethyst sky & wisteria mist",
    isDark: true,
    bgGradient:
      "linear-gradient(180deg, #171321 0%, #221c30 55%, #2e2540 100%)",
    accentHex: "#bfa2e8",
    cardBg: "rgba(34, 28, 48, 0.76)",
    modalBg: "#201a2d",
    textColor: "#f3effa",
    mutedColor: "#ada1c4",
    horizonColors: ["#261f36", "#312845", "#3f3357"],
    celestialColor: "#eadfff",
  },

  {
    id: "cosmic_indigo",
    name: "Starlight Astral Velvet",
    subtitle: "Deep midnight indigo & lunar halo",
    isDark: true,
    bgGradient:
      "linear-gradient(180deg, #12131f 0%, #1a1c2e 55%, #252740 100%)",
    accentHex: "#a6a9e8",
    cardBg: "rgba(26, 28, 46, 0.74)",
    modalBg: "#191b2c",
    textColor: "#f0f1fa",
    mutedColor: "#9fa2c4",
    horizonColors: ["#1e2036", "#272a45", "#323657"],
    celestialColor: "#e2e4ff",
  },
];

const WORKFLOW_PRESETS = [
  {
    id: "classic",
    name: "Classic Pomodoro",
    desc: "Balanced focus & short recovery",
    focus: 25,
    short: 5,
    long: 15,
  },

  {
    id: "deep",
    name: "Deep Architecture",
    desc: "Extended coding, writing & study",
    focus: 50,
    short: 10,
    long: 25,
  },

  {
    id: "ultradian",
    name: "90m Ultradian Flow",
    desc: "Full biological deep-work wave",
    focus: 90,
    short: 20,
    long: 30,
  },

  {
    id: "luteal",
    name: "Gentle Luteal Pace",
    desc: "Low-cortisol pre-moonday rhythm",
    focus: 20,
    short: 8,
    long: 20,
  },

  {
    id: "micro",
    name: "Micro-Step Starter",
    desc: "Overcome low-motivation inertia",
    focus: 15,
    short: 3,
    long: 10,
  },

  {
    id: "sprint",
    name: "Exam & Pitch Prep",
    desc: "High-retention structured blocks",
    focus: 45,
    short: 15,
    long: 25,
  },
];

const SOFT_SOUND_LIBRARY: Array<{
  id: AcousticTone;
  name: string;
  desc: string;
}> = [
  { id: "velvet_harp", name: "Velvet Harp", desc: "Warm 4-note harp arpeggio" },
  {
    id: "singing_bowl",
    name: "432Hz Singing Bowl",
    desc: "Deep sanctuary resonance",
  },

  {
    id: "kalimba_drop",
    name: "Rosewood Kalimba",
    desc: "Gentle thumb-piano duo",
  },

  {
    id: "raindrop_chime",
    name: "Morning Raindrop",
    desc: "Soft water-droplet interval",
  },

  {
    id: "music_box",
    name: "Celesta Music Box",
    desc: "Delicate 3-note lullaby",
  },

  {
    id: "solfeggio528",
    name: "528Hz Soft Bloom",
    desc: "Breath-like harmonic swell",
  },

  {
    id: "whisper_bell",
    name: "Silk Whisper Bell",
    desc: "Ultra-quiet single chime",
  },

  {
    id: "custom_upload",
    name: "Uploaded Audio",
    desc: "Your custom sound file",
  },

  { id: "silent", name: "Silent Visual", desc: "Visual notification only" },
];

function playSoftChime(
  tone: AcousticTone,
  volumePct = 70,
  customAudioUrl?: string | null,
) {
  if (typeof window === "undefined" || tone === "silent") return;

  if (tone === "custom_upload" && customAudioUrl) {
    try {
      const audio = new Audio(customAudioUrl);
      audio.volume = Math.max(0.05, Math.min(1, volumePct / 100));
      audio.play().catch(() => {});
      return;
    } catch {}
  }



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



    if (tone === "velvet_harp" || tone === "custom_upload") {
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

function playSoftMechanicalTick() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx: AudioContext = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    gain.gain.setValueAtTime(0.015, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.035);
    setTimeout(() => ctx.close().catch(() => {}), 100);
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

async function subscribeAndSyncWebPush(
  fireAt: number | null,
  title: string,
  body: string,
) {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return;
  }
  try {
    const reg = await navigator.serviceWorker.register("/moonday-sw.js");
    await navigator.serviceWorker.ready;

    let sub = await reg.pushManager.getSubscription();
    if (!sub && Notification.permission === "granted") {
      const res = await fetch("/api/push");
      if (res.ok) {
        const { publicKey } = await res.json();
        if (publicKey) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              publicKey,
            ) as unknown as BufferSource,
          });
        }
      }
    }

    if (fireAt) {
      await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_test",
          delaySec: Math.max(1, Math.round((fireAt - Date.now()) / 1000)),
          title,
          body,
        }),
      });
    }
  } catch {}
}



export default function PomodoroClient() {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [focusMins, setFocusMins] = useState(25);
  const [shortBreakMins, setShortBreakMins] = useState(5);
  const [longBreakMins, setLongBreakMins] = useState(15);
  const [longBreakInterval, setLongBreakInterval] = useState(4);
  const [dailyGoal, setDailyGoal] = useState(6);
  const [autoStartBreaks, setAutoStartBreaks] = useState(false);
  const [autoStartFocus, setAutoStartFocus] = useState(false);
  const [activePresetId, setActivePresetId] = useState("classic");
  const [cyclePhaseSync, setCyclePhaseSync] = useState(false);

  const [themeId, setThemeId] = useState("rosewater_sanctuary");
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null);
  const [customBgType, setCustomBgType] = useState<"image" | "video">("image");
  const [bgDimPct, setBgDimPct] = useState(10);
  const [bgBlurPx, setBgBlurPx] = useState(0);

  const [fontStyle, setFontStyle] = useState<FontStyleId>("serif");
  const [visualStyle, setVisualStyle] = useState<TimerVisualStyle>("ring");
  const [use24HourClock, setUse24HourClock] = useState(false);
  const [showClockSeconds, setShowClockSeconds] = useState(true);
  const [showClockDate, setShowClockDate] = useState(true);

  const [chimeTone, setChimeTone] = useState<AcousticTone>("velvet_harp");
  const [customChimeUrl, setCustomChimeUrl] = useState<string | null>(null);
  const [chimeVolume, setChimeVolume] = useState(75);
  const [webPushEnabled, setWebPushEnabled] = useState(true);

  const [ambientSound, setAmbientSound] = useState<AmbientSoundId>("none");
  const [customAmbientUrl, setCustomAmbientUrl] = useState<string | null>(null);
  const [customAmbientName, setCustomAmbientName] = useState<string>("");
  const [ambientVolume, setAmbientVolume] = useState(45);
  const [pauseAmbientOnBreak, setPauseAmbientOnBreak] = useState(true);
  const [tickSoundEnabled, setTickSoundEnabled] = useState(false);

  const [breathGuideOnBreak, setBreathGuideOnBreak] = useState(true);
  const [autoHideUiIdle, setAutoHideUiIdle] = useState(false);
  const [strictFocusLock, setStrictFocusLock] = useState(false);
  const [showEstPomodoros, setShowEstPomodoros] = useState(true);
  const [tabTitleCountdown, setTabTitleCountdown] = useState(true);

  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessionsToday, setCompletedSessionsToday] = useState(0);
  const [totalFocusMinutesToday, setTotalFocusMinutesToday] = useState(0);

  const [nowDate, setNowDate] = useState<Date | null>(null);

  const [todos, setTodos] = useState<TodoItem[]>([
    {
      id: "todo-1",
      text: "Complete deep-focus priority block",
      completed: false,
      estPomodoros: 2,
      completedPomodoros: 0,
    },
    {
      id: "todo-2",
      text: "Review notes & clear open action items",
      completed: false,
      estPomodoros: 1,
      completedPomodoros: 0,
    },

  ]);


  const [newTodoText, setNewTodoText] = useState("");
  const [activeTodoId, setActiveTodoId] = useState<string | null>("todo-1");

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] =
    useState<SettingsSectionId>("pacing");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUserIdle, setIsUserIdle] = useState(false);
  const [liveToast, setLiveToast] = useState<{
    title: string;
    body: string;
  } | null>(null);

  const txtInputRef = useRef<HTMLInputElement | null>(null);
  const bgInputRef = useRef<HTMLInputElement | null>(null);
  const ambientInputRef = useRef<HTMLInputElement | null>(null);
  const chimeInputRef = useRef<HTMLInputElement | null>(null);
  const customAmbientAudioRef = useRef<HTMLAudioElement | null>(null);
  const synthAmbientCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.add("moonday-pomodoro-zen");

    const styleEl = document.createElement("style");
    styleEl.id = "moonday-pomodoro-zen-style";
    styleEl.innerHTML = `
      body.moonday-pomodoro-zen aside,
      body.moonday-pomodoro-zen header,
      body.moonday-pomodoro-zen nav {
        display: none !important;
      }
      body.moonday-pomodoro-zen main {
        padding: 0 !important;
        margin: 0 !important;
        max-width: 100vw !important;
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      document.body.classList.remove("moonday-pomodoro-zen");
      const existing = document.getElementById("moonday-pomodoro-zen-style");
      if (existing) existing.remove();
      document.title = "MoonDay Sanctuary";
    };
  }, []);



  useEffect(() => {
    setNowDate(new Date());
    const clockTimer = setInterval(() => {
      setNowDate(new Date());
    }, 1000);

    try {
      const saved = JSON.parse(
        localStorage.getItem("moonday_pomodoro_sanctuary_v1") || "null",
      );
      if (saved) {
        if (typeof saved.focusMins === "number") {
          setFocusMins(saved.focusMins);
          setSecondsLeft(saved.focusMins * 60);
        }
        if (typeof saved.shortBreakMins === "number")
          setShortBreakMins(saved.shortBreakMins);
        if (typeof saved.longBreakMins === "number")
          setLongBreakMins(saved.longBreakMins);
        if (typeof saved.longBreakInterval === "number")
          setLongBreakInterval(saved.longBreakInterval);
        if (typeof saved.dailyGoal === "number") setDailyGoal(saved.dailyGoal);
        if (typeof saved.autoStartBreaks === "boolean")
          setAutoStartBreaks(saved.autoStartBreaks);
        if (typeof saved.autoStartFocus === "boolean")
          setAutoStartFocus(saved.autoStartFocus);
        if (saved.themeId) setThemeId(saved.themeId);
        if (typeof saved.bgDimPct === "number") setBgDimPct(saved.bgDimPct);
        if (typeof saved.bgBlurPx === "number") setBgBlurPx(saved.bgBlurPx);
        if (saved.fontStyle) setFontStyle(saved.fontStyle);
        if (saved.visualStyle) setVisualStyle(saved.visualStyle);
        if (typeof saved.use24HourClock === "boolean")
          setUse24HourClock(saved.use24HourClock);
        if (typeof saved.showClockSeconds === "boolean")
          setShowClockSeconds(saved.showClockSeconds);
        if (typeof saved.showClockDate === "boolean")
          setShowClockDate(saved.showClockDate);
        if (saved.chimeTone) setChimeTone(saved.chimeTone);
        if (typeof saved.chimeVolume === "number")
          setChimeVolume(saved.chimeVolume);
        if (Array.isArray(saved.todos)) setTodos(saved.todos);
        if (typeof saved.completedSessionsToday === "number")
          setCompletedSessionsToday(saved.completedSessionsToday);
        if (typeof saved.totalFocusMinutesToday === "number")
          setTotalFocusMinutesToday(saved.totalFocusMinutesToday);
      }
    } catch {}

    return () => clearInterval(clockTimer);
  }, []);



  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        "moonday_pomodoro_sanctuary_v1",
        JSON.stringify({
          focusMins,
          shortBreakMins,
          longBreakMins,
          longBreakInterval,
          dailyGoal,
          autoStartBreaks,
          autoStartFocus,
          themeId,
          bgDimPct,
          bgBlurPx,
          fontStyle,
          visualStyle,
          use24HourClock,
          showClockSeconds,
          showClockDate,
          chimeTone,
          chimeVolume,
          todos,
          completedSessionsToday,
          totalFocusMinutesToday,
        }),
      );
    } catch {}

  }, [
    focusMins,
    shortBreakMins,
    longBreakMins,
    longBreakInterval,
    dailyGoal,
    autoStartBreaks,
    autoStartFocus,
    themeId,
    bgDimPct,
    bgBlurPx,
    fontStyle,
    visualStyle,
    use24HourClock,
    showClockSeconds,
    showClockDate,
    chimeTone,
    chimeVolume,
    todos,
    completedSessionsToday,
    totalFocusMinutesToday,
  ]);



  useEffect(() => {
    if (!autoHideUiIdle || !isRunning || settingsOpen) {
      setIsUserIdle(false);
      return;
    }
    let timeout: NodeJS.Timeout;
    const resetIdle = () => {
      setIsUserIdle(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsUserIdle(true), 4500);
    };
    resetIdle();
    window.addEventListener("mousemove", resetIdle);
    window.addEventListener("keydown", resetIdle);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("mousemove", resetIdle);
      window.removeEventListener("keydown", resetIdle);
    };
  }, [autoHideUiIdle, isRunning, settingsOpen]);

  useEffect(() => {
    if (synthAmbientCtxRef.current) {
      synthAmbientCtxRef.current.close().catch(() => {});
      synthAmbientCtxRef.current = null;
    }
    if (customAmbientAudioRef.current) {
      customAmbientAudioRef.current.pause();
    }

    const shouldPlay =
      ambientSound !== "none" &&
      isRunning &&
      !(pauseAmbientOnBreak && mode !== "focus");

    if (!shouldPlay) return;

    if (ambientSound === "custom_audio" && customAmbientUrl) {
      try {
        if (!customAmbientAudioRef.current) {
          customAmbientAudioRef.current = new Audio(customAmbientUrl);
          customAmbientAudioRef.current.loop = true;
        } else if (customAmbientAudioRef.current.src !== customAmbientUrl) {
          customAmbientAudioRef.current.src = customAmbientUrl;
          customAmbientAudioRef.current.loop = true;
        }
        customAmbientAudioRef.current.volume = Math.max(
          0.02,
          Math.min(1, ambientVolume / 100),
        );
        customAmbientAudioRef.current.play().catch(() => {});
      } catch {}
      return;
    }


    try {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx: AudioContext = new AudioCtx();
      synthAmbientCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      const vol = Math.max(0.01, Math.min(1, ambientVolume / 100)) * 0.16;
      masterGain.gain.setValueAtTime(vol, ctx.currentTime);
      masterGain.connect(ctx.destination);

      if (ambientSound === "binaural_432" || ambientSound === "warm_drone") {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = "sine";
        osc2.type = "sine";
        osc1.frequency.setValueAtTime(
          ambientSound === "binaural_432" ? 216 : 136.1,
          ctx.currentTime,
        );
        osc2.frequency.setValueAtTime(
          ambientSound === "binaural_432" ? 224 : 204.15,
          ctx.currentTime,
        );
        osc1.connect(masterGain);
        osc2.connect(masterGain);
        osc1.start();
        osc2.start();
      } else {
        const bufferSize = ctx.sampleRate * 3;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0,
          b1 = 0,
          b2 = 0,
          b3 = 0,
          b4 = 0,
          b5 = 0,
          b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.969 * b2 + white * 0.153852;
          b3 = 0.8665 * b3 + white * 0.3104856;
          b4 = 0.55 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.016898;
          output[i] =
            (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
          b6 = white * 0.115926;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = ambientSound === "forest_wind" ? "bandpass" : "lowpass";
        filter.frequency.setValueAtTime(
          ambientSound === "soft_rain"
            ? 950
            : ambientSound === "forest_wind"
              ? 420
              : 650,
          ctx.currentTime,
        );

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();
      }
    } catch {}

    return () => {
      if (synthAmbientCtxRef.current) {
        synthAmbientCtxRef.current.close().catch(() => {});
        synthAmbientCtxRef.current = null;
      }
      if (customAmbientAudioRef.current) {
        customAmbientAudioRef.current.pause();
      }
    };
  }, [
    ambientSound,
    customAmbientUrl,
    ambientVolume,
    isRunning,
    mode,
    pauseAmbientOnBreak,
  ]);

  const totalModeSeconds = useMemo(() => {
    if (mode === "focus") return focusMins * 60;
    if (mode === "shortBreak") return shortBreakMins * 60;
    return longBreakMins * 60;
  }, [mode, focusMins, shortBreakMins, longBreakMins]);

  const switchMode = useCallback(
    (nextMode: TimerMode, autoRun = false) => {
      setMode(nextMode);
      const nextSecs =
        nextMode === "focus"
          ? focusMins * 60
          : nextMode === "shortBreak"
            ? shortBreakMins * 60
            : longBreakMins * 60;
      setSecondsLeft(nextSecs);
      setIsRunning(autoRun);

      if (autoRun && webPushEnabled) {
        const label =
          nextMode === "focus"
            ? "Focus Session Complete"
            : "Break Complete • Ready to Focus";
        subscribeAndSyncWebPush(
          Date.now() + nextSecs * 1000,
          label,
          nextMode === "focus"
            ? `Great work! Your ${focusMins}-minute focus block has finished.`
            : "Your break has finished. Step back into your focus flow.",
        );
      }
    },
    [focusMins, shortBreakMins, longBreakMins, webPushEnabled],
  );



  const dispatchPhaseCompletionAlert = useCallback(
    async (completedMode: TimerMode) => {
      playSoftChime(chimeTone, chimeVolume, customChimeUrl);

      const title =
        completedMode === "focus"
          ? "Focus Session Complete!"
          : "Break Time Finished";
      const activeTask = todos.find((t) => t.id === activeTodoId);
      const body =
        completedMode === "focus"
          ? activeTask
            ? `Completed focus block on "${activeTask.text}". Time to breathe and recharge.`
            : `You completed a ${focusMins}-minute focus block. Time for a restorative break.`
          : "Your break is complete. Ready to begin your next focus session.";

      setLiveToast({ title, body });
      setTimeout(() => setLiveToast(null), 6500);

      if (
        webPushEnabled &&
        typeof window !== "undefined" &&
        "Notification" in window
      ) {
        if (Notification.permission === "granted") {
          fetch("/api/push", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "send_test",
              title,
              body,
            }),
          }).catch(() => {});
        }
      }
    },
    [
      chimeTone,
      chimeVolume,
      customChimeUrl,
      todos,
      activeTodoId,
      focusMins,
      webPushEnabled,
    ],
  );



  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      if (tickSoundEnabled) {
        playSoftMechanicalTick();
      }

      setSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;

        dispatchPhaseCompletionAlert(mode);

        if (mode === "focus") {
          const nextCount = completedSessionsToday + 1;
          setCompletedSessionsToday(nextCount);
          setTotalFocusMinutesToday((m) => m + focusMins);

          if (activeTodoId) {
            setTodos((list) =>
              list.map((t) =>
                t.id === activeTodoId
                  ? { ...t, completedPomodoros: t.completedPomodoros + 1 }
                  : t,
              ),
            );
          }

          const isLong = nextCount % Math.max(1, longBreakInterval) === 0;
          const nextBreakMode: TimerMode = isLong ? "longBreak" : "shortBreak";
          setTimeout(() => switchMode(nextBreakMode, autoStartBreaks), 50);
        } else {
          setTimeout(() => switchMode("focus", autoStartFocus), 50);
        }

        return 0;
      });
    }, 1000);



    return () => clearInterval(timer);
  }, [
    isRunning,
    mode,
    tickSoundEnabled,
    completedSessionsToday,
    focusMins,
    longBreakInterval,
    autoStartBreaks,
    autoStartFocus,
    activeTodoId,
    dispatchPhaseCompletionAlert,
    switchMode,
  ]);


  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!tabTitleCountdown) {
      document.title = "Focus Sanctuary • MoonDay";
      return;
    }
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    const timeFormatted = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    const modeLabel =
      mode === "focus"
        ? "Focus"
        : mode === "shortBreak"
          ? "Short Break"
          : "Long Break";
    document.title = `${timeFormatted} • ${modeLabel} | MoonDay`;
  }, [secondsLeft, mode, tabTitleCountdown]);

  const handleToggleStart = async () => {
    if (isRunning && strictFocusLock && mode === "focus") {
      setLiveToast({
        title: "Strict Focus Lock Active",
        body: "Disable Strict Focus Lock in Settings (⚙️) if you need to pause mid-session.",
      });
      setTimeout(() => setLiveToast(null), 3500);
      return;
    }

    const nextRun = !isRunning;
    setIsRunning(nextRun);

    if (nextRun && webPushEnabled && typeof window !== "undefined") {
      if ("Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission();
      }
      const label =
        mode === "focus"
          ? "Focus Session Complete!"
          : "Break Finished • Ready to Focus";
      subscribeAndSyncWebPush(
        Date.now() + secondsLeft * 1000,
        label,
        mode === "focus"
          ? `Your ${focusMins}-minute Pomodoro focus session is complete.`
          : "Your break has finished.",
      );
    }
  };


  const handleResetTimer = () => {
    if (isRunning && strictFocusLock && mode === "focus") return;
    setIsRunning(false);
    setSecondsLeft(totalModeSeconds);
  };

  const handleSkipPhase = () => {
    if (isRunning && strictFocusLock && mode === "focus") return;
    if (mode === "focus") {
      switchMode("shortBreak", false);
    } else {
      switchMode("focus", false);
    }
  };

  const handleBoostFiveMinutes = () => {
    setSecondsLeft((prev) => prev + 5 * 60);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.code === "Space") {
        e.preventDefault();
        handleToggleStart();
      } else if (e.key === "r" || e.key === "R") {
        handleResetTimer();
      } else if (e.key === "s" || e.key === "S") {
        setSettingsOpen((o) => !o);
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTodoText.trim();
    if (!clean) return;
    const item: TodoItem = {
      id: `todo-${Date.now()}`,
      text: clean,
      completed: false,
      estPomodoros: 1,
      completedPomodoros: 0,
    };
    setTodos((prev) => [...prev, item]);
    if (!activeTodoId) setActiveTodoId(item.id);
    setNewTodoText("");
  };

  const toggleTodoCompleted = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const handleTxtTodoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = String(ev.target?.result || "");
      const lines = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length === 0) return;

      const imported: TodoItem[] = lines.map((rawLine, idx) => {
        const isDone =
          rawLine.startsWith("[x]") ||
          rawLine.startsWith("[X]") ||
          rawLine.startsWith("✓");
        const cleanText = rawLine
          .replace(/^(\[x\]|\[X\]|\[\s?\]|[-*•✓]|\d+\.)\s*/i, "")
          .trim();
        return {
          id: `txt-${Date.now()}-${idx}`,
          text: cleanText || rawLine,
          completed: isDone,
          estPomodoros: 1,
          completedPomodoros: 0,
        };
      });

      setTodos((prev) => [...prev, ...imported]);
      setLiveToast({
        title: "To-Do List Imported",
        body: `Added ${imported.length} tasks from ${file.name}.`,
      });
      setTimeout(() => setLiveToast(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExportTodosTxt = () => {
    const lines = todos.map(
      (t) =>
        `${t.completed ? "[x]" : "[ ]"} ${t.text} (${t.completedPomodoros}/${t.estPomodoros} pomodoros)`,
    );
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `moonday-tasks-${format(new Date(), "yyyy-MM-dd")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomBgType(file.type.startsWith("video/") ? "video" : "image");
    setCustomBgUrl(url);
    e.target.value = "";
  };


  const handleAmbientAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomAmbientUrl(url);
    setCustomAmbientName(file.name);
    setAmbientSound("custom_audio");
    e.target.value = "";
  };

  const handleChimeAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomChimeUrl(url);
    setChimeTone("custom_upload");
    playSoftChime("custom_upload", chimeVolume, url);
    e.target.value = "";
  };


  const toggleFullscreen = () => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const activeTheme = useMemo(
    () =>
      ILLUSTRATED_THEMES.find((t) => t.id === themeId) || ILLUSTRATED_THEMES[0],
    [themeId],
  );

  const activeTaskObj = useMemo(
    () =>
      todos.find((t) => t.id === activeTodoId && !t.completed) ||
      todos.find((t) => !t.completed) ||
      null,
    [todos, activeTodoId],
  );


  const progressRatio = useMemo(() => {
    const total = Math.max(1, totalModeSeconds);
    return Math.min(1, Math.max(0, (total - secondsLeft) / total));
  }, [totalModeSeconds, secondsLeft]);

  const formatTimerDigits = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };


  const formattedClockTime = useMemo(() => {
    if (!nowDate) return "--:--";
    const pattern = use24HourClock
      ? showClockSeconds
        ? "HH:mm:ss"
        : "HH:mm"
      : showClockSeconds
        ? "h:mm:ss a"
        : "h:mm a";
    return format(nowDate, pattern);
  }, [nowDate, use24HourClock, showClockSeconds]);

  const formattedClockDate = useMemo(() => {
    if (!nowDate) return "";
    return format(nowDate, "EEEE • MMMM d");
  }, [nowDate]);

  const timerFontFamily =
    fontStyle === "serif"
      ? "'Georgia', 'Cambria', 'Times New Roman', serif"
      : fontStyle === "mono"
        ? "'JetBrains Mono', 'Fira Code', monospace"
        : "'Inter', system-ui, sans-serif";

        
  const radius = 148;
  const center = 170;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;
  const pearlAngleRad = (progressRatio * 360 - 90) * (Math.PI / 180);
  const pearlX = center + radius * Math.cos(pearlAngleRad);
  const pearlY = center + radius * Math.sin(pearlAngleRad);


  const renderToggle = (
    checked: boolean,
    onToggle: () => void,
    label: string,
  ) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      style={
        checked
          ? { backgroundColor: activeTheme.accentHex }
          : {
              backgroundColor: activeTheme.isDark
                ? "rgba(255,255,255,0.14)"
                : "rgba(0,0,0,0.14)",
            }
      }
      className="w-11 h-6 rounded-full relative transition-colors duration-200 cursor-pointer shrink-0"
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-xs transition-all duration-200 ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );

  return (
    <div
      style={{
        background: activeTheme.bgGradient,
        color: activeTheme.textColor,
      }}
      className="fixed inset-0 z-[9999] w-screen h-screen overflow-y-auto overflow-x-hidden select-none transition-colors duration-700 flex flex-col justify-between"
    >
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden z-0"
        style={{
          filter: bgBlurPx > 0 ? `blur(${bgBlurPx}px)` : undefined,
        }}
      >
        {customBgUrl ? (
          customBgType === "video" ? (
            <video
              src={customBgUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={customBgUrl}
              alt="Custom sanctuary background"
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <svg
            viewBox="0 0 1440 900"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
            className="w-full h-full object-cover transition-all duration-700"
          >
            <circle
              cx="1140"
              cy="195"
              r="145"
              fill={activeTheme.celestialColor}
              fillOpacity="0.24"
            />
            <circle
              cx="1140"
              cy="195"
              r="95"
              fill={activeTheme.celestialColor}
              fillOpacity="0.48"
            />
            <circle
              cx="1140"
              cy="195"
              r="56"
              fill={activeTheme.celestialColor}
              fillOpacity="0.88"
            />

            <path
              d="M-100 420 C240 360, 520 450, 860 390 C1150 340, 1340 410, 1560 370 L1560 900 L-100 900 Z"
              fill={activeTheme.horizonColors[0]}
              fillOpacity="0.55"
            />
            <path
              d="M-80 560 C220 470, 560 610, 920 510 C1180 440, 1360 530, 1540 490 L1540 900 L-80 900 Z"
              fill={activeTheme.horizonColors[1]}
              fillOpacity="0.74"
            />
            <path
              d="M-60 690 C310 610, 680 730, 1080 640 C1280 595, 1410 660, 1520 645 L1520 900 L-60 900 Z"
              fill={activeTheme.horizonColors[2]}
              fillOpacity="0.9"
            />

            <g opacity="0.2" fill={activeTheme.accentHex}>
              <path d="M0 900 C40 770, 130 690, 220 650 C150 740, 95 820, 75 900 Z" />
              <path d="M40 900 C95 790, 185 735, 275 710 C200 785, 140 845, 115 900 Z" />
              <path d="M1440 900 C1390 775, 1310 695, 1220 655 C1290 745, 1345 820, 1365 900 Z" />
            </g>
          </svg>
        )}

        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            backgroundColor: activeTheme.isDark ? "#090708" : "#2b2025",
            opacity: bgDimPct / 100,
          }}
        />
      </div>


      <input
        ref={txtInputRef}
        type="file"
        accept=".txt,text/plain"
        onChange={handleTxtTodoUpload}
        className="hidden"
      />
      <input
        ref={bgInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleBgUpload}
        className="hidden"
      />
      <input
        ref={ambientInputRef}
        type="file"
        accept="audio/*"
        onChange={handleAmbientAudioUpload}
        className="hidden"
      />
      <input
        ref={chimeInputRef}
        type="file"
        accept="audio/*"
        onChange={handleChimeAudioUpload}
        className="hidden"
      />

      {liveToast && (
        <div
          style={{
            backgroundColor: activeTheme.cardBg,
            borderColor: activeTheme.accentHex,
          }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-[400px] backdrop-blur-2xl border-2 rounded-3xl p-4 shadow-2xl animate-in slide-in-from-top-5 duration-300"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Bell
                className="w-4 h-4 shrink-0"
                style={{ color: activeTheme.accentHex }}
              />
              <div>
                <h4 className="text-[13.5px] font-bold leading-snug">
                  {liveToast.title}
                </h4>
                <p
                  className="text-[12px] mt-0.5 leading-relaxed"
                  style={{ color: activeTheme.mutedColor }}
                >
                  {liveToast.body}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLiveToast(null)}
              className="opacity-60 hover:opacity-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TOP BAR */}

      <div
        className={`relative z-20 w-full px-6 sm:px-10 pt-6 flex items-start justify-between transition-opacity duration-500 ${
          isUserIdle ? "opacity-15 hover:opacity-100" : "opacity-100"
        }`}
      >
        <Link
          href="/"
          style={{
            backgroundColor: activeTheme.cardBg,
            color: activeTheme.textColor,
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full backdrop-blur-xl border border-current/10 text-[12px] font-semibold opacity-75 hover:opacity-100 shadow-2xs transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Sanctuary</span>
        </Link>

        <div
          style={{ backgroundColor: activeTheme.cardBg }}
          className="px-5 py-3 rounded-[24px] backdrop-blur-xl border border-current/10 text-right shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
        >
          <div className="flex items-center justify-end gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: activeTheme.accentHex }}
            />
            <div
              style={{ fontFamily: timerFontFamily }}
              className="text-[22px] sm:text-[26px] font-normal tracking-tight leading-none tabular-nums"
            >
              {formattedClockTime}
            </div>
          </div>
          {showClockDate && (
            <div
              style={{ color: activeTheme.mutedColor }}
              className="text-[10px] font-bold uppercase tracking-[0.18em] mt-1.5"
            >
              {formattedClockDate}
            </div>
          )}
        </div>
      </div>

      {/* CENTER TIMER & TASKS */}

      <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 py-4 max-w-[520px] w-full mx-auto space-y-6">
        <div
          style={{ backgroundColor: activeTheme.cardBg }}
          className="w-full rounded-[44px] backdrop-blur-2xl border border-current/10 px-6 py-8 sm:px-10 sm:py-9 shadow-[0_24px_70px_rgba(0,0,0,0.09)] flex flex-col items-center text-center relative overflow-hidden"
        >
          <div
            className="w-56 h-56 rounded-full blur-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-25 transition-all duration-1000"
            style={{ backgroundColor: activeTheme.accentHex }}
          />

          <div
            className={`relative z-10 inline-flex p-1 rounded-full bg-current/[0.04] border border-current/10 mb-5 transition-opacity duration-500 ${
              isUserIdle ? "opacity-35 hover:opacity-100" : "opacity-100"
            }`}
          >
            {(
              [
                { id: "focus", label: "Focus" },
                { id: "shortBreak", label: "Short Break" },
                { id: "longBreak", label: "Long Break" },
              ] as const
            ).map((tab) => {
              const active = mode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    if (isRunning && strictFocusLock && mode === "focus")
                      return;
                    switchMode(tab.id, false);
                  }}
                  style={
                    active
                      ? {
                          backgroundColor: activeTheme.accentHex,
                          color: "#ffffff",
                        }
                      : { color: activeTheme.mutedColor }
                  }
                  className="px-4 py-1.5 rounded-full text-[11.5px] font-bold tracking-wide transition-all cursor-pointer"
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTaskObj && (
            <div
              style={{ color: activeTheme.mutedColor }}
              className="relative z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-current/[0.04] border border-current/10 text-[11.5px] font-medium max-w-[340px] mb-2"
            >
              <Target
                className="w-3 h-3 shrink-0"
                style={{ color: activeTheme.accentHex }}
              />
              <span className="truncate">{activeTaskObj.text}</span>
            </div>
          )}

          {visualStyle === "ring" ? (
            <div className="relative z-10 w-[280px] h-[280px] sm:w-[310px] sm:h-[310px] flex items-center justify-center my-1">
              <svg className="w-full h-full" viewBox="0 0 340 340">
                <circle
                  cx={center}
                  cy={center}
                  r={radius + 14}
                  stroke="currentColor"
                  strokeOpacity="0.07"
                  strokeWidth="1"
                  strokeDasharray="3 6"
                  fill="none"
                />
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke="currentColor"
                  strokeOpacity="0.09"
                  strokeWidth="5"
                  fill="none"
                />
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={activeTheme.accentHex}
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform={`rotate(-90 ${center} ${center})`}
                  className="transition-all duration-700"
                />
                <circle
                  cx={pearlX}
                  cy={pearlY}
                  r="6.5"
                  fill={activeTheme.accentHex}
                  className="transition-all duration-700"
                />
                <circle
                  cx={pearlX}
                  cy={pearlY}
                  r="3"
                  fill="#ffffff"
                  className="transition-all duration-700"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
                <span
                  style={{ color: activeTheme.accentHex }}
                  className="text-[10px] font-extrabold uppercase tracking-[0.22em] mb-1.5"
                >
                  {mode === "focus"
                    ? isRunning
                      ? "Deep Focus Flow"
                      : "Ready to Begin"
                    : breathGuideOnBreak
                      ? "Inhale 4s • Exhale 6s"
                      : "Rest & Recharge"}
                </span>

                <div
                  style={{ fontFamily: timerFontFamily }}
                  className="text-[64px] sm:text-[74px] font-normal tracking-tight leading-none tabular-nums"
                >
                  {formatTimerDigits(secondsLeft)}
                </div>

                <div className="flex items-center gap-1.5 mt-4">
                  {Array.from({ length: Math.min(10, dailyGoal) }).map(
                    (_, i) => {
                      const done = i < completedSessionsToday;
                      return (
                        <span
                          key={i}
                          style={
                            done
                              ? { backgroundColor: activeTheme.accentHex }
                              : undefined
                          }
                          className={`w-2 h-2 rounded-full transition-all ${
                            done ? "scale-110 shadow-xs" : "bg-current/15"
                          }`}
                        />
                      );
                    },
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative z-10 py-6 w-full space-y-4">
              <span
                style={{ color: activeTheme.accentHex }}
                className="text-[10px] font-extrabold uppercase tracking-[0.22em] block"
              >
                {mode === "focus"
                  ? `Session ${completedSessionsToday + 1} of ${dailyGoal}`
                  : breathGuideOnBreak
                    ? "Breathe Slowly • Inhale 4s, Exhale 6s"
                    : "Restorative Break"}
              </span>

              <div
                style={{ fontFamily: timerFontFamily }}
                className="text-[78px] sm:text-[92px] font-normal tracking-tight leading-none tabular-nums"
              >
                {formatTimerDigits(secondsLeft)}
              </div>


              {visualStyle === "bar" && (
                <div className="w-full max-w-[300px] mx-auto h-1.5 rounded-full bg-current/10 overflow-hidden">
                  <div
                    className="h-full transition-all duration-500 rounded-full"
                    style={{
                      width: `${progressRatio * 100}%`,
                      backgroundColor: activeTheme.accentHex,
                    }}
                  />
                </div>
              )}
            </div>
          )}

          <div className="relative z-10 inline-flex items-center gap-2.5 p-1.5 rounded-full bg-current/[0.04] border border-current/10 mt-3">
            <button
              type="button"
              onClick={handleResetTimer}
              title="Reset Timer (R)"
              className="w-10 h-10 rounded-full hover:bg-current/10 flex items-center justify-center opacity-75 hover:opacity-100 cursor-pointer transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleToggleStart}
              style={{
                backgroundColor: activeTheme.accentHex,
                color: "#ffffff",
              }}
              className="px-8 py-3 rounded-full text-[13.5px] font-bold tracking-wide flex items-center gap-2 shadow-md hover:brightness-105 cursor-pointer transition-all"
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Focus</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleBoostFiveMinutes}
              title="Add 5 Minutes"
              className="px-2.5 h-10 rounded-full hover:bg-current/10 text-[11px] font-bold opacity-75 hover:opacity-100 cursor-pointer transition-all tabular-nums"
            >
              +5m
            </button>

            <button
              type="button"
              onClick={handleSkipPhase}
              title="Skip to Next Phase"
              className="w-10 h-10 rounded-full hover:bg-current/10 flex items-center justify-center opacity-75 hover:opacity-100 cursor-pointer transition-all"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TO-DO LIST */}
        <div
          style={{ backgroundColor: activeTheme.cardBg }}
          className="w-full rounded-[32px] backdrop-blur-2xl border border-current/10 p-5 sm:p-6 shadow-[0_14px_40px_rgba(0,0,0,0.06)] space-y-3.5"
        >
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.18em]">
                Focus Tasks
              </span>
              <span
                style={{ color: activeTheme.mutedColor }}
                className="text-[11px] font-semibold tabular-nums"
              >
                {todos.filter((t) => t.completed).length} of {todos.length}
              </span>
            </div>


            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => txtInputRef.current?.click()}
                title="Upload a .txt file (one task per line)"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-current/[0.05] hover:bg-current/10 border border-current/10 text-[11px] font-bold opacity-85 hover:opacity-100 cursor-pointer transition-all"
              >
                <Upload className="w-3 h-3" />
                <span>Import .txt</span>
              </button>

              {todos.some((t) => t.completed) && (
                <button
                  type="button"
                  onClick={() =>
                    setTodos((prev) => prev.filter((t) => !t.completed))
                  }
                  className="text-[11px] font-semibold opacity-60 hover:opacity-100 cursor-pointer"
                >
                  Clear Done
                </button>
              )}
            </div>
          </div>


          <form
            onSubmit={handleAddTodo}
            className="flex items-center gap-2 p-1.5 pl-4 rounded-2xl bg-current/[0.04] border border-current/10 focus-within:border-current/25 transition-all"
          >
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              placeholder="Write a focus task and press Enter..."
              className="flex-1 bg-transparent text-[13px] outline-none placeholder:opacity-50"
            />
            <button
              type="submit"
              style={{
                backgroundColor: activeTheme.accentHex,
                color: "#ffffff",
              }}
              className="px-3.5 py-2 rounded-xl text-[11.5px] font-bold cursor-pointer shrink-0 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          <div className="space-y-1 max-h-[195px] overflow-y-auto pr-1">
            {todos.length === 0 ? (
              <p
                style={{ color: activeTheme.mutedColor }}
                className="text-[12px] text-center py-4"
              >
                Your task queue is clear — type above or import a{" "}
                <strong>.txt</strong> file.
              </p>
            ) : (
              todos.map((todo) => {
                const isPinned = activeTodoId === todo.id;
                return (
                  <div
                    key={todo.id}
                    className={`px-3.5 py-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 group ${
                      isPinned && !todo.completed
                        ? "border-current/20 bg-current/[0.05]"
                        : "border-transparent hover:bg-current/[0.04]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleTodoCompleted(todo.id)}
                      className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
                    >
                      <span
                        style={
                          todo.completed
                            ? {
                                backgroundColor: activeTheme.accentHex,
                                borderColor: activeTheme.accentHex,
                                color: "#ffffff",
                              }
                            : undefined
                        }
                        className="w-4 h-4 rounded-full border border-current/35 flex items-center justify-center shrink-0 transition-all"
                      >
                        {todo.completed && (
                          <Check className="w-2.5 h-2.5" strokeWidth={3} />
                        )}
                      </span>
                      <span
                        className={`text-[13.5px] font-medium truncate transition-all ${
                          todo.completed ? "line-through opacity-40" : ""
                        }`}
                      >
                        {todo.text}
                      </span>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      {showEstPomodoros && (
                        <button
                          type="button"
                          onClick={() => setActiveTodoId(todo.id)}
                          title="Pin as active focus task"
                          style={
                            isPinned && !todo.completed
                              ? { color: activeTheme.accentHex }
                              : undefined
                          }
                          className="px-2 py-0.5 rounded-md bg-current/[0.05] text-[10.5px] font-bold tabular-nums opacity-70 hover:opacity-100 cursor-pointer flex items-center gap-1"
                        >
                          <Target className="w-2.5 h-2.5" />
                          <span>
                            {todo.completedPomodoros}/{todo.estPomodoros}
                          </span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteTodo(todo.id)}
                        aria-label="Delete task"
                        className="opacity-0 group-hover:opacity-65 hover:!opacity-100 cursor-pointer p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* LOWER-RIGHT SETTINGS BUTTON */}

      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          style={{
            backgroundColor: activeTheme.cardBg,
            color: activeTheme.textColor,
          }}
          title="Open Sanctuary Settings (S)"
          className="w-12 h-12 rounded-2xl backdrop-blur-2xl border border-current/15 shadow-xl flex items-center justify-center hover:scale-105 cursor-pointer transition-all"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* SETTINGS MODAL */}

      {settingsOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSettingsOpen(false);
          }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
        >
          <div
            style={{
              backgroundColor: activeTheme.modalBg,
              color: activeTheme.textColor,
            }}
            className="w-full max-w-[880px] h-[600px] max-h-[88vh] rounded-[36px] border border-current/15 shadow-2xl flex flex-col md:flex-row overflow-hidden"
          >
            {/* SIDEBAR */}

            <div className="w-full md:w-[240px] border-b md:border-b-0 md:border-r border-current/10 p-5 flex flex-col justify-between bg-current/[0.02] shrink-0">
              <div className="space-y-5">
                <div className="px-2">
                  <span
                    style={{ color: activeTheme.accentHex }}
                    className="text-[10px] font-extrabold uppercase tracking-[0.2em] block"
                  >
                    Sanctuary Studio
                  </span>
                  <h3
                    style={{ fontFamily: timerFontFamily }}
                    className="text-[20px] font-normal tracking-tight mt-0.5"
                  >
                    Preferences
                  </h3>
                </div>

                <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
                  {(
                    [
                      { id: "pacing", label: "Focus & Pacing", icon: Sliders },
                      {
                        id: "scenes",
                        label: "Scenes & Wallpaper",
                        icon: Palette,
                      },
                      { id: "dial", label: "Dial & Clock Style", icon: Clock },
                      {
                        id: "ambient",
                        label: "Ambient Soundscapes",
                        icon: Headphones,
                      },
                      { id: "chimes", label: "Chimes & Web Push", icon: Bell },
                      {
                        id: "zen",
                        label: "Tasks, Zen & Stats",
                        icon: Sparkles,
                      },
                    ] as const
                  ).map((item) => {
                    const Icon = item.icon;
                    const active = settingsSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSettingsSection(item.id)}
                        style={
                          active
                            ? {
                                backgroundColor: activeTheme.accentHex,
                                color: "#ffffff",
                              }
                            : undefined
                        }
                        className={`px-3.5 py-2.5 rounded-2xl text-[12.5px] font-bold flex items-center gap-3 text-left transition-all cursor-pointer shrink-0 ${
                          active
                            ? "shadow-xs"
                            : "opacity-75 hover:opacity-100 hover:bg-current/5"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="hidden md:flex items-center justify-between px-2 pt-4 border-t border-current/10 text-[11px] opacity-65">
                <span>30 Studio Controls</span>
                <span>Auto-Saved</span>
              </div>
            </div>

            {/* CONTENT */}
            
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <div className="px-7 py-5 border-b border-current/10 flex items-center justify-between shrink-0">
                <div>
                  <h4 className="text-[16px] font-bold">
                    {settingsSection === "pacing" &&
                      "Focus Durations & Workflow Presets"}
                    {settingsSection === "scenes" &&
                      "Illustrated Scenes & Custom Wallpaper"}
                    {settingsSection === "dial" &&
                      "Timer Dial, Typography & Top-Right Clock"}
                    {settingsSection === "ambient" &&
                      "Ambient Focus Audio & MP3 Uploader"}
                    {settingsSection === "chimes" &&
                      "Soft Notification Chimes & Background Push"}
                    {settingsSection === "zen" &&
                      "Task Queue (.txt), Zen Rules & Daily Stats"}
                  </h4>
                  <p
                    style={{ color: activeTheme.mutedColor }}
                    className="text-[12px]"
                  >
                    {settingsSection === "pacing" &&
                      "Customize your intervals or choose a 1-click workflow rhythm."}
                    {settingsSection === "scenes" &&
                      "Select a soft multi-color illustration or upload your own wallpaper."}
                    {settingsSection === "dial" &&
                      "Tailor the center timer dial and top-right live clock."}
                    {settingsSection === "ambient" &&
                      "Layer soothing rain, pink noise, or your own music while focusing."}
                    {settingsSection === "chimes" &&
                      "Configure gentle completion chimes and closed-tab Web Push alerts."}
                    {settingsSection === "zen" &&
                      "Import tasks from .txt files, lock focus sessions, and inspect progress."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="w-8 h-8 rounded-full bg-current/5 hover:bg-current/10 flex items-center justify-center cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6 text-[13px]">
                {settingsSection === "pacing" && (
                  <div className="space-y-6">
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-65 block mb-3">
                        Workflow Presets
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {WORKFLOW_PRESETS.map((p) => {
                          const selected = activePresetId === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setActivePresetId(p.id);
                                setFocusMins(p.focus);
                                setShortBreakMins(p.short);
                                setLongBreakMins(p.long);
                                setSecondsLeft(p.focus * 60);
                                setMode("focus");
                                setIsRunning(false);
                              }}
                              style={
                                selected
                                  ? {
                                      borderColor: activeTheme.accentHex,
                                      backgroundColor: `${activeTheme.accentHex}15`,
                                    }
                                  : undefined
                              }
                              className="p-3.5 rounded-2xl border border-current/10 text-left flex items-center justify-between cursor-pointer hover:bg-current/[0.03] transition-all"
                            >
                              <div>
                                <div className="font-bold text-[13px]">
                                  {p.name}
                                </div>
                                <div className="text-[11px] opacity-65">
                                  {p.desc}
                                </div>
                              </div>
                              <span
                                style={{ color: activeTheme.accentHex }}
                                className="text-[11.5px] font-extrabold tabular-nums shrink-0 ml-2"
                              >
                                {p.focus}/{p.short}/{p.long}m
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="divide-y divide-current/10 border-t border-b border-current/10">
                      {[
                        {
                          label: "Focus Session Duration",
                          desc: "Minutes per primary Pomodoro focus block",
                          val: focusMins,
                          min: 5,
                          max: 180,
                          step: 5,
                          onChange: (v: number) => {
                            setFocusMins(v);
                            if (mode === "focus" && !isRunning)
                              setSecondsLeft(v * 60);
                          },
                        },
                        {
                          label: "Short Break Duration",
                          desc: "Breathing & recovery pause between blocks",
                          val: shortBreakMins,
                          min: 1,
                          max: 60,
                          step: 1,
                          onChange: (v: number) => {
                            setShortBreakMins(v);
                            if (mode === "shortBreak" && !isRunning)
                              setSecondsLeft(v * 60);
                          },
                        },
                        {
                          label: "Long Break Duration",
                          desc: "Extended recharge after completing a cycle",
                          val: longBreakMins,
                          min: 5,
                          max: 90,
                          step: 5,
                          onChange: (v: number) => {
                            setLongBreakMins(v);
                            if (mode === "longBreak" && !isRunning)
                              setSecondsLeft(v * 60);
                          },
                        },
                        {
                          label: "Long Break Interval",
                          desc: "Number of focus blocks before a long break",
                          val: longBreakInterval,
                          min: 2,
                          max: 10,
                          step: 1,
                          onChange: (v: number) => setLongBreakInterval(v),
                        },
                        {
                          label: "Daily Focus Goal",
                          desc: "Target sessions displayed as pearls on the dial",
                          val: dailyGoal,
                          min: 1,
                          max: 16,
                          step: 1,
                          onChange: (v: number) => setDailyGoal(v),
                        },
                      ].map((row) => (
                        <div
                          key={row.label}
                          className="py-3.5 flex items-center justify-between gap-4"
                        >
                          <div>
                            <div className="font-bold">{row.label}</div>
                            <div className="text-[11.5px] opacity-65">
                              {row.desc}
                            </div>
                          </div>

                          <div className="inline-flex items-center gap-2 p-1 rounded-xl bg-current/[0.05] border border-current/10">
                            <button
                              type="button"
                              onClick={() =>
                                row.onChange(
                                  Math.max(row.min, row.val - row.step),
                                )
                              }
                              className="w-7 h-7 rounded-lg hover:bg-current/10 flex items-center justify-center cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-10 text-center font-bold tabular-nums">
                              {row.val}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                row.onChange(
                                  Math.min(row.max, row.val + row.step),
                                )
                              }
                              className="w-7 h-7 rounded-lg hover:bg-current/10 flex items-center justify-center cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-bold">
                            Auto-Start Recovery Breaks
                          </div>
                          <div className="text-[11.5px] opacity-65">
                            Begin break countdown automatically when focus ends
                          </div>
                        </div>
                        {renderToggle(
                          autoStartBreaks,
                          () => setAutoStartBreaks((v) => !v),
                          "Auto-start breaks",
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-bold">
                            Auto-Start Next Focus Block
                          </div>
                          <div className="text-[11.5px] opacity-65">
                            Flow continuously into the next focus block after a
                            break
                          </div>
                        </div>
                        {renderToggle(
                          autoStartFocus,
                          () => setAutoStartFocus((v) => !v),
                          "Auto-start focus",
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-bold">
                            Cycle-Phase Smart Pacing (20m / 7m)
                          </div>
                          <div className="text-[11.5px] opacity-65">
                            Adapts intervals for low-energy menstrual &amp; late
                            luteal days
                          </div>
                        </div>
                        {renderToggle(
                          cyclePhaseSync,
                          () => {
                            const next = !cyclePhaseSync;
                            setCyclePhaseSync(next);
                            if (next) {
                              setFocusMins(20);
                              setShortBreakMins(7);
                              setSecondsLeft(20 * 60);
                            }
                          },
                          "Cycle-phase smart pacing",
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {settingsSection === "scenes" && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-65">
                          Eye-Comfort Light &amp; Color Scenes (11)
                        </span>
                        <span className="text-[10.5px] font-semibold opacity-60">
                          Zero-glare warm &amp; botanical palettes
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {ILLUSTRATED_THEMES.filter((t) => !t.isDark).map(
                          (thm) => {
                            const selected = themeId === thm.id && !customBgUrl;
                            return (
                              <button
                                key={thm.id}
                                type="button"
                                onClick={() => {
                                  setThemeId(thm.id);
                                  setCustomBgUrl(null);
                                }}
                                style={
                                  selected
                                    ? { borderColor: activeTheme.accentHex }
                                    : undefined
                                }
                                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                                  selected
                                    ? "border-2 shadow-sm bg-current/[0.05]"
                                    : "border-current/10 hover:bg-current/[0.02]"
                                }`}
                              >
                                <div
                                  className="w-full h-11 rounded-xl mb-2 border border-black/10 relative overflow-hidden"
                                  style={{ background: thm.bgGradient }}
                                >
                                  <span
                                    className="w-3.5 h-3.5 rounded-full absolute top-2 right-2"
                                    style={{
                                      backgroundColor: thm.celestialColor,
                                    }}
                                  />
                                  <div
                                    className="w-full h-3.5 absolute bottom-0"
                                    style={{
                                      backgroundColor: thm.horizonColors[2],
                                    }}
                                  />
                                </div>
                                <div className="font-bold text-[12px] truncate">
                                  {thm.name}
                                </div>
                                <div className="text-[10.5px] opacity-65 truncate">
                                  {thm.subtitle}
                                </div>
                              </button>
                            );
                          },
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-65">
                          Velvet Nocturne Dark Scenes (7)
                        </span>
                        <span className="text-[10.5px] font-semibold opacity-60">
                          Low-luminance night sanctuaries
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {ILLUSTRATED_THEMES.filter((t) => t.isDark).map(
                          (thm) => {
                            const selected = themeId === thm.id && !customBgUrl;
                            return (
                              <button
                                key={thm.id}
                                type="button"
                                onClick={() => {
                                  setThemeId(thm.id);
                                  setCustomBgUrl(null);
                                }}
                                style={
                                  selected
                                    ? { borderColor: activeTheme.accentHex }
                                    : undefined
                                }
                                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                                  selected
                                    ? "border-2 shadow-sm bg-current/[0.05]"
                                    : "border-current/10 hover:bg-current/[0.02]"
                                }`}
                              >
                                <div
                                  className="w-full h-11 rounded-xl mb-2 border border-white/10 relative overflow-hidden"
                                  style={{ background: thm.bgGradient }}
                                >
                                  <span
                                    className="w-3.5 h-3.5 rounded-full absolute top-2 right-2"
                                    style={{
                                      backgroundColor: thm.celestialColor,
                                    }}
                                  />
                                  <div
                                    className="w-full h-3.5 absolute bottom-0"
                                    style={{
                                      backgroundColor: thm.horizonColors[2],
                                    }}
                                  />
                                </div>
                                <div className="font-bold text-[12px] truncate">
                                  {thm.name}
                                </div>
                                <div className="text-[10.5px] opacity-65 truncate">
                                  {thm.subtitle}
                                </div>
                              </button>
                            );
                          },
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-current/[0.04] border border-current/10 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="font-bold">
                          Custom Image or Video Wallpaper
                        </div>
                        <div className="text-[11.5px] opacity-65">
                          Upload any high-res JPG, PNG, GIF, or looping MP4
                          scene
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => bgInputRef.current?.click()}
                          style={{
                            backgroundColor: activeTheme.accentHex,
                            color: "#ffffff",
                          }}
                          className="px-4 py-2 rounded-xl text-[12px] font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Upload Wallpaper</span>
                        </button>
                        {customBgUrl && (
                          <button
                            type="button"
                            onClick={() => setCustomBgUrl(null)}
                            className="px-3 py-2 rounded-xl border border-current/15 text-[11.5px] font-semibold cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div>
                        <div className="flex justify-between font-bold mb-1.5">
                          <span>Background Dimming Veil</span>
                          <span className="tabular-nums">{bgDimPct}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={75}
                          value={bgDimPct}
                          onChange={(e) => setBgDimPct(Number(e.target.value))}
                          className="w-full cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between font-bold mb-1.5">
                          <span>Soft Depth-of-Field Blur</span>
                          <span className="tabular-nums">{bgBlurPx} px</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={20}
                          value={bgBlurPx}
                          onChange={(e) => setBgBlurPx(Number(e.target.value))}
                          className="w-full cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {settingsSection === "dial" && (
                  <div className="space-y-6 divide-y divide-current/10">
                    <div className="pb-5">
                      <div className="font-bold mb-1">
                        Center Timer Dial Architecture
                      </div>
                      <div className="text-[11.5px] opacity-65 mb-3">
                        Choose how progress is visualized around the countdown
                      </div>
                      <div className="grid grid-cols-3 gap-2.5">
                        {(
                          [
                            { id: "ring", label: "Orbital Pearl Ring" },
                            { id: "minimal", label: "Pure Typography" },
                            { id: "bar", label: "Horizon Line" },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setVisualStyle(opt.id)}
                            style={
                              visualStyle === opt.id
                                ? {
                                    backgroundColor: activeTheme.accentHex,
                                    color: "#ffffff",
                                  }
                                : undefined
                            }
                            className="py-2.5 px-3 rounded-xl border border-current/15 font-bold text-[12px] cursor-pointer transition-all"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="py-5">
                      <div className="font-bold mb-1">
                        Numeral Typography Suite
                      </div>
                      <div className="text-[11.5px] opacity-65 mb-3">
                        Applies to both the center timer and top-right clock
                      </div>
                      <div className="grid grid-cols-3 gap-2.5">
                        {(
                          [
                            { id: "serif", label: "Editorial Serif" },
                            { id: "sans", label: "Modern Sans" },
                            { id: "mono", label: "Tabular Mono" },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setFontStyle(opt.id)}
                            style={
                              fontStyle === opt.id
                                ? {
                                    backgroundColor: activeTheme.accentHex,
                                    color: "#ffffff",
                                  }
                                : undefined
                            }
                            className="py-2.5 px-3 rounded-xl border border-current/15 font-bold text-[12px] cursor-pointer transition-all"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-5 space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-bold">
                            24-Hour Military Clock Format
                          </div>
                          <div className="text-[11.5px] opacity-65">
                            Display top-right clock as 14:30 instead of 2:30 PM
                          </div>
                        </div>
                        {renderToggle(
                          use24HourClock,
                          () => setUse24HourClock((v) => !v),
                          "24-hour clock",
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-bold">
                            Show Live Seconds on Clock
                          </div>
                          <div className="text-[11.5px] opacity-65">
                            Include real-time seconds counter in the top-right
                            clock
                          </div>
                        </div>
                        {renderToggle(
                          showClockSeconds,
                          () => setShowClockSeconds((v) => !v),
                          "Show clock seconds",
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-bold">
                            Show Day &amp; Date Subtitle
                          </div>
                          <div className="text-[11.5px] opacity-65">
                            Display current weekday and date beneath the clock
                          </div>
                        </div>
                        {renderToggle(
                          showClockDate,
                          () => setShowClockDate((v) => !v),
                          "Show clock date",
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {settingsSection === "ambient" && (
                  <div className="space-y-6">
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-65 block mb-3">
                        Procedural Focus Soundscapes
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {(
                          [
                            {
                              id: "none",
                              label: "Quiet Sanctuary",
                              sub: "No background audio",
                            },
                            {
                              id: "soft_rain",
                              label: "Soft Rain",
                              sub: "Gentle rainfall veil",
                            },
                            {
                              id: "pink_noise",
                              label: "Warm Pink Noise",
                              sub: "Masks room distractions",
                            },
                            {
                              id: "forest_wind",
                              label: "Forest Wind",
                              sub: "Airy canopy breeze",
                            },
                            {
                              id: "binaural_432",
                              label: "432Hz Alpha Drone",
                              sub: "Deep flow frequency",
                            },
                            {
                              id: "warm_drone",
                              label: "Tibetan Bowl Hum",
                              sub: "Grounding harmonic",
                            },
                          ] as const
                        ).map((amb) => {
                          const selected = ambientSound === amb.id;
                          return (
                            <button
                              key={amb.id}
                              type="button"
                              onClick={() => setAmbientSound(amb.id)}
                              style={
                                selected
                                  ? {
                                      borderColor: activeTheme.accentHex,
                                      backgroundColor: `${activeTheme.accentHex}15`,
                                    }
                                  : undefined
                              }
                              className="p-3.5 rounded-2xl border border-current/10 text-left cursor-pointer transition-all"
                            >
                              <div className="font-bold text-[12.5px]">
                                {amb.label}
                              </div>
                              <div className="text-[11px] opacity-65">
                                {amb.sub}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-current/[0.04] border border-current/10 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="font-bold">
                          Custom Lo-Fi / Ambient Track Uploader
                        </div>
                        <div className="text-[11.5px] opacity-65">
                          {customAmbientName
                            ? `Active file: ${customAmbientName}`
                            : "Upload any MP3, WAV, or OGG track to loop during focus"}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => ambientInputRef.current?.click()}
                        style={{
                          backgroundColor: activeTheme.accentHex,
                          color: "#ffffff",
                        }}
                        className="px-4 py-2 rounded-xl text-[12px] font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Music className="w-3.5 h-3.5" />
                        <span>Upload Audio</span>
                      </button>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div>
                        <div className="flex justify-between font-bold mb-1.5">
                          <span>Ambient Soundscape Volume</span>
                          <span className="tabular-nums">{ambientVolume}%</span>
                        </div>
                        <input
                          type="range"
                          min={5}
                          max={100}
                          value={ambientVolume}
                          onChange={(e) =>
                            setAmbientVolume(Number(e.target.value))
                          }
                          className="w-full cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-4 pt-2">
                        <div>
                          <div className="font-bold">
                            Auto-Silence Ambient Audio During Breaks
                          </div>
                          <div className="text-[11.5px] opacity-65">
                            Pauses background soundscape when a break begins
                          </div>
                        </div>
                        {renderToggle(
                          pauseAmbientOnBreak,
                          () => setPauseAmbientOnBreak((v) => !v),
                          "Pause ambient on break",
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {settingsSection === "chimes" && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-65">
                          Soft Acoustic Completion Chimes
                        </span>
                        <button
                          type="button"
                          onClick={() => chimeInputRef.current?.click()}
                          className="text-[11.5px] font-bold underline cursor-pointer flex items-center gap-1"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Upload Custom Alarm Sound</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {SOFT_SOUND_LIBRARY.map((snd) => {
                          const selected = chimeTone === snd.id;
                          return (
                            <button
                              key={snd.id}
                              type="button"
                              onClick={() => {
                                setChimeTone(snd.id);
                                playSoftChime(
                                  snd.id,
                                  chimeVolume,
                                  customChimeUrl,
                                );
                              }}
                              style={
                                selected
                                  ? {
                                      borderColor: activeTheme.accentHex,
                                      backgroundColor: `${activeTheme.accentHex}15`,
                                    }
                                  : undefined
                              }
                              className="p-3 rounded-2xl border border-current/10 text-left flex items-center justify-between cursor-pointer transition-all"
                            >
                              <div className="min-w-0">
                                <div className="font-bold text-[12.5px] truncate">
                                  {snd.name}
                                </div>
                                <div className="text-[10.5px] opacity-65 truncate">
                                  {snd.desc}
                                </div>
                              </div>
                              <Volume2 className="w-3.5 h-3.5 shrink-0 opacity-60 ml-2" />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold mb-1.5">
                        <span>Chime Softness &amp; Volume</span>
                        <span className="tabular-nums">{chimeVolume}%</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={chimeVolume}
                        onChange={(e) => setChimeVolume(Number(e.target.value))}
                        onMouseUp={() =>
                          playSoftChime(chimeTone, chimeVolume, customChimeUrl)
                        }
                        className="w-full cursor-pointer"
                      />
                    </div>

                    <div className="space-y-4 pt-3 border-t border-current/10">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-bold">
                            Closed-Tab Background Web Push
                          </div>
                          <div className="text-[11.5px] opacity-65">
                            Dispatches OS push notification via /api/push even
                            if tab is closed
                          </div>
                        </div>
                        {renderToggle(
                          webPushEnabled,
                          () => setWebPushEnabled((v) => !v),
                          "Closed-tab web push",
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-bold">
                            Soft Mechanical Second Tick
                          </div>
                          <div className="text-[11.5px] opacity-65">
                            Play a subtle acoustic pulse every second while
                            running
                          </div>
                        </div>
                        {renderToggle(
                          tickSoundEnabled,
                          () => setTickSoundEnabled((v) => !v),
                          "Mechanical tick sound",
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {settingsSection === "zen" && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-2xl bg-current/[0.04] border border-current/10 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="font-bold">
                          Plain-Text (.txt) Task Queue Sync
                        </div>
                        <div className="text-[11.5px] opacity-65">
                          Upload any .txt file (one task per line) or export
                          completed items
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => txtInputRef.current?.click()}
                          style={{
                            backgroundColor: activeTheme.accentHex,
                            color: "#ffffff",
                          }}
                          className="px-3.5 py-2 rounded-xl text-[12px] font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Import .txt</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleExportTodosTxt}
                          className="px-3.5 py-2 rounded-xl border border-current/15 text-[12px] font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export .txt</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-bold">
                            Vagal Breathing Guide on Breaks
                          </div>
                          <div className="text-[11.5px] opacity-65">
                            Displays 4s inhale / 6s exhale prompt during break
                            timers
                          </div>
                        </div>
                        {renderToggle(
                          breathGuideOnBreak,
                          () => setBreathGuideOnBreak((v) => !v),
                          "Breathing guide on break",
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-bold">
                            Auto-Fade Controls When Idle
                          </div>
                          <div className="text-[11.5px] opacity-65">
                            Gently dims top navigation after 4.5 seconds of
                            mouse stillness
                          </div>
                        </div>
                        {renderToggle(
                          autoHideUiIdle,
                          () => setAutoHideUiIdle((v) => !v),
                          "Auto-fade UI when idle",
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-bold">
                            Strict Focus Lock Mode
                          </div>
                          <div className="text-[11.5px] opacity-65">
                            Prevents pausing or skipping while a focus block is
                            active
                          </div>
                        </div>
                        {renderToggle(
                          strictFocusLock,
                          () => setStrictFocusLock((v) => !v),
                          "Strict focus lock",
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-bold">
                            Task Pomodoro Target Counters
                          </div>
                          <div className="text-[11.5px] opacity-65">
                            Show completed/estimated sessions next to each task
                          </div>
                        </div>
                        {renderToggle(
                          showEstPomodoros,
                          () => setShowEstPomodoros((v) => !v),
                          "Show task counters",
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-bold">
                            Live Countdown in Browser Tab Title
                          </div>
                          <div className="text-[11.5px] opacity-65">
                            Shows remaining MM:SS in the browser tab while
                            working elsewhere
                          </div>
                        </div>
                        {renderToggle(
                          tabTitleCountdown,
                          () => setTabTitleCountdown((v) => !v),
                          "Tab title countdown",
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-current/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-65">
                          Today&apos;s Focus Telemetry
                        </span>
                        <button
                          type="button"
                          onClick={toggleFullscreen}
                          className="text-[11.5px] font-bold underline cursor-pointer flex items-center gap-1"
                        >
                          {isFullscreen ? (
                            <Minimize2 className="w-3.5 h-3.5" />
                          ) : (
                            <Maximize2 className="w-3.5 h-3.5" />
                          )}
                          <span>Toggle Fullscreen (F)</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-3 rounded-2xl bg-current/[0.04] border border-current/10">
                          <div className="text-[18px] font-bold tabular-nums">
                            {completedSessionsToday} / {dailyGoal}
                          </div>
                          <div className="text-[10.5px] opacity-65">
                            Sessions
                          </div>
                        </div>
                        <div className="p-3 rounded-2xl bg-current/[0.04] border border-current/10">
                          <div className="text-[18px] font-bold tabular-nums">
                            {totalFocusMinutesToday}m
                          </div>
                          <div className="text-[10.5px] opacity-65">
                            Focused Today
                          </div>
                        </div>
                        <div className="p-3 rounded-2xl bg-current/[0.04] border border-current/10">
                          <div className="text-[18px] font-bold tabular-nums">
                            {todos.filter((t) => t.completed).length}
                          </div>
                          <div className="text-[10.5px] opacity-65">
                            Tasks Done
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
