"use client";

import {
  useOfflineResilience,
  SaveStatusBadge,
  NetworkStatusBanner,
} from "@/components/NetworkResilience";
import { getLocalDraft } from "@/utils/offlineSync";
import { buildSyncTimestamps } from "@/utils/offlineTimestamps";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { format, subDays, addDays, parseISO } from "date-fns";
import { createClient } from "@/utils/supabase/client";
import {
  ChevronDown,
  ChevronUp,
  Check,
  Plus,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Droplet,
  Smile,
  Activity,
  Wind,
  Coffee,
  Heart,
  AlignLeft,
  CheckCircle2,
  Calendar as CalendarIcon,
  Sparkles,
  Lock,
  Palette,
  Search,
  X,
  Bold,
  Italic,
  Underline,
  Link as LinkIcon,
  List,
  Type,
  Highlighter,
  RemoveFormatting,
} from "lucide-react";

const LOCAL_NOTES_KEY = "moonday_partner_notes";

function saveLocalPartnerNote(
  userId: string,
  dateStr: string,
  content: string,
) {
  if (typeof window === "undefined" || !userId || !dateStr) return;
  try {
    const key = `${LOCAL_NOTES_KEY}_${userId}`;
    const existing = JSON.parse(localStorage.getItem(key) || "{}");
    if (content.trim()) {
      existing[dateStr] = content.trim();
    } else {
      delete existing[dateStr];
    }
    localStorage.setItem(key, JSON.stringify(existing));
  } catch {

    // Ignore storage errors

  }
}


function getLocalPartnerNote(userId: string, dateStr: string): string {
  if (typeof window === "undefined" || !userId || !dateStr) return "";
  try {
    const key = `${LOCAL_NOTES_KEY}_${userId}`;
    const existing = JSON.parse(localStorage.getItem(key) || "{}");
    return existing[dateStr] || "";
  } catch {
    return "";
  }
}


const COLORS = [
  { name: "Barn Red", hex: "#7C1D2D" },
  { name: "Nationals Red", hex: "#AB0003" },
  { name: "Oklahoma Crimson", hex: "#841617" },
  { name: "Tea Rose", hex: "#F4C2C2" },
  { name: "Rose Wood", hex: "#65000B" },
  { name: "Crimson", hex: "#DC143C" },
  { name: "Ruby Red", hex: "#9B111E" },
  { name: "Blood Red", hex: "#660000" },
  { name: "Burgundy", hex: "#800020" },
  { name: "Maroon", hex: "#800000" },
  { name: "Wine", hex: "#722F37" },
  { name: "Oxblood", hex: "#4A0000" },
  { name: "Claret", hex: "#7F1734" },
  { name: "Garnet", hex: "#733635" },
  { name: "Dark Cherry", hex: "#5D001E" },
  { name: "Brick Red", hex: "#8B3A3A" },
  { name: "Rust Red", hex: "#B7410E" },
  { name: "Chestnut", hex: "#954535" },
  { name: "Mahogany", hex: "#C04000" },
  { name: "Sienna", hex: "#A0522D" },
  { name: "Burnt Sienna", hex: "#E97451" },
  { name: "Cinnamon", hex: "#D2691E" },
  { name: "Copper", hex: "#B87333" },
  { name: "Terracotta", hex: "#E2725B" },
  { name: "Firebrick", hex: "#B22222" },
  { name: "Cardinal Red", hex: "#C41E3A" },
  { name: "Indian Red", hex: "#CD5C5C" },
  { name: "Rose Red", hex: "#C21E56" },
  { name: "Raspberry", hex: "#D21F3C" },
  { name: "Berry", hex: "#990F4B" },
  { name: "Mulberry", hex: "#70193D" },
  { name: "Claret Rose", hex: "#A23B55" },
  { name: "Garnet Rose", hex: "#9E4244" },
  { name: "Dusty Rose", hex: "#DCAE96" },
  { name: "Dusty Pink", hex: "#D8A7A7" },
  { name: "Light Pink", hex: "#FFB6C1" },
  { name: "Pale Pink", hex: "#FADADD" },
  { name: "Blush Pink", hex: "#DE5D83" },
  { name: "Salmon Pink", hex: "#FF9999" },
  { name: "Coral Pink", hex: "#F88379" },
  { name: "Rose Pink", hex: "#F7A8B8" },
  { name: "Pink Beige", hex: "#D8A39D" },
  { name: "Light Coral", hex: "#F08080" },
  { name: "Rose Quartz", hex: "#F7CAC9" },
  { name: "Muted Rose", hex: "#C08081" },
  { name: "Plum", hex: "#673147" },
  { name: "Aubergine", hex: "#580F41" },
  { name: "Black Cherry", hex: "#3B000B" },
  { name: "Cocoa", hex: "#875F5A" },
  { name: "Coffee Brown", hex: "#6F4E37" },
  { name: "Brown Red", hex: "#8A3324" },
  { name: "Mauve", hex: "#B784A7" },
  { name: "Deep Wine", hex: "#4B001F" },
  { name: "Smoky Rose", hex: "#A56B73" },
  { name: "Dark Raspberry", hex: "#872657" },
];


const MOODS = [
  "Normal",
  "Calm",
  "Happy",
  "Sad",
  "Confused",
  "Anxious",
  "Irritable",
  "Hyperactive",
  "Tired",
  "Emotional",
  "Crying",
  "Peaceful",
  "Content",
  "Excited",
  "Affectionate",
  "Playful",
  "Lonely",
  "Overwhelmed",
  "Stressed",
  "Angry",
  "Frustrated",
  "Restless",
  "Sensitive",
  "Tearful",
  "Hopeful",
  "Motivated",
  "Unmotivated",
  "Insecure",
  "Confident",
  "Numb",
  "Disappointed",
  "Grateful",
  "Relaxed",
  "Bored",
  "Joyful",
  "Proud",
  "Inspired",
  "Curious",
  "Homesick",
  "Rejected",
  "Panicky",
  "Tense",
  "Annoyed",
  "Resentful",
  "Impatient",
  "Indecisive",
  "Distracted",
  "Forgetful",
  "Drained",
  "Exhausted",
  "Guilty",
  "Embarrassed",
  "Vulnerable",
  "Frisky",
  "Flirty",
  "Sensual",
  "Optimistic",
  "Pessimistic",
  "Apathetic",
  "Nostalgic",
];


const SYMPTOMS = {
  "Menstrual/Pelvic Pain": [
    "Cramps",
    "Mild cramps",
    "Severe cramps",
    "Abdominal pain",
    "Pelvic pain",
    "Lower-back pain",
    "Backache",
    "Heavy-feeling pelvis",
    "Painful bowel movements",
    "Ovary pain",
    "Vulvar pain",
    "Uterine spasms",
    "Pelvic pressure",
  ],
  "General Pain": [
    "Headache",
    "Migraine",
    "Body aches",
    "Muscle pain",
    "Joint pain",
    "Tender breasts",
    "Breast swelling",
    "Neck pain",
    "Shoulder pain",
    "Leg cramps",
    "Joint stiffness",
  ],
  Digestive: [
    "Bloating",
    "Gas",
    "Nausea",
    "Vomiting",
    "Diarrhea",
    "Constipation",
    "Appetite change",
    "Increased appetite",
    "Reduced appetite",
    "Indigestion",
    "Heartburn",
    "Food aversion",
    "Stomach cramps",
    "Gurgling stomach",
  ],
  "Energy/Sleep": [
    "Fatigue",
    "Lethargy",
    "Low energy",
    "Weakness",
    "Sleepiness",
    "Insomnia",
    "Poor sleep",
    "Disrupted sleep",
    "Restless legs",
    "Frequent waking",
    "Vivid dreams",
    "Nightmares",
    "Difficulty falling asleep",
    "Oversleeping",
  ],
  Neurological: [
    "Dizziness",
    "Light-headedness",
    "Brain fog",
    "Difficulty concentrating",
    "Forgetfulness",
    "Sensitivity to light",
    "Sensitivity to sound",
    "Clumsiness",
    "Sluggishness",
    "Tingling",
    "Numbness",
  ],
  "Skin/Body": [
    "Acne",
    "Oily skin",
    "Dry skin",
    "Dry eyes",
    "Hot flashes",
    "Night sweats",
    "Sweating",
    "Chills",
    "Fever",
    "Water retention",
    "Puffy face",
    "Swollen fingers",
    "Swollen ankles",
    "Hair thinning",
    "Brittle nails",
    "Body odor changes",
  ],
  "Urinary/Vaginal": [
    "Vaginal itching",
    "Vaginal dryness",
    "Urinary discomfort",
    "Painful urination",
    "Urinary frequency",
    "Pain during sex",
    "Unusual discharge",
    "Strong odor",
  ],
  "Emotional & Mental": [
    "Mood swings",
    "Irritability",
    "Anxiety",
    "Sadness",
    "Tearfulness",
    "Feeling overwhelmed",
    "Paranoia",
    "Intrusive thoughts",
    "Rejection sensitive",
    "Apathy",
  ],
  "Immunity & Cold": [
    "Sore throat",
    "Runny nose",
    "Cough",
    "Congestion",
    "Sneezing",
    "Swollen lymph nodes",
  ],
};


