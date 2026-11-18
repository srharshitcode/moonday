"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { createClient } from "@/utils/supabase/client";
import { format, parseISO, subDays, differenceInCalendarDays } from "date-fns";
import {
  Search,
  Plus,
  Save,
  Trash2,
  Tag,
  BookOpen,
  Calendar as CalendarIcon,
  PenLine,
  X,
  Sparkles,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link as LinkIcon,
  List,
  ListOrdered,
  CheckSquare,
  Type,
  Highlighter,
  RemoveFormatting,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  Heading1,
  Heading2,
  Minus,
  Undo2,
  Redo2,
  Maximize2,
  Minimize2,
  Mic,
  MicOff,
  Star,
  Download,
  Copy,
  Check,
  LayoutGrid,
  Rows3,
  Clock,
  Flame,
  FileText,
  ArrowUpDown,
  Wand2,
  Eye,
  Feather,
  SlidersHorizontal,
  Pin,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Columns,
  Code,
  Replace,
  Layers,
  BookMarked,
  FileJson,
  Printer,
  Shuffle,
  Music,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useOfflineResilience,
  SaveStatusBadge,
  NetworkStatusBanner,
} from "@/components/NetworkResilience";
import { buildSyncTimestamps } from "@/utils/offlineTimestamps";


const SUGGESTED_JOURNAL_TAGS = [
  "gratitude",
  "reflection",
  "self-care",
  "mood",
  "vent",
  "milestone",
  "dream",
  "healing",
  "boundaries",
  "growth",
  "poetry",
  "therapy",
];

const MOOD_AURAS = [
  {
    id: "peaceful",
    label: "Peaceful",
    emoji: "🌿",
    tag: "mood:peaceful",
    color: "#10b981",
  },

  {
    id: "grateful",
    label: "Grateful",
    emoji: "✨",
    tag: "mood:grateful",
    color: "#f59e0b",
  },

  {
    id: "reflective",
    label: "Reflective",
    emoji: "🌙",
    tag: "mood:reflective",
    color: "#8b5cf6",
  },

  {
    id: "radiant",
    label: "Radiant",
    emoji: "🌸",
    tag: "mood:radiant",
    color: "#ec4899",
  },

  {
    id: "tender",
    label: "Tender",
    emoji: "🫧",
    tag: "mood:tender",
    color: "#3b82f6",
  },

  {
    id: "releasing",
    label: "Releasing",
    emoji: "🌊",
    tag: "mood:releasing",
    color: "#06b6d4",
  },

  {
    id: "inspired",
    label: "Inspired",
    emoji: "🔥",
    tag: "mood:inspired",
    color: "#f97316",
  },

  {
    id: "grounded",
    label: "Grounded",
    emoji: "🪵",
    tag: "mood:grounded",
    color: "#a55f78",
  },
];


const WEATHER_STAMPS = [
  { id: "sunny", label: "Sunny", emoji: "☀️", tag: "weather:sunny" },
  { id: "cloudy", label: "Soft Clouds", emoji: "⛅", tag: "weather:cloudy" },
  { id: "rainy", label: "Rainy", emoji: "🌧️", tag: "weather:rainy" },
  { id: "breezy", label: "Breezy", emoji: "🍃", tag: "weather:breezy" },
  { id: "cozy", label: "Cozy Night", emoji: "🕯️", tag: "weather:cozy" },
];


const CYCLE_SEASONS = [
  {
    id: "menstrual",
    label: "Inner Winter (Menses)",
    emoji: "🩸",
    tag: "phase:menstrual",
  },

  {
    id: "follicular",
    label: "Inner Spring (Follicular)",
    emoji: "🌱",
    tag: "phase:follicular",
  },

  {
    id: "ovulatory",
    label: "Inner Summer (Ovulatory)",
    emoji: "☀️",
    tag: "phase:ovulatory",
  },

  {

    id: "luteal",
    label: "Inner Autumn (Luteal)",
    emoji: "🍂",
    tag: "phase:luteal",
  },
];

const ENERGY_LEVELS = [
  { id: "low", label: "Restorative (Low)", emoji: "🪫", tag: "energy:low" },
  { id: "steady", label: "Balanced", emoji: "⚖️", tag: "energy:steady" },
  { id: "vibrant", label: "High Flow", emoji: "⚡", tag: "energy:vibrant" },
];


const FONT_SIZES = [
  { label: "Very Tiny", size: "11px" },
  { label: "Tiny", size: "13px" },
  { label: "Small", size: "15px" },
  { label: "Medium", size: "16px" },
  { label: "Normal (Default)", size: "18px" },
  { label: "Large", size: "22px" },
  { label: "Extra Large", size: "28px" },
  { label: "Huge", size: "36px" },
];


const FONT_FAMILIES = [
  {
    id: "serif",
    label: "Literary Serif",
    css: "'Georgia', 'Cambria', 'Times New Roman', serif",
  },

  {
    id: "sans",
    label: "Editorial Sans",
    css: "'Inter', system-ui, -apple-system, sans-serif",
  },

  {
    id: "classic",
    label: "Book Baskerville",
    css: "'Baskerville', 'Palatino Linotype', 'Book Antiqua', serif",
  },

  {
    id: "humanist",
    label: "Humanist Optima",
    css: "'Optima', 'Candara', 'Segoe UI', sans-serif",
  },

  {
    id: "mono",
    label: "Typewriter Mono",
    css: "ui-monospace, 'SFMono-Regular', 'Cascadia Mono', monospace",
  },

  {
    id: "cursive",
    label: "Poetic Script",
    css: "'Snell Roundhand', 'Apple Chancery', 'Segoe Script', cursive, serif",
  },
] as const;

type FontFamilyId = (typeof FONT_FAMILIES)[number]["id"];

const PAPER_CANVASES = [
  { id: "blank", label: "Alabaster Blank", badge: "Clean" },
  { id: "ruled", label: "Ruled Stationery", badge: "Lines" },
  { id: "dots", label: "Dot Matrix", badge: "Dots" },
  { id: "grid", label: "Square Graph", badge: "Grid" },
  { id: "cornell", label: "Cornell Margin", badge: "Study" },
  { id: "linen", label: "Botanical Linen", badge: "Woven" },
] as const;

type PaperStyle = (typeof PAPER_CANVASES)[number]["id"];
type ArchiveViewMode = "timeline" | "bento" | "gallery" | "compact";
type SortOption = "newest" | "oldest" | "longest" | "shortest" | "alphabetical";

export interface JournalTemplate {
  id: string;
  category:
    | "Gratitude & Daily"
    | "Cycle & Somatic"
    | "Emotional & Shadow"
    | "CBT & Clarity"
    | "Goals & Vision"
    | "Letters & Creative";
  label: string;
  title: string;
  subtitle: string;
  tag: string;
  html: string;
}

