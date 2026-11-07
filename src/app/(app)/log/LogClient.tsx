"use client";

import {
  useOfflineResilience,
  SaveStatusBadge,
  NetworkStatusBanner,
} from "@/components/NetworkResilience";
import { getLocalDraft } from "@/utils/offlineSync";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
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
} from "lucide-react";

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

const Accordion = ({
  title,
  icon: Icon,
  iconColor,
  isOpen,
  onToggle,
  children,
}: any) => (
  <div className="bg-surface border border-line rounded-xl overflow-hidden shadow-soft mb-[18px]">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between p-[22px] bg-white hover:bg-slate-50 transition-colors"
    >
      <h3 className="text-[15px] font-bold text-ink flex items-center gap-2">
        {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
        {title}
      </h3>
      {isOpen ? (
        <ChevronUp className="w-5 h-5 text-muted" />
      ) : (
        <ChevronDown className="w-5 h-5 text-muted" />
      )}
    </button>
    {isOpen && (
      <div className="p-[22px] pt-0 border-t border-line bg-white">
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
    className={`px-4 py-2 rounded-full text-[12px] font-bold transition-all border
      ${selected ? "bg-[#a55f78] text-white border-[#a55f78] shadow-sm" : "bg-white text-muted border-line hover:border-[#d990a8]"}`}
  >
    {label}
  </button>
);

export default function LogPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isExistingLog, setIsExistingLog] = useState(false);

  const [activeUserId, setActiveUserId] = useState("local-user");
  const [currentRecordUpdatedAt, setCurrentRecordUpdatedAt] = useState<
    string | null
  >(null);
  const userEditedRef = useRef(false);

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
  ]);

  // Automatically autosave whenever any tracked field changes due to user interaction
  useEffect(() => {
    if (!userEditedRef.current || !selectedDate) return;
    triggerAutosave(generatePayload(), true);
  }, [generatePayload, selectedDate, triggerAutosave]);

  const markEdited = () => {
    userEditedRef.current = true;
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
    setCurrentRecordUpdatedAt(null);
  };

  const fetchExistingLog = async (dateToFetch: string) => {
    setLoading(true);
    userEditedRef.current = false;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setActiveUserId(user.id);
    }

    // 1. Check if there is an unsynced local draft for this date first
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

    // 2. Otherwise load from Supabase
    const { data: log } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_date", dateToFetch)
      .maybeSingle();

    const { data: intimacy } = await supabase
      .from("intimacy_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("entry_date", dateToFetch)
      .maybeSingle();

    const { data: hNote } = await supabase
      .from("husband_notes")
      .select("*")
      .eq("user_id", user.id)
      .eq("entry_date", dateToFetch)
      .maybeSingle();

    if (log || intimacy || hNote) {
      setIsExistingLog(true);
      if (log) {
        applyRecordToState(log);
      } else {
        resetForm();
      }
      if (intimacy) {
        setIntimacyActs(intimacy.activities || []);
        setLibido(intimacy.libido_level || "");
        setOrgasm(intimacy.orgasm_reached);
      }
      if (hNote) setHusbandNote(hNote.content || "");
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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    fetchExistingLog(newDate);
  };

  const handleDateScroll = (days: number) => {
    if (!selectedDate) return;
    const newDate = format(addDays(parseISO(selectedDate), days), "yyyy-MM-dd");
    setSelectedDate(newDate);
    fetchExistingLog(newDate);
  };

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
      await supabase
        .from("husband_notes")
        .delete()
        .eq("user_id", user.id)
        .eq("entry_date", selectedDate);
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

    const success = await saveEntry(generatePayload(), true);

    if (isOnline) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        if (intimacyActs.length > 0 || libido || orgasm !== null) {
          await supabase.from("intimacy_entries").upsert(
            {
              user_id: user.id,
              entry_date: selectedDate,
              activities: intimacyActs,
              libido_level: libido || null,
              orgasm_reached: orgasm,
              created_at: new Date().toISOString(),
            },
            { onConflict: "user_id,entry_date" },
          );
        }
        if (husbandNote.trim()) {
          await supabase.from("husband_notes").upsert(
            {
              user_id: user.id,
              entry_date: selectedDate,
              content: husbandNote.trim(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,entry_date" },
          );
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

  return (
    <div className="animate-in fade-in duration-300 max-w-[800px] mx-auto pb-10">
      <NetworkStatusBanner
        isOnline={isOnline}
        conflict={conflict}
        syncError={syncError}
        onKeepLocal={resolveKeepLocal}
        onKeepServer={resolveKeepServer}
      />

      {/* BEAUTIFUL DATE NAVIGATOR */}
      <div className="flex items-center justify-between bg-surface border border-line rounded-xl p-4 shadow-soft mb-[18px]">
        <button
          type="button"
          onClick={() => handleDateScroll(-1)}
          className="p-2 hover:bg-slate-50 rounded-lg text-muted transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="relative text-center cursor-pointer group">
          <h2 className="text-[16px] font-bold text-ink flex items-center justify-center gap-2">
            {selectedDate
              ? format(parseISO(selectedDate), "EEEE, MMMM do")
              : "Loading..."}
          </h2>
          <p className="text-[12px] text-muted">
            {selectedDate &&
            format(parseISO(selectedDate), "yyyy-MM-dd") ===
              format(new Date(), "yyyy-MM-dd")
              ? "Today (Tap to change)"
              : "Past Log (Tap to change)"}
          </p>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
        <button
          type="button"
          onClick={() => handleDateScroll(1)}
          className="p-2 hover:bg-slate-50 rounded-lg text-muted transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[22px] font-bold text-ink">Log your MoonDay</h2>
        <SaveStatusBadge status={status} lastSavedAt={lastSavedAt} />
      </div>

      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={handleCopyYesterday}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-line rounded-[8px] text-[12px] font-bold text-muted hover:text-ink hover:bg-slate-100 transition-colors shadow-sm"
        >
          <Copy className="w-3.5 h-3.5" /> Copy Yesterday's Log
        </button>
      </div>

      <form onSubmit={handleSave}>
        {/* PERIOD SECTION */}
        <Accordion
          title="Moonday Details"
          icon={Droplet}
          iconColor="text-[#d990a8]"
          isOpen={openSections.period}
          onToggle={() => toggleSection("period")}
        >
          <div className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => {
                  markEdited();
                  setIsPeriodStart(!isPeriodStart);
                  if (isPeriodEnd) setIsPeriodEnd(false);
                }}
                className={`flex-1 py-3 px-4 rounded-[12px] border font-bold text-[13px] transition-all flex items-center justify-center gap-2 ${isPeriodStart ? "bg-[#fff0f3] border-[#d990a8] text-[#a55f78]" : "bg-slate-50 border-line text-muted hover:border-[#eadfe4]"}`}
              >
                {isPeriodStart && <CheckCircle2 className="w-4 h-4" />}{" "}
                Confirmed Start Day
              </button>
              <button
                type="button"
                onClick={() => {
                  markEdited();
                  setIsPeriodEnd(!isPeriodEnd);
                  if (isPeriodStart) setIsPeriodStart(false);
                }}
                className={`flex-1 py-3 px-4 rounded-[12px] border font-bold text-[13px] transition-all flex items-center justify-center gap-2 ${isPeriodEnd ? "bg-[#fff0f3] border-[#d990a8] text-[#a55f78]" : "bg-slate-50 border-line text-muted hover:border-[#eadfe4]"}`}
              >
                {isPeriodEnd && <CheckCircle2 className="w-4 h-4" />} Confirmed
                End Day
              </button>
            </div>

            <div className="pt-2 border-t border-line">
              <label className="block text-[12px] font-bold text-muted mb-3 uppercase tracking-wider">
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

            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="block text-[12px] font-bold text-muted uppercase tracking-wider">
                  Moonday Color
                </label>
                <button
                  type="button"
                  onClick={() => setShowCustomColor(!showCustomColor)}
                  className="text-[11px] text-[#a35f78] hover:underline font-bold"
                >
                  Custom Picker
                </button>
              </div>
              {showCustomColor && (
                <div className="flex items-center gap-3 mb-3 p-3 bg-slate-50 rounded-[10px] border border-line">
                  <input
                    type="color"
                    value={periodColor.hex || "#000000"}
                    onChange={(e) => {
                      markEdited();
                      setPeriodColor({ name: "Custom", hex: e.target.value });
                    }}
                    className="w-[40px] h-[40px] rounded cursor-pointer border-0"
                  />
                  <span className="text-[13px] font-bold text-ink">
                    {periodColor.hex || "Select a color"}
                  </span>
                </div>
              )}
              <div className="h-[180px] overflow-y-auto border border-line rounded-[12px] p-2 bg-slate-50 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COLORS.map((c) => (
                  <button
                    type="button"
                    key={c.name}
                    onClick={() => {
                      markEdited();
                      setPeriodColor(c);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-[8px] border transition-all text-left ${periodColor.name === c.name ? "bg-white border-[#d990a8] shadow-sm" : "border-transparent hover:bg-white hover:border-line"}`}
                  >
                    <span
                      className="w-5 h-5 rounded-full shrink-0 border border-black/10"
                      style={{ backgroundColor: c.hex }}
                    ></span>
                    <span className="text-[11px] leading-tight text-ink font-medium">
                      {c.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Accordion>

        {/* MOOD SECTION */}
        <Accordion
          title="Mood & Feelings"
          icon={Smile}
          iconColor="text-[#d990a8]"
          isOpen={openSections.moods}
          onToggle={() => toggleSection("moods")}
        >
          <div className="pt-4 flex flex-wrap gap-2">
            <Chip
              label="Everything is fine"
              selected={selectedMoods.includes("Fine")}
              onClick={() => {
                markEdited();
                setSelectedMoods(["Fine"]);
              }}
            />
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
        </Accordion>

        {/* SYMPTOMS SECTION */}
        <Accordion
          title="Physical Symptoms"
          icon={Activity}
          iconColor="text-[#d990a8]"
          isOpen={openSections.symptoms}
          onToggle={() => toggleSection("symptoms")}
        >
          <div className="pt-4 space-y-6">
            <Chip
              label="No symptoms / Everything is fine"
              selected={
                Array.isArray(selectedSymptoms) &&
                selectedSymptoms.includes("None")
              }
              onClick={() => {
                markEdited();
                setSelectedSymptoms(["None"]);
              }}
            />
            {Object.entries(SYMPTOMS).map(([category, items]) => (
              <div key={category}>
                <label className="block text-[11px] font-bold text-[#a56c81] mb-2 uppercase tracking-wider">
                  {category}
                </label>
                <div className="flex flex-wrap gap-2">
                  {items.map((s) => {
                    const safeSymptoms = Array.isArray(selectedSymptoms)
                      ? selectedSymptoms
                      : typeof selectedSymptoms === "string"
                        ? (selectedSymptoms as string)
                            .replace(/[{}"[\]]/g, "")
                            .split(",")
                        : [];
                    return (
                      <Chip
                        key={s}
                        label={s}
                        selected={safeSymptoms.includes(s)}
                        onClick={() => {
                          const current = safeSymptoms.filter(
                            (x) => x !== "None",
                          );
                          toggleArrayItem(s, current, setSelectedSymptoms);
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Accordion>

        {/* DISCHARGE SECTION */}
        <Accordion
          title="Vaginal Discharge"
          icon={Droplet}
          iconColor="text-blue-400"
          isOpen={openSections.discharge}
          onToggle={() => toggleSection("discharge")}
        >
          <div className="pt-4 space-y-6">
            <div>
              <label className="block text-[12px] font-bold text-muted mb-2 uppercase tracking-wider">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-muted mb-1">
                  Consistency
                </label>
                <select
                  value={dischargeConsistency}
                  onChange={(e) => {
                    markEdited();
                    setDischargeConsistency(e.target.value);
                  }}
                  className="w-full p-2.5 border border-line rounded-[10px] text-[12px] bg-slate-50 outline-none focus:border-[#d990a8]"
                >
                  <option value="">Not noted</option> <option>Thick</option>{" "}
                  <option>Thin</option> <option>Stretchy</option>{" "}
                  <option>Sticky</option> <option>Watery</option>{" "}
                  <option>Jelly-like</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-muted mb-1">
                  Amount
                </label>
                <select
                  value={dischargeAmount}
                  onChange={(e) => {
                    markEdited();
                    setDischargeAmount(e.target.value);
                  }}
                  className="w-full p-2.5 border border-line rounded-[10px] text-[12px] bg-slate-50 outline-none focus:border-[#d990a8]"
                >
                  <option value="">Not noted</option> <option>Light</option>{" "}
                  <option>Moderate</option> <option>Heavy</option>{" "}
                  <option>Excessive</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-muted mb-1">
                  Odor
                </label>
                <select
                  value={dischargeOdor}
                  onChange={(e) => {
                    markEdited();
                    setDischargeOdor(e.target.value);
                  }}
                  className="w-full p-2.5 border border-line rounded-[10px] text-[12px] bg-slate-50 outline-none focus:border-[#d990a8]"
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

        {/* CRAVINGS SECTION */}
        <Accordion
          title="Food Cravings"
          icon={Coffee}
          iconColor="text-[#a56c81]"
          isOpen={openSections.cravings}
          onToggle={() => toggleSection("cravings")}
        >
          <div className="pt-4">
            <p className="text-[11px] text-muted mb-3">
              Select presets or type your own. They will combine below.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {CRAVINGS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => appendCraving(c)}
                  className="px-3 py-1.5 bg-slate-50 border border-line rounded-full text-[11px] font-medium text-ink hover:bg-[#fff0f3] hover:border-[#d990a8] hover:text-[#9e5872] flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3 h-3" /> {c}
                </button>
              ))}
            </div>
            <textarea
              value={cravingText}
              onChange={(e) => {
                markEdited();
                setCravingText(e.target.value);
              }}
              placeholder="E.g., Sweet, Chocolate, Ice cream, Pizza..."
              className="w-full min-h-[80px] p-3 border border-line rounded-[11px] outline-none focus:border-[#d990a8] text-[13px] bg-slate-50 resize-y"
            />
          </div>
        </Accordion>

        {/* ACTIVITY SECTION */}
        <Accordion
          title="Physical Activity"
          icon={Wind}
          iconColor="text-[#765f6b]"
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
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-muted mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={activityDuration}
                  onChange={(e) => setActivityDuration(e.target.value)}
                  placeholder="e.g. 45"
                  className="w-full p-2.5 border border-line rounded-[10px] text-[12px] bg-slate-50 outline-none focus:border-[#d990a8]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-muted mb-1">
                  Intensity
                </label>
                <select
                  value={activityIntensity}
                  onChange={(e) => setActivityIntensity(e.target.value)}
                  className="w-full p-2.5 border border-line rounded-[10px] text-[12px] bg-slate-50 outline-none focus:border-[#d990a8]"
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

        {/* INTIMACY SECTION */}
        <Accordion
          title="Sex & Sex Drive"
          icon={Heart}
          iconColor="text-[#d990a8]"
          isOpen={openSections.intimacy}
          onToggle={() => toggleSection("intimacy")}
        >
          <div className="pt-4 space-y-6">
            <p className="text-[11px] text-[#a55f78] bg-[#fff0f3] border border-[#f4c2c2] p-2.5 rounded-lg mb-4 flex items-center gap-2 font-medium">
              This section is completely private and hidden from your dashboard
              summaries.
            </p>
            <div>
              <label className="block text-[12px] font-bold text-muted mb-2 uppercase tracking-wider">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[12px] font-bold text-muted mb-2 uppercase tracking-wider">
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
                <label className="block text-[12px] font-bold text-muted mb-2 uppercase tracking-wider">
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

        {/* NOTES SECTION */}
        <Accordion
          title="Personal Notes"
          icon={AlignLeft}
          iconColor="text-ink"
          isOpen={openSections.notes}
          onToggle={() => toggleSection("notes")}
        >
          <div className="pt-4 space-y-5">
            <div>
              <label className="block text-[12px] font-bold text-muted mb-1">
                What you need right now
              </label>
              <p className="text-[11px] text-[#826f79] mb-2">
                E.g., Reassurance, a heating pad, quiet time, a hug.
              </p>
              <textarea
                value={whatYouNeed}
                onChange={(e) => {
                  markEdited();
                  setWhatYouNeed(e.target.value);
                }}
                className="w-full min-h-[60px] p-3 border border-line rounded-[11px] text-[13px] bg-slate-50 outline-none focus:border-[#d990a8]"
              />
            </div>

            {!isPrivateMode && (
              <div>
                <label className="block text-[12px] font-bold text-[#a55f78] mb-1">
                  Notes for Your Partner 💌
                </label>
                <p className="text-[11px] text-[#826f79] mb-2">
                  Saved securely and privately. Not sent automatically.
                </p>
                <textarea
                  value={husbandNote}
                  onChange={(e) => setHusbandNote(e.target.value)}
                  className="w-full min-h-[60px] p-3 border border-[#f4c2c2] bg-[#fff8fa] rounded-[11px] text-[13px] outline-none focus:border-[#d990a8]"
                />
              </div>
            )}

            <div>
              <label className="block text-[12px] font-bold text-muted mb-1">
                General daily note
              </label>
              <textarea
                value={generalNote}
                onChange={(e) => {
                  markEdited();
                  setGeneralNote(e.target.value);
                }}
                className="w-full min-h-[60px] p-3 border border-line rounded-[11px] text-[13px] bg-slate-50 outline-none focus:border-[#d990a8]"
              />
            </div>
          </div>
        </Accordion>

        {message && (
          <div className="mb-4 p-3 rounded-lg text-center font-bold text-[13px] bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2]">
            {message}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {isExistingLog && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 py-3.5 bg-white border border-red-200 text-red-500 font-bold text-[14px] rounded-[12px] hover:bg-red-50 transition-all shadow-sm flex justify-center items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex-[2] py-3.5 bg-ink text-white font-bold text-[14px] rounded-[12px] hover:bg-black transition-all shadow-md flex justify-center items-center gap-2 disabled:opacity-70"
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
    </div>
  );
}