const CRAVINGS = [
  "Sweet",
  "Chocolate",
  "Salty",
  "Spicy",
  "Sour",
  "Crunchy snacks",
  "Savory snacks",
  "Dairy",
  "Beverages",
  "Energy drinks",
  "Caffeinated drinks",
  "indulgent desserts",
  "warm soups",
  "light salads",
  "rich sauces",
  "baked goods",
  "Savory",
  "Fast food",
  "Comfort food",
  "Fruit",
  "Cold drinks",
  "Hot drinks",
  "Tea",
  "Coffee",
  "Carbs",
  "Ice cream",
  "Pastries",
  "Cheese",
  "Meat",
  "Fried food",
  "Vegetables",
  "Juice",
  "Water",
  "Crunchy",
  "Chewy",
  "Breads",
  "Pasta",
  "Chips",
  "Candy",
  "Noodles",
  "Hydra",
];


const DISCHARGE_TYPES = [
  "No discharge",
  "Creamy",
  "Watery",
  "Yellow-Bright",
  "Sticky",
  "Egg-white-like",
  "Spotting",
  "Unusual",
  "Clumpy white",
  "Gray",
  "Milky",
  "Clumpy",
  "Quick-drying",
  "Thick",
  "Lotion-like",
  "Clear",
  "Cloudy",
  "Yellowish",
  "Brownish",
  "Pinkish",
  "Blood-tinged",
  "Jelly-like",
  "Stretchy",
  "Dry",
];


const INTIMACY_ACTS = [
  "Didn't have sex",
  "Protected sex",
  "Unprotected sex",
  "Oral sex",
  "Anal sex",
  "Masturbation",
  "Sensual touch",
  "Sex toys",
  "Quickie",
  "Roleplay",
  "Mutual masturbation",
  "Erotic massage",
  "Foreplay",
  "Masssage",
  "Fingering",
  "Plam Padding",
  "Kissing",
  "Cuddling",
  "Fisting",
  "Sexual fantasy",
  "Dirty talk",
  "Erotic games",
  "Striptease",
  "Oral stimulation",
  "Erotic literature",
  "Intimate conversation",
  "Extended foreplay",
  "Trying to conceive",
  "Moonday sex",
  "Morning sex",
  "Night sex",
  "Shower sex",
];


const ACTIVITIES = [
  "Didn't exercise",
  "Yoga",
  "Gym",
  "Dance",
  "Football",
  "Vollyball",
  "Tennis",
  "Badminton",
  "Aerobics & dancing",
  "Swimming",
  "Team sports",
  "Running",
  "Cycling",
  "Walking",
  "Stretching",
  "Pilates",
  "Strength training",
  "Hiking",
  "Household activity",
  "Rest day",
  "Light movement",
  "Intense workout",
  "HIIT",
  "Martial arts",
  "Tennis/Racquet",
  "Meditation/Breathwork",
  "Physical therapy",
  "Jogging",
  "Elliptical",
  "Rowing",
  "Dance class",
  "Active commute",
  "Gardening",
];

const FONT_SIZES = [
  { label: "Very Tiny", size: "10px" },
  { label: "Tiny", size: "12px" },
  { label: "Small", size: "14px" },
  { label: "Medium", size: "16px" },
  { label: "Normal (Default)", size: "18px" },
  { label: "Large", size: "22px" },
  { label: "Extra Large", size: "28px" },
  { label: "Huge", size: "36px" },
];