const JOURNAL_TEMPLATES: JournalTemplate[] = [

  // ================= 1. GRATITUDE & DAILY ANCHORS (9) =================

  {
    id: "gratitude-trio",
    category: "Gratitude & Daily",
    label: "✨ Gratitude Trio",
    title: "Three Quiet Gratitudes",
    subtitle: "Anchor your nervous system in small daily comforts",
    tag: "gratitude",
    html: `<h3>✨ Three Things Anchoring Me Today</h3><ul><li><strong>One small physical comfort:</strong> </li><li><strong>Someone or something I deeply appreciate:</strong> </li><li><strong>A quiet moment of grace I noticed:</strong> </li></ul><p><br></p><blockquote><em>"Gratitude turns what we have into enough."</em></blockquote><p></p>`,
  },

  {
    id: "evening-unwind",
    category: "Gratitude & Daily",
    label: "🌙 Evening Unwind",
    title: "Evening Decompression & Release",
    subtitle: "Close open mental tabs before sleep",
    tag: "reflection",
    html: `<h3>🌙 Closing the Day Gently</h3><p><strong>1. What occupied most of my mental energy today?</strong></p><p><br></p><p><strong>2. What permission do I give myself to set down before sleep?</strong></p><p><br></p><p><strong>3. One kind intention for tomorrow morning:</strong></p><p></p>`,
  },

  {
    id: "five-senses",
    category: "Gratitude & Daily",
    label: "🌿 5-Senses Grounding",
    title: "Sensory Presence Check-In",
    subtitle: "Return to the present moment through your five senses",
    tag: "self-care",
    html: `<h3>🌿 Sensory Sanctuary Check-In</h3><ul><li><strong>Sight — Something beautiful in front of me:</strong> </li><li><strong>Sound — The quietest sound I can hear right now:</strong> </li><li><strong>Touch — A texture bringing me comfort:</strong> </li><li><strong>Scent / Taste — Something warm or nourishing today:</strong> </li><li><strong>Inner Breath — How my chest and shoulders feel after three slow breaths:</strong> </li></ul><p></p>`,
  },

  {
    id: "morning-pages",
    category: "Gratitude & Daily",
    label: "☀️ Morning Intention",
    title: "Morning Clarity & Pace Setting",
    subtitle: "Design your emotional tone before the world rushes in",
    tag: "reflection",
    html: `<h3>☀️ Morning Sanctuary Alignment</h3><p><strong>How I woke up feeling in my body:</strong> </p><p><strong>The single most meaningful priority for today:</strong> </p><p><strong>How I want to treat myself when things feel busy:</strong> </p><p><strong>Today's guiding word:</strong> </p>`,
  },

  {
    id: "micro-joys",
    category: "Gratitude & Daily",
    label: "☕ Micro-Joys Log",
    title: "Tiny Delights & Ordinary Magic",
    subtitle: "Collect fleeting moments that made you smile",
    tag: "gratitude",
    html: `<h3>☕ Catalog of Tiny Delights</h3><p><em>List the smallest, most ordinary moments that felt good today (a warm cup, sunlight, a song, a laugh):</em></p><ul><li></li><li></li><li></li></ul><p><strong>Why these small moments matter to me right now:</strong> </p>`,
  },

  {
    id: "one-line-capsule",
    category: "Gratitude & Daily",
    label: "⏳ Memory Capsule",
    title: "Snapshot for Future Me",
    subtitle: "Preserve today's atmosphere in vivid detail",
    tag: "milestone",
    html: `<h3>⏳ Time Capsule Snapshot</h3><ul><li><strong>What I am currently reading, watching, or listening to:</strong> </li><li><strong>A phrase or thought I keep returning to:</strong> </li><li><strong>What I want future-me to remember about this exact week:</strong> </li></ul><p></p>`,
  },

  {
    id: "silver-linings",
    category: "Gratitude & Daily",
    label: "🌤️ Silver Linings",
    title: "Finding Light in a Heavy Day",
    subtitle: "Acknowledge difficulty while spotting hidden resilience",
    tag: "healing",
    html: `<h3>🌤️ Holding Both Truths</h3><p><strong>What felt genuinely hard or draining today:</strong></p><p><br></p><p><strong>One unexpected silver lining or lesson hidden inside it:</strong></p><p><br></p><p><strong>How I showed up for myself despite the friction:</strong></p><p></p>`,
  },

  {
    id: "body-thank-you",
    category: "Gratitude & Daily",
    label: "🫀 Body Gratitude",
    title: "Appreciation for My Physical Vessel",
    subtitle: "Shift from appearance judgment to functional gratitude",
    tag: "self-care",
    html: `<h3>🫀 Thank You to My Body</h3><ul><li><strong>Three ways my body carried me through today:</strong> </li><li><strong>A signal my body gave me that I listened to:</strong> </li><li><strong>One gentle nourishment or rest I am offering my body tonight:</strong> </li></ul><p></p>`,
  },

  {
    id: "sunday-reset",
    category: "Gratitude & Daily",
    label: "🕯️ Sunday Reset",
    title: "Weekly Sanctuary Reset & Reflection",
    subtitle: "Clear the slate and enter the new week grounded",
    tag: "reflection",
    html: `<h3>🕯️ Sunday Sanctuary Reset</h3><ul><li><strong>Biggest win or proudest moment from the past 7 days:</strong> </li><li><strong>Something I am leaving behind in last week:</strong> </li><li><strong>Top 3 gentle intentions for the week ahead:</strong> </li><li><strong>How I will protect my rest this week:</strong> </li></ul><p></p>`,
  },

  // ================= 2. CYCLE & SOMATIC SEASONS (9) =================

  {
    id: "cycle-checkin",
    category: "Cycle & Somatic",
    label: "🌸 Cycle Check-In",
    title: "Body & Inner Season Check-In",
    subtitle: "Align your daily expectations with your hormonal phase",
    tag: "self-care",
    html: `<h3>🌸 Listening to My Inner Season</h3><ul><li><strong>Current Cycle Day & Phase:</strong> </li><li><strong>Physical energy, cravings & body signals:</strong> </li><li><strong>Emotional weather & social battery:</strong> </li><li><strong>How I can honor my natural pace today:</strong> </li></ul><p></p>`,
  },

  {
    id: "inner-winter",
    category: "Cycle & Somatic",
    label: "🩸 Inner Winter (Menses)",
    title: "Menstrual Phase Rest & Release",
    subtitle: "Deep permission to slow down as hormones reset",
    tag: "self-care",
    html: `<h3>🩸 Inner Winter Sanctuary (Menstrual Phase)</h3><p><strong>What my body is asking me to release this cycle:</strong></p><p><br></p><p><strong>Where I can cancel non-essential obligations and rest:</strong></p><p><br></p><p><strong>Intuitive insights surfacing while my energy is turned inward:</strong></p><p></p>`,
  },

  {
    id: "inner-spring",
    category: "Cycle & Somatic",
    label: "🌱 Inner Spring (Follicular)",
    title: "Follicular Phase Renewal & Curiosity",
    subtitle: "Channel rising estrogen into fresh ideas and play",
    tag: "reflection",
    html: `<h3>🌱 Inner Spring Awakening (Follicular Phase)</h3><ul><li><strong>New ideas, curiosities, or projects sparking my interest:</strong> </li><li><strong>How my physical stamina and mental clarity feel today:</strong> </li><li><strong>One playful or creative seed I want to plant this week:</strong> </li></ul><p></p>`,
  },

  {
    id: "inner-summer",
    category: "Cycle & Somatic",
    label: "☀️ Inner Summer (Ovulatory)",
    title: "Ovulatory Peak Radiance & Expression",
    subtitle: "Capture high-confidence communication and magnetism",
    tag: "milestone",
    html: `<h3>☀️ Inner Summer Radiance (Ovulatory Window)</h3><ul><li><strong>Where I feel most confident, expressive, and magnetic today:</strong> </li><li><strong>Important conversations or creative work to lean into right now:</strong> </li><li><strong>How I am nourishing my high energy with hydration and joy:</strong> </li></ul><p></p>`,
  },

  {
    id: "inner-autumn",
    category: "Cycle & Somatic",
    label: "🍂 Inner Autumn (Luteal)",
    title: "Luteal Phase Nesting & Boundaries",
    subtitle: "Honor progesterone's call for completion and cozy boundaries",
    tag: "boundaries",
    html: `<h3>🍂 Inner Autumn Grounding (Luteal Phase)</h3><ul><li><strong>Loose ends I want to wrap up before my next bleed:</strong> </li><li><strong>Boundaries I need to firm up to protect my peace:</strong> </li><li><strong>Comfort foods, slow movement, and cozy rituals I am craving:</strong> </li></ul><p></p>`,
  },

  {
    id: "pms-compassion",
    category: "Cycle & Somatic",
    label: "🫧 Late-Luteal Tenderness",
    title: "Compassionate Pre-Moonday Check-In",
    subtitle: "Validate heightened sensitivity without self-criticism",
    tag: "healing",
    html: `<h3>🫧 Holding My Late-Luteal Sensitivity</h3><p><em>Reminder: My metabolic demand is higher and neurotransmitters are shifting.</em></p><ul><li><strong>What feels extra tender or overwhelming today:</strong> </li><li><strong>The truth behind my irritation (what boundary feels crossed?):</strong> </li><li><strong>Three soothing comforts I can give myself tonight:</strong> </li></ul><p></p>`,
  },

  {
    id: "somatic-scan",
    category: "Cycle & Somatic",
    label: "🧘‍♀️ Somatic Body Scan",
    title: "Head-to-Toe Somatic Tension Map",
    subtitle: "Locate where emotions are stored physically in your body",
    tag: "self-care",
    html: `<h3>🧘‍♀️ Somatic Interoception Scan</h3><ul><li><strong>Jaw, Forehead & Eyes:</strong> </li><li><strong>Throat, Chest & Heartbeat:</strong> </li><li><strong>Stomach, Gut & Pelvis:</strong> </li><li><strong>If the tightest area of my body could speak, what would it say?</strong> </li></ul><p></p>`,
  },

  {
    id: "dream-log",
    category: "Cycle & Somatic",
    label: "🌌 Dreamscape Log",
    title: "Subconscious Dream & Sleep Journal",
    subtitle: "Record vivid luteal or REM dreams before they fade",
    tag: "dream",
    html: `<h3>🌌 Subconscious Dreamscape Record</h3><p><strong>Fragments, symbols, or people I remember from my dream:</strong></p><p><br></p><p><strong>The dominant emotion I felt inside the dream vs. waking up:</strong></p><p><br></p><p><strong>What waking-life question this dream might be mirroring:</strong></p><p></p>`,
  },

  {
    id: "cycle-retro",
    category: "Cycle & Somatic",
    label: "🔄 Full Cycle Review",
    title: "End-of-Cycle Retrospective",
    subtitle: "Review patterns across the entire 28-day arc",
    tag: "reflection",
    html: `<h3>🔄 Complete Cycle Retrospective</h3><ul><li><strong>How this cycle felt overall compared to last month:</strong> </li><li><strong>Days I felt strongest vs. days I needed the most rest:</strong> </li><li><strong>One adjustment I want to make for my next cycle:</strong> </li></ul><p></p>`,
  },

  // ================= 3. EMOTIONAL RELEASE & SHADOW WORK (9) =================
  
  {
    id: "emotional-release",
    category: "Emotional & Shadow",
    label: "🌊 Emotional Release",
    title: "Unfiltered Emotional Release",
    subtitle: "Pour heavy thoughts onto paper without judgment",
    tag: "vent",
    html: `<h3>🌊 Safe Space — Unfiltered Stream of Consciousness</h3><p><em>No judgment, no grammar rules, no editing. Write whatever feels heavy right now...</em></p><p><br></p><hr><p><strong>What would bring me 5% more comfort in this exact moment?</strong></p><p></p>`,
  },

  {
    id: "polite-ignoring",
    category: "Emotional & Shadow",
    label: "🪞 Shadow Check-In",
    title: "What Am I Politely Ignoring?",
    subtitle: "Surface the quiet truth underneath busyness",
    tag: "reflection",
    html: `<h3>🪞 Honest Shadow Reflection</h3><p><strong>1. What emotion or truth have I been politely ignoring this week?</strong></p><p><br></p><p><strong>2. What am I afraid would change if I admitted it fully to myself?</strong></p><p><br></p><p><strong>3. One small, courageous step toward honesty:</strong></p><p></p>`,
  },

  {
    id: "inner-critic-reframe",
    category: "Emotional & Shadow",
    label: "🤍 Critic vs. Ally",
    title: "Inner Critic vs. Compassionate Voice",
    subtitle: "Separate harsh self-talk from your grounded truth",
    tag: "healing",
    html: `<h3>🤍 Transforming the Inner Critic</h3><p><strong>What my harsh inner critic is saying right now:</strong></p><blockquote><em>""</em></blockquote><p><strong>How my wisest, most compassionate protector responds:</strong></p><p><br></p>`,
  },

  {
    id: "forgiveness-ritual",
    category: "Emotional & Shadow",
    label: "🕊️ Self-Forgiveness",
    title: "Self-Forgiveness & Grace Note",
    subtitle: "Release guilt over past mistakes or low-energy days",
    tag: "healing",
    html: `<h3>🕊️ Releasing Self-Judgment</h3><p><strong>What I have been holding against myself lately:</strong></p><p><br></p><p><strong>What I needed at that time that I didn't have:</strong></p><p><br></p><p><strong>My declaration of release:</strong> <em>I forgive myself for...</em></p>`,
  },

  {
    id: "trigger-deconstruct",
    category: "Emotional & Shadow",
    label: "⚡ Trigger Unpack",
    title: "Emotional Trigger Deconstruction",
    subtitle: "Trace a strong reaction back to the core need underneath",
    tag: "therapy",
    html: `<h3>⚡ Anatomy of a Trigger</h3><ul><li><strong>What happened externally (just the camera facts):</strong> </li><li><strong>The story my mind immediately told me about it:</strong> </li><li><strong>How old does this feeling make me feel?</strong> </li><li><strong>The core value or need of mine that wants protection:</strong> </li></ul><p></p>`,
  },

  {
    id: "unsent-letter",
    category: "Emotional & Shadow",
    label: "✉️ Unsent Letter",
    title: "The Letter That Never Needs to Be Sent",
    subtitle: "Say the unfiltered truth in complete privacy",
    tag: "vent",
    html: `<h3>✉️ Unsent Sanctuary Letter</h3><p><strong>Dear ____________,</strong></p><p><em>Here is everything I cannot or choose not to say out loud, written strictly for my own peace...</em></p><p><br></p>`,
  },

  {
    id: "overwhelm-triage",
    category: "Emotional & Shadow",
    label: "🛟 Overwhelm Triage",
    title: "Mental Load & Overwhelm Triage",
    subtitle: "Empty your head and separate urgent from noise",
    tag: "self-care",
    html: `<h3>🛟 Mental Load Triage</h3><p><strong>Everything swirling in my head right now:</strong></p><ul><li></li><li></li></ul><p><strong>The ONLY 1 thing that truly matters today:</strong> </p><p><strong>What I can delegate, delay, or drop completely:</strong> </p>`,
  },

  {
    id: "grief-tenderness",
    category: "Emotional & Shadow",
    label: "🌧️ Holding Grief",
    title: "Space for Grief, Change & Letting Go",
    subtitle: "Honor endings, transitions, or quiet heartache",
    tag: "healing",
    html: `<h3>🌧️ Honoring What Has Changed</h3><p><strong>What I am grieving or missing right now (a season, a version of me, a connection):</strong></p><p><br></p><p><strong>How I can carry this tenderness gently today without rushing myself to "move on":</strong></p><p></p>`,
  },

  {
    id: "envy-compass",
    category: "Emotional & Shadow",
    label: "🧭 Desire Compass",
    title: "Turning Comparison into Clarity",
    subtitle: "Decode comparison or envy to discover your own blocked desires",
    tag: "growth",
    html: `<h3>🧭 Decoding Comparison into Desire</h3><p><strong>Where I noticed myself comparing my life or progress recently:</strong></p><p><br></p><p><strong>What that comparison reveals about a dream I secretly want for myself:</strong></p><p><br></p><p><strong>One authentic step toward my own version of that dream:</strong></p><p></p>`,
  },

  // ================= 4. CBT CLARITY & ANXIETY RELIEF (9) =================

  {
    id: "cbt-thought-record",
    category: "CBT & Clarity",
    label: "🧠 CBT Reframe",
    title: "Cognitive Behavioral Thought Record",
    subtitle: "Challenge anxious distortions with balanced evidence",
    tag: "therapy",
    html: `<h3>🧠 CBT Evidence & Balanced Reframe</h3><ul><li><strong>The Automatic Anxious Thought:</strong> </li><li><strong>Distortion Pattern (All-or-nothing, catastrophizing, mind-reading?):</strong> </li><li><strong>Objective Evidence FOR vs. AGAINST this thought:</strong> </li><li><strong>A More Grounded, Balanced Truth:</strong> </li></ul><p></p>`,
  },

  {
    id: "anxiety-deescalate",
    category: "CBT & Clarity",
    label: "🫧 Anxiety De-Escalation",
    title: "Calm the Spiral (Worst / Best / Likely)",
    subtitle: "Step out of catastrophic loops into statistical reality",
    tag: "self-care",
    html: `<h3>🫧 Stepping Out of the Spiral</h3><ul><li><strong>Worst-case scenario my anxiety is projecting:</strong> </li><li><strong>How I would cope and survive even if that happened:</strong> </li><li><strong>Best-case scenario:</strong> </li><li><strong>Most realistic, ordinary outcome (90% probability):</strong> </li></ul><p></p>`,
  },

  {
    id: "circle-of-control",
    category: "CBT & Clarity",
    label: "⭕ Circle of Control",
    title: "Inside vs. Outside My Control",
    subtitle: "Reclaim energy from things you cannot control",
    tag: "boundaries",
    html: `<h3>⭕ The Sovereignty Audit</h3><p><strong>Things I am worrying about that are OUTSIDE my control:</strong></p><ul><li></li></ul><p><strong>Things that are 100% WITHIN my control today (my boundaries, my effort, my breath):</strong></p><ul><li></li></ul>`,
  },

  {
    id: "decision-matrix",
    category: "CBT & Clarity",
    label: "⚖️ Head, Heart & Gut",
    title: "Three-Center Decision Matrix",
    subtitle: "Consult your logic, emotions, and somatic intuition",
    tag: "reflection",
    html: `<h3>⚖️ Consulting Head, Heart & Gut</h3><p><strong>The decision or crossroads in front of me:</strong> </p><ul><li><strong>What my Logical Mind says:</strong> </li><li><strong>What my Emotional Heart feels:</strong> </li><li><strong>What my Deep Gut Instinct knows when I imagine each choice:</strong> </li></ul><p></p>`,
  },

  {
    id: "imposter-evidence",
    category: "CBT & Clarity",
    label: "🛡️ Competence File",
    title: "Dismantling Self-Doubt with Hard Evidence",
    subtitle: "Remind yourself of what you have already overcome",
    tag: "milestone",
    html: `<h3>🛡️ My Undeniable Evidence File</h3><p><strong>Where self-doubt is trying to shrink me today:</strong></p><p><br></p><p><strong>Three hard things I have already mastered, built, or survived:</strong></p><ol><li></li><li></li><li></li></ol>`,
  },

  {
    id: "perfectionism-detox",
    category: "CBT & Clarity",
    label: "🍃 Good Enough",
    title: "Perfectionism Detox & B+ Permission",
    subtitle: "Trade paralyzing perfectionism for peaceful momentum",
    tag: "healing",
    html: `<h3>🍃 Permission to Be Human</h3><p><strong>Where I am holding myself to an impossible standard right now:</strong></p><p><br></p><p><strong>What "done and peaceful" looks like instead of "perfect and exhausted":</strong></p><p></p>`,
  },

  {
    id: "fear-setting",
    category: "CBT & Clarity",
    label: "🔦 Fear Setting",
    title: "De-Fanging a Bold Action",
    subtitle: "Measure the cost of inaction vs. taking the leap",
    tag: "growth",
    html: `<h3>🔦 Fear Setting & Cost of Inaction</h3><ul><li><strong>The bold action I am hesitating to take:</strong> </li><li><strong>How I can prevent or repair any stumble along the way:</strong> </li><li><strong>The hidden cost of staying exactly where I am for 6 more months:</strong> </li></ul><p></p>`,
  },

  {
    id: "self-compassion-break",
    category: "CBT & Clarity",
    label: "💗 Compassion Triad",
    title: "Mindful Self-Compassion Triad",
    subtitle: "Mindfulness, common humanity, and self-kindness",
    tag: "self-care",
    html: `<h3>💗 Three Pillars of Self-Compassion</h3><ol><li><strong>Mindfulness:</strong> <em>This is a moment of difficulty, and it makes sense that I feel this way.</em></li><li><strong>Common Humanity:</strong> <em>I am not alone; many others have walked through this exact feeling.</em></li><li><strong>Self-Kindness:</strong> <em>The kindest thing I can do for myself in the next hour is...</em></li></ol><p></p>`,
  },

  {
    id: "energy-audit",
    category: "CBT & Clarity",
    label: "🔋 Battery Audit",
    title: "What Drains Me vs. What Fuels Me",
    subtitle: "Identify energy leaks and high-return rituals",
    tag: "boundaries",
    html: `<h3>🔋 Personal Energy & Bandwidth Audit</h3><ul><li><strong>🟢 3 things that gave me life and energy recently:</strong> </li><li><strong>🔴 3 things that quietly drained my battery:</strong> </li><li><strong>One boundary I am setting to protect my energy:</strong> </li></ul><p></p>`,
  },

  // ================= 5. GOALS, CAREER & LIFE ARCHITECTURE (9) =================

  {
    id: "monthly-architecture",
    category: "Goals & Vision",
    label: "🗓️ Monthly Chapter",
    title: "New Month Theme & Architecture",
    subtitle: "Set the emotional and practical compass for the month",
    tag: "milestone",
    html: `<h3>🗓️ Designing My Next Chapter</h3><ul><li><strong>My guiding theme or word for this month:</strong> </li><li><strong>What I want more of this month:</strong> </li><li><strong>What I want less of this month:</strong> </li><li><strong>Three meaningful milestones I am excited to build:</strong> </li></ul><p></p>`,
  },

  {
    id: "life-wheel-audit",
    category: "Goals & Vision",
    label: "🧭 8-Pillar Audit",
    title: "Holistic Life Balance Check-In",
    subtitle: "Rate and reflect across health, purpose, love, and rest",
    tag: "reflection",
    html: `<h3>🧭 Holistic Sanctuary Audit (1–10)</h3><ul><li><strong>Physical Vitality & Cycle Health:</strong> /10</li><li><strong>Mental Peace & Emotional Space:</strong> /10</li><li><strong>Career, Study & Purpose:</strong> /10</li><li><strong>Relationships & Intimacy:</strong> /10</li><li><strong>Play, Creativity & Rest:</strong> /10</li></ul><p><strong>The single area asking for my gentlest attention right now:</strong> </p>`,
  },
  {
    id: "ideal-ordinary-day",
    category: "Goals & Vision",
    label: "🏡 Ideal Ordinary Day",
    title: "Blueprint of My Ideal Ordinary Tuesday",
    subtitle: "Design a life you don't need a vacation from",
    tag: "growth",
    html: `<h3>🏡 My Ideal Ordinary Day</h3><ul><li><strong>How my morning begins without rushing:</strong> </li><li><strong>The kind of deep, meaningful work I am doing:</strong> </li><li><strong>How my body moves and what I eat:</strong> </li><li><strong>How my evening winds down in peace:</strong> </li></ul><p></p>`,
  },

  {
    id: "deep-work-log",
    category: "Goals & Vision",
    label: "💻 Creative & Study Log",
    title: "Deep Focus & Project Breakthroughs",
    subtitle: "Track progress on studies, coding, or creative projects",
    tag: "milestone",
    html: `<h3>💻 Deep Work & Builder's Log</h3><ul><li><strong>Project or study domain I focused on today:</strong> </li><li><strong>Key breakthrough or problem solved:</strong> </li><li><strong>Next clear step for my next focus session:</strong> </li></ul><p></p>`,
  },

  {
    id: "quiet-victories",
    category: "Goals & Vision",
    label: "🏆 Quiet Victories",
    title: "Celebrating Unseen Progress",
    subtitle: "Honor internal growth that doesn't show up on a resume",
    tag: "milestone",
    html: `<h3>🏆 My Quiet Victories</h3><p><em>Celebrate the wins nobody else sees (holding a boundary, resting without guilt, staying calm, showing up):</em></p><ol><li></li><li></li><li></li></ol>`,
  },

  {
    id: "habit-friction",
    category: "Goals & Vision",
    label: "⚙️ Ritual Design",
    title: "Designing Low-Friction Daily Rituals",
    subtitle: "Build sustainable habits that adapt to low-energy days",
    tag: "growth",
    html: `<h3>⚙️ Sustainable Ritual Architecture</h3><ul><li><strong>The ritual I want to nourish:</strong> </li><li><strong>Full-energy version (15+ mins):</strong> </li><li><strong>Low-energy / Menstrual-phase version (2 mins):</strong> </li></ul><p></p>`,
  },

  {
    id: "financial-peace",
    category: "Goals & Vision",
    label: "💎 Abundance & Value",
    title: "Financial Peace & Self-Worth Reflection",
    subtitle: "Align money, boundaries, and long-term security",
    tag: "growth",
    html: `<h3>💎 Stewardship & Abundance Mindset</h3><ul><li><strong>One financial or career boundary I am proud of holding:</strong> </li><li><strong>An investment in my health, learning, or peace that paid off:</strong> </li><li><strong>My next calm, strategic step toward long-term freedom:</strong> </li></ul><p></p>`,
  },

  {
    id: "interview-confidence",
    category: "Goals & Vision",
    label: "🎙️ High-Stakes Prep",
    title: "Pre-Interview / Presentation Grounding",
    subtitle: "Center your voice, story, and composure before big moments",
    tag: "milestone",
    html: `<h3>🎙️ Poise, Story & Conviction</h3><ul><li><strong>The core value and perspective only I bring to the room:</strong> </li><li><strong>My proudest real-world leadership or project story:</strong> </li><li><strong>My grounding reminder before I speak:</strong> <em>I am prepared, composed, and conversational.</em></li></ul><p></p>`,
  },
  {
    id: "future-one-year",
    category: "Goals & Vision",
    label: "🔭 1-Year Horizon",
    title: "One Year From Today",
    subtitle: "Write from the perspective of your life 12 months ahead",
    tag: "growth",
    html: `<h3>🔭 One Year From Today</h3><p><em>Write in the present tense as if it is exactly one year from today and your quietest prayers have taken root...</em></p><p><br></p>`,
  },

  // ===================== 6. LETTERS, RELATIONSHIPS & CREATIVE (9) =======================

  {
    id: "letter-future-self",
    category: "Letters & Creative",
    label: "💌 To Future Me",
    title: "A Letter to My Future Self",
    subtitle: "Send encouragement and perspective across time",
    tag: "milestone",
    html: `<h3>💌 Dear Future Me,</h3><p><em>When you read this months from now, I want you to remember how much heart you put into this season...</em></p><p><br></p>`,
  },

  {
    id: "letter-younger-self",
    category: "Letters & Creative",
    label: "🧸 To Younger Me",
    title: "A Note to My Younger Self",
    subtitle: "Offer the safety and reassurance you once needed",
    tag: "healing",
    html: `<h3>🧸 Dear Younger Me,</h3><p><em>You didn't have to carry it all alone. Look at how far we have come...</em></p><p><br></p>`,
  },

  {
    id: "partner-appreciation",
    category: "Letters & Creative",
    label: "💞 Partner & Love",
    title: "Love, Intimacy & Partner Appreciation",
    subtitle: "Reflect on connection, tenderness, and shared moments",
    tag: "gratitude",
    html: `<h3>💞 Reflections on Love & Partnership</h3><ul><li><strong>A moment with my partner recently that made me feel deeply understood or cherished:</strong> </li><li><strong>How I can communicate my needs clearly and lovingly this week:</strong> </li><li><strong>Something sweet I want to do or share together soon:</strong> </li></ul><p></p>`,
  },

  {
    id: "difficult-conversation",
    category: "Letters & Creative",
    label: "🗣️ Clear Truth",
    title: "Rehearsing a Tender or Difficult Conversation",
    subtitle: "Find calm, non-defensive words before speaking",
    tag: "boundaries",
    html: `<h3>🗣️ Speaking with Clarity & Grace</h3><ul><li><strong>What I genuinely feel (using "I feel..." instead of blame):</strong> </li><li><strong>What I specifically need or am requesting going forward:</strong> </li><li><strong>How I will stay grounded regardless of their reaction:</strong> </li></ul><p></p>`,
  },

  {
    id: "social-battery",
    category: "Letters & Creative",
    label: "🫂 Connection Audit",
    title: "Relationships & Social Sanctuary Check",
    subtitle: "Notice who feels like home where you can exhale",
    tag: "reflection",
    html: `<h3>🫂 Who Feels Like Home?</h3><ul><li><strong>People in my life around whom my nervous system completely relaxes:</strong> </li><li><strong>A connection I want to nurture and reach out to:</strong> </li><li><strong>Where I need solitude to recharge my social battery:</strong> </li></ul><p></p>`,
  },

  {
    id: "core-values",
    category: "Letters & Creative",
    label: "🏛️ Core Values",
    title: "My Non-Negotiable Core Values",
    subtitle: "Clarify the principles that guide your decisions",
    tag: "reflection",
    html: `<h3>🏛️ My Personal Constitution</h3><ul><li><strong>My top 3 non-negotiable values in this season of life:</strong> </li><li><strong>Where my daily schedule currently honors them:</strong> </li><li><strong>One place I am choosing integrity over people-pleasing:</strong> </li></ul><p></p>`,
  },

  {
    id: "book-resonance",
    category: "Letters & Creative",
    label: "📚 Commonplace Note",
    title: "Commonplace Book: Quotes & Ideas",
    subtitle: "Save passages from books, essays, or films that moved you",
    tag: "reflection",
    html: `<h3>📚 Literary Commonplace Entry</h3><p><strong>Source / Book / Thinker:</strong> </p><blockquote><em>"Paste or write the quote here..."</em></blockquote><p><strong>Why this idea struck a chord in me today:</strong> </p>`,
  },

  {
    id: "poetry-canvas",
    category: "Letters & Creative",
    label: "🖋️ Poetry & Verse",
    title: "Untitled Poem / Lyric Fragment",
    subtitle: "A quiet canvas for free verse, metaphors, and rhythm",
    tag: "poetry",
    html: `<h3>🖋️ Verse & Imagery</h3><p><em>Write in short lines, imagery, or free verse...</em></p><p><br></p>`,
  },

  {
    id: "three-self-discoveries",
    category: "Letters & Creative",
    label: "🔮 Self-Discovery",
    title: "Three Things I Learned About Myself",
    subtitle: "Document your evolving self-awareness",
    tag: "growth",
    html: `<h3>🔮 Evolving Self-Portrait</h3><ol><li><strong>Something I realized about how I handle stress:</strong> </li><li><strong>Something that brings me more peace than I expected:</strong> </li><li><strong>A strength in myself I am learning to trust:</strong> </li></ol><p></p>`,
  },
];


