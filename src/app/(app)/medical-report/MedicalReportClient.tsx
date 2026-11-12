"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { format, subDays, addDays, parseISO, differenceInDays } from "date-fns";
import {
  Printer,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Download,
  Copy,
  Check,
  Search,
  RotateCcw,
  FileSpreadsheet,
  Upload,
  Plus,
  X,
  User,
  Activity,
  Stethoscope,
  FlaskConical,
  Pill,
  Layers,
  ShieldCheck,
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
    return "Pelvic, Uterine & Lumbosacral";
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
    return "Gastrointestinal & Bowel";
  }
  if (
    /sleep|insomnia|waking|nightmare|vivid dream|fatigue|letharg|low energy|weakness|restless leg|oversleep/.test(
      s,
    )
  ) {
    return "Sleep, Fatigue & Circadian";
  }
  if (
    /hot flash|night sweat|sweat|chill|water retention|swollen|puffy|skin|acne|hair|eye|odor/.test(
      s,
    )
  ) {
    return "Vasomotor, Fluid & Dermatological";
  }
  if (/vagin|vulva|discharge|itch|dryness|urin/.test(s)) {
    return "Vulvovaginal & Urinary Tract";
  }
  if (
    /breast|joint|muscle|body ache|neck|shoulder|throat|cough|lymph|congest/.test(
      s,
    )
  ) {
    return "Breast, Musculoskeletal & Systemic";
  }
  return "Affective & Neuroendocrine";
};

/**
 * Reusable Caduceus Medical Emblem SVG (Matches 7948684.jpg top-right icon & center watermark)
 */
const CaduceusMedicalEmblem = ({
  className = "w-16 h-16",
  color = "#1d6fa5",
  opacity = 1,
}: {
  className?: string;
  color?: string;
  opacity?: number;
}) => (
  <svg
    viewBox="0 0 200 220"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ opacity }}
  >
    <circle cx="100" cy="22" r="9" fill={color} />
    <path d="M97 30 L103 30 L101.5 208 L98.5 208 Z" fill={color} />
    <path
      d="M94 42 C68 28, 30 32, 8 44 C22 52, 42 54, 58 53 C38 60, 22 65, 14 73 C32 76, 52 74, 68 70 C50 78, 36 83, 28 90 C48 90, 72 82, 94 66 Z"
      fill={color}
    />
    <path
      d="M106 42 C132 28, 170 32, 192 44 C178 52, 158 54, 142 53 C162 60, 178 65, 186 73 C168 76, 148 74, 132 70 C150 78, 164 83, 172 90 C152 90, 128 82, 106 66 Z"
      fill={color}
    />
    <path
      d="M74 68 C62 82, 66 102, 100 114 C134 126, 134 146, 100 158 C72 168, 72 186, 100 198"
      stroke={color}
      strokeWidth="7.5"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M126 68 C138 82, 134 102, 100 114 C66 126, 66 146, 100 158 C128 168, 128 186, 100 198"
      stroke={color}
      strokeWidth="7.5"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="78" cy="65" r="5" fill={color} />
    <circle cx="122" cy="65" r="5" fill={color} />
  </svg>
);

