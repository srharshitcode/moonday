"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { format, subDays, addDays, parseISO, differenceInDays } from "date-fns";
import {
  Printer,
  AlertCircle,
  FileText,
  Activity,
  Calendar,
  UserCheck,
  Stethoscope,
  Clock,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  HeartPulse,
  ClipboardList,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  RotateCcw,
  Eye,
} from "lucide-react";

/**
 * Strictly excludes sexual desire, libido, intimacy, and intercourse-related terms
 * from all clinical outputs, symptom matrices, and diary rows.
 */
const SEXUAL_EXCLUSION_REGEX =
  /sex|libido|intima|orgasm|arousal|desire|intercourse|condom|erotic|sensual|lust|hookup|coit/i;

/**
 * Safely parses any Supabase array, JSON string, or escaped string (e.g. "[\][\]", "[]", "{}")
 * into a clean array of human-readable clinical labels with zero bracket artifacts.
 */
const parseClinicalList = (raw: unknown): string[] => {
  if (raw === null || raw === undefined) return [];

  if (Array.isArray(raw)) {
    return Array.from(
      new Set(
        raw
          .flatMap((item) => parseClinicalList(item))
          .filter(
            (item) => item.length > 0 && !SEXUAL_EXCLUSION_REGEX.test(item),
          ),
      ),
    );
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (
      !trimmed ||
      trimmed === "-" ||
      trimmed === "null" ||
      trimmed === "undefined"
    ) {
      return [];
    }

    if (
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith("{") && trimmed.endsWith("}"))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed !== raw) {
          return parseClinicalList(parsed);
        }
      } catch {
        // Fall through to aggressive sanitization if JSON is malformed
      }
    }

    const cleaned = trimmed
      .replace(/[\[\]{}"'\\]/g, "")
      .split(",")
      .map((s) => s.trim())
      .filter(
        (s) =>
          s.length > 0 &&
          s !== "-" &&
          s.toLowerCase() !== "null" &&
          s.toLowerCase() !== "none" &&
          !SEXUAL_EXCLUSION_REGEX.test(s),
      );

    return Array.from(new Set(cleaned));
  }

  return [];
};

/**
 * Extracts Flow Intensity, Cycle Color, Discharge, Cravings, and Activity from a daily log row.
 */
const extractDailyAttributes = (log: Record<string, any>) => {
  const flow = parseClinicalList(
    log.flow ?? log.flow_intensity ?? log.flow_level ?? log.bleeding_flow,
  );
  const color = parseClinicalList(
    log.flow_color ??
      log.period_color ??
      log.color ??
      log.blood_color ??
      log.colors,
  );
  const discharge = parseClinicalList(
    log.discharge ?? log.vaginal_discharge ?? log.cervical_mucus,
  );
  const cravings = parseClinicalList(
    log.cravings ?? log.food_cravings ?? log.appetite,
  );
  const activity = parseClinicalList(
    log.activity ?? log.exercise ?? log.physical_activity ?? log.activities,
  );

  return { flow, color, discharge, cravings, activity };
};

/**
 * Categorizes physical and affective symptoms into 8 OB-GYN Review of Systems (ROS) domains.
 */
const categorizeSymptomROS = (symptom: string): string => {
  const s = symptom.toLowerCase();
  if (
    /cramp|pelvi|ovary|uter|abdomin|backache|lower-back|bowel|spasm/.test(s)
  ) {
    return "Pelvic, Uterine & Abdominal";
  }
  if (
    /headache|migraine|brain fog|dizz|light-headed|tingl|numb|forget|sluggish|sensitivity to/.test(
      s,
    )
  ) {
    return "Neurological & Autonomic";
  }
  if (
    /stomach|indigest|heartburn|nausea|bloat|gurgling|appetite|constipat|diarrhea|digest/.test(
      s,
    )
  ) {
    return "Gastrointestinal & Metabolic";
  }
  if (
    /sleep|insomnia|waking|nightmare|vivid dream|fatigue|letharg|low energy|weakness|restless leg|oversleep/.test(
      s,
    )
  ) {
    return "Sleep, Energy & Circadian";
  }
  if (
    /hot flash|night sweat|sweat|chill|water retention|swollen|puffy|skin|acne|hair|eye|odor/.test(
      s,
    )
  ) {
    return "Vasomotor, Dermatological & Fluid";
  }
  if (/vagin|vulva|discharge|itch|dryness|urin/.test(s)) {
    return "Vulvovaginal & Urinary Tract";
  }
  if (
    /breast|joint|muscle|body ache|neck|shoulder|throat|cough|lymph|congest/.test(
      s,
    )
  ) {
    return "Musculoskeletal, Breast & Systemic";
  }
  return "Affective & Neuroendocrine";
};

/* ============================================================================
   COMPREHENSIVE CLINICAL DROPDOWN OPTIONS FOR OB-GYN INTAKE
============================================================================ */

const BLOOD_GROUP_CATEGORIES = [
  {
    group: "Standard ABO & Rh Typing",
    options: [
      "O Positive (O+)",
      "O Negative (O-)",
      "A Positive (A+)",
      "A Negative (A-)",
      "B Positive (B+)",
      "B Negative (B-)",
      "AB Positive (AB+)",
      "AB Negative (AB-)",
    ],
  },
  {
    group: "Clinical Subgroups & Rare Phenotypes",
    options: [
      "A1 Positive (A1+)",
      "A1 Negative (A1-)",
      "A2 Positive (A2+)",
      "A2 Negative (A2-)",
      "A1B Positive (A1B+)",
      "A2B Positive (A2B+)",
      "Bombay Phenotype (Oh / hh)",
      "Rh-Null (Golden Blood)",
      "Weak D / Du Positive",
    ],
  },
  {
    group: "Status",
    options: ["Unknown / Pending Lab Typing"],
  },
];

const CONTRACEPTIVE_CATEGORIES = [
  {
    group: "Non-Hormonal / Natural / None",
    options: [
      "None / Non-hormonal",
      "None — Actively Trying to Conceive (TTC)",
      "Fertility Awareness-Based Method (FABM / BBT / Ovulation Tracking)",
      "Barrier Method Only (Non-Hormonal)",
      "Lactational Amenorrhea Method (LAM)",
    ],
  },
  {
    group: "Combined Oral Contraceptive Pills (COCPs — Estrogen + Progestin)",
    options: [
      "COCP — Ethinylestradiol + Drospirenone (Yaz / Yasmin / Crisanta)",
      "COCP — Ethinylestradiol + Levonorgestrel (Ovral-L / Mala-N)",
      "COCP — Ethinylestradiol + Desogestrel (Novelon / Femilon)",
      "COCP — Ethinylestradiol + Cyproterone Acetate (Diane-35 / Ginette-35)",
      "COCP — Estradiol Valerate + Dienogest (Qlaira)",
      "COCP — Continuous / Extended Regimen",
    ],
  },
  {
    group: "Progestin-Only Oral Contraceptives & Centchroman",
    options: [
      "POP — Desogestrel 75 mcg (Cerazette)",
      "POP — Drospirenone 4 mg (Slynd)",
      "POP — Norethindrone 0.35 mg",
      "Therapeutic Progestin — Dienogest 2 mg (Endometriosis Regimen)",
      "Therapeutic Progestin — Medroxyprogesterone Acetate (Meprate / Provera)",
      "Therapeutic Progestin — Dydrogesterone 10 mg (Duphaston)",
      "Non-Steroidal SERM — Centchroman / Ormeloxifene (Saheli / Chhaya)",
    ],
  },
  {
    group: "Long-Acting Reversible Contraception (LARC — IUD / Implant)",
    options: [
      "Hormonal LNG-IUS — Mirena (52 mg Levonorgestrel)",
      "Hormonal LNG-IUS — Kyleena (19.5 mg Levonorgestrel)",
      "Hormonal LNG-IUS — Skyla / Jaydess (13.5 mg Levonorgestrel)",
      "Non-Hormonal Copper IUD — CuT 380A / ParaGard",
      "Non-Hormonal Copper IUD — Multiload Cu375",
      "Subdermal Implant — Etonogestrel 68 mg (Nexplanon / Implanon)",
    ],
  },
  {
    group: "Injectables, Rings, Patches & Permanent",
    options: [
      "Injectable — Depot Medroxyprogesterone Acetate (DMPA / Depo-Provera 3-Monthly)",
      "Vaginal Ring — Etonogestrel / Ethinylestradiol (NuvaRing)",
      "Transdermal Contraceptive Patch (Evra / Xulane)",
      "Emergency Contraceptive Used in Last 90 Days (Levonorgestrel / Ulipristal)",
      "Permanent — Bilateral Tubal Ligation / Salpingectomy",
    ],
  },
];

const MENARCHE_OPTIONS = [
  "Under 9 years (Precocious Menarche)",
  "9 years",
  "10 years",
  "11 years",
  "12 years",
  "13 years (Population Median)",
  "14 years",
  "15 years",
  "16 years",
  "17+ years (Delayed Menarche)",
  "Primary Amenorrhea Evaluation",
  "Not Recalled",
];

const OBSTETRIC_PARITY_OPTIONS = [
  "G0 P0 (Nulligravida / Nulliparous)",
  "G1 P0 (Primigravida — Currently Pregnant or Prior Loss)",
  "G1 P1 L1 (Primiparous — 1 Term Delivery, 1 Living)",
  "G2 P1 L1 (Multigravida — 1 Delivery, 1 Prior Loss)",
  "G2 P2 L2 (Multiparous — 2 Deliveries, 2 Living)",
  "G3 P2 L2 (Multiparous — 2 Deliveries, 1 Prior Loss)",
  "G3 P3 L3 (Multiparous — 3 Deliveries, 3 Living)",
  "Prior Lower Segment Cesarean Section (LSCS × 1)",
  "Prior Lower Segment Cesarean Section (LSCS × 2+)",
  "Postpartum (< 12 Months Since Delivery)",
  "Recurrent Pregnancy Loss (RPL) Evaluation",
  "Prefer Not to Specify",
];