const SOUL_PROMPTS = [
  "What emotion have I been politely ignoring this week, and what is it trying to protect?",
  "If my energy today were a season and a time of day, what would it be—and what does that season need?",
  "Write a short note of forgiveness to yourself for something you judged yourself harshly for recently.",
  "What boundaries have brought me the deepest peace lately?",
  "What is one small ritual that makes me feel most like myself?",
  "Who or what makes me feel safest to exhale completely?",
  "If I didn't have to prove anything to anyone today, how would I spend the next three hours?",
  "What is a quiet milestone I achieved recently that I haven't celebrated yet?",
  "What advice would the calmest, wisest version of me 5 years from now give me about today's worry?",
  "Where in my life am I confusing being busy with being fulfilled?",
  "What is one unspoken expectation I am ready to release?",
  "Describe a moment recently when you felt completely at home in your own skin.",
];


function stripHtmlToText(html: string): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function getWordCount(html: string): number {
  const plain = stripHtmlToText(html);
  return plain ? plain.split(/\s+/).filter(Boolean).length : 0;
}

function getSentenceCount(html: string): number {
  const plain = stripHtmlToText(html);
  if (!plain) return 0;
  return plain.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
}

function getParagraphCount(html: string): number {
  const plain = stripHtmlToText(html);
  if (!plain) return 0;
  return plain.split(/\n+/).filter((p) => p.trim().length > 0).length;
}

function getReadingTimeMinutes(words: number): number {
  return Math.max(1, Math.ceil(words / 180));
}

function playGentleChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx: AudioContext = new AudioCtx();
    if (ctx.state !== "running") {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(528, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.45);
    gain.gain.setValueAtTime(0.14, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.45);
  } catch {}
}



type SoundscapeMode = "off" | "rain" | "pink" | "zen432" | "custom";