const Accordion = ({
  title,
  subtitle,
  badge,
  icon: Icon,
  iconColor,
  isOpen,
  onToggle,
  children,
}: any) => (
  <div
    className={`rounded-2xl overflow-hidden transition-all duration-200 mb-4 border ${
      isOpen
        ? "bg-white border-[#d990a8]/70 shadow-[0_8px_30px_-12px_rgba(165,95,120,0.14)]"
        : "bg-white border-line shadow-soft hover:border-[#eadfe4]"
    }`}
  >

    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-5 py-4 sm:px-6 sm:py-[20px] bg-transparent hover:bg-slate-50 transition-colors text-left group cursor-pointer"
    >
      <div className="flex items-center gap-3.5 min-w-0 pr-3">
        {Icon && (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors border ${
              isOpen || badge
                ? "bg-[#fff0f3] border-[#f4c2c2]/70"
                : "bg-slate-50 border-line group-hover:bg-[#fff8fa]"
            }`}
          >
            <Icon className={`w-[18px] h-[18px] ${iconColor}`} />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] sm:text-[16px] font-bold text-ink tracking-tight">
              {title}
            </h3>
            {badge && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2] tabular-nums">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[12px] text-muted truncate mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>


      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
          isOpen
            ? "bg-[#fff0f3] text-[#a55f78]"
            : "bg-slate-50 text-muted group-hover:bg-slate-100"
        }`}
      >
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </div>
    </button>

    {isOpen && (
      <div className="px-5 pb-6 pt-2 sm:px-6 sm:pb-7 border-t border-line/70 bg-white animate-in fade-in duration-150">
        {children}
      </div>
    )}
  </div>
);


const Chip = ({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3.5 py-2 rounded-full text-[12px] font-bold transition-all duration-150 border select-none active:scale-[0.97] flex items-center gap-1.5 cursor-pointer ${
      selected
        ? "bg-[#a55f78] text-white border-[#a55f78] shadow-[0_3px_10px_-2px_rgba(165,95,120,0.4)]"
        : "bg-white text-[#66545f] border-line hover:border-[#d990a8] hover:bg-[#fff8fa]"
    }`}
  >
    {selected && (
      <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
    )}
    <span>{label}</span>
  </button>
);

/**
 * Rich Text Editor with Precise Dynamic Font Sizing (Highlights selection OR dictates upcoming text)
 */


const RichTextEditor = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
  });

  const [selectedFontSizeLabel, setSelectedFontSizeLabel] =
    useState("Normal (Default)");

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (value === "" || !editorRef.current.contains(document.activeElement)) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value]);

  const updateActiveStates = () => {
    if (typeof window === "undefined") return;
    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
    });
  };

  const executeCommand = (command: string, arg: string = "") => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    updateActiveStates();
  };

  const handleFontSizeSelect = (label: string, sizeValue: string) => {
    setSelectedFontSizeLabel(label);
    editorRef.current?.focus();

    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement("span");
      span.style.fontSize = sizeValue;
      try {
        span.appendChild(range.extractContents());
        range.insertNode(span);
        selection.removeAllRanges();
      } catch {
        document.execCommand("styleWithCSS", false, "true");
        document.execCommand("fontSize", false, "7");
        editorRef.current?.querySelectorAll('font[size="7"]').forEach((el) => {
          el.removeAttribute("size");
          (el as HTMLElement).style.fontSize = sizeValue;
        });
      }
    } else {
      const span = document.createElement("span");
      span.style.fontSize = sizeValue;
      span.innerHTML = "&#8203;";

      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.insertNode(span);
        range.setStart(span.firstChild!, 1);
        range.setEnd(span.firstChild!, 1);
        selection.removeAllRanges();
        selection.addRange(range);
      } else if (editorRef.current) {
        editorRef.current.appendChild(span);
      }
    }

    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    updateActiveStates();
  };

  const handleClearFormatting = () => {
    editorRef.current?.focus();
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
      document.execCommand("removeFormat", false);
    } else if (editorRef.current) {
      const plainText = editorRef.current.innerText;
      editorRef.current.innerHTML = plainText;
      setSelectedFontSizeLabel("Normal (Default)");
    }
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    updateActiveStates();
  };

  const handleColorChange = (
    command: "foreColor" | "hiliteColor",
    color: string,
  ) => {
    editorRef.current?.focus();
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement("span");
      if (command === "foreColor") {
        span.style.color = color;
      } else {
        span.style.backgroundColor = color;
      }
      try {
        span.appendChild(range.extractContents());
        range.insertNode(span);
        selection.removeAllRanges();
      } catch {
        document.execCommand("styleWithCSS", false, "true");
        document.execCommand(command, false, color);
      }
    } else {
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand(command, false, color);
    }

    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    updateActiveStates();
  };

  const handleInsertLink = (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    let url = linkUrl.trim();
    if (url) {
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`;
      }

      editorRef.current?.focus();
      const sel = window.getSelection();
      const selectedText =
        sel && !sel.isCollapsed && sel.toString().trim() ? sel.toString() : url;

      const linkHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer" title="Opens: ${url}" style="color: #2563eb; text-decoration: underline; cursor: pointer;">${selectedText}</a>`;
      document.execCommand("insertHTML", false, linkHTML);

      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
      updateActiveStates();
      setLinkUrl("");
      setShowLinkInput(false);
    }
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest("a");
    if (anchor && anchor.href) {
      e.preventDefault();
      window.open(anchor.href, "_blank", "noopener,noreferrer");
    }
  };

  const currentWordCount = useMemo(() => {
    if (!value) return 0;
    const plainText = value.replace(/<[^>]*>/g, " ").trim();
    return plainText ? plainText.split(/\s+/).length : 0;
  }, [value]);

  const currentCharacterCount = useMemo(() => {
    if (!value) return 0;
    return value.replace(/<[^>]*>/g, "").length;
  }, [value]);

  return (
    <div className="border border-line rounded-xl bg-white overflow-hidden shadow-2xs focus-within:border-[#d990a8] transition-colors flex flex-col">
      <div
        className="flex flex-wrap items-center gap-1.5 bg-[#fcf9fa] border-b border-line px-3 py-2 text-slate-700"
        onMouseDown={(e) => {
          if (
            (e.target as HTMLElement).tagName !== "INPUT" &&
            (e.target as HTMLElement).tagName !== "SELECT"
          ) {
            e.preventDefault();
          }
        }}
      >
        <button
          type="button"
          onClick={() => executeCommand("bold")}
          title="Bold"
          className={`p-1.5 rounded font-bold text-xs cursor-pointer transition-colors ${
            activeFormats.bold
              ? "bg-[#fff0f3] text-[#a55f78]"
              : "hover:bg-slate-200 text-slate-700"
          }`}
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("italic")}
          title="Italic"
          className={`p-1.5 rounded font-bold text-xs cursor-pointer transition-colors ${
            activeFormats.italic
              ? "bg-[#fff0f3] text-[#a55f78]"
              : "hover:bg-slate-200 text-slate-700"
          }`}
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("underline")}
          title="Underline"
          className={`p-1.5 rounded font-bold text-xs cursor-pointer transition-colors ${
            activeFormats.underline
              ? "bg-[#fff0f3] text-[#a55f78]"
              : "hover:bg-slate-200 text-slate-700"
          }`}
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-4 bg-line mx-0.5" />

        {/* Font Size Dropdown */}

        <div className="flex items-center gap-1 bg-white border border-line rounded px-2 py-1 text-xs font-semibold text-ink">
          <Type className="w-3 h-3 text-muted shrink-0" />
          <select
            aria-label="Font Size Selector"
            value={selectedFontSizeLabel}
            onChange={(e) => {
              const found = FONT_SIZES.find((f) => f.label === e.target.value);
              if (found) handleFontSizeSelect(found.label, found.size);
            }}
            className="bg-transparent border-0 outline-none text-xs cursor-pointer font-semibold text-ink pr-1"
          >
            {FONT_SIZES.map((f) => (
              <option key={f.size} value={f.label}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Formatting Button */}

        <button
          type="button"
          onClick={handleClearFormatting}
          title="Clear formatting (selection or whole paragraph)"
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1"
        >
          <RemoveFormatting className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-4 bg-line mx-0.5" />

        {/* Text Color Picker */}

        <div className="flex items-center gap-1 ml-0.5" title="Text Color">
          <input
            type="color"
            aria-label="Text Color"
            onInput={(e) =>
              handleColorChange(
                "foreColor",
                (e.target as HTMLInputElement).value,
              )
            }
            defaultValue="#1E171B"
            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
          />
        </div>

        {/* Highlight Color Picker */}

        <div className="flex items-center gap-1 ml-0.5" title="Highlight Color">
          <Highlighter className="w-3.5 h-3.5 text-muted" />
          <input
            type="color"
            aria-label="Highlight Color"
            onInput={(e) =>
              handleColorChange(
                "hiliteColor",
                (e.target as HTMLInputElement).value,
              )
            }
            defaultValue="#FFF0F3"
            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
          />
        </div>

        <span className="w-px h-4 bg-line mx-0.5" />

        <button
          type="button"
          onClick={() => setShowLinkInput((prev) => !prev)}
          title="Insert Link"
          className="p-1.5 rounded hover:bg-slate-200 font-bold text-xs cursor-pointer text-slate-700"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("insertUnorderedList")}
          title="Bullet List"
          className="p-1.5 rounded hover:bg-slate-200 font-bold text-xs cursor-pointer text-slate-700"
        >
          <List className="w-3.5 h-3.5" />
        </button>
      </div>

      {showLinkInput && (
        <div className="flex items-center gap-2 p-2.5 bg-slate-50 border-b border-line text-xs">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Paste URL (https://google.com)"
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
            Add Link
          </button>
          <button
            type="button"
            onClick={() => setShowLinkInput(false)}
            className="px-2.5 py-1.5 bg-slate-200 text-slate-700 rounded-lg font-bold text-xs cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Editable Content Area - spellCheck={false} removes red squiggly lines */}


      <div
        ref={editorRef}
        contentEditable
        spellCheck={false}
        onClick={handleEditorClick}
        onMouseUp={updateActiveStates}
        onKeyUp={updateActiveStates}
        onInput={(e) => {
          onChange(e.currentTarget.innerHTML);
          updateActiveStates();
        }}
        aria-label={placeholder}
        style={{ fontSize: "18px" }}
        className="w-full min-h-[120px] p-4 text-ink leading-relaxed outline-none overflow-y-auto resize-y [&_a]:text-blue-600 [&_a]:underline [&_a]:cursor-pointer hover:[&_a]:text-blue-800 [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5"
      />

      <div className="bg-[#fcf9fa] border-t border-line px-3.5 py-1.5 flex justify-end items-center text-[11px] font-medium text-muted tabular-nums select-none">
        <span>
          {currentWordCount} {currentWordCount === 1 ? "word" : "words"} •{" "}
          {currentCharacterCount} chars
        </span>
      </div>
    </div>
  );
};



export default function LogPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isExistingLog, setIsExistingLog] = useState(false);
  const [symptomSearch, setSymptomSearch] = useState("");

  const [activeUserId, setActiveUserId] = useState("local-user");
  const [currentRecordCreatedAt, setCurrentRecordCreatedAt] = useState<
    string | null
  >(null);
  const [currentRecordUpdatedAt, setCurrentRecordUpdatedAt] = useState<
    string | null
  >(null);
  const draftCreatedAtRef = useRef<string | null>(null);
  const userEditedRef = useRef(false);
  const partnerNoteTimerRef = useRef<NodeJS.Timeout | null>(null);


  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    period: true,
    moods: false,
    symptoms: false,
    cravings: false,
    discharge: false,
    intimacy: false,
    activity: false,
    notes: false,
  });

  const [selectedDate, setSelectedDate] = useState("");
  const [isPeriodStart, setIsPeriodStart] = useState(false);
  const [isPeriodEnd, setIsPeriodEnd] = useState(false);
  const [isSpotting, setIsSpotting] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState("");
  const [periodColor, setPeriodColor] = useState({ name: "", hex: "" });
  const [showCustomColor, setShowCustomColor] = useState(false);

  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [cravingText, setCravingText] = useState("");

  const [dischargeType, setDischargeType] = useState("");
  const [dischargeConsistency, setDischargeConsistency] = useState("");
  const [dischargeAmount, setDischargeAmount] = useState("");
  const [dischargeOdor, setDischargeOdor] = useState("");

  const [intimacyActs, setIntimacyActs] = useState<string[]>([]);
  const [libido, setLibido] = useState("");
  const [orgasm, setOrgasm] = useState<boolean | null>(null);

  const [activityActs, setActivityActs] = useState<string[]>([]);
  const [activityDuration, setActivityDuration] = useState("");
  const [activityIntensity, setActivityIntensity] = useState("");

  const [husbandNote, setHusbandNote] = useState("");
  const [whatYouNeed, setWhatYouNeed] = useState("");
  const [generalNote, setGeneralNote] = useState("");

  const syncPartnerNoteToDb = useCallback(
    async (dateStr: string, noteContent: string) => {
      if (!dateStr) return;
      const trimmed = noteContent.trim();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      saveLocalPartnerNote(user.id, dateStr, trimmed);

      const { data: userNotes } = await supabase
        .from("husband_notes")
        .select("*")
        .eq("user_id", user.id);

      const existingRow = (userNotes || []).find(
        (n: any) => (n.date || n.entry_date || n.log_date) === dateStr,
      );

      if (trimmed) {
        const timestamps = buildSyncTimestamps(existingRow);

        if (existingRow?.id) {
          await supabase
            .from("husband_notes")
            .update({
              content: trimmed,
              created_at: timestamps.created_at,
              updated_at: timestamps.updated_at,
            })
            .eq("id", existingRow.id);
        } else {
          const { error: errDate } = await supabase
            .from("husband_notes")
            .insert([
              {
                user_id: user.id,
                date: dateStr,
                content: trimmed,
                created_at: timestamps.created_at,
                updated_at: timestamps.updated_at,
              },
            ]);

          if (errDate) {
            await supabase.from("husband_notes").insert([
              {
                user_id: user.id,
                entry_date: dateStr,
                content: trimmed,
                created_at: timestamps.created_at,
                updated_at: timestamps.updated_at,
              },
            ]);
          }
        }
      } else if (existingRow?.id) {
        await supabase.from("husband_notes").delete().eq("id", existingRow.id);
      }
    },
    [supabase],
  );

  const applyRecordToState = useCallback((record: Record<string, any>) => {
    setIsPeriodStart(record.is_period_start || false);
    setIsPeriodEnd(record.is_period_end || false);
    setIsSpotting(record.is_spotting || false);
    setSelectedFlow(record.flow || "");
    setPeriodColor({
      name: record.period_color || "",
      hex: record.period_color_hex || "",
    });
    setSelectedMoods(record.mood ? record.mood.split(", ") : []);
    setSelectedSymptoms(
      Array.isArray(record.symptoms)
        ? record.symptoms
        : typeof record.symptoms === "string"
          ? record.symptoms.split(",").map((s: string) => s.trim())
          : [],
    );
    setCravingText(record.cravings || "");
    setDischargeType(record.discharge || "");
    setDischargeConsistency(record.discharge_consistency || "");
    setDischargeAmount(record.discharge_amount || "");
    setDischargeOdor(record.discharge_odor || "");
    setWhatYouNeed(record.what_you_need_note || "");
    setGeneralNote(record.note || "");
    if (typeof record.husband_note === "string") {
      setHusbandNote(record.husband_note);
    }
    if (record.created_at) {
      setCurrentRecordCreatedAt(record.created_at);
      draftCreatedAtRef.current = record.created_at;
    }
    if (record.updated_at) {
      setCurrentRecordUpdatedAt(record.updated_at);
    }
  }, []);


  const {
    isOnline,
    status,
    lastSavedAt,
    syncError,
    conflict,
    saveEntry,
    triggerAutosave,
    clearDraft,
    resolveKeepLocal,
    resolveKeepServer,
  } = useOfflineResilience({
    userId: activeUserId,
    date: selectedDate,
    table: "daily_logs",
    dateColumn: "log_date",
    conflictTarget: "user_id,log_date",
    initialServerUpdatedAt: currentRecordUpdatedAt,
    onServerRestore: (serverData) => {
      userEditedRef.current = false;
      applyRecordToState(serverData);
      setMessage("Server version restored.");
    },
  });


  const generatePayload = useCallback(() => {
    const timestamps = buildSyncTimestamps({
      created_at: currentRecordCreatedAt || draftCreatedAtRef.current,
      updated_at: currentRecordUpdatedAt,
    });

    if (!draftCreatedAtRef.current) {
      draftCreatedAtRef.current = timestamps.created_at;
    }

    return {
      is_period_start: isPeriodStart,
      is_period_end: isPeriodEnd,
      is_spotting: isSpotting,
      flow: selectedFlow || null,
      period_color: periodColor.name || null,
      period_color_hex: periodColor.hex || null,
      mood: selectedMoods.length > 0 ? selectedMoods.join(", ") : null,
      symptoms: selectedSymptoms,
      discharge: dischargeType || null,
      discharge_consistency: dischargeConsistency || null,
      discharge_amount: dischargeAmount || null,
      discharge_odor: dischargeOdor || null,
      cravings: cravingText || null,
      what_you_need_note: whatYouNeed || null,
      note: generalNote || null,
      created_at: timestamps.created_at,
      updated_at: timestamps.updated_at,
    };
  }, [
    isPeriodStart,
    isPeriodEnd,
    isSpotting,
    selectedFlow,
    periodColor,
    selectedMoods,
    selectedSymptoms,
    dischargeType,
    dischargeConsistency,
    dischargeAmount,
    dischargeOdor,
    cravingText,
    whatYouNeed,
    generalNote,
    currentRecordCreatedAt,
    currentRecordUpdatedAt,
  ]);

  useEffect(() => {
    if (!userEditedRef.current || !selectedDate) return;
    triggerAutosave(generatePayload(), true);
  }, [generatePayload, selectedDate, triggerAutosave]);

  const markEdited = () => {
    userEditedRef.current = true;
  };

  const handleHusbandNoteChange = (val: string) => {
    setHusbandNote(val);
    if (activeUserId && selectedDate) {
      saveLocalPartnerNote(activeUserId, selectedDate, val);
    }
    if (partnerNoteTimerRef.current) {
      clearTimeout(partnerNoteTimerRef.current);
    }
    partnerNoteTimerRef.current = setTimeout(() => {
      syncPartnerNoteToDb(selectedDate, val);
    }, 600);
  };

  const resetForm = () => {
    userEditedRef.current = false;
    setIsPeriodStart(false);
    setIsPeriodEnd(false);
    setIsSpotting(false);
    setSelectedFlow("");
    setPeriodColor({ name: "", hex: "" });
    setSelectedMoods([]);
    setSelectedSymptoms([]);
    setCravingText("");
    setDischargeType("");
    setDischargeConsistency("");
    setDischargeAmount("");
    setDischargeOdor("");
    setIntimacyActs([]);
    setLibido("");
    setOrgasm(null);
    setActivityActs([]);
    setActivityDuration("");
    setActivityIntensity("");
    setHusbandNote("");
    setWhatYouNeed("");
    setGeneralNote("");
    setCurrentRecordCreatedAt(null);
    setCurrentRecordUpdatedAt(null);
    draftCreatedAtRef.current = null;
  };

  const fetchExistingLog = async (dateToFetch: string) => {
    setLoading(true);
    userEditedRef.current = false;
    draftCreatedAtRef.current = null;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let foundSideData = false;

    if (user) {
      setActiveUserId(user.id);

      const { data: allIntimacy } = await supabase
        .from("intimacy_entries")
        .select("*")
        .eq("user_id", user.id);

      const intimacy = (allIntimacy || []).find(
        (row: any) => (row.entry_date || row.date) === dateToFetch,
      );

      if (intimacy) {
        foundSideData = true;
        setIntimacyActs(intimacy.activities || []);
        setLibido(intimacy.libido_level || "");
        setOrgasm(intimacy.orgasm_reached);
      } else {
        setIntimacyActs([]);
        setLibido("");
        setOrgasm(null);
      }

      const { data: allHNotes } = await supabase
        .from("husband_notes")
        .select("*")
        .eq("user_id", user.id);

      const hNote = (allHNotes || []).find(
        (row: any) =>
          (row.date || row.entry_date || row.log_date) === dateToFetch,
      );

      const localPartnerText = getLocalPartnerNote(user.id, dateToFetch);
      const resolvedPartnerNote = hNote?.content || localPartnerText || "";
      setHusbandNote(resolvedPartnerNote);
      if (resolvedPartnerNote) {
        foundSideData = true;
        saveLocalPartnerNote(user.id, dateToFetch, resolvedPartnerNote);
      }
    }

    try {
      const localDraft = await getLocalDraft(`daily_logs_${dateToFetch}`);
      if (localDraft && !localDraft.synced && localDraft.payload) {
        applyRecordToState(localDraft.payload);
        setIsExistingLog(true);
        setLoading(false);
        return;
      }
    } catch {

      // Ignore IndexedDB lookup errors
    }

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: logRows } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_date", dateToFetch)
      .limit(1);

    const log = logRows?.[0];

    if (log || foundSideData) {
      setIsExistingLog(true);
      if (log) {
        applyRecordToState(log);
      }
    } else {
      setIsExistingLog(false);
      resetForm();
    }
    setLoading(false);
  };

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setActiveUserId(user.id);
        const { data } = await supabase
          .from("profiles")
          .select("private_mode_enabled")
          .eq("id", user.id)
          .maybeSingle();
        if (data?.private_mode_enabled) setIsPrivateMode(true);
      }

      const params = new URLSearchParams(window.location.search);
      const urlDate = params.get("date");
      const targetDate = urlDate || format(new Date(), "yyyy-MM-dd");
      setSelectedDate(targetDate);
      fetchExistingLog(targetDate);
    }
    init();
  }, []);

  const handleDateScroll = (days: number) => {
    if (!selectedDate) return;
    const newDate = format(addDays(parseISO(selectedDate), days), "yyyy-MM-dd");
    setSelectedDate(newDate);
    fetchExistingLog(newDate);
  };

  const handleDirectDateSelect = (dateStr: string) => {
    if (dateStr === selectedDate) return;
    setSelectedDate(dateStr);
    fetchExistingLog(dateStr);
  };

  const handleJumpToToday = () => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    setSelectedDate(todayStr);
    fetchExistingLog(todayStr);
  };

  const sevenDayStrip = useMemo(() => {
    if (!selectedDate) return [];
    const base = parseISO(selectedDate);
    return [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
      const d = addDays(base, offset);
      return {
        dateStr: format(d, "yyyy-MM-dd"),
        dayShort: format(d, "EEE"),
        dayNum: format(d, "dd"),
        isSelected: offset === 0,
        isToday: format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"),
      };
    });
  }, [selectedDate]);

  const handleCopyYesterday = async () => {
    setLoading(true);
    setMessage("");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const yesterday = format(subDays(parseISO(selectedDate), 1), "yyyy-MM-dd");
    const { data, error } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_date", yesterday)
      .maybeSingle();

    if (error || !data) {
      setMessage("No log found for yesterday.");
      setLoading(false);
      return;
    }

    markEdited();
    if (data.symptoms)
      setSelectedSymptoms(
        Array.isArray(data.symptoms)
          ? data.symptoms
          : typeof data.symptoms === "string"
            ? data.symptoms.split(",").map((s: string) => s.trim())
            : [],
      );
    if (data.mood) setSelectedMoods(data.mood.split(", "));
    if (data.flow) setSelectedFlow(data.flow);
    if (data.is_spotting) setIsSpotting(data.is_spotting);
    if (data.cravings) setCravingText(data.cravings);

    setOpenSections((prev) => ({
      ...prev,
      symptoms: Boolean(data.symptoms && data.symptoms.length > 0),
      moods: Boolean(data.mood),
      cravings: Boolean(data.cravings),
    }));
    setMessage("Yesterday's symptoms copied and saved.");
    setLoading(false);
  };

  const toggleSection = (section: string) =>
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));

  const allSectionsOpen = Object.values(openSections).every(Boolean);
  const toggleAllSections = () => {
    const nextState = !allSectionsOpen;
    setOpenSections({
      period: nextState,
      moods: nextState,
      symptoms: nextState,
      cravings: nextState,
      discharge: nextState,
      intimacy: nextState,
      activity: nextState,
      notes: nextState,
    });
  };

  const toggleArrayItem = (
    item: string,
    array: string[],
    setter: (val: string[]) => void,
  ) => {
    markEdited();
    if (array.includes(item)) {
      setter(array.filter((i) => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  const appendCraving = (item: string) => {
    markEdited();
    const current = cravingText.trim();
    if (!current.includes(item)) {
      setCravingText(current ? `${current}, ${item}` : item);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to completely delete the log for this date?",
      )
    )
      return;
    setLoading(true);
    await clearDraft();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      saveLocalPartnerNote(user.id, selectedDate, "");
      await supabase
        .from("daily_logs")
        .delete()
        .eq("user_id", user.id)
        .eq("log_date", selectedDate);
      await supabase
        .from("intimacy_entries")
        .delete()
        .eq("user_id", user.id)
        .eq("entry_date", selectedDate);

      const { data: userNotes } = await supabase
        .from("husband_notes")
        .select("*")
        .eq("user_id", user.id);
      const match = (userNotes || []).find(
        (n: any) => (n.date || n.entry_date || n.log_date) === selectedDate,
      );
      if (match?.id) {
        await supabase.from("husband_notes").delete().eq("id", match.id);
      }

      setMessage("Log deleted successfully. ✨");
      setIsExistingLog(false);
      resetForm();
      router.refresh();
      setTimeout(() => router.push("/calendar"), 800);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (partnerNoteTimerRef.current) {
      clearTimeout(partnerNoteTimerRef.current);
    }

    const success = await saveEntry(generatePayload(), true);
    await syncPartnerNoteToDb(selectedDate, husbandNote);

    if (isOnline) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && (intimacyActs.length > 0 || libido || orgasm !== null)) {
        const { data: allIntimacy } = await supabase
          .from("intimacy_entries")
          .select("*")
          .eq("user_id", user.id);

        const existingIntimacy = (allIntimacy || []).find(
          (row: any) => (row.entry_date || row.date) === selectedDate,
        );


        const intimacyTimestamps = buildSyncTimestamps(existingIntimacy);

        const intimacyPayload = {
          user_id: user.id,
          entry_date: selectedDate,
          activities: intimacyActs,
          libido_level: libido || null,
          orgasm_reached: orgasm,
          created_at: intimacyTimestamps.created_at,
          updated_at: intimacyTimestamps.updated_at,
        };

        if (existingIntimacy?.id) {
          await supabase
            .from("intimacy_entries")
            .update(intimacyPayload)
            .eq("id", existingIntimacy.id);
        } else {
          await supabase.from("intimacy_entries").insert([intimacyPayload]);
        }
      }
    }


    if (success && !isOnline) {
      setMessage("Saved safely to device! Will sync when reconnected.");
    } else if (!success && conflict) {
      setMessage("Conflict detected. Please resolve above.");
    } else if (!success) {
      setMessage(
        `Error syncing to cloud: ${syncError || "Please check your connection."}`,
      );
    } else {
      userEditedRef.current = false;
      setMessage(
        isExistingLog
          ? "MoonDay log updated successfully! ✨"
          : "MoonDay log saved successfully! ✨",
      );
      setIsExistingLog(true);
      router.refresh();
      setTimeout(() => router.push("/calendar"), 800);
    }
    setLoading(false);
  };


  const isTodaySelected =
    selectedDate &&
    format(parseISO(selectedDate), "yyyy-MM-dd") ===
      format(new Date(), "yyyy-MM-dd");

  const periodSummaryBadge = [
    isPeriodStart ? "Start Day" : isPeriodEnd ? "End Day" : null,
    selectedFlow || (isSpotting ? "Spotting" : null),
    periodColor.name || null,
  ]
    .filter(Boolean)
    .join(" • ");

  const safeSymptomList = Array.isArray(selectedSymptoms)
    ? selectedSymptoms
    : typeof selectedSymptoms === "string"
      ? (selectedSymptoms as string)
          .replace(/[{}"[\]]/g, "")
          .split(",")
          .filter(Boolean)
      : [];


  return (
    <div className="animate-in fade-in duration-300 max-w-[820px] mx-auto pb-14 text-ink">
      <NetworkStatusBanner
        isOnline={isOnline}
        conflict={conflict}
        syncError={syncError}
        onKeepLocal={resolveKeepLocal}
        onKeepServer={resolveKeepServer}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#a55f78] mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#d990a8]" />
            <span>Daily Wellness & Cycle Check-In</span>
          </div>
          <h2 className="text-[24px] sm:text-[26px] font-bold text-ink tracking-tight leading-tight">
            Log your MoonDay
          </h2>
        </div>
        <div className="self-start sm:self-auto">
          <SaveStatusBadge status={status} lastSavedAt={lastSavedAt} />
        </div>
      </div>

      <div className="bg-white border border-line rounded-2xl p-3.5 sm:p-4 shadow-soft mb-4">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => handleDateScroll(-1)}
            aria-label="Previous day"
            className="w-10 h-10 rounded-xl border border-line bg-slate-50 hover:bg-[#fff0f3] hover:border-[#d990a8] hover:text-[#a55f78] text-muted flex items-center justify-center transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div
            onClick={() => router.push("/calendar")}
            className="flex-1 text-center group py-2 px-3 rounded-xl hover:bg-[#fff0f3]/40 transition-all border border-transparent hover:border-[#d990a8]/50 cursor-pointer"
            title="Click to open Calendar view"
          >
            <div className="flex items-center justify-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#d990a8] shrink-0" />
              <h3 className="text-[15px] sm:text-[17px] font-bold text-ink tracking-tight tabular-nums group-hover:text-[#a55f78] transition-colors">
                {selectedDate
                  ? format(parseISO(selectedDate), "EEEE, MMMM do, yyyy")
                  : "Loading..."}
              </h3>
            </div>

            <div className="flex items-center justify-center gap-2 mt-1">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isTodaySelected
                    ? "bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2]"
                    : "bg-slate-100 text-muted"
                }`}
              >
                {isTodaySelected
                  ? "Today • Click to open Calendar"
                  : "Custom Date • Click to open Calendar"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleDateScroll(1)}
            aria-label="Next day"
            className="w-10 h-10 rounded-xl border border-line bg-slate-50 hover:bg-[#fff0f3] hover:border-[#d990a8] hover:text-[#a55f78] text-muted flex items-center justify-center transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {sevenDayStrip.length > 0 && (
          <div className="grid grid-cols-7 gap-1.5 mt-3 pt-3 border-t border-line/60">
            {sevenDayStrip.map((d) => (
              <button
                key={d.dateStr}
                type="button"
                onClick={() => handleDirectDateSelect(d.dateStr)}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all border tabular-nums cursor-pointer ${
                  d.isSelected
                    ? "bg-[#a55f78] text-white border-[#a55f78] shadow-soft scale-[1.02]"
                    : d.isToday
                      ? "bg-[#fff0f3] text-[#a55f78] border-[#f4c2c2] font-bold"
                      : "bg-slate-50 text-muted border-line hover:border-[#d990a8] hover:bg-white"
                }`}
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    d.isSelected ? "text-white/85" : "text-muted"
                  }`}
                >
                  {d.dayShort}
                </span>
                <span className="text-[13px] sm:text-[14px] font-extrabold mt-0.5">
                  {d.dayNum}
                </span>
              </button>
            ))}
          </div>
        )}


        <div className="mt-3 pt-3 border-t border-line/70 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {!isTodaySelected && selectedDate && (
              <button
                type="button"
                onClick={handleJumpToToday}
                className="px-3 py-1.5 rounded-lg bg-[#fff0f3] border border-[#f4c2c2] text-[#a55f78] text-[11px] font-bold hover:brightness-95 transition-all cursor-pointer"
              >
                Return to Today
              </button>
            )}
            <button
              type="button"
              onClick={toggleAllSections}
              className="px-3 py-1.5 rounded-lg bg-slate-50 border border-line text-[11px] font-bold text-muted hover:text-ink hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {allSectionsOpen
                ? "Collapse All Sections"
                : "Expand All Sections"}
            </button>
          </div>


          <button
            type="button"
            onClick={handleCopyYesterday}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-line rounded-lg text-[12px] font-bold text-muted hover:text-[#a55f78] hover:border-[#d990a8] hover:bg-[#fff8fa] transition-all shadow-soft active:scale-[0.98] cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-[#d990a8]" />
            <span>Copy Yesterday&apos;s Log</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-[78px] rounded-2xl bg-slate-50 animate-pulse border border-line"
            />
          ))}
        </div>

      ) : (
        <form onSubmit={handleSave}>
          <Accordion
            title="Moonday Details"
            subtitle="Cycle boundaries, flow volume & color palette"
            badge={periodSummaryBadge || undefined}
            icon={Droplet}
            iconColor="text-[#d990a8]"
            isOpen={openSections.period}
            onToggle={() => toggleSection("period")}
          >
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => {
                    markEdited();
                    setIsPeriodStart(!isPeriodStart);
                    if (isPeriodEnd) setIsPeriodEnd(false);
                  }}
                  className={`py-3.5 px-4 rounded-xl border font-bold text-[13px] transition-all flex items-center justify-between group cursor-pointer ${
                    isPeriodStart
                      ? "bg-[#fff0f3] border-[#d990a8] text-[#a55f78] shadow-soft"
                      : "bg-slate-50 border-line text-muted hover:border-[#eadfe4] hover:bg-white"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isPeriodStart
                          ? "border-[#a55f78] bg-[#a55f78] text-white"
                          : "border-line bg-white"
                      }`}
                    >
                      {isPeriodStart && <Check className="w-2.5 h-2.5" />}
                    </span>
                    <span>Confirmed Start Day</span>
                  </span>
                  {isPeriodStart && (
                    <CheckCircle2 className="w-4 h-4 text-[#a55f78]" />
                  )}
                </button>


                <button
                  type="button"
                  onClick={() => {
                    markEdited();
                    setIsPeriodEnd(!isPeriodEnd);
                    if (isPeriodStart) setIsPeriodStart(false);
                  }}
                  className={`py-3.5 px-4 rounded-xl border font-bold text-[13px] transition-all flex items-center justify-between group cursor-pointer ${
                    isPeriodEnd
                      ? "bg-[#fff0f3] border-[#d990a8] text-[#a55f78] shadow-soft"
                      : "bg-slate-50 border-line text-muted hover:border-[#eadfe4] hover:bg-white"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isPeriodEnd
                          ? "border-[#a55f78] bg-[#a55f78] text-white"
                          : "border-line bg-white"
                      }`}
                    >
                      {isPeriodEnd && <Check className="w-2.5 h-2.5" />}
                    </span>
                    <span>Confirmed End Day</span>
                  </span>
                  {isPeriodEnd && (
                    <CheckCircle2 className="w-4 h-4 text-[#a55f78]" />
                  )}
                </button>
              </div>


              <div className="pt-5 border-t border-line">
                <label className="block text-[11px] font-bold text-muted mb-3 uppercase tracking-[0.12em]">
                  Flow Intensity
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Very heavy",
                    "Heavy",
                    "Medium",
                    "Low",
                    "Spotting",
                    "No bleeding",
                  ].map((f) => (
                    <Chip
                      key={f}
                      label={f}
                      selected={
                        selectedFlow === f || (f === "Spotting" && isSpotting)
                      }
                      onClick={() => {
                        markEdited();
                        if (f === "Spotting") {
                          setIsSpotting(!isSpotting);
                          setSelectedFlow(isSpotting ? "" : f);
                        } else {
                          setSelectedFlow(f === selectedFlow ? "" : f);
                          setIsSpotting(false);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>


              <div className="pt-5 border-t border-line">
                <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-[0.12em]">
                      Moonday Color
                    </label>
                    {periodColor.name && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#fff0f3] border border-[#f4c2c2] text-[11px] font-bold text-[#a55f78]">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-line"
                          style={{ backgroundColor: periodColor.hex }}
                        />
                        {periodColor.name}
                      </span>
                    )}
                  </div>


                  <button
                    type="button"
                    onClick={() => setShowCustomColor(!showCustomColor)}
                    className="inline-flex items-center gap-1 text-[11px] text-[#a35f78] hover:underline font-bold cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>
                      {showCustomColor ? "Hide Picker" : "Custom Picker"}
                    </span>
                  </button>
                </div>


                {showCustomColor && (
                  <div className="flex items-center gap-3 mb-3 p-3.5 bg-slate-50 rounded-xl border border-line">
                    <input
                      type="color"
                      aria-label="Custom color picker"
                      value={periodColor.hex || "#000000"}
                      onChange={(e) => {
                        markEdited();
                        setPeriodColor({ name: "Custom", hex: e.target.value });
                      }}
                      className="w-[42px] h-[42px] rounded-lg cursor-pointer border border-line bg-white p-0.5"
                    />
                    <div>
                      <div className="text-[13px] font-bold text-ink">
                        {periodColor.hex || "Select a custom shade"}
                      </div>
                      <div className="text-[11px] text-muted">
                        Tap the swatch box to open your device color wheel
                      </div>
                    </div>
                  </div>
                )}

                <div className="h-[200px] overflow-y-auto border border-line rounded-xl p-2.5 bg-slate-50 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {COLORS.map((c) => {
                    const isSelected = periodColor.name === c.name;
                    return (
                      <button
                        type="button"
                        key={c.name}
                        onClick={() => {
                          markEdited();
                          setPeriodColor(c);
                        }}
                        className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all text-left cursor-pointer ${
                          isSelected
                            ? "bg-white border-[#d990a8] ring-2 ring-[#d990a8]/25 shadow-soft"
                            : "border-transparent hover:bg-white hover:border-line"
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full shrink-0 border border-line shadow-soft"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-[11px] leading-tight text-ink font-semibold truncate">
                          {c.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Accordion>


          <Accordion
            title="Mood & Feelings"
            subtitle="Emotional reflections & affective state"
            badge={
              selectedMoods.length > 0
                ? `${selectedMoods.length} selected`
                : undefined
            }
            icon={Smile}
            iconColor="text-[#d990a8]"
            isOpen={openSections.moods}
            onToggle={() => toggleSection("moods")}
          >
            <div className="pt-4 space-y-4">
              <div className="pb-3 border-b border-line/60">
                <Chip
                  label="Everything is fine"
                  selected={selectedMoods.includes("Fine")}
                  onClick={() => {
                    markEdited();
                    setSelectedMoods(["Fine"]);
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => (
                  <Chip
                    key={m}
                    label={m}
                    selected={selectedMoods.includes(m)}
                    onClick={() => {
                      const current = selectedMoods.filter((x) => x !== "Fine");
                      toggleArrayItem(m, current, setSelectedMoods);
                    }}
                  />
                ))}
              </div>
            </div>
          </Accordion>


          <Accordion
            title="Physical Symptoms"
            subtitle="9 clinical categories • Instant search & filter"
            badge={
              safeSymptomList.length > 0
                ? `${safeSymptomList.length} logged`
                : undefined
            }
            icon={Activity}
            iconColor="text-[#d990a8]"
            isOpen={openSections.symptoms}
            onToggle={() => toggleSection("symptoms")}
          >
            <div className="pt-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                <Chip
                  label="No symptoms / Everything is fine"
                  selected={safeSymptomList.includes("None")}
                  onClick={() => {
                    markEdited();
                    setSelectedSymptoms(["None"]);
                  }}
                />

                <div className="relative flex-1 max-w-[340px]">
                  <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={symptomSearch}
                    onChange={(e) => setSymptomSearch(e.target.value)}
                    placeholder="Quick search 104 symptoms..."
                    aria-label="Quick search symptoms"
                    className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-line rounded-xl text-[12px] text-ink outline-none focus:bg-white focus:border-[#d990a8] transition-colors"
                  />
                  {symptomSearch && (
                    <button
                      type="button"
                      onClick={() => setSymptomSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>


              <div className="grid grid-cols-1 gap-3.5">
                {Object.entries(SYMPTOMS).map(([category, items]) => {
                  const filteredItems = symptomSearch.trim()
                    ? items.filter((i) =>
                        i.toLowerCase().includes(symptomSearch.toLowerCase()),
                      )
                    : items;

                  if (filteredItems.length === 0) return null;

                  const countInCategory = items.filter((i) =>
                    safeSymptomList.includes(i),
                  ).length;

                  return (
                    <div
                      key={category}
                      className="p-4 rounded-xl bg-slate-50 border border-[#eadfe4]"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-[11px] font-bold text-[#a55f78] uppercase tracking-[0.12em]">
                          {category}
                        </label>
                        {countInCategory > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2] tabular-nums">
                            {countInCategory} active
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {filteredItems.map((s) => (
                          <Chip
                            key={s}
                            label={s}
                            selected={safeSymptomList.includes(s)}
                            onClick={() => {
                              const current = safeSymptomList.filter(
                                (x) => x !== "None",
                              );
                              toggleArrayItem(s, current, setSelectedSymptoms);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Accordion>


          <Accordion
            title="Vaginal Discharge"
            subtitle="Cervical fluid observation, consistency, amount & odor"
            badge={dischargeType || undefined}
            icon={Droplet}
            iconColor="text-blue-400"
            isOpen={openSections.discharge}
            onToggle={() => toggleSection("discharge")}
          >
            <div className="pt-4 space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-muted mb-3 uppercase tracking-[0.12em]">
                  Observation
                </label>
                <div className="flex flex-wrap gap-2">
                  {DISCHARGE_TYPES.map((d) => (
                    <Chip
                      key={d}
                      label={d}
                      selected={dischargeType === d}
                      onClick={() => {
                        markEdited();
                        setDischargeType(d === dischargeType ? "" : d);
                      }}
                    />
                  ))}
                </div>
              </div>


              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-line">
                <div>
                  <label className="block text-[11px] font-bold text-muted mb-1.5">
                    Consistency
                  </label>
                  <select
                    value={dischargeConsistency}
                    aria-label="Discharge Consistency"
                    onChange={(e) => {
                      markEdited();
                      setDischargeConsistency(e.target.value);
                    }}
                    className="w-full p-2.5 border border-line rounded-xl text-[12px] font-medium text-ink bg-slate-50 outline-none focus:bg-white focus:border-[#d990a8] transition-colors cursor-pointer"
                  >
                    <option value="">Not noted</option> <option>Thick</option>{" "}
                    <option>Thin</option> <option>Stretchy</option>{" "}
                    <option>Sticky</option> <option>Watery</option>{" "}
                    <option>Jelly-like</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted mb-1.5">
                    Amount
                  </label>
                  <select
                    value={dischargeAmount}
                    aria-label="Discharge Amount"
                    onChange={(e) => {
                      markEdited();
                      setDischargeAmount(e.target.value);
                    }}
                    className="w-full p-2.5 border border-line rounded-xl text-[12px] font-medium text-ink bg-slate-50 outline-none focus:bg-white focus:border-[#d990a8] transition-colors cursor-pointer"
                  >
                    <option value="">Not noted</option> <option>Light</option>{" "}
                    <option>Moderate</option> <option>Heavy</option>{" "}
                    <option>Excessive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted mb-1.5">
                    Odor
                  </label>
                  <select
                    value={dischargeOdor}
                    aria-label="Discharge Odor"
                    onChange={(e) => {
                      markEdited();
                      setDischargeOdor(e.target.value);
                    }}
                    className="w-full p-2.5 border border-line rounded-xl text-[12px] font-medium text-ink bg-slate-50 outline-none focus:bg-white focus:border-[#d990a8] transition-colors cursor-pointer"
                  >
                    <option value="">None / Normal</option>{" "}
                    <option>Unusual odor</option> <option>Strong odor</option>{" "}
                    <option>Fishy</option> <option>Metallic</option>{" "}
                    <option>Sweet</option>
                  </select>
                </div>
              </div>
            </div>
          </Accordion>


          <Accordion
            title="Food Cravings"
            subtitle="Metabolic & taste preferences today"
            badge={cravingText.trim() ? "Logged" : undefined}
            icon={Coffee}
            iconColor="text-[#a56c81]"
            isOpen={openSections.cravings}
            onToggle={() => toggleSection("cravings")}
          >
            <div className="pt-4">
              <p className="text-[12px] text-muted mb-3">
                Tap any preset chip below to append it, or type your own
                cravings directly.
              </p>
              <div className="flex flex-wrap gap-2 mb-4 p-3.5 rounded-xl bg-slate-50 border border-line">
                {CRAVINGS.map((c) => {
                  const isAdded = cravingText
                    .toLowerCase()
                    .includes(c.toLowerCase());
                  return (
                    <button
                      type="button"
                      key={c}
                      onClick={() => appendCraving(c)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all border cursor-pointer ${
                        isAdded
                          ? "bg-[#fff0f3] border-[#d990a8] text-[#a55f78]"
                          : "bg-white border-line text-muted hover:bg-[#fff0f3] hover:border-[#d990a8] hover:text-[#9e5872]"
                      }`}
                    >
                      <Plus className="w-3 h-3" /> {c}
                    </button>
                  );
                })}
              </div>
              <textarea
                value={cravingText}
                onChange={(e) => {
                  markEdited();
                  setCravingText(e.target.value);
                }}
                placeholder="E.g., Sweet, Chocolate, Ice cream, Pizza..."
                className="w-full min-h-[84px] p-3.5 border border-line rounded-xl outline-none focus:bg-white focus:border-[#d990a8] text-[13px] text-ink bg-slate-50 resize-y transition-colors"
              />
            </div>
          </Accordion>


          <Accordion
            title="Physical Activity"
            subtitle="Movement, workouts & restorative rest"
            badge={
              activityActs.length > 0
                ? `${activityActs.length} selected`
                : undefined
            }
            icon={Wind}
            iconColor="text-muted"
            isOpen={openSections.activity}
            onToggle={() => toggleSection("activity")}
          >
            <div className="pt-4 space-y-5">
              <div className="flex flex-wrap gap-2">
                {ACTIVITIES.map((a) => (
                  <Chip
                    key={a}
                    label={a}
                    selected={activityActs.includes(a)}
                    onClick={() =>
                      toggleArrayItem(a, activityActs, setActivityActs)
                    }
                  />
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-line">
                <div>
                  <label className="block text-[11px] font-bold text-muted mb-1.5">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={activityDuration}
                    onChange={(e) => setActivityDuration(e.target.value)}
                    placeholder="e.g. 45"
                    className="w-full p-2.5 border border-line rounded-xl text-[12px] font-medium text-ink bg-slate-50 outline-none focus:bg-white focus:border-[#d990a8] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted mb-1.5">
                    Intensity
                  </label>
                  <select
                    value={activityIntensity}
                    aria-label="Activity Intensity"
                    onChange={(e) => setActivityIntensity(e.target.value)}
                    className="w-full p-2.5 border border-line rounded-xl text-[12px] font-medium text-ink bg-slate-50 outline-none focus:bg-white focus:border-[#d990a8] transition-colors cursor-pointer"
                  >
                    <option value="">Not specified</option>{" "}
                    <option>Very Low</option> <option>Low</option>{" "}
                    <option>Moderate</option> <option>High</option>{" "}
                    <option>Maximum Effort</option>
                  </select>
                </div>
              </div>
            </div>
          </Accordion>


          <Accordion
            title="Sex & Sex Drive"
            subtitle="Strictly private • Excluded from clinical & dashboard exports"
            badge={
              intimacyActs.length > 0 || libido || orgasm !== null
                ? "Private Log"
                : undefined
            }
            icon={Heart}
            iconColor="text-[#d990a8]"
            isOpen={openSections.intimacy}
            onToggle={() => toggleSection("intimacy")}
          >
            <div className="pt-4 space-y-6">
              <div className="text-[12px] text-[#a55f78] bg-[#fff0f3] border border-[#f4c2c2] px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 font-medium">
                <Lock className="w-4 h-4 shrink-0 text-[#a55f78]" />
                <span>
                  This section is completely private and hidden from your
                  dashboard summaries and medical reports.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted mb-3 uppercase tracking-[0.12em]">
                  Activity
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTIMACY_ACTS.map((a) => (
                    <Chip
                      key={a}
                      label={a}
                      selected={intimacyActs.includes(a)}
                      onClick={() =>
                        toggleArrayItem(a, intimacyActs, setIntimacyActs)
                      }
                    />
                  ))}
                </div>
              </div>


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-line">
                <div>
                  <label className="block text-[11px] font-bold text-muted mb-2.5 uppercase tracking-[0.12em]">
                    Libido / Sex Drive
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Low", "Neutral", "High", "Very High"].map((l) => (
                      <Chip
                        key={l}
                        label={l}
                        selected={libido === l}
                        onClick={() => setLibido(l === libido ? "" : l)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted mb-2.5 uppercase tracking-[0.12em]">
                    Orgasm reached?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Chip
                      label="Yes"
                      selected={orgasm === true}
                      onClick={() => setOrgasm(orgasm === true ? null : true)}
                    />
                    <Chip
                      label="No"
                      selected={orgasm === false}
                      onClick={() => setOrgasm(orgasm === false ? null : false)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Accordion>

          {/* PERSONAL NOTES SECTION */}


          <Accordion
            title="Personal Notes"
            subtitle="Self-care needs, private partner notes & daily reflections"
            badge={
              whatYouNeed.trim() || husbandNote.trim() || generalNote.trim()
                ? "Written"
                : undefined
            }
            icon={AlignLeft}
            iconColor="text-ink"
            isOpen={openSections.notes}
            onToggle={() => toggleSection("notes")}
          >
            <div className="pt-4 space-y-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-line space-y-2">
                <div>
                  <label className="block text-[13px] font-bold text-ink mb-0.5">
                    What you need right now
                  </label>
                  <p className="text-[11px] text-muted mb-2">
                    E.g., Reassurance, a heating pad, quiet time, a hug. Format
                    text or add links below.
                  </p>
                </div>
                <RichTextEditor
                  value={whatYouNeed}
                  onChange={(html) => {
                    markEdited();
                    setWhatYouNeed(html);
                  }}
                  placeholder="Write what would bring you comfort today..."
                />
              </div>


              {!isPrivateMode && (
                <div className="p-4 rounded-xl bg-[#fff8fa] border border-[#f4c2c2] space-y-2">
                  <div>
                    <label className="block text-[13px] font-bold text-[#a55f78] mb-0.5">
                      Notes for Your Partner 💌
                    </label>
                    <p className="text-[11px] text-muted mb-2">
                      Saved securely and privately. Style text or insert links.
                    </p>
                  </div>
                  <RichTextEditor
                    value={husbandNote}
                    onChange={(html) => {
                      markEdited();
                      handleHusbandNoteChange(html);
                    }}
                    placeholder="Share how you're feeling or how your partner can support you..."
                  />
                </div>
              )}


              <div className="p-4 rounded-xl bg-slate-50 border border-line space-y-2">
                <div>
                  <label className="block text-[13px] font-bold text-ink mb-0.5">
                    General daily note
                  </label>
                  <p className="text-[11px] text-muted mb-2">
                    Any additional context for your cycle history or medical
                    chart.
                  </p>
                </div>
                <RichTextEditor
                  value={generalNote}
                  onChange={(html) => {
                    markEdited();
                    setGeneralNote(html);
                  }}
                  placeholder="Add any extra notes about your day..."
                />
              </div>
            </div>
          </Accordion>


          {message && (
            <div className="mb-5 p-3.5 rounded-xl text-center font-bold text-[13px] bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2] shadow-soft animate-in fade-in duration-200">
              {message}
            </div>
          )}

          <div className="mt-6 bg-white border border-line rounded-2xl p-3.5 sm:p-4 shadow-soft flex flex-col sm:flex-row gap-3">
            {isExistingLog && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="sm:flex-1 py-3.5 px-5 bg-white border border-red-200 text-red-500 font-bold text-[13px] sm:text-[14px] rounded-xl hover:bg-red-50 transition-all flex justify-center items-center gap-2 active:scale-[0.99] cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Delete Log
              </button>
            )}


            <button
              type="submit"
              disabled={loading}
              className="sm:flex-[2.5] py-3.5 px-6 bg-ink text-white font-bold text-[14px] rounded-xl hover:bg-black transition-all shadow-soft flex justify-center items-center gap-2 disabled:opacity-70 active:scale-[0.99] cursor-pointer"
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <Check className="w-4 h-4" />{" "}
                  {isExistingLog ? "Update MoonDay Log" : "Save MoonDay Log"}
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