const DYSMENORRHEA_GRADES = [ 
  "Grade 0 (VAS 0/10) — No Menstrual Pain / Eumenorrhea",
  "Grade 1 (VAS 1–3/10) — Mild Cramping, Rarely Requires Analgesics, Normal Activity",
  "Grade 2 (VAS 4–6/10) — Moderate Pain, Responds to OTC NSAIDs, Mild Activity Limitation",
  "Grade 3A (VAS 7–8/10) — Severe Pain, Systemic Symptoms (Nausea/Headache), Work/Study Impact",
  "Grade 3B (VAS 9–10/10) — Incapacitating Pain, Unresponsive to NSAIDs, Bed Rest Required",
];

const FLOW_CLOT_PROFILES = [
  "Normal Volume — Pads/Tampons Changed Every 4–6 Hours, No Significant Clots",
  "Light / Scanty Flow (Hypomenorrhea) — Minimal Pad Saturation",
  "Moderate-Heavy Flow — Passes Occasional Small Clots (< 1 cm / < 1 inch)",
  "Heavy Menstrual Bleeding (HMB / Menorrhagia) — Soaking Pad/Tampon Every 1–2 Hours",
  "Severe HMB with Large Clots (> 2.5 cm / Quarter-Sized) & Flooding",
  "Double Protection Required (Tampon + Pad) / Nocturnal Overflow",
  "Irregular Spotting Only / Brown Oxidized Discharge Predominant",
];

const PRIOR_WORKUP_OPTIONS = [
  "None — Initial Gynecological Evaluation",
  "Pelvic Ultrasound (TAS/TVS) — Normal Uterus & Bilateral Ovaries",
  "Pelvic Ultrasound (TAS/TVS) — Polycystic Ovarian Morphology (PCOM)",
  "Pelvic Ultrasound (TAS/TVS) — Uterine Fibroid (Leiomyoma) / Adenomyosis Noted",
  "Pelvic Ultrasound (TAS/TVS) — Ovarian Cyst / Endometrioma Noted",
  "Endocrine Lab Panel Done (TSH, Prolactin, LH/FSH, Testosterone, AMH)",
  "Hematology Panel Done (CBC, Serum Ferritin, Iron Studies, Coagulation)",
  "Both Pelvic Ultrasound & Hormone/Blood Panel Available for Review",
];

const LIFESTYLE_PROFILES = [
  "Non-Smoker • Non-Alcoholic • Regular Sleep (7–8 hrs)",
  "High Academic / Occupational Stress • Irregular Sleep (< 6 hrs / Shift Work)",
  "Sedentary Work Routine • Moderate Screen/Desk Hours",
  "Active Exercise Regimen (3–5x/week Strength or Cardio)",
  "High-Volume Athletic Training (Screen for Relative Energy Deficiency / RED-S)",
  "Recent Significant Weight Change (± 5 kg in Last 6 Months)",
];

const CHIEF_COMPLAINT_TEMPLATES = [
  "Routine 90-day menstrual cycle, flow, and multi-system symptom evaluation.",
  "Evaluation of Severe Dysmenorrhea (Pelvic Pain) and Luteal Phase Symptom Burden.",
  "Irregular Menstrual Cycles (Oligomenorrhea / Polymenorrhea) & Ovulatory Assessment.",
  "Heavy Menstrual Bleeding (Menorrhagia), Clot Passage, and Fatigue / Anemia Screening.",
  "Suspected Polycystic Ovary Syndrome (PCOS) — Cycle Length, Acne, Hair, and Metabolic Review.",
  "Suspected Endometriosis / Adenomyosis — Chronic Pelvic Pain, Dyschezia, and Backache.",
  "Premenstrual Syndrome (PMS) / PMDD — Severe Luteal Affective & Somatic Symptom Clustering.",
  "Intermenstrual Spotting, Abnormal Vaginal Discharge, or Vulvovaginal Discomfort.",
  "Pre-Conception / Fertility Readiness & Ovulatory Window Confirmation.",
  "Contraceptive Counseling, Initiation, or Side-Effect Review.",
  "Perimenopausal Transition — Cycle Variability, Vasomotor Hot Flashes, and Sleep Disruption.",
  "Follow-up Review of Ongoing Gynecological / Endocrine Treatment Regimen.",
];

const KNOWN_CONDITION_PRESETS = [
  "PCOS (Polycystic Ovary Syndrome)",
  "Endometriosis",
  "Adenomyosis",
  "Uterine Fibroids (Leiomyomas)",
  "Primary Dysmenorrhea",
  "PMDD / Severe PMS",
  "Hypothyroidism / Hashimoto's",
  "Hyperprolactinemia",
  "Iron-Deficiency Anemia",
  "Insulin Resistance",
  "Ovarian Cyst History",
  "Migraine with/without Aura",
  "IBS / GI Sensitivity",
  "Chronic Pelvic Pain",
];

const MEDICATION_PRESETS = [
  "Mefenamic Acid (Meftal-Spas)",
  "Ibuprofen / Naproxen (NSAID)",
  "Tranexamic Acid (Anti-fibrinolytic)",
  "Drotaverine HCl",
  "Myo-Inositol + D-Chiro-Inositol",
  "Metformin HCl",
  "Levothyroxine (Thyronorm/Eltroxin)",
  "Oral Iron + Folic Acid",
  "Vitamin D3 (Cholecalciferol)",
  "Magnesium Glycinate",
  "Vitamin B-Complex / B12",
  "Omega-3 Fatty Acids",
  "Evening Primrose Oil",
  "Spironolactone",
];

const FAMILY_HISTORY_PRESETS = [
  "No Significant Family History",
  "Maternal / Sister PCOS",
  "Endometriosis / Severe Dysmenorrhea",
  "Uterine Fibroids / Hysterectomy",
  "Thyroid Disorder (Hypo/Hyper)",
  "Type 2 Diabetes Mellitus",
  "Early Menopause / POI (<40 yrs)",
  "Bleeding / Clotting Disorder",
  "Breast or Ovarian Malignancy",
];

interface PatientIntakeDetails {
  fullName: string;
  ageOrDob: string;
  bloodGroup: string;
  heightCm: string;
  weightKg: string;
  menarcheAge: string;
  gravidaPara: string;
  contraception: string;
  dysmenorrheaGrade: string;
  flowClotProfile: string;
  priorWorkup: string;
  lifestyleProfile: string;
  knownConditions: string[];
  customCondition: string;
  currentMedications: string[];
  customMedication: string;
  familyHistory: string[];
  attendingPhysician: string;
  clinicHospitalName: string;
  chiefComplaint: string;
  reportWindowDays: number;
}

const DEFAULT_INTAKE: PatientIntakeDetails = {
  fullName: "",
  ageOrDob: "",
  bloodGroup: "O Positive (O+)",
  heightCm: "",
  weightKg: "",
  menarcheAge: "13 years (Population Median)",
  gravidaPara: "G0 P0 (Nulligravida / Nulliparous)",
  contraception: "None / Non-hormonal",
  dysmenorrheaGrade:
    "Grade 2 (VAS 4–6/10) — Moderate Pain, Responds to OTC NSAIDs, Mild Activity Limitation",
  flowClotProfile:
    "Normal Volume — Pads/Tampons Changed Every 4–6 Hours, No Significant Clots",
  priorWorkup: "None — Initial Gynecological Evaluation",
  lifestyleProfile: "Non-Smoker • Non-Alcoholic • Regular Sleep (7–8 hrs)",
  knownConditions: [],
  customCondition: "",
  currentMedications: [],
  customMedication: "",
  familyHistory: ["No Significant Family History"],
  attendingPhysician: "",
  clinicHospitalName: "",
  chiefComplaint:
    "Routine 90-day menstrual cycle, flow, and multi-system symptom evaluation.",
  reportWindowDays: 90,
};