function useAmbientSoundscape() {
  const [mode, setMode] = useState<SoundscapeMode>("off");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [customTrackName, setCustomTrackName] = useState<string>("");
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(0.6);

  const ctxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const customUrlRef = useRef<string | null>(null);

  const stopAll = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    if (ctxRef.current) {
      ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
      gainNodeRef.current = null;
    }
    if (audioElRef.current) {
      audioElRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const startEngine = useCallback(
    async (targetMode: SoundscapeMode, explicitUrl?: string) => {
      stopAll();
      setMode(targetMode);

      if (targetMode === "off" || typeof window === "undefined") {
        return;
      }

      const activeMp3Url = explicitUrl || customUrlRef.current;

      if (targetMode === "custom") {
        if (!activeMp3Url) return;
        if (!audioElRef.current) {
          audioElRef.current = new Audio();
          audioElRef.current.loop = true;
          audioElRef.current.preload = "auto";
        }
        if (audioElRef.current.src !== activeMp3Url) {
          audioElRef.current.src = activeMp3Url;
          audioElRef.current.load();
        }
        audioElRef.current.volume = volume;
        try {
          await audioElRef.current.play();
          setIsPlaying(true);
        } catch (err) {
          console.warn("Click Play button to start MP3 playback:", err);
          setIsPlaying(false);
        }
        return;
      }

      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx: AudioContext = new AudioCtx();
      ctxRef.current = ctx;

      if (ctx.state !== "running") {
        await ctx.resume().catch(() => {});
      }

      if (targetMode === "rain" || targetMode === "pink") {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
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

        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = buffer;
        noiseNode.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = targetMode === "rain" ? "bandpass" : "lowpass";
        filter.frequency.value = targetMode === "rain" ? 1000 : 480;

        const gainNode = ctx.createGain();
        gainNode.gain.value = (targetMode === "rain" ? 0.65 : 0.45) * volume;
        gainNodeRef.current = gainNode;

        noiseNode.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        noiseNode.start(0);
        setIsPlaying(true);

        cleanupRef.current = () => {
          try {
            noiseNode.stop();
            noiseNode.disconnect();
          } catch {}
        };
      } else if (targetMode === "zen432") {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = "sine";
        osc2.type = "sine";
        osc1.frequency.value = 216;
        osc2.frequency.value = 220;

        gainNode.gain.value = 0.12 * volume;
        gainNodeRef.current = gainNode;

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start();
        osc2.start();
        setIsPlaying(true);

        cleanupRef.current = () => {
          try {
            osc1.stop();
            osc2.stop();
            osc1.disconnect();
            osc2.disconnect();
          } catch {}
        };
      }
    },
    [stopAll, volume],
  );

  const togglePlayPause = useCallback(async () => {
    if (mode === "off") {
      await startEngine(customUrlRef.current ? "custom" : "rain");
      return;
    }

    if (mode === "custom" && audioElRef.current) {
      if (isPlaying) {
        audioElRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioElRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
      return;
    }

    if (ctxRef.current) {
      if (ctxRef.current.state === "running") {
        await ctxRef.current.suspend();
        setIsPlaying(false);
      } else {
        await ctxRef.current.resume();
        setIsPlaying(true);
      }
    } else {
      await startEngine(mode);
    }
  }, [mode, isPlaying, startEngine]);

  const handleUploadCustomMp3 = useCallback(
    (file: File) => {
      if (!file) return;
      if (customUrlRef.current) {
        URL.revokeObjectURL(customUrlRef.current);
      }
      const nextUrl = URL.createObjectURL(file);
      customUrlRef.current = nextUrl;
      setCustomAudioUrl(nextUrl);
      setCustomTrackName(file.name.replace(/\.[^/.]+$/, ""));
      startEngine("custom", nextUrl);
    },
    [startEngine],
  );

  const handleVolumeChange = useCallback(
    (nextVol: number) => {
      setVolume(nextVol);
      if (audioElRef.current) {
        audioElRef.current.volume = nextVol;
      }
      if (gainNodeRef.current && ctxRef.current) {
        const multiplier =
          mode === "zen432" ? 0.12 : mode === "rain" ? 0.65 : 0.45;
        gainNodeRef.current.gain.setValueAtTime(
          multiplier * nextVol,
          ctxRef.current.currentTime,
        );
      }
    },
    [mode],
  );

  useEffect(() => {
    return () => {
      stopAll();
      if (customUrlRef.current) {
        URL.revokeObjectURL(customUrlRef.current);
      }
    };
  }, [stopAll]);

  return {
    soundMode: mode,
    isPlaying,
    customTrackName,
    hasCustomAudio: Boolean(customAudioUrl),
    volume,
    selectSoundscape: startEngine,
    togglePlayPause,
    handleUploadCustomMp3,
    handleVolumeChange,
  };
}

/**
 * Synchronizes checklist items inside the editor 
 */


function syncChecklistBlockStyles(root: HTMLElement) {
  const checklistBlocks = root.querySelectorAll<HTMLElement>(
    '[data-checklist="true"]',
  );

  checklistBlocks.forEach((block) => {
    const toggleEl = block.querySelector<HTMLElement>(
      '[data-check-toggle="true"]',
    );
    const textEl = block.querySelector<HTMLElement>('[data-check-text="true"]');

    if (toggleEl && textEl) {
      const isChecked = (toggleEl.textContent || "").includes("☑");
      const rawText = (textEl.textContent || "").replace(
        /[\u200B\s\u00A0]/g,
        "",
      );
      const hasActualText = rawText.length > 0;

      if (isChecked && hasActualText) {
        textEl.style.textDecoration = "line-through";
        textEl.style.opacity = "0.65";
      } else {
        textEl.style.textDecoration = "none";
        textEl.style.opacity = "1";
      }
    }
  });
}

/**
 *  Stationery Rich Text Editor
 */

const RichTextEditor = ({
  value,
  editorSyncKey,
  onChange,
  placeholder,
  paperStyle,
  onPaperStyleChange,
  fontFamilyId,
  onFontFamilyChange,
  isZenMode,
  onToggleZenMode,
  onOpenTemplateModal,
}: {
  value: string;
  editorSyncKey: string;
  onChange: (html: string) => void;
  placeholder?: string;
  paperStyle: PaperStyle;
  onPaperStyleChange: (style: PaperStyle) => void;
  fontFamilyId: FontFamilyId;
  onFontFamilyChange: (id: FontFamilyId) => void;
  isZenMode: boolean;
  onToggleZenMode: () => void;
  onOpenTemplateModal: () => void;
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const lastSyncKeyRef = useRef<string>("");

  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [lineSpacing, setLineSpacing] = useState<"1.55" | "1.8" | "2.1">("1.8");
  const [marginWidth, setMarginWidth] = useState<
    "narrow" | "standard" | "wide"
  >("standard");
  const [wordGoal, setWordGoal] = useState<number>(200);
  const [isSpeaking, setIsSpeaking] = useState(false);



  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
  });
  const [selectedFontSizeLabel, setSelectedFontSizeLabel] =
    useState("Normal (Default)");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    const keyChanged = lastSyncKeyRef.current !== editorSyncKey;
    const isFocused = editorRef.current.contains(document.activeElement);

    if (keyChanged || !isFocused) {
      if (editorRef.current.innerHTML !== (value || "")) {
        editorRef.current.innerHTML = value || "";
      }
      lastSyncKeyRef.current = editorSyncKey;
    }
  }, [value, editorSyncKey]);



  const saveCurrentSelection = useCallback(() => {
    if (typeof window === "undefined") return;
    const sel = window.getSelection();
    if (
      sel &&
      sel.rangeCount > 0 &&
      editorRef.current?.contains(sel.anchorNode)
    ) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);



  const restoreSavedSelection = useCallback(() => {
    if (typeof window === "undefined") return null;
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      try {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      } catch {}
    }
    return sel;
  }, []);

  const updateActiveStates = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
      });
    } catch {}
  }, []);



  const emitChange = useCallback(() => {
    if (editorRef.current) {
      syncChecklistBlockStyles(editorRef.current);
      onChange(editorRef.current.innerHTML);
    }
    updateActiveStates();
    saveCurrentSelection();
  }, [onChange, updateActiveStates, saveCurrentSelection]);

  const executeCommand = (command: string, arg: string = "") => {
    editorRef.current?.focus();
    restoreSavedSelection();
    document.execCommand(command, false, arg);
    emitChange();
  };



  const handleFontSizeSelect = (label: string, sizeValue: string) => {
    setSelectedFontSizeLabel(label);
    editorRef.current?.focus();
    const sel = restoreSavedSelection();

    if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("fontSize", false, "7");
      editorRef.current
        ?.querySelectorAll('font[size="7"], span[style*="xxx-large"]')
        .forEach((el) => {
          el.removeAttribute("size");
          (el as HTMLElement).style.fontSize = sizeValue;
        });
    } else {
      const span = document.createElement("span");
      span.style.fontSize = sizeValue;
      span.innerHTML = "&#8203;";
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.insertNode(span);
        range.setStart(span.firstChild!, 1);
        range.setEnd(span.firstChild!, 1);
        sel.removeAllRanges();
        sel.addRange(range);
      } else if (editorRef.current) {
        editorRef.current.appendChild(span);
      }
    }
    emitChange();
  };



  const handleColorChange = (
    command: "foreColor" | "hiliteColor",
    color: string,
  ) => {
    editorRef.current?.focus();
    restoreSavedSelection();
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(command, false, color);
    saveCurrentSelection();
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    updateActiveStates();
  };



  const handleClearFormatting = () => {
    editorRef.current?.focus();
    const sel = restoreSavedSelection();
    if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
      document.execCommand("removeFormat", false);
      document.execCommand("formatBlock", false, "p");
    } else if (editorRef.current) {
      const plainText = editorRef.current.innerText;
      editorRef.current.innerHTML = plainText
        .split("\n")
        .map((line) => `<p>${line || "<br>"}</p>`)
        .join("");
      setSelectedFontSizeLabel("Normal (Default)");
    }
    emitChange();
  };



  const handleTransformCase = (mode: "upper" | "lower" | "title") => {
    editorRef.current?.focus();
    const sel = restoreSavedSelection();
    if (!sel || sel.isCollapsed) return;
    const text = sel.toString();
    let transformed = text;
    if (mode === "upper") transformed = text.toUpperCase();
    else if (mode === "lower") transformed = text.toLowerCase();
    else {
      transformed = text.replace(
        /\w\S*/g,
        (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
      );
    }
    document.execCommand("insertText", false, transformed);
    emitChange();
  };



  const handleInsertChecklist = () => {
    editorRef.current?.focus();
    const sel = restoreSavedSelection();

    if (sel && sel.rangeCount > 0) {
      const anchorEl =
        sel.anchorNode?.nodeType === Node.ELEMENT_NODE
          ? (sel.anchorNode as HTMLElement)
          : sel.anchorNode?.parentElement;

      const existingBlock = anchorEl?.closest(
        '[data-checklist="true"]',
      ) as HTMLElement | null;

      if (existingBlock) {
        const toggleEl = existingBlock.querySelector<HTMLElement>(
          '[data-check-toggle="true"]',
        );
        const textEl = existingBlock.querySelector<HTMLElement>(
          '[data-check-text="true"]',
        );
        if (toggleEl && textEl) {
          const currentlyChecked = (toggleEl.textContent || "").includes("☑");
          const nextChecked = !currentlyChecked;
          toggleEl.textContent = nextChecked ? "☑" : "☐";

          const hasText =
            (textEl.textContent || "").replace(/[\u200B\s\u00A0]/g, "").length >
            0;

          if (nextChecked && hasText) {
            textEl.style.textDecoration = "line-through";
            textEl.style.opacity = "0.65";
          } else {
            textEl.style.textDecoration = "none";
            textEl.style.opacity = "1";
          }
          emitChange();
          return;
        }
      }



      const selectedText = !sel.isCollapsed ? sel.toString().trim() : "";

      if (selectedText.length > 0) {
        const checklistHtml = `<div data-checklist="true" style="margin: 4px 0;"><span data-check-toggle="true" style="cursor: pointer; user-select: none; color: #d990a8; font-weight: 700; margin-right: 8px; text-decoration: none; display: inline-block;">☐</span><span data-check-text="true" style="text-decoration: none;">${selectedText}</span></div>`;
        document.execCommand("insertHTML", false, checklistHtml);
        emitChange();
        return;
      }
    }

    const emptyChecklistHtml = `<div data-checklist="true" style="margin: 4px 0;"><span data-check-toggle="true" style="cursor: pointer; user-select: none; color: #d990a8; font-weight: 700; margin-right: 8px; text-decoration: none; display: inline-block;">☐</span><span data-check-text="true" style="text-decoration: none;">&#8203;</span></div>`;
    document.execCommand("insertHTML", false, emptyChecklistHtml);
    emitChange();
  };



  const handleInsertCallout = () => {
    editorRef.current?.focus();
    restoreSavedSelection();
    document.execCommand(
      "insertHTML",
      false,
      `<blockquote style="padding: 12px 16px; border-left: 4px solid #d990a8; background: rgba(217, 144, 168, 0.1); border-radius: 10px; margin: 12px 0;">✨ <strong>Sanctuary Reflection:</strong> </blockquote><p><br></p>`,
    );
    emitChange();
  };

  const handleInsertTwoColumns = () => {
    editorRef.current?.focus();
    restoreSavedSelection();
    document.execCommand(
      "insertHTML",
      false,
      `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 12px 0;"><div style="padding: 12px; border: 1px solid var(--line); border-radius: 10px;"><strong>Column 1 (What I Feel)</strong><p>Write here...</p></div><div style="padding: 12px; border: 1px solid var(--line); border-radius: 10px;"><strong>Column 2 (What I Need)</strong><p>Write here...</p></div></div><p><br></p>`,
    );
    emitChange();
  };



  const handleInsertCodeBlock = () => {
    editorRef.current?.focus();
    restoreSavedSelection();
    document.execCommand(
      "insertHTML",
      false,
      `<pre style="padding: 12px 14px; border: 1px solid var(--line); border-radius: 10px; font-family: monospace; font-size: 13px; margin: 10px 0;">Note / Verse block...</pre><p><br></p>`,
    );
    emitChange();
  };

  const handleInsertTimestamp = () => {
    editorRef.current?.focus();
    restoreSavedSelection();
    const timeStr = format(new Date(), "h:mm a");
    document.execCommand(
      "insertHTML",
      false,
      `<span style="font-size: 12px; font-weight: 700; color: #d990a8;">[${timeStr}]</span>&nbsp;`,
    );
    emitChange();
  };



  const handleReplaceAll = () => {
    if (!findText.trim() || !editorRef.current) return;
    const currentHtml = editorRef.current.innerHTML;
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "gi");
    const updated = currentHtml.replace(regex, replaceText);
    editorRef.current.innerHTML = updated;
    emitChange();
  };

  const handleInsertLink = (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    let url = linkUrl.trim();
    if (url) {
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`;
      }
      editorRef.current?.focus();
      const sel = restoreSavedSelection();
      const selectedText =
        sel && !sel.isCollapsed && sel.toString().trim() ? sel.toString() : url;

      const linkHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer" title="Opens: ${url}" style="color: #d990a8; text-decoration: underline; font-weight: 600; cursor: pointer;">${selectedText}</a>`;
      document.execCommand("insertHTML", false, linkHTML);
      emitChange();
      setLinkUrl("");
      setShowLinkInput(false);
    }
  };

  const toggleVoiceDictation = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice dictation is supported in Chrome, Edge, and Safari.");
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";


    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript.trim();
        if (transcript) {
          editorRef.current?.focus();
          restoreSavedSelection();
          document.execCommand("insertText", false, transcript + " ");
          emitChange();
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const toggleReadAloud = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const plain = stripHtmlToText(value);
    if (!plain) return;
    const utterance = new SpeechSynthesisUtterance(plain);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest("a");
    if (anchor && anchor.href) {
      e.preventDefault();
      window.open(anchor.href, "_blank", "noopener,noreferrer");
      return;
    }

    const checkToggle = target.closest(
      '[data-check-toggle="true"]',
    ) as HTMLElement | null;
    if (checkToggle) {
      e.preventDefault();
      const parentBlock = checkToggle.closest(
        '[data-checklist="true"]',
      ) as HTMLElement | null;
      const textSpan = parentBlock?.querySelector<HTMLElement>(
        '[data-check-text="true"]',
      );

      const isCurrentlyChecked = (checkToggle.textContent || "").includes("☑");
      const nextChecked = !isCurrentlyChecked;
      checkToggle.textContent = nextChecked ? "☑" : "☐";

      if (textSpan) {
        const actualText = (textSpan.textContent || "").replace(
          /[\u200B\s\u00A0]/g,
          "",
        );
        if (nextChecked && actualText.length > 0) {
          textSpan.style.textDecoration = "line-through";
          textSpan.style.opacity = "0.65";
        } else {
          textSpan.style.textDecoration = "none";
          textSpan.style.opacity = "1";
        }
      }
      emitChange();
      return;
    }

    const trimmed = (target.textContent || "").trimStart();
    if (trimmed.startsWith("☐") || trimmed.startsWith("☑")) {
      const rect = target.getBoundingClientRect();
      if (e.clientX - rect.left <= 36) {
        const isChecked = trimmed.startsWith("☑");
        const nextChecked = !isChecked;
        const textAfterBox = trimmed.slice(1);
        const hasActualText =
          textAfterBox.replace(/[\u200B\s\u00A0]/g, "").length > 0;

        target.setAttribute("data-checklist", "true");
        target.style.margin = "4px 0";
        target.innerHTML = `<span data-check-toggle="true" style="cursor: pointer; user-select: none; color: #d990a8; font-weight: 700; margin-right: 8px; text-decoration: none; display: inline-block;">${
          nextChecked ? "☑" : "☐"
        }</span><span data-check-text="true" style="${
          nextChecked && hasActualText
            ? "text-decoration: line-through; opacity: 0.65;"
            : "text-decoration: none; opacity: 1;"
        }">${textAfterBox || "&#8203;"}</span>`;
        emitChange();
      }
    }
  };



  const wordCount = useMemo(() => getWordCount(value), [value]);
  const charCount = useMemo(() => stripHtmlToText(value).length, [value]);
  const sentenceCount = useMemo(() => getSentenceCount(value), [value]);
  const paragraphCount = useMemo(() => getParagraphCount(value), [value]);
  const readMins = useMemo(() => getReadingTimeMinutes(wordCount), [wordCount]);
  const goalProgress = Math.min(100, Math.round((wordCount / wordGoal) * 100));

  const activeFontCss =
    FONT_FAMILIES.find((f) => f.id === fontFamilyId)?.css ||
    FONT_FAMILIES[0].css;

  const paperCanvasStyle = useMemo<React.CSSProperties>(() => {
    const base: React.CSSProperties = {
      fontFamily: activeFontCss,
      fontSize: "18px",
      lineHeight:
        paperStyle === "ruled" || paperStyle === "cornell"
          ? "32px"
          : lineSpacing,
      backgroundAttachment: "local",
    };

    if (paperStyle === "ruled") {
      return {
        ...base,
        backgroundImage:
          "linear-gradient(to bottom, transparent 31px, var(--line) 32px)",
        backgroundSize: "100% 32px",
      };
    }
    if (paperStyle === "dots") {
      return {
        ...base,
        backgroundImage:
          "radial-gradient(var(--line) 1.4px, transparent 1.4px)",
        backgroundSize: "22px 22px",
      };
    }
    if (paperStyle === "grid") {
      return {
        ...base,
        backgroundImage:
          "linear-gradient(to right, var(--line) 1px, transparent 1px), linear-gradient(to bottom, var(--line) 1px, transparent 1px)",
        backgroundSize: "26px 26px",
      };
    }
    if (paperStyle === "cornell") {
      return {
        ...base,
        paddingLeft: "68px",
        backgroundImage:
          "linear-gradient(to right, transparent 52px, rgba(217, 144, 168, 0.45) 52px, rgba(217, 144, 168, 0.45) 54px, transparent 54px), linear-gradient(to bottom, transparent 31px, var(--line) 32px)",
        backgroundSize: "100% 100%, 100% 32px",
      };
    }
    if (paperStyle === "linen") {
      return {
        ...base,
        backgroundImage:
          "repeating-linear-gradient(45deg, transparent, transparent 11px, var(--line) 11px, var(--line) 12px), repeating-linear-gradient(-45deg, transparent, transparent 11px, var(--line) 11px, var(--line) 12px)",
      };
    }
    return base;
  }, [paperStyle, activeFontCss, lineSpacing]);

  const paddingClass =
    marginWidth === "narrow"
      ? "px-8 sm:px-20 py-7"
      : marginWidth === "wide"
        ? "px-4 sm:px-5 py-5"
        : "px-5 sm:px-10 py-6";

  return (
    <div className="border border-line rounded-2xl bg-white overflow-hidden shadow-soft focus-within:border-[#d990a8] transition-all flex flex-col">
      
      {/* PRIMARY FORMATTING TOOLBAR */}

      <div
        className="flex flex-wrap items-center justify-between gap-1.5 bg-[#fcf9fa] border-b border-line px-3 py-2 text-ink"
        onMouseDown={(e) => {
          const tag = (e.target as HTMLElement).tagName;
          if (tag !== "INPUT" && tag !== "SELECT" && tag !== "OPTION") {
            e.preventDefault();
          }
        }}
      >
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => executeCommand("undo")}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-lg hover:bg-white text-muted hover:text-ink transition-colors cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("redo")}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded-lg hover:bg-white text-muted hover:text-ink transition-colors cursor-pointer"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-line mx-0.5" />

          <button
            type="button"
            onClick={() => executeCommand("bold")}
            title="Bold (Ctrl+B)"
            className={`p-1.5 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
              activeFormats.bold
                ? "bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2]"
                : "hover:bg-white text-ink"
            }`}
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("italic")}
            title="Italic (Ctrl+I)"
            className={`p-1.5 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
              activeFormats.italic
                ? "bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2]"
                : "hover:bg-white text-ink"
            }`}
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("underline")}
            title="Underline (Ctrl+U)"
            className={`p-1.5 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
              activeFormats.underline
                ? "bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2]"
                : "hover:bg-white text-ink"
            }`}
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("strikeThrough")}
            title="Strikethrough"
            className={`p-1.5 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
              activeFormats.strikeThrough
                ? "bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2]"
                : "hover:bg-white text-ink"
            }`}
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-line mx-0.5" />

          <button
            type="button"
            onClick={() => executeCommand("formatBlock", "H2")}
            title="Chapter Heading (H2)"
            className="p-1.5 rounded-lg hover:bg-white text-ink font-bold text-xs cursor-pointer"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("formatBlock", "H3")}
            title="Subheading (H3)"
            className="p-1.5 rounded-lg hover:bg-white text-ink font-bold text-xs cursor-pointer"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleInsertCallout}
            title="Insert Highlighted Reflection Callout"
            className="p-1.5 rounded-lg hover:bg-white text-[#a55f78] font-bold text-xs cursor-pointer"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleInsertTwoColumns}
            title="Insert 2-Column Split Reflection Block"
            className="p-1.5 rounded-lg hover:bg-white text-ink font-bold text-xs cursor-pointer"
          >
            <Columns className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleInsertCodeBlock}
            title="Insert Monospace / Verse Block"
            className="p-1.5 rounded-lg hover:bg-white text-ink font-bold text-xs cursor-pointer"
          >
            <Code className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-line mx-0.5" />

          <div className="flex items-center gap-1 bg-white border border-line rounded-lg px-2 py-1 text-xs font-semibold text-ink">
            <Type className="w-3 h-3 text-[#a55f78] shrink-0" />
            <select
              aria-label="Font Size Selector"
              value={selectedFontSizeLabel}
              onMouseDown={saveCurrentSelection}
              onChange={(e) => {
                const found = FONT_SIZES.find(
                  (f) => f.label === e.target.value,
                );
                if (found) handleFontSizeSelect(found.label, found.size);
              }}
              className="bg-transparent border-0 outline-none text-[11.5px] cursor-pointer font-bold text-ink pr-1"
            >
              {FONT_SIZES.map((f) => (
                <option
                  key={f.size}
                  value={f.label}
                  className="bg-white text-ink"
                >
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div
            className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-white border border-line"
            title="Text Color Wheel"
          >
            <span className="text-[10px] font-extrabold text-muted">A</span>
            <input
              type="color"
              aria-label="Text Color"
              onMouseDown={saveCurrentSelection}
              onInput={(e) =>
                handleColorChange(
                  "foreColor",
                  (e.target as HTMLInputElement).value,
                )
              }
              onChange={(e) => handleColorChange("foreColor", e.target.value)}
              defaultValue="#d990a8"
              className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent p-0"
            />
          </div>

          <div
            className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-white border border-line"
            title="Highlight Color Wheel"
          >
            <Highlighter className="w-3 h-3 text-[#a55f78]" />
            <input
              type="color"
              aria-label="Highlight Color"
              onMouseDown={saveCurrentSelection}
              onInput={(e) =>
                handleColorChange(
                  "hiliteColor",
                  (e.target as HTMLInputElement).value,
                )
              }
              onChange={(e) => handleColorChange("hiliteColor", e.target.value)}
              defaultValue="#fff0f3"
              className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent p-0"
            />
          </div>

          <button
            type="button"
            onMouseDown={saveCurrentSelection}
            onClick={() => handleTransformCase("title")}
            title="Transform Selected Text to Title Case"
            className="px-1.5 py-1 rounded-lg hover:bg-white text-[10.5px] font-extrabold text-muted hover:text-ink cursor-pointer"
          >
            Aa
          </button>
          <button
            type="button"
            onMouseDown={saveCurrentSelection}
            onClick={handleClearFormatting}
            title="Clear formatting (selection or whole entry)"
            className="p-1.5 rounded-lg hover:bg-white text-muted hover:text-ink font-bold text-xs cursor-pointer"
          >
            <RemoveFormatting className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-line mx-0.5" />

          <button
            type="button"
            onClick={() => executeCommand("justifyLeft")}
            title="Align Left"
            className="p-1.5 rounded-lg hover:bg-white text-muted hover:text-ink cursor-pointer"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("justifyCenter")}
            title="Align Center"
            className="p-1.5 rounded-lg hover:bg-white text-muted hover:text-ink cursor-pointer"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("justifyRight")}
            title="Align Right"
            className="p-1.5 rounded-lg hover:bg-white text-muted hover:text-ink cursor-pointer"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-line mx-0.5" />

          <button
            type="button"
            onClick={() => executeCommand("insertUnorderedList")}
            title="Bullet List"
            className="p-1.5 rounded-lg hover:bg-white text-ink cursor-pointer"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("insertOrderedList")}
            title="Numbered List"
            className="p-1.5 rounded-lg hover:bg-white text-ink cursor-pointer"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={saveCurrentSelection}
            onClick={handleInsertChecklist}
            title="Interactive Checklist Item (Click ☐ to strike through text when written)"
            className="p-1.5 rounded-lg hover:bg-white text-[#a55f78] cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("insertHorizontalRule")}
            title="Insert Section Divider"
            className="p-1.5 rounded-lg hover:bg-white text-muted hover:text-ink cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleInsertTimestamp}
            title="Stamp Current Time"
            className="p-1.5 rounded-lg hover:bg-white text-muted hover:text-[#a55f78] cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!showLinkInput) saveCurrentSelection();
              setShowLinkInput((prev) => !prev);
            }}
            title="Insert Hyperlink"
            className="p-1.5 rounded-lg hover:bg-white text-ink cursor-pointer"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowFindReplace((p) => !p)}
            title="Find & Replace in Entry"
            className={`p-1.5 rounded-lg cursor-pointer ${
              showFindReplace
                ? "bg-[#fff0f3] text-[#a55f78]"
                : "hover:bg-white text-muted hover:text-ink"
            }`}
          >
            <Replace className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Studio Controls: Read Aloud, Voice Dictation & Zen Mode */}


        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={toggleReadAloud}
            title="Listen to entry read aloud"
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
              isSpeaking
                ? "bg-[#a55f78] text-white border-[#a55f78]"
                : "bg-white text-muted border-line hover:text-ink"
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-3 h-3" />
                <span>Stop Audio</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3 h-3 text-[#a55f78]" />
                <span className="hidden sm:inline">Read Aloud</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={toggleVoiceDictation}
            title="Voice-to-Text Dictation"
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
              isListening
                ? "bg-rose-500 text-white border-rose-500 animate-pulse"
                : "bg-white text-muted border-line hover:text-[#a55f78] hover:border-[#d990a8]"
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-3 h-3" />
                <span>Listening...</span>
              </>
            ) : (
              <>
                <Mic className="w-3 h-3 text-[#a55f78]" />
                <span className="hidden sm:inline">Dictate</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleZenMode}
            title={
              isZenMode
                ? "Exit Zen Sanctuary Mode"
                : "Enter Fullscreen Zen Mode"
            }
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
              isZenMode
                ? "bg-[#fff0f3] text-[#a55f78] border-[#f4c2c2]"
                : "bg-white text-muted border-line hover:text-ink"
            }`}
          >
            {isZenMode ? (
              <>
                <Minimize2 className="w-3 h-3" />
                <span>Exit Zen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3 h-3" />
                <span className="hidden sm:inline">Zen Mode</span>
              </>
            )}
          </button>
        </div>
      </div>


      {/* SECONDARY AMBIENCE BAR: 6 PAPER CANVASES, 6 FONTS, SPACING & MARGINS */}


      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-white border-b border-line/60 text-[11px]">
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted mr-1">
            Paper Canvas (6):
          </span>
          {PAPER_CANVASES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPaperStyleChange(p.id)}
              className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer border ${
                paperStyle === p.id
                  ? "bg-[#fff0f3] text-[#a55f78] border-[#f4c2c2]"
                  : "bg-transparent text-muted border-transparent hover:text-ink"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-[#fcf9fa] border border-line rounded-lg px-2 py-0.5">
            <span className="text-[10px] font-bold text-muted">Font:</span>
            <select
              aria-label="Font Family"
              value={fontFamilyId}
              onChange={(e) =>
                onFontFamilyChange(e.target.value as FontFamilyId)
              }
              className="bg-transparent border-0 outline-none text-[11px] font-bold text-ink cursor-pointer"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f.id} value={f.id} className="bg-white text-ink">
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-[#fcf9fa] border border-line rounded-lg px-2 py-0.5">
            <span className="text-[10px] font-bold text-muted">Spacing:</span>
            {(["1.55", "1.8", "2.1"] as const).map((sp) => (
              <button
                key={sp}
                type="button"
                onClick={() => setLineSpacing(sp)}
                className={`px-1 rounded text-[10px] font-bold cursor-pointer ${
                  lineSpacing === sp ? "text-[#a55f78]" : "text-muted"
                }`}
              >
                {sp}x
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-[#fcf9fa] border border-line rounded-lg px-2 py-0.5">
            <span className="text-[10px] font-bold text-muted">Margins:</span>
            {(
              [
                { id: "narrow", label: "Book" },
                { id: "standard", label: "Std" },
                { id: "wide", label: "Wide" },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMarginWidth(m.id)}
                className={`px-1 rounded text-[10px] font-bold cursor-pointer ${
                  marginWidth === m.id ? "text-[#a55f78]" : "text-muted"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>


      {/* FIND & REPLACE BAR */}


      {showFindReplace && (
        <div className="flex flex-wrap items-center gap-2 p-2.5 bg-[#fcf9fa] border-b border-line text-xs">
          <input
            type="text"
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            placeholder="Find word or phrase..."
            className="px-3 py-1.5 bg-white border border-line rounded-lg text-xs text-ink outline-none focus:border-[#d990a8]"
          />
          <input
            type="text"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="Replace with..."
            className="px-3 py-1.5 bg-white border border-line rounded-lg text-xs text-ink outline-none focus:border-[#d990a8]"
          />
          <button
            type="button"
            onClick={handleReplaceAll}
            className="px-3 py-1.5 bg-[#d990a8] text-white rounded-lg font-bold text-xs cursor-pointer"
          >
            Replace All
          </button>
          <button
            type="button"
            onClick={() => setShowFindReplace(false)}
            className="px-2.5 py-1.5 bg-white border border-line text-muted rounded-lg font-bold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      )}


      {/* LINK INSERTION POPOVER */}



      {showLinkInput && (
        <div className="flex items-center gap-2 p-2.5 bg-[#fcf9fa] border-b border-line text-xs">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Paste URL (https://...)"
            className="flex-1 px-3 py-1.5 bg-white border border-line rounded-lg text-xs text-ink outline-none focus:border-[#d990a8]"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleInsertLink(e);
              }
            }}
          />
          <button
            type="button"
            onClick={handleInsertLink}
            className="px-3 py-1.5 bg-[#d990a8] text-white rounded-lg font-bold text-xs cursor-pointer"
          >
            Insert Link
          </button>
          <button
            type="button"
            onClick={() => setShowLinkInput(false)}
            className="px-2.5 py-1.5 bg-slate-100 text-muted rounded-lg font-bold text-xs cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}


      {/* LUXURY WRITING CANVAS */}


      <div
        ref={editorRef}
        contentEditable
        spellCheck={false}
        onClick={handleEditorClick}
        onMouseUp={() => {
          saveCurrentSelection();
          updateActiveStates();
        }}
        onKeyUp={() => {
          saveCurrentSelection();
          updateActiveStates();
        }}
        onInput={(e) => {
          syncChecklistBlockStyles(e.currentTarget);
          onChange(e.currentTarget.innerHTML);
          saveCurrentSelection();
          updateActiveStates();
        }}
        aria-label={placeholder}
        data-placeholder={placeholder}
        style={paperCanvasStyle}
        className={`w-full ${
          isZenMode ? "min-h-[60vh]" : "min-h-[320px]"
        } ${paddingClass} text-ink outline-none overflow-y-auto resize-y empty:before:content-[attr(data-placeholder)] empty:before:text-muted/55 [&_h2]:text-[22px] [&_h2]:font-extrabold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h3]:text-[18px] [&_h3]:font-bold [&_h3]:mt-2.5 [&_h3]:mb-1 [&_blockquote]:border-l-4 [&_blockquote]:border-[#d990a8] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-2.5 [&_hr]:my-4 [&_hr]:border-line [&_a]:text-[#d990a8] [&_a]:underline [&_a]:cursor-pointer [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6`}
      />

      {/* TELEMETRY FOOTER & CUSTOMIZABLE WORD GOAL BAR */}


      <div className="bg-[#fcf9fa] border-t border-line px-4 py-2 flex flex-wrap justify-between items-center gap-3 text-[11px] font-semibold text-muted tabular-nums select-none">
        <div className="flex flex-wrap items-center gap-2.5">
          <span>Daily Word Target:</span>
          <select
            aria-label="Word Goal Target"
            value={wordGoal}
            onChange={(e) => setWordGoal(Number(e.target.value))}
            className="bg-white border border-line rounded px-1.5 py-0.5 text-[10.5px] font-bold text-ink cursor-pointer"
          >
            <option value={100}>100w</option>
            <option value={200}>200w</option>
            <option value={350}>350w</option>
            <option value={500}>500w</option>
            <option value={750}>750w</option>
          </select>
          <div className="w-24 h-2 bg-white border border-line rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#d990a8] to-[#a55f78] transition-all duration-300"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
          <span className="text-[10.5px] font-bold text-[#a55f78]">
            {goalProgress}%
          </span>

          <button
            type="button"
            onClick={onOpenTemplateModal}
            className="ml-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#a55f78] hover:underline cursor-pointer"
          >
            <BookMarked className="w-3 h-3" />
            <span>Browse 54 Templates</span>
          </button>
        </div>


        <div className="flex flex-wrap items-center gap-3">
          <span>
            <strong className="text-ink">{wordCount}</strong> words
          </span>
          <span>•</span>
          <span>{sentenceCount} sentences</span>
          <span>•</span>
          <span>{paragraphCount} paragraphs</span>
          <span>•</span>
          <span>{charCount} chars</span>
          <span>•</span>
          <span>~{readMins} min read</span>
        </div>
      </div>
    </div>
  );

};

export default function JournalPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedAuraFilter, setSelectedAuraFilter] = useState<string>("all");
  const [lengthFilter, setLengthFilter] = useState<
    "all" | "short" | "medium" | "long"
  >("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ArchiveViewMode>("timeline");
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [expandedNoteIds, setExpandedNoteIds] = useState<
    Record<string, boolean>
  >({});
  const [readingNote, setReadingNote] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [isComposing, setIsComposing] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [paperStyle, setPaperStyle] = useState<PaperStyle>("ruled");
  const [fontFamilyId, setFontFamilyId] = useState<FontFamilyId>("serif");
  const [promptIndex, setPromptIndex] = useState(0);
  const [editorSyncKey, setEditorSyncKey] = useState("init");
  const [activeUserId, setActiveUserId] = useState("local-user");

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateCategory, setTemplateCategory] = useState<string>("All");
  const [templateSearch, setTemplateSearch] = useState("");

  const {
    soundMode,
    isPlaying,
    customTrackName,
    hasCustomAudio,
    volume,
    selectSoundscape,
    togglePlayPause,
    handleUploadCustomMp3,
    handleVolumeChange,
  } = useAmbientSoundscape();
  const mp3InputRef = useRef<HTMLInputElement | null>(null);

  const [customTimerMins, setCustomTimerMins] = useState<number>(15);
  const [timerSeconds, setTimerSeconds] = useState<number>(15 * 60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [showTimerConfig, setShowTimerConfig] = useState<boolean>(false);
  const [customMinInput, setCustomMinInput] = useState<string>("15");

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          playGentleChime();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);


  const applyCustomTimerMinutes = (mins: number) => {
    const clamped = Math.max(1, Math.min(240, Math.round(mins || 15)));
    setCustomTimerMins(clamped);
    setCustomMinInput(String(clamped));
    setTimerRunning(false);
    setTimerSeconds(clamped * 60);
    setShowTimerConfig(false);
  };

  const [entryDate, setEntryDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentCreatedAt, setCurrentCreatedAt] = useState<string | null>(null);
  const [currentUpdatedAt, setCurrentUpdatedAt] = useState<string | null>(null);
  const draftCreatedAtRef = useRef<string | null>(null);

  const [starredIds, setStarredIds] = useState<Record<string, boolean>>({});
  const [pinnedIds, setPinnedIds] = useState<Record<string, boolean>>({});

  const supabase = createClient();

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        setStarredIds(
          JSON.parse(localStorage.getItem("moonday_starred_journals") || "{}"),
        );
        setPinnedIds(
          JSON.parse(localStorage.getItem("moonday_pinned_journals") || "{}"),
        );
      } catch {}
    }
  }, []);

  const toggleStarEntry = (note: any) => {
    const updated = { ...starredIds, [note.id]: !starredIds[note.id] };
    setStarredIds(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("moonday_starred_journals", JSON.stringify(updated));
    }
  };

  const togglePinEntry = (note: any) => {
    const updated = { ...pinnedIds, [note.id]: !pinnedIds[note.id] };
    setPinnedIds(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("moonday_pinned_journals", JSON.stringify(updated));
    }
  };

  const {
    isOnline,
    status,
    lastSavedAt,
    syncError,
    conflict,
    saveEntry,
    triggerAutosave,
    checkExistingDraft,
    clearDraft,
    resolveKeepLocal,
    resolveKeepServer,
  } = useOfflineResilience({
    userId: activeUserId,
    date: entryDate,
    table: "personal_notes",
    dateColumn: "entry_date",
    recordId: editingId,
    draftKeySuffix: editingId || "new_journal_draft",
    initialServerUpdatedAt: currentUpdatedAt,
    onServerRestore: (serverData: any) => {
      setTitle(serverData.title || "");
      setContent(serverData.content || "");
      setTags(serverData.tags || []);
      setCurrentCreatedAt(serverData.created_at || null);
      setCurrentUpdatedAt(serverData.updated_at || null);
      draftCreatedAtRef.current = serverData.created_at || null;
      setEditorSyncKey(`restore-${Date.now()}`);
    },
  });


  const fetchNotes = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }
    setActiveUserId(user.id);

    const { data } = await supabase
      .from("personal_notes")
      .select("*")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (data) setNotes(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchNotes();

    async function restoreUnsavedDraft() {
      const existing = await checkExistingDraft();
      if (existing && existing.payload) {
        const p = existing.payload as Record<string, any>;
        if (p.content || p.title) {
          setEntryDate(existing.date || format(new Date(), "yyyy-MM-dd"));
          setTitle(p.title === "Untitled Entry" ? "" : p.title || "");
          setContent(p.content || "");
          setTags(Array.isArray(p.tags) ? p.tags : []);
          setEditingId(existing.recordId || null);
          if (p.created_at) {
            setCurrentCreatedAt(p.created_at);
            draftCreatedAtRef.current = p.created_at;
          }
          if (p.updated_at) {
            setCurrentUpdatedAt(p.updated_at);
          }
          setEditorSyncKey(`draft-${Date.now()}`);
          setIsComposing(true);
        }
      }
    }
    restoreUnsavedDraft();
  }, [fetchNotes, checkExistingDraft]);

  const generatePayload = useCallback(
    (currentTitle: string, currentContent: string, currentTags: string[]) => {
      const timestamps = buildSyncTimestamps({
        created_at: currentCreatedAt || draftCreatedAtRef.current,
        updated_at: currentUpdatedAt,
      });

      if (!draftCreatedAtRef.current) {
        draftCreatedAtRef.current = timestamps.created_at;
      }

      return {
        id: editingId || undefined,
        title: currentTitle || "Untitled Reflection",
        content: currentContent,
        tags: currentTags,
        created_at: timestamps.created_at,
        updated_at: timestamps.updated_at,
      };
    },
    [editingId, currentCreatedAt, currentUpdatedAt],
  );

  const addTagValue = (rawTag: string) => {
    const newTag = rawTag.trim().replace(/^#/, "");
    if (!newTag) return;
    if (!tags.includes(newTag)) {
      const newTags = [...tags, newTag];
      setTags(newTags);
      triggerAutosave(generatePayload(title, content, newTags), false);
    }
  };


  const togglePrefixTag = (prefix: string, fullTag: string) => {
    const withoutPrefix = tags.filter((t) => !t.startsWith(`${prefix}:`));
    const isAlreadySelected = tags.includes(fullTag);
    const nextTags = isAlreadySelected
      ? withoutPrefix
      : [...withoutPrefix, fullTag];
    setTags(nextTags);
    triggerAutosave(generatePayload(title, content, nextTags), false);
  };


  const handleApplyTemplate = (tpl: JournalTemplate) => {
    const nextTitle = title.trim() ? title : tpl.title;
    const nextContent = content.trim() ? `${content}<br>${tpl.html}` : tpl.html;
    const nextTags = tags.includes(tpl.tag) ? tags : [...tags, tpl.tag];
    setTitle(nextTitle);
    setContent(nextContent);
    setTags(nextTags);
    setEditorSyncKey(`tpl-${tpl.id}-${Date.now()}`);
    setShowTemplateModal(false);
    if (!isComposing) setIsComposing(true);
    triggerAutosave(generatePayload(nextTitle, nextContent, nextTags), false);
  };

  const handleInsertSoulPrompt = () => {
    const promptText = SOUL_PROMPTS[promptIndex % SOUL_PROMPTS.length];
    setPromptIndex((prev) => prev + 1);
    const promptBlock = `<blockquote style="padding: 12px 16px; border-left: 4px solid #d990a8; background: rgba(217, 144, 168, 0.1); border-radius: 10px; margin: 10px 0;">💭 <em>${promptText}</em></blockquote><p><br></p>`;
    const nextContent = content.trim()
      ? `${content}${promptBlock}`
      : promptBlock;
    setContent(nextContent);
    setEditorSyncKey(`prompt-${Date.now()}`);
    triggerAutosave(generatePayload(title, nextContent, tags), false);
  };


  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      addTagValue(tagInput);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter((t) => t !== tagToRemove);
    setTags(newTags);
    triggerAutosave(generatePayload(title, content, newTags), false);
  };


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripHtmlToText(content).trim()) return;

    const payload = generatePayload(title, content, tags);
    const success = await saveEntry(payload, true);


    if (success) {
      selectSoundscape("off");
      setIsComposing(false);
      setIsZenMode(false);
      resetComposer();
      await fetchNotes();
      router.refresh();
    } else if (!isOnline) {
      setNotes((prev) => [
        {
          id: editingId || `offline-${Date.now()}`,
          entry_date: entryDate,
          title: payload.title,
          content: payload.content,
          tags: payload.tags,
          created_at: payload.created_at,
          updated_at: payload.updated_at,
        },
        ...prev,
      ]);
      selectSoundscape("off");
      setIsComposing(false);
      setIsZenMode(false);
      resetComposer();
    }
  };


  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this journal entry?")) return;

    const { error } = await supabase
      .from("personal_notes")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Error deleting note: " + error.message);
      return;
    }

    if (readingNote?.id === id) setReadingNote(null);
    await fetchNotes();
    router.refresh();
  };

  const resetComposer = () => {
    setEntryDate(format(new Date(), "yyyy-MM-dd"));
    setTitle("");
    setContent("");
    setTags([]);
    setEditingId(null);
    setCurrentCreatedAt(null);
    setCurrentUpdatedAt(null);
    draftCreatedAtRef.current = null;
    setEditorSyncKey(`reset-${Date.now()}`);
  };

  const handleCancel = async () => {
    selectSoundscape("off");
    await clearDraft();
    resetComposer();
    setIsComposing(false);
    setIsZenMode(false);
  };


  const openEditor = (note: any) => {
    setReadingNote(null);
    setEntryDate(note.entry_date);
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags || []);
    setEditingId(note.id);
    const initialCreated = note.created_at || note.updated_at || null;
    setCurrentCreatedAt(initialCreated);
    setCurrentUpdatedAt(note.updated_at || null);
    draftCreatedAtRef.current = initialCreated;
    setEditorSyncKey(`edit-${note.id}-${Date.now()}`);
    setIsComposing(true);
  };


  const handleExportEntryMarkdown = (note: any) => {
    const plain = stripHtmlToText(note.content);
    const md = `# ${note.title || "Untitled Reflection"}\n**Date:** ${note.entry_date}\n**Tags:** ${(note.tags || []).map((t: string) => `#${t}`).join(" ")}\n\n---\n\n${plain}\n`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `journal_${note.entry_date}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  const handleExportAllAnthology = (formatType: "md" | "json") => {
    if (notes.length === 0) return;
    if (formatType === "json") {
      const blob = new Blob([JSON.stringify(notes, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `moonday_journal_anthology_${format(new Date(), "yyyy-MM-dd")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }


    const anthologyMd = notes
      .map(
        (n) =>
          `# ${n.title || "Untitled"}\n*Date: ${n.entry_date}*\n\n${stripHtmlToText(n.content)}\n\n---\n`,
      )
      .join("\n");
    const blob = new Blob([anthologyMd], {
      type: "text/markdown;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `moonday_complete_journal_${format(new Date(), "yyyy-MM-dd")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  const handleCopyEntry = async (note: any) => {
    const plain = `${note.title}\n(${note.entry_date})\n\n${stripHtmlToText(note.content)}`;
    await navigator.clipboard.writeText(plain);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const journalStats = useMemo(() => {
    let totalWords = 0;
    const uniqueDates = new Set<string>();
    const wordsByDate: Record<string, number> = {};
    const auraCounts: Record<string, number> = {};

    notes.forEach((n) => {
      const w = getWordCount(n.content || "");
      totalWords += w;
      if (n.entry_date) {
        uniqueDates.add(n.entry_date);
        wordsByDate[n.entry_date] = (wordsByDate[n.entry_date] || 0) + w;
      }
      if (Array.isArray(n.tags)) {
        const mTag = n.tags.find((t: string) => t.startsWith("mood:"));
        if (mTag) {
          auraCounts[mTag] = (auraCounts[mTag] || 0) + 1;
        }
      }
    });

    const sortedDates = Array.from(uniqueDates).sort().reverse();
    let streak = 0;
    if (sortedDates.length > 0) {
      streak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const diff = differenceInCalendarDays(
          parseISO(sortedDates[i - 1]),
          parseISO(sortedDates[i]),
        );
        if (diff <= 2) streak += 1;
        else break;
      }
    }

    const today = new Date();
    const heatmapDays = Array.from({ length: 84 }).map((_, idx) => {
      const d = subDays(today, 83 - idx);
      const dateStr = format(d, "yyyy-MM-dd");
      const words = wordsByDate[dateStr] || 0;
      return {
        dateStr,
        label: format(d, "MMM d, yyyy"),
        words,
      };
    });

    const starredCount = notes.filter((n) => starredIds[n.id]).length;

    return {
      totalEntries: notes.length,
      totalWords,
      streak,
      starredCount,
      heatmapDays,
      auraCounts,
    };
  }, [notes, starredIds]);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => {
      if (n.entry_date && n.entry_date.length >= 7) {
        set.add(n.entry_date.slice(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [notes]);

  const allExistingTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => {
      if (Array.isArray(n.tags)) {
        n.tags.forEach((t: string) => {
          if (
            t &&
            t.trim() &&
            !t.startsWith("mood:") &&
            !t.startsWith("weather:") &&
            !t.startsWith("phase:") &&
            !t.startsWith("energy:")
          ) {
            set.add(t.trim());
          }
        });
      }
    });
    return Array.from(set).slice(0, 14);
  }, [notes]);

  const processedNotes = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    const filtered = notes.filter((n) => {
      if (onlyStarred && !starredIds[n.id]) return false;
      if (selectedMonth !== "all" && !n.entry_date?.startsWith(selectedMonth)) {
        return false;
      }
      if (
        selectedAuraFilter !== "all" &&
        (!Array.isArray(n.tags) || !n.tags.includes(selectedAuraFilter))
      ) {
        return false;
      }
      if (lengthFilter !== "all") {
        const w = getWordCount(n.content || "");
        if (lengthFilter === "short" && w >= 100) return false;
        if (lengthFilter === "medium" && (w < 100 || w > 300)) return false;
        if (lengthFilter === "long" && w <= 300) return false;
      }
      if (!q) return true;

      const plainBody = stripHtmlToText(n.content || "").toLowerCase();
      const titleMatch = (n.title || "").toLowerCase().includes(q);
      const tagMatch =
        Array.isArray(n.tags) &&
        n.tags.some((t: string) => t.toLowerCase().includes(q));

      return titleMatch || plainBody.includes(q) || tagMatch;
    });

    return [...filtered].sort((a, b) => {
      const aPinned = pinnedIds[a.id] ? 1 : 0;
      const bPinned = pinnedIds[b.id] ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;

      if (sortBy === "newest") {
        return (b.entry_date || "").localeCompare(a.entry_date || "");
      }
      if (sortBy === "oldest") {
        return (a.entry_date || "").localeCompare(b.entry_date || "");
      }
      if (sortBy === "longest") {
        return getWordCount(b.content || "") - getWordCount(a.content || "");
      }
      if (sortBy === "shortest") {
        return getWordCount(a.content || "") - getWordCount(b.content || "");
      }
      if (sortBy === "alphabetical") {
        return (a.title || "").localeCompare(b.title || "");
      }
      return 0;
    });
  }, [
    notes,
    searchTerm,
    selectedMonth,
    selectedAuraFilter,
    lengthFilter,
    sortBy,
    onlyStarred,
    starredIds,
    pinnedIds,
  ]);

  const filteredTemplates = useMemo(() => {
    const q = templateSearch.toLowerCase().trim();
    return JOURNAL_TEMPLATES.filter((t) => {
      if (templateCategory !== "All" && t.category !== templateCategory) {
        return false;
      }
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.label.toLowerCase().includes(q) ||
        t.subtitle.toLowerCase().includes(q) ||
        t.tag.toLowerCase().includes(q)
      );
    });
  }, [templateCategory, templateSearch]);

  const activeMoodTag = tags.find((t) => t.startsWith("mood:"));
  const activeWeatherTag = tags.find((t) => t.startsWith("weather:"));
  const activePhaseTag = tags.find((t) => t.startsWith("phase:"));
  const activeEnergyTag = tags.find((t) => t.startsWith("energy:"));

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="animate-in fade-in duration-300 max-w-[1240px] mx-auto pb-16 text-ink">
      <NetworkStatusBanner
        isOnline={isOnline}
        conflict={conflict}
        syncError={syncError}
        onKeepLocal={resolveKeepLocal}
        onKeepServer={resolveKeepServer}
      />

      {/* 1.SANCTUARY MASTHEAD */}


      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#a55f78] mb-1">
            <Feather className="w-3.5 h-3.5 text-[#d990a8]" />
            <span>Private Literary Sanctuary • Encrypted Reflections</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-[26px] sm:text-[32px] font-extrabold text-ink tracking-tight leading-none">
              Personal Journal Studio 📔
            </h2>
            {isComposing && (
              <SaveStatusBadge status={status} lastSavedAt={lastSavedAt} />
            )}
          </div>
          <p className="text-[13px] text-muted mt-1.5">
            An intimate, distraction-free writing studio with 54 guided
            templates, 6 stationery canvases, and custom MP3 soundscapes.
          </p>
        </div>


        {!isComposing && (
          <div className="flex flex-wrap items-center gap-2">
            {notes.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const randomNote =
                    notes[Math.floor(Math.random() * notes.length)];
                  if (randomNote) setReadingNote(randomNote);
                }}
                title="Rediscover a random past reflection"
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-line hover:border-[#d990a8] text-muted hover:text-ink rounded-xl text-[12px] font-bold transition-all shadow-2xs cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5 text-[#a55f78]" />
                <span className="hidden sm:inline">Memory Lane</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-line hover:border-[#d990a8] text-ink rounded-xl text-[12.5px] font-bold transition-all shadow-2xs cursor-pointer"
            >
              <BookMarked className="w-4 h-4 text-[#a55f78]" />
              <span>54 Templates</span>
            </button>

            <button
              type="button"
              onClick={() => {
                resetComposer();
                handleInsertSoulPrompt();
                setIsComposing(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-line hover:border-[#d990a8] text-[#a55f78] rounded-xl text-[12.5px] font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Wand2 className="w-4 h-4 text-[#d990a8]" />
              <span>Write with Prompt</span>
            </button>

            <button
              type="button"
              onClick={() => {
                resetComposer();
                setIsComposing(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#d990a8] text-white rounded-xl text-[13px] font-bold hover:brightness-95 transition-all shadow-[0_6px_20px_-6px_rgba(217,144,168,0.65)] active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Reflection</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. EXECUTIVE SANCTUARY TELEMETRY + 12-WEEK CONSISTENCY HEATMAP */}


      {!isComposing && (
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white border border-line rounded-2xl p-4 shadow-soft flex items-center justify-between">
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted block">
                  Total Reflections
                </span>
                <span className="text-[26px] font-extrabold text-ink tabular-nums">
                  {journalStats.totalEntries}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#fff0f3] border border-[#f4c2c2] flex items-center justify-center text-[#a55f78]">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>



            <div className="bg-white border border-line rounded-2xl p-4 shadow-soft flex items-center justify-between">
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted block">
                  Words Penned
                </span>
                <span className="text-[26px] font-extrabold text-ink tabular-nums">
                  {journalStats.totalWords.toLocaleString()}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#fff0f3] border border-[#f4c2c2] flex items-center justify-center text-[#a55f78]">
                <FileText className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white border border-line rounded-2xl p-4 shadow-soft flex items-center justify-between">
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted block">
                  Mindful Streak
                </span>
                <span className="text-[26px] font-extrabold text-ink tabular-nums">
                  {journalStats.streak}{" "}
                  <span className="text-[12px] font-bold text-muted">days</span>
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#fff0f3] border border-[#f4c2c2] flex items-center justify-center text-[#a55f78]">
                <Flame className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white border border-line rounded-2xl p-4 shadow-soft flex items-center justify-between">
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted block">
                  Starred Memories
                </span>
                <span className="text-[26px] font-extrabold text-ink tabular-nums">
                  {journalStats.starredCount}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#fff0f3] border border-[#f4c2c2] flex items-center justify-center text-[#a55f78]">
                <Star className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 bg-white border border-line rounded-2xl p-4 shadow-soft flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2.5">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#a55f78] block">
                    84-Day Writing Consistency Cadence
                  </span>
                  <span className="text-[11.5px] text-muted">
                    Each square represents a day of mindful reflection
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted">
                  <span>Rest</span>
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#fcf9fa] border border-line" />
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#d990a8]/50" />
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#d990a8]" />
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#a55f78]" />
                  <span>Deep</span>
                </div>
              </div>

              <div className="grid grid-cols-14 sm:grid-cols-28 gap-1.5 pt-1">
                {journalStats.heatmapDays.map((cell) => {
                  const intensityClass =
                    cell.words === 0
                      ? "bg-[#fcf9fa] border border-line/70"
                      : cell.words < 80
                        ? "bg-[#d990a8]/45 border border-[#d990a8]"
                        : cell.words < 200
                          ? "bg-[#d990a8] border border-[#d990a8]"
                          : "bg-[#a55f78] border border-[#a55f78]";
                  return (
                    <div
                      key={cell.dateStr}
                      title={`${cell.label}: ${cell.words} words`}
                      className={`h-3.5 rounded-xs transition-transform hover:scale-125 ${intensityClass}`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-5 bg-white border border-line rounded-2xl p-4 shadow-soft flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#a55f78]">
                    Emotional Aura Spectrum
                  </span>
                  {selectedAuraFilter !== "all" && (
                    <button
                      type="button"
                      onClick={() => setSelectedAuraFilter("all")}
                      className="text-[10.5px] font-bold text-[#a55f78] underline cursor-pointer"
                    >
                      Clear Aura
                    </button>
                  )}
                </div>


                <div className="flex flex-wrap gap-1.5">
                  {MOOD_AURAS.map((aura) => {
                    const count = journalStats.auraCounts[aura.tag] || 0;
                    const isSelected = selectedAuraFilter === aura.tag;
                    return (
                      <button
                        key={aura.id}
                        type="button"
                        onClick={() =>
                          setSelectedAuraFilter(isSelected ? "all" : aura.tag)
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#a55f78] text-white border-[#a55f78]"
                            : "bg-[#fcf9fa] text-muted border-line hover:text-ink"
                        }`}
                      >
                        <span>{aura.emoji}</span>
                        <span>{aura.label}</span>
                        {count > 0 && (
                          <span className="opacity-75 tabular-nums">
                            ({count})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>



              <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-line/60">
                <span className="text-[11px] font-bold text-muted">
                  Anthology Backup:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleExportAllAnthology("md")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#fcf9fa] border border-line text-[11px] font-bold text-ink hover:border-[#d990a8] cursor-pointer"
                  >
                    <Download className="w-3 h-3 text-[#a55f78]" />
                    <span>Book .MD</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportAllAnthology("json")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#fcf9fa] border border-line text-[11px] font-bold text-ink hover:border-[#d990a8] cursor-pointer"
                  >
                    <FileJson className="w-3 h-3 text-[#a55f78]" />
                    <span>JSON</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SUPREME WRITING STUDIO COMPOSER */}


      {isComposing ? (
        <div
          className={
            isZenMode
              ? "fixed inset-0 z-[80] bg-background overflow-y-auto p-4 sm:p-8 md:p-10 animate-in fade-in duration-200"
              : ""
          }
        >
          <form
            onSubmit={handleSave}
            className={`bg-white border border-[#d990a8]/60 rounded-3xl p-5 sm:p-8 shadow-[0_16px_48px_-16px_rgba(165,95,120,0.18)] mb-8 animate-in fade-in duration-200 ${
              isZenMode ? "max-w-[1040px] mx-auto" : ""
            }`}
          >

            {/* Studio Header Bar with Fixed Music Engine + Custom MP3 Upload + Custom Pomodoro Timer */}


            <div className="flex flex-wrap justify-between items-center gap-3 pb-4 mb-4 border-b border-line/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#fff0f3] border border-[#f4c2c2] flex items-center justify-center text-[#a55f78]">
                  <Feather className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-extrabold text-ink leading-tight">
                    {editingId
                      ? "Refine Your Reflection"
                      : "New Sanctuary Reflection"}
                  </h3>
                  <p className="text-[11.5px] text-muted">
                    Encrypted & autosaved locally on every keystroke
                  </p>
                </div>
              </div>

              {/* Right Studio Controls: Ambient Sound + Custom MP3 Upload + Custom Pomodoro Timer + Date */}


              <div className="flex flex-wrap items-center gap-2">


                {/* Hidden File Input for Custom MP3 Upload */}


                <input
                  ref={mp3InputRef}
                  type="file"
                  accept=".mp3,audio/*"
                  aria-label="Upload custom MP3 audio file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleUploadCustomMp3(file);
                    }
                    e.currentTarget.value = "";
                  }}
                />

                {/* Fixed Ambient Soundscape + Play/Pause Toggle + Custom MP3 Bar */}


                <div className="inline-flex flex-wrap items-center gap-1.5 bg-[#fcf9fa] border border-line rounded-xl px-2.5 py-1 text-[11px] font-bold">
                  <Music
                    className={`w-3.5 h-3.5 ${
                      isPlaying
                        ? "text-[#d990a8] animate-pulse"
                        : "text-[#a55f78]"
                    }`}
                  />
                  <select
                    aria-label="Ambient Soundscape"
                    value={soundMode}
                    onChange={(e) =>
                      selectSoundscape(e.target.value as SoundscapeMode)
                    }
                    className="bg-transparent border-0 outline-none text-[11px] font-bold text-ink cursor-pointer max-w-[155px] truncate"
                  >
                    <option value="off">Ambience: Off</option>
                    <option value="rain">🌧️ Soft Rain</option>
                    <option value="pink">🌊 Pink Noise</option>
                    <option value="zen432">🧘‍♀️ 432Hz Zen Drone</option>
                    {hasCustomAudio && (
                      <option value="custom">
                        🎵 MP3: {customTrackName || "Custom Track"}
                      </option>
                    )}
                  </select>

                  {soundMode !== "off" && (
                    <button
                      type="button"
                      onClick={togglePlayPause}
                      title={
                        isPlaying
                          ? "Pause music/ambience"
                          : "Play music/ambience"
                      }
                      className={`p-1 rounded-lg border transition-colors cursor-pointer ${
                        isPlaying
                          ? "bg-[#fff0f3] text-[#a55f78] border-[#f4c2c2]"
                          : "bg-white text-ink border-line"
                      }`}
                    >
                      {isPlaying ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => mp3InputRef.current?.click()}
                    title="Upload your own MP3 or audio file from your device"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#fff0f3] border border-[#f4c2c2] text-[#a55f78] text-[10.5px] font-extrabold hover:brightness-95 transition-all cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{hasCustomAudio ? "Change MP3" : "Upload MP3"}</span>
                  </button>

                  {soundMode !== "off" && (
                    <input
                      type="range"
                      min={0.05}
                      max={1}
                      step={0.05}
                      value={volume}
                      onChange={(e) =>
                        handleVolumeChange(Number(e.target.value))
                      }
                      title={`Volume: ${Math.round(volume * 100)}%`}
                      aria-label="Soundscape Volume"
                      className="w-14 h-1 accent-[#d990a8] cursor-pointer"
                    />
                  )}
                </div>

                {/* Customizable Mindful Pomodoro Flow Timer */}


                <div className="relative inline-flex items-center gap-1.5 bg-[#fcf9fa] border border-line rounded-xl px-2.5 py-1 text-[11px] font-bold tabular-nums">
                  <Clock className="w-3.5 h-3.5 text-[#d990a8]" />
                  <button
                    type="button"
                    onClick={() => setShowTimerConfig((p) => !p)}
                    title="Click to customize Pomodoro timer duration"
                    className="text-ink hover:text-[#a55f78] underline decoration-dotted underline-offset-2 cursor-pointer font-extrabold"
                  >
                    {formatTimer(timerSeconds)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimerRunning((p) => !p)}
                    title={timerRunning ? "Pause timer" : "Start focus timer"}
                    className="p-0.5 rounded text-[#a55f78] hover:text-ink cursor-pointer"
                  >
                    {timerRunning ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTimerRunning(false);
                      setTimerSeconds(customTimerMins * 60);
                    }}
                    title={`Reset to ${customTimerMins}m`}
                    className="p-0.5 rounded text-muted hover:text-ink cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTimerConfig((p) => !p)}
                    className="px-1.5 py-0.5 rounded bg-white border border-line text-[10px] font-bold text-muted hover:text-ink cursor-pointer"
                  >
                    Set Time
                  </button>

                  {showTimerConfig && (
                    <div className="absolute right-0 top-full mt-2 z-50 w-64 p-3.5 rounded-2xl bg-white border border-line shadow-xl space-y-3 text-ink">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#a55f78]">
                          Custom Flow Timer
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowTimerConfig(false)}
                          className="text-muted hover:text-ink cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-5 gap-1">
                        {[5, 10, 15, 25, 45].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => applyCustomTimerMinutes(preset)}
                            className={`py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                              customTimerMins === preset
                                ? "bg-[#a55f78] text-white border-[#a55f78]"
                                : "bg-[#fcf9fa] text-muted border-line hover:text-ink"
                            }`}
                          >
                            {preset}m
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={1}
                          max={240}
                          value={customMinInput}
                          onChange={(e) => setCustomMinInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              applyCustomTimerMinutes(Number(customMinInput));
                            }
                          }}
                          placeholder="Minutes (1–240)"
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#fcf9fa] border border-line text-[12px] font-bold text-ink outline-none focus:border-[#d990a8]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            applyCustomTimerMinutes(Number(customMinInput))
                          }
                          className="px-3 py-1.5 rounded-lg bg-[#d990a8] text-white text-[11px] font-bold cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 bg-[#fcf9fa] border border-line rounded-xl px-3 py-1 focus-within:border-[#d990a8]">
                  <CalendarIcon className="w-3.5 h-3.5 text-[#a55f78]" />
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => {
                      setEntryDate(e.target.value);
                      triggerAutosave(
                        generatePayload(title, content, tags),
                        false,
                      );
                    }}
                    required
                    aria-label="Journal entry date"
                    className="bg-transparent outline-none text-[12px] font-bold text-ink cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Quick Templates Bar + "Browse All 54 Templates" Button + Deep Prompt Generator */}


            <div className="mb-4 p-3 rounded-2xl bg-[#fcf9fa] border border-line flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted mr-1">
                  Quick Templates:
                </span>
                {JOURNAL_TEMPLATES.slice(0, 5).map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-line hover:border-[#d990a8] text-[11px] font-bold text-ink hover:text-[#a55f78] transition-all cursor-pointer"
                  >
                    {tpl.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(true)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#fff0f3] border border-[#f4c2c2] text-[#a55f78] text-[11px] font-extrabold hover:brightness-95 transition-all cursor-pointer"
                >
                  <BookMarked className="w-3 h-3" />
                  <span>All 54 Templates →</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleInsertSoulPrompt}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-line hover:border-[#d990a8] text-[#a55f78] text-[11px] font-bold transition-all cursor-pointer"
              >
                <Wand2 className="w-3 h-3 text-[#d990a8]" />
                <span>Shuffle Deep Prompt</span>
              </button>
            </div>

            {/* Context Holistic Stamps: Mood Aura, Cycle Season, Weather & Energy */}


            <div className="mb-4 p-3.5 rounded-2xl bg-[#fcf9fa] border border-line space-y-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted w-24 shrink-0">
                  Mood Aura:
                </span>
                {MOOD_AURAS.map((aura) => {
                  const isSelected = activeMoodTag === aura.tag;
                  return (
                    <button
                      key={aura.id}
                      type="button"
                      onClick={() => togglePrefixTag("mood", aura.tag)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#a55f78] text-white border-[#a55f78]"
                          : "bg-white text-muted border-line hover:text-ink"
                      }`}
                    >
                      <span>{aura.emoji}</span>
                      <span>{aura.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line/60">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted mr-1">
                    Cycle Season:
                  </span>
                  {CYCLE_SEASONS.map((s) => {
                    const isSelected = activePhaseTag === s.tag;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => togglePrefixTag("phase", s.tag)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#a55f78] text-white border-[#a55f78]"
                            : "bg-white text-muted border-line hover:text-ink"
                        }`}
                      >
                        <span>{s.emoji}</span>
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {WEATHER_STAMPS.map((w) => {
                    const isSelected = activeWeatherTag === w.tag;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => togglePrefixTag("weather", w.tag)}
                        title={w.label}
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#a55f78] text-white border-[#a55f78]"
                            : "bg-white text-muted border-line hover:text-ink"
                        }`}
                      >
                        {w.emoji} {w.label}
                      </button>
                    );
                  })}

                  {ENERGY_LEVELS.map((en) => {
                    const isSelected = activeEnergyTag === en.tag;
                    return (
                      <button
                        key={en.id}
                        type="button"
                        onClick={() => togglePrefixTag("energy", en.tag)}
                        className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#a55f78] text-white border-[#a55f78]"
                            : "bg-white text-muted border-line hover:text-ink"
                        }`}
                      >
                        {en.emoji} {en.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Editorial Title Input */}


            <div className="mb-4">
              <input
                type="text"
                spellCheck={false}
                placeholder="Give your reflection an expressive title..."
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  triggerAutosave(
                    generatePayload(e.target.value, content, tags),
                    false,
                  );
                }}
                className="w-full px-4 py-3.5 bg-[#fcf9fa] border border-line rounded-2xl text-[18px] sm:text-[21px] font-extrabold text-ink placeholder:text-muted/55 outline-none focus:bg-white focus:border-[#d990a8] transition-colors tracking-tight"
              />
            </div>

            {/*Stationery Rich Text Editor */}


            <div className="mb-5">
              <RichTextEditor
                value={content}
                editorSyncKey={editorSyncKey}
                onChange={(html) => {
                  setContent(html);
                  triggerAutosave(generatePayload(title, html, tags), false);
                }}
                placeholder="Begin writing freely... Choose from 6 paper canvases above, browse 54 templates, or tap Dictate to speak your thoughts."
                paperStyle={paperStyle}
                onPaperStyleChange={setPaperStyle}
                fontFamilyId={fontFamilyId}
                onFontFamilyChange={setFontFamilyId}
                isZenMode={isZenMode}
                onToggleZenMode={() => setIsZenMode((p) => !p)}
                onOpenTemplateModal={() => setShowTemplateModal(true)}
              />
            </div>

            {/* Refined Tag Studio */}


            <div className="mb-6 p-4 rounded-2xl bg-[#fcf9fa] border border-line">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#a55f78]" />
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    Collection Tags (Press Enter to add)
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {SUGGESTED_JOURNAL_TAGS.map((preset) => {
                    const active = tags.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() =>
                          active ? handleRemoveTag(preset) : addTagValue(preset)
                        }
                        className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                          active
                            ? "bg-[#a55f78] text-white border-[#a55f78]"
                            : "bg-white text-muted border-line hover:border-[#d990a8] hover:text-[#a55f78]"
                        }`}
                      >
                        +{preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              {tags.filter(
                (t) =>
                  !t.startsWith("mood:") &&
                  !t.startsWith("weather:") &&
                  !t.startsWith("phase:") &&
                  !t.startsWith("energy:"),
              ).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags
                    .filter(
                      (t) =>
                        !t.startsWith("mood:") &&
                        !t.startsWith("weather:") &&
                        !t.startsWith("phase:") &&
                        !t.startsWith("energy:"),
                    )
                    .map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 text-[11px] bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2] px-3 py-1 rounded-full font-bold"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-[#a55f78] hover:text-red-500 transition-colors cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              )}

              <input
                type="text"
                placeholder="Add custom tag (e.g., healing, therapy, poetry)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full p-2.5 border border-line rounded-xl text-[12px] bg-white outline-none focus:border-[#d990a8] transition-colors"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="sm:flex-1 py-3.5 bg-[#fcf9fa] border border-line text-muted hover:text-ink font-bold text-[13px] rounded-xl transition-all active:scale-[0.99] cursor-pointer"
              >
                Discard / Close
              </button>
              <button
                type="submit"
                className="sm:flex-[2.4] flex items-center justify-center gap-2 py-3.5 bg-[#d990a8] text-white font-bold text-[13.5px] rounded-xl hover:brightness-95 transition-all shadow-[0_6px_20px_-6px_rgba(217,144,168,0.65)] active:scale-[0.99] cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>
                  {editingId ? "Update Journal Entry" : "Save to Sanctuary"}
                </span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          {/* 4. ARCHIVE COMMAND BAR */}


          <div className="bg-white border border-line rounded-2xl p-4 shadow-soft mb-6 space-y-3.5">
            <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="Search entries by title, keywords, feelings, or #tag..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 border border-line rounded-xl text-[13px] bg-[#fcf9fa] outline-none focus:bg-white focus:border-[#d990a8] transition-colors"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>


              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOnlyStarred((p) => !p)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold border transition-all cursor-pointer ${
                    onlyStarred
                      ? "bg-[#fff0f3] text-[#a55f78] border-[#f4c2c2]"
                      : "bg-[#fcf9fa] text-muted border-line hover:text-ink"
                  }`}
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      onlyStarred ? "fill-[#d990a8] text-[#d990a8]" : ""
                    }`}
                  />
                  <span>Starred</span>
                </button>

                <div className="flex items-center gap-1.5 bg-[#fcf9fa] border border-line rounded-xl px-3 py-2 text-[12px] font-bold text-ink">
                  <FileText className="w-3.5 h-3.5 text-[#a55f78]" />
                  <select
                    aria-label="Filter by Length"
                    value={lengthFilter}
                    onChange={(e) =>
                      setLengthFilter(
                        e.target.value as "all" | "short" | "medium" | "long",
                      )
                    }
                    className="bg-transparent border-0 outline-none text-[12px] font-bold text-ink cursor-pointer"
                  >
                    <option value="all">Any Length</option>
                    <option value="short">Quick Notes (Under 100w)</option>
                    <option value="medium">Standard (100–300w)</option>
                    <option value="long">Deep Dives (300w+)</option>
                  </select>
                </div>


                {availableMonths.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-[#fcf9fa] border border-line rounded-xl px-3 py-2 text-[12px] font-bold text-ink">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#a55f78]" />
                    <select
                      aria-label="Filter by Month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="bg-transparent border-0 outline-none text-[12px] font-bold text-ink cursor-pointer"
                    >
                      <option value="all">All Dates</option>
                      {availableMonths.map((m) => (
                        <option key={m} value={m}>
                          {format(parseISO(`${m}-01`), "MMMM yyyy")}
                        </option>
                      ))}
                    </select>
                  </div>
                )}



                <div className="flex items-center gap-1.5 bg-[#fcf9fa] border border-line rounded-xl px-3 py-2 text-[12px] font-bold text-ink">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#a55f78]" />
                  <select
                    aria-label="Sort Journal Entries"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="bg-transparent border-0 outline-none text-[12px] font-bold text-ink cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="longest">Longest Reads</option>
                    <option value="shortest">Shortest First</option>
                    <option value="alphabetical">Title (A–Z)</option>
                  </select>
                </div>

                <div className="inline-flex bg-[#fcf9fa] border border-line rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("timeline")}
                    title="Editorial Timeline View"
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === "timeline"
                        ? "bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2]"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("bento")}
                    title="2-Column Magazine Grid"
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === "bento"
                        ? "bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2]"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("gallery")}
                    title="3-Column Moodboard Gallery"
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === "gallery"
                        ? "bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2]"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("compact")}
                    title="Compact Index List"
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === "compact"
                        ? "bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2]"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    <Rows3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {allExistingTags.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5">
                <span className="text-[11px] font-bold text-muted shrink-0 mr-1">
                  Topics:
                </span>
                {allExistingTags.map((t) => {
                  const isSelected =
                    searchTerm.toLowerCase() === t.toLowerCase();
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSearchTerm(isSelected ? "" : t)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#a55f78] text-white border-[#a55f78]"
                          : "bg-[#fcf9fa] text-muted border-line hover:border-[#d990a8] hover:text-[#a55f78]"
                      }`}
                    >
                      #{t}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. JOURNAL ARCHIVE COLLECTION */}


          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-36 bg-white border border-line rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : processedNotes.length > 0 ? (
            <div
              className={
                viewMode === "bento"
                  ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                  : viewMode === "gallery"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    : viewMode === "compact"
                      ? "space-y-2"
                      : "space-y-4"
              }
            >

              {processedNotes.map((note) => {
                const parsedDate = parseISO(note.entry_date);
                const isExpanded = Boolean(expandedNoteIds[note.id]);
                const words = getWordCount(note.content || "");
                const readMins = getReadingTimeMinutes(words);
                const isLongNote =
                  stripHtmlToText(note.content || "").length > 260;
                const isStarred = Boolean(starredIds[note.id]);
                const isPinned = Boolean(pinnedIds[note.id]);

                const moodTag = Array.isArray(note.tags)
                  ? note.tags.find((t: string) => t.startsWith("mood:"))
                  : null;
                const weatherTag = Array.isArray(note.tags)
                  ? note.tags.find((t: string) => t.startsWith("weather:"))
                  : null;
                const phaseTag = Array.isArray(note.tags)
                  ? note.tags.find((t: string) => t.startsWith("phase:"))
                  : null;

                const moodObj = MOOD_AURAS.find((m) => m.tag === moodTag);
                const weatherObj = WEATHER_STAMPS.find(
                  (w) => w.tag === weatherTag,
                );
                const phaseObj = CYCLE_SEASONS.find((p) => p.tag === phaseTag);

                const displayTags = Array.isArray(note.tags)
                  ? note.tags.filter(
                      (t: string) =>
                        !t.startsWith("mood:") &&
                        !t.startsWith("weather:") &&
                        !t.startsWith("phase:") &&
                        !t.startsWith("energy:"),
                    )

                  : [];

                if (viewMode === "compact") {
                  return (
                    <div
                      key={note.id}
                      className="bg-white border border-line hover:border-[#d990a8] rounded-xl px-4 py-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => togglePinEntry(note)}
                          title="Pin to top"
                          className="text-muted hover:text-[#a55f78] cursor-pointer shrink-0"
                        >
                          <Pin
                            className={`w-3.5 h-3.5 ${
                              isPinned ? "fill-[#a55f78] text-[#a55f78]" : ""
                            }`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStarEntry(note)}
                          aria-label="Star entry"
                          className="text-muted hover:text-[#d990a8] cursor-pointer shrink-0"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              isStarred ? "fill-[#d990a8] text-[#d990a8]" : ""
                            }`}
                          />
                        </button>
                        <span className="text-[11.5px] font-bold text-[#a55f78] tabular-nums shrink-0 w-24">
                          {format(parsedDate, "MMM dd, yyyy")}
                        </span>
                        <button
                          type="button"
                          onClick={() => setReadingNote(note)}
                          className="text-[14px] font-bold text-ink hover:text-[#a55f78] truncate text-left cursor-pointer"
                        >
                          {note.title}
                        </button>
                        {moodObj && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fcf9fa] border border-line text-muted shrink-0">
                            {moodObj.emoji} {moodObj.label}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-semibold text-muted tabular-nums">
                          {words}w • {readMins}m
                        </span>
                        <button
                          type="button"
                          onClick={() => setReadingNote(note)}
                          className="px-2.5 py-1 rounded-lg bg-[#fcf9fa] border border-line text-[11px] font-bold text-muted hover:text-ink cursor-pointer"
                        >
                          Read
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditor(note)}
                          className="px-2.5 py-1 rounded-lg bg-[#fcf9fa] border border-line text-[11px] font-bold text-[#a55f78] cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={note.id}
                    className={`bg-white border rounded-2xl p-5 sm:p-6 shadow-soft hover:border-[#d990a8]/70 hover:shadow-[0_10px_32px_-14px_rgba(165,95,120,0.16)] transition-all flex flex-col justify-between group ${
                      isPinned ? "border-[#d990a8]" : "border-line"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-3.5">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-[#fff0f3] border border-[#f4c2c2] flex flex-col items-center justify-center shrink-0">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#a55f78] leading-none">
                              {format(parsedDate, "MMM")}
                            </span>
                            <span className="text-[16px] font-extrabold text-ink leading-tight mt-0.5 tabular-nums">
                              {format(parsedDate, "dd")}
                            </span>
                          </div>


                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {isPinned && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2]">
                                  Pinned
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => setReadingNote(note)}
                                className="text-[16px] sm:text-[17px] font-extrabold text-ink hover:text-[#a55f78] tracking-tight truncate text-left cursor-pointer transition-colors"
                              >
                                {note.title}
                              </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-muted font-medium mt-0.5 tabular-nums">
                              <span className="text-[#a55f78] font-semibold">
                                {format(parsedDate, "EEEE, MMMM d, yyyy")}
                              </span>
                              <span>•</span>
                              <span>{words} words</span>
                              <span>•</span>
                              <span>~{readMins} min read</span>
                            </div>


                            {(moodObj || weatherObj || phaseObj) && (
                              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                {moodObj && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fcf9fa] border border-line text-muted">
                                    <span>{moodObj.emoji}</span>
                                    <span>{moodObj.label}</span>
                                  </span>
                                )}
                                {phaseObj && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fcf9fa] border border-line text-muted">
                                    <span>{phaseObj.emoji}</span>
                                    <span>{phaseObj.label}</span>
                                  </span>
                                )}
                                {weatherObj && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fcf9fa] border border-line text-muted">
                                    <span>{weatherObj.emoji}</span>
                                    <span>{weatherObj.label}</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>


                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => togglePinEntry(note)}
                            title={isPinned ? "Unpin entry" : "Pin to top"}
                            className="p-2 rounded-lg bg-[#fcf9fa] border border-line text-muted hover:text-[#a55f78] transition-colors cursor-pointer"
                          >
                            <Pin
                              className={`w-3.5 h-3.5 ${
                                isPinned ? "fill-[#a55f78] text-[#a55f78]" : ""
                              }`}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleStarEntry(note)}
                            title={
                              isStarred ? "Remove star" : "Star reflection"
                            }
                            className="p-2 rounded-lg bg-[#fcf9fa] border border-line text-muted hover:text-[#d990a8] transition-colors cursor-pointer"
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                isStarred ? "fill-[#d990a8] text-[#d990a8]" : ""
                              }`}
                            />

                          </button>
                          <button
                            type="button"
                            onClick={() => setReadingNote(note)}
                            title="Open in Sanctuary Reader"
                            className="p-2 rounded-lg bg-[#fcf9fa] border border-line text-muted hover:text-ink transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditor(note)}
                            className="inline-flex items-center gap-1 text-[11.5px] text-ink hover:text-[#a55f78] hover:border-[#d990a8] font-bold bg-[#fcf9fa] px-2.5 py-1.5 rounded-lg border border-line transition-colors cursor-pointer"
                          >
                            <PenLine className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(note.id)}
                            aria-label="Delete entry"
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 font-bold bg-[#fcf9fa] p-2 rounded-lg border border-line hover:border-red-200 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>


                      <div
                        dangerouslySetInnerHTML={{ __html: note.content }}
                        className={`text-[14px] text-muted leading-relaxed mb-3 [&_a]:text-[#d990a8] [&_a]:underline [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_blockquote]:border-l-3 [&_blockquote]:border-[#d990a8] [&_blockquote]:pl-3 [&_blockquote]:italic ${
                          !isExpanded ? "line-clamp-3" : ""
                        }`}
                      />

                      {isLongNote && (
                        <div className="flex items-center gap-3 mb-3">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedNoteIds((prev) => ({
                                ...prev,
                                [note.id]: !prev[note.id],
                              }))
                            }
                            className="text-[12px] font-bold text-[#a55f78] hover:underline cursor-pointer"
                          >
                            {isExpanded ? "Collapse preview" : "Expand inline"}
                          </button>
                          <span className="text-muted text-xs">•</span>
                          <button
                            type="button"
                            onClick={() => setReadingNote(note)}
                            className="text-[12px] font-bold text-muted hover:text-ink cursor-pointer"
                          >
                            Open Sanctuary Reader →
                          </button>
                        </div>
                      )}
                    </div>


                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-line/60">
                      <div className="flex flex-wrap gap-1.5">
                        {displayTags.length > 0 ? (
                          displayTags.map((tag: string) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setSearchTerm(tag)}
                              className="text-[11px] font-bold bg-[#fcf9fa] hover:bg-[#fff0f3] text-muted hover:text-[#a55f78] px-2.5 py-0.5 rounded-full border border-line hover:border-[#f4c2c2] transition-colors cursor-pointer"
                            >
                              #{tag}
                            </button>
                          ))
                        ) : (
                          <span className="text-[11px] text-muted/60">
                            Private entry
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyEntry(note)}
                          title="Copy text"
                          className="p-1.5 rounded-lg text-muted hover:text-ink cursor-pointer"
                        >
                          {copiedId === note.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportEntryMarkdown(note)}
                          title="Export as Markdown (.md)"
                          className="p-1.5 rounded-lg text-muted hover:text-ink cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>


          ) : (


            <div className="text-center py-16 px-6 bg-white border border-line rounded-3xl shadow-soft">
              <div className="w-12 h-12 rounded-2xl bg-[#fff0f3] border border-[#f4c2c2] text-[#a55f78] flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-[16px] font-extrabold text-ink mb-1">
                {searchTerm ||
                onlyStarred ||
                selectedMonth !== "all" ||
                selectedAuraFilter !== "all"
                  ? "No matching reflections found"
                  : "Your literary sanctuary awaits"}
              </h3>
              <p className="text-[13px] text-muted max-w-[380px] mx-auto mb-5">
                {searchTerm ||
                onlyStarred ||
                selectedMonth !== "all" ||
                selectedAuraFilter !== "all"
                  ? "Try clearing your active filters or searching for a different keyword."
                  : "Choose from 54 guided templates, shuffle a deep prompt, or write freely on 6 stationery canvases."}
              </p>
              <div className="flex items-center justify-center gap-2.5">
                {(searchTerm ||
                  onlyStarred ||
                  selectedMonth !== "all" ||
                  selectedAuraFilter !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setOnlyStarred(false);
                      setSelectedMonth("all");
                      setSelectedAuraFilter("all");
                      setLengthFilter("all");
                    }}
                    className="px-4 py-2 rounded-xl bg-[#fff0f3] border border-[#f4c2c2] text-[#a55f78] text-[12px] font-bold cursor-pointer"
                  >
                    Reset Archive Filters
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#d990a8] text-white text-[12px] font-bold cursor-pointer"
                >
                  Explore 54 Writing Templates
                </button>
              </div>
            </div>
          )}
        </>
      )}


      {/* 6. 54-TEMPLATE LIBRARY MODAL */}


      {showTemplateModal && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 sm:p-6">
          <div
            onClick={() => setShowTemplateModal(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-xs animate-in fade-in duration-200"
          />
          <div className="relative bg-white border border-line rounded-3xl max-w-[980px] w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 text-ink">
            <div className="p-5 sm:p-6 border-b border-line flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#a55f78] mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#d990a8]" />
                  <span>54 Curated Journaling Frameworks</span>
                </div>
                <h2 className="text-[20px] sm:text-[24px] font-extrabold text-ink tracking-tight">
                  Sanctuary Template Library
                </h2>
                <p className="text-[12.5px] text-muted mt-0.5">
                  Select any template to pre-fill your reflection with guided
                  prompts and structure.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="w-9 h-9 rounded-full bg-[#fcf9fa] border border-line flex items-center justify-center text-muted hover:text-ink cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>


            <div className="px-5 sm:px-6 py-3.5 bg-[#fcf9fa] border-b border-line space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  placeholder="Search 54 templates (e.g., luteal, anxiety, gratitude, unsent letter, CBT, dream)..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-line rounded-xl text-[12.5px] text-ink outline-none focus:border-[#d990a8]"
                />
              </div>


              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {(
                  [
                    "All",
                    "Gratitude & Daily",
                    "Cycle & Somatic",
                    "Emotional & Shadow",
                    "CBT & Clarity",
                    "Goals & Vision",
                    "Letters & Creative",
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setTemplateCategory(cat)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 border transition-all cursor-pointer ${
                      templateCategory === cat
                        ? "bg-[#a55f78] text-white border-[#a55f78]"
                        : "bg-white text-muted border-line hover:text-ink"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>


            <div className="p-5 sm:p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="text-left p-4 rounded-2xl bg-[#fcf9fa] border border-line hover:border-[#d990a8] hover:bg-white transition-all flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#a55f78]">
                        {tpl.category}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2]">
                        #{tpl.tag}
                      </span>
                    </div>
                    <h4 className="text-[14px] font-extrabold text-ink group-hover:text-[#a55f78] transition-colors mb-1">
                      {tpl.label} — {tpl.title}
                    </h4>
                    <p className="text-[11.5px] text-muted leading-relaxed">
                      {tpl.subtitle}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-line/60 text-[11px] font-bold text-[#a55f78] flex items-center justify-between">
                    <span>Use Template</span>
                    <span>→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7.BOOK-STYLE SANCTUARY READER MODAL */}


      {readingNote && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6">
          <div
            onClick={() => setReadingNote(null)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-xs animate-in fade-in duration-200"
          />
          <div className="relative bg-white border border-line rounded-3xl max-w-[760px] w-full max-h-[86vh] overflow-y-auto p-6 sm:p-10 shadow-2xl animate-in zoom-in-95 duration-200 text-ink">
            <div className="flex items-start justify-between gap-4 pb-5 mb-6 border-b border-line">
              <div>
                <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#a55f78] mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#d990a8]" />
                  <span>
                    {format(
                      parseISO(readingNote.entry_date),
                      "EEEE, MMMM d, yyyy",
                    )}
                  </span>
                  <span>•</span>
                  <span>
                    {getWordCount(readingNote.content || "")} words (~
                    {getReadingTimeMinutes(
                      getWordCount(readingNote.content || ""),
                    )}{" "}
                    min read)
                  </span>
                </div>
                <h2 className="text-[22px] sm:text-[26px] font-extrabold text-ink tracking-tight">
                  {readingNote.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setReadingNote(null)}
                className="w-9 h-9 rounded-full bg-[#fcf9fa] border border-line flex items-center justify-center text-muted hover:text-ink cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              dangerouslySetInnerHTML={{ __html: readingNote.content }}
              style={{
                fontFamily: "'Georgia', 'Cambria', serif",
                fontSize: "18px",
                lineHeight: "1.85",
              }}
              className="text-ink space-y-4 mb-8 [&_h2]:text-[22px] [&_h2]:font-bold [&_h3]:text-[18px] [&_h3]:font-bold [&_blockquote]:border-l-4 [&_blockquote]:border-[#d990a8] [&_blockquote]:pl-4 [&_blockquote]:italic [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_a]:text-[#d990a8] [&_a]:underline"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-line">
              <div className="flex flex-wrap gap-1.5">
                {(readingNote.tags || [])
                  .filter(
                    (t: string) =>
                      !t.startsWith("mood:") &&
                      !t.startsWith("weather:") &&
                      !t.startsWith("phase:") &&
                      !t.startsWith("energy:"),
                  )
                  .map((tag: string) => (
                    <span
                      key={tag}
                      className="text-[11px] font-bold bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2] px-3 py-1 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
              </div>


              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#fcf9fa] border border-line text-[12px] font-bold text-muted hover:text-ink cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportEntryMarkdown(readingNote)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#fcf9fa] border border-line text-[12px] font-bold text-muted hover:text-ink cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export .MD</span>
                </button>
                <button
                  type="button"
                  onClick={() => openEditor(readingNote)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#d990a8] text-white text-[12px] font-bold hover:brightness-95 cursor-pointer"
                >

                  <PenLine className="w-3.5 h-3.5" />
                  <span>Edit in Studio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