/* ============================================================================
   EXTENSIVE CLINICAL DROPDOWN CATALOGS (280+ STRUCTURED MEDICAL OPTIONS)
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
    group: "Subgroups & Rare Clinical Phenotypes",
    options: [
      "A1 Positive (A1+)",
      "A1 Negative (A1-)",
      "A2 Positive (A2+)",
      "A2 Negative (A2-)",
      "A1B Positive (A1B+)",
      "A2B Positive (A2B+)",
      "Bombay Phenotype (Oh / hh)",
      "Weak D / Du Positive",
      "Rh-Null Phenotype",
      "Kell / Duffy Antigen Tracked",
    ],
  },
  {
    group: "Status",
    options: ["Unknown — Order ABO/Rh Typing"],
  },
];

const CONTRACEPTIVE_CATEGORIES = [
  {
    group: "Non-Hormonal / Natural / Fertility Intent",
    options: [
      "None / Non-hormonal",
      "None — Actively Trying to Conceive (Pre-Conception)",
      "Fertility Awareness-Based Method (FABM / BBT / LH Strips)",
      "Barrier Method Only (Non-Hormonal)",
      "Lactational Amenorrhea Method (LAM)",
    ],
  },
  {
    group: "Combined Oral Contraceptive Pills (COCPs — Estrogen + Progestin)",
    options: [
      "COCP — Ethinylestradiol 20/30mcg + Drospirenone (Yaz / Yasmin / Crisanta)",
      "COCP — Ethinylestradiol + Levonorgestrel (Ovral-L / Mala-N / Microgynon)",
      "COCP — Ethinylestradiol + Desogestrel (Novelon / Femilon / Marvelon)",
      "COCP — Ethinylestradiol + Cyproterone Acetate (Diane-35 / Ginette-35 / Krimson-35)",
      "COCP — Estradiol Valerate + Dienogest Multiphasic (Qlaira)",
      "COCP — Ethinylestradiol + Norgestimate (Sprintec / Ortho Tri-Cyclen)",
      "COCP — Extended / Continuous Active Pill Regimen (Amenorrheic Protocol)",
    ],
  },
  {
    group: "Progestin-Only Regimens, Endometriosis Therapy & SERMs",
    options: [
      "POP — Desogestrel 75 mcg (Cerazette)",
      "POP — Drospirenone 4 mg (Slynd)",
      "POP — Norethindrone 0.35 mg (Camila / Nor-QD)",
      "Therapeutic Progestin — Dienogest 2 mg Daily (Visanne / Endometriosis)",
      "Therapeutic Progestin — Medroxyprogesterone Acetate 10 mg (Meprate / Provera)",
      "Therapeutic Progestin — Dydrogesterone 10 mg Cyclical (Duphaston)",
      "Therapeutic Progestin — Micronized Progesterone 200 mg (Susten / Prometrium)",
      "Therapeutic Progestin — Norethisterone Acetate 5 mg (Primolut-N / Regestrone)",
      "Non-Steroidal SERM — Centchroman / Ormeloxifene 30 mg (Saheli / Chhaya)",
    ],
  },
  {
    group:
      "Long-Acting Reversible Contraception (IUD / IUS / Subdermal Implant)",
    options: [
      "Hormonal LNG-IUS — Mirena (52 mg Levonorgestrel, 5–8 yr)",
      "Hormonal LNG-IUS — Kyleena (19.5 mg Levonorgestrel, 5 yr)",
      "Hormonal LNG-IUS — Skyla / Jaydess (13.5 mg Levonorgestrel, 3 yr)",
      "Non-Hormonal Copper IUD — CuT 380A / ParaGard (10 yr)",
      "Non-Hormonal Copper IUD — Multiload Cu375 (5 yr)",
      "Subdermal Implant — Etonogestrel 68 mg Rod (Nexplanon / Implanon)",
    ],
  },
  {
    group: "Injectables, Rings, Patches & Surgical",
    options: [
      "Injectable — Depot Medroxyprogesterone Acetate 150 mg (DMPA / Antara 3-Monthly)",
      "Vaginal Ring — Etonogestrel + Ethinylestradiol (NuvaRing)",
      "Transdermal Contraceptive Patch (Evra / Xulane)",
      "Emergency Contraceptive Taken in Current Window (Levonorgestrel 1.5mg / Ulipristal)",
      "Permanent — Bilateral Tubal Ligation / Bilateral Salpingectomy",
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
  "G2 P1 L1 A1 (Multigravida — 1 Delivery, 1 Prior Loss)",
  "G2 P2 L2 (Multiparous — 2 Deliveries, 2 Living)",
  "G3 P2 L2 A1 (Multiparous — 2 Deliveries, 1 Prior Loss)",
  "G3 P3 L3 (Multiparous — 3 Deliveries, 3 Living)",
  "Prior Lower Segment Cesarean Section (LSCS × 1)",
  "Prior Lower Segment Cesarean Section (LSCS × 2+)",
  "Postpartum (< 6 Months Since Delivery — Lactating)",
  "Postpartum (6–12 Months Since Delivery)",
  "Recurrent Pregnancy Loss (RPL ≥ 2 Losses) Workup",
  "Prefer Not to Specify",
];

const DYSMENORRHEA_GRADES = [
  "Grade 0 (VAS 0/10) — Eumenorrhea / No Menstrual Pain",
  "Grade 1 (VAS 1–3/10) — Mild Cramping, No Analgesics Needed, Full Activity",
  "Grade 2 (VAS 4–6/10) — Moderate Cramping, Relieved by OTC NSAIDs, Normal Routine",
  "Grade 3A (VAS 7–8/10) — Severe Cramping + Systemic Symptoms, Partial Work/Study Loss",
  "Grade 3B (VAS 9–10/10) — Incapacitating Pain, Unresponsive to NSAIDs, Bed Rest Required",
  "Secondary Dysmenorrhea Pattern — Pain Begins 3–5 Days Before Flow & Persists Through Menses",
];

const ANALGESIC_RELIEF_OPTIONS = [
  "No Analgesics Required — Manageable with Rest / Hydration",
  "Complete Relief (80–100%) within 45 mins of OTC NSAID / Antispasmodic",
  "Moderate Relief (50–75%) with NSAID + Heating Pad",
  "Partial / Suboptimal Relief (25–40%) Despite Standard Analgesic Dosing",
  "Refractory Pain (< 20% Relief) — Unresponsive to OTC Analgesics (Screen Secondary Cause)",
  "Non-Pharmacological Only — Relieved by Local Heat Therapy / TENS / Gentle Yoga",
];

const PAIN_RADIATION_OPTIONS = [
  "Localized Midline Suprapubic Cramping Only",
  "Suprapubic Cramping Radiating to Lumbosacral Lower Back",
  "Suprapubic + Bilateral Anterior/Medial Thigh Radiation",
  "Diffuse Pelvic Heaviness + Sacral Backache + Rectal Pressure",
  "Unilateral Right Iliac Fossa / Right Adnexal Predominance",
  "Unilateral Left Iliac Fossa / Left Adnexal Predominance",
  "Cyclical Dyschezia (Painful Defecation / Rectovaginal Pain During Menses)",
  "Mid-Cycle Unilateral Ovulatory Twinge (Mittelschmerz)",
];

const FLOW_CLOT_PROFILES = [
  "Normal Volume (~30–50 mL) — Pad/Tampon Every 4–6 Hrs, No Clots",
  "Light / Scanty Flow (Hypomenorrhea < 20 mL) — Minimal Pad Spotting",
  "Moderate Flow — Peak Heavy on CD 1–2, Small Fibrin Clots (< 1 cm)",
  "Heavy Menstrual Bleeding (HMB > 80 mL) — Soaking Pad/Tampon Every 1–2 Hrs",
  "Severe HMB with Large Clots (> 2.5 cm / Coin-Sized) & Daytime Flooding",
  "Nocturnal Overflow — Waking at Night to Change Double Protection",
  "Prolonged Slow Tapering — 3–4 Days Normal Bleed Followed by 4+ Days Brown Spotting",
  "Intermenstrual Spotting / Oxidized Dark Brown Discharge Only",
];

const SANITARY_PRODUCT_OPTIONS = [
  "Disposable Sanitary Pads — Regular Absorbency (3–4 pads/day on peak flow)",
  "Disposable Sanitary Pads — XL / Heavy Overnight (5–7 pads/day on peak flow)",
  "Disposable Sanitary Pads — Changing Every 1–2 Hours on Peak Days",
  "Menstrual Cup (Small/Medium ~25mL) — Emptied Every 8–12 Hours",
  "Menstrual Cup (Large ~30mL) — Emptied Every 3–4 Hours (Heavy Volume)",
  "Organic Cotton Pads / Reusable Cloth Pads",
  "Tampons — Regular / Super Absorbency",
  "Period Underwear + Backup Sanitary Pad (Double Protection)",
];

const OVULATORY_MUCUS_OPTIONS = [
  "Clear Biphasic Pattern — Distinct Mid-Cycle Egg-White Cervical Mucus (EWCM)",
  "Mild Mid-Cycle Mucus Shift Observed without Ovulatory Pain",
  "Persistent Dryness / Scant Cervical Mucus Throughout Cycle",
  "Frequent Thick White / Creamy Non-Offensive Discharge (Physiological Leukorrhea)",
  "Recurrent Curdy White Discharge with Pruritus (Screen Candidiasis)",
  "Yellowish / Greyish Malodorous Discharge (Screen BV / Vaginitis)",
  "Pink / Brown Mid-Cycle Periovulatory Spotting",
];

const HYPERANDROGENISM_OPTIONS = [
  "None — Clear Skin, Normal Terminal Hair Distribution, No Alopecia",
  "Mild Cyclical Premenstrual Jawline Acne (1–3 Papules)",
  "Moderate-Severe Persistent Hormonal Acne (Mandibular / Cheek / Upper Back)",
  "Clinical Hirsutism — Coarse Hair on Upper Lip, Chin, or Periareolar Area (mFG ≥ 6)",
  "Androgenic Scalp Hair Thinning (Female Pattern Crown Widening)",
  "Combined Hirsutism + Persistent Acne + Seborrhea (Screen PCOS / DHEAS)",
  "Acanthosis Nigricans (Velvety Hyperpigmentation on Neck/Axilla — Insulin Resistance)",
];

const THYROID_GALACTORRHEA_OPTIONS = [
  "Euthyroid Clinical Screen — No Cold/Heat Intolerance or Galactorrhea",
  "Hypothyroid Screen — Fatigue, Cold Intolerance, Dry Skin, Constipation, Weight Gain",
  "Hyperthyroid Screen — Heat Intolerance, Resting Tachycardia, Tremor, Weight Loss",
  "Galactorrhea Screen — Spontaneous Non-Lactational Nipple Discharge (Check Prolactin)",
  "Cyclic Mastalgia — Bilateral Luteal Breast Swelling & Tenderness Relieved at Menses",
  "Known Hypothyroidism — Currently Managed on Oral Levothyroxine",
];

const GI_URINARY_CORRELATION_OPTIONS = [
  "No Significant Cyclical Bowel or Urinary Changes",
  "Prostaglandin-Mediated Loose Stools / Diarrhea on Cycle Days 1–2",
  "Luteal Progesterone-Mediated Constipation & Abdominal Distension/Bloating",
  "Severe Cyclical Bloating ('Endo Belly') + Alternating Bowel Habits",
  "Painful Defecation During Menses (Cyclical Dyschezia)",
  "Cyclical Urinary Frequency / Urgency or Dysuria During Menses",
];

const PMS_FUNCTIONAL_IMPACT_OPTIONS = [
  "None / Minimal — Full Occupational, Academic, and Social Functioning",
  "Mild — Noticeable Luteal Fatigue or Irritability (3–4 Days Pre-Menses), Fully Functional",
  "Moderate — Reduced Focus, Tearfulness & Somatic Heaviness Impacting Productivity",
  "Severe Affective (PMDD Screen) — Marked Luteal Mood Lability, Anxiety, or Hopelessness",
  "Severe Somatic — Misses 1–3 Days of Work/College Monthly Due to Pain/Fatigue",
];

const PRIOR_WORKUP_OPTIONS = [
  "None — Initial Gynecological Consultation",
  "Pelvic Ultrasound (TAS/TVS) — Normal Anteverted Uterus & Bilateral Ovaries",
  "Pelvic Ultrasound (TAS/TVS) — Polycystic Ovarian Morphology (PCOM / ≥20 Follicles)",
  "Pelvic Ultrasound (TAS/TVS) — Uterine Leiomyoma (Fibroid) Documented",
  "Pelvic Ultrasound (TAS/TVS) — Adenomyosis (Heterogeneous Myometrium / Globular Uterus)",
  "Pelvic Ultrasound (TAS/TVS) — Simple Ovarian Cyst / Hemorrhagic Corpus Luteum",
  "Pelvic Ultrasound (TAS/TVS) — Endometrioma ('Chocolate Cyst') Noted",
  "Pelvic MRI / Hysterosalpingography (HSG) Previously Completed",
  "Endocrine & Hematology Blood Panels Available for Review",
];

const CERVICAL_SCREENING_OPTIONS = [
  "Not Applicable / Under Routine Cervical Screening Age",
  "Pap Smear / LBC — Normal (NILM) within Last 3 Years",
  "Pap Smear + High-Risk HPV Co-Test — Negative within Last 5 Years",
  "HPV Vaccination Completed (Gardasil-4 / Gardasil-9 / Cervavac)",
  "Pap Smear Due / Never Screened",
  "Prior ASC-US / LSIL Under Colposcopic or Repeat Cytology Follow-Up",
];

const PREVENTIVE_IMMUNIZATION_OPTIONS = [
  "HPV Vaccine (Complete) • Rubella IgG Immune • Up-to-date Tetanus/Tdap",
  "HPV Vaccine Pending / Unvaccinated • Routine Immunizations Complete",
  "Pre-Conception Screen: Rubella IgG, Varicella & Hepatitis B Checked",
  "Regular Clinical Breast Examination / Sono-Mammography Normal",
  "Immunization & Preventive Screening Status Unverified",
];

const LIFESTYLE_PROFILES = [
  "Non-Smoker • Restorative Sleep (7–8 hrs) • Moderate Daily Activity",
  "High Occupational / Academic Stress • Irregular Sleep (< 6 hrs / Late Nights)",
  "Night-Shift / Rotating Roster (Circadian HPO Axis Disruption Risk)",
  "Sedentary Desk Routine (> 8 hrs/day sitting)",
  "Regular Strength / Aerobic Exercise Regimen (3–5 days/week)",
  "High-Volume Competitive Athletic Training (Screen RED-S / Hypothalamic Suppression)",
  "Recent Significant Weight Change (± 5 kg within Last 6 Months)",
];

const DIET_HYDRATION_OPTIONS = [
  "Balanced Omnivorous Diet • Adequate Hydration (2–2.5L/day)",
  "Lacto-Vegetarian Diet (Monitor Dietary Heme-Iron & Vitamin B12)",
  "Strict Vegan / Plant-Based Diet (Monitor Ferritin, B12, Vitamin D & Zinc)",
  "Low-Glycemic / Insulin-Sensitizing Protocol (High Fiber, Moderate Protein)",
  "Anti-Inflammatory / Mediterranean Pattern (Rich in Omega-3 & Greens)",
  "High Caffeine (> 3 cups/day) / Irregular Meal Timing / Low Water Intake",
];

const CHIEF_COMPLAINT_TEMPLATES = [
  "Comprehensive 90-day menstrual cycle, flow, and multi-system symptom evaluation.",
  "Evaluation of primary vs. secondary dysmenorrhea (pelvic pain) and analgesic protocol.",
  "Irregular menstrual cycles (oligomenorrhea / polymenorrhea) and ovulatory workup.",
  "Heavy menstrual bleeding (menorrhagia), clot passage, and iron-deficiency anemia screen.",
  "Suspected Polycystic Ovary Syndrome (PCOS) — cycle, metabolic, and androgen evaluation.",
  "Suspected Endometriosis / Adenomyosis — chronic pelvic pain, backache, and dyschezia.",
  "Premenstrual Syndrome (PMS) / PMDD — severe luteal affective and somatic symptom clustering.",
  "Intermenstrual spotting, post-menstrual brown discharge, or vulvovaginal symptoms.",
  "Pre-conception counseling, follicular phase tracking, and fertility readiness review.",
  "Contraceptive initiation, method switching, or hormonal side-effect evaluation.",
  "Follow-up evaluation of ongoing gynecological / endocrine therapeutic regimen.",
];

const DIAGNOSIS_CATALOG = [
  {
    group: "Gynecological & Uterine/Ovarian",
    items: [
      "PCOS (Polycystic Ovary Syndrome)",
      "Endometriosis (Stage I–IV)",
      "Adenomyosis",
      "Uterine Leiomyomas (Fibroids)",
      "Endometrial Polyp",
      "Primary Dysmenorrhea",
      "Secondary Dysmenorrhea",
      "Heavy Menstrual Bleeding (AUB-M / HMB)",
      "Ovarian Cyst (Functional / Dermoid / Endometrioma)",
      "Pelvic Inflammatory Disease (PID) History",
      "Recurrent Vulvovaginal Candidiasis",
      "Bacterial Vaginosis (BV)",
      "Interstitial Cystitis / Bladder Pain Syndrome",
      "Premature Ovarian Insufficiency (POI)",
    ],
  },
  {
    group: "Endocrine, Metabolic & Hematological",
    items: [
      "Primary Hypothyroidism",
      "Hashimoto's Autoimmune Thyroiditis",
      "Graves' Disease / Hyperthyroidism",
      "Hyperprolactinemia",
      "Insulin Resistance / Prediabetes",
      "Type 2 Diabetes Mellitus",
      "Type 1 Diabetes Mellitus",
      "Non-Classic Congenital Adrenal Hyperplasia (NCCAH)",
      "Iron-Deficiency Anemia",
      "Vitamin D3 Deficiency",
      "Vitamin B12 / Folate Deficiency",
      "Von Willebrand Disease / Coagulopathy",
      "Thalassemia Trait (Minor)",
    ],
  },
  {
    group: "Neurological, GI & Systemic",
    items: [
      "PMDD (Premenstrual Dysphoric Disorder)",
      "Menstrual Migraine without Aura",
      "Migraine with Aura (Estrogen Contraindication)",
      "Irritable Bowel Syndrome (IBS-C / IBS-D)",
      "Celiac Disease / Gluten Sensitivity",
      "Autoimmune / Rheumatologic Condition (SLE / RA)",
      "Essential Hypertension",
    ],
  },
];

const MEDICATION_CATALOG = [
  {
    group: "Analgesics, Antispasmodics & Anti-Fibrinolytics",
    items: [
      "Mefenamic Acid 500mg (Meftal-Spas) SOS",
      "Mefenamic Acid + Dicyclomine HCl",
      "Ibuprofen 400mg / Naproxen 500mg (NSAID)",
      "Drotaverine HCl 80mg (Drotin-DS)",
      "Hyoscine Butylbromide (Buscopan)",
      "Tranexamic Acid 500mg (Pause / Trapic — Days 1–4)",
      "Tranexamic Acid + Mefenamic Acid Combination",
      "Paracetamol / Acetaminophen 650mg",
    ],
  },
  {
    group: "Endocrine, Metabolic & Insulin Sensitizers",
    items: [
      "Myo-Inositol 2000mg + D-Chiro-Inositol 50mg",
      "Metformin HCl 500mg / 1000mg SR (Glycomet-GP/SR)",
      "Levothyroxine Sodium 25 / 50 / 75 / 100 mcg (Thyronorm)",
      "Cabergoline 0.25mg / 0.5mg Weekly (Prolactin)",
      "Spironolactone 25mg / 50mg (Anti-Androgen)",
      "Letrozole 2.5mg / Clomiphene Citrate (Ovulation Induction)",
    ],
  },
  {
    group: "Hematinics, Vitamins & Evidence-Based Nutraceuticals",
    items: [
      "Ferrous Ascorbate 100mg + Folic Acid 1.5mg (Orofer-XT)",
      "Ferrous Bisglycinate Chelate + Vitamin C",
      "Cholecalciferol (Vitamin D3) 60,000 IU Weekly / 2000 IU Daily",
      "Magnesium Glycinate 300mg–400mg (Luteal Cramp/Sleep Support)",
      "Vitamin B-Complex + Methylcobalamin 1500mcg",
      "Pyridoxine (Vitamin B6) 50mg–100mg Daily (PMS Support)",
      "Omega-3 EPA/DHA 1000mg Daily",
      "Evening Primrose Oil 1000mg (Cyclic Mastalgia)",
      "Calcium Citrate Malate 500mg + Zinc",
      "N-Acetylcysteine (NAC) 600mg BD",
      "Chasteberry (Vitex agnus-castus) 400mg",
    ],
  },
];

const SURGICAL_HISTORY_CATALOG = [
  "No Prior Pelvic or Abdominal Surgery",
  "Diagnostic Laparoscopy (Pelvic Evaluation)",
  "Laparoscopic Ovarian Cystectomy",
  "Laparoscopic Endometriosis Excision / Ablation",
  "Laparoscopic / Hysteroscopic Myomectomy (Fibroid Removal)",
  "Operative Hysteroscopy / Polypectomy",
  "Dilatation & Curettage (D&C) / Suction Evacuation",
  "Lower Segment Cesarean Section (LSCS)",
  "Salpingectomy / Ectopic Pregnancy Surgery",
  "Appendectomy",
  "Cholecystectomy (Gallbladder)",
  "Thyroidectomy",
];

const ALLERGY_CATALOG = [
  "NKDA (No Known Drug or Latex Allergies)",
  "Penicillin / Amoxicillin / Beta-Lactams",
  "Sulfonamides (Sulfa Drugs / Co-trimoxazole)",
  "NSAIDs (Ibuprofen / Aspirin / Diclofenac / Mefenamic Acid)",
  "Fluoroquinolones (Ciprofloxacin / Ofloxacin)",
  "Macrolides (Azithromycin / Erythromycin)",
  "Metronidazole / Tinidazole",
  "Latex Sensitivity (Gloves / Condoms)",
  "Adhesive Tape / Sanitary Pad Fragrance Sensitivity",
  "Iodinated Contrast Media",
];

const FAMILY_HISTORY_CATALOG = [
  "No Significant Hereditary Gynecological or Endocrine History",
  "Polycystic Ovary Syndrome (Maternal / Sister)",
  "Endometriosis / Severe Dysmenorrhea (First-Degree Relative)",
  "Uterine Leiomyomas / Fibroids / Early Hysterectomy",
  "Hypothyroidism / Autoimmune Thyroid Disease",
  "Type 2 Diabetes Mellitus / Gestational Diabetes",
  "Premature Ovarian Insufficiency / Early Menopause (< 40 yrs)",
  "Bleeding or Coagulation Disorder (vWD / Thrombophilia)",
  "Breast Malignancy (Family History)",
  "Ovarian or Endometrial Malignancy (Family History)",
  "Essential Hypertension / Cardiovascular Disease",
];

const CLINICAL_THEMES = {
  cerulean: {
    name: "Clinical Cerulean & Obsidian (7948684.jpg Reference Blue + Black Ink)",
    rxBlueHex: "#1d6fa5",
    rxWaveBg: "#e6f3fb",
    rxWatermarkHex: "#d8edf9",
    accentBadgeBg: "bg-slate-900 text-white",
    headerBorder: "border-slate-900",
    sectionHeaderBg: "bg-slate-900 text-white",
  },
  obsidian: {
    name: "Obsidian Medical Ink (High-Contrast Black & Slate)",
    rxBlueHex: "#0f172a",
    rxWaveBg: "#f1f5f9",
    rxWatermarkHex: "#e2e8f0",
    accentBadgeBg: "bg-slate-900 text-white",
    headerBorder: "border-slate-900",
    sectionHeaderBg: "bg-slate-900 text-white",
  },
  bordeaux: {
    name: "Bordeaux Gynecology (Deep Clinical Burgundy & Ink)",
    rxBlueHex: "#881337",
    rxWaveBg: "#ffe4e6",
    rxWatermarkHex: "#fecdd3",
    accentBadgeBg: "bg-[#4c0519] text-white",
    headerBorder: "border-[#4c0519]",
    sectionHeaderBg: "bg-[#4c0519] text-white",
  },
  monochrome: {
    name: "Pure Archival Print (100% Solid Black for Colored Paper)",
    rxBlueHex: "#000000",
    rxWaveBg: "#f5f5f5",
    rxWatermarkHex: "#e5e5e5",
    accentBadgeBg: "bg-black text-white",
    headerBorder: "border-black",
    sectionHeaderBg: "bg-black text-white",
  },
} as const;

interface PatientIntakeDetails {
  fullName: string;
  ageOrDob: string;
  patientAddress: string;
  bloodGroup: string;
  heightCm: string;
  weightKg: string;
  waistCm: string;
  hipCm: string;
  bloodPressure: string;
  restingHr: string;
  occupation: string;
  emergencyContact: string;
  drugAllergies: string[];
  customAllergy: string;
  menarcheAge: string;
  gravidaPara: string;
  contraception: string;
  dysmenorrheaGrade: string;
  analgesicRelief: string;
  painRadiation: string;
  flowClotProfile: string;
  sanitaryProductProfile: string;
  ovulatoryMucusProfile: string;
  cervicalScreening: string;
  preventiveImmunization: string;
  hyperandrogenismScreen: string;
  thyroidGalactorrheaScreen: string;
  giUrinaryCorrelation: string;
  pmsFunctionalImpact: string;
  priorWorkup: string;
  usgEndometrialMm: string;
  labHemoglobin: string;
  labFerritin: string;
  labTsh: string;
  labFreeT4: string;
  labProlactin: string;
  labAmh: string;
  labLhFsh: string;
  labTestosterone: string;
  labHba1c: string;
  labFastingInsulin: string;
  labVitaminD: string;
  labVitaminB12: string;
  surgicalHistory: string[];
  customSurgery: string;
  lifestyleProfile: string;
  dietHydration: string;
  knownConditions: string[];
  customCondition: string;
  currentMedications: string[];
  customMedication: string;
  familyHistory: string[];
  attendingPhysician: string;
  physicianCredentials: string;
  physicianRegNo: string;
  clinicHospitalName: string;
  provisionalDiagnosis: string;
  chiefComplaint: string;
  patientSpecificGoals: string;
  reportWindowDays: number;
  pdfTheme: keyof typeof CLINICAL_THEMES;
  writingLinesCount: number;
  rxPadStyle: "open_canvas" | "faint_lines" | "table_plus_canvas";
  prefillRxPatientLines: boolean;
}

const DEFAULT_INTAKE: PatientIntakeDetails = {
  fullName: "",
  ageOrDob: "",
  patientAddress: "",
  bloodGroup: "O Positive (O+)",
  heightCm: "",
  weightKg: "",
  waistCm: "",
  hipCm: "",
  bloodPressure: "",
  restingHr: "",
  occupation: "",
  emergencyContact: "",
  drugAllergies: ["NKDA (No Known Drug or Latex Allergies)"],
  customAllergy: "",
  menarcheAge: "13 years (Population Median)",
  gravidaPara: "G0 P0 (Nulligravida / Nulliparous)",
  contraception: "None / Non-hormonal",
  dysmenorrheaGrade:
    "Grade 2 (VAS 4–6/10) — Moderate Cramping, Relieved by OTC NSAIDs, Normal Routine",
  analgesicRelief: "Moderate Relief (50–75%) with NSAID + Heating Pad",
  painRadiation: "Suprapubic Cramping Radiating to Lumbosacral Lower Back",
  flowClotProfile:
    "Normal Volume (~30–50 mL) — Pad/Tampon Every 4–6 Hrs, No Clots",
  sanitaryProductProfile:
    "Disposable Sanitary Pads — Regular Absorbency (3–4 pads/day on peak flow)",
  ovulatoryMucusProfile:
    "Clear Biphasic Pattern — Distinct Mid-Cycle Egg-White Cervical Mucus (EWCM)",
  cervicalScreening: "Not Applicable / Under Routine Cervical Screening Age",
  preventiveImmunization:
    "HPV Vaccine (Complete) • Rubella IgG Immune • Up-to-date Tetanus/Tdap",
  hyperandrogenismScreen:
    "None — Clear Skin, Normal Terminal Hair Distribution, No Alopecia",
  thyroidGalactorrheaScreen:
    "Euthyroid Clinical Screen — No Cold/Heat Intolerance or Galactorrhea",
  giUrinaryCorrelation: "No Significant Cyclical Bowel or Urinary Changes",
  pmsFunctionalImpact:
    "Mild — Noticeable Luteal Fatigue or Irritability (3–4 Days Pre-Menses), Fully Functional",
  priorWorkup: "None — Initial Gynecological Consultation",
  usgEndometrialMm: "",
  labHemoglobin: "",
  labFerritin: "",
  labTsh: "",
  labFreeT4: "",
  labProlactin: "",
  labAmh: "",
  labLhFsh: "",
  labTestosterone: "",
  labHba1c: "",
  labFastingInsulin: "",
  labVitaminD: "",
  labVitaminB12: "",
  surgicalHistory: ["No Prior Pelvic or Abdominal Surgery"],
  customSurgery: "",
  lifestyleProfile:
    "Non-Smoker • Restorative Sleep (7–8 hrs) • Moderate Daily Activity",
  dietHydration: "Balanced Omnivorous Diet • Adequate Hydration (2–2.5L/day)",
  knownConditions: [],
  customCondition: "",
  currentMedications: [],
  customMedication: "",
  familyHistory: [
    "No Significant Hereditary Gynecological or Endocrine History",
  ],
  attendingPhysician: "",
  physicianCredentials: "MD, DNB (Obstetrics & Gynecology)",
  physicianRegNo: "",
  clinicHospitalName: "",
  provisionalDiagnosis: "",
  chiefComplaint:
    "Comprehensive 90-day menstrual cycle, flow, and multi-system symptom evaluation.",
  patientSpecificGoals: "",
  reportWindowDays: 90,
  pdfTheme: "cerulean",
  writingLinesCount: 8,
  rxPadStyle: "open_canvas",
  prefillRxPatientLines: true,
};

export default function MedicalReportPage() {
  const [loading, setLoading] = useState(true);
  const [showIntakeStudio, setShowIntakeStudio] = useState(false);
  const [activeStudioSection, setActiveStudioSection] = useState<
    | "identity"
    | "menstrual"
    | "endocrine"
    | "labs"
    | "meds"
    | "preventive"
    | "doctor"
  >("identity");
  const [sheetPreviewMode, setSheetPreviewMode] = useState<
    "all_sheets" | "sheet1_patient" | "sheet2_workup" | "sheet3_rx"
  >("all_sheets");
  const [diaryFilter, setDiaryFilter] = useState<
    "all" | "bleeding" | "high_symptom"
  >("all");
  const [diarySearch, setDiarySearch] = useState("");
  const [copiedSummary, setCopiedSummary] = useState(false);

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

  useEffect(() => {
    try {
      const saved = localStorage.getItem("moonday_clinical_intake_v6");
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
          drugAllergies: Array.isArray(parsed.drugAllergies)
            ? parsed.drugAllergies
            : prev.drugAllergies,
          surgicalHistory: Array.isArray(parsed.surgicalHistory)
            ? parsed.surgicalHistory
            : prev.surgicalHistory,
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
          "moonday_clinical_intake_v6",
          JSON.stringify(updated),
        );
      } catch {
        // Ignore storage errors
      }
      return updated;
    });
  };

  const addTagItem = (
    field:
      | "knownConditions"
      | "currentMedications"
      | "familyHistory"
      | "drugAllergies"
      | "surgicalHistory",
    item: string,
    defaultPlaceholderToClear?: string,
  ) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    const current = intake[field];
    if (current.includes(trimmed)) return;
    const filtered = defaultPlaceholderToClear
      ? current.filter((i) => i !== defaultPlaceholderToClear)
      : current;
    updateIntakeField(field, [...filtered, trimmed]);
  };

  const removeTagItem = (
    field:
      | "knownConditions"
      | "currentMedications"
      | "familyHistory"
      | "drugAllergies"
      | "surgicalHistory",
    item: string,
  ) => {
    const current = intake[field];
    updateIntakeField(
      field,
      current.filter((i) => i !== item),
    );
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

  // Filtered diary logs for interactive search & filter
  const filteredDiaryLogs = useMemo(() => {
    return logs.filter((log) => {
      const { flow, color, discharge } = extractDailyAttributes(log);
      const syms = parseClinicalList(log.symptoms ?? log.physical_symptoms);
      const moods = parseClinicalList(log.moods ?? log.mood);

      if (diaryFilter === "bleeding") {
        const hasBleed =
          log.is_period_start ||
          log.is_period_end ||
          log.is_spotting ||
          flow.length > 0 ||
          color.length > 0;
        if (!hasBleed) return false;
      } else if (diaryFilter === "high_symptom") {
        if (syms.length + moods.length < 3) return false;
      }

      if (diarySearch.trim()) {
        const q = diarySearch.toLowerCase();
        const combined = [
          ...flow,
          ...color,
          ...discharge,
          ...syms,
          ...moods,
          log.note || "",
          log.log_date,
        ]
          .join(" ")
          .toLowerCase();
        if (!combined.includes(q)) return false;
      }

      return true;
    });
  }, [logs, diaryFilter, diarySearch]);

  // Comprehensive OB-GYN Review of Systems (ROS), Anatomical Pain Map & Top Symptoms
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

    const anatomicalZones = {
      uterineSuprapubic: 0,
      adnexalOvarian: 0,
      lumbosacralBack: 0,
      epigastricGi: 0,
      mammaryBreast: 0,
      cranialNeuro: 0,
    };

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

        const lower = s.toLowerCase();
        if (/cramp|uter|pelvi|spasm/.test(lower))
          anatomicalZones.uterineSuprapubic++;
        if (/ovary|ovarian/.test(lower)) anatomicalZones.adnexalOvarian++;
        if (/back|lower-back|backache/.test(lower))
          anatomicalZones.lumbosacralBack++;
        if (/stomach|abdomin|bloat|indigest|bowel|nausea/.test(lower))
          anatomicalZones.epigastricGi++;
        if (/breast/.test(lower)) anatomicalZones.mammaryBreast++;
        if (/headache|migraine|dizz|brain fog/.test(lower))
          anatomicalZones.cranialNeuro++;
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
      anatomicalZones,
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

  // Anthropometrics: BMI, BSA (Mosteller), and Waist-to-Hip Ratio (WHR)
  const anthropometrics = useMemo(() => {
    const h = parseFloat(intake.heightCm);
    const w = parseFloat(intake.weightKg);
    const waist = parseFloat(intake.waistCm);
    const hip = parseFloat(intake.hipCm);

    let bmiText: string | null = null;
    let bsaText: string | null = null;
    let whrText: string | null = null;

    if (h > 50 && w > 20) {
      const m = h / 100;
      const bmi = w / (m * m);
      const bsa = Math.sqrt((h * w) / 3600);
      let category = "Normal";
      if (bmi < 18.5) category = "Underweight";
      else if (bmi >= 25 && bmi < 30) category = "Overweight";
      else if (bmi >= 30) category = "Obese";
      bmiText = `${bmi.toFixed(1)} kg/m² (${category})`;
      bsaText = `${bsa.toFixed(2)} m²`;
    }

    if (waist > 30 && hip > 30) {
      const whr = waist / hip;
      whrText = `${whr.toFixed(2)} (${whr > 0.85 ? "Central Adiposity" : "Normal ≤0.85"})`;
    }

    return { bmiText, bsaText, whrText };
  }, [intake.heightCm, intake.weightKg, intake.waistCm, intake.hipCm]);

  // Automated FIGO / ACOG Clinical Evaluation Matrix
  const clinicalDecisionSupport = useMemo(() => {
    const flags: {
      parameter: string;
      status: string;
      benchmark: string;
      note: string;
    }[] = [];

    if (stats.avgCycle < 24) {
      flags.push({
        parameter: "Cycle Frequency",
        status: `${stats.avgCycle} Days (Polymenorrhea)`,
        benchmark: "FIGO: 24–38 Days",
        note: "Shortened cycle interval. Evaluate luteal phase adequacy, TSH, and serum prolactin.",
      });
    } else if (stats.avgCycle > 38) {
      flags.push({
        parameter: "Cycle Frequency",
        status: `${stats.avgCycle} Days (Oligomenorrhea)`,
        benchmark: "FIGO: 24–38 Days",
        note: "Prolonged cycle interval. Screen for oligo-ovulation, PCOS (Rotterdam criteria), or thyroid shift.",
      });
    } else {
      flags.push({
        parameter: "Cycle Frequency",
        status: `${stats.avgCycle} Days (Normal)`,
        benchmark: "FIGO: 24–38 Days",
        note: "Mean cycle interval falls within normal FIGO reproductive parameters.",
      });
    }

    if (stats.cycleVariance > 7) {
      flags.push({
        parameter: "Cycle Regularity (Δ)",
        status: `${stats.minCycle}–${stats.maxCycle}d (Δ ${stats.cycleVariance}d • σ=${stats.cycleStdDev}d)`,
        benchmark: "FIGO: Δ ≤ 7–9 Days",
        note: "Elevated cycle-to-cycle variance indicates variable follicular phase length / ovulation timing.",
      });
    } else {
      flags.push({
        parameter: "Cycle Regularity (Δ)",
        status: `${stats.minCycle}–${stats.maxCycle}d (Δ ${stats.cycleVariance}d • Regular)`,
        benchmark: "FIGO: Δ ≤ 7–9 Days",
        note: "Consistent cycle-to-cycle periodicity.",
      });
    }

    if (stats.avgDuration > 8 || intake.flowClotProfile.includes("Heavy")) {
      flags.push({
        parameter: "Menses Duration & Volume",
        status: `${stats.avgDuration} Days • ${intake.flowClotProfile.split("—")[0].trim()}`,
        benchmark: "FIGO: ≤ 8 Days",
        note: "Screen for Heavy Menstrual Bleeding (HMB). Recommend CBC, Serum Ferritin, and Pelvic USG.",
      });
    } else {
      flags.push({
        parameter: "Menses Duration & Volume",
        status: `${stats.avgDuration} Days (${stats.activeBleedDaysCount}d total in window)`,
        benchmark: "FIGO: ≤ 8 Days",
        note: "Normal bleeding duration and self-reported sanitary load.",
      });
    }

    flags.push({
      parameter: "Dysmenorrhea & Relief",
      status: intake.dysmenorrheaGrade.split("—")[0].trim(),
      benchmark: "VAS 0–3 Mild",
      note: `${intake.painRadiation}. Analgesic response: ${intake.analgesicRelief}.`,
    });

    return flags;
  }, [stats, intake]);

  const patientName =
    intake.fullName ||
    profile?.full_name ||
    profile?.display_name ||
    userAuth?.user_metadata?.full_name ||
    userAuth?.email?.split("@")[0] ||
    "Registered Patient";

  const patientEmail = profile?.email || userAuth?.email || "On File";
  const reportId = `MD-${format(reportEndDate, "yyyyMMdd")}-${(
    userAuth?.id || "0000"
  )
    .slice(0, 6)
    .toUpperCase()}`;

  const theme = CLINICAL_THEMES[intake.pdfTheme || "cerulean"];

  const hasLabValues = Boolean(
    intake.labHemoglobin ||
    intake.labFerritin ||
    intake.labTsh ||
    intake.labFreeT4 ||
    intake.labProlactin ||
    intake.labAmh ||
    intake.labLhFsh ||
    intake.labTestosterone ||
    intake.labHba1c ||
    intake.labFastingInsulin ||
    intake.labVitaminD ||
    intake.labVitaminB12 ||
    intake.usgEndometrialMm,
  );

  // Backup & Restore JSON
  const handleExportProfileJson = () => {
    const blob = new Blob([JSON.stringify(intake, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MoonDay_Clinical_Profile_${patientName.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportProfileJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result));
        setIntake((prev) => {
          const merged = { ...prev, ...parsed };
          localStorage.setItem(
            "moonday_clinical_intake_v6",
            JSON.stringify(merged),
          );
          return merged;
        });
      } catch {
        // Ignore invalid JSON
      }
    };
    reader.readAsText(file);
  };

  // Copy EHR Text Summary
  const handleCopyClinicalSummary = () => {
    const topSyms =
      clinicalAnalysis.topSymptoms
        .slice(0, 6)
        .map(([s, c]) => `${s} (${c}d)`)
        .join(", ") || "None";

    const summaryText = [
      `MOONDAY OB-GYN CLINICAL DOSSIER (${reportId})`,
      `Patient: ${patientName} (${intake.ageOrDob || "Adult"}) | Blood Group: ${intake.bloodGroup}${anthropometrics.bmiText ? ` | BMI: ${anthropometrics.bmiText}` : ""}`,
      `Observation Window: ${format(reportStartDate, "MMM d, yyyy")} - ${format(reportEndDate, "MMM d, yyyy")} (${intake.reportWindowDays}d, ${logs.length} logs)`,
      `LMP: ${stats.lmpDate ? format(parseISO(stats.lmpDate), "MMM d, yyyy") : "Not logged"} | Parity: ${intake.gravidaPara} | Menarche: ${intake.menarcheAge}`,
      `Cycle Biometrics: Mean Length ${stats.avgCycle}d (Range ${stats.minCycle}-${stats.maxCycle}d, Δ ${stats.cycleVariance}d) | Mean Bleed ${stats.avgDuration}d | Spotting: ${stats.spottingDaysCount}d`,
      `Contraception: ${intake.contraception} | Dysmenorrhea: ${intake.dysmenorrheaGrade}`,
      `Flow & Sanitary Load: ${intake.flowClotProfile} | ${intake.sanitaryProductProfile}`,
      `Diagnoses: ${intake.knownConditions.join(", ") || "None"} | Active Meds: ${intake.currentMedications.join(", ") || "None"}`,
      `Allergies: ${intake.drugAllergies.join(", ") || "NKDA"}`,
      `Top Logged Symptoms: ${topSyms}`,
      `Chief Complaint: ${intake.chiefComplaint}`,
    ].join("\n");

    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      "Date",
      "Cycle Day",
      "Phase",
      "Bleeding Event",
      "Flow",
      "Color",
      "Discharge",
      "Physical Symptoms",
      "Affective / Moods",
      "Notes",
    ];
    const rows = filteredDiaryLogs.map((log) => {
      const { flow, color, discharge } = extractDailyAttributes(log);
      const syms = parseClinicalList(log.symptoms ?? log.physical_symptoms);
      const moods = parseClinicalList(log.moods ?? log.mood);
      const { cd, phase } = getCycleDayAndPhase(log.log_date);
      const bleed = log.is_period_start
        ? "Menses Start"
        : log.is_period_end
          ? "Menses End"
          : log.is_spotting
            ? "Spotting"
            : flow.length > 0
              ? "Active Bleed"
              : "-";

      return [
        log.log_date,
        cd ? `CD ${cd}` : "-",
        phase,
        bleed,
        flow.join("; "),
        color.join("; "),
        discharge.join("; "),
        syms.join("; "),
        moods.join("; "),
        (log.note || "").replace(/"/g, '""'),
      ]
        .map((cell) => `"${cell}"`)
        .join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `MoonDay_Clinical_Diary_${reportId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Zero-Gap Calibrated A4 Print Engine:
   * - Sheet 1 flows continuously without giant blank gaps between sections.
   * - Sheet 2 fits Part A + Part B + Part C on a single A4 page.
   * - Sheet 3 locks the 7948684.jpg Rx Pad AND Dual Signatures onto a single A4 page.
   */
  const handlePrint = () => {
    const sheet1Node = document.getElementById("moonday-pdf-sheet-1");
    const sheet2Node = document.getElementById("moonday-pdf-sheet-2");
    const sheet3Node = document.getElementById("moonday-pdf-sheet-3");

    if (!sheet1Node && !sheet2Node && !sheet3Node) {
      window.print();
      return;
    }

    const printWindow = window.open("", "_blank", "width=1120,height=960");
    if (!printWindow) {
      window.print();
      return;
    }

    const styles = Array.from(
      document.querySelectorAll('style, link[rel="stylesheet"]'),
    )
      .map((el) => el.outerHTML)
      .join("\n");

    const pagesHtml: string[] = [];
    if (sheet1Node)
      pagesHtml.push(
        `<div class="pdf-sheet-flow">${sheet1Node.innerHTML}</div>`,
      );
    if (sheet2Node)
      pagesHtml.push(
        `<div class="${pagesHtml.length > 0 ? "pdf-page-break" : ""} pdf-single-page-fit">${sheet2Node.innerHTML}</div>`,
      );
    if (sheet3Node)
      pagesHtml.push(
        `<div class="${pagesHtml.length > 0 ? "pdf-page-break" : ""} pdf-rx-page-lock">${sheet3Node.innerHTML}</div>`,
      );

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${patientName} — OB-GYN Clinical Dossier & Rx Pad (${reportId})</title>
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #0f172a !important;
              font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif !important;
              font-size: 10px !important;
              line-height: 1.38 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box !important;
            }
            .print-hide-inside {
              display: none !important;
            }
            .pdf-page-break {
              page-break-before: always !important;
              break-before: page !important;
            }
            /* Sheet 1 continuous packing: no giant section page jumps */
            .pdf-sheet-flow {
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .pdf-section-header {
              page-break-after: avoid !important;
              break-after: avoid-page !important;
            }
            .pdf-unit-card {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            /* Sheet 2: Calibrated to fit Part A + Part B + Part C on exactly 1 A4 page */
            .pdf-single-page-fit {
              width: 100% !important;
              max-height: 279mm !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            /* Sheet 3: Locks 7948684.jpg Rx Pad + Signatures onto 1 single A4 page */
            .pdf-rx-page-lock {
              width: 100% !important;
              height: 278mm !important;
              max-height: 278mm !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              overflow: hidden !important;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
              page-break-inside: auto !important;
            }
            thead {
              display: table-header-group !important;
            }
            /* Allow very tall diary rows (e.g. 70+ symptoms) to flow across pages without leaving a half-page hole */
            tr {
              page-break-inside: auto !important;
              break-inside: auto !important;
            }
            tr.compact-row {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
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
            .pdf-grid-12 {
              display: grid !important;
              grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
            }
            .pdf-col-7 {
              grid-column: span 7 / span 7 !important;
            }
            .pdf-col-5 {
              grid-column: span 5 / span 5 !important;
            }
          </style>
        </head>
        <body>
          ${pagesHtml.join("\n")}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
                window.close();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-900 font-semibold text-sm">
        Loading 3-sheet clinical dossier & prescription workstation...
      </div>
    );
  }

  const formattedDoctorTitle = intake.attendingPhysician
    ? intake.attendingPhysician.startsWith("Dr.")
      ? intake.attendingPhysician
      : `Dr. ${intake.attendingPhysician}`
    : "Dr. Attending Gynecologist";

  return (
    <div className="w-full max-w-[1140px] mx-auto my-4 px-3 sm:px-6 print:m-0 print:p-0 print:max-w-none">
      {/* Fallback Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
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
          .print-hide,
          .print-hide-inside {
            display: none !important;
          }
          .pdf-page-break {
            page-break-before: always !important;
            break-before: page !important;
          }
          .pdf-section-header {
            page-break-after: avoid !important;
            break-after: avoid-page !important;
          }
          .pdf-unit-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
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
          thead {
            display: table-header-group !important;
          }
        }
      `}</style>


      <div className="print-hide mb-8 bg-white border-2 border-slate-900 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 bg-[#FAF8F5] border-b border-slate-300 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-700">
              <span>MoonDay 3-Sheet Clinical Suite</span>
              <span>•</span>
              <span>Zero-Gap PDF Pagination</span>
              <span>•</span>
              <span className="px-2 py-0.5 bg-[#1d6fa5] text-white rounded text-[10px]">
                1-Page Locked Exam & 1-Page Locked Rx Pad
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight mt-1">
              Patient Dossier, Examination Tick-Sheet & Official Prescription
              Pad
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* 3-Sheet View Switcher */}
            <div className="inline-flex flex-wrap rounded-lg border border-slate-400 bg-white p-1 text-xs">
              {(
                [
                  { id: "all_sheets", label: "All 3 Sheets" },
                  { id: "sheet1_patient", label: "Sheet 1: Patient Dossier" },
                  { id: "sheet2_workup", label: "Sheet 2: Exam & Tick-Sheet" },
                  { id: "sheet3_rx", label: "Sheet 3: Doctor Rx Pad" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSheetPreviewMode(tab.id)}
                  className={`px-2.5 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                    sheetPreviewMode === tab.id
                      ? "bg-slate-900 text-white"
                      : "text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowIntakeStudio((prev) => !prev)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border-2 transition-all cursor-pointer ${
                showIntakeStudio
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-900 border-slate-900 hover:bg-slate-100"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {showIntakeStudio
                ? "Close Intake Studio"
                : "Fill Patient & Rx Details"}
              {showIntakeStudio ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyClinicalSummary}
              className="flex items-center gap-1.5 px-3 py-2 bg-white text-slate-900 border border-slate-400 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="text-emerald-800">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-700" />
                  <span>Copy EHR</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 bg-white text-slate-900 border border-slate-400 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-700" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-[#1d6fa5] text-white rounded-lg text-xs font-bold hover:opacity-95 transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Export Zero-Gap PDF</span>
            </button>
          </div>
        </div>

        {/* ===================================================================
            2-PANE CLINICAL INTAKE STUDIO (7 ORGANIZED SECTIONS, ZERO CLUTTER)
        =================================================================== */}
        {showIntakeStudio && (
          <div className="grid grid-cols-1 lg:grid-cols-12 bg-white">
            {/* Left Sidebar Navigation */}
            <div className="lg:col-span-3 bg-[#F5F3EF] border-b lg:border-b-0 lg:border-r border-slate-300 p-5 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 px-3 mb-3">
                  Clinical Intake Studio (7 Steps)
                </div>
                {(
                  [
                    {
                      id: "identity",
                      label: "1. Identity, Address & Vitals",
                      icon: User,
                    },
                    {
                      id: "menstrual",
                      label: "2. Menstrual, Flow & Contraception",
                      icon: Activity,
                    },
                    {
                      id: "endocrine",
                      label: "3. Pain Relief, Endocrine & GI",
                      icon: Stethoscope,
                    },
                    {
                      id: "labs",
                      label: "4. Baseline Labs, USG & Surgery",
                      icon: FlaskConical,
                    },
                    {
                      id: "meds",
                      label: "5. Diagnoses, Meds & Family Hx",
                      icon: Pill,
                    },
                    {
                      id: "preventive",
                      label: "6. Preventive, Vaccines & Diet",
                      icon: ShieldCheck,
                    },
                    {
                      id: "doctor",
                      label: "7. Doctor Rx Pad & Ink Setup",
                      icon: Layers,
                    },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon;
                  const active = activeStudioSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveStudioSection(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-left text-xs font-bold transition-all cursor-pointer ${
                        active
                          ? "bg-slate-900 text-white shadow-2xs"
                          : "text-slate-800 hover:bg-slate-200/70"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-6 mt-6 border-t border-slate-300 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleExportProfileJson}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-400 rounded-lg font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Save JSON
                  </button>
                  <label className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-400 rounded-lg font-bold text-slate-800 hover:bg-slate-100 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> Load JSON
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportProfileJson}
                      className="hidden"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("moonday_clinical_intake_v6");
                    setIntake({ ...DEFAULT_INTAKE, fullName: patientName });
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-slate-700 hover:text-rose-800 font-bold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset All Intake Fields
                </button>
              </div>
            </div>

            <div className="lg:col-span-9 p-6 sm:p-8">
              {/* SECTION 1: IDENTITY, ADDRESS, VITALS & ALLERGIES */}
              {activeStudioSection === "identity" && (
                <div className="space-y-6">
                  <div className="border-b border-slate-300 pb-3">
                    <h3 className="text-base font-extrabold text-slate-950">
                      1. Patient Identification, Address, Anthropometrics &
                      Allergies
                    </h3>
                    <p className="text-xs text-slate-700 mt-0.5">
                      Populates Sheet 01 (Patient Dossier) and the top lines of
                      Sheet 03 (Doctor Prescription Pad).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Patient Full Legal Name
                      </label>
                      <input
                        type="text"
                        value={intake.fullName}
                        onChange={(e) =>
                          updateIntakeField("fullName", e.target.value)
                        }
                        placeholder="e.g. Ananya Sharma"
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950 focus:outline-none focus:border-slate-950"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Age & Date of Birth
                      </label>
                      <input
                        type="text"
                        value={intake.ageOrDob}
                        onChange={(e) =>
                          updateIntakeField("ageOrDob", e.target.value)
                        }
                        placeholder="e.g. 24 Years (14 May 2002)"
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950 focus:outline-none focus:border-slate-950"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Patient Residential Address / City (For Prescription Pad
                        Line)
                      </label>
                      <input
                        type="text"
                        value={intake.patientAddress}
                        onChange={(e) =>
                          updateIntakeField("patientAddress", e.target.value)
                        }
                        placeholder="e.g. Civil Lines, Raipur, Chhattisgarh (or leave blank to handwrite)"
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950 focus:outline-none focus:border-slate-950"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Blood Group & Rh Phenotype
                      </label>
                      <select
                        value={intake.bloodGroup}
                        onChange={(e) =>
                          updateIntakeField("bloodGroup", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950 cursor-pointer"
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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-900 mb-2">
                          Height (cm)
                        </label>
                        <input
                          type="number"
                          value={intake.heightCm}
                          onChange={(e) =>
                            updateIntakeField("heightCm", e.target.value)
                          }
                          placeholder="164"
                          className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-900 mb-2">
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          value={intake.weightKg}
                          onChange={(e) =>
                            updateIntakeField("weightKg", e.target.value)
                          }
                          placeholder="58"
                          className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-900 mb-2">
                          Baseline Blood Pressure
                        </label>
                        <input
                          type="text"
                          value={intake.bloodPressure}
                          onChange={(e) =>
                            updateIntakeField("bloodPressure", e.target.value)
                          }
                          placeholder="118/76 mmHg"
                          className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-900 mb-2">
                          Resting Pulse
                        </label>
                        <input
                          type="text"
                          value={intake.restingHr}
                          onChange={(e) =>
                            updateIntakeField("restingHr", e.target.value)
                          }
                          placeholder="72 bpm"
                          className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Occupation / Daily Routine
                      </label>
                      <input
                        type="text"
                        value={intake.occupation}
                        onChange={(e) =>
                          updateIntakeField("occupation", e.target.value)
                        }
                        placeholder="e.g. Software Engineer / Student"
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950"
                      />
                    </div>
                  </div>

                  {/* Drug & Latex Allergy Dropdown Adder */}
                  <div className="bg-[#FAF8F5] border border-slate-300 rounded-xl p-5">
                    <label className="block text-xs font-bold text-slate-900 mb-2">
                      Drug, Contrast & Latex Allergies
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            addTagItem(
                              "drugAllergies",
                              e.target.value,
                              "NKDA (No Known Drug or Latex Allergies)",
                            );
                          }
                        }}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-400 rounded-lg text-xs font-semibold text-slate-950 cursor-pointer"
                      >
                        <option value="">
                          + Select an Allergy from Clinical List...
                        </option>
                        {ALLERGY_CATALOG.map((al) => (
                          <option key={al} value={al}>
                            {al}
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={intake.customAllergy}
                          onChange={(e) =>
                            updateIntakeField("customAllergy", e.target.value)
                          }
                          placeholder="Or type custom allergy..."
                          className="flex-1 px-3.5 py-2 bg-white border border-slate-400 rounded-lg text-xs font-semibold text-slate-950"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            addTagItem(
                              "drugAllergies",
                              intake.customAllergy,
                              "NKDA (No Known Drug or Latex Allergies)",
                            );
                            updateIntakeField("customAllergy", "");
                          }}
                          className="px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {intake.drugAllergies.map((al) => (
                        <span
                          key={al}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-400 rounded-md text-xs font-bold text-slate-900"
                        >
                          {al}
                          <button
                            type="button"
                            onClick={() => removeTagItem("drugAllergies", al)}
                            className="text-slate-600 hover:text-rose-700 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: MENSTRUAL, FLOW & CONTRACEPTION */}
              {activeStudioSection === "menstrual" && (
                <div className="space-y-6">
                  <div className="border-b border-slate-300 pb-3">
                    <h3 className="text-base font-extrabold text-slate-950">
                      2. Menstrual History, Sanitary Load & Contraceptive
                      Regimen
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Contraceptive Method / Hormonal Therapy
                      </label>
                      <select
                        value={intake.contraception}
                        onChange={(e) =>
                          updateIntakeField("contraception", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950 cursor-pointer"
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
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Obstetric Parity (GPAL Status)
                      </label>
                      <select
                        value={intake.gravidaPara}
                        onChange={(e) =>
                          updateIntakeField("gravidaPara", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950 cursor-pointer"
                      >
                        {OBSTETRIC_PARITY_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Menstrual Flow Volume & Clot Passage Profile
                      </label>
                      <select
                        value={intake.flowClotProfile}
                        onChange={(e) =>
                          updateIntakeField("flowClotProfile", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950 cursor-pointer"
                      >
                        {FLOW_CLOT_PROFILES.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Sanitary Product Type & Peak Daily Absorbency Load
                      </label>
                      <select
                        value={intake.sanitaryProductProfile}
                        onChange={(e) =>
                          updateIntakeField(
                            "sanitaryProductProfile",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950 cursor-pointer"
                      >
                        {SANITARY_PRODUCT_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Ovulatory & Cervical Mucus Pattern
                      </label>
                      <select
                        value={intake.ovulatoryMucusProfile}
                        onChange={(e) =>
                          updateIntakeField(
                            "ovulatoryMucusProfile",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950 cursor-pointer"
                      >
                        {OVULATORY_MUCUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Age at Menarche (First Menstrual Period)
                      </label>
                      <select
                        value={intake.menarcheAge}
                        onChange={(e) =>
                          updateIntakeField("menarcheAge", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950 cursor-pointer"
                      >
                        {MENARCHE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: PAIN, ANALGESIC RELIEF, ENDOCRINE & GI CORRELATION */}
              {activeStudioSection === "endocrine" && (
                <div className="space-y-6">
                  <div className="border-b border-slate-300 pb-3">
                    <h3 className="text-base font-extrabold text-slate-950">
                      3. Dysmenorrhea Pain Mapping, Analgesic Response &
                      Endocrine Screen
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Dysmenorrhea Severity Grade (VAS 0–10)
                      </label>
                      <select
                        value={intake.dysmenorrheaGrade}
                        onChange={(e) =>
                          updateIntakeField("dysmenorrheaGrade", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950 cursor-pointer"
                      >
                        {DYSMENORRHEA_GRADES.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Analgesic / Heat Therapy Pain Relief Efficacy
                      </label>
                      <select
                        value={intake.analgesicRelief}
                        onChange={(e) =>
                          updateIntakeField("analgesicRelief", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950 cursor-pointer"
                      >
                        {ANALGESIC_RELIEF_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Pelvic Pain Anatomical Radiation Pattern
                      </label>
                      <select
                        value={intake.painRadiation}
                        onChange={(e) =>
                          updateIntakeField("painRadiation", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950 cursor-pointer"
                      >
                        {PAIN_RADIATION_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Hyperandrogenism & Dermatological Screen
                      </label>
                      <select
                        value={intake.hyperandrogenismScreen}
                        onChange={(e) =>
                          updateIntakeField(
                            "hyperandrogenismScreen",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950 cursor-pointer"
                      >
                        {HYPERANDROGENISM_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Thyroid, Prolactin & Breast Symptom Screen
                      </label>
                      <select
                        value={intake.thyroidGalactorrheaScreen}
                        onChange={(e) =>
                          updateIntakeField(
                            "thyroidGalactorrheaScreen",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950 cursor-pointer"
                      >
                        {THYROID_GALACTORRHEA_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Cyclical Gastrointestinal & Urinary Correlation
                      </label>
                      <select
                        value={intake.giUrinaryCorrelation}
                        onChange={(e) =>
                          updateIntakeField(
                            "giUrinaryCorrelation",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950 cursor-pointer"
                      >
                        {GI_URINARY_CORRELATION_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Luteal Phase (PMS / PMDD) Functional Impact
                      </label>
                      <select
                        value={intake.pmsFunctionalImpact}
                        onChange={(e) =>
                          updateIntakeField(
                            "pmsFunctionalImpact",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950 cursor-pointer"
                      >
                        {PMS_FUNCTIONAL_IMPACT_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 4: BASELINE LABS, USG & SURGICAL HISTORY */}
              {activeStudioSection === "labs" && (
                <div className="space-y-6">
                  <div className="border-b border-slate-300 pb-3">
                    <h3 className="text-base font-extrabold text-slate-950">
                      4. Baseline Laboratory Values, Pelvic Ultrasound &
                      Surgical History
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Prior Pelvic Ultrasound (TAS / TVS) Summary
                      </label>
                      <select
                        value={intake.priorWorkup}
                        onChange={(e) =>
                          updateIntakeField("priorWorkup", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950 cursor-pointer"
                      >
                        {PRIOR_WORKUP_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        USG Endometrial Thickness (ET mm) & Ovarian Note
                      </label>
                      <input
                        type="text"
                        value={intake.usgEndometrialMm}
                        onChange={(e) =>
                          updateIntakeField("usgEndometrialMm", e.target.value)
                        }
                        placeholder="e.g. ET 7.8 mm Trilaminar • Bilateral Ovaries Normal"
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        Hemoglobin (g/dL)
                      </label>
                      <input
                        type="text"
                        value={intake.labHemoglobin}
                        onChange={(e) =>
                          updateIntakeField("labHemoglobin", e.target.value)
                        }
                        placeholder="12.4 g/dL"
                        className="w-full px-3.5 py-2 bg-white border border-slate-400 rounded-lg text-xs font-semibold text-slate-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        Serum Ferritin (ng/mL)
                      </label>
                      <input
                        type="text"
                        value={intake.labFerritin}
                        onChange={(e) =>
                          updateIntakeField("labFerritin", e.target.value)
                        }
                        placeholder="42 ng/mL"
                        className="w-full px-3.5 py-2 bg-white border border-slate-400 rounded-lg text-xs font-semibold text-slate-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        TSH (mIU/L)
                      </label>
                      <input
                        type="text"
                        value={intake.labTsh}
                        onChange={(e) =>
                          updateIntakeField("labTsh", e.target.value)
                        }
                        placeholder="1.95 mIU/L"
                        className="w-full px-3.5 py-2 bg-white border border-slate-400 rounded-lg text-xs font-semibold text-slate-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        Free T4 (ng/dL)
                      </label>
                      <input
                        type="text"
                        value={intake.labFreeT4}
                        onChange={(e) =>
                          updateIntakeField("labFreeT4", e.target.value)
                        }
                        placeholder="1.2 ng/dL"
                        className="w-full px-3.5 py-2 bg-white border border-slate-400 rounded-lg text-xs font-semibold text-slate-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        Prolactin (ng/mL)
                      </label>
                      <input
                        type="text"
                        value={intake.labProlactin}
                        onChange={(e) =>
                          updateIntakeField("labProlactin", e.target.value)
                        }
                        placeholder="14.0 ng/mL"
                        className="w-full px-3.5 py-2 bg-white border border-slate-400 rounded-lg text-xs font-semibold text-slate-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        AMH (ng/mL)
                      </label>
                      <input
                        type="text"
                        value={intake.labAmh}
                        onChange={(e) =>
                          updateIntakeField("labAmh", e.target.value)
                        }
                        placeholder="3.2 ng/mL"
                        className="w-full px-3.5 py-2 bg-white border border-slate-400 rounded-lg text-xs font-semibold text-slate-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        Day 2 LH / FSH
                      </label>
                      <input
                        type="text"
                        value={intake.labLhFsh}
                        onChange={(e) =>
                          updateIntakeField("labLhFsh", e.target.value)
                        }
                        placeholder="6.1 / 5.4"
                        className="w-full px-3.5 py-2 bg-white border border-slate-400 rounded-lg text-xs font-semibold text-slate-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        Total Testosterone
                      </label>
                      <input
                        type="text"
                        value={intake.labTestosterone}
                        onChange={(e) =>
                          updateIntakeField("labTestosterone", e.target.value)
                        }
                        placeholder="32 ng/dL"
                        className="w-full px-3.5 py-2 bg-white border border-slate-400 rounded-lg text-xs font-semibold text-slate-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        HbA1c (%)
                      </label>
                      <input
                        type="text"
                        value={intake.labHba1c}
                        onChange={(e) =>
                          updateIntakeField("labHba1c", e.target.value)
                        }
                        placeholder="5.1%"
                        className="w-full px-3.5 py-2 bg-white border border-slate-400 rounded-lg text-xs font-semibold text-slate-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        Fasting Insulin
                      </label>
                      <input
                        type="text"
                        value={intake.labFastingInsulin}
                        onChange={(e) =>
                          updateIntakeField("labFastingInsulin", e.target.value)
                        }
                        placeholder="6.8 µIU/mL"
                        className="w-full px-3.5 py-2 bg-white border border-slate-400 rounded-lg text-xs font-semibold text-slate-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        25-OH Vitamin D
                      </label>
                      <input
                        type="text"
                        value={intake.labVitaminD}
                        onChange={(e) =>
                          updateIntakeField("labVitaminD", e.target.value)
                        }
                        placeholder="36 ng/mL"
                        className="w-full px-3.5 py-2 bg-white border border-slate-400 rounded-lg text-xs font-semibold text-slate-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        Vitamin B12 (pg/mL)
                      </label>
                      <input
                        type="text"
                        value={intake.labVitaminB12}
                        onChange={(e) =>
                          updateIntakeField("labVitaminB12", e.target.value)
                        }
                        placeholder="480 pg/mL"
                        className="w-full px-3.5 py-2 bg-white border border-slate-400 rounded-lg text-xs font-semibold text-slate-950"
                      />
                    </div>
                  </div>

                  {/* Surgical History Dropdown Adder */}
                  <div className="bg-[#FAF8F5] border border-slate-300 rounded-xl p-5">
                    <label className="block text-xs font-bold text-slate-900 mb-2">
                      Pelvic & Abdominal Surgical / Procedural History
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            addTagItem(
                              "surgicalHistory",
                              e.target.value,
                              "No Prior Pelvic or Abdominal Surgery",
                            );
                          }
                        }}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-400 rounded-lg text-xs font-semibold text-slate-950 cursor-pointer"
                      >
                        <option value="">
                          + Select a Procedure from Surgical Catalog...
                        </option>
                        {SURGICAL_HISTORY_CATALOG.map((sx) => (
                          <option key={sx} value={sx}>
                            {sx}
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={intake.customSurgery}
                          onChange={(e) =>
                            updateIntakeField("customSurgery", e.target.value)
                          }
                          placeholder="Or type custom surgery with year..."
                          className="flex-1 px-3.5 py-2 bg-white border border-slate-400 rounded-lg text-xs font-semibold text-slate-950"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            addTagItem(
                              "surgicalHistory",
                              intake.customSurgery,
                              "No Prior Pelvic or Abdominal Surgery",
                            );
                            updateIntakeField("customSurgery", "");
                          }}
                          className="px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {intake.surgicalHistory.map((sx) => (
                        <span
                          key={sx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-400 rounded-md text-xs font-bold text-slate-900"
                        >
                          {sx}
                          <button
                            type="button"
                            onClick={() => removeTagItem("surgicalHistory", sx)}
                            className="text-slate-600 hover:text-rose-700 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 5: DIAGNOSES, MEDICATIONS & FAMILY HISTORY */}
              {activeStudioSection === "meds" && (
                <div className="space-y-6">
                  <div className="border-b border-slate-300 pb-3">
                    <h3 className="text-base font-extrabold text-slate-950">
                      5. Known Diagnoses, Active Medications & Family History
                    </h3>
                  </div>

                  {/* Known Conditions Dropdown Adder */}
                  <div className="bg-[#FAF8F5] border border-slate-300 rounded-xl p-5">
                    <label className="block text-xs font-bold text-slate-900 mb-2">
                      Known Gynecological, Endocrine & Systemic Conditions
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            addTagItem("knownConditions", e.target.value);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-400 rounded-lg text-xs font-semibold text-slate-950 cursor-pointer"
                      >
                        <option value="">
                          + Select Condition from 35+ Clinical Diagnoses...
                        </option>
                        {DIAGNOSIS_CATALOG.map((cat) => (
                          <optgroup key={cat.group} label={cat.group}>
                            {cat.items.map((it) => (
                              <option key={it} value={it}>
                                {it}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={intake.customCondition}
                          onChange={(e) =>
                            updateIntakeField("customCondition", e.target.value)
                          }
                          placeholder="Or type custom diagnosis..."
                          className="flex-1 px-3.5 py-2 bg-white border border-slate-400 rounded-lg text-xs font-semibold text-slate-950"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            addTagItem(
                              "knownConditions",
                              intake.customCondition,
                            );
                            updateIntakeField("customCondition", "");
                          }}
                          className="px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {intake.knownConditions.length > 0 ? (
                        intake.knownConditions.map((cond) => (
                          <span
                            key={cond}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-400 rounded-md text-xs font-bold text-slate-900"
                          >
                            {cond}
                            <button
                              type="button"
                              onClick={() =>
                                removeTagItem("knownConditions", cond)
                              }
                              className="text-slate-600 hover:text-rose-700 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs font-semibold text-slate-600">
                          No active conditions selected (Prints as &ldquo;None
                          reported&rdquo;)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Active Medications Dropdown Adder */}
                  <div className="bg-[#FAF8F5] border border-slate-300 rounded-xl p-5">
                    <label className="block text-xs font-bold text-slate-900 mb-2">
                      Current Medications, Hormones & Nutraceutical Supplements
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            addTagItem("currentMedications", e.target.value);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-400 rounded-lg text-xs font-semibold text-slate-950 cursor-pointer"
                      >
                        <option value="">
                          + Select Medication / Supplement from Catalog...
                        </option>
                        {MEDICATION_CATALOG.map((cat) => (
                          <optgroup key={cat.group} label={cat.group}>
                            {cat.items.map((it) => (
                              <option key={it} value={it}>
                                {it}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={intake.customMedication}
                          onChange={(e) =>
                            updateIntakeField(
                              "customMedication",
                              e.target.value,
                            )
                          }
                          placeholder="Or type medication with dosage..."
                          className="flex-1 px-3.5 py-2 bg-white border border-slate-400 rounded-lg text-xs font-semibold text-slate-950"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            addTagItem(
                              "currentMedications",
                              intake.customMedication,
                            );
                            updateIntakeField("customMedication", "");
                          }}
                          className="px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {intake.currentMedications.length > 0 ? (
                        intake.currentMedications.map((med) => (
                          <span
                            key={med}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-400 rounded-md text-xs font-bold text-slate-900"
                          >
                            {med}
                            <button
                              type="button"
                              onClick={() =>
                                removeTagItem("currentMedications", med)
                              }
                              className="text-slate-600 hover:text-rose-700 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs font-semibold text-slate-600">
                          No active medications selected (Prints as &ldquo;None
                          reported&rdquo;)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Family History Dropdown Adder */}
                  <div className="bg-[#FAF8F5] border border-slate-300 rounded-xl p-5">
                    <label className="block text-xs font-bold text-slate-900 mb-2">
                      Family Medical & Gynecological History
                    </label>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          addTagItem(
                            "familyHistory",
                            e.target.value,
                            "No Significant Hereditary Gynecological or Endocrine History",
                          );
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-400 rounded-lg text-xs font-semibold text-slate-950 cursor-pointer mb-3"
                    >
                      <option value="">
                        + Add Hereditary Condition from List...
                      </option>
                      {FAMILY_HISTORY_CATALOG.map((fh) => (
                        <option key={fh} value={fh}>
                          {fh}
                        </option>
                      ))}
                    </select>

                    <div className="flex flex-wrap gap-2">
                      {intake.familyHistory.map((fh) => (
                        <span
                          key={fh}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-400 rounded-md text-xs font-bold text-slate-900"
                        >
                          {fh}
                          <button
                            type="button"
                            onClick={() => removeTagItem("familyHistory", fh)}
                            className="text-slate-600 hover:text-rose-700 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 6: PREVENTIVE SCREENING, VACCINES, DIET & LIFESTYLE */}
              {activeStudioSection === "preventive" && (
                <div className="space-y-6">
                  <div className="border-b border-slate-300 pb-3">
                    <h3 className="text-base font-extrabold text-slate-950">
                      6. Preventive Gynecology, Immunizations, Nutrition &
                      Lifestyle
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Cervical Screening (Pap Smear / HPV DNA) Status
                      </label>
                      <select
                        value={intake.cervicalScreening}
                        onChange={(e) =>
                          updateIntakeField("cervicalScreening", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950 cursor-pointer"
                      >
                        {CERVICAL_SCREENING_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Preventive Immunization & Breast Screening Status
                      </label>
                      <select
                        value={intake.preventiveImmunization}
                        onChange={(e) =>
                          updateIntakeField(
                            "preventiveImmunization",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950 cursor-pointer"
                      >
                        {PREVENTIVE_IMMUNIZATION_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Dietary Pattern & Hydration Status
                      </label>
                      <select
                        value={intake.dietHydration}
                        onChange={(e) =>
                          updateIntakeField("dietHydration", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950 cursor-pointer"
                      >
                        {DIET_HYDRATION_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Sleep, Exercise & Occupational Stress Profile
                      </label>
                      <select
                        value={intake.lifestyleProfile}
                        onChange={(e) =>
                          updateIntakeField("lifestyleProfile", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950 cursor-pointer"
                      >
                        {LIFESTYLE_PROFILES.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 7: DOCTOR Rx PAD (7948684.jpg STYLE) & INK SETUP */}
              {activeStudioSection === "doctor" && (
                <div className="space-y-6">
                  <div className="border-b border-slate-300 pb-3">
                    <h3 className="text-base font-extrabold text-slate-950">
                      7. Attending Doctor Header, Prescription Pad (Sheet 03) &
                      Ink Setup
                    </h3>
                    <p className="text-xs text-slate-700 mt-0.5">
                      Customizes the top header of Sheet 03 (modeled after your
                      reference prescription pad) and the dual signature block.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Attending Doctor Name (Top of Rx Pad & Below Signature)
                      </label>
                      <input
                        type="text"
                        value={intake.attendingPhysician}
                        onChange={(e) =>
                          updateIntakeField(
                            "attendingPhysician",
                            e.target.value,
                          )
                        }
                        placeholder="e.g. Dr. Meera Verma"
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Qualification Line (Under Doctor Name on Rx Pad)
                      </label>
                      <input
                        type="text"
                        value={intake.physicianCredentials}
                        onChange={(e) =>
                          updateIntakeField(
                            "physicianCredentials",
                            e.target.value,
                          )
                        }
                        placeholder="e.g. MBBS, MD, DNB (OB-GYN)"
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Certification / Registration No. (Top of Rx Pad)
                      </label>
                      <input
                        type="text"
                        value={intake.physicianRegNo}
                        onChange={(e) =>
                          updateIntakeField("physicianRegNo", e.target.value)
                        }
                        placeholder="e.g. Certification 48291-26 / NMC Reg."
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Diagnosis Line on Rx Pad (Leave Blank for Doctor to
                        Write)
                      </label>
                      <input
                        type="text"
                        value={intake.provisionalDiagnosis}
                        onChange={(e) =>
                          updateIntakeField(
                            "provisionalDiagnosis",
                            e.target.value,
                          )
                        }
                        placeholder="Leave blank for doctor handwriting, or pre-fill..."
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Reason for Consultation Template
                      </label>
                      <select
                        value={
                          CHIEF_COMPLAINT_TEMPLATES.includes(
                            intake.chiefComplaint,
                          )
                            ? intake.chiefComplaint
                            : ""
                        }
                        onChange={(e) => {
                          if (e.target.value) {
                            updateIntakeField("chiefComplaint", e.target.value);
                          }
                        }}
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950 cursor-pointer"
                      >
                        <option value="">
                          -- Select a Clinical Reason Template --
                        </option>
                        {CHIEF_COMPLAINT_TEMPLATES.map((tpl) => (
                          <option key={tpl} value={tpl}>
                            {tpl}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Primary Chief Complaint
                      </label>
                      <input
                        type="text"
                        value={intake.chiefComplaint}
                        onChange={(e) =>
                          updateIntakeField("chiefComplaint", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-lg text-sm font-semibold text-slate-950"
                      />
                    </div>

                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#FAF8F5] p-4 rounded-xl border border-slate-300">
                      <div>
                        <label className="block text-xs font-bold text-slate-900 mb-1.5">
                          Sheet 03 Rx Writing Area Style
                        </label>
                        <select
                          value={intake.rxPadStyle}
                          onChange={(e) =>
                            updateIntakeField(
                              "rxPadStyle",
                              e.target.value as
                                | "open_canvas"
                                | "faint_lines"
                                | "table_plus_canvas",
                            )
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-400 rounded-lg text-xs font-bold text-slate-950 cursor-pointer"
                        >
                          <option value="open_canvas">
                            Open Canvas + Watermark (Exact Reference Look)
                          </option>
                          <option value="faint_lines">
                            Subtle Ruled Lines Over Watermark
                          </option>
                          <option value="table_plus_canvas">
                            Open Canvas + 4-Row Rx Table Below
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-900 mb-1.5">
                          Color & Paper Ink Theme
                        </label>
                        <select
                          value={intake.pdfTheme}
                          onChange={(e) =>
                            updateIntakeField(
                              "pdfTheme",
                              e.target.value as keyof typeof CLINICAL_THEMES,
                            )
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-400 rounded-lg text-xs font-bold text-slate-950 cursor-pointer"
                        >
                          {Object.entries(CLINICAL_THEMES).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-900 mb-1.5">
                          Observation Window
                        </label>
                        <select
                          value={intake.reportWindowDays}
                          onChange={(e) =>
                            updateIntakeField(
                              "reportWindowDays",
                              Number(e.target.value),
                            )
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-400 rounded-lg text-xs font-bold text-slate-950 cursor-pointer"
                        >
                          <option value={30}>Last 30 Days</option>
                          <option value={60}>Last 60 Days</option>
                          <option value={90}>Last 90 Days (Standard)</option>
                          <option value={180}>Last 180 Days (6 Months)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          3-SHEET CLINICAL FOLIO WORKSPACE (CONTINUOUS ZERO-GAP PAGINATION)
      ===================================================================== */}
      <div className="space-y-12 print:space-y-0">
        {/* ===================================================================
            SHEET 01: PATIENT CLINICAL DOSSIER, BIOMETRICS & 90-DAY DIARY
            (Continuous flow: no whole-section avoid-break gaps!)
        =================================================================== */}
        {(sheetPreviewMode === "all_sheets" ||
          sheetPreviewMode === "sheet1_patient") && (
          <div
            id="moonday-pdf-sheet-1"
            className="bg-white text-slate-950 border-2 border-slate-900 rounded-none sm:rounded-lg p-5 sm:p-8 shadow-sm print:border-0 print:shadow-none print:p-0"
          >
            {/* SHEET 01 MASTHEAD */}
            <div
              className={`border-b-4 ${theme.headerBorder} pb-3.5 mb-4 flex flex-col sm:flex-row justify-between items-start gap-4 pdf-unit-card`}
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.16em] ${theme.accentBadgeBg}`}
                  >
                    MoonDay Clinical Record
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-800">
                    Sheet 01 / Patient History, Biometrics & 90-Day Diary
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase mt-1.5">
                  Obstetrics & Gynecology Outpatient Clinical Dossier
                </h1>
                <p className="text-xs font-semibold text-slate-800 mt-0.5">
                  Diagnostic Observation Window:{" "}
                  <span className="font-extrabold text-slate-950 underline decoration-slate-400 underline-offset-2">
                    {format(reportStartDate, "MMMM d, yyyy")} –{" "}
                    {format(reportEndDate, "MMMM d, yyyy")} (
                    {intake.reportWindowDays} Days)
                  </span>
                </p>
              </div>

              <div className="border-2 border-slate-900 p-2.5 min-w-[235px] bg-slate-50 text-[11px] shrink-0">
                <div className="flex justify-between border-b border-slate-400 pb-0.5 mb-0.5">
                  <span className="font-bold text-slate-700 uppercase text-[10px]">
                    Dossier ID:
                  </span>
                  <span className="font-mono font-extrabold text-slate-950">
                    {reportId}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-400 pb-0.5 mb-0.5">
                  <span className="font-bold text-slate-700 uppercase text-[10px]">
                    Date Issued:
                  </span>
                  <span className="font-bold text-slate-950">
                    {format(reportEndDate, "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-400 pb-0.5 mb-0.5">
                  <span className="font-bold text-slate-700 uppercase text-[10px]">
                    Logged Days:
                  </span>
                  <span className="font-extrabold text-slate-950">
                    {logs.length} Recorded Days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700 uppercase text-[10px]">
                    Allergies:
                  </span>
                  <span className="font-extrabold text-slate-950 truncate max-w-[140px]">
                    {intake.drugAllergies[0] || "NKDA"}
                  </span>
                </div>
              </div>
            </div>

            {/* 01 / PATIENT IDENTIFICATION & GYNECOLOGICAL PROFILE */}
            <div className="mb-4">
              <div
                className={`${theme.sectionHeaderBg} px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 pdf-section-header`}
              >
                <span className="text-[11px] font-extrabold uppercase tracking-[0.14em]">
                  01 / Patient Identification, Anthropometrics & Gynecological
                  Intake
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Attending: {formattedDoctorTitle}{" "}
                  {intake.physicianRegNo ? `(${intake.physicianRegNo})` : ""}
                </span>
              </div>

              <div className="border-2 border-t-0 border-slate-900">
                <div className="pdf-grid-4 grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-400 border-b border-slate-400 bg-slate-50/60 pdf-unit-card">
                  <div className="p-2.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                      Patient Full Name
                    </div>
                    <div className="text-sm font-black text-slate-950 mt-0.5 break-words">
                      {patientName}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-800 mt-0.5 truncate">
                      {intake.occupation ? `${intake.occupation} • ` : ""}
                      {patientEmail}
                    </div>
                  </div>

                  <div className="p-2.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                      Age / DOB & Blood Group
                    </div>
                    <div className="text-sm font-black text-slate-950 mt-0.5">
                      {intake.ageOrDob || "Adult Female"} • {intake.bloodGroup}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-800 mt-0.5">
                      {intake.heightCm || intake.weightKg
                        ? `${intake.heightCm ? `${intake.heightCm} cm` : ""} ${
                            intake.weightKg ? `• ${intake.weightKg} kg` : ""
                          } ${anthropometrics.bmiText ? `• BMI ${anthropometrics.bmiText}` : ""}`
                        : "Anthropometrics: Standard"}
                    </div>
                  </div>

                  <div className="p-2.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                      Last Menstrual Period (LMP)
                    </div>
                    <div className="text-sm font-black text-slate-950 mt-0.5">
                      {stats.lmpDate
                        ? format(parseISO(stats.lmpDate), "MMM d, yyyy")
                        : "Not logged in window"}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-800 mt-0.5">
                      Est. Ovulation:{" "}
                      <strong>
                        {stats.estimatedOvulation
                          ? format(parseISO(stats.estimatedOvulation), "MMM d")
                          : "—"}
                      </strong>{" "}
                      • Next Menses:{" "}
                      <strong>
                        {stats.estimatedNextPeriod
                          ? format(parseISO(stats.estimatedNextPeriod), "MMM d")
                          : "—"}
                      </strong>
                    </div>
                  </div>

                  <div className="p-2.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                      Obstetric Parity & Menarche
                    </div>
                    <div className="text-sm font-black text-slate-950 mt-0.5">
                      {intake.gravidaPara}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-800 mt-0.5">
                      Menarche: <strong>{intake.menarcheAge}</strong>
                    </div>
                  </div>
                </div>

                {/* Compact Clinical Intake Table */}
                <table className="w-full text-left border-collapse text-[11px]">
                  <tbody>
                    <tr className="border-b border-slate-400 compact-row">
                      <td className="w-[21%] py-1.5 px-2.5 font-extrabold uppercase text-[10px] text-slate-800 bg-slate-100 border-r border-slate-400">
                        Contraceptive Regimen
                      </td>
                      <td className="w-[29%] py-1.5 px-2.5 font-bold text-slate-950 border-r border-slate-400">
                        {intake.contraception}
                      </td>
                      <td className="w-[21%] py-1.5 px-2.5 font-extrabold uppercase text-[10px] text-slate-800 bg-slate-100 border-r border-slate-400">
                        Dysmenorrhea & Relief
                      </td>
                      <td className="w-[29%] py-1.5 px-2.5 font-bold text-slate-950">
                        {intake.dysmenorrheaGrade.split("—")[0].trim()} •{" "}
                        {intake.analgesicRelief}
                      </td>
                    </tr>

                    <tr className="border-b border-slate-400 compact-row">
                      <td className="py-1.5 px-2.5 font-extrabold uppercase text-[10px] text-slate-800 bg-slate-100 border-r border-slate-400">
                        Flow & Clot Profile
                      </td>
                      <td className="py-1.5 px-2.5 font-bold text-slate-950 border-r border-slate-400">
                        {intake.flowClotProfile}
                      </td>
                      <td className="py-1.5 px-2.5 font-extrabold uppercase text-[10px] text-slate-800 bg-slate-100 border-r border-slate-400">
                        Sanitary Product Load
                      </td>
                      <td className="py-1.5 px-2.5 font-bold text-slate-950">
                        {intake.sanitaryProductProfile}
                      </td>
                    </tr>

                    <tr className="border-b border-slate-400 compact-row">
                      <td className="py-1.5 px-2.5 font-extrabold uppercase text-[10px] text-slate-800 bg-slate-100 border-r border-slate-400">
                        Pelvic Pain Radiation
                      </td>
                      <td className="py-1.5 px-2.5 font-bold text-slate-950 border-r border-slate-400">
                        {intake.painRadiation}
                      </td>
                      <td className="py-1.5 px-2.5 font-extrabold uppercase text-[10px] text-slate-800 bg-slate-100 border-r border-slate-400">
                        Ovulatory & Mucus Sign
                      </td>
                      <td className="py-1.5 px-2.5 font-bold text-slate-950">
                        {intake.ovulatoryMucusProfile}
                      </td>
                    </tr>

                    <tr className="border-b border-slate-400 compact-row">
                      <td className="py-1.5 px-2.5 font-extrabold uppercase text-[10px] text-slate-800 bg-slate-100 border-r border-slate-400">
                        Androgen / Skin Screen
                      </td>
                      <td className="py-1.5 px-2.5 font-bold text-slate-950 border-r border-slate-400">
                        {intake.hyperandrogenismScreen}
                      </td>
                      <td className="py-1.5 px-2.5 font-extrabold uppercase text-[10px] text-slate-800 bg-slate-100 border-r border-slate-400">
                        Thyroid & Prolactin
                      </td>
                      <td className="py-1.5 px-2.5 font-bold text-slate-950">
                        {intake.thyroidGalactorrheaScreen}
                      </td>
                    </tr>

                    <tr className="border-b border-slate-400 compact-row">
                      <td className="py-1.5 px-2.5 font-extrabold uppercase text-[10px] text-slate-800 bg-slate-100 border-r border-slate-400">
                        GI & Urinary Correlation
                      </td>
                      <td className="py-1.5 px-2.5 font-bold text-slate-950 border-r border-slate-400">
                        {intake.giUrinaryCorrelation}
                      </td>
                      <td className="py-1.5 px-2.5 font-extrabold uppercase text-[10px] text-slate-800 bg-slate-100 border-r border-slate-400">
                        Luteal / PMS Impact
                      </td>
                      <td className="py-1.5 px-2.5 font-bold text-slate-950">
                        {intake.pmsFunctionalImpact}
                      </td>
                    </tr>

                    <tr className="border-b border-slate-400 compact-row">
                      <td className="py-1.5 px-2.5 font-extrabold uppercase text-[10px] text-slate-800 bg-slate-100 border-r border-slate-400">
                        Known Diagnoses
                      </td>
                      <td className="py-1.5 px-2.5 font-bold text-slate-950 border-r border-slate-400">
                        {intake.knownConditions.length > 0
                          ? intake.knownConditions.join(", ")
                          : "None reported"}
                      </td>
                      <td className="py-1.5 px-2.5 font-extrabold uppercase text-[10px] text-slate-800 bg-slate-100 border-r border-slate-400">
                        Active Medications
                      </td>
                      <td className="py-1.5 px-2.5 font-bold text-slate-950">
                        {intake.currentMedications.length > 0
                          ? intake.currentMedications.join(", ")
                          : "None reported"}
                      </td>
                    </tr>

                    <tr className="border-b border-slate-400 compact-row">
                      <td className="py-1.5 px-2.5 font-extrabold uppercase text-[10px] text-slate-800 bg-slate-100 border-r border-slate-400">
                        Surgical / Procedural Hx
                      </td>
                      <td className="py-1.5 px-2.5 font-bold text-slate-950 border-r border-slate-400">
                        {intake.surgicalHistory.join(", ") || "None"}
                      </td>
                      <td className="py-1.5 px-2.5 font-extrabold uppercase text-[10px] text-slate-800 bg-slate-100 border-r border-slate-400">
                        Family Medical History
                      </td>
                      <td className="py-1.5 px-2.5 font-bold text-slate-950">
                        {intake.familyHistory.join(", ") || "None significant"}
                      </td>
                    </tr>

                    <tr className="border-b border-slate-400 compact-row">
                      <td className="py-1.5 px-2.5 font-extrabold uppercase text-[10px] text-slate-800 bg-slate-100 border-r border-slate-400">
                        Prior USG & Screening
                      </td>
                      <td className="py-1.5 px-2.5 font-bold text-slate-950 border-r border-slate-400">
                        {intake.priorWorkup}
                        {intake.usgEndometrialMm
                          ? ` • ${intake.usgEndometrialMm}`
                          : ""}
                      </td>
                      <td className="py-1.5 px-2.5 font-extrabold uppercase text-[10px] text-slate-800 bg-slate-100 border-r border-slate-400">
                        Vaccines, Diet & Sleep
                      </td>
                      <td className="py-1.5 px-2.5 font-bold text-slate-950">
                        {intake.preventiveImmunization.split("•")[0].trim()} •{" "}
                        {intake.dietHydration.split("•")[0].trim()}
                      </td>
                    </tr>

                    {hasLabValues && (
                      <tr className="border-b border-slate-400 bg-slate-50 compact-row">
                        <td className="py-1.5 px-2.5 font-extrabold uppercase text-[10px] text-slate-800 bg-slate-100 border-r border-slate-400">
                          Baseline Lab Panel
                        </td>
                        <td
                          colSpan={3}
                          className="py-1.5 px-2.5 font-bold text-slate-950"
                        >
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                            {intake.labHemoglobin && (
                              <span>Hb: {intake.labHemoglobin}</span>
                            )}
                            {intake.labFerritin && (
                              <span>Ferritin: {intake.labFerritin}</span>
                            )}
                            {intake.labTsh && <span>TSH: {intake.labTsh}</span>}
                            {intake.labFreeT4 && (
                              <span>FT4: {intake.labFreeT4}</span>
                            )}
                            {intake.labProlactin && (
                              <span>Prolactin: {intake.labProlactin}</span>
                            )}
                            {intake.labAmh && <span>AMH: {intake.labAmh}</span>}
                            {intake.labLhFsh && (
                              <span>LH/FSH: {intake.labLhFsh}</span>
                            )}
                            {intake.labTestosterone && (
                              <span>Total Testo: {intake.labTestosterone}</span>
                            )}
                            {intake.labHba1c && (
                              <span>HbA1c: {intake.labHba1c}</span>
                            )}
                            {intake.labFastingInsulin && (
                              <span>
                                Fasting Insulin: {intake.labFastingInsulin}
                              </span>
                            )}
                            {intake.labVitaminD && (
                              <span>25-OH Vit D: {intake.labVitaminD}</span>
                            )}
                            {intake.labVitaminB12 && (
                              <span>Vit B12: {intake.labVitaminB12}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}

                    <tr className="bg-slate-50 compact-row">
                      <td className="py-1.5 px-2.5 font-extrabold uppercase text-[10px] text-slate-900 bg-slate-200/80 border-r border-slate-400">
                        Chief Complaint
                      </td>
                      <td
                        colSpan={3}
                        className="py-1.5 px-2.5 font-extrabold text-slate-950"
                      >
                        {intake.chiefComplaint}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 02 / FIGO AUB-M BIOMETRICS & ANATOMICAL LOCALIZATION (Flows immediately after Section 01!) */}
            <div className="mb-4 pdf-unit-card">
              <div
                className={`${theme.sectionHeaderBg} px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 pdf-section-header`}
              >
                <span className="text-[11px] font-extrabold uppercase tracking-[0.14em]">
                  02 / FIGO AUB-M Cycle Biometrics & Anatomical Symptom
                  Localization
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Computed from Confirmed Menstrual Onsets (CD 1)
                </span>
              </div>

              <div className="border-2 border-t-0 border-slate-900">
                <div className="pdf-grid-4 grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-400 border-b border-slate-400">
                  <div className="p-2.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                      1. Mean Cycle Length
                    </div>
                    <div className="text-xl font-black text-slate-950 mt-0.5">
                      {stats.avgCycle}{" "}
                      <span className="text-xs font-bold text-slate-700">
                        Days
                      </span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-800 mt-0.5">
                      FIGO Normal: 24–38 Days
                    </div>
                  </div>

                  <div className="p-2.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                      2. Cycle Regularity (Δ)
                    </div>
                    <div className="text-xl font-black text-slate-950 mt-0.5">
                      {stats.minCycle}–{stats.maxCycle}{" "}
                      <span className="text-xs font-bold text-slate-700">
                        Days (Δ {stats.cycleVariance}d)
                      </span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-800 mt-0.5">
                      Std Dev: σ = {stats.cycleStdDev}d (Regular ≤ 7d)
                    </div>
                  </div>

                  <div className="p-2.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                      3. Mean Menses Duration
                    </div>
                    <div className="text-xl font-black text-slate-950 mt-0.5">
                      {stats.avgDuration}{" "}
                      <span className="text-xs font-bold text-slate-700">
                        Days
                      </span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-800 mt-0.5">
                      FIGO Normal: ≤ 8 Days ({stats.activeBleedDaysCount}d
                      logged)
                    </div>
                  </div>

                  <div className="p-2.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                      4. Onsets & Spotting
                    </div>
                    <div className="text-xl font-black text-slate-950 mt-0.5">
                      {stats.confirmedCyclesCount}{" "}
                      <span className="text-xs font-bold text-slate-700">
                        Cycles
                      </span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-800 mt-0.5">
                      Intermenstrual Spotting: {stats.spottingDaysCount}d
                    </div>
                  </div>
                </div>

                <div className="pdf-grid-12 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-400">
                  <div className="pdf-col-7 lg:col-span-7 p-2.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800 mb-1.5">
                      FIGO AUB System 1 Parameter Evaluation
                    </div>
                    <table className="w-full text-left border-collapse text-[11px] border border-slate-400">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-400 text-[10px] uppercase font-extrabold text-slate-800">
                          <th className="py-1 px-2 border-r border-slate-400">
                            Parameter
                          </th>
                          <th className="py-1 px-2 border-r border-slate-400">
                            Patient Value
                          </th>
                          <th className="py-1 px-2">Clinical Interpretation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300">
                        {clinicalDecisionSupport.map((row, idx) => (
                          <tr key={idx}>
                            <td className="py-1.5 px-2 font-extrabold text-slate-900 border-r border-slate-400">
                              {row.parameter}
                            </td>
                            <td className="py-1.5 px-2 font-bold text-slate-950 border-r border-slate-400">
                              {row.status}
                            </td>
                            <td className="py-1.5 px-2 font-medium text-slate-800">
                              {row.note}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pdf-col-5 lg:col-span-5 p-2.5 bg-slate-50/50 flex flex-col justify-between">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800 mb-1">
                      Anatomical Symptom & Pain Localization Map
                    </div>

                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5 flex justify-center">
                        <svg
                          viewBox="0 0 140 170"
                          className="w-24 h-28 stroke-slate-900"
                          fill="none"
                        >
                          <path
                            d="M35 12 C35 45, 22 65, 20 95 C18 125, 38 158, 70 162 C102 158, 122 125, 120 95 C118 65, 105 45, 105 12"
                            strokeWidth="2.2"
                            stroke="#0f172a"
                          />
                          <path
                            d="M24 88 Q70 105 116 88"
                            stroke="#475569"
                            strokeWidth="1.2"
                            strokeDasharray="3 2"
                          />
                          <line
                            x1="70"
                            y1="12"
                            x2="70"
                            y2="162"
                            stroke="#475569"
                            strokeWidth="1"
                            strokeDasharray="3 2"
                          />
                          <path
                            d="M58 108 L70 132 L82 108 Z"
                            fill="#e2e8f0"
                            stroke="#0f172a"
                            strokeWidth="1.8"
                          />
                          <path
                            d="M58 110 Q42 104 38 114"
                            stroke="#0f172a"
                            strokeWidth="1.6"
                          />
                          <path
                            d="M82 110 Q98 104 102 114"
                            stroke="#0f172a"
                            strokeWidth="1.6"
                          />
                          <circle
                            cx="37"
                            cy="116"
                            r="6"
                            fill="#ffffff"
                            stroke="#0f172a"
                            strokeWidth="1.8"
                          />
                          <circle
                            cx="103"
                            cy="116"
                            r="6"
                            fill="#ffffff"
                            stroke="#0f172a"
                            strokeWidth="1.8"
                          />
                          <circle
                            cx="70"
                            cy="60"
                            r="11"
                            stroke="#0f172a"
                            strokeWidth="1.4"
                          />
                          <text
                            x="70"
                            y="63"
                            textAnchor="middle"
                            fontSize="8"
                            fontWeight="bold"
                            fill="#0f172a"
                            stroke="none"
                          >
                            GI
                          </text>
                          <text
                            x="70"
                            y="122"
                            textAnchor="middle"
                            fontSize="7.5"
                            fontWeight="bold"
                            fill="#0f172a"
                            stroke="none"
                          >
                            UT
                          </text>
                          <text
                            x="27"
                            y="132"
                            textAnchor="middle"
                            fontSize="7"
                            fontWeight="bold"
                            fill="#0f172a"
                            stroke="none"
                          >
                            R-OV
                          </text>
                          <text
                            x="113"
                            y="132"
                            textAnchor="middle"
                            fontSize="7"
                            fontWeight="bold"
                            fill="#0f172a"
                            stroke="none"
                          >
                            L-OV
                          </text>
                        </svg>
                      </div>

                      <div className="col-span-7 space-y-1 text-[10.5px]">
                        <div className="flex justify-between border-b border-slate-300 pb-0.5">
                          <span className="font-bold text-slate-800">
                            Uterine / Pelvic (UT):
                          </span>
                          <span className="font-mono font-extrabold text-slate-950">
                            {clinicalAnalysis.anatomicalZones.uterineSuprapubic}{" "}
                            logs
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-300 pb-0.5">
                          <span className="font-bold text-slate-800">
                            Adnexal / Ovarian (OV):
                          </span>
                          <span className="font-mono font-extrabold text-slate-950">
                            {clinicalAnalysis.anatomicalZones.adnexalOvarian}{" "}
                            logs
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-300 pb-0.5">
                          <span className="font-bold text-slate-800">
                            Lumbosacral Back:
                          </span>
                          <span className="font-mono font-extrabold text-slate-950">
                            {clinicalAnalysis.anatomicalZones.lumbosacralBack}{" "}
                            logs
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-300 pb-0.5">
                          <span className="font-bold text-slate-800">
                            Abdominal / GI Tract:
                          </span>
                          <span className="font-mono font-extrabold text-slate-950">
                            {clinicalAnalysis.anatomicalZones.epigastricGi} logs
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-300 pb-0.5">
                          <span className="font-bold text-slate-800">
                            Mammary / Breast:
                          </span>
                          <span className="font-mono font-extrabold text-slate-950">
                            {clinicalAnalysis.anatomicalZones.mammaryBreast}{" "}
                            logs
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold text-slate-800">
                            Cranial / Neuro:
                          </span>
                          <span className="font-mono font-extrabold text-slate-950">
                            {clinicalAnalysis.anatomicalZones.cranialNeuro} logs
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-1.5 pt-1.5 border-t border-slate-300 flex justify-between text-[10px] font-bold text-slate-800">
                      <span>
                        Menstrual: {clinicalAnalysis.phaseSymptomLoad.Menstrual}
                      </span>
                      <span>
                        Follicular:{" "}
                        {clinicalAnalysis.phaseSymptomLoad.Follicular}
                      </span>
                      <span>
                        Ovulatory: {clinicalAnalysis.phaseSymptomLoad.Ovulatory}
                      </span>
                      <span>
                        Luteal: {clinicalAnalysis.phaseSymptomLoad.Luteal}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 03 / CONFIRMED MENSTRUAL EPISODES TABLE */}
            {confirmedEpisodes.length > 0 && (
              <div className="mb-4 pdf-unit-card">
                <div
                  className={`${theme.sectionHeaderBg} px-3 py-1.5 flex items-center justify-between pdf-section-header`}
                >
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.14em]">
                    03 / Confirmed Menstrual Bleed Episodes (Onset-to-Onset
                    Table)
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {confirmedEpisodes.length} Confirmed Episode(s)
                  </span>
                </div>

                <table className="w-full text-left border-collapse text-[11px] border-2 border-t-0 border-slate-900">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-900 text-[10px] uppercase font-extrabold text-slate-900">
                      <th className="py-1.5 px-2.5 border-r border-slate-400">
                        Cycle #
                      </th>
                      <th className="py-1.5 px-2.5 border-r border-slate-400">
                        Menses Onset (CD 1)
                      </th>
                      <th className="py-1.5 px-2.5 border-r border-slate-400">
                        Menses Cessation
                      </th>
                      <th className="py-1.5 px-2.5 border-r border-slate-400">
                        Bleed Duration
                      </th>
                      <th className="py-1.5 px-2.5 border-r border-slate-400">
                        Logged Flow & Color Profile
                      </th>
                      <th className="py-1.5 px-2.5">Total Cycle Length</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-400">
                    {confirmedEpisodes.map((ep, idx) => (
                      <tr
                        key={ep.startDate + idx}
                        className="odd:bg-white even:bg-slate-50 compact-row"
                      >
                        <td className="py-1.5 px-2.5 font-mono font-extrabold text-slate-900 border-r border-slate-400">
                          #{confirmedEpisodes.length - idx}
                        </td>
                        <td className="py-1.5 px-2.5 font-extrabold text-slate-950 border-r border-slate-400">
                          {format(parseISO(ep.startDate), "MMM d, yyyy")}
                        </td>
                        <td className="py-1.5 px-2.5 font-semibold text-slate-800 border-r border-slate-400">
                          {ep.endDate
                            ? format(parseISO(ep.endDate), "MMM d, yyyy")
                            : "End unlogged"}
                        </td>
                        <td className="py-1.5 px-2.5 font-bold text-slate-950 border-r border-slate-400">
                          {ep.durationDays
                            ? `${ep.durationDays} Days`
                            : `~${stats.avgDuration} Days`}
                        </td>
                        <td className="py-1.5 px-2.5 font-semibold text-slate-800 border-r border-slate-400">
                          Flow: {ep.peakFlow} • Color: {ep.colorsObserved}
                        </td>
                        <td className="py-1.5 px-2.5 font-extrabold text-slate-950">
                          {ep.cycleLengthToNext
                            ? `${ep.cycleLengthToNext} Days`
                            : "Active / Current Cycle"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 04 / MULTI-SYSTEM REVIEW OF SYSTEMS (ROS) MATRIX (Flows naturally across page boundary if needed!) */}
            <div className="mb-4">
              <div
                className={`${theme.sectionHeaderBg} px-3 py-1.5 flex items-center justify-between pdf-section-header`}
              >
                <span className="text-[11px] font-extrabold uppercase tracking-[0.14em]">
                  04 / Multi-System Review of Systems (ROS) & 90-Day Symptom
                  Incidence
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Physical Days: {clinicalAnalysis.daysWithPhysicalSymptoms}d •
                  Affective Days: {clinicalAnalysis.daysWithMoodLogs}d
                </span>
              </div>

              <div className="border-2 border-t-0 border-slate-900 p-3 bg-white">
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
                            className="border border-slate-400 p-2.5 bg-slate-50/40 pdf-unit-card"
                          >
                            <div className="flex items-center justify-between border-b border-slate-400 pb-1 mb-1.5">
                              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-950">
                                {systemName}
                              </span>
                              <span className="text-[9.5px] font-bold text-slate-700">
                                Days (%)
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
                              {sortedItems
                                .slice(0, 8)
                                .map(([symName, count]) => (
                                  <div
                                    key={symName}
                                    className="flex items-center justify-between border-b border-slate-300 py-0.5"
                                  >
                                    <span className="font-semibold text-slate-900 truncate pr-1">
                                      {symName}
                                    </span>
                                    <span className="font-mono text-[10px] font-extrabold text-slate-950 shrink-0">
                                      {count}d (
                                      {Math.round(
                                        (count / Math.max(logs.length, 1)) *
                                          100,
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
                  <p className="text-xs font-semibold text-slate-800">
                    No physical or affective symptoms logged in this window.
                  </p>
                )}
              </div>
            </div>

            {/* 05 / CHRONOLOGICAL DAILY CLINICAL DIARY */}
            <div>
              <div
                className={`${theme.sectionHeaderBg} px-3 py-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pdf-section-header`}
              >
                <span className="text-[11px] font-extrabold uppercase tracking-[0.14em]">
                  05 / Chronological Daily Symptom, Flow & Cycle-Day Diary (
                  {filteredDiaryLogs.length} Days)
                </span>

                <div className="print-hide-inside flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-700 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={diarySearch}
                      onChange={(e) => setDiarySearch(e.target.value)}
                      placeholder="Search symptom..."
                      className="pl-8 pr-2.5 py-0.5 bg-white text-slate-950 rounded text-xs font-semibold w-[145px]"
                    />
                  </div>
                  <div className="inline-flex bg-slate-800 rounded p-0.5 text-[10px]">
                    {(
                      [
                        { id: "all", label: "All" },
                        { id: "bleeding", label: "Bleeding" },
                        { id: "high_symptom", label: "3+ Syms" },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setDiaryFilter(f.id)}
                        className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                          diaryFilter === f.id
                            ? "bg-white text-slate-950"
                            : "text-slate-200 hover:text-white"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {filteredDiaryLogs.length > 0 ? (
                <table className="w-full table-fixed text-left border-collapse text-[11px] border-2 border-t-0 border-slate-900">
                  <thead>
                    <tr className="bg-slate-100 border-b-2 border-slate-900 text-[10px] uppercase font-extrabold text-slate-950">
                      <th className="w-[15%] py-1.5 px-2 border-r border-slate-400">
                        Date & Cycle Day
                      </th>
                      <th className="w-[12%] py-1.5 px-2 border-r border-slate-400">
                        Cycle Event
                      </th>
                      <th className="w-[20%] py-1.5 px-2 border-r border-slate-400">
                        Flow, Color & Discharge
                      </th>
                      <th className="w-[36%] py-1.5 px-2 border-r border-slate-400">
                        Logged Physical Symptoms & Affective States
                      </th>
                      <th className="w-[17%] py-1.5 px-2">
                        Patient Notes & Activity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-400">
                    {filteredDiaryLogs.map((log) => {
                      const { flow, color, discharge, cravings, activity } =
                        extractDailyAttributes(log);
                      const symptoms = parseClinicalList(
                        log.symptoms ?? log.physical_symptoms,
                      );
                      const moods = parseClinicalList(log.moods ?? log.mood);
                      const { cd, phase } = getCycleDayAndPhase(log.log_date);

                      const hasFlowColorDischarge =
                        flow.length > 0 ||
                        color.length > 0 ||
                        discharge.length > 0;
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
                              : "—";

                      return (
                        <tr
                          key={log.log_date}
                          className="align-top odd:bg-white even:bg-slate-50/70"
                        >
                          <td className="py-2 px-2 border-r border-slate-400 whitespace-nowrap">
                            <div className="font-extrabold text-slate-950">
                              {format(parseISO(log.log_date), "MMM d, yyyy")}
                            </div>
                            {cd && (
                              <div className="text-[10px] font-mono font-bold text-slate-800 mt-0.5">
                                CD {cd} • {phase}
                              </div>
                            )}
                          </td>

                          <td className="py-2 px-2 border-r border-slate-400 break-words font-extrabold text-slate-950">
                            {bleedingStatus !== "—" ? (
                              <span
                                className={
                                  log.is_period_start
                                    ? "inline-block px-1.5 py-0.5 bg-slate-900 text-white text-[10px] rounded-xs"
                                    : "inline-block px-1.5 py-0.5 bg-slate-200 text-slate-950 text-[10px] rounded-xs"
                                }
                              >
                                {bleedingStatus}
                              </span>
                            ) : (
                              <span className="text-slate-600 font-normal">
                                —
                              </span>
                            )}
                          </td>

                          <td className="py-2 px-2 border-r border-slate-400 break-words leading-snug">
                            {hasFlowColorDischarge ? (
                              <div className="space-y-0.5 text-slate-900">
                                {flow.length > 0 && (
                                  <div>
                                    <span className="font-extrabold">
                                      Flow:{" "}
                                    </span>
                                    <span className="font-medium">
                                      {flow.join(", ")}
                                    </span>
                                  </div>
                                )}
                                {color.length > 0 && (
                                  <div>
                                    <span className="font-extrabold">
                                      Color:{" "}
                                    </span>
                                    <span className="font-medium">
                                      {color.join(", ")}
                                    </span>
                                  </div>
                                )}
                                {discharge.length > 0 && (
                                  <div>
                                    <span className="font-extrabold">
                                      Discharge:{" "}
                                    </span>
                                    <span className="font-medium">
                                      {discharge.join(", ")}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>

                          <td className="py-2 px-2 border-r border-slate-400 break-words leading-snug">
                            {hasSymptomsMoods ? (
                              <div className="space-y-1 text-slate-900">
                                {symptoms.length > 0 && (
                                  <div>
                                    <span className="font-extrabold text-slate-950">
                                      Physical ({symptoms.length}):{" "}
                                    </span>
                                    <span className="font-medium">
                                      {symptoms.join(", ")}
                                    </span>
                                  </div>
                                )}
                                {moods.length > 0 && (
                                  <div>
                                    <span className="font-extrabold text-slate-800">
                                      Affective:{" "}
                                    </span>
                                    <span className="font-medium">
                                      {moods.join(", ")}
                                    </span>
                                  </div>
                                )}
                                {cravings.length > 0 && (
                                  <div>
                                    <span className="font-extrabold text-slate-800">
                                      Cravings:{" "}
                                    </span>
                                    <span className="font-medium">
                                      {cravings.join(", ")}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>

                          <td className="py-2 px-2 text-slate-900 font-medium break-words leading-snug">
                            {log.note && String(log.note).trim().length > 0 ? (
                              <span>{String(log.note).trim()}</span>
                            ) : activity.length > 0 ? (
                              <span>Activity: {activity.join(", ")}</span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="border-2 border-t-0 border-slate-900 p-6 text-center text-xs font-bold text-slate-800">
                  No daily logs recorded for the current filter selection.
                </div>
              )}
            </div>

            <div className="mt-4 pt-2 border-t-2 border-slate-900 flex justify-between items-center text-[10px] font-bold text-slate-800">
              <span>
                MOONDAY CLINICAL RECORD • SHEET 01 (PATIENT HISTORY & CYCLE
                DIARY)
              </span>
              <span className="font-mono">
                REF: {reportId} • CONTINUED ON SHEET 02 & SHEET 03
              </span>
            </div>
          </div>
        )}

        {/* ===================================================================
            SHEET 02: 1-PAGE CALIBRATED CLINICAL EXAMINATION, 21-ITEM LAB
            CHECKLIST & SOAP WORKSHEET (FITS 100% ON 1 SINGLE A4 PAGE!)
        =================================================================== */}
        {(sheetPreviewMode === "all_sheets" ||
          sheetPreviewMode === "sheet2_workup") && (
          <div
            id="moonday-pdf-sheet-2"
            className="bg-white text-slate-950 border-2 border-slate-900 rounded-none sm:rounded-lg p-5 sm:p-8 shadow-sm print:border-0 print:shadow-none print:p-0"
          >
            {/* SHEET 02 HEADER */}
            <div
              className={`border-b-4 ${theme.headerBorder} pb-2.5 mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.16em] ${theme.accentBadgeBg}`}
                  >
                    Sheet 02 / Clinical Examination & Orders
                  </span>
                  <span className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-800">
                    Physical Exam, Bedside USG, Lab Tick-Sheet & SOAP Notes
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-950 uppercase mt-1">
                  In-Clinic Gynecological Examination & Diagnostic Workup Sheet
                </h2>
              </div>

              <div className="text-left sm:text-right text-[11px] font-bold text-slate-900 shrink-0">
                <div className="font-mono font-extrabold">
                  PATIENT: {patientName.toUpperCase()} ({intake.bloodGroup})
                </div>
                <div>
                  REF: {reportId} • Cycle Day at Exam: <strong>CD _____</strong>
                </div>
              </div>
            </div>

            {/* PART A: IN-CLINIC VITALS, PELVIC & USG EXAM */}
            <div className="mb-3">
              <div
                className={`${theme.sectionHeaderBg} px-3 py-1.5 flex flex-wrap items-center justify-between gap-2`}
              >
                <span className="text-[10.5px] font-extrabold uppercase tracking-[0.14em]">
                  Part A / In-Clinic Vitals, Physical Examination & Bedside
                  Pelvic USG Findings
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  LMP:{" "}
                  {stats.lmpDate
                    ? format(parseISO(stats.lmpDate), "MMM d, yyyy")
                    : "Unlogged"}{" "}
                  • Cycle Day at Exam: CD ______
                </span>
              </div>

              <div className="border-2 border-t-0 border-slate-900 bg-white">
                {/* Row 1: Vitals & General Exam */}
                <div className="pdf-grid-2 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-400 border-b border-slate-400 text-[11px]">
                  <div className="p-2.5 space-y-1.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                      1. In-Clinic Vitals & Anthropometrics
                    </div>
                    <div className="grid grid-cols-2 gap-2 font-bold text-slate-950">
                      <div>
                        BP:{" "}
                        <span className="font-semibold">
                          {intake.bloodPressure || "______ / ______ mmHg"}
                        </span>
                      </div>
                      <div>
                        Pulse:{" "}
                        <span className="font-semibold">
                          {intake.restingHr || "______ bpm"}
                        </span>
                      </div>
                      <div>
                        Weight:{" "}
                        <span className="font-semibold">
                          {intake.weightKg
                            ? `${intake.weightKg} kg`
                            : "______ kg"}
                        </span>
                      </div>
                      <div>
                        Temp / SpO2:{" "}
                        <span className="font-semibold">_____°F • _____%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 space-y-1.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                      2. General Physical, Thyroid, Breast & Hirsutism Exam
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 font-bold text-slate-900">
                      <span>☐ No Pallor</span>
                      <span>☐ Clinical Pallor</span>
                      <span>☐ Thyromegaly</span>
                      <span>☐ Pedal Edema</span>
                      <span>☐ Acanthosis Nigricans</span>
                      <span>☐ Breast Exam NAD</span>
                      <span>☐ Mastalgia</span>
                      <span>mFG Score: _____</span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Per Abdomen & Per Speculum / Bimanual */}
                <div className="pdf-grid-2 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-400 border-b border-slate-400 text-[11px]">
                  <div className="p-2.5 flex flex-col justify-between space-y-2">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800">
                      3. Per Abdomen (P/A) Examination
                    </div>
                    <div className="space-y-2.5">
                      <div className="border-b border-slate-400 h-4" />
                      <div className="border-b border-slate-400 h-4" />
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10.5px] font-bold text-slate-800">
                      <span>☐ Soft & Non-Tender</span>
                      <span>☐ Suprapubic Tenderness</span>
                      <span>☐ R / L Iliac Fossa Tenderness</span>
                      <span>☐ Guarding / Mass</span>
                    </div>
                  </div>

                  <div className="p-2.5 flex flex-col justify-between space-y-2">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800">
                      4. Per Speculum (P/S) & Bimanual Pelvic (P/V) Examination
                    </div>
                    <div className="space-y-2.5">
                      <div className="border-b border-slate-400 h-4" />
                      <div className="border-b border-slate-400 h-4" />
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10.5px] font-bold text-slate-800">
                      <span>Uterus: ☐ AV ☐ RV</span>
                      <span>Cervix: ☐ Healthy ☐ Erosion</span>
                      <span>Fornices: ☐ Free ☐ Tender</span>
                      <span>☐ CMT</span>
                    </div>
                  </div>
                </div>

                {/* Row 3: Full-Width Bedside Pelvic USG Box */}
                <div className="p-2.5 text-[11px] space-y-2 bg-slate-50/40">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800">
                      5. Bedside Pelvic Ultrasound (TAS / TVS) & Follicular
                      Assessment
                    </span>
                    <span className="text-[10.5px] font-bold text-slate-800">
                      Probe: ☐ TAS &nbsp; ☐ TVS &nbsp; • &nbsp; Bladder: ☐ Full
                      &nbsp; ☐ Empty
                    </span>
                  </div>

                  <div className="pdf-grid-3 grid grid-cols-1 sm:grid-cols-3 gap-3 font-bold text-slate-950">
                    <div className="border-b border-slate-400 pb-1">
                      Uterus & Myometrium: ____________________
                    </div>
                    <div className="border-b border-slate-400 pb-1">
                      Endometrial Thickness (ET): _______ mm
                    </div>
                    <div className="border-b border-slate-400 pb-1">
                      Right & Left Ovary / AFC: _________________
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] font-bold text-slate-900">
                    <span>Pouch of Douglas (POD):</span>
                    <span>☐ Clear (No Free Fluid)</span>
                    <span>☐ Minimal Physiological Fluid</span>
                    <span>☐ Free Fluid Present</span>
                    <span>☐ PCOM Morphology</span>
                    <span>☐ Leiomyoma (Fibroid)</span>
                    <span>☐ Adenomyotic Features</span>
                    <span>☐ Ovarian Cyst / Dominant Follicle</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PART B: 21-ITEM CATEGORIZED DIAGNOSTIC LABORATORY & IMAGING ORDERS */}
            <div className="mb-3">
              <div
                className={`${theme.sectionHeaderBg} px-3 py-1.5 flex flex-wrap items-center justify-between gap-2`}
              >
                <span className="text-[10.5px] font-extrabold uppercase tracking-[0.14em]">
                  Part B / Diagnostic Laboratory, Endocrine & Imaging Orders
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Recommended Draw Timing: ☐ CD 2–3 (Baseline) &nbsp; ☐ CD 21
                  (Luteal) &nbsp; ☐ Fasting Morning
                </span>
              </div>

              <div className="border-2 border-t-0 border-slate-900 p-3 bg-white pdf-grid-3 grid grid-cols-1 sm:grid-cols-3 gap-4 text-[11px] font-bold text-slate-900">
                <div className="space-y-1">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800 border-b border-slate-400 pb-0.5 mb-1">
                    Hematology, Iron & Coagulation
                  </div>
                  <div>☐ Complete Blood Count (CBC + ESR)</div>
                  <div>☐ Serum Ferritin & Iron / TIBC</div>
                  <div>☐ Coagulation Profile (PT/INR, aPTT)</div>
                  <div>☐ Von Willebrand Factor (vWF) Panel</div>
                  <div>☐ ABO & Rh Typing / Indirect Coombs</div>
                  <div>☐ Vitamin B12 & Serum Folate</div>
                  <div>☐ 25-OH Vitamin D3 Total</div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800 border-b border-slate-400 pb-0.5 mb-1">
                    Reproductive & Thyroid Endocrinology
                  </div>
                  <div>☐ TSH, Free T3, Free T4 & Anti-TPO</div>
                  <div>☐ Serum Prolactin (Morning Pooled)</div>
                  <div>☐ Day 2/3 LH, FSH & Estradiol (E2)</div>
                  <div>☐ Anti-Müllerian Hormone (AMH)</div>
                  <div>☐ Total & Free Testosterone + SHBG</div>
                  <div>☐ DHEAS & 17-OH Progesterone</div>
                  <div>☐ Mid-Luteal Progesterone (Day 21)</div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800 border-b border-slate-400 pb-0.5 mb-1">
                    Metabolic, Imaging & Microbiology
                  </div>
                  <div>☐ Pelvic USG (TVS / TAS) + AFC & Doppler</div>
                  <div>☐ Follicular Monitoring Scan (CD 10–14)</div>
                  <div>☐ Fasting Glucose, Insulin & HbA1c</div>
                  <div>☐ 2-Hr 75g OGTT + Lipid Profile</div>
                  <div>☐ LFT, RFT & Serum Electrolytes</div>
                  <div>☐ Urine Routine/Microscopy & Culture</div>
                  <div>☐ Cervical Pap Smear (LBC) / High Vaginal Swab</div>
                </div>
              </div>
            </div>

            {/* PART C: STRUCTURED CLINICAL SOAP NOTES & FIGO PALM-COEIN (Fits on the exact same page!) */}
            <div>
              <div
                className={`${theme.sectionHeaderBg} px-3 py-1.5 flex flex-wrap items-center justify-between gap-2`}
              >
                <span className="text-[10.5px] font-extrabold uppercase tracking-[0.14em]">
                  Part C / Attending Physician Clinical SOAP Notes &
                  Differential Diagnosis
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  ICD-10 Code: ________________________
                </span>
              </div>

              <div className="border-2 border-t-0 border-slate-900 bg-white">
                <div className="grid grid-cols-12 border-b border-slate-500 bg-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-900">
                  <div className="col-span-2 py-1.5 px-2.5 border-r border-slate-500">
                    Clinical Focus
                  </div>
                  <div className="col-span-10 py-1.5 px-2.5 flex flex-wrap justify-between gap-2">
                    <span>
                      Pathophysiology, Clinical Observations & Consultation
                      Notes
                    </span>
                    <span>
                      FIGO PALM-COEIN: ☐ P &nbsp; ☐ A &nbsp; ☐ L &nbsp; ☐ M
                      &nbsp; ☐ C &nbsp; ☐ O &nbsp; ☐ E &nbsp; ☐ I &nbsp; ☐ N
                    </span>
                  </div>
                </div>

                <div>
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 border-b border-slate-400 h-7 items-center"
                    >
                      <div className="col-span-2 h-full border-r border-slate-400 px-2.5 flex items-center text-[10.5px] font-mono font-extrabold text-slate-800">
                        {idx === 0
                          ? "Subjective (S):"
                          : idx === 2
                            ? "Objective (O):"
                            : idx === 4
                              ? "Assessment (A):"
                              : idx === 6
                                ? "Care Plan (P):"
                                : ""}
                      </div>
                      <div className="col-span-10 h-full px-2.5" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t-2 border-slate-900 flex justify-between items-center text-[10px] font-bold text-slate-800">
              <span>
                MOONDAY CLINICAL RECORD • SHEET 02 (IN-CLINIC EXAMINATION &
                DIAGNOSTIC WORKUP)
              </span>
              <span className="font-mono">
                REF: {reportId} • CONTINUED ON SHEET 03 (OFFICIAL PRESCRIPTION
                PAD)
              </span>
            </div>
          </div>
        )}

        {/* ===================================================================
            SHEET 03: 1-PAGE LOCKED PHYSICIAN PRESCRIPTION PAD (Rx) & DUAL
            SIGNATURE ATTESTATION (MODELED AFTER 7948684.jpg)
            (Flex-locked so Rx Pad + Signatures NEVER split across pages!)
        =================================================================== */}
        {(sheetPreviewMode === "all_sheets" ||
          sheetPreviewMode === "sheet3_rx") && (
          <div
            id="moonday-pdf-sheet-3"
            className="bg-white text-slate-950 border-2 border-slate-900 rounded-none sm:rounded-lg shadow-sm overflow-hidden flex flex-col justify-between min-h-[960px] print:min-h-0 print:border-0 print:shadow-none"
          >
            {/* TOP & MIDDLE WRAPPER */}
            <div className="flex-1 flex flex-col">
              {/* 1. TOP PRESCRIPTION HEADER (Modeled directly after 7948684.jpg) */}
              <div className="relative pt-6 pb-4 px-8 sm:px-10 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div
                  className="absolute top-0 left-0 w-[62%] h-32 rounded-br-[80px] pointer-events-none"
                  style={{
                    background: `linear-gradient(135deg, ${theme.rxWaveBg} 0%, #ffffff 92%)`,
                  }}
                />

                <div className="relative z-10 pt-1">
                  <h1
                    className="text-2xl sm:text-[32px] font-black tracking-tight leading-none"
                    style={{ color: theme.rxBlueHex }}
                  >
                    {formattedDoctorTitle}
                  </h1>
                  <div className="text-xs sm:text-[13px] font-bold uppercase tracking-[0.26em] text-slate-800 mt-2">
                    {intake.physicianCredentials ||
                      "OBSTETRICS & GYNECOLOGY QUALIFICATION"}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700 mt-2.5">
                    {intake.physicianRegNo
                      ? `Certification / Reg. No: ${intake.physicianRegNo}`
                      : `Certification / Chart Ref: ${reportId}`}
                  </div>
                </div>

                <div className="relative z-10 self-end sm:self-start shrink-0">
                  <CaduceusMedicalEmblem
                    className="w-16 h-20"
                    color={theme.rxBlueHex}
                  />
                </div>
              </div>

              {/* 2. UNDERLINED PATIENT METADATA LINES (Patient Name, Address, Age, Date, Diagnosis) */}
              <div className="px-8 sm:px-10 pt-1 pb-4 space-y-2.5 text-xs">
                <div className="flex items-baseline gap-3">
                  <span className="font-bold text-slate-900 shrink-0 w-24">
                    Patient Name:
                  </span>
                  <div
                    className="flex-1 border-b pb-0.5 font-extrabold text-slate-950 text-sm"
                    style={{ borderColor: "#7aaed6" }}
                  >
                    {intake.prefillRxPatientLines ? patientName : ""}
                  </div>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="font-bold text-slate-900 shrink-0 w-24">
                    Address:
                  </span>
                  <div
                    className="flex-1 border-b pb-0.5 font-semibold text-slate-900"
                    style={{ borderColor: "#7aaed6" }}
                  >
                    {intake.prefillRxPatientLines
                      ? intake.patientAddress ||
                        `LMP: ${
                          stats.lmpDate
                            ? format(parseISO(stats.lmpDate), "MMM d, yyyy")
                            : "N/A"
                        } • Blood Group: ${intake.bloodGroup} • Allergies: ${
                          intake.drugAllergies[0] || "NKDA"
                        }`
                      : ""}
                  </div>
                </div>

                <div className="pdf-grid-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-baseline gap-3">
                    <span className="font-bold text-slate-900 shrink-0 w-24">
                      Age:
                    </span>
                    <div
                      className="flex-1 border-b pb-0.5 font-bold text-slate-950"
                      style={{ borderColor: "#7aaed6" }}
                    >
                      {intake.prefillRxPatientLines
                        ? `${intake.ageOrDob || "Adult Female"}${
                            intake.weightKg ? ` (${intake.weightKg} kg)` : ""
                          }`
                        : ""}
                    </div>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="font-bold text-slate-900 shrink-0 w-14 sm:text-right">
                      Date:
                    </span>
                    <div
                      className="flex-1 border-b pb-0.5 font-bold text-slate-950"
                      style={{ borderColor: "#7aaed6" }}
                    >
                      {intake.prefillRxPatientLines
                        ? format(reportEndDate, "MMMM d, yyyy")
                        : ""}
                    </div>
                  </div>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="font-bold text-slate-900 shrink-0 w-24">
                    Diagnosis:
                  </span>
                  <div
                    className="flex-1 border-b pb-0.5 font-bold text-slate-950"
                    style={{ borderColor: "#7aaed6" }}
                  >
                    {intake.provisionalDiagnosis || ""}
                  </div>
                </div>
              </div>

              {/* 3. FLEX-EXPANDING Rx WRITING CANVAS WITH CENTERED CADUCEUS WATERMARK */}
              <div className="px-8 sm:px-10 py-2 relative flex-1 flex flex-col justify-between min-h-[340px]">
                <div className="relative z-10 flex items-center justify-between">
                  <div
                    className="text-4xl sm:text-5xl font-black tracking-tighter select-none leading-none"
                    style={{
                      color: theme.rxBlueHex,
                      fontFamily: "Georgia, serif",
                    }}
                  >
                    &#8478;
                  </div>
                  <div className="text-[11px] font-bold text-slate-700">
                    Follow-Up Review: ☐ Next Menses (CD 2–3) &nbsp; ☐ 4 Weeks
                    &nbsp; ☐ 12 Weeks &nbsp; ☐ SOS
                  </div>
                </div>

                {/* Centered Caduceus Watermark Behind Writing Space */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <CaduceusMedicalEmblem
                    className="w-64 h-64"
                    color={theme.rxWatermarkHex}
                    opacity={0.55}
                  />
                </div>

                {/* Writing Area Body */}
                <div className="relative z-10 flex-1 my-2 flex flex-col justify-end">
                  {intake.rxPadStyle === "faint_lines" && (
                    <div className="space-y-6 my-auto">
                      {Array.from({ length: 8 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="border-b border-slate-300/90 h-3"
                        />
                      ))}
                    </div>
                  )}

                  {intake.rxPadStyle === "table_plus_canvas" && (
                    <table className="w-full text-left border-collapse border border-slate-400 text-[11px] bg-white/85 mt-auto">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-400 text-[10px] uppercase font-extrabold text-slate-900">
                          <th className="w-[8%] py-1 px-2 border-r border-slate-400 text-center">
                            #
                          </th>
                          <th className="w-[42%] py-1 px-2.5 border-r border-slate-400">
                            Medication / Formulation
                          </th>
                          <th className="w-[22%] py-1 px-2 border-r border-slate-400">
                            Frequency & Timing
                          </th>
                          <th className="w-[28%] py-1 px-2.5">
                            Cycle Days & Duration
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300">
                        {[1, 2, 3, 4].map((n) => (
                          <tr key={n} className="h-7">
                            <td className="px-2 border-r border-slate-300 text-center font-mono font-bold text-slate-700">
                              {n}.
                            </td>
                            <td className="px-2.5 border-r border-slate-300" />
                            <td className="px-2 border-r border-slate-300 text-[10px] font-semibold text-slate-600">
                              ☐ OD &nbsp; ☐ BD &nbsp; ☐ SOS
                            </td>
                            <td className="px-2.5" />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            
            <div className="px-8 sm:px-10 pb-5 pt-2 shrink-0">
              <div className="pdf-grid-2 grid grid-cols-1 sm:grid-cols-2 gap-10 pt-3 border-t border-slate-300">
                {/* Left Column: Patient Record Attestation & Signature */}
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-950">
                      01 / Patient Record Attestation
                    </div>
                    <p className="text-[11px] font-medium text-slate-800 mt-1 leading-snug">
                      I confirm that the menstrual onset dates, flow profiles,
                      clinical intake details, and daily symptoms recorded in
                      this chart accurately reflect my personal health logs.
                    </p>

                    {/* 96px (h-24) Clean Signing Space Above Line */}
                    <div className="h-24 w-full" />
                  </div>

                  <div>
                    <div className="border-t-2 border-slate-950 pt-2 flex justify-between items-baseline gap-4">
                      <span className="text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-slate-800">
                        Patient Signature
                      </span>
                      <span className="text-[11px] font-extrabold text-slate-900 shrink-0">
                        Date: ____ / ____ / {format(reportEndDate, "yyyy")}
                      </span>
                    </div>
                    <div className="text-[20px] leading-tight font-black text-slate-950 tracking-tight mt-1 break-words">
                      {patientName}
                    </div>
                    <div className="text-[11px] font-bold text-slate-700 mt-0.5">
                      Registered Patient • Blood Group: {intake.bloodGroup}
                    </div>
                  </div>
                </div>

                {}
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-950">
                      02 / Attending OB-GYN Verification & Official Seal
                    </div>
                    <p className="text-[11px] font-medium text-slate-800 mt-1 leading-snug">
                      Reviewed during gynecological consultation. Clinical
                      findings, diagnostic workup, and prescription regimen
                      discussed with patient.
                    </p>

                  
                    <div className="h-24 w-full flex items-center justify-end pt-1">
                      <div className="h-20 w-40 border-2 border-dashed border-slate-400 rounded flex items-center justify-center text-center p-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 leading-tight">
                          Official Clinic / Doctor
                          <br />
                          Rubber Stamp & Seal
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="border-t-2 border-slate-950 pt-2 flex justify-between items-baseline gap-4">
                      <span className="text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-slate-800">
                        Signature
                      </span>
                      <span className="text-[11px] font-extrabold text-slate-900 shrink-0">
                        Date: ____ / ____ / {format(reportEndDate, "yyyy")}
                      </span>
                    </div>
                    <div className="text-[20px] leading-tight font-black text-slate-950 tracking-tight mt-1 break-words">
                      {intake.attendingPhysician
                        ? formattedDoctorTitle
                        : "Dr. ___________________________"}
                    </div>
                    <div className="text-[11px] font-bold text-slate-700 mt-0.5">
                      {intake.physicianCredentials ||
                        "MD, DNB (Obstetrics & Gynecology)"}
                      {intake.physicianRegNo
                        ? ` • ${intake.physicianRegNo}`
                        : ""}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-300 flex justify-between items-center text-[10px] font-bold text-slate-700">
                <span>
                  MOONDAY CLINICAL RECORD • SHEET 03 (OFFICIAL PRESCRIPTION &
                  SIGNATURE ATTESTATION)
                </span>
                <span className="font-mono">
                  CHART REF: {reportId} • FIGO AUB SYSTEM 1 COMPLIANT
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