export default function MedicalReportPage() {
  const [loading, setLoading] = useState(true);
  const [showIntakeEditor, setShowIntakeEditor] = useState(true);
  const [viewMode, setViewMode] = useState<"both" | "doctor" | "patient">(
    "both",
  );
  const [userAuth, setUserAuth] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [intake, setIntake] = useState<PatientIntakeDetails>(DEFAULT_INTAKE);

  const supabase = createClient();
  const reportEndDate = useMemo(() => new Date(), []);
  const reportStartDate = useMemo(
    () => subDays(reportEndDate, intake.reportWindowDays || 90),
    [reportEndDate, intake.reportWindowDays],
  );

  // Load saved intake preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("moonday_clinical_intake_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        setIntake((prev) => ({
          ...prev,
          ...parsed,
          knownConditions: Array.isArray(parsed.knownConditions)
            ? parsed.knownConditions
            : prev.knownConditions,
          currentMedications: Array.isArray(parsed.currentMedications)
            ? parsed.currentMedications
            : prev.currentMedications,
          familyHistory: Array.isArray(parsed.familyHistory)
            ? parsed.familyHistory
            : prev.familyHistory,
        }));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const updateIntakeField = <K extends keyof PatientIntakeDetails>(
    field: K,
    value: PatientIntakeDetails[K],
  ) => {
    setIntake((prev) => {
      const updated = { ...prev, [field]: value };
      try {
        localStorage.setItem(
          "moonday_clinical_intake_v2",
          JSON.stringify(updated),
        );
      } catch {
        // Ignore storage errors
      }
      return updated;
    });
  };

  const toggleArrayItem = (
    field: "knownConditions" | "currentMedications" | "familyHistory",
    item: string,
  ) => {
    const current = intake[field];
    const exists = current.includes(item);
    const next = exists
      ? current.filter((i) => i !== item)
      : [...current.filter((i) => i !== "No Significant Family History"), item];
    updateIntakeField(field, next);
  };

  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserAuth(user);

      const { data: userProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (userProfile) {
        setProfile(userProfile);
        setIntake((prev) => ({
          ...prev,
          fullName:
            prev.fullName ||
            userProfile.full_name ||
            userProfile.display_name ||
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "",
          ageOrDob:
            prev.ageOrDob || userProfile.age || userProfile.date_of_birth || "",
        }));
      }

      const maxLookback = format(subDays(new Date(), 180), "yyyy-MM-dd");
      const { data: recentLogs } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("log_date", maxLookback)
        .order("log_date", { ascending: false });

      if (recentLogs) {
        setAllLogs(recentLogs);
      }
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  // Filter logs to the selected observation window (30, 60, 90, or 180 days)
  const logs = useMemo(() => {
    const cutoff = format(reportStartDate, "yyyy-MM-dd");
    return allLogs.filter((l) => l.log_date >= cutoff);
  }, [allLogs, reportStartDate]);

  // Compute strict clinical cycle metrics
  const stats = useMemo(() => {
    const starts = logs
      .filter((l) => l.is_period_start)
      .map((l) => l.log_date)
      .sort();

    const cycles: number[] = [];
    for (let i = 1; i < starts.length; i++) {
      const diff = differenceInDays(
        parseISO(starts[i]),
        parseISO(starts[i - 1]),
      );
      if (diff > 0) cycles.push(diff);
    }

    const chronologicalLogs = [...logs].sort((a, b) =>
      a.log_date.localeCompare(b.log_date),
    );
    const durations: number[] = [];
    let activeStart: string | null = null;
    for (const entry of chronologicalLogs) {
      if (entry.is_period_start) activeStart = entry.log_date;
      if (entry.is_period_end && activeStart) {
        const dur =
          differenceInDays(parseISO(entry.log_date), parseISO(activeStart)) + 1;
        if (dur >= 1 && dur <= 15) durations.push(dur);
        activeStart = null;
      }
    }

    const fallbackCycle = profile?.cycle_length || 28;
    const avgCycle =
      cycles.length > 0
        ? Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length)
        : fallbackCycle;
    const minCycle = cycles.length > 0 ? Math.min(...cycles) : avgCycle;
    const maxCycle = cycles.length > 0 ? Math.max(...cycles) : avgCycle;

    const cycleStdDev =
      cycles.length > 1
        ? Number(
            Math.sqrt(
              cycles.reduce(
                (acc, val) => acc + Math.pow(val - avgCycle, 2),
                0,
              ) / cycles.length,
            ).toFixed(1),
          )
        : 0;

    const avgDuration =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : profile?.period_length || 5;

    const spottingDaysCount = logs.filter((l) => l.is_spotting).length;
    const activeBleedDaysCount = logs.filter(
      (l) =>
        l.is_period_start ||
        l.is_period_end ||
        parseClinicalList(l.flow ?? l.flow_intensity).length > 0,
    ).length;

    const lmpDate = starts.length > 0 ? starts[starts.length - 1] : null;
    const estimatedNextPeriod = lmpDate
      ? format(addDays(parseISO(lmpDate), avgCycle), "yyyy-MM-dd")
      : null;
    const estimatedOvulation = lmpDate
      ? format(
          addDays(parseISO(lmpDate), Math.max(1, avgCycle - 14)),
          "yyyy-MM-dd",
        )
      : null;

    return {
      avgCycle,
      minCycle,
      maxCycle,
      cycleStdDev,
      cycleVariance: maxCycle - minCycle,
      avgDuration,
      lmpDate,
      estimatedNextPeriod,
      estimatedOvulation,
      confirmedCyclesCount: starts.length,
      spottingDaysCount,
      activeBleedDaysCount,
      sortedStarts: starts,
    };
  }, [logs, profile]);

  const getCycleDayAndPhase = (
    logDateStr: string,
  ): { cd: number | null; phase: string } => {
    let latestStart: string | null = null;
    for (const startStr of stats.sortedStarts) {
      if (startStr <= logDateStr) {
        latestStart = startStr;
      } else {
        break;
      }
    }
    if (!latestStart) return { cd: null, phase: "Unmapped" };
    const cd =
      differenceInDays(parseISO(logDateStr), parseISO(latestStart)) + 1;
    if (cd < 1 || cd > 60) return { cd: null, phase: "Unmapped" };

    if (cd <= stats.avgDuration) return { cd, phase: "Menstrual" };
    if (cd <= 12) return { cd, phase: "Follicular" };
    if (cd <= 16) return { cd, phase: "Ovulatory" };
    return { cd, phase: "Luteal" };
  };

  // Comprehensive OB-GYN Review of Systems (ROS), Phase Distribution & Top Symptoms
  const clinicalAnalysis = useMemo(() => {
    const symptomCounts: Record<string, number> = {};
    const moodCounts: Record<string, number> = {};
    const rosBuckets: Record<string, Record<string, number>> = {};
    const phaseSymptomLoad: Record<string, number> = {
      Menstrual: 0,
      Follicular: 0,
      Ovulatory: 0,
      Luteal: 0,
    };
    const colorCounts: Record<string, number> = {};
    const dischargeCounts: Record<string, number> = {};
    const cravingCounts: Record<string, number> = {};

    let daysWithPhysicalSymptoms = 0;
    let daysWithMoodLogs = 0;

    logs.forEach((log) => {
      const syms = parseClinicalList(log.symptoms ?? log.physical_symptoms);
      const moods = parseClinicalList(log.moods ?? log.mood);
      const { color, discharge, cravings } = extractDailyAttributes(log);
      const { phase } = getCycleDayAndPhase(log.log_date);

      if (syms.length > 0) daysWithPhysicalSymptoms++;
      if (moods.length > 0) daysWithMoodLogs++;

      if (phase in phaseSymptomLoad) {
        phaseSymptomLoad[phase] += syms.length + moods.length;
      }

      syms.forEach((s) => {
        symptomCounts[s] = (symptomCounts[s] || 0) + 1;
        const category = categorizeSymptomROS(s);
        if (!rosBuckets[category]) rosBuckets[category] = {};
        rosBuckets[category][s] = (rosBuckets[category][s] || 0) + 1;
      });

      moods.forEach((m) => {
        moodCounts[m] = (moodCounts[m] || 0) + 1;
        const category = "Affective & Neuroendocrine";
        if (!rosBuckets[category]) rosBuckets[category] = {};
        rosBuckets[category][m] = (rosBuckets[category][m] || 0) + 1;
      });

      color.forEach((c) => {
        colorCounts[c] = (colorCounts[c] || 0) + 1;
      });
      discharge.forEach((d) => {
        dischargeCounts[d] = (dischargeCounts[d] || 0) + 1;
      });
      cravings.forEach((cr) => {
        cravingCounts[cr] = (cravingCounts[cr] || 0) + 1;
      });
    });

    const topSymptoms = Object.entries(symptomCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);

    const topMoods = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const topColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
    const topDischarge = Object.entries(dischargeCounts).sort(
      (a, b) => b[1] - a[1],
    );
    const topCravings = Object.entries(cravingCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    const totalPhaseMarkers =
      Object.values(phaseSymptomLoad).reduce((a, b) => a + b, 0) || 1;

    return {
      topSymptoms,
      topMoods,
      rosBuckets,
      phaseSymptomLoad,
      totalPhaseMarkers,
      topColors,
      topDischarge,
      topCravings,
      daysWithPhysicalSymptoms,
      daysWithMoodLogs,
    };
  }, [logs, stats.sortedStarts, stats.avgDuration]);

  // Confirmed Menstrual Episodes Table
  const confirmedEpisodes = useMemo(() => {
    const chronological = [...logs].sort((a, b) =>
      a.log_date.localeCompare(b.log_date),
    );
    const episodes: {
      startDate: string;
      endDate: string | null;
      durationDays: number | null;
      cycleLengthToNext: number | null;
      peakFlow: string;
      colorsObserved: string;
    }[] = [];

    for (let i = 0; i < chronological.length; i++) {
      if (chronological[i].is_period_start) {
        const start = chronological[i].log_date;
        let end: string | null = null;
        const flowsInEpisode: string[] = [];
        const colorsInEpisode: string[] = [];

        for (let j = i; j < chronological.length; j++) {
          const { flow, color } = extractDailyAttributes(chronological[j]);
          flowsInEpisode.push(...flow);
          colorsInEpisode.push(...color);

          if (chronological[j].is_period_end) {
            end = chronological[j].log_date;
            break;
          }
          if (j > i && chronological[j].is_period_start) break;
        }

        const durationDays = end
          ? differenceInDays(parseISO(end), parseISO(start)) + 1
          : null;

        episodes.push({
          startDate: start,
          endDate: end,
          durationDays,
          cycleLengthToNext: null,
          peakFlow:
            Array.from(new Set(flowsInEpisode)).slice(0, 2).join(", ") ||
            "Standard",
          colorsObserved:
            Array.from(new Set(colorsInEpisode)).slice(0, 3).join(", ") ||
            "Typical",
        });
      }
    }

    for (let i = 0; i < episodes.length - 1; i++) {
      episodes[i].cycleLengthToNext = differenceInDays(
        parseISO(episodes[i + 1].startDate),
        parseISO(episodes[i].startDate),
      );
    }

    return episodes.reverse();
  }, [logs]);

  // BMI & Clinical Flag Calculation
  const computedBmi = useMemo(() => {
    const h = parseFloat(intake.heightCm);
    const w = parseFloat(intake.weightKg);
    if (h > 50 && w > 20) {
      const m = h / 100;
      const bmi = w / (m * m);
      let category = "Normal";
      if (bmi < 18.5) category = "Underweight";
      else if (bmi >= 25 && bmi < 30) category = "Overweight";
      else if (bmi >= 30) category = "Obese";
      return `${bmi.toFixed(1)} kg/m² (${category})`;
    }
    return null;
  }, [intake.heightCm, intake.weightKg]);

  // Automated Clinical Triage Flags for the OB-GYN Doctor & Patient Questions
  const clinicalDecisionSupport = useMemo(() => {
    const flags: {
      title: string;
      severity: "normal" | "review" | "alert";
      detail: string;
    }[] = [];
    const patientQuestions: string[] = [];

    if (stats.avgCycle < 24) {
      flags.push({
        title: "Frequent Menstrual Cycles (< 24 Days — FIGO Polymenorrhea)",
        severity: "alert",
        detail: `Mean cycle length is ${stats.avgCycle} days (FIGO normal range: 24–38 days). Evaluate luteal phase adequacy, thyroid function (TSH), and ovulatory status.`,
      });
      patientQuestions.push(
        `My average cycle is ${stats.avgCycle} days (<24 days). Should we check my luteal phase progesterone or thyroid levels?`,
      );
    } else if (stats.avgCycle > 38) {
      flags.push({
        title: "Infrequent Menstrual Cycles (> 38 Days — FIGO Oligomenorrhea)",
        severity: "alert",
        detail: `Mean cycle length is ${stats.avgCycle} days (FIGO normal range: 24–38 days). Screen for oligo-ovulation, PCOS (Rotterdam criteria), hyperprolactinemia, or thyroid dysfunction.`,
      });
      patientQuestions.push(
        `My cycles average ${stats.avgCycle} days. Could delayed ovulation or hormone imbalance be extending my cycle?`,
      );
    } else {
      flags.push({
        title: "Normal Menstrual Frequency (FIGO 24–38 Days)",
        severity: "normal",
        detail: `Mean cycle length of ${stats.avgCycle} days falls within normal FIGO reproductive parameters.`,
      });
    }

    if (stats.cycleVariance > 7) {
      flags.push({
        title: `Elevated Cycle-to-Cycle Variability (Δ ${stats.cycleVariance} Days)`,
        severity: "review",
        detail: `Cycle length ranged from ${stats.minCycle} to ${stats.maxCycle} days (σ=${stats.cycleStdDev}d), exceeding the ≤7-day FIGO regularity threshold.`,
      });
      patientQuestions.push(
        `My cycle length varies by ${stats.cycleVariance} days between months. What factors could be shifting my ovulation timing?`,
      );
    }

    if (stats.avgDuration > 8 || intake.flowClotProfile.includes("Heavy")) {
      flags.push({
        title:
          "Heavy or Prolonged Menstrual Bleeding (HMB / Menorrhagia Screen)",
        severity: "alert",
        detail: `Mean bleed duration is ${stats.avgDuration} days with reported profile: "${intake.flowClotProfile.split("—")[0].trim()}". Recommend CBC, Serum Ferritin, and pelvic USG.`,
      });
      patientQuestions.push(
        "Given my bleeding volume/duration, should I get a Complete Blood Count (CBC) and Serum Ferritin test to rule out iron deficiency?",
      );
    }

    if (
      intake.dysmenorrheaGrade.includes("Grade 3") ||
      intake.dysmenorrheaGrade.includes("Grade 2")
    ) {
      flags.push({
        title: `Moderate-to-Severe Dysmenorrhea (${intake.dysmenorrheaGrade.split("—")[0].trim()})`,
        severity: intake.dysmenorrheaGrade.includes("Grade 3")
          ? "alert"
          : "review",
        detail: `Patient reports ${intake.dysmenorrheaGrade}. Correlate with pelvic symptoms to differentiate primary prostaglandin-mediated dysmenorrhea from secondary causes.`,
      });
      patientQuestions.push(
        "What targeted pain management or anti-inflammatory protocol do you recommend for my menstrual cramping?",
      );
    }

    if (clinicalAnalysis.topSymptoms.length > 0) {
      const topThree = clinicalAnalysis.topSymptoms
        .slice(0, 3)
        .map(([s, c]) => `${s} (${c}d)`)
        .join(", ");
      patientQuestions.push(
        `My most frequent logged symptoms over the last ${intake.reportWindowDays} days are ${topThree}. How do these relate to my hormonal cycle?`,
      );
    }

    if (patientQuestions.length === 0) {
      patientQuestions.push(
        "Are my cycle length, bleed duration, and symptom patterns optimal for my age and reproductive goals?",
      );
    }

    return { flags, patientQuestions };
  }, [stats, intake, clinicalAnalysis]);

  const patientName =
    intake.fullName ||
    profile?.full_name ||
    profile?.display_name ||
    userAuth?.user_metadata?.full_name ||
    userAuth?.email?.split("@")[0] ||
    "Registered Patient";

  const patientEmail = profile?.email || userAuth?.email || "On File";
  const reportId = `MD-OBGYN-${format(reportEndDate, "yyyyMMdd")}-${(
    userAuth?.id || "0000"
  )
    .slice(0, 6)
    .toUpperCase()}`;

  const combinedConditions = [
    ...intake.knownConditions,
    ...(intake.customCondition.trim() ? [intake.customCondition.trim()] : []),
  ];
  const combinedMedications = [
    ...intake.currentMedications,
    ...(intake.customMedication.trim() ? [intake.customMedication.trim()] : []),
  ];

  const isFigoLengthNormal = stats.avgCycle >= 24 && stats.avgCycle <= 38;
  const isFigoRegular = stats.cycleVariance <= 7;
  const isFigoDurationNormal = stats.avgDuration <= 8;

  /**
   * Dedicated Standalone A4 PDF Print Generator:
   * Opens a clean print window containing ONLY the clinical dossier with fixed A4 CSS tables
   * so the app sidebar, scrollbars, and responsive breakpoints never break the PDF layout.
   */
  const handlePrint = () => {
    const printNode = document.getElementById("moonday-clinical-dossier-sheet");
    if (!printNode) {
      window.print();
      return;
    }

    const printWindow = window.open("", "_blank", "width=1024,height=900");
    if (!printWindow) {
      window.print();
      return;
    }

    const styles = Array.from(
      document.querySelectorAll('style, link[rel="stylesheet"]'),
    )
      .map((el) => el.outerHTML)
      .join("\n");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${patientName} - OB-GYN Clinical Report (${reportId})</title>
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 11mm;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #0f172a !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
              font-size: 11px !important;
              line-height: 1.4 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-sheet-wrapper {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
              page-break-inside: auto;
            }
            tr, .avoid-break {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            thead {
              display: table-header-group !important;
            }
            /* Force multi-column grids to stay horizontal on A4 PDF width */
            .pdf-grid-4 {
              display: grid !important;
              grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            }
            .pdf-grid-3 {
              display: grid !important;
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            }
            .pdf-grid-2 {
              display: grid !important;
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
          </style>
        </head>
        <body>
          <div class="print-sheet-wrapper">
            ${printNode.innerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
                window.close();
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm font-medium">
        Compiling comprehensive OB-GYN clinical dossier...
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1060px] mx-auto my-2 md:my-6 px-3 md:px-6 print:m-0 print:p-0 print:max-w-none">
      {/* Fallback Global Print Rules if popup is blocked */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 11mm;
          }
          html,
          body {
            background: #ffffff !important;
            color: #0f172a !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          aside,
          nav,
          header,
          .print-hide {
            display: none !important;
          }
          main,
          div {
            overflow: visible !important;
          }
          .pdf-grid-4 {
            display: grid !important;
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
          .pdf-grid-3 {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
          .pdf-grid-2 {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          tr,
          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          thead {
            display: table-header-group !important;
          }
        }
      `}</style>

      {/* =====================================================================
          SCREEN-ONLY TOP CONTROL BAR & ADVANCED DROPDOWN INTAKE BUILDER
      ===================================================================== */}
      <div className="print-hide mb-6 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Top Toolbar */}
        <div className="p-4 sm:p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Stethoscope className="w-5 h-5 text-rose-400" />
              <h2 className="text-lg font-bold tracking-tight">
                OB-GYN Clinical Dossier & Patient Diagnostic Suite
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                FIGO AUB-M & ACOG Aligned
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Customize your clinical intake with medical dropdowns below,
              switch between Patient and Doctor perspectives, and export a
              precision A4 PDF.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Perspective Mode Switcher */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("both")}
                className={`px-2.5 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  viewMode === "both"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Full Chart
              </button>
              <button
                type="button"
                onClick={() => setViewMode("doctor")}
                className={`px-2.5 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  viewMode === "doctor"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Doctor View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("patient")}
                className={`px-2.5 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  viewMode === "patient"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Patient View
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowIntakeEditor((prev) => !prev)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 text-slate-100 rounded-lg text-xs font-semibold hover:bg-slate-700 transition-all cursor-pointer border border-slate-600"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-rose-400" />
              {showIntakeEditor
                ? "Hide Intake Dropdowns"
                : "Edit Clinical Intake"}
              {showIntakeEditor ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-500 transition-all cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" /> Export A4 Doctor PDF
            </button>
          </div>
        </div>

        {/* Collapsible Comprehensive Dropdown & Multi-Select Clinical Intake Drawer */}
        {showIntakeEditor && (
          <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Pre-Consultation Clinical Intake & Medical Dropdown Selector
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-600 font-semibold">
                    Report Window:
                  </span>
                  <select
                    value={intake.reportWindowDays}
                    onChange={(e) =>
                      updateIntakeField(
                        "reportWindowDays",
                        Number(e.target.value),
                      )
                    }
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded-md font-bold text-slate-900 text-xs"
                  >
                    <option value={30}>Last 30 Days (1 Month)</option>
                    <option value={60}>Last 60 Days (2 Months)</option>
                    <option value={90}>
                      Last 90 Days (Standard OB-GYN Quarter)
                    </option>
                    <option value={180}>
                      Last 180 Days (6-Month Longitudinal)
                    </option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("moonday_clinical_intake_v2");
                    setIntake({
                      ...DEFAULT_INTAKE,
                      fullName: patientName,
                    });
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset Defaults
                </button>
              </div>
            </div>

            {/* Row 1: Demographics, Blood Group Dropdown, Anthropometrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Patient Full Name
                </label>
                <input
                  type="text"
                  value={intake.fullName}
                  onChange={(e) =>
                    updateIntakeField("fullName", e.target.value)
                  }
                  placeholder="Enter Patient Full Name"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Age / Date of Birth
                </label>
                <input
                  type="text"
                  value={intake.ageOrDob}
                  onChange={(e) =>
                    updateIntakeField("ageOrDob", e.target.value)
                  }
                  placeholder="e.g. 24 yrs (14 May 2002)"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Blood Group & Rh Factor
                </label>
                <select
                  value={intake.bloodGroup}
                  onChange={(e) =>
                    updateIntakeField("bloodGroup", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-slate-900 cursor-pointer"
                >
                  {BLOOD_GROUP_CATEGORIES.map((cat) => (
                    <optgroup key={cat.group} label={cat.group}>
                      {cat.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={intake.heightCm}
                    onChange={(e) =>
                      updateIntakeField("heightCm", e.target.value)
                    }
                    placeholder="164"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={intake.weightKg}
                    onChange={(e) =>
                      updateIntakeField("weightKg", e.target.value)
                    }
                    placeholder="58"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Contraceptive Method Dropdown, Menarche Dropdown, Obstetric Parity Dropdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Contraceptive Method / Hormonal Regimen
                </label>
                <select
                  value={intake.contraception}
                  onChange={(e) =>
                    updateIntakeField("contraception", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-slate-900 cursor-pointer"
                >
                  {CONTRACEPTIVE_CATEGORIES.map((cat) => (
                    <optgroup key={cat.group} label={cat.group}>
                      {cat.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Age at Menarche (First Period)
                </label>
                <select
                  value={intake.menarcheAge}
                  onChange={(e) =>
                    updateIntakeField("menarcheAge", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-slate-900 cursor-pointer"
                >
                  {MENARCHE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Obstetric Parity (Gravida / Para Status)
                </label>
                <select
                  value={intake.gravidaPara}
                  onChange={(e) =>
                    updateIntakeField("gravidaPara", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-slate-900 cursor-pointer"
                >
                  {OBSTETRIC_PARITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Dysmenorrhea Pain Scale, Flow/Clot Profile, Prior Workup, Lifestyle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Dysmenorrhea (Menstrual Pain) Clinical Severity Scale
                </label>
                <select
                  value={intake.dysmenorrheaGrade}
                  onChange={(e) =>
                    updateIntakeField("dysmenorrheaGrade", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-slate-900 cursor-pointer"
                >
                  {DYSMENORRHEA_GRADES.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Menstrual Flow Volume & Clot Passage Profile
                </label>
                <select
                  value={intake.flowClotProfile}
                  onChange={(e) =>
                    updateIntakeField("flowClotProfile", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-slate-900 cursor-pointer"
                >
                  {FLOW_CLOT_PROFILES.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Prior Ultrasound / Laboratory Workup Status
                </label>
                <select
                  value={intake.priorWorkup}
                  onChange={(e) =>
                    updateIntakeField("priorWorkup", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-slate-900 cursor-pointer"
                >
                  {PRIOR_WORKUP_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Sleep, Stress & Systemic Lifestyle Profile
                </label>
                <select
                  value={intake.lifestyleProfile}
                  onChange={(e) =>
                    updateIntakeField("lifestyleProfile", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-slate-900 cursor-pointer"
                >
                  {LIFESTYLE_PROFILES.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 4: Interactive Multi-Select Chips for Known Conditions & Medications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="bg-white border border-slate-200 rounded-lg p-3.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Known Gynecological / Endocrine Conditions (Click to Select)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {KNOWN_CONDITION_PRESETS.map((cond) => {
                    const active = intake.knownConditions.includes(cond);
                    return (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => toggleArrayItem("knownConditions", cond)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer border ${
                          active
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {active ? `✓ ${cond}` : `+ ${cond}`}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={intake.customCondition}
                  onChange={(e) =>
                    updateIntakeField("customCondition", e.target.value)
                  }
                  placeholder="Or type additional diagnosis / condition..."
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900"
                />
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-3.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Current Medications & Supplements (Click to Select)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {MEDICATION_PRESETS.map((med) => {
                    const active = intake.currentMedications.includes(med);
                    return (
                      <button
                        key={med}
                        type="button"
                        onClick={() =>
                          toggleArrayItem("currentMedications", med)
                        }
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer border ${
                          active
                            ? "bg-rose-700 text-white border-rose-700"
                            : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {active ? `✓ ${med}` : `+ ${med}`}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={intake.customMedication}
                  onChange={(e) =>
                    updateIntakeField("customMedication", e.target.value)
                  }
                  placeholder="Or type additional medication with dosage..."
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900"
                />
              </div>
            </div>

            {/* Row 5: Family History Chips + Doctor / Hospital + Chief Complaint Dropdown */}
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Family Gynecological & Endocrine History (Click to Select)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {FAMILY_HISTORY_PRESETS.map((fh) => {
                    const active = intake.familyHistory.includes(fh);
                    return (
                      <button
                        key={fh}
                        type="button"
                        onClick={() => toggleArrayItem("familyHistory", fh)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer border ${
                          active
                            ? "bg-slate-800 text-white border-slate-800"
                            : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {active ? `✓ ${fh}` : `+ ${fh}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Attending OB-GYN Doctor Name
                  </label>
                  <input
                    type="text"
                    value={intake.attendingPhysician}
                    onChange={(e) =>
                      updateIntakeField("attendingPhysician", e.target.value)
                    }
                    placeholder="e.g. Dr. Meera Verma, MD, DNB (OB-GYN)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Hospital / Women&apos;s Clinic Name
                  </label>
                  <input
                    type="text"
                    value={intake.clinicHospitalName}
                    onChange={(e) =>
                      updateIntakeField("clinicHospitalName", e.target.value)
                    }
                    placeholder="e.g. Apollo Cradle / City Women's Clinic"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Quick-Select Reason for Consultation Template
                  </label>
                  <select
                    value={
                      CHIEF_COMPLAINT_TEMPLATES.includes(intake.chiefComplaint)
                        ? intake.chiefComplaint
                        : ""
                    }
                    onChange={(e) => {
                      if (e.target.value) {
                        updateIntakeField("chiefComplaint", e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold cursor-pointer"
                  >
                    <option value="">
                      -- Choose Clinical Reason Template --
                    </option>
                    {CHIEF_COMPLAINT_TEMPLATES.map((tpl) => (
                      <option key={tpl} value={tpl}>
                        {tpl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Primary Chief Complaint / Consultation Note (Printed on
                  Report)
                </label>
                <input
                  type="text"
                  value={intake.chiefComplaint}
                  onChange={(e) =>
                    updateIntakeField("chiefComplaint", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          PRINTABLE A4 HOSPITAL-GRADE OB-GYN DOSSIER SHEET
      ===================================================================== */}
      <div
        id="moonday-clinical-dossier-sheet"
        className="bg-white text-slate-900 border border-slate-300 rounded-xl p-5 sm:p-8 md:p-10 shadow-sm print:border-0 print:shadow-none print:p-0"
      >
        {/* DOCUMENT MASTHEAD */}
        <div className="border-b-2 border-slate-900 pb-4 mb-5 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 bg-slate-900 text-white rounded-xs">
                MoonDay Clinical EHR
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Obstetrics & Gynecology Diagnostic Dossier
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 uppercase mt-1.5">
              Patient Menstrual, Endocrine & Multi-System Clinical Chart
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Observation Window:{" "}
              <span className="font-bold text-slate-900">
                {format(reportStartDate, "MMMM d, yyyy")} –{" "}
                {format(reportEndDate, "MMMM d, yyyy")} (
                {intake.reportWindowDays} Days)
              </span>
              {intake.clinicHospitalName && (
                <span>
                  {" "}
                  • Facility:{" "}
                  <strong className="text-slate-900">
                    {intake.clinicHospitalName}
                  </strong>
                </span>
              )}
            </p>
          </div>

          <div className="text-left sm:text-right text-[11px] space-y-0.5 bg-slate-50 p-3 rounded-lg border border-slate-300 min-w-[240px] shrink-0">
            <div>
              <span className="text-slate-500 font-medium">Chart Ref:</span>{" "}
              <span className="font-mono font-bold text-slate-900">
                {reportId}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Issued:</span>{" "}
              <span className="font-semibold text-slate-900">
                {format(reportEndDate, "MMM d, yyyy")}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">
                Logged Entries:
              </span>{" "}
              <span className="font-bold text-slate-900">
                {logs.length} days recorded
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Protocol:</span>{" "}
              <span className="font-semibold text-slate-800">
                FIGO AUB System 1
              </span>
            </div>
          </div>
        </div>

        {/* SECTION I: PATIENT DEMOGRAPHICS, OBSTETRIC PARITY & CLINICAL INTAKE */}
        <div className="mb-5 avoid-break">
          <div className="flex items-center justify-between bg-slate-900 text-white px-3 py-1.5 rounded-t-md">
            <h3 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              Section I — Patient Demographics, Obstetric Parity & Gynecological
              Intake
            </h3>
            <span className="text-[10px] text-slate-300 font-mono">
              PATIENT & CLINICIAN RECORD
            </span>
          </div>

          <div className="border border-t-0 border-slate-300 rounded-b-md bg-white text-xs">
            {/* 4-Column Fixed Clinical Grid */}
            <div className="pdf-grid-4 grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 border-b border-slate-200">
              <div className="p-2.5">
                <div className="text-[10px] font-bold uppercase text-slate-500">
                  Patient Full Name
                </div>
                <div className="font-extrabold text-slate-900 text-sm mt-0.5 break-words">
                  {patientName}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                  {patientEmail}
                </div>
              </div>

              <div className="p-2.5">
                <div className="text-[10px] font-bold uppercase text-slate-500">
                  Age / DOB & Blood Group
                </div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {intake.ageOrDob || "Adult Female"} •{" "}
                  <span className="px-1.5 py-0.5 bg-rose-50 text-rose-900 border border-rose-200 rounded text-[11px] font-extrabold">
                    {intake.bloodGroup}
                  </span>
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">
                  {intake.heightCm || intake.weightKg
                    ? `${intake.heightCm ? `${intake.heightCm} cm` : ""} ${
                        intake.weightKg ? `• ${intake.weightKg} kg` : ""
                      } ${computedBmi ? `• BMI ${computedBmi}` : ""}`
                    : "Anthropometrics: Standard"}
                </div>
              </div>

              <div className="p-2.5">
                <div className="text-[10px] font-bold uppercase text-slate-500">
                  LMP & Estimated Ovulation
                </div>
                <div className="font-extrabold text-rose-900 mt-0.5">
                  LMP:{" "}
                  {stats.lmpDate
                    ? format(parseISO(stats.lmpDate), "MMM d, yyyy")
                    : "Not logged in window"}
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">
                  Est. Ovulation:{" "}
                  <strong>
                    {stats.estimatedOvulation
                      ? format(parseISO(stats.estimatedOvulation), "MMM d")
                      : "Pending"}
                  </strong>{" "}
                  • Next Menses:{" "}
                  <strong>
                    {stats.estimatedNextPeriod
                      ? format(parseISO(stats.estimatedNextPeriod), "MMM d")
                      : "Pending"}
                  </strong>
                </div>
              </div>

              <div className="p-2.5">
                <div className="text-[10px] font-bold uppercase text-slate-500">
                  Menarche & Obstetric Parity
                </div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {intake.gravidaPara}
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">
                  Menarche: <strong>{intake.menarcheAge}</strong>
                </div>
              </div>
            </div>

            {/* Structured Clinical History Table Rows */}
            <table className="w-full text-left border-collapse text-[11px]">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="w-[22%] py-2 px-3 font-bold uppercase text-[10px] text-slate-500 bg-slate-50 border-r border-slate-200">
                    Contraceptive Method
                  </td>
                  <td className="w-[28%] py-2 px-3 font-semibold text-slate-900 border-r border-slate-200">
                    {intake.contraception}
                  </td>
                  <td className="w-[22%] py-2 px-3 font-bold uppercase text-[10px] text-slate-500 bg-slate-50 border-r border-slate-200">
                    Dysmenorrhea Severity
                  </td>
                  <td className="w-[28%] py-2 px-3 font-semibold text-slate-900">
                    {intake.dysmenorrheaGrade}
                  </td>
                </tr>

                <tr className="border-b border-slate-200">
                  <td className="py-2 px-3 font-bold uppercase text-[10px] text-slate-500 bg-slate-50 border-r border-slate-200">
                    Flow & Clot Profile
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200">
                    {intake.flowClotProfile}
                  </td>
                  <td className="py-2 px-3 font-bold uppercase text-[10px] text-slate-500 bg-slate-50 border-r border-slate-200">
                    Prior Diagnostic Workup
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-900">
                    {intake.priorWorkup}
                  </td>
                </tr>

                <tr className="border-b border-slate-200">
                  <td className="py-2 px-3 font-bold uppercase text-[10px] text-slate-500 bg-slate-50 border-r border-slate-200">
                    Known Diagnoses / History
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200">
                    {combinedConditions.length > 0
                      ? combinedConditions.join(", ")
                      : "None reported"}
                  </td>
                  <td className="py-2 px-3 font-bold uppercase text-[10px] text-slate-500 bg-slate-50 border-r border-slate-200">
                    Active Medications / Rx
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-900">
                    {combinedMedications.length > 0
                      ? combinedMedications.join(", ")
                      : "None reported"}
                  </td>
                </tr>

                <tr className="border-b border-slate-200">
                  <td className="py-2 px-3 font-bold uppercase text-[10px] text-slate-500 bg-slate-50 border-r border-slate-200">
                    Family Medical History
                  </td>
                  <td className="py-2 px-3 text-slate-800 border-r border-slate-200">
                    {intake.familyHistory.length > 0
                      ? intake.familyHistory.join(", ")
                      : "No significant family history"}
                  </td>
                  <td className="py-2 px-3 font-bold uppercase text-[10px] text-slate-500 bg-slate-50 border-r border-slate-200">
                    Lifestyle & Consulting Dr.
                  </td>
                  <td className="py-2 px-3 text-slate-800">
                    {intake.attendingPhysician
                      ? `${intake.attendingPhysician} • `
                      : ""}
                    {intake.lifestyleProfile}
                  </td>
                </tr>

                <tr>
                  <td className="py-2 px-3 font-bold uppercase text-[10px] text-slate-500 bg-slate-50 border-r border-slate-200">
                    Chief Clinical Complaint
                  </td>
                  <td
                    colSpan={3}
                    className="py-2 px-3 font-bold text-slate-900 bg-amber-50/40"
                  >
                    {intake.chiefComplaint}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION II: FIGO AUB-M MENSTRUAL BIOMETRICS & AUTOMATED CLINICAL TRIAGE */}
        <div className="mb-5 avoid-break">
          <div className="flex items-center justify-between bg-slate-900 text-white px-3 py-1.5 rounded-t-md">
            <h3 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Section II — FIGO AUB-M Menstrual Biometrics & Automated Clinical
              Triage
            </h3>
            <span className="text-[10px] text-slate-300">
              FIGO Normal Reference Benchmarks
            </span>
          </div>

          <div className="border border-t-0 border-slate-300 rounded-b-md bg-white">
            <div className="pdf-grid-4 grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-300 border-b border-slate-300">
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-500">
                    1. Cycle Frequency
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      isFigoLengthNormal
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-amber-50 text-amber-900 border border-amber-300"
                    }`}
                  >
                    {isFigoLengthNormal ? "Normal (24–38d)" : "Outside 24–38d"}
                  </span>
                </div>
                <div className="text-xl font-extrabold text-slate-900 mt-1">
                  {stats.avgCycle}{" "}
                  <span className="text-xs font-normal text-slate-600">
                    days (mean)
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  FIGO Normal: 24–38 days • Baseline:{" "}
                  {profile?.cycle_length || 28}d
                </div>
              </div>

              <div className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-500">
                    2. Regularity (Δ)
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      isFigoRegular
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-amber-50 text-amber-900 border border-amber-300"
                    }`}
                  >
                    {isFigoRegular ? "Regular (≤7d)" : "Variable (>7d)"}
                  </span>
                </div>
                <div className="text-xl font-extrabold text-slate-900 mt-1">
                  {stats.minCycle}–{stats.maxCycle}{" "}
                  <span className="text-xs font-normal text-slate-600">
                    days (σ={stats.cycleStdDev}d)
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Cycle Variance Δ: {stats.cycleVariance}d (FIGO ≤ 7–9d)
                </div>
              </div>

              <div className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-500">
                    3. Bleed Duration
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      isFigoDurationNormal
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-amber-50 text-amber-900 border border-amber-300"
                    }`}
                  >
                    {isFigoDurationNormal ? "Normal (≤8d)" : "Prolonged (>8d)"}
                  </span>
                </div>
                <div className="text-xl font-extrabold text-slate-900 mt-1">
                  {stats.avgDuration}{" "}
                  <span className="text-xs font-normal text-slate-600">
                    days / menses
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Total active bleed days logged: {stats.activeBleedDaysCount}d
                </div>
              </div>

              <div className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-500">
                    4. Intermenstrual
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300">
                    {stats.confirmedCyclesCount} Confirmed Cycles
                  </span>
                </div>
                <div className="text-xl font-extrabold text-slate-900 mt-1">
                  {stats.spottingDaysCount}{" "}
                  <span className="text-xs font-normal text-slate-600">
                    spotting day(s)
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Symptom-active days:{" "}
                  {clinicalAnalysis.daysWithPhysicalSymptoms}d
                </div>
              </div>
            </div>

            {/* Automated Clinical Triage Findings (Doctor View / Full Chart) */}
            {viewMode !== "patient" && (
              <div className="p-3 bg-slate-50/70">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                  Automated Clinical Decision Support & FIGO Parameter Screening
                </div>
                <div className="pdf-grid-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {clinicalDecisionSupport.flags.map((flag, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded border flex items-start gap-2 ${
                        flag.severity === "alert"
                          ? "bg-rose-50/70 border-rose-200 text-rose-950"
                          : flag.severity === "review"
                            ? "bg-amber-50/70 border-amber-200 text-amber-950"
                            : "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold">{flag.title}</div>
                        <div className="text-[10px] opacity-90 leading-snug mt-0.5">
                          {flag.detail}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PATIENT PERSPECTIVE MODULE: PLAIN-LANGUAGE SUMMARY & DOCTOR QUESTIONS */}
        {viewMode !== "doctor" && (
          <div className="mb-5 avoid-break">
            <div className="flex items-center justify-between bg-rose-900 text-white px-3 py-1.5 rounded-t-md">
              <h3 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Patient Guide — What Your Numbers Mean & Questions to Ask Your
                Gynecologist
              </h3>
              <span className="text-[10px] text-rose-200">
                Patient Empowerment Summary
              </span>
            </div>
            <div className="border border-t-0 border-slate-300 rounded-b-md p-3.5 bg-rose-50/20 text-xs">
              <div className="pdf-grid-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-extrabold uppercase text-slate-600 mb-1.5">
                    Your Cycle Health in Plain Language
                  </div>
                  <ul className="space-y-1 text-[11px] text-slate-800 list-disc pl-4">
                    <li>
                      <strong>Cycle Length ({stats.avgCycle} days):</strong>{" "}
                      {isFigoLengthNormal
                        ? "Your average cycle sits comfortably inside the standard 24–38 day medical window."
                        : "Your cycle length falls outside the typical 24–38 day window, which is worth discussing with your doctor."}
                    </li>
                    <li>
                      <strong>
                        Period Duration ({stats.avgDuration} days):
                      </strong>{" "}
                      {isFigoDurationNormal
                        ? "Your bleeding duration is within the typical ≤8 day threshold."
                        : "Your bleeding lasts longer than 8 days on average; ask your doctor about checking your iron levels."}
                    </li>
                    <li>
                      <strong>Logged Symptom Load:</strong> You logged physical
                      symptoms on{" "}
                      <strong>
                        {clinicalAnalysis.daysWithPhysicalSymptoms} day(s)
                      </strong>{" "}
                      and emotional/mood reflections on{" "}
                      <strong>
                        {clinicalAnalysis.daysWithMoodLogs} day(s)
                      </strong>{" "}
                      during this window.
                    </li>
                  </ul>
                </div>

                <div>
                  <div className="text-[10px] font-extrabold uppercase text-slate-600 mb-1.5">
                    Suggested Questions for Your OB-GYN Appointment
                  </div>
                  <ol className="space-y-1 text-[11px] text-slate-800 list-decimal pl-4">
                    {clinicalDecisionSupport.patientQuestions.map((q, idx) => (
                      <li key={idx} className="leading-snug">
                        {q}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION III: CONFIRMED MENSTRUAL BLEED EPISODES TABLE */}
        {confirmedEpisodes.length > 0 && (
          <div className="mb-5 avoid-break">
            <div className="flex items-center justify-between bg-slate-900 text-white px-3 py-1.5 rounded-t-md">
              <h3 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Section III — Confirmed Menstrual Bleed Episodes (Onset-to-Onset
                Table)
              </h3>
              <span className="text-[10px] text-slate-300">
                Computed from Confirmed CD 1 Dates
              </span>
            </div>

            <table className="w-full text-left border-collapse text-[11px] border border-t-0 border-slate-300">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-800">
                  <th className="w-[10%] py-2 px-2.5 font-bold border-r border-slate-300">
                    Cycle #
                  </th>
                  <th className="w-[18%] py-2 px-2.5 font-bold border-r border-slate-300">
                    Menses Onset (CD 1)
                  </th>
                  <th className="w-[18%] py-2 px-2.5 font-bold border-r border-slate-300">
                    Menses Cessation
                  </th>
                  <th className="w-[15%] py-2 px-2.5 font-bold border-r border-slate-300">
                    Bleed Duration
                  </th>
                  <th className="w-[24%] py-2 px-2.5 font-bold border-r border-slate-300">
                    Logged Flow & Color Profile
                  </th>
                  <th className="w-[15%] py-2 px-2.5 font-bold">
                    Cycle Length
                  </th>
                </tr>
              </thead>
              <tbody>
                {confirmedEpisodes.map((ep, idx) => (
                  <tr
                    key={ep.startDate + idx}
                    className="border-b border-slate-200 odd:bg-white even:bg-slate-50/50"
                  >
                    <td className="py-1.5 px-2.5 font-mono font-bold text-slate-700 border-r border-slate-200">
                      #{confirmedEpisodes.length - idx}
                    </td>
                    <td className="py-1.5 px-2.5 font-bold text-slate-900 border-r border-slate-200">
                      {format(parseISO(ep.startDate), "MMM d, yyyy")}
                    </td>
                    <td className="py-1.5 px-2.5 text-slate-700 border-r border-slate-200">
                      {ep.endDate
                        ? format(parseISO(ep.endDate), "MMM d, yyyy")
                        : "End date unlogged"}
                    </td>
                    <td className="py-1.5 px-2.5 font-semibold text-slate-800 border-r border-slate-200">
                      {ep.durationDays
                        ? `${ep.durationDays} days`
                        : `~${stats.avgDuration} days (est.)`}
                    </td>
                    <td className="py-1.5 px-2.5 text-slate-700 border-r border-slate-200">
                      Flow: {ep.peakFlow} • Color: {ep.colorsObserved}
                    </td>
                    <td className="py-1.5 px-2.5 font-bold text-slate-900">
                      {ep.cycleLengthToNext
                        ? `${ep.cycleLengthToNext} days`
                        : "Current Cycle"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SECTION IV: MULTI-SYSTEM CLINICAL REVIEW OF SYSTEMS (ROS) MATRIX */}
        <div className="mb-5 avoid-break">
          <div className="flex items-center justify-between bg-slate-900 text-white px-3 py-1.5 rounded-t-md">
            <h3 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5" />
              Section IV — Multi-System Review of Systems (ROS) & Cycle-Phase
              Distribution
            </h3>
            <span className="text-[10px] text-slate-300">
              8-Domain Gynecological Symptom Incidence
            </span>
          </div>

          <div className="border border-t-0 border-slate-300 rounded-b-md p-3.5 bg-white">
            {Object.keys(clinicalAnalysis.rosBuckets).length > 0 ? (
              <div className="pdf-grid-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(clinicalAnalysis.rosBuckets).map(
                  ([systemName, itemsObj]) => {
                    const sortedItems = Object.entries(itemsObj).sort(
                      (a, b) => b[1] - a[1],
                    );
                    return (
                      <div
                        key={systemName}
                        className="border border-slate-200 rounded-md p-2.5 bg-slate-50/40"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800">
                            {systemName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {sortedItems.length} marker(s)
                          </span>
                        </div>
                        <div className="pdf-grid-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                          {sortedItems.slice(0, 8).map(([symName, count]) => (
                            <div
                              key={symName}
                              className="flex items-center justify-between border-b border-slate-100 py-0.5"
                            >
                              <span className="text-slate-800 truncate pr-1">
                                {symName}
                              </span>
                              <span className="font-mono text-[10px] font-bold text-slate-700 shrink-0">
                                {count}d (
                                {Math.round(
                                  (count / Math.max(logs.length, 1)) * 100,
                                )}
                                %)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                No physical or affective symptoms recorded in this window.
              </p>
            )}

            {/* Phase Burden Bars + Color / Discharge / Cravings Summary */}
            <div className="mt-3 pt-3 border-t border-slate-200 pdf-grid-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
              <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
                <div className="text-[10px] font-bold uppercase text-slate-500 mb-1.5">
                  Symptom Density by Cycle Phase
                </div>
                <div className="space-y-1">
                  {(
                    ["Menstrual", "Follicular", "Ovulatory", "Luteal"] as const
                  ).map((ph) => {
                    const count = clinicalAnalysis.phaseSymptomLoad[ph];
                    const pct = Math.round(
                      (count / clinicalAnalysis.totalPhaseMarkers) * 100,
                    );
                    return (
                      <div key={ph} className="text-[10px]">
                        <div className="flex justify-between font-semibold text-slate-700">
                          <span>{ph} Phase</span>
                          <span>
                            {count} logs ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-0.5">
                          <div
                            className="h-full bg-slate-800"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
                <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Observed Menses Color & Discharge
                </div>
                <div className="text-slate-800 leading-snug space-y-1">
                  <div>
                    <span className="text-slate-500 font-semibold">
                      Flow Colors:{" "}
                    </span>
                    <span>
                      {clinicalAnalysis.topColors.length > 0
                        ? clinicalAnalysis.topColors
                            .map(([c, n]) => `${c} (${n}d)`)
                            .join(", ")
                        : "Standard / None specified"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">
                      Discharge:{" "}
                    </span>
                    <span>
                      {clinicalAnalysis.topDischarge.length > 0
                        ? clinicalAnalysis.topDischarge
                            .map(([d, n]) => `${d} (${n}d)`)
                            .join(", ")
                        : "None specified"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
                <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Metabolic Cravings & Top Moods
                </div>
                <div className="text-slate-800 leading-snug space-y-1">
                  <div>
                    <span className="text-slate-500 font-semibold">
                      Cravings:{" "}
                    </span>
                    <span>
                      {clinicalAnalysis.topCravings.length > 0
                        ? clinicalAnalysis.topCravings
                            .map(([cr, n]) => `${cr} (${n}d)`)
                            .join(", ")
                        : "None logged"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">
                      Predominant Moods:{" "}
                    </span>
                    <span>
                      {clinicalAnalysis.topMoods.length > 0
                        ? clinicalAnalysis.topMoods
                            .slice(0, 4)
                            .map(([m, n]) => `${m} (${n}d)`)
                            .join(", ")
                        : "None logged"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION V: COMPLETE CHRONOLOGICAL CLINICAL DIARY */}
        <div className="mb-5">
          <div className="flex items-center justify-between bg-slate-900 text-white px-3 py-1.5 rounded-t-md">
            <h3 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Section V — Chronological Daily Flow, Cycle-Day & Symptom Diary
            </h3>
            <span className="text-[10px] text-slate-300">
              Showing {logs.length} Recorded Day(s) • CD = Cycle Day
            </span>
          </div>

          {logs.length > 0 ? (
            <table className="w-full table-fixed text-left border-collapse text-[11px] border border-t-0 border-slate-300">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-800 text-slate-900">
                  <th className="w-[14%] py-2 px-2.5 font-bold border-r border-slate-300">
                    Date & Cycle Day
                  </th>
                  <th className="w-[12%] py-2 px-2.5 font-bold border-r border-slate-300">
                    Bleeding Event
                  </th>
                  <th className="w-[19%] py-2 px-2.5 font-bold border-r border-slate-300">
                    Flow, Color & Discharge
                  </th>
                  <th className="w-[38%] py-2 px-2.5 font-bold border-r border-slate-300">
                    Logged Physical Symptoms & Affective States
                  </th>
                  <th className="w-[17%] py-2 px-2.5 font-bold">
                    Patient Notes & Context
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const { flow, color, discharge, cravings, activity } =
                    extractDailyAttributes(log);
                  const symptoms = parseClinicalList(
                    log.symptoms ?? log.physical_symptoms,
                  );
                  const moods = parseClinicalList(log.moods ?? log.mood);
                  const { cd, phase } = getCycleDayAndPhase(log.log_date);

                  const hasFlowColorDischarge =
                    flow.length > 0 || color.length > 0 || discharge.length > 0;
                  const hasSymptomsMoods =
                    symptoms.length > 0 ||
                    moods.length > 0 ||
                    cravings.length > 0;

                  const bleedingStatus = log.is_period_start
                    ? "Menses Start"
                    : log.is_period_end
                      ? "Menses End"
                      : log.is_spotting
                        ? "Spotting"
                        : flow.length > 0
                          ? "Active Bleed"
                          : "-";

                  return (
                    <tr
                      key={log.log_date}
                      className="border-b border-slate-200 align-top odd:bg-white even:bg-slate-50/50"
                    >
                      <td className="py-2 px-2.5 border-r border-slate-200 whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {format(parseISO(log.log_date), "MMM d, yyyy")}
                        </div>
                        {cd && (
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                            CD {cd} • {phase}
                          </div>
                        )}
                      </td>

                      <td className="py-2 px-2.5 border-r border-slate-200 break-words">
                        {bleedingStatus !== "-" ? (
                          <span
                            className={`inline-block font-bold px-1.5 py-0.5 rounded text-[10px] ${
                              log.is_period_start
                                ? "bg-rose-100 text-rose-900 border border-rose-300"
                                : log.is_period_end
                                  ? "bg-slate-200 text-slate-800 border border-slate-300"
                                  : "bg-amber-50 text-amber-900 border border-amber-200"
                            }`}
                          >
                            {bleedingStatus}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-2 px-2.5 border-r border-slate-200 break-words leading-relaxed">
                        {hasFlowColorDischarge ? (
                          <div className="space-y-0.5">
                            {flow.length > 0 && (
                              <div>
                                <span className="font-bold text-slate-700">
                                  Flow:{" "}
                                </span>
                                <span className="text-slate-900">
                                  {flow.join(", ")}
                                </span>
                              </div>
                            )}
                            {color.length > 0 && (
                              <div>
                                <span className="font-bold text-slate-700">
                                  Color:{" "}
                                </span>
                                <span className="text-slate-900">
                                  {color.join(", ")}
                                </span>
                              </div>
                            )}
                            {discharge.length > 0 && (
                              <div>
                                <span className="font-bold text-slate-700">
                                  Discharge:{" "}
                                </span>
                                <span className="text-slate-900">
                                  {discharge.join(", ")}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-2 px-2.5 border-r border-slate-200 break-words leading-relaxed">
                        {hasSymptomsMoods ? (
                          <div className="space-y-1">
                            {symptoms.length > 0 && (
                              <div>
                                <span className="font-bold text-slate-800">
                                  Physical ({symptoms.length}):{" "}
                                </span>
                                <span className="text-slate-900">
                                  {symptoms.join(", ")}
                                </span>
                              </div>
                            )}
                            {moods.length > 0 && (
                              <div>
                                <span className="font-bold text-slate-700">
                                  Affective:{" "}
                                </span>
                                <span className="text-slate-800">
                                  {moods.join(", ")}
                                </span>
                              </div>
                            )}
                            {cravings.length > 0 && (
                              <div>
                                <span className="font-bold text-slate-700">
                                  Cravings:{" "}
                                </span>
                                <span className="text-slate-800">
                                  {cravings.join(", ")}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-2 px-2.5 text-slate-700 break-words leading-relaxed">
                        {log.note && String(log.note).trim().length > 0 ? (
                          <div className="italic">
                            {String(log.note).trim()}
                          </div>
                        ) : activity.length > 0 ? (
                          <div>
                            <span className="font-semibold not-italic text-slate-600">
                              Activity:{" "}
                            </span>
                            {activity.join(", ")}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="border border-t-0 border-slate-300 rounded-b-md p-6 text-center text-xs text-slate-500">
              No daily logs recorded within the selected observation window.
            </div>
          )}
        </div>

        {/* SECTION VI: PHYSICIAN ASSESSMENT WORKSHEET & DUAL SIGNATURE ATTESTATION */}
        <div className="avoid-break mt-5">
          <div className="flex items-center justify-between bg-slate-900 text-white px-3 py-1.5 rounded-t-md">
            <h3 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5" />
              Section VI — Attending OB-GYN Assessment, Diagnostic Orders & Dual
              Attestation
            </h3>
            <span className="text-[10px] text-slate-300">
              Official Consultation Sign-Off
            </span>
          </div>

          <div className="border border-t-0 border-slate-300 rounded-b-md p-4 bg-white">
            {/* Quick Checkboxes for Physician Diagnostic Orders + Notes */}
            <div className="mb-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold uppercase text-slate-600 mb-2">
                <span>
                  Recommended Diagnostic Workup & Clinical Impressions (For
                  Physician Use):
                </span>
                <span>ICD-10 Code: ______________________</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[10px] text-slate-700 mb-3 bg-slate-50 p-2 rounded border border-slate-200">
                <div>☐ CBC & Ferritin</div>
                <div>☐ TSH & Free T4</div>
                <div>☐ Serum Prolactin</div>
                <div>☐ LH / FSH / E2</div>
                <div>☐ Total/Free Testo.</div>
                <div>☐ Pelvic USG (TVS/TAS)</div>
              </div>

              <div className="border border-dashed border-slate-300 rounded bg-slate-50/40 p-3 space-y-4">
                <div className="border-b border-slate-200 h-4" />
                <div className="border-b border-slate-200 h-4" />
                <div className="border-b border-slate-200 h-4" />
              </div>
            </div>

            {/* Dual Patient & Doctor Signature Grid (Forced 2-Col in PDF) */}
            <div className="pdf-grid-2 grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
              {/* Patient Signature Box */}
              <div className="border border-slate-300 rounded-lg p-3.5 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800">
                    1. Patient Record Attestation
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1 leading-normal">
                    I confirm that the menstrual onset dates, flow profiles,
                    clinical intake details, and daily symptoms in this report
                    accurately reflect my personal health logs.
                  </p>
                </div>

                <div className="mt-7 pt-2 border-t border-slate-400 flex items-end justify-between text-[11px]">
                  <div>
                    <div className="text-[10px] text-slate-500">
                      Patient Signature
                    </div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {patientName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500">
                      Date Signed
                    </div>
                    <div className="font-semibold text-slate-800 mt-0.5">
                      ____ / ____ / {format(reportEndDate, "yyyy")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Attending OB-GYN Signature & Stamp Box */}
              <div className="border border-slate-300 rounded-lg p-3.5 bg-slate-50/50 flex flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800">
                      2. Attending OB-GYN Verification
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1 leading-normal">
                      Reviewed during gynecological consultation. Clinical
                      assessment and follow-up plan discussed with patient.
                    </p>
                  </div>
                  <div className="border border-dashed border-slate-300 rounded px-2.5 py-2 text-[9px] text-slate-400 uppercase font-semibold text-center shrink-0">
                    Hospital / Clinic
                    <br />
                    Official Stamp
                  </div>
                </div>

                <div className="mt-7 pt-2 border-t border-slate-400 flex items-end justify-between text-[11px]">
                  <div>
                    <div className="text-[10px] text-slate-500">
                      Physician Signature & Medical Reg. No.
                    </div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {intake.attendingPhysician ||
                        "Dr. _________________________"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500">
                      Date Reviewed
                    </div>
                    <div className="font-semibold text-slate-800 mt-0.5">
                      ____ / ____ / {format(reportEndDate, "yyyy")}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Clinical Methodology Footer */}
            <div className="mt-4 pt-2.5 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[10px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                <span>
                  <strong>MoonDay Clinical EHR</strong> • FIGO AUB System 1
                  Standard • Patient-Controlled Reproductive Health Record
                </span>
              </div>
              <div className="flex items-center gap-1 font-mono text-slate-600">
                <Clock className="w-3 h-3" /> Chart ID: {reportId}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
