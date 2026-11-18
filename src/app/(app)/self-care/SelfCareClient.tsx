"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  format,
  differenceInCalendarDays,
  parseISO,
  startOfDay,
} from "date-fns";
import {
  type LucideIcon,
  Heart,
  Coffee,
  Moon,
  Wind,
  CheckSquare,
  Flame,
  Droplet,
  Smile,
  Activity,
  ShieldAlert,
  Sun,
  Star,
  Search,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Bookmark,
  Sparkles,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Rows3,
} from "lucide-react";

type CareCategory =
  | "Symptom Care"
  | "Emotional & Mental"
  | "Food & Cravings"
  | "Vaginal & Flow"
  | "Cycle & Hormone Balance"
  | "Personal Need";

type CareReminder = {
  id: string;
  code: string;
  icon: LucideIcon;
  keyName: string;
  title: string;
  mechanism: string;
  text: string;
  cofactors: string;
  category: CareCategory;
};

type CompactCareSeed = [
  icon: LucideIcon,
  title: string,
  mechanism: string,
  text: string,
  cofactors: string,
];

// ============================================================================
// 1. ALL CORE SYMPTOMS FROM LOGCLIENT 
// ============================================================================

const SYMPTOM_SEEDS: Record<string, CompactCareSeed> = {
  Cramps: [
    Flame,
    "Warmth & Uterine Muscle Relaxation",
    "During your Moonday, hormone-like compounds called prostaglandins trigger uterine muscle contractions to shed your lining, which temporarily reduces blood flow and causes cramping.",
    "Place a warm heating pad (around 40°C–42°C) over your lower belly for 20 minutes. The warmth widens blood vessels, brings fresh oxygen to the muscle, and eases tightness.",
    "Magnesium Bisglycinate • Warm Ginger Tea • Heating Pad",
  ],

  "Mild cramps": [
    Coffee,
    "Gentle Pelvic Soothing",
    "Light prostaglandin activity gently contracts the uterus as your menstrual lining begins to release.",
    "Sip warm chamomile or ginger tea and do 5 minutes of slow pelvic tilts while lying on your back to improve pelvic blood circulation.",
    "Chamomile Tea • Gentle Pelvic Tilts • Warm Water",
  ],

  "Severe cramps": [
    Flame,
    "Deep Cramp Relief & Muscle Decompression",
    "Higher levels of inflammatory prostaglandins cause stronger, more frequent uterine contractions that press on nearby pelvic nerves.",
    "Rest in a supported child's pose or curled on your side with continuous lower-belly heat. Pair with gentle inner-ankle acupressure (four fingers above the ankle bone) and anti-inflammatory support.",
    "Omega-3 Fatty Acids • Magnesium + Vitamin B1 • Continuous Heat",
  ],

  "Abdominal pain": [
    Wind,
    "Belly Wall & Deep Breathing Relief",
    "Because the nerves of your uterus and digestive tract sit right next to each other, Moonday inflammation often causes your stomach muscles to tense up protectively.",
    "Wear soft, loose waistbands today and practice slow 4-second belly breaths to signal your core muscles and digestive tract to relax.",
    "Peppermint Tea • Loose Waistbands • Deep Belly Breathing",
  ],

  "Pelvic pain": [
    Moon,
    "Pelvic Bowl Pressure Relief",
    "Extra blood flow and fluid around the uterus before and during your Moonday can create a heavy, aching feeling deep in your lower pelvis.",
    "Lie on your back with two pillows under your knees for 15 minutes. This takes weight off your pelvic floor muscles and helps blood circulate back toward your heart.",
    "Red Raspberry Leaf Tea • Elevated Knees Rest",
  ],

  "Lower-back pain": [
    Flame,
    "Lower Spine & Sacral Warmth",
    "Uterine contractions send shared nerve signals directly to your lower back and sacrum, making your lumbar muscles ache.",
    "Apply a warm compress or heating pad across your lower spine and do a few slow cat-cow stretches on a soft mat to loosen tight back fascia.",
    "Warm Epsom Salt Bath • Lower-Back Heat • Turmeric",
  ],

  Backache: [
    Activity,
    "Spinal Muscle Support & Rest",
    "Hormonal shifts and circulating prostaglandins can leave the supportive muscles along your spine feeling tired and sore.",
    "Avoid heavy lifting today; support your lower back with a cushion while sitting and let a warm shower stream relax your back muscles.",
    "Magnesium Malate • Supportive Cushion • Warm Shower",
  ],

  "Heavy-feeling pelvis": [
    Moon,
    "Legs-Up-The-Wall Circulation Reset",
    "Increased pelvic blood volume before menstruation can make your lower pelvis feel full, heavy, or congested.",
    "Lie on your back and rest your legs vertically against a wall for 10 minutes. Gravity naturally drains pooled fluid and relieves downward pelvic pressure.",
    "Legs-Up-The-Wall Pose • Nettle Tea • Vitamin C",
  ],

  "Painful bowel movements": [
    Coffee,
    "Digestive & Pelvic Floor Softening",
    "Moonday prostaglandins also stimulate the lower bowel right behind the uterus, while tight pelvic floor muscles can make elimination uncomfortable.",
    "Drink a tall glass of warm water upon waking, eat soft soluble fiber (like oats or chia), and place your feet on a small footstool in the bathroom to relax your pelvic floor.",
    "Warm Morning Water • Soaked Chia Seeds • Bathroom Footstool",
  ],

  "Ovary pain": [
    Flame,
    "Mid-Cycle Ovulation Comfort (Mittelschmerz)",
    "As a mature egg follicle releases at ovulation, a small amount of natural fluid touches the pelvic lining, causing a one-sided twinge for 12–24 hours.",
    "Rest a warm compress over whichever side feels tender and drink plenty of electrolyte water while your body naturally absorbs the fluid.",
    "Localized Warmth • Electrolyte Water • Omega-3s",
  ],

  "Vulvar pain": [
    Heart,
    "External Comfort & Soothing Care",
    "Lower estrogen levels or tight pelvic floor muscles can leave external skin and nerve endings feeling extra sensitive.",
    "Switch to 100% breathable cotton underwear, avoid tight leggings, and soak in a lukewarm sitz bath for 10 minutes to calm irritation.",
    "100% Cotton Underwear • Lukewarm Sitz Bath • Barrier Balm",
  ],

  "Uterine spasms": [
    Coffee,
    "Calming Rhythmic Uterine Contractions",
    "Sudden spikes in calcium inside uterine muscle cells can trigger sharp, fluttering spasms during menstruation.",
    "Combine a warm hot-water bottle with slow 6-second exhales and magnesium-rich foods (like dark chocolate or leafy greens) to help muscle fibers uncramp.",
    "Magnesium Bisglycinate • 70%+ Dark Chocolate • Warmth",
  ],

  "Pelvic pressure": [
    Moon,
    "Side-Lying Pelvic Offloading",
    "Pre-menstrual water retention and a thickened uterine lining create extra downward weight on your pelvic floor.",
    "Take breaks from standing every 45 minutes and rest on your side with a pillow tucked between your knees and ankles.",
    "Side-Lying Rest • Dandelion Leaf Tea • Vitamin B6",
  ],

  Headache: [
    Droplet,
    "Hormonal Headache & Hydration Relief",
    "A quick drop in estrogen right before your Moonday shifts serotonin levels and causes blood vessels in the head to expand.",
    "Drink 500 ml of water with electrolytes, lower your screen brightness, and massage your temples with a cool cloth or a drop of peppermint oil.",
    "Electrolyte Water • Vitamin B2 (Riboflavin) • Magnesium",
  ],
  
  Migraine: [
    Moon,
    "Dark Room Sensory Retreat & Cooling",
    "Menstrual estrogen dips can trigger intense nerve sensitivity and throbbing blood-vessel changes in the brain.",
    "Retreat to a quiet, dark room immediately. Place a cold pack at the base of your skull or forehead while warming your feet to draw blood pressure away from your head.",
    "Cold Pack on Neck • Coenzyme Q10 • Magnesium (400 mg)",
  ],

  "Body aches": [
    Flame,
    "Full-Body Muscle Soothing",
    "When Moonday prostaglandins enter your general bloodstream, they can make your whole body feel achy, similar to a mild cold.",
    "Soak in a warm shower or Epsom salt bath for 15 minutes to boost circulation and wash away inflammatory tension.",
    "Warm Epsom Salt Soak • Ginger & Turmeric Tea",
  ],

  "Muscle pain": [
    Activity,
    "Gentle Recovery & Light Stretching",
    "Lower estrogen during your Moonday slightly slows down muscle repair after exercise or long days.",
    "Swap intense workouts for gentle stretching, light foam rolling, warm compresses, and protein-rich meals.",
    "Protein & Amino Acids • Tart Cherry Juice • Warm Compress",
  ],

  "Joint pain": [
    Coffee,
    "Joint Lubrication & Anti-Inflammatory Care",
    "Estrogen helps keep joints lubricated; when estrogen is low during menstruation, knees, hips, and wrists can feel stiffer.",
    "Move through slow, gentle joint circles in the morning and sip warm turmeric or ginger tea to calm joint inflammation.",
    "Omega-3 Fish/Flax Oil • Collagen + Vitamin C • Turmeric",
  ],

  "Tender breasts": [
    Heart,
    "Luteal Breast Comfort & Support",
    "Rising progesterone and prolactin in the second half of your cycle cause milk glands and surrounding tissue to hold extra fluid.",
    "Wear a soft, wire-free bralette, cut back on coffee and salty snacks for a few days, and do gentle sweeping massages toward your underarms in the shower.",
    "Vitamin E • Evening Primrose Oil • Wire-Free Bralette",
  ],

  "Breast swelling": [
    Droplet,
    "Lymphatic Drainage & Fluid Balance",
    "Pre-menstrual hormones temporarily tell your body to hold onto sodium and water in hormone-sensitive breast tissue.",
    "Drink extra plain water, eat potassium-rich foods (like avocado and banana), and wear non-restrictive tops.",
    "Vitamin B6 • Potassium-Rich Foods • Gentle Lymph Massage",
  ],

  "Neck pain": [
    Wind,
    "Neck & Jaw Tension Release",
    "Stress hormones and screen posture tighten the muscles connecting your neck, shoulders, and jaw.",
    "Drape a warm towel across the back of your neck, drop your shoulders away from your ears, and do slow ear-to-shoulder stretches.",
    "Warm Neck Towel • L-Theanine • Jaw Unclenching",
  ],

  "Shoulder pain": [
    Flame,
    "Upper-Back & Breathing Relaxation",
    "Shallow chest breathing during stressful or crampy days overworks the muscles around your shoulder blades.",
    "Apply moist heat across your shoulders for 15 minutes and practice expanding your lower ribs as you breathe in.",
    "Magnesium Glycinate • Moist Heat • Deep Rib Breathing",
  ],

  "Leg cramps": [
    Activity,
    "Calf Stretch & Mineral Replenishment",
    "Losing fluids and minerals during your Moonday can make leg muscles twitch or cramp, especially at night.",
    "Gently flex your toes upward toward your shin to stretch the calf, massage upward toward the knee, and replenish magnesium and potassium.",
    "Banana / Potassium • Magnesium Malate • Calf Stretch",
  ],

  "Joint stiffness": [
    Sun,
    "Morning Mobility & Warm Hydration",
    "Overnight stillness paired with low morning estrogen can make joints feel stiff when you first get out of bed.",
    "Start your morning with a mug of warm water and 5 minutes of easy ankle, hip, and shoulder rolls before rushing into your day.",
    "Warm Morning Water • Gentle Joint Circles • Omega-3s",
  ],

  Bloating: [
    Coffee,
    "Digestive Ease & Water-Retention Relief",
    "Progesterone in the luteal phase relaxes your digestive tract (slowing food down) while also causing your body to hold onto extra water.",
    "Sip peppermint or fennel tea after meals, skip fizzy carbonated drinks, and take a gentle 10-minute walk to help digestion move smoothly.",
    "Peppermint or Fennel Tea • 10-Minute Walk • Potassium Foods",
  ],

  Gas: [
    Activity,
    "Gentle Core Movement & Carminative Herbs",
    "When progesterone slows down digestion, gut bacteria have more time to ferment food, creating trapped gas.",
    "Lie on your back, hug your knees to your chest, and rock gently side to side, or massage your belly in a clockwise circle.",
    "Fennel & Ginger Tea • Knee-to-Chest Stretch • Clockwise Massage",
  ],

  Nausea: [

    Coffee,
    "Stomach Settling & Ginger Care",
    "Hormone surges or Moonday prostaglandins can irritate the vagus nerve connected to your stomach, causing queasiness.",
    "Sip cool water or fresh ginger tea slowly, nibble plain crackers or toast before your stomach gets empty, and press gently on your inner wrist (three fingers below the palm).",
    "Fresh Ginger Tea • Vitamin B6 • Inner-Wrist Acupressure",
  ],

  Vomiting: [
    Droplet,
    "Stomach Rest & Small Electrolyte Sips",
    "Strong prostaglandin waves during a heavy Moonday can trigger an overactive stomach reflex.",
    "Rest your stomach completely for 30 minutes, then take tiny sips of electrolyte water or clear broth every 10 minutes to stay hydrated.",
    "Electrolyte Sips • Clear Broth • Cool Compress",
  ],

  Diarrhea: [
    Droplet,
    "Soothing Moonday-Related Loose Stools",
    "The same prostaglandins that make your uterus contract also reach the nearby bowel, speeding up digestion on Days 1–2 of your Moonday.",
    "Eat gentle, binding foods (steamed white rice, bananas, applesauce, plain toast) and sip electrolyte fluids throughout the day.",
    "Bananas & White Rice • Electrolyte Water • Probiotics",
  ],

  Constipation: [
    Droplet,
    "Luteal Gut-Motility Activation",
    "High progesterone in the week before your Moonday relaxes intestinal muscles, making digestion slower and drier.",
    "Start your morning with 400 ml of warm lemon water, 2 tablespoons of soaked chia or ground flaxseeds, and a 15-minute walk.",
    "Warm Lemon Water • Soaked Chia Seeds • Magnesium Citrate",
  ],

  "Appetite change": [
    Heart,
    "Cycle-Synced Hunger Adjustment",
    "Estrogen naturally lowers appetite around ovulation, while progesterone ramps up your calorie needs and hunger in the luteal phase.",
    "Listen to your body's natural rhythm—eat lighter, fresh meals mid-cycle and add more filling complex carbs and protein in the week before your Moonday.",
    "Protein-Anchored Meals • Complex Carbs • Zero Food Guilt",
  ],

  "Increased appetite": [
    Coffee,
    "Fueling Your Higher Luteal Metabolism",
    "In the luteal phase, progesterone raises your body temperature and burns 100–250 extra calories a day—your extra hunger is real biology!",
    "Feed your body satisfying meals with slow-burning carbs (sweet potatoes, oats, brown rice) plus 25–30g of protein so your blood sugar stays steady.",
    "Sweet Potatoes & Oats • 30g Protein per Meal • Magnesium",
  ],

  "Reduced appetite": [
    Coffee,
    "Easy-to-Digest Mini Meals & Smoothies",
    "High estrogen around ovulation or mild Moonday queasiness can make big, heavy meals feel unappealing.",
    "Switch to 4–5 small snacks or liquid nourishment—like smoothies, warm soups, Greek yogurt, or a handful of nuts and dates.",
    "Nourishing Smoothies • Warm Broth • Nuts & Dates",
  ],

  Indigestion: [
    Wind,
    "Unhurried Eating & Upright Digestion",
    "Progesterone relaxes the valve at the top of your stomach and slows stomach emptying, making meals feel heavy.",
    "Eat slowly while sitting upright, avoid gulping large amounts of ice water during meals, and stay upright for an hour after eating.",
    "Chamomile Tea • Slow Mindful Chewing • Upright Rest",
  ],

  Heartburn: [
    Moon,
    "Evening Reflux Relief & Left-Side Sleeping",
    "Relaxed stomach valves in the luteal phase can let stomach acid rise if you lie down soon after dinner.",
    "Finish dinner 2–3 hours before bed, prop your head and upper torso up with an extra pillow, and sleep on your left side.",
    "Left-Side Sleeping • Elevated Pillow • Skip Late Spicy Food",
  ],

  "Food aversion": [
    Heart,
    "Gentle, Low-Aroma Comfort Foods",
    "Hormone shifts can make your sense of smell extra sharp, making strong cooking odors or greasy foods unappealing.",
    "Choose cool or room-temperature simple foods with very little smell—like chilled fruit, cucumber, sourdough toast, or yogurt.",
    "Chilled Fresh Fruit • Plain Sourdough • Lemon Water",
  ],

  "Stomach cramps": [
    Flame,
    "Warm Belly Compress & Herbal Calm",
    "Shared nerve pathways between the uterus and gut can cause your midsection to cramp when your cycle shifts.",
    "Rest a warm heating pad over your belly button and sip warm lemon balm, peppermint, or chamomile tea to relax gut spasms.",
    "Lemon Balm or Chamomile Tea • Warm Belly Pad",
  ],

  "Gurgling stomach": [
    Coffee,
    "Settling an Active Digestive Tract",
    "Prostaglandin shifts around your Moonday speed up fluid and air movement through your intestines.",
    "Sip a warm mug of fennel and ginger tea and eat a small snack with soluble fiber (like a banana or oat crackers) to absorb extra fluid.",
    "Fennel & Ginger Tea • Oat Crackers or Banana",
  ],

  Fatigue: [
    Moon,
    "Deep Energy Conservation & Iron Support",
    "Dropping hormones on Day 1 of your Moonday or high progesterone before your Moonday directs energy inward for cycle renewal.",
    "Cross one non-essential task off your list today, take a 20-minute eyes-closed rest break, and eat iron-rich foods with vitamin C.",
    "Iron + Vitamin C • 20-Minute Rest Break • B-Vitamins",
  ],

  Lethargy: [
    Sun,
    "Morning Sunlight & Hydration Wake-Up",
    "Low morning cortisol and hormone dips can leave you feeling heavy and slow to wake up.",
    "Step into natural outdoor daylight for 10 minutes within half an hour of waking and drink a tall glass of water before having coffee.",
    "10 Mins Morning Sunlight • Tall Glass of Water • Protein Breakfast",
  ],

  "Low energy": [
    Moon,
    "Gentle Pacing & Steady Blood Sugar",
    "Your physical stamina naturally dips during menstruation and the late luteal days compared to mid-cycle.",
    "Swap intense cardio for a gentle walk or stretching, and pair every carb snack with protein (like apple with peanut butter) to avoid energy crashes.",
    "Gentle Walking • Protein + Carb Snacks • Early Bedtime",
  ],

  Weakness: [
    Coffee,
    "Iron, Electrolytes & Steady Fuel",
    "Menstrual blood loss and fluid shifts can temporarily lower iron levels and blood pressure, making limbs feel weak.",
    "Eat iron-rich foods (spinach, lentils, eggs, or meat) with lemon or fruit, drink water with a pinch of sea salt, and stand up slowly.",
    "Iron-Rich Meal + Vitamin C • Electrolyte Water",
  ],

  Sleepiness: [
    Moon,
    "Honoring Progesterone's Natural Drowsiness",
    "As progesterone breaks down in the luteal phase, it produces natural calming compounds that make your brain feel sleepy earlier.",
    "Take a short 20-minute power nap before 2:30 PM or get into bed 45 minutes earlier tonight without guilt.",
    "20-Min Early Nap • 45-Min Earlier Bedtime",
  ],

  Insomnia: [
    Wind,
    "Cooling Your Bedroom & 4-7-8 Breathing",
    "Progesterone raises your core body temperature by ~0.4°C in the luteal phase, which can block your brain from entering deep sleep.",
    "Take a warm shower an hour before bed (which helps your body cool down afterward), keep your bedroom cool (~18°C), and use the 4-7-8 breath pacer.",
    "Magnesium Glycinate (300 mg) • Cool Bedroom • 4-7-8 Breath",
  ],

  "Poor sleep": [
    Moon,
    "Evening Screen Dimming & Nervous System Calm",
    "Pre-menstrual hormone drops can make your nervous system more alert at night, leading to lighter, less refreshing sleep.",
    "Turn off bright overhead lights 60 minutes before bed, switch devices to night mode, and write tomorrow's worries down on paper.",
    "Chamomile Tea • L-Theanine • Dim Evening Lights",
  ],

  "Disrupted sleep": [
    Moon,
    "Overnight Blood-Sugar & Cortisol Balance",
    "If blood sugar dips overnight during the high-metabolism luteal phase, your body releases cortisol at 2–4 AM, waking you up.",
    "Have a small protein-and-fat snack an hour before sleep (like a spoonful of almond butter or Greek yogurt) to keep blood sugar steady all night.",
    "Bedtime Almond Butter / Yogurt • Magnesium",
  ],

  "Restless legs": [
    Activity,
    "Evening Leg Massage & Iron/Magnesium Care",
    "Low iron or magnesium levels during your Moonday can make leg nerves feel jumpy or restless when you lie down at night.",
    "Stretch your calves gently before bed, massage your legs with magnesium lotion or warm oil, and check that you are getting enough dietary iron.",
    "Topical Magnesium Lotion • Iron-Rich Foods • Calf Stretch",
  ],

  "Frequent waking": [
    Moon,
    "Deep Sleep Continuity Routine",
    "Hormonal shifts before your Moonday make your sleep-wake switch more sensitive to noise, warmth, or a full bladder.",
    "Slow down liquid intake 2 hours before bed, use breathable cotton sheets, and do slow nasal breaths if you wake up.",
    "Breathable Cotton Bedding • Glycine or Chamomile",
  ],
  
  "Vivid dreams": [
    Wind,
    "Luteal REM-Sleep Grounding",
    "High progesterone and pre-Moonday hormone shifts increase REM sleep activity, making dreams feel unusually vivid or emotional.",
    "When you wake up, place both feet flat on the floor, drink warm water, and jot down any dream thoughts in your journal to clear your mind.",
    "Morning Journal Release • Grounding Breath",
  ],

  Nightmares: [
    Heart,
    "Calming the Nighttime Stress Response",
    "Being too warm in bed or having pre-Moonday cortisol spikes can trigger stressful dreams.",
    "Look around and name 5 familiar objects in your bedroom to remind your brain you are safe, cool down your bedding, and play soft rain sounds.",
    "Cool Bedding • Lemon Balm Tea • Ambient Rain Sounds",
  ],

  "Difficulty falling asleep": [
    Wind,
    "Paper Brain-Dump & Warm Socks Trick",
    "A racing mind and warm core temperature delay the release of your sleep hormone, melatonin.",
    "Write tomorrow's to-do list on paper so your brain can stop holding onto it, wear warm socks (warming feet cools your core!), and practice slow breathing.",
    "Paper To-Do Dump • Warm Socks • Magnesium Glycinate",
  ],

  Oversleeping: [
    Sun,
    "Guilt-Free Cycle Repair & Recovery",
    "During menstruation and late luteal days, your immune system and uterus do heavy internal repair that genuinely requires extra sleep.",
    "Give yourself full permission to sleep in when needed, then rehydrate with a big glass of water and step into morning sunlight.",
    "Zero Sleep Guilt • Morning Water & Sunlight",
  ],

  Dizziness: [
    Droplet,
    "Blood Pressure & Electrolyte Support",
    "Estrogen relaxes blood vessels while menstrual bleeding lowers fluid volume, causing blood pressure to dip when you stand up quickly.",
    "Flex your calves and ankles before standing up, rise slowly, and drink 400 ml of water with electrolytes or a pinch of sea salt and lemon.",
    "Electrolyte Water • Stand Up Slowly • Iron + B12",
  ],

  "Light-headedness": [
    Coffee,
    "Quick Blood-Sugar & Hydration Boost",
    "Going too long between meals during your cycle can cause a quick dip in blood glucose to the brain.",
    "Sit down right away, elevate your feet if possible, and eat a snack that pairs natural carbs with protein (like fruit and nuts).",
    "Fruit + Nuts Snack • Electrolyte Water",
  ],

  "Brain fog": [
    CheckSquare,
    "Single-Tasking & Brain Fuel",
    "When estrogen is low during your Moonday or late luteal phase, the brain chemicals responsible for sharp focus temporarily dip.",
    "Don't rely on mental memory today—write tasks down on a checklist, work on one thing at a time for 15–20 minutes, and eat choline-rich foods like eggs or nuts.",
    "Written Checklists • Single-Tasking • Omega-3 DHA & Eggs",
  ],

  "Difficulty concentrating": [
    Wind,
    "15-Minute Focus Blocks & Quiet Space",
    "High progesterone naturally shifts your brain from outward multitasking toward quieter, inward processing.",
    "Close extra browser tabs, put your phone on silent, and use the 15-minute Pomodoro timer in your Journal Studio with soft pink noise.",
    "15-Min Pomodoro Timer • L-Theanine / Matcha • Pink Noise",
  ],

  Forgetfulness: [
    CheckSquare,
    "External Reminders & Self-Patience",
    "Natural hormone fluctuations temporarily affect the hippocampus, the part of your brain that handles short-term recall.",
    "Capture thoughts and appointments immediately in MoonDay Reminders or notes, and treat yourself with patience.",
    "MoonDay Reminders • B-Vitamins & Omega-3s",
  ],

  "Sensitivity to light": [
    Moon,
    "Soft Lighting & Eye Rest",
    "Pre-menstrual estrogen dips can make the optic nerves and visual centers of your brain extra sensitive to bright glare.",
    "Use MoonDay's warm eye-comfort light theme or dark mode, turn off harsh overhead fluorescent lights, and rest your eyes with a cool cloth.",
    "Warm Low Lamps • 20-20-20 Eye Breaks • Magnesium",
  ],
  
  "Sensitivity to sound": [
    Wind,
    "Noise Buffering & Nervous System Quiet",
    "In the late luteal phase, calming brain chemicals (like GABA) dip slightly, making loud voices, traffic, or clattering sounds feel overwhelming.",
    "Put on noise-canceling headphones or play soft rain or pink noise to create a gentle acoustic buffer around yourself.",
    "Noise-Canceling Headphones • Soft Rain Ambience • Magnesium",
  ],

  Clumsiness: [
    Activity,
    "Mindful Movement & Joint Awareness",
    "Hormone shifts before your Moonday slightly alter joint stability and fine motor coordination, making it easier to bump into things or drop items.",
    "Slow down your pace on stairs and while cooking, wear stable footwear, and choose controlled strength movements over fast jumping.",
    "Unhurried Pace • Stable Footwear • Electrolytes",
  ],

  Sluggishness: [
    Droplet,
    "Circulation Boost & Fresh Air",
    "Slower blood flow and progesterone's calming effect can make your body feel heavy and slow-moving.",
    "Drink a glass of cool lemon water, do 20 standing calf raises to pump blood back up your legs, and step outside for 3 minutes of fresh air.",
    "Cool Lemon Water • 20 Calf Raises • Fresh Outdoor Air",
  ],

  Tingling: [
    Activity,
    "Nerve Space & Circulation Stretch",
    "Mild pre-Moonday water retention can press slightly on nerves in your wrists, hands, or ankles.",
    "Uncross your legs, shake out your hands, roll your wrists and ankles gently, and include B-vitamin-rich foods in your meals.",
    "Wrist & Ankle Rolls • Vitamin B6 & B12 • Reduce Extra Salt",
  ],

  Numbness: [
    ShieldAlert,
    "Posture Shift & Circulation Check",
    "Staying in one position or wearing tight clothing can pinch nerves or reduce local blood flow.",
    "Loosen tight waistbands or shoes, change your sitting position, and check in with a doctor if numbness is one-sided or doesn't fade.",
    "Loosen Tight Clothing • Gentle Movement • Medical Check if Persistent",
  ],

  Acne: [
    Droplet,
    "Hormonal Blemish & Skin Barrier Care",
    "When estrogen drops before your Moonday, progesterone and natural androgens stimulate oil glands, which can clog pores along the jawline and chin.",
    "Wash with a gentle, non-stripping cleanser, dab a niacinamide serum or pimple patch on spots (never squeeze!), and sleep on a clean pillowcase.",
    "Niacinamide Serum • Hydrocolloid Patch • Zinc & Spearmint Tea",
  ],

  "Oily skin": [
    Droplet,
    "Balancing Luteal Oil Production",
    "Progesterone naturally increases sebum (skin oil) production during the second half of your cycle.",
    "Avoid harsh alcohol toners (which dry skin out and trigger even more oil); use a lightweight gel moisturizer and niacinamide.",
    "Lightweight Gel Moisturizer • Niacinamide • Green Tea",
  ],

  "Dry skin": [
    Droplet,
    "Moisture Lock for Low-Estrogen Days",
    "During your Moonday, low estrogen temporarily reduces your skin's natural hyaluronic acid and protective oils.",
    "Apply your moisturizer or facial oil onto damp skin right after showering to lock in water, and drink extra fluids today.",
    "Moisturize on Damp Skin • Ceramides & Squalane • Omega-3s",
  ],

  "Dry eyes": [
    Moon,
    "20-20-20 Screen Break & Warm Eyelid Compress",
    "Hormonal shifts can make the natural oil film that protects your tears evaporate faster, especially during screen work.",
    "Rest a warm, damp washcloth over closed eyes for 5 minutes, blink fully while using screens, and use preservative-free lubricating eye drops.",
    "Warm Eyelid Compress • 20-20-20 Screen Rule • Omega-3s",
  ],

  "Hot flashes": [
    Wind,
    "Cooling Layers & Neck Pulse-Point Relief",
    "A sudden dip in estrogen temporarily confuses your brain's internal thermostat, triggering a quick wave of warmth.",
    "Dress in light, breathable layers you can easily remove, place a cool damp cloth on the back of your neck, and take slow 5-second breaths.",
    "Cool Cloth on Neck • Breathable Layers • Sage Tea",
  ],

  "Night sweats": [
    Moon,
    "Cool Bedding & Pre-Moonday Temperature Care",
    "Hormone drops right before your Moonday can cause your internal thermostat to dump heat overnight.",
    "Sleep in light 100% cotton or bamboo pajamas, keep a fan or cool air circulating, and avoid heavy or spicy meals right before bed.",
    "100% Cotton/Bamboo Sheets • Cool Bedroom • Evening Electrolytes",
  ],

  Sweating: [
    Droplet,
    "Mineral & Fluid Replenishment",
    "A warmer body temperature in the luteal phase naturally increases daytime sweating.",
    "Replenish lost water and minerals with coconut water or lemon-electrolyte water, and wear airy cotton or linen fabrics.",
    "Coconut or Electrolyte Water • Airy Natural Fabrics",
  ],

  Chills: [
    Flame,
    "Core Warming & Ginger-Cinnamon Tea",
    "Moonday prostaglandins can briefly affect your body's thermostat, leaving you feeling chilly or shivery on Day 1.",
    "Put on warm socks, wrap up in a cozy blanket with a heating pad, and sip a hot mug of ginger and cinnamon tea.",
    "Warm Socks & Blanket • Hot Ginger-Cinnamon Tea • Iron Check",
  ],

  Fever: [
    ShieldAlert,
    "Rest, Hydration & Temperature Check",
    "While progesterone raises basal temperature slightly (+0.4°C), a true fever above 38°C (100.4°F) means your immune system is fighting an infection.",
    "Rest completely in bed, sip electrolyte fluids steadily, monitor your temperature, and contact a doctor if your fever stays above 38°C.",
    "Complete Bed Rest • Electrolyte Fluids • Doctor Check if >38°C",
  ],

  "Water retention": [
    Droplet,
    "Natural Fluid Release & Potassium Balance",
    "Pre-Moonday hormone shifts cause your kidneys to hold onto extra sodium and water in your tissues.",
    "Drink more plain water (which signals your body that it is safe to release stored fluid), eat potassium-rich foods like avocado, and elevate your feet.",
    "Extra Plain Water • Potassium Foods (Avocado/Banana) • Vitamin B6",
  ],

  "Puffy face": [
    Droplet,
    "Morning Cool Splash & Facial Lymph Sweep",
    "Overnight fluid pooling paired with luteal water retention can leave your eyes and cheeks looking slightly puffy in the morning.",
    "Splash cool water on your face and use your ring fingers to sweep gently from the sides of your nose outward toward your ears and down your neck.",
    "Cool Water Splash • Outward Facial Massage • Extra Pillow",
  ],

  "Swollen fingers": [
    Droplet,
    "Hand Elevation & Low-Salt Hydration",
    "Pre-menstrual fluid retention often collects in your fingers and hands by the end of the day.",
    "Slip off tight rings early in the day, raise your hands above your head while opening and closing your fists for 30 seconds, and drink lemon water.",
    "Remove Tight Rings • Lemon Water • Cut Back on Salty Snacks",
  ],

  "Swollen ankles": [
    Moon,
    "Foot Elevation & Ankle Pumps",
    "Gravity plus progesterone's relaxing effect on leg veins can cause fluid to pool around your ankles after sitting or standing.",
    "Prop your feet up on pillows above heart level for 15 minutes and point and flex your feet 20 times to pump fluid upward.",
    "Elevate Feet on Pillows • 20 Ankle Pumps • Potassium & Water",
  ],

  "Hair thinning": [
    Heart,
    "Scalp Circulation & Iron/Protein Nourishment",
    "Low iron stores (ferritin) from heavy Moondays or hormonal stress can cause hair follicles to shed more easily.",
    "Avoid tight ponytails, massage your scalp gently for 4 minutes daily to boost blood flow, and pair protein-rich meals with iron and vitamin C.",
    "Iron + Vitamin C • Daily Scalp Massage • Protein & Zinc",
  ],

  "Brittle nails": [
    Heart,
    "Nail Moisture & Mineral Support",
    "When your body is low on iron, zinc, or healthy fats, nails can become dry and peel easily.",
    "Rub a drop of jojoba oil or rich hand cream into your cuticles every night, wear gloves when washing dishes, and eat protein and seeds.",
    "Jojoba Cuticle Oil • Dishwashing Gloves • Zinc & Protein",
  ],

  "Body odor changes": [
    Droplet,
    "Natural pH Refresh & Breathable Fabrics",
    "Rising progesterone and testosterone in the luteal phase make sweat glands produce thicker oils that skin bacteria love.",
    "Use a gentle AHA or botanical body wash under your arms to keep skin pH balanced, and wear breathable cotton instead of polyester.",
    "Breathable Cotton Tops • Gentle pH Body Wash • Chlorophyll Greens",
  ],

  "Vaginal itching": [
    ShieldAlert,
    "Gentle pH Protection & Cotton Care",
    "Menstrual blood has a higher pH (around 7.0) than your normal vaginal environment (3.8–4.5), which can temporarily irritate skin or trigger yeast.",
    "Wash externally with plain warm water only (never scented soaps), wear loose cotton underwear, and see a doctor if itching comes with thick discharge.",
    "Plain Warm Water Rinse • Loose Cotton Underwear • Women's Probiotic",
  ],

  "Vaginal dryness": [
    Droplet,
    "Natural Moisture & Barrier Soothing",
    "Right after your Moonday or just before it starts, lower estrogen levels reduce natural vaginal moisture.",
    "Drink plenty of water, include healthy omega-3 fats in your diet, and apply a clean, pH-balanced hyaluronic moisturizer or pure coconut/jojoba oil externally.",
    "pH-Balanced Moisturizer • Omega-3 & Sea Buckthorn • Extra Water",
  ],

  "Urinary discomfort": [
    Droplet,
    "Bladder Flushing & Soothing Fluids",
    "Low-estrogen days can leave the urinary tract lining more sensitive, especially if you are slightly dehydrated.",
    "Drink a glass of plain water every hour to dilute your urine, skip coffee and fizzy drinks today, and never hold your pee when you feel the urge.",
    "300 ml Water Every Hour • D-Mannose • Skip Coffee/Soda",
  ],
  "Painful urination": [
    ShieldAlert,
    "Immediate Water Flush & UTI Check",
    "Burning or stinging when you pee is often a sign of bladder irritation or a urinary tract infection (UTI).",
    "Drink plenty of plain water, take D-mannose or unsweetened cranberry if available, and contact a doctor for a quick urine test.",
    "Aggressive Water Flush • D-Mannose • Quick Doctor Urine Check",
  ],

  "Urinary frequency": [
    Droplet,
    "Complete Bladder Emptying & Pelvic Relaxation",
    "Before your Moonday, a slightly fuller uterus presses on your bladder, and natural luteal fluid shifts increase trips to the bathroom.",
    "When sitting on the toilet, lean slightly forward with your feet flat and relax your belly so your bladder empties completely in one go.",
    "Lean Forward When Voiding • Pelvic Floor Relaxation",
  ],

  "Pain during sex": [
    Heart,
    "Pelvic Floor Relaxation & Extra Lubrication",
    "Lower estrogen moisture, a lower cervix position before your Moonday, or tight pelvic muscles can make intimacy feel uncomfortable.",
    "Always pause immediately if anything hurts. Take extra time for warm-up, use plenty of pH-balanced water-based lubricant, and try deep belly breaths to relax pelvic muscles.",
    "Generous Water-Based Lubricant • Slow Warm-Up • Deep Belly Breaths",
  ],

  "Unusual discharge": [
    ShieldAlert,
    "Cycle Tracking & Gentle pH Care",
    "While discharge naturally changes from dry to creamy to stretchy across your cycle, sudden changes in color, smell, or itchiness signal a pH shift.",
    "Log what you notice in MoonDay, avoid all scented washes or douching, wear cotton underwear, and book a quick swab with your doctor if it persists.",
    "Log Details in MoonDay • Cotton Underwear • Doctor Check if Symptomatic",
  ],

  "Strong odor": [
    ShieldAlert,
    "Restoring Natural Acidic pH Balance",
    "Menstrual blood or sweat can temporarily raise vaginal pH, allowing odor-causing bacteria to outnumber your protective lactobacilli.",
    "Never douche (which washes away good bacteria); rinse externally with plain warm water, change pads/tampons every 3–4 hours, and see a doctor if the smell is fishy.",
    "Change Protection Every 3–4h • Plain Water Rinse • Oral Probiotics",
  ],

  "Mood swings": [
    Wind,
    "Smoothing Hormonal Waves & Blood Sugar",
    "Rapid rises and drops in estrogen and progesterone before your Moonday directly affect serotonin and GABA—your brain's mood stabilizers.",
    "Eat protein every 3–4 hours (low blood sugar makes hormonal mood swings twice as intense!) and take 5 slow breaths before responding to stress.",
    "Protein Every 3–4 Hours • Vitamin B6 + Magnesium • Vagal Breathing",
  ],

  Irritability: [
    Wind,
    "Sensory Quiet Break & Jaw Release",
    "When calming progesterone drops in the late luteal phase, your nervous system has a thinner buffer against noise, mess, and interruptions.",
    "Take a 15-minute quiet timeout away from people and notifications, unclench your jaw, drop your shoulders, and breathe out slowly.",
    "15-Minute Quiet Timeout • L-Theanine • Magnesium Bisglycinate",
  ],

  Anxiety: [
    Wind,
    "Calming the Vagus Nerve & Adrenaline Response",
    "Hormone shifts can make your heart beat a little faster and put your brain's stress center on high alert.",
    "Do 5 rounds of the Physiological Sigh (two quick inhales through your nose, one long slow exhale through your mouth) and splash cool water on your face.",
    "Physiological Sigh Breath • Cool Water Splash • Chamomile Tea",
  ],

  Sadness: [
    Heart,
    "Gentle Self-Compassion & Serotonin Care",
    "When estrogen dips before and during your Moonday, your brain temporarily produces less mood-lifting serotonin.",
    "Place a warm hand over your heart, wrap up in a cozy blanket, watch or read something comforting, and treat yourself like a loved friend.",
    "Warm Blanket & Tea • Saffron or Dark Chocolate • Self-Kindness",
  ],

  Tearfulness: [
    Droplet,
    "Letting Tears Release Stress Hormones",
    "Emotional tears actually carry stress hormones (like cortisol) out of your body, acting as a natural release valve when hormones shift.",
    "Let yourself cry without apologizing or holding back; afterward, rest a cool damp cloth over your eyes and drink a full glass of water.",
    "Cool Cloth Over Eyes • Full Glass of Water • Gentle Rest",
  ],

  "Feeling overwhelmed": [
    CheckSquare,
    "The Rule of One & Brain Offloading",
    "In the luteal phase, your brain prioritizes emotional processing over juggling ten tasks at once, making big to-do lists feel crushing.",
    "Write everything down on paper, cross off everything that can wait until next week, and focus on just one tiny 5-minute step.",
    "Paper Brain-Dump • Pick Just 1 Tiny Task • Box Breathing",
  ],

  Paranoia: [
    Heart,
    "Grounding in Present Safety",
    "Progesterone naturally activates the brain's protective 'watchful' circuits, which can sometimes make you expect the worst or misread neutral situations.",
    "Remind yourself: 'My hormones are making my brain extra watchful today, not in real danger.' Name 5 physical things you can see and touch right now.",
    "5-4-3-2-1 Sensory Grounding • Balanced Meal • Reassurance",
  ],

  "Intrusive thoughts": [
    Wind,
    "Letting Thoughts Pass Like Weather",
    "Temporary dips in serotonin and GABA before your Moonday make it harder for the brain to dismiss sticky, repetitive worries.",
    "Picture the thought as a passing cloud or 'pre-Moonday weather'—notice it without arguing with it or judging yourself for having it.",
    "Label as 'Hormonal Weather' • L-Theanine & Magnesium • Gentle Walk",
  ],

  "Rejection sensitive": [
    Heart,
    "Protecting Your Heart Before Your Moonday",
    "Lower estrogen and endorphins in the late luteal phase make social slights or short text replies sting much more than usual.",
    "Avoid jumping to conclusions or having heavy relationship talks when you are tired and hungry—eat a warm meal and sleep on it first.",
    "Warm Meal First • Sleep On Big Talks • Self-Compassion Note",
  ],

  Apathy: [
    Sun,
    "Zero-Pressure Mechanical Self-Care",
    "Low hormone levels during the first days of your Moonday temporarily quiet your brain's dopamine motivation circuits.",
    "Don't force yourself to feel bubbly or hyper-productive today. Stick to simple basics: drink water, eat a warm meal, and sit in natural light.",
    "Simple Basics Only • Natural Sunlight • Warm Nourishing Meal",
  ],

  "Sore throat": [
    Coffee,
    "Warm Salt Gargle & Honey Soothing",
    "Immune shifts right before your Moonday ('Moonday flu') can leave your throat feeling scratchy or dry.",
    "Gargle with warm salt water (1/2 teaspoon salt in a mug of warm water) and sip herbal tea with honey and lemon.",
    "Warm Salt-Water Gargle • Honey & Lemon Tea • Zinc & Vitamin C",
  ],

  "Runny nose": [
    Coffee,
    "Steam Inhalation & Natural Histamine Calm",
    "Estrogen surges can stimulate histamine release and cause the lining of your nose to swell slightly, mimicking mild allergies.",
    "Take a steamy shower, use a gentle saline nasal spray, and sip nettle or peppermint tea.",
    "Steamy Shower • Saline Nasal Spray • Nettle Tea & Vitamin C",
  ],

  Cough: [
    Wind,
    "Airway Moisture & Elevated Rest",
    "Dry air and pre-Moonday throat sensitivity can trigger a tickly cough, especially at night.",
    "Prop your head and shoulders up on extra pillows, sip warm water with honey, and keep a humidifier or bowl of water near your bed.",
    "Warm Water + Honey • Elevated Pillows • Humidified Air",
  ],
  
  Congestion: [
    Flame,
    "Sinus Warmth & Steam Relief",
    "Hormone receptors inside your nasal passages respond to estrogen and progesterone just like reproductive tissues, occasionally causing stuffiness.",
    "Place a warm, damp washcloth across your cheekbones and nose, inhale steam from a hot mug of tea, and sleep with your head slightly elevated.",
    "Warm Sinus Compress • Peppermint/Eucalyptus Steam • Extra Pillow",
  ],

  Sneezing: [
    Heart,
    "Histamine Balance & Fresh Vitamin C",
    "Higher estrogen levels can temporarily increase histamine sensitivity, making you sneeze more around ovulation or before your Moonday.",
    "Drink plenty of water, cut back on aged or fermented foods for a couple of days, and eat vitamin-C-rich fruits and bell peppers.",
    "Vitamin C Fruits • Quercetin (Apples/Berries) • Extra Water",
  ],

  "Swollen lymph nodes": [
    Moon,
    "Deep Immune Rest & Gentle Fluids",
    "Your immune system works harder during pre-menstrual transitions, which can make glands in your neck, underarms, or groin feel slightly tender.",
    "Skip strenuous workouts today, sip warm broths and herbal teas, and give your body 8+ hours of sleep to recover.",
    "Skip Heavy Workouts • Warm Herbal Broth • 8+ Hours Sleep",
  ],
};

// ============================================================================
// 2. ALL CORE MOODS FROM LOGCLIENT 
// ============================================================================

const MOOD_SEEDS: Record<string, CompactCareSeed> = {
  Fine: [
    Smile,
    "Keeping Your Steady Rhythm",
    "Your hormones and nervous system are in a comfortable, balanced zone today.",
    "Maintain this steady feeling by eating regular meals every 4 hours, drinking water, and taking short stretching breaks.",
    "Regular Meals • Steady Hydration • Short Stretch Breaks",
  ],

  Normal: [
    Smile,
    "Balanced Daily Flow",
    "Your cycle hormones are moving smoothly without sharp dips or surges today.",
    "Stick to your supportive daily habits—good food, natural daylight, and a consistent bedtime.",
    "Consistent Sleep Schedule • Whole-Food Meals • Daylight",
  ],

  Calm: [
    Wind,
    "Protecting Your Inner Quiet",
    "Your calming nervous system (the vagus nerve) and soothing brain chemicals are well-balanced right now.",
    "Protect your peace by keeping notifications on silent and enjoying a quiet hobby, reading, or journaling.",
    "Silent Notifications • Deep Reading or Journaling • Herbal Tea",
  ],

  Happy: [
    Sun,
    "Savoring Rising Estrogen & Serotonin",
    "Rising estrogen—especially in the follicular and ovulatory phases—naturally boosts serotonin and dopamine, lifting your mood.",
    "Write down three sentences in your Personal Journal about what made you feel good today so you can reread it on harder days.",
    "Capture in Journal • Share Your Smile • Joyful Movement",
  ],

  Sad: [
    Heart,
    "Warm Comfort for Low-Serotonin Days",
    "When estrogen and progesterone drop before or during your Moonday, your brain's serotonin levels dip too, making everything feel heavier.",
    "Treat yourself with gentle kindness: put on your softest clothes, make a warm drink, and let go of pressure to be productive today.",
    "Cozy Blanket & Warm Tea • Comfort Show • Zero Self-Judgment",
  ],

  Confused: [
    CheckSquare,
    "Stepping Back from Big Decisions",
    "Quick hormonal shifts can temporarily cloud focus and make choices feel overwhelming.",
    "Give yourself permission to sleep on big decisions for 24 hours; jot down a simple pros-and-cons list in your journal and rest.",
    "24-Hour Decision Pause • 2-Column Journal Note • Omega-3s",
  ],

  Anxious: [
    Wind,
    "5-4-3-2-1 Grounding & Breath Reset",
    "Hormonal transitions can trigger extra adrenaline and make your thoughts race.",
    "Look around and name 5 things you see, 4 things you can touch, 3 sounds you hear, 2 scents, and take 1 long, slow exhale. Avoid coffee on an empty stomach.",
    "5-4-3-2-1 Grounding • Slow Exhales • Magnesium Glycinate",
  ],

  Irritable: [
    Wind,
    "Lowering Noise & Taking Solo Space",
    "When progesterone drops before your Moonday, your brain has less of its natural calming chemical (GABA), making small annoyances feel huge.",
    "Step into a quiet room alone for 15 minutes, dim the lights, unclench your jaw, and let everyone know you are taking a quiet evening.",
    "15 Mins Solo Quiet • Unclench Jaw • Vitamin B6 & Magnesium",
  ],

  Hyperactive: [
    Activity,
    "Channeling High Energy into Movement",
    "Peak estrogen around ovulation or a burst of adrenaline can leave you feeling wired and full of restless energy.",
    "Channel that spark into a brisk 20-minute walk, a dance session, or a focused creative project, then ground yourself with a protein meal.",
    "Brisk Walk or Dance • Creative Sprint • Grounding Protein Meal",
  ],

  Tired: [
    Moon,
    "15-Minute Eyes-Closed Recharge",
    "Your body uses extra cellular energy during menstruation and the luteal phase, leaving your battery lower than usual.",
    "Lie down and close your eyes for 15 minutes without looking at your phone—even resting awake recharges your brain's energy.",
    "15-Min Phone-Free Rest • Iron & Hydration Check",
  ],

  Emotional: [
    Heart,
    "Honoring Your Heightened Heart",
    "Hormonal waves bring your feelings and empathy close to the surface during cycle transitions.",
    "Be selective with what you watch and who you spend time with today—skip sad news and stay in gentle, supportive spaces.",
    "Skip Stressful Media • Warm Rose or Chamomile Tea • Journal",
  ],

  Crying: [
    Droplet,
    "Post-Cry Cooling & Rehydration",
    "Crying is a healthy biological release that flushes stress hormones out of your system.",
    "After crying, splash cool water on your face, rest a cool cloth over your eyes for 5 minutes to prevent puffiness, and drink a full glass of water.",
    "Cool Cloth on Eyes • Tall Glass of Water • Gentle Rest",
  ],

  Peaceful: [
    Wind,
    "Soaking in Nervous-System Stillness",
    "Your stress hormones are low and your body feels safe and settled.",
    "Take three slow breaths and enjoy moving through your day without rushing.",
    "Unhurried Pace • Nature or Sunlight • Gratitude Note",
  ],

  Content: [
    Heart,
    "Anchoring Simple Daily Sufficiency",
    "Steady blood sugar and balanced hormones create a warm sense of 'enoughness.'",
    "Pause for 30 seconds to notice three simple comforts around you right now—a comfy chair, a warm drink, or quiet light.",
    "30-Second Comfort Pause • Balanced Meals",
  ],

  Excited: [
    Star,
    "Riding Your Follicular & Ovulatory Spark",
    "Rising estrogen boosts dopamine—the brain chemical of anticipation, excitement, and fresh ideas.",
    "Pour this momentum into planning something you love, while remembering to eat regular protein meals so you don't burn out.",
    "Creative Planning • Protein-Rich Meals • Extra Water",
  ],

  Affectionate: [
    Heart,
    "Oxytocin Connection & Warmth",
    "Estrogen naturally increases oxytocin (the bonding hormone), making you crave closeness and warmth.",
    "Share a 20-second hug with your partner or a loved one, cuddle a pet, or write a sweet note in your Partner Notes.",
    "20-Second Hug • Partner Note • Heartfelt Connection",
  ],

  Playful: [
    Smile,
    "Making Space for Lightness & Fun",
    "When stress hormones are low and dopamine is flowing, your brain naturally wants play and humor.",
    "Put on upbeat music, joke around, and give yourself a break from taking everything so seriously.",
    "Upbeat Playlist • Playful Break • Creative Hobby",
  ],

  Lonely: [
    Heart,
    "Warmth & Low-Pressure Connection",
    "Hormonal dips can make you feel disconnected or wish for extra closeness and reassurance.",
    "Send a simple voice note to a trusted friend, or take a warm bath with a hot drink (physical warmth actually soothes social loneliness in the brain!).",
    "Warm Bath or Tea • Low-Pressure Voice Note • Cozy Blanket",
  ],
  
  Overwhelmed: [
    Wind,
    "One-Thing Triage & Deep Exhale",
    "When too many demands hit during a low-energy cycle phase, your brain's stress switch flips into overload.",
    "Stop multitasking for 10 minutes. Pick the single most important thing that needs to happen today and let the rest wait until tomorrow.",
    "Pick Only 1 Task Today • 4-7-8 Breath Pacer • Paper Brain-Dump",
  ],

  Stressed: [
    Wind,
    "Lowering Cortisol with the Physiological Sigh",
    "High cortisol tightens your shoulders, speeds up your heart, and makes your breathing shallow.",
    "Take two quick inhales through your nose followed by one long, slow exhale through your mouth (repeat 3 times), shake out your hands, and drink water.",
    "3 Physiological Sighs • Shake Out Shoulders • Magnesium & Vitamin C",
  ],

  Angry: [
    Activity,
    "Moving Adrenaline Out of Your Body",
    "Anger releases a wave of adrenaline meant for physical action—often pointing to a boundary that was crossed.",
    "Move the physical energy out first with a brisk 15-minute walk or an unfiltered 'Unsent Letter' in your journal, then decide what boundary you need.",
    "Brisk 15-Min Walk • Unsent Letter in Journal • Boundary Check",
  ],

  Frustrated: [
    Wind,
    "10-Minute Change of Scenery",
    "When you hit a wall on a task, staying glued to the screen only builds more tension.",
    "Step away for 10 minutes, walk into a different room or outside, drink a glass of cold water, and come back fresh.",
    "10-Min Room Change • Cold Glass of Water • Deep Exhale",
  ],

  Restless: [
    Activity,
    "Stretching Out Fidgety Energy",
    "Sitting still when your nervous system has pent-up energy makes your legs and mind feel antsy.",
    "Do 10 minutes of stretching, legs-up-the-wall, or a quick walk around the block to help your body settle.",
    "10-Min Stretch or Walk • Legs-Up-The-Wall • Magnesium",
  ],

  Sensitive: [
    Heart,
    "Soft Boundaries for a Tender Day",
    "In the days before and during your Moonday, your nervous system takes in sights, sounds, and emotions much more deeply.",
    "Treat your sensitivity as a signal to slow down—wear soft clothes, keep your evening quiet, and say 'I need an early night tonight.'",
    "Soft Comfortable Clothes • Quiet Evening • Gentle Boundaries",
  ],

  Tearful: [
    Heart,
    "Extra Patience & Cozy Comfort",
    "Hormonal shifts bring tears close to the surface even when nothing major is wrong.",
    "Keep tissues and warm tea close, cut your to-do list in half, and speak to yourself with warmth.",
    "Cut To-Do List in Half • Warm Chamomile Tea • Cozy Rest",
  ],

  Hopeful: [
    Sun,
    "Planting Seeds for Your Next Chapter",
    "As estrogen rises after your Moonday, optimism and forward-looking energy naturally return.",
    "Open your Journal Studio and write down one goal or ritual you are excited to build this month.",
    "Journal Goal Setting • Fresh Follicular Planning",
  ],
  
  Motivated: [
    CheckSquare,
    "Using Your Peak Focus Window",
    "High estrogen and dopamine around mid-cycle give you extra mental drive and stamina.",
    "Tackle your most important study, coding, or work project today while your natural motivation is flowing.",
    "Focused Deep-Work Block • Protein Meal • Hydration",
  ],

  Unmotivated: [
    Moon,
    "The 2-Minute Rule (or Guilt-Free Rest)",
    "Low hormone days during your Moonday or late luteal phase naturally dial down your brain's go-go-go drive.",
    "Try the 2-Minute Rule: tell yourself you only have to do 2 minutes of an easy task—or simply declare a guilt-free rest afternoon.",
    "2-Minute Micro-Start • Guilt-Free Rest Permission",
  ],

  Insecure: [
    Heart,
    "Seeing Through the Pre-Moonday Inner Critic",
    "Luteal bloating and lower serotonin can temporarily trick your brain into being overly critical of your body or work.",
    "Wear an outfit that feels comfortable and flattering without pinching, and remind yourself that this self-doubt will lift in a few days.",
    "Comfortable Flattering Outfit • Inner-Critic Journal Reframe",
  ],

  Confident: [
    Star,
    "Owning Your Peak Ovulatory Radiance",
    "Peak estrogen around ovulation boosts verbal fluency, posture, and social confidence.",
    "This is your biological power window for interviews, presentations, important talks, or bold creative work.",
    "Schedule Big Talks/Interviews • Stay Hydrated",
  ],

  Numb: [
    Coffee,
    "Gentle Sensory Reconnection",
    "When you've been stressed or exhausted for too long, your nervous system hits the brakes by making you feel flat or numb.",
    "Reconnect with your senses gently: hold a warm mug in both hands, smell coffee or lavender oil, or take a warm shower.",
    "Warm Shower • Hold a Hot Mug • Soothing Scents",
  ],

  Disappointed: [
    Heart,
    "Acknowledging Letdowns with Kindness",
    "When something doesn't go as hoped, your brain experiences a sudden drop in dopamine.",
    "Let yourself feel disappointed without brushing it off, then plan one small, comforting treat for yourself tonight.",
    "Honest Journaling • Small Evening Comfort Treat",
  ],

  Grateful: [
    Heart,
    "Locking In Appreciation",
    "Feeling grateful calms your heart rate and strengthens the emotional resilience centers of your brain.",
    "Use the Gratitude Trio template in your journal or send a quick thank-you text to someone you appreciate.",
    "Gratitude Trio Template • Send a Thank-You Text",
  ],

  Relaxed: [
    Moon,
    "Moving at an Unrushed Tempo",
    "When your body is relaxed, digestion, hormone balance, and cellular repair all work at their best.",
    "Keep your evening unhurried so your body stays in this restorative rest-and-digest state.",
    "Unrushed Evening • Warm Herbal Infusion",
  ],

  Bored: [
    Sun,
    "Sparking Fresh Curiosity",
    "Boredom is simply your brain's dopamine system asking for a little novelty or change of pace.",
    "Switch up your routine—work from a different spot, put on a new playlist, try a new recipe, or take a different walk route.",
    "Change Your Scenery • New Playlist or Recipe • Short Walk",
  ],

  Joyful: [
    Sun,
    "Celebrating Feeling Good in Your Skin",
    "High endorphins and serotonin make everything feel lighter and brighter today.",
    "Put on your favorite music, move your body, and soak in feeling great.",
    "Favorite Music • Dance or Outdoor Walk • Memory Log",
  ],

  Proud: [
    Star,
    "Recording Your Quiet Victories",
    "Pausing to recognize your own hard work builds lasting confidence.",
    "Write this win down in your journal's Quiet Victories template so you always have proof of how capable you are.",
    "Quiet Victories Journal Template • Celebrate Your Effort",
  ],

  Inspired: [
    Star,
    "Capturing Creative Sparks Right Away",
    "Your brain's creative networks are firing and connecting ideas effortlessly right now.",
    "Open your Journal Studio and jot down or voice-dictate your ideas immediately before they slip away.",
    "Voice-Dictate or Write Ideas Now • Creative Flow Timer",
  ],

  Curious: [
    Sun,
    "Following Your Follicular Learning Spark",
    "Rising estrogen in the first half of your cycle boosts memory and makes learning new skills feel exciting.",
    "Dive into a study topic, book, or project that fascinates you while your brain absorbs information so easily.",
    "Deep Study Session • Brain-Fueling Omega-3s",
  ],

  Homesick: [
    Coffee,
    "Familiar Flavors & Voice Connection",
    "Missing home or familiar comfort is a natural signal that your heart wants safety and belonging.",
    "Cook a favorite childhood meal or warm drink, call someone from home, and wrap up in a cozy blanket.",
    "Familiar Comfort Meal • Call a Loved One",
  ],

  Rejected: [
    Heart,
    "Soothing Social Hurt with Physical Warmth",
    "Brain scans show that feeling left out or rejected activates the exact same pain centers as a physical bruise.",
    "Soothe yourself physically with a warm bath or heating pad, remind yourself of your worth, and talk to someone who truly cherishes you.",
    "Warm Bath or Heating Pad • Reach Out to a Safe Friend",
  ],

  Panicky: [
    Droplet,
    "The Cold-Water Face Reflex to Slow Your Heart",
    "Panic is a sudden rush of adrenaline and fast breathing that makes your heart race.",
    "Hold a cold, wet washcloth over your eyes and cheekbones for 30 seconds while breathing out slowly through pursed lips—this triggers a natural reflex that immediately slows your heart rate.",
    "Cold Wet Cloth on Face • Slow Pursed-Lip Exhales",
  ],

  Tense: [
    Activity,
    "5-Second Squeeze-and-Release Relaxation",
    "Stress makes you hold tight tension in your shoulders, jaw, and hands without realizing it.",
    "Breathe in and squeeze your shoulders, fists, and toes tight for 5 seconds, then breathe out completely and let your muscles drop limp.",
    "Squeeze-and-Release Exercise • Magnesium • Warm Shower",
  ],

  Annoyed: [
    Wind,
    "Protein Snack & 5-Minute Solo Breather",
    "Low blood sugar ('hangry') plus pre-Moonday hormone shifts make minor annoyances feel ten times worse.",
    "Have a quick protein snack, put on headphones, and step away from everyone for 5 quiet minutes.",
    "Quick Protein Snack • Headphones & 5-Min Breather",
  ],

  Resentful: [
    Heart,
    "Checking Where You Over-Gave",
    "Resentment is almost always a helpful signal that you said 'yes' to others when your own battery needed a 'no.'",
    "Ask yourself what boundary needs to be reset, and reclaim one full hour just for yourself tonight.",
    "Reclaim 1 Hour for Yourself • Practice Saying a Gentle 'No'",
  ],

  Impatient: [
    Wind,
    "Slowing Your Movements by 20%",
    "When adrenaline is high, everything around you feels like it is moving too slowly.",
    "Deliberately walk, type, and breathe 20% slower for the next 10 minutes—slowing your body tells your brain there is no emergency.",
    "Slow Your Pace by 20% • Long Nasal Exhales",
  ],

  Indecisive: [
    CheckSquare,
    "Cutting Out Decision Fatigue",
    "Making too many small choices all day drains the decision-making part of your brain.",
    "Pick your easiest go-to meal and outfit today, and use the Head, Heart & Gut template in your journal for any bigger choice.",
    "Go-To Default Meal & Outfit • Head-Heart-Gut Journal",
  ],
  Distracted: [
    CheckSquare,
    "Phone in Another Room & 15-Minute Timer",
    "Jumping between notifications and open tabs scatters your attention and drains mental energy.",
    "Put your phone in another room, switch on Zen Mode in your Journal Studio, and set a 15-minute timer for just one task.",
    "Phone in Another Room • 15-Min Custom Timer • Zen Mode",
  ],

  Forgetful: [
    CheckSquare,
    "Writing It Down Immediately",
    "When hormones fluctuate, your brain focuses more on emotional processing than memorizing small details.",
    "Write reminders and checklists down the second you think of them, and laugh it off gently.",
    "Immediate Written Checklists • B-Vitamins & Choline",
  ],

  Drained: [
    Moon,
    "Protecting Your Evening Recharge",
    "Your physical and social battery is on empty after giving energy all day.",
    "Cancel optional evening plans, dim the lights, eat a nourishing meal, and enjoy a quiet night in.",
    "Cancel Optional Plans • Quiet Night In • Warm Meal",
  ],

  Exhausted: [
    Moon,
    "Full Permission to Stop Early",
    "Deep physical exhaustion means your body needs horizontal rest and sleep above everything else.",
    "Leave the dishes and chores for tomorrow, get into pajamas early, and aim for 8–9 hours in bed tonight.",
    "Leave Chores for Tomorrow • Early Pajamas & Bedtime",
  ],
  
  Guilty: [
    Heart,
    "Letting Go of Productivity Guilt",
    "Women are often taught to feel guilty whenever they rest or slow down, even though female hormones are biological cycles, not machines.",
    "Remind yourself that resting during low-energy cycle days is smart health care, not laziness.",
    "Self-Forgiveness Journal Template • Guilt-Free Rest",
  ],

  Embarrassed: [
    Heart,
    "Remembering the Spotlight Effect",
    "An awkward moment triggers a quick rush of self-conscious adrenaline.",
    "Take three slow breaths and remember psychologists' 'spotlight effect'—other people notice less than 10% of what we replay in our heads.",
    "3 Slow Breaths • Kind Self-Talk • Warm Smile",
  ],

  Vulnerable: [
    Heart,
    "Staying in Safe, Gentle Company",
    "Some days of your cycle leave your heart feeling open and tender.",
    "Spend time only around people who make you feel safe and understood today, and pour your thoughts into your private journal.",
    "Safe Supportive Company • Private Encrypted Journal",
  ],

  Frisky: [
    Heart,
    "Enjoying Your Mid-Cycle Desire Peak",
    "Peak estrogen and a natural wave of testosterone around ovulation boost libido and blood flow.",
    "Enjoy solo pleasure, playful flirting, or intimate connection with your partner.",
    "Playful Intimacy • Solo or Partner Connection",
  ],

  Flirty: [
    Smile,
    "Leaning Into Your Inner-Summer Glow",
    "Ovulatory hormones naturally boost confidence, facial glow, and social warmth.",
    "Wear something that makes you feel radiant and send a playful message to your partner.",
    "Wear Your Favorite Outfit • Send a Playful Note",
  ],

  Sensual: [
    Heart,
    "Slow Sensory & Tactile Comfort",
    "Your skin and senses are extra receptive to pleasant touch, scent, and warmth today.",
    "Indulge your senses—warm body oil after a shower, soft fabrics, slow music, and unhurried touch.",
    "Warm Body Oil • Soft Fabrics • Slow Music",
  ],

  Optimistic: [
    Sun,
    "Mapping Out What Excites You",
    "Rising follicular estrogen makes the future look bright and full of possibility.",
    "Use this bright mindset to plan your next month's goals or a project you're excited about.",
    "Monthly Chapter Journal Template • Creative Planning",
  ],

  Pessimistic: [
    Wind,
    "Recognizing the Pre-Moonday Gray Lens",
    "When estrogen and serotonin dip in the late luteal phase, your brain temporarily puts a gray filter over your life.",
    "Remind yourself: 'This bleak feeling is temporary hormonal weather.' Wait until Day 4 of your next cycle before judging your life or progress.",
    "Wait 4 Days Before Big Verdicts • CBT Reframe Template",
  ],

  Apathetic: [
    Coffee,
    "Simple Mechanical Basics Without Pressure",
    "When dopamine is temporarily low, trying to force yourself to feel excited only causes frustration.",
    "Just check off the simple basics—drink a glass of water, eat a warm meal, and sit near a window—until your natural spark returns.",
    "Water + Warm Meal + Daylight • Zero Pressure",
  ],

  Nostalgic: [
    Heart,
    "Savoring Sweet Memories",
    "Reflective cycle phases often bring warm memories from the past to the surface.",
    "Look through favorite photos or write about a cherished memory in your journal while sipping a warm drink.",
    "Memory Capsule Journal • Warm Cup of Tea",
  ],

};

// ============================================================================
// 3. FLOW & DISCHARGE & CRAVINGS CORE SEEDS 
// ============================================================================

const FLOW_SEEDS: Record<string, CompactCareSeed> = {
  "Very heavy": [
    Droplet,
    "Heavy Flow Iron & Fluid Replenishment",
    "Shedding a thick uterine lining quickly can deplete your body's iron stores (ferritin) and fluid volume, leaving you tired or dizzy.",
    "Eat iron-rich foods (lentils, spinach, eggs, or red meat) paired with vitamin C (lemon or fruit) to double iron absorption, drink electrolyte water, and change protection every 2–3 hours.",
    "Iron + Vitamin C • Electrolyte Water • Red Raspberry Leaf Tea",
  ],

  Heavy: [
    Droplet,
    "Iron Nourishment & Extra Rest Intervals",
    "Days 1–2 of a heavy bleed draw on your iron reserves and pelvic energy.",
    "Keep extra pads, tampons, or Moonday underwear handy, drink 2+ liters of water and herbal tea, and take sitting or lying breaks whenever you can.",
    "Iron-Rich Meals • 2L Hydration • Horizontal Rest Breaks",
  ],

  Medium: [
    Droplet,
    "Steady Menstrual Comfort & Warmth",
    "Your uterus is shedding its lining at a healthy, steady pace with moderate prostaglandin activity.",
    "Keep a warm mug of ginger or chamomile tea nearby, use comfortable protection, and move at a gentle, unhurried pace today.",
    "Warm Ginger or Chamomile Tea • Magnesium • Gentle Pace",
  ],

  Low: [
    Droplet,
    "Light Flow & Uterine Lining Renewal",
    "As bleeding tapers off, rising estrogen begins rebuilding a fresh, healthy lining inside your uterus.",
    "Light organic cotton pads, liners, or Moonday underwear work great today while your energy gradually starts to return.",
    "Organic Cotton Liner / Moonday Underwear • Clean Protein & Water",
  ],

  Spotting: [
    Droplet,
    "Light Spotting Observation & Care",
    "A tiny drop of blood mixed with mucus often happens right around ovulation (when estrogen briefly dips) or 1–2 days before/after your Moonday.",
    "Wear a breathable cotton liner and log the day in MoonDay so you can see whether it lines up with ovulation or your Moonday start.",
    "Breathable Cotton Liner • Vitamin C • Log in MoonDay Calendar",
  ],

  "No bleeding": [
    Sun,
    "Bleed-Free Phase Nourishment",
    "You are in your non-bleeding follicular, ovulatory, or luteal days.",
    "Match your food, movement, and rest to your current cycle phase shown at the top of your dashboard.",
    "Phase-Synced Meals • Daily Water Goal",
  ],
};


const DISCHARGE_SEEDS: Record<string, CompactCareSeed> = {
  "No discharge": [
    Sun,
    "Natural Dry-Phase Comfort",
    "Right after your Moonday finishes or just before your next Moonday starts, estrogen is lower, so your cervix produces very little fluid.",
    "Dry days are a completely normal part of your cycle—simply wear breathable 100% cotton underwear and stay hydrated.",
    "100% Cotton Underwear • Daily Water • Healthy Fats",
  ],
  
  Creamy: [
    Droplet,
    "Healthy Progesterone Lotion-Like Fluid",
    "After ovulation, rising progesterone makes cervical fluid thicker, smooth, and creamy (like hand lotion) to protect your uterus.",
    "Creamy white or off-white discharge is a healthy, normal sign of your luteal phase or early follicular days.",
    "Breathable Cotton • Normal Healthy Cycle Sign",
  ],

  Watery: [
    Droplet,
    "Rising Estrogen & Approaching Fertile Window",
    "As estrogen climbs in the first half of your cycle, cervical fluid becomes clearer and more watery.",
    "This is a healthy sign that you are entering your fertile window; wear a breathable cotton liner if you want to feel dry.",
    "Approaching Fertile Window • Extra Hydration",
  ],

  "Yellow-Bright": [
    ShieldAlert,
    "Air-Tint vs. Irritation Watch",
    "Normal discharge often turns pale yellow when it dries on underwear, but bright yellow fluid with itching or odor can signal an infection.",
    "Rinse externally with plain water only, wear loose cotton underwear, and check in with a doctor if you notice any itching, burning, or odor.",
    "Plain Water Rinse • Loose Cotton • Doctor Check if Itchy",
  ],

  Sticky: [
    Droplet,
    "Normal Non-Fertile Cycle Fluid",
    "When estrogen is low compared to progesterone, cervical fluid feels tacky or sticky.",
    "This is a normal observation on non-fertile days—keep drinking your daily water and wearing breathable fabrics.",
    "Daily Water Intake • Breathable Cotton",
  ],

  "Egg-white-like": [
    Star,
    "Peak Fertility & Ovulation Biomarker",
    "Peak estrogen right before ovulation makes cervical fluid clear, slippery, and stretchy (just like raw egg whites) to nourish and guide sperm.",
    "This is the #1 natural sign that your body is gearing up to ovulate within the next 24–48 hours!",
    "Peak Fertility Window • Extra Electrolyte Water",
  ],
  
  Spotting: [
    Droplet,
    "Pink or Brown-Tinged Cycle Transition",
    "A small amount of blood mixing with cervical fluid is common during the hormone shift of ovulation or right before/after your Moonday.",
    "Use a breathable cotton pantyliner and check your cycle day on the calendar.",
    "Breathable Cotton Liner • Cycle Calendar Check",
  ],

  Unusual: [
    ShieldAlert,
    "pH Balance & Doctor Check",
    "Whenever discharge looks, smells, or feels very different from your normal cycle pattern, your vaginal pH (normally 3.8–4.5) may be off.",
    "Skip scented soaps, tight synthetic leggings, and douching, and book a quick, easy swab with a gynecologist.",
    "No Scented Soaps • Women's Probiotic • Doctor Swab",
  ],

  "Clumpy white": [
    ShieldAlert,
    "Soothing Yeast & Flora Imbalance",
    "Thick, clumpy white discharge (like cottage cheese)—especially with itching—usually points to a common yeast overgrowth.",
    "Wear loose cotton underwear, cut back on sugary snacks, rinse with plain water, and ask a doctor or pharmacist for an easy antifungal treatment.",
    "Loose Cotton • Women's Probiotic • Pharmacist/Doctor Care",
  ],

  Gray: [
    ShieldAlert,
    "Bacterial Balance (BV) Check",
    "Thin, grayish discharge (often with a stronger odor) usually means vaginal pH has risen and common bacteria (BV) need rebalancing.",
    "Schedule a quick swab with your doctor for targeted treatment, and never use internal soaps or douches.",
    "Quick Doctor Swab • Plain External Water Rinse",
  ],

  Milky: [
    Droplet,
    "Healthy Natural Self-Cleaning Fluid",
    "Beneficial vaginal bacteria (lactobacilli) naturally keep the vagina clean and acidic, producing a smooth, milky fluid.",
    "This is a sign of a healthy, self-cleaning body—no special washes needed!",
    "Healthy Vaginal Flora • Probiotic Yogurt/Foods",
  ],

  Clumpy: [
    ShieldAlert,
    "Breathable Care & Symptom Watch",
    "Slightly thicker, clumpy fluid can happen from normal cell shedding or a mild yeast shift before your Moonday.",
    "Keep the area cool and dry with cotton underwear, and see a provider if you feel any itching or soreness.",
    "Airy Cotton Underwear • Watch for Itching",
  ],

  "Quick-drying": [
    Droplet,
    "Low-Moisture Non-Fertile Fluid",
    "Outside your fertile window, cervical fluid contains less water and dries quickly on fabric.",
    "Completely normal baseline observation; keep sipping water throughout the day.",
    "Steady Daily Water • Healthy Omega-3 Fats",
  ],

  Thick: [
    Droplet,
    "Luteal Progesterone Protective Mucus",
    "In the luteal phase, progesterone thickens cervical mucus to form a natural protective seal for your uterus.",
    "A healthy sign that ovulation has already happened and you are in the second half of your cycle.",
    "Normal Luteal Phase Sign • Stay Hydrated",
  ],

  "Lotion-like": [
    Droplet,
    "Smooth Mid-to-Late Cycle Fluid",
    "A blend of estrogen and progesterone creates a smooth, lotion-like texture.",
    "Healthy everyday cycle fluid—simply wear comfortable, breathable underwear.",
    "Comfortable Cotton Underwear • Balanced Hydration",
  ],

  Clear: [
    Star,
    "High-Estrogen Hydrated Fluid",
    "Rising estrogen draws water into your cervical fluid, turning it crystal clear.",
    "Indicates healthy estrogen levels and an active fertile window.",
    "Fertile Window Sign • Electrolyte Hydration",
  ],

  Cloudy: [
    Droplet,
    "Normal Everyday Cycle Fluid",
    "Cloudy white or translucent fluid is simply a natural mix of cervical mucus and healthy vaginal cells.",
    "Standard, healthy observation across non-peak cycle days.",
    "Plain Water External Rinse • Cotton Underwear",
  ],

  Yellowish: [
    ShieldAlert,
    "Natural Air-Drying vs. Irritation Check",
    "Normal white discharge often turns pale yellowish when exposed to air on underwear.",
    "If there is no itching, burning, or strong odor, it is usually completely normal; otherwise, check in with a doctor.",
    "Breathable Liners • Check for Any Itching",
  ],

  Brownish: [
    Droplet,
    "Clearing Older Moonday Blood",
    "Brown discharge is simply older blood that took a little longer to leave the uterus—iron turns brown when exposed to oxygen.",
    "Very common on the first or last 1–2 days of your Moonday; sip warm ginger tea to help your uterus finish clearing.",
    "Warm Ginger or Raspberry Leaf Tea • Cotton Liner",
  ],

  Pinkish: [
    Droplet,
    "Trace Fresh Blood Mixed with Fluid",
    "A tiny drop of fresh blood mixed with clear or creamy fluid turns it light pink—common at ovulation or right as your Moonday starts.",
    "Log it in MoonDay to see if your Moonday begins tomorrow or if you are mid-cycle.",
    "Log in MoonDay • Keep a Liner Handy",
  ],

  "Blood-tinged": [
    Droplet,
    "Cycle Transition Spotting Care",
    "Small streaks of blood appear when hormones shift quickly at ovulation or right before full menstrual flow begins.",
    "Wear a breathable liner and note any mild cramping in your log.",
    "Breathable Liner • Warm Herbal Tea",
  ],

  "Jelly-like": [
    Droplet,
    "Thick Cervical Mucus Release",
    "Hormone transitions can release a thicker, jelly-like piece of cervical mucus.",
    "Harmless and natural—drinking plenty of water keeps cervical fluid well-hydrated.",
    "2L Daily Water • Omega-3 Healthy Fats",
  ],

  Stretchy: [
    Star,
    "Fertile Window Stretchy Fluid",
    "When fluid stretches between your fingers without breaking, estrogen is at its peak and ovulation is very close.",
    "Great indicator of healthy ovarian function and peak fertility.",
    "Peak Ovulation Window • Extra Hydration",
  ],

  Dry: [
    Droplet,
    "External Moisture & Gentle Care",
    "Low-estrogen days right after your Moonday can make external skin feel dry.",
    "Drink extra water, avoid soap on delicate skin, and apply a tiny drop of pure jojoba oil or pH-balanced moisturizer externally.",
    "External Jojoba / Hyaluronic Balm • Extra Water",
  ],
};

const CRAVING_SEEDS: Record<string, CompactCareSeed> = {
  Sweet: [
    Coffee,
    "Balancing Pre-Moonday Sugar Cravings",
    "Before your Moonday, serotonin (your happy brain chemical) dips and your cells become slightly less sensitive to insulin, making your brain beg for quick sugar.",
    "Enjoy something sweet right after a protein-rich meal—or pair dark chocolate and fruit with Greek yogurt or nuts—so your blood sugar stays steady without crashing.",
    "Pair Sweets with Protein • Dark Chocolate + Nuts",
  ],

  Chocolate: [
    Heart,
    "Your Body's Signal for Magnesium",
    "Cocoa is one of nature's richest sources of magnesium—a mineral your uterus and nervous system use up rapidly before and during your Moonday.",
    "Reach for 70%–85% dark chocolate paired with almonds or berries to satisfy the craving while relaxing cramping muscles.",
    "70%+ Dark Chocolate • Magnesium Bisglycinate (300 mg)",
  ],

  Salty: [
    Droplet,
    "Replenishing Minerals & Electrolytes",
    "Progesterone changes how your kidneys handle salt and water, often sparking a craving for salty snacks.",
    "Choose mineral-rich whole foods—like lightly salted nuts, olives, popcorn, or warm miso soup—alongside a big glass of water.",
    "Lightly Salted Nuts or Olives • Plenty of Water",
  ],

  Spicy: [
    Flame,
    "Natural Endorphin & Mood Boost",
    "Spicy foods trigger a harmless warmth signal on your tongue that causes your brain to release feel-good endorphins.",
    "Enjoy your favorite spicy meal at lunch or early dinner (avoid late-night spice if pre-Moonday hormones give you heartburn).",
    "Enjoy at Lunch/Early Dinner • Pair with Cooling Yogurt",
  ],

  Sour: [
    Sun,
    "Vitamin C & Digestive Refreshment",
    "Craving sour or tangy foods often points to a need for vitamin C (which supports progesterone and iron absorption) or a sluggish stomach.",
    "Squeeze fresh lemon or lime into your water, snack on berries or kiwi, and add a splash of apple cider vinegar or lemon to salads.",
    "Fresh Lemon/Lime Water • Tart Berries & Kiwi",
  ],

  "Crunchy snacks": [
    Activity,
    "Releasing Jaw Tension Through Crunch",
    "Chewing crunchy foods physically releases stress and tension held in your jaw muscles!",
    "Satisfy the crunch with roasted chickpeas, apple slices with peanut butter, carrots and hummus, or air-popped popcorn.",
    "Roasted Chickpeas • Apples & Nut Butter • Carrots & Hummus",
  ],

  "Savory snacks": [
    Coffee,
    "Protein & Amino Acid Fueling",
    "A savory, umami craving is your body's natural way of asking for protein and minerals to rebuild tissues.",
    "Snack on eggs, avocado toast, edamame, warm broth, cheese, or seeded crackers with hummus.",
    "Eggs or Edamame • Warm Broth • Hummus & Crackers",
  ],

  Dairy: [
    Heart,
    "Calcium Comfort for PMS Relief",
    "Studies show that calcium levels dip slightly before your Moonday, and getting enough calcium noticeably reduces PMS mood swings and cramps.",
    "Enjoy Greek yogurt, kefir, paneer, cheese, or calcium-rich tahini and sesame seeds.",
    "Greek Yogurt or Kefir • Calcium + Vitamin D3",
  ],

  Beverages: [
    Droplet,
    "Botanical Hydration & Refreshment",
    "Hormonal shifts change your thirst signals and fluid needs across the month.",
    "Make a special drink: iced hibiscus tea with berries, sparkling water with lime, or a warm spiced oat-milk latte.",
    "Iced Hibiscus Tea • Sparkling Lime Water",
  ],

  "Energy drinks": [
    Moon,
    "Protecting Your Cycle from Caffeine Crashes",
    "Craving an energy drink means your cellular battery is running on empty—but high doses of synthetic caffeine narrow blood vessels and worsen cramps and anxiety.",
    "Swap energy drinks for a smooth ceremonial matcha (which has calming L-theanine), B-vitamins, a glass of water, and a 15-minute rest.",
    "Swap for Matcha + L-Theanine • 15-Min Rest • B-Vitamins",
  ],

  "Caffeinated drinks": [
    Coffee,
    "Having Coffee After Breakfast (Never on Empty)",
    "Drinking coffee on an empty stomach spikes stress hormones (cortisol) and causes a mid-afternoon blood-sugar crash.",
    "Eat a breakfast with protein and healthy fat first, then enjoy your coffee or tea alongside a full glass of water.",
    "Eat Breakfast First • 1 Glass Water per Coffee",
  ],

  "indulgent desserts": [
    Heart,
    "Mindful, Guilt-Free Dessert Enjoyment",
    "Lower estrogen and serotonin before your Moonday naturally make rich, sweet treats extra comforting.",
    "Put a portion on a pretty plate, sit down after a protein-rich dinner, and savor every bite with zero guilt.",
    "Enjoy After Dinner • Zero Food Guilt • 10-Min Walk",
  ],

  "warm soups": [
    Flame,
    "Internal Warmth & Easy Digestion",
    "During your Moonday, warm liquids act like an internal heating pad for your belly and are super easy to digest.",
    "Enjoy a warm bowl of lentil soup, tomato soup, chicken/veggie broth, or squash soup seasoned with ginger and turmeric.",
    "Warm Lentil or Veggie Soup • Ginger & Turmeric",
  ],

  "light salads": [
    Sun,
    "Fresh Follicular Greens & Hormone Balance",
    "As estrogen rises in the first half of your cycle, fresh greens and fiber help your liver keep hormones in healthy balance.",
    "Toss leafy greens with olive oil, lemon, pumpkin seeds, avocado, and a good source of protein.",
    "Leafy Greens + Olive Oil • Pumpkin Seeds & Protein",
  ],

  "rich sauces": [
    Coffee,
    "Healthy Fats for Hormone Production",
    "Your body uses healthy fats and cholesterol as the raw building blocks to make estrogen and progesterone.",
    "Enjoy nourishing fats like olive oil, tahini dressings, pesto, avocado, coconut milk curries, or a pat of grass-fed butter/ghee.",
    "Olive Oil, Tahini & Avocado • Healthy Fats",
  ],

  "baked goods": [
    Heart,
    "Carbs That Help Build Serotonin",
    "Carbohydrates help the amino acid tryptophan enter your brain to make mood-lifting serotonin.",
    "Enjoy warm sourdough, oat muffins, or pastries paired with Greek yogurt, eggs, or nut butter to keep your energy smooth.",
    "Pair with Greek Yogurt or Nut Butter • Sourdough / Oats",
  ],

  Savory: [
    Coffee,
    "Iron & Protein Building Blocks",
    "Craving savory flavors is a classic sign your body wants protein and iron.",
    "Have a warm, savory meal like dal, roasted chicken/fish, tofu stir-fry, or eggs with sautéed greens.",
    "Warm Protein-Rich Meal • Iron + Greens",
  ],

  "Fast food": [
    Heart,
    "Zero-Guilt Convenience & Hydration Balance",
    "When you are exhausted and hungry in the luteal phase, your brain wants fast, salty, high-calorie food immediately.",
    "If you're too tired to cook, fed is best! Pick an option with protein, and drink a big glass of water to balance out the extra salt.",
    "Pick a Protein Option • Extra Glass of Water • Zero Guilt",
  ],

  "Comfort food": [
    Heart,
    "Warm Starches That Calm the Nervous System",
    "Warm, familiar comfort meals activate calming vagus-nerve signals from your gut to your brain.",
    "Make a cozy bowl of mashed sweet potatoes, khichdi, mac and cheese, or warm oatmeal and enjoy it in a calm setting.",
    "Cozy Homemade Bowl • Eat Warm & Unrushed",
  ],

  Fruit: [
    Sun,
    "Natural Hydration, Fiber & Vitamin C",
    "Fresh fruit delivers natural glucose, antioxidants, and vitamin C that support healthy progesterone levels.",
    "Enjoy a generous bowl of berries, apple slices, pomegranate, mango, or citrus with a handful of nuts or seeds.",
    "Fresh Berries & Citrus • Pair with Nuts/Seeds",
  ],

  "Cold drinks": [
    Droplet,
    "Cooling Hydration for Warm Luteal Days",
    "Because progesterone raises your body temperature by ~0.4°C after ovulation, cold drinks feel extra refreshing.",
    "Enjoy chilled water with lemon, iced herbal tea, or coconut water (sip slowly if you have active Moonday cramps).",
    "Chilled Lemon or Coconut Water • Iced Herbal Tea",
  ],

  "Hot drinks": [
    Coffee,
    "Soothing Smooth Muscle from the Inside",
    "Warm drinks relax the muscles of your digestive tract and help ease pelvic tension nearby.",
    "Keep a warm mug of ginger tea, peppermint tea, chamomile, or hot cocoa close by.",
    "Warm Herbal Tea or Cocoa • Soothing Belly Warmth",
  ],

  Tea: [
    Coffee,
    "Cycle-Supporting Herbal Infusions",
    "Different herbal teas support different days of your cycle while giving you a calm 5-minute pause.",
    "Try raspberry leaf or ginger during your Moonday, green tea or spearmint mid-cycle, and chamomile before sleep.",
    "Raspberry Leaf, Ginger, Spearmint, or Chamomile",
  ],

  Coffee: [
    Coffee,
    "Enjoying Coffee Without Jitters",
    "A morning cup of coffee boosts focus, though too much caffeine during your Moonday can tighten blood vessels and increase cramps.",
    "Enjoy 1 cup after breakfast with a full glass of water, or switch to half-caf or latte on crampy days.",
    "1 Cup After Breakfast • Full Glass of Water Alongside",
  ],

  Carbs: [
    Sun,
    "Slow-Burning Carbs for Luteal Energy",
    "Your body genuinely needs more complex carbohydrates in the week before your Moonday to fuel your higher metabolism and keep mood steady.",
    "Include oats, sweet potatoes, brown or basmati rice, quinoa, whole-grain bread, and potatoes in your meals without guilt.",
    "Sweet Potatoes, Oats & Rice • Vitamin B-Complex",
  ],

  "Ice cream": [
    Heart,
    "Cooling Calcium & Sweet Comfort",
    "Ice cream combines calcium, cooling temperature, and comforting fats.",
    "Scoop a portion into a bowl and enjoy it mindfully; if dairy makes you bloated, coconut- or cashew-milk ice cream is a delicious swap.",
    "Mindful Bowl Portion • Dairy-Free Option if Bloated",
  ],

  Pastries: [
    Coffee,
    "Cozy Bakery Treat with a Protein Buffer",
    "Flaky pastries give a quick burst of energy and comfort.",
    "Pair your pastry with a protein-rich latte, Greek yogurt, or a 10-minute walk afterward so your blood sugar stays smooth.",
    "Pair with Protein • 10-Minute Stroll Afterward",
  ],

  Cheese: [
    Heart,
    "Satisfying Fats, Calcium & Protein",
    "Cheese provides calcium, protein, and tyrosine (an amino acid that supports focus and mood).",
    "Enjoy a portion of cheese paired with apple or pear slices, grapes, walnuts, or whole-grain crackers.",
    "Pair Cheese with Fruit & Whole-Grain Crackers",
  ],

  Meat: [
    Flame,
    "Direct Signal for Absorbable Heme Iron",
    "Craving meat around your Moonday is a direct biological signal that your body wants iron and vitamin B12 to replenish red blood cells.",
    "Enjoy a well-cooked meal with poultry, fish, or red meat paired with vitamin-C-rich veggies or lemon dressing to boost iron uptake.",
    "Iron-Rich Meal + Lemon/Greens • Vitamin B12",
  ],

  "Fried food": [
    Coffee,
    "Crispy Comfort Oven-Roasted in Healthy Oils",
    "When energy is low, your brain craves crispy, savory, high-energy foods.",
    "Make crispy oven-baked or air-fried potato wedges, sweet potato fries, or crispy tofu/paneer using olive or avocado oil and sea salt.",
    "Oven/Air-Fried in Olive Oil • Peppermint Tea After",
  ],

  Vegetables: [
    Sun,
    "Fiber & Minerals for Hormone Balance",
    "Your gut and liver use plant fiber and minerals from vegetables to clear out used hormones smoothly.",
    "Enjoy roasted or lightly steamed vegetables drizzled with olive oil, sea salt, and lemon.",
    "Roasted or Steamed Veggies • Olive Oil Drizzle",
  ],

  Juice: [
    Droplet,
    "Quick Vitamin C & Natural Energy",
    "Craving juice often signals thirst plus a need for vitamin C and potassium.",
    "Try fresh-squeezed citrus, pomegranate, or beet-carrot-ginger juice—or mix fruit juice half-and-half with sparkling water.",
    "Fresh Citrus/Pomegranate • 1:1 Sparkling Water Mix",
  ],

  Water: [
    Droplet,
    "Deep Cellular Hydration",
    "Hormone changes and blood loss increase your cells' need for water and electrolytes.",
    "Add a squeeze of lemon and a tiny pinch of sea salt to your water so your body absorbs it deeply rather than passing it right through.",
    "Water + Squeeze of Lemon + Pinch of Sea Salt",
  ],

  Crunchy: [
    Activity,
    "Healthy Crunch & Fiber",
    "Crunchy textures help release stress stored in the jaw while giving you fiber and minerals.",
    "Snack on pumpkin seeds, almonds, sliced bell peppers, cucumbers, or seeded crackers.",
    "Pumpkin Seeds & Almonds • Crisp Veggies",
  ],

  Chewy: [
    Heart,
    "Mineral-Rich Chewy Treats",
    "Chewy textures provide lasting satisfaction and calm the nervous system.",
    "Try Medjool dates filled with almond or peanut butter and a tiny pinch of sea salt—packed with potassium, magnesium, and iron!",
    "Medjool Dates + Nut Butter + Pinch of Sea Salt",
  ],

  Breads: [
    Coffee,
    "Warm Sourdough & Whole-Grain Comfort",
    "Whole-grain and sourdough breads supply B-vitamins and steady energy for your brain.",
    "Toast a slice of sourdough or whole-grain bread and top with avocado, olive oil, eggs, or nut butter.",
    "Sourdough Toast + Avocado or Eggs",
  ],

  Pasta: [
    Flame,
    "Cozy Luteal Carb Fueling",
    "A warm bowl of pasta refills muscle energy stores and helps your brain produce calming serotonin.",
    "Cook pasta al dente and toss with olive oil, garlic, spinach or broccoli, and your favorite protein.",
    "Al Dente Pasta + Olive Oil, Greens & Protein",
  ],

  Chips: [
    Droplet,
    "Salty Crunch in a Mindful Bowl",
    "Combines the pre-Moonday desire for salt with stress-relieving jaw crunch.",
    "Pour a portion into a bowl (instead of eating from the bag), pair with salsa or guacamole, and drink a tall glass of water.",
    "Bowl Portion + Guacamole/Salsa + Tall Glass of Water",
  ],

  Candy: [
    Smile,
    "Quick Sugar Pick-Me-Up After Protein",
    "A sudden craving for pure candy usually happens when you've gone more than 4–5 hours without a balanced meal.",
    "Eat a quick protein snack first (like a handful of nuts or yogurt), then enjoy your candy so your blood sugar doesn't rollercoaster.",
    "Have a Protein Bite First • Prevent Long Meal Gaps",
  ],
  
  Noodles: [
    Flame,
    "Warm Brothy Noodle Comfort",
    "Warm broth and soft noodles are hydrating, soothing, and gentle on a sensitive Moonday stomach.",
    "Add ginger, garlic, leafy greens (like spinach or bok choy), and an egg or tofu to your noodle bowl for extra nourishment.",
    "Warm Ginger Broth + Greens + Egg/Tofu",
  ],

  Hydra: [
    Droplet,
    "Homemade Electrolyte Hydra-Elixir",
    "Your cells need potassium, sodium, and magnesium alongside water to stay truly hydrated.",
    "Mix 500 ml water with a splash of coconut water or orange/lemon juice and a tiny pinch of sea salt.",
    "500 ml Water + Coconut Water/Lemon + Pinch of Salt",
  ],
};

// ============================================================================
// 4.EXTENDED PROTOCOLS 
// ============================================================================

const CLINICAL_DOMAINS: Array<{
  prefix: string;
  domainTitle: string;
  icon: LucideIcon;
  category: CareCategory;
  mechanismBase: string;
  interventionBase: string;
  cofactorBase: string;
  conditions: string[];
}> = [
  {
    prefix: "HOR",
    domainTitle: "Hormone & Cycle Balance",
    icon: Sparkles,
    category: "Cycle & Hormone Balance",
    mechanismBase:
      "Helps your body produce, balance, and smoothly clear estrogen and progesterone across all four phases of your menstrual cycle.",
    interventionBase:
      "Eat a protein-rich breakfast within an hour of waking, include leafy greens and healthy fats daily, and prioritize 7–8 hours of sleep.",
    cofactorBase: "Magnesium Bisglycinate • B-Complex • Cruciferous Greens",
    conditions: [
      "Healthy Estrogen Balance & Clearance",
      "Luteal Progesterone Support",
      "Follicular Estrogen Renewal",
      "Smooth Ovulation Hormone Transition",
      "Hormone-Binding Protein (SHBG) Support",
      "Liver Estrogen Detoxification Support",
      "Gentle Phytoestrogen Balance",
      "Stress-to-Hormone Balance (Cortisol Care)",
      "Gut Estrogen Recycling Protection",
      "Healthy Prolactin & Breast Comfort",
      "Balanced Androgen & Clear Skin Care",
      "Adrenal Energy & Hormone Support",
      "Post-Ovulation Luteal Phase Strength",
      "Healthy Follicle Maturation Support",
      "Steady Brain-to-Ovary Hormone Signals",
      "Thyroid & Cycle Energy Connection",
      "Lowering Stress-Related Hormone Blocks",
      "Selenium & Thyroid Antioxidant Care",
      "Healthy Fullness Hormone (Leptin) Balance",
      "Steady Hunger Hormone (Ghrelin) Rhythm",
      "Blood-Sugar & Hormone Harmony",
      "Healthy Morning Energy Cortisol Curve",
      "Calm Evening Cortisol Wind-Down",
      "Protecting Progesterone During High Stress",
      "Calming Brain Receptor (GABA) Support",
      "Oxytocin Connection & Calm Boost",
      "Soothing Uterine Contraction Signals",
      "Joint & Ligament Stability Mid-Cycle",
      "Healthy Egg Quality & Follicle Care",
      "Ovarian Reserve & Antioxidant Nourishment",
      "Uterine Lining Progesterone Receptivity",
      "Balanced Body-Fat & Estrogen Harmony",
      "Smooth Estrogen-to-Progesterone Shift",
      "Natural Fluid & Salt Hormone Balance",
      "Pre-Moonday Water-Retention Reset",
      "Nighttime Melatonin & Ovarian Health",
      "Daylight Serotonin-to-Melatonin Flow",
      "Dopamine Focus & Hormone Synergy",
      "Natural Endorphin Comfort Boost",
      "Hypothalamus Cycle Pacemaker Support",
      "Anti-Inflammatory Prostaglandin Balance",
      "Healthy Uterine Blood-Vessel Relaxation",
      "Smooth Menstrual Flow Clotting Balance",
      "Spiral Artery Oxygen & Circulation",
      "Nitric Oxide Blood-Flow Support",
      "Sulfur-Rich Veggies for Hormone Clearance",
      "Antioxidant Liver Support for Moondays",
      "Glutathione Cellular Protection",
      "Luteal Antioxidant Defense",
      "Follicular Fluid Hydration & Protection",
    ],
  },

  {
    prefix: "BDY",
    domainTitle: "Pelvic, Back & Muscle Relief",
    icon: Flame,
    category: "Symptom Care",
    mechanismBase:
      "Releases tight muscles and connective tissue around your pelvis, lower back, hips, and core that tense up during cycle shifts.",
    interventionBase:
      "Combine slow 360-degree rib-and-belly breathing with gentle stretching and 20 minutes of soothing warmth.",
    cofactorBase: "Warm Heating Pad • Topical Magnesium • Gentle Stretching",
    conditions: [
      "Deep Hip-Flexor (Psoas) Relaxation",
      "Inner Hip & Pelvic Rim Release",
      "Glute & Sciatic Nerve Comfort Stretch",
      "Deep Pelvic Rotator Muscle Ease",
      "Pelvic Floor Muscle Softening (Down-Training)",
      "Bathroom Pelvic Floor Relaxation",
      "Gentle Pelvic Floor Lengthening Breath",
      "Standing Posture Pelvic Offloading",
      "Tailbone & Lower Pelvis Tension Release",
      "Uterine Ligament Lower-Back Relief",
      "Pelvic Vein Circulation & Drainage",
      "Groin & Round Ligament Stretch Comfort",
      "Cervical & Deep Pelvic Support Ease",
      "Sacroiliac (SI) Joint Hip Stability",
      "Front Pelvic Bone (Pubic Symphysis) Comfort",
      "Lower-Back Fascia Hydration & Stretch",
      "Side-Waist (Quadratus Lumborum) Release",
      "Deep Spinal Stabilizer Muscle Rest",
      "Gentle Core Engagement Without Bracing",
      "Softening Stomach-Grasping Tension",
      "Syncing Your Diaphragm & Pelvic Floor",
      "Rib-Cage Expansion Breathing",
      "Relaxing the Throat-to-Pelvis Connection",
      "Unclenching the Jaw to Relax the Pelvis",
      "Base-of-Skull & Upper-Neck Tension Relief",
      "Sitting-Nerve (Pudendal) Cushioning",
      "Lower-Belly & Hip-Crest Nerve Ease",
      "Inner-Thigh Sensory Calm",
      "Back-of-Thigh Sitting Comfort",
      "Upper-Pelvis Nerve Plexus Soothing",
      "Lower-Pelvis Autonomic Nervous Calm",
      "Sacral Warmth for Parasympathetic Rest",
      "Gentle Sacral Rocking Mobility",
      "Tailbone Cushioning & Softening",
      "Widening Sit-Bones Breathing Exercise",
      "Inner-Thigh Adductor Gentle Stretch",
      "Outer-Hip & Glute Medius Release",
      "IT-Band & Outer-Thigh Tension Relief",
      "Hamstring & Sit-Bone Lengthening",
      "Calf Muscle Pump for Leg Circulation",
      "Behind-the-Knee Lymphatic Flow",
      "Groin Crease Lymphatic Opening",
      "Deep Belly Lymphatic Breathing",
      "Collarbone Lymphatic Drainage Sweep",
      "Warm Perineal Compress Comfort",
      "Lower-Belly Gentle Skin Massage",
      "Lower-Back Counter-Pressure Relief",
      "Supported Child's Pose Pelvic Opening",
      "Reclined Butterfly (Cobbler's Pose) Rest",
      "Constructive Rest Pose (Knees Bent, Feet Wide)",
    ],
  },

  {
    prefix: "MND",
    domainTitle: "Mood, Calm & Nervous System",
    icon: Wind,
    category: "Emotional & Mental",
    mechanismBase:
      "Calms your brain's stress center and supports mood-steadying chemicals (serotonin, GABA, and dopamine) when hormones fluctuate.",
    interventionBase:
      "Practice slow 6-second exhales, write your thoughts down in your journal, and eat protein-rich meals to keep blood sugar steady.",
    cofactorBase: "L-Theanine • Vitamin B6 & Magnesium • Slow Exhales",
    conditions: [
      "Calming the Brain's Alarm Center (Amygdala)",
      "Single-Task Focus & Mental Clarity",
      "Stepping Out of Overthinking Loops",
      "Listening to Body Signals Without Panic",
      "Memory & Focus Support on Low-Estrogen Days",
      "Cooling Down Adrenaline Rushes",
      "Natural Serotonin Mood Lifting",
      "Morning Dopamine Motivation Spark",
      "Healthy Reward & Pleasure Balance",
      "Quieting Repetitive Worry Thoughts",
      "Filtering Out Overwhelming Noise & Clutter",
      "Outer-Ear Vagus Nerve Massage",
      "Slow Diaphragmatic Belly Pacing",
      "Cool-Water Face Splash Heart-Rate Reset",
      "Heart-Rate Variability (HRV) Breathing",
      "Pre-Moonday Calming Receptor (GABA) Care",
      "Quieting a Racing Nighttime Mind",
      "Steady Emotional Baseline Support",
      "Smooth Motivation Without Burnout",
      "Sharp Study & Reading Recall",
      "Natural Endorphin Comfort & Warmth",
      "Easing Emotional & Physical Sensitivity",
      "Clearing Heavy Pre-Moonday Blues",
      "Runner's-High & Joyful Movement Calm",
      "Deep Relaxation After Stressful Days",
      "Brain Growth & Learning Flexibility",
      "Preventing Hormone-Drop Headaches",
      "Calm Alpha-Brainwave Focus State",
      "Deep Restorative Daydream & NSDR State",
      "Deep Slow-Wave Nighttime Sleep Repair",
      "Turning Down High-Speed Anxiety Thoughts",
      "Background Noise Buffering",
      "Soothing Bright-Light Eye Strain",
      "Calming Strong Smell Sensitivity",
      "Soft Fabrics for Touch-Sensitive Days",
      "Healing Rejection & Social Sensitivity",
      "Defusing Pre-Moonday Snappiness",
      "Healthy Crying & Emotional Release",
      "Channeling Follicular Curiosity",
      "Mid-Cycle Verbal Confidence & Flow",
      "Eliminating Daily Decision Fatigue",
      "Breaking Tasks into 3 Simple Steps",
      "Overcoming Self-Doubt with Real Evidence",
      "Letting 'Good Enough' Be Enough Today",
      "Setting Boundaries Without Feeling Guilty",
      "Recharging an Introverted Social Battery",
      "Calming Down Together with a Loved One",
      "Shifting Attention to Safe Body Areas",
      "Looking Around the Room to Signal Safety",
      "Speaking to Yourself Like a Dear Friend",
    ],
  },

  {
    prefix: "NUT",
    domainTitle: "Nutrition, Blood Sugar & Minerals",
    icon: Coffee,
    category: "Food & Cravings",
    mechanismBase:
      "Fuels your higher pre-Moonday metabolism, keeps blood sugar from crashing, and replenishes essential minerals like iron and magnesium.",
    interventionBase:
      "Start meals with veggies and 25–30g of protein before complex carbs, and avoid going more than 4 hours without eating.",
    cofactorBase: "30g Protein per Meal • Complex Carbs • Trace Minerals",
    conditions: [
      "Fueling Your +200 Calorie Luteal Metabolism",
      "Smoothing Pre-Moonday Blood-Sugar Swings",
      "Using Your Follicular Carb-Energy Peak",
      "Keeping Overnight Blood Sugar Steady",
      "Helping Muscles Absorb Energy Smoothly",
      "10-Minute Post-Meal Walk for Blood Sugar",
      "Lemon or Apple-Cider-Vinegar Salad Dressing",
      "30-Gram Protein Breakfast Anchor",
      "Soluble Fiber for Long-Lasting Fullness",
      "Cooked-and-Cooled Rice/Potatoes for Gut Health",
      "Complex Carbs to Help Build Serotonin",
      "Morning Protein for Dopamine Focus",
      "Amino Acids to Calm Sugar Cravings",
      "Collagen & Glycine for Tissue Repair",
      "Taurine for Cellular Hydration & Calm",
      "Rebuilding Iron Stores (Ferritin) After Bleeding",
      "Pairing Plant Iron with Vitamin C",
      "Gentle Every-Other-Day Iron Absorption",
      "Copper-Rich Foods to Help Iron Work",
      "Balancing Zinc and Copper Naturally",
      "Magnesium for Muscle & Cramp Relaxation",
      "Calcium-Rich Foods to Ease PMS",
      "Potassium-to-Sodium Balance for De-Bloating",
      "Selenium (Brazil Nuts) for Thyroid & Ovaries",
      "Iodine (Seaweed/Eggs) for Breast & Thyroid Care",
      "Chromium (Broccoli/Oats) for Sugar Balance",
      "Manganese (Seeds/Pineapple) for Joint & Cycle Care",
      "Boron (Avocado/Prunes) for Hormone Balance",
      "Omega-3 EPA to Calm Moonday Inflammation",
      "Omega-3 DHA for Brain Clarity & Mood",
      "Evening Primrose GLA for Breast Comfort",
      "Extra-Virgin Olive Oil for Hormone Building",
      "Coconut & Healthy Fats for Brain Energy",
      "Healthy Cholesterol as a Hormone Building Block",
      "Choline (Eggs) for Liver & Brain Health",
      "Vitamin B1 (Thiamine) for Cramp Prevention",
      "Vitamin B2 (Riboflavin) for Headache Relief",
      "Vitamin B3 (Niacin) for Cellular Energy",
      "Vitamin B5 for Stress & Adrenal Resilience",
      "Vitamin B6 for Serotonin & Progesterone",
      "Biotin (B7) for Strong Hair & Nails",
      "Folate (Leafy Greens) for Healthy Cell Renewal",
      "Vitamin B12 for Red Blood Cells & Energy",
      "Vitamin C for Luteal Progesterone Support",
      "Vitamin D3 Sunshine for Cycle Regularity",
      "Vitamin E (Almonds/Seeds) for Breast Tenderness",
      "Vitamin K2 for Bone & Vascular Health",
      "Coenzyme Q10 for Cellular & Egg Energy",
      "Antioxidant Support for Insulin Balance",
      "Glutathione Precursors for Detoxification",
    ],
  },

  {
    prefix: "GUT",
    domainTitle: "Digestion, De-Bloating & Gut Flora",
    icon: Activity,
    category: "Symptom Care",
    mechanismBase:
      "Helps your digestive tract move smoothly when progesterone slows it down or when Moonday prostaglandins make it extra sensitive.",
    interventionBase:
      "Sip warm ginger, peppermint, or fennel tea, eat cooked vegetables and soluble fiber, and massage your belly clockwise.",
    cofactorBase: "Peppermint & Ginger Tea • Soluble Fiber • Probiotics",
    conditions: [
      "Healthy Gut Bacteria for Estrogen Clearance",
      "Daily Fiber to Clear Used Hormones",
      "Preventing Used Estrogen from Reabsorbing",
      "Ginger Tea to Speed Up Slow Luteal Digestion",
      "Soothing Moonday-Day Loose Stools",
      "Spacing Meals 3–4 Hours for Gut Cleaning Waves",
      "Warm Morning Water to Trigger Elimination",
      "Lower-Right Belly Massage for Gas Relief",
      "Hydrating the Colon for Smooth Digestion",
      "Gentle Movement to Release Trapped Gas",
      "Lower-Left Belly Massage Before Bathroom Trips",
      "Calming Moonday-Related Bowel Sensitivity",
      "Preventing Pre-Moonday Acid Reflux",
      "Helping Meals Leave the Stomach Smoothly",
      "Healthy Bile Flow to Digest Fats",
      "Lemon Water Before Meals for Stomach Acid",
      "Chewing Thoroughly to Help Digestive Enzymes",
      "Supporting Dairy & Histamine Digestion",
      "Calming Histamine Sensitivity Around Ovulation",
      "Soothing a Reactive, Sensitive Gut",
      "Feeding Good Bacteria with Cooked Veggies",
      "Prebiotic Fibers for Gut-Lining Strength",
      "Warm Broths to Improve Gut Blood Flow",
      "Polyphenols (Berries/Olive Oil) for Gut Mucus",
      "Calming the Gut-Brain Anxiety Connection",
      "Probiotic Yogurt & Kefir for Gut Barrier",
      "Beneficial Yeast (S. Boulardii) for Moonday Loose Stools",
      "Choosing Easy-to-Digest Veggies Pre-Moonday",
      "Cooking Cruciferous Veggies to Prevent Gas",
      "Soaking Beans & Lentils for Easy Digestion",
      "Soluble Fiber (Oats/Apples) for Smooth Stools",
      "Whole-Grain Fiber to Prevent Constipation",
      "Ground Flaxseeds for Hormone & Gut Balance",
      "Soaked Chia Pudding for Internal Hydration",
      "Psyllium Husk for Gentle Daily Regularity",
      "Peppermint Tea to Relax Gut Spasms",
      "Crushed Fennel Seeds After Heavy Meals",
      "Caraway & Coriander Spices for Bloating",
      "Chamomile Tea to Calm Nervous Stomachs",
      "Marshmallow Root Tea to Coat the Stomach",
      "Slippery Elm for Heartburn & Reflux Relief",
      "Licorice Root (DGL) for Stomach Lining Care",
      "Artichoke & Bitter Greens for Fat Digestion",
      "Roasted Dandelion Root Tea for Liver & Gut",
      "Digestive Bitters Before Rich Dinners",
      "Protein & Amino Acids to Repair the Gut Lining",
      "Zinc & Vitamin C for Mucosal Healing",
      "Warm Collagen Broth for Digestive Comfort",
      "Mineral-Rich Vegetable Soup Base",
      "Sitting Calmly for 10 Minutes After Meals",
    ],
  },

  {
    prefix: "SKN",
    domainTitle: "Skin Glow, Hair & Lymphatic Care",
    icon: Droplet,
    category: "Symptom Care",
    mechanismBase:
      "Balances pre-Moonday oil production, rebuilds skin moisture during low-estrogen days, and drains puffy fluid through your lymph system.",
    interventionBase:
      "Use a gentle pH-balanced cleanser, layer niacinamide and barrier moisturizers, and sweep upward along your face and neck.",
    cofactorBase: "Niacinamide • Ceramide Moisturizer • Zinc & Hydration",
    conditions: [
      "Rebuilding Skin Moisture During Your Moonday",
      "Boosting Natural Collagen in Your Follicular Phase",
      "Highlighting Your Peak Ovulatory Skin Glow",
      "Calming Luteal Oil Glands Before Your Moonday",
      "Preventing Pre-Moonday Chin & Jawline Breakouts",
      "Soothing Redness Around the Mouth & Nose",
      "Locking Water Into Damp Skin After Showering",
      "Protecting Your Skin's Natural Acidic Barrier",
      "Supporting Healthy, Friendly Skin Flora",
      "Keeping Pores Clear Without Harsh Scrubbing",
      "Azelaic Acid for Redness & Blemish Care",
      "Niacinamide for Pore Refinement & Barrier Strength",
      "Gentle Salicylic (BHA) Spot Care Pre-Moonday",
      "Mild Mandelic/Lactic Resurfacing Mid-Cycle",
      "Hydrating Acids (PHA) for Sensitive Days",
      "Pacing Retinol Use During Dry Menstrual Days",
      "Morning Vitamin C Serum for Follicular Radiance",
      "Pure Squalane Oil for Weightless Moisture",
      "Vitamin B5 (Panthenol) for Skin Soothing",
      "Cica (Centella) Balm for Irritated Skin",
      "Hydrocolloid Pimple Patches to Prevent Picking",
      "Calming Red Light or Warm Compress Care",
      "Jawline-to-Collarbone Lymphatic Face Sweep",
      "Cool Spoon or Ice Roller for Morning Eye Puffiness",
      "Gentle Cheek & Jaw Muscle Facial Massage",
      "Gua Sha Neck & Shoulder Drainage",
      "Collarbone Hollow Gentle Pumping Massage",
      "Underarm & Breast Lymphatic Shower Sweep",
      "Hip-Crease Lymphatic Stretching",
      "Dry Brushing Legs Upward Before Showering",
      "4-Minute Daily Scalp Massage for Hair Growth",
      "Keeping Iron (Ferritin) Healthy for Thick Hair",
      "Protecting Hair Follicles After Stressful Months",
      "Balancing an Oily Scalp in the Luteal Phase",
      "Rosemary Oil & Gentle Scalp Stimulation",
      "Strengthening Peeling or Brittle Nails",
      "Nightly Jojoba Oil Cuticle Massage",
      "Warm Washcloth Compress for Dry Eyes",
      "Overnight Lip Balm Moisture Seal",
      "Smoothing Rough Bumps on Upper Arms",
      "Gentle Natural Underarm pH Care",
      "External Moisture Care for Dry Cycle Days",
      "Body Oil Massage for Skin Elasticity",
      "Vitamin C & Bioflavonoids for Healthy Capillaries",
      "Iron & Vitamin C if You Bruise Easily",
      "Daily Mineral SPF to Prevent Hormone Dark Spots",
      "Warm Sweating & Hydration for Skin Clarity",
      "Cool Water Face Splash to Tighten Pores",
      "Warm Epsom Bath to Soften Body Skin",
      "Changing to a Fresh Cotton/Silk Pillowcase",
    ],
  },

  {
    prefix: "SLP",
    domainTitle: "Sleep, Body Temperature & Energy Rhythm",
    icon: Moon,
    category: "Emotional & Mental",
    mechanismBase:
      "Helps your body cool down from progesterone's natural warmth (+0.4°C) in the luteal phase so you can fall asleep quickly and stay asleep.",
    interventionBase:
      "Get 10 minutes of morning sunlight, take a warm shower 60 minutes before bed, and keep your bedroom cool (~18°C) and dark.",
    cofactorBase: "Morning Sunlight • Cool 18°C Bedroom • Magnesium Glycinate",
    conditions: [
      "10-Minute Morning Sunlight to Set Your Body Clock",
      "Stepping Outside Before Looking at Phones",
      "Cooling Down Your Warmer Luteal Body Temperature",
      "Wearing Warm Socks to Help Your Core Cool Down",
      "Keeping Your Bedroom Cool (Around 18°C / 65°F)",
      "Warm Shower 1 Hour Before Bed for Fast Sleep",
      "Breathable 100% Cotton or Bamboo Bed Sheets",
      "Blocking Blue Screen Light 60 Mins Before Sleep",
      "Using Warm Amber Lamps in the Evening",
      "Complete Darkness to Boost Nighttime Melatonin",
      "Building Healthy Sleepiness Through the Day",
      "Having Your Last Caffeine Before 1:00 PM",
      "Deep Slow-Wave Sleep for Physical Repair",
      "Protecting Dream (REM) Sleep Before Your Moonday",
      "Overnight Memory & Study Consolidation",
      "Falling Asleep in Under 15 Minutes",
      "Sleeping Through the Night Without Tossing",
      "Preventing 3:00 AM Blood-Sugar Wake-Ups",
      "Small Protein-Fat Bedtime Bite (Almond Butter)",
      "Glycine or Collagen Before Bed to Cool the Body",
      "Magnesium Glycinate to Relax Muscles for Sleep",
      "L-Theanine to Quiet a Busy Evening Mind",
      "Chamomile Tea to Support Deep Sleep",
      "Inositol for Calm, Uninterrupted Sleep",
      "Tart Cherry Juice for Natural Melatonin",
      "20-Minute Non-Sleep Deep Rest (NSDR) Audio",
      "Guided Body-Scan Relaxation in Bed",
      "Keeping Daytime Naps Short (20 Mins Before 2:30 PM)",
      "Waking Up Within 60 Mins of Your Usual Time",
      "Finishing Dinner 3 Hours Before Lying Down",
      "Tapering Water Intake 90 Mins Before Bed",
      "Gentle Nasal Breathing for Deeper Sleep",
      "Left-Side Sleeping for Digestion & Circulation",
      "Pillow Between Your Knees for Hip Alignment",
      "Supportive Pillow Height for Neck Relaxation",
      "Cozy Weighted Blanket for Nervous-System Calm",
      "Soft Pink Noise or Rain Sounds Overnight",
      "432Hz Ambient Drone for Deep Relaxation",
      "Writing Tomorrow's To-Do List on Paper Before Bed",
      "60-Minute Screen-Free Wind-Down Ritual",
      "Drinking 400 ml Water Before Morning Coffee",
      "5 Minutes of Morning Stretching to Wake Up",
      "Working in 90-Minute Blocks with Short Breaks",
      "Afternoon Sunlight Walk for the 3:00 PM Slump",
      "Watching Sunset Light to Signal Evening",
      "Allowing 45 Extra Minutes of Sleep Pre-Moonday",
      "Guilt-Free Nap on Day 1 of Your Moonday",
      "Using Your Follicular Morning Focus Peak",
      "Unwinding After Social Ovulatory Evenings",
      "Taking Magnesium & Sleep Support 60 Mins Pre-Bed",
    ],
  },

  {
    prefix: "FLW",
    domainTitle: "Intimate Health, Flow & pH Care",
    icon: Star,
    category: "Vaginal & Flow",
    mechanismBase:
      "Protects your natural acidic vaginal pH (3.8–4.5), supports beneficial lactobacilli bacteria, and keeps Moonday care comfortable and irritation-free.",
    interventionBase:
      "Rinse externally with plain warm water only, wear breathable 100% cotton underwear, and change menstrual protection every 3–4 hours.",
    cofactorBase:
      "100% Cotton Underwear • Plain Water Rinse • Women's Probiotic",
    conditions: [
      "Supporting Protective Lactobacilli Bacteria",
      "Maintaining Healthy Acidic pH (3.8–4.5)",
      "Natural Defense Against Unwanted Bacteria",
      "Rebalancing pH After Menstrual Bleeding Ends",
      "Post-Moonday Freshness & Flora Recovery",
      "Hydrating Fertile-Window Cervical Fluid",
      "Healthy Mid-Cycle Mucus Filtering",
      "Luteal Progesterone Protective Mucus Seal",
      "Peak Ovulation Slippery Fluid Support",
      "Drinking Electrolytes for Stretchy Ovulation Fluid",
      "Mineral Balance for Healthy Cervical Fluid",
      "Mid-Cycle Soft & Open Cervix Awareness",
      "Natural External Moisture Gland Support",
      "Urethral Comfort & Hydration Cushioning",
      "Estrogen Support for Healthy Tissue Thickness",
      "Choosing Body-Safe, pH-Balanced Lubricants",
      "Hyaluronic Acid Gel for Dry Cycle Days",
      "Unbleached 100% Organic Cotton Pads & Tampons",
      "Boiling & Sanitizing Your Menstrual Cup",
      "Breathable Cotton-Gusset Moonday Underwear",
      "Changing Pads or Tampons Every 3–4 Hours",
      "Sleeping Without Tight Bottoms for Airflow",
      "Peeing & Rinsing with Water After Intimacy",
      "Rebalancing Acidic pH After Unprotected Sex",
      "Changing Out of Wet Swimsuits Promptly",
      "Protecting the Bladder Lining with Hydration",
      "D-Mannose Powder to Flush the Urinary Tract",
      "Unsweetened Cranberry for Bladder Protection",
      "Hibiscus Tea for Urinary Tract Freshness",
      "Marshmallow Root Tea to Soothe the Bladder",
      "Using a Bathroom Footstool to Empty the Bladder",
      "Taking an Extra 10 Seconds to Fully Empty",
      "Flushing Out Coffee or Soda Bladder Irritants",
      "Relaxing Tight Pelvic Muscles That Cause Urgency",
      "Soothing External Nerve Sensitivity",
      "10-Minute Warm Water Sitz Bath for Comfort",
      "Pinch of Baking Soda in Sitz Bath for Itching",
      "Sea Buckthorn Oil (Omega-7) for Natural Moisture",
      "Vitamin E Oil for External Skin Softness",
      "Supporting Tissue Elasticity Across Your Cycle",
      "Cutting Back on Sugar During Yeast Flares",
      "Restoring Acidic pH When Odor Appears",
      "Supporting Balanced Microbiome Diversity",
      "Soothing Over-Acidic Irritation with Plain Water",
      "Calming Redness with Breathable Cotton",
      "Gentle Care for a Sensitive Cervix",
      "Benign Cervical Fluid Cyst Awareness",
      "Comfortable Positions for a Tilted Uterus",
      "Warmth for Mid-Cycle Ovulation Twinges",
      "Cozy Pelvic Warmth in the Luteal Window",
    ],
  },

  {
    prefix: "HRB",
    domainTitle: "Herbal Teas & Natural Remedies",
    icon: Sun,
    category: "Food & Cravings",
    mechanismBase:
      "Uses gentle, time-tested herbal teas and plant nutrients to relax cramping muscles, settle digestion, and calm your nervous system.",
    interventionBase:
      "Steep your herbal tea in a covered mug for 7–10 minutes so the beneficial plant oils stay in your cup.",
    cofactorBase: "Steep Covered 7–10 Mins • Mineral Water • Honey or Lemon",
    conditions: [
      "Red Raspberry Leaf Tea for Uterine Muscle Tone",
      "Stinging Nettle Tea for Iron & Mineral Replenishment",
      "Fresh Ginger Root Tea for Moonday Cramp Relief",
      "Chamomile Flower Tea for Evening Calm & Sleep",
      "Spearmint Tea (2 Cups/Day) for Hormonal Skin Clarity",
      "Peppermint Leaf Tea for Post-Meal De-Bloating",
      "Crushed Fennel Seed Tea for Trapped Gas Relief",
      "Cramp Bark Decoction for stubborn Uterine Spasms",
      "Black Haw Herbal Support for Pelvic Comfort",
      "Lady's Mantle Tea for Heavy Menstrual Flow",
      "Vitex (Chasteberry) for Luteal Progesterone Balance",
      "White Peony Root for Smooth Hormone Harmony",
      "Licorice Root Tea for Adrenal Energy Support",
      "Ashwagandha Root for High-Stress Cortisol Relief",
      "Rhodiola Rosea for Follicular Morning Stamina",
      "Schisandra Berry for Liver & Focus Support",
      "Siberian Ginseng for Study & Work Endurance",
      "Tulsi (Holy Basil) Tea for Afternoon Stress Reset",
      "Lemon Balm Tea for Anxious Thoughts & Rest",
      "Passionflower Tea for Racing Nighttime Minds",
      "Valerian Root for Deep Sleep Initiation",
      "Skullcap Herb for Neck & Jaw Tension Release",
      "Milky Oat Tops Tea for Frazzled Nerves",
      "Lavender Blossom Tea for Headaches & Calm",
      "Rose Petal Infusion for Heart & Mood Soothing",
      "Hibiscus Tea for Cooling & Fluid Balance",
      "Dandelion Leaf Tea for Pre-Moonday Water Retention",
      "Roasted Dandelion Root for Liver & Digestion",
      "Artichoke Leaf Extract for Rich-Meal Digestion",
      "Milk Thistle Seed for Hormone Detoxification",
      "Turmeric & Black Pepper Golden Milk for Aches",
      "Boswellia Extract for Joint & Pelvic Comfort",
      "Ceylon Cinnamon in Oats/Tea for Blood-Sugar Balance",
      "Crushed Cardamom Pods for Soothing Digestion",
      "Star Anise & Fennel for Stomach Settling",
      "Saffron Threads in Warm Milk for Luteal Mood",
      "St. John's Wort (Check Medications First) for Mood",
      "Ceremonial Matcha for Calm, Jitter-Free Focus",
      "Rooibos Red Bush Tea for Antioxidant Hydration",
      "Sage Leaf Tea for Night Sweats & Hot Flashes",
      "Red Clover Blossom Tea for Estrogen Support",
      "Dong Quai Root (Post-Moonday) for Blood Building",
      "Astragalus Root in Soup for Pre-Moonday Immunity",
      "Elderberry Syrup for Luteal Immune Defense",
      "Marshmallow Root Cold Infusion for Reflux & Bladder",
      "Slippery Elm Powder for Sensitive Stomachs",
      "Calendula Flower Tea for Lymphatic & Skin Care",
      "Yarrow Herb for Pelvic Circulation Balance",
      "Motherwort Tea for Racing Heart & Uterine Tension",
      "Hawthorn Berry Tea for Healthy Circulation & Warmth",
    ],
  },
];



function buildAll685Protocols(): {
  symptomMap: Record<string, CareReminder>;
  moodMap: Record<string, CareReminder>;
  flowMap: Record<string, CareReminder>;
  dischargeMap: Record<string, CareReminder>;
  cravingMap: Record<string, CareReminder>;
  masterLibrary: CareReminder[];
} {
  const symptomMap: Record<string, CareReminder> = {};
  const moodMap: Record<string, CareReminder> = {};
  const flowMap: Record<string, CareReminder> = {};
  const dischargeMap: Record<string, CareReminder> = {};
  const cravingMap: Record<string, CareReminder> = {};
  const masterLibrary: CareReminder[] = [];

  Object.entries(SYMPTOM_SEEDS).forEach(([key, seed], idx) => {
    const item: CareReminder = {
      id: `core-symp-${key}`,
      code: `SYM-${String(idx + 1).padStart(3, "0")}`,
      keyName: key,
      icon: seed[0],
      title: `${key} — ${seed[1]}`,
      mechanism: seed[2],
      text: seed[3],
      cofactors: seed[4],
      category: "Symptom Care",
    };
    symptomMap[key] = item;
    masterLibrary.push(item);
  });


  Object.entries(MOOD_SEEDS).forEach(([key, seed], idx) => {
    const item: CareReminder = {
      id: `core-mood-${key}`,
      code: `MOD-${String(idx + 1).padStart(3, "0")}`,
      keyName: key,
      icon: seed[0],
      title: `${key} — ${seed[1]}`,
      mechanism: seed[2],
      text: seed[3],
      cofactors: seed[4],
      category: "Emotional & Mental",
    };
    moodMap[key] = item;
    masterLibrary.push(item);
  });


  Object.entries(CRAVING_SEEDS).forEach(([key, seed], idx) => {
    const item: CareReminder = {
      id: `core-crav-${key}`,
      code: `CRV-${String(idx + 1).padStart(3, "0")}`,
      keyName: key,
      icon: seed[0],
      title: `${key} — ${seed[1]}`,
      mechanism: seed[2],
      text: seed[3],
      cofactors: seed[4],
      category: "Food & Cravings",
    };
    cravingMap[key] = item;
    masterLibrary.push(item);
  });


  Object.entries(DISCHARGE_SEEDS).forEach(([key, seed], idx) => {
    const item: CareReminder = {
      id: `core-disc-${key}`,
      code: `DSC-${String(idx + 1).padStart(3, "0")}`,
      keyName: key,
      icon: seed[0],
      title: `${key} — ${seed[1]}`,
      mechanism: seed[2],
      text: seed[3],
      cofactors: seed[4],
      category: "Vaginal & Flow",
    };
    dischargeMap[key] = item;
    masterLibrary.push(item);
  });



  Object.entries(FLOW_SEEDS).forEach(([key, seed], idx) => {
    const item: CareReminder = {
      id: `core-flow-${key}`,
      code: `FLW-${String(idx + 1).padStart(3, "0")}`,
      keyName: key,
      icon: seed[0],
      title: `Flow (${key}) — ${seed[1]}`,
      mechanism: seed[2],
      text: seed[3],
      cofactors: seed[4],
      category: "Vaginal & Flow",
    };
    flowMap[key] = item;
    masterLibrary.push(item);
  });


  
  // Add Accessible Everyday Care Guides 



  CLINICAL_DOMAINS.forEach((dom) => {
    dom.conditions.forEach((condName, idx) => {
      const numStr = String(idx + 1).padStart(2, "0");
      masterLibrary.push({
        id: `ext-${dom.prefix}-${numStr}`,
        code: `${dom.prefix}-${numStr}`,
        keyName: condName,
        icon: dom.icon,
        title: `${condName}`,
        mechanism: `Focusing on ${condName.toLowerCase()} ${dom.mechanismBase.charAt(0).toLowerCase()}${dom.mechanismBase.slice(1)}`,
        text: `To support ${condName.toLowerCase()} today: ${dom.interventionBase}`,
        cofactors: `${dom.domainTitle} • ${dom.cofactorBase}`,
        category: dom.category,
      });
    });
  });

  return {
    symptomMap,
    moodMap,
    flowMap,
    dischargeMap,
    cravingMap,
    masterLibrary,
  };
}

const PROTOCOL_DB = buildAll685Protocols();

// ============================================================================
// 5. ACCESSIBLE BREATHWORK, THERMAL TIMERS & HERBAL TEAS
// ============================================================================


const BREATH_PROTOCOLS = [
  {
    id: "box",
    code: "I",
    name: "Box Breathing (4-4-4-4)",
    purpose:
      "Steadies racing thoughts and brings calm focus in under 2 minutes.",
    phases: [
      { label: "Breathe In Slowly", seconds: 4, scale: 1.24 },
      { label: "Hold Gently", seconds: 4, scale: 1.24 },
      { label: "Breathe Out Slowly", seconds: 4, scale: 0.86 },
      { label: "Rest Empty", seconds: 4, scale: 0.86 },
    ],
  },
  {
    id: "478",
    code: "II",
    name: "Sleep & Calm Breath (4-7-8)",
    purpose: "Slows your heart rate and prepares your body for deep rest.",
    phases: [
      { label: "Breathe In Nose", seconds: 4, scale: 1.24 },
      { label: "Hold Breath", seconds: 7, scale: 1.24 },
      { label: "Long Slow Exhale", seconds: 8, scale: 0.84 },
    ],
  },

  {
    id: "sigh",
    code: "III",
    name: "Physiological Sigh (2+1-6)",
    purpose: "The fastest natural way to stop a wave of anxiety or overwhelm.",
    phases: [
      { label: "Breathe In Deep", seconds: 2, scale: 1.15 },
      { label: "Quick Top-Up Sniff", seconds: 1, scale: 1.26 },
      { label: "Long Mouth Exhale", seconds: 6, scale: 0.84 },
    ],
  },

  {
    id: "coherent",
    code: "IV",
    name: "Balanced Wave Breath (5-5)",
    purpose:
      "Syncs your heart rate and breathing into a smooth, peaceful rhythm.",
    phases: [
      { label: "Smooth Inhale", seconds: 5, scale: 1.24 },
      { label: "Smooth Exhale", seconds: 5, scale: 0.86 },
    ],
  },
];

const SOMATIC_THERAPIES = [
  {
    id: "pelvic-heat",
    code: "01",
    title: "Lower-Belly Heating Pad Session",
    durationMins: 20,
    target: "Moonday Cramps & Tight Pelvic Muscles",
    instructions:
      "Rest a warm heating pad or hot water bottle over your lower belly. Gentle heat widens blood vessels, brings fresh oxygen to cramping muscles, and blocks pain signals naturally.",
  },

  {
    id: "legs-wall",
    code: "02",
    title: "Legs-Up-The-Wall Rest",
    durationMins: 10,
    target: "Heavy Pelvis, Swollen Ankles & Fatigue",
    instructions:
      "Lie comfortably on your back with your hips near a wall and rest your legs vertically upward. Gravity gently drains pooled fluid from your legs and pelvis while calming your heart rate.",
  },

  {
    id: "sp6-acupressure",
    code: "03",
    title: "Inner-Ankle Cramp Acupressure (SP-6)",
    durationMins: 5,
    target: "Menstrual Cramps & Lower-Back Ache",
    instructions:
      "Measure four finger-widths above your inner ankle bone, just behind the shin bone. Press gently in small circles with your thumb for 2.5 minutes on each leg while breathing slowly.",
  },

  {
    id: "magnesium-soak",
    code: "04",
    title: "Warm Epsom Salt Bath or Foot Soak",
    durationMins: 15,
    target: "Full-Body Aches & Pre-Moonday Trouble Sleeping",
    instructions:
      "Dissolve 1–2 cups of Epsom salts in a warm bath or foot basin. Soaking helps relax tight muscles and warms your extremities so you can fall asleep more easily afterward.",
  },

];


const BOTANICAL_ELIXIRS = [
  {
    code: "01",
    name: "Red Raspberry Leaf & Nettle Tea",
    phase: "Moonday & Late Luteal Days",
    compounds: "Plant iron, magnesium, calcium & uterine-toning nutrients",
    steep: "Steep covered for 10 mins in hot water",
    effect:
      "Supports smooth, coordinated uterine contractions during your Moonday while replenishing gentle plant minerals.",
  },

  {
    code: "02",
    name: "Fresh Ginger & Cinnamon Tea",
    phase: "Moonday Days 1–3",
    compounds: "Warming gingerols & blood-sugar-steadying cinnamon",
    steep: "Simmer or steep 8 mins in hot water",
    effect:
      "Naturally lowers cramp-causing prostaglandins, warms a chilly core, and settles Moonday nausea.",
  },

  {
    code: "03",
    name: "Peppermint & Fennel Seed Tea",
    phase: "Ovulation & Pre-Moonday Bloating",
    compounds: "Cooling menthol & digestive-relaxing fennel oils",
    steep: "Steep covered for 7 mins after meals",
    effect:
      "Relaxes tight digestive muscles to release trapped gas and ease pre-Moonday belly bloating.",
  },

  {
    code: "04",
    name: "Chamomile & Lavender Evening Tea",
    phase: "Pre-Moonday Evenings & Rest",
    compounds: "Calming apigenin & soothing floral aromatics",
    steep: "Steep covered for 6–8 mins before bed",
    effect:
      "Gently quiets a busy mind, eases pre-Moonday irritability, and prepares your body for deeper sleep.",
  },
];


const DEFAULT_RITUAL_ITEMS = [
  {
    id: "water",
    code: "01",
    label: "Drink 500 ml of water or warm herbal tea",
    domain: "Hydration",
  },

  {
    id: "stretch",
    code: "02",
    label: "Do 5 minutes of gentle hip or lower-back stretching",
    domain: "Movement",
  },

  {
    id: "rest",
    code: "03",
    label: "Take a 15-minute phone-free rest break",
    domain: "Rest",
  },

  {
    id: "breathe",
    code: "04",
    label: "Practice 5 slow, deep belly breaths",
    domain: "Calm",
  },

  {
    id: "medication",
    code: "05",
    label: "Take daily vitamins, iron, or magnesium support",
    domain: "Nourishment",
  },
];



function playCompletionTone() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx: AudioContext = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(528, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.45);
  } catch {}
}

const INITIAL_FEED_COUNT = 24;
const FEED_BATCH_SIZE = 24;

export default function SelfCarePage() {
  const [todayLog, setTodayLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cycleContext, setCycleContext] = useState({
    day: 14,
    phase: "Follicular Phase",
    roman: "Phase II",
  });


  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_FEED_COUNT);
  const [gridColumns, setGridColumns] = useState<1 | 2 | 3>(3);
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>(
    {},
  );
  const [simulatedItems, setSimulatedItems] = useState<string[]>([]);

  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({});
  const [customRituals, setCustomRituals] = useState<
    Array<{ id: string; code: string; label: string; domain: string }>
  >([]);
  const [newRitualInput, setNewRitualInput] = useState("");

  const [selectedBreathId, setSelectedBreathId] = useState("box");
  const [breathRunning, setBreathRunning] = useState(false);
  const [breathPhaseIdx, setBreathPhaseIdx] = useState(0);
  const [breathSecondsLeft, setBreathSecondsLeft] = useState(4);
  const [completedBreathCycles, setCompletedBreathCycles] = useState(0);

  const [selectedTherapyId, setSelectedTherapyId] = useState("pelvic-heat");
  const [therapySecondsLeft, setTherapySecondsLeft] = useState(20 * 60);
  const [therapyRunning, setTherapyRunning] = useState(false);

  const supabase = createClient();
  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedCheck = JSON.parse(
          localStorage.getItem(`moonday_selfcare_checks_${todayStr}`) || "{}",
        );
        setCheckedMap(savedCheck);

        const savedCustom = JSON.parse(
          localStorage.getItem("moonday_custom_selfcare_rituals") || "[]",
        );
        if (Array.isArray(savedCustom)) setCustomRituals(savedCustom);

        const savedBookmarks = JSON.parse(
          localStorage.getItem("moonday_selfcare_bookmarks") || "{}",
        );
        setBookmarkedIds(savedBookmarks);
      } catch {}
    }
  }, [todayStr]);

  useEffect(() => {
    async function fetchTelemetry() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const [{ data: logData }, { data: profile }, { data: startLogs }] =
        await Promise.all([
          supabase
            .from("daily_logs")
            .select("*")
            .eq("user_id", user.id)
            .eq("log_date", todayStr)
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("cycle_length, period_length, luteal_phase_length")
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

      if (logData) setTodayLog(logData);

      const cycleLen = Number(profile?.cycle_length) || 28;
      const periodLen = Number(profile?.period_length) || 5;
      const lutealLen = Number(profile?.luteal_phase_length) || 14;

      if (startLogs && startLogs.length > 0) {
        const lastStart = startOfDay(
          parseISO(startLogs[startLogs.length - 1].log_date),
        );
        const cDay = Math.max(
          1,
          differenceInCalendarDays(startOfDay(new Date()), lastStart) + 1,
        );
        const ovulDay = cycleLen - lutealLen;

        let phase = "Follicular Phase";
        let roman = "Phase II";
        if (cDay <= periodLen) {
          phase = "Menstrual Phase";
          roman = "Phase I";
        } else if (cDay >= ovulDay - 4 && cDay <= ovulDay + 1) {
          phase = "Ovulatory Window";
          roman = "Phase III";
        } else if (cDay > ovulDay + 1) {
          phase = "Luteal Phase";
          roman = "Phase IV";
        }

        setCycleContext({ day: cDay, phase, roman });
      }

      setLoading(false);
    }
    fetchTelemetry();
  }, [supabase, todayStr]);

  const activeBreathProtocol = useMemo(
    () =>
      BREATH_PROTOCOLS.find((b) => b.id === selectedBreathId) ||
      BREATH_PROTOCOLS[0],
    [selectedBreathId],
  );

  useEffect(() => {
    setBreathRunning(false);
    setBreathPhaseIdx(0);
    setBreathSecondsLeft(activeBreathProtocol.phases[0].seconds);
  }, [activeBreathProtocol]);

  useEffect(() => {
    if (!breathRunning) return;
    const timer = setInterval(() => {
      setBreathSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;
        const nextIdx =
          (breathPhaseIdx + 1) % activeBreathProtocol.phases.length;
        setBreathPhaseIdx(nextIdx);
        if (nextIdx === 0) {
          setCompletedBreathCycles((c) => c + 1);
        }
        return activeBreathProtocol.phases[nextIdx].seconds;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [breathRunning, breathPhaseIdx, activeBreathProtocol]);

  const activeTherapy = useMemo(
    () =>
      SOMATIC_THERAPIES.find((t) => t.id === selectedTherapyId) ||
      SOMATIC_THERAPIES[0],
    [selectedTherapyId],
  );

  useEffect(() => {
    setTherapyRunning(false);
    setTherapySecondsLeft(activeTherapy.durationMins * 60);
  }, [activeTherapy]);

  useEffect(() => {
    if (!therapyRunning) return;
    const timer = setInterval(() => {
      setTherapySecondsLeft((prev) => {
        if (prev <= 1) {
          setTherapyRunning(false);
          playCompletionTone();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [therapyRunning]);

  const toggleRitualCheck = (id: string) => {
    const next = { ...checkedMap, [id]: !checkedMap[id] };
    setCheckedMap(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `moonday_selfcare_checks_${todayStr}`,
        JSON.stringify(next),
      );
    }
  };

  const handleAddCustomRitual = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newRitualInput.trim();
    if (!clean) return;
    const newItem = {
      id: `custom-${Date.now()}`,
      code: `0${DEFAULT_RITUAL_ITEMS.length + customRituals.length + 1}`,
      label: clean,
      domain: "Personal",
    };
    const updated = [...customRituals, newItem];
    setCustomRituals(updated);
    setNewRitualInput("");
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "moonday_custom_selfcare_rituals",
        JSON.stringify(updated),
      );
    }
  };

  const handleDeleteCustomRitual = (id: string) => {
    const updated = customRituals.filter((r) => r.id !== id);
    setCustomRituals(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "moonday_custom_selfcare_rituals",
        JSON.stringify(updated),
      );
    }
  };

  const toggleBookmark = (id: string) => {
    const next = { ...bookmarkedIds, [id]: !bookmarkedIds[id] };
    setBookmarkedIds(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("moonday_selfcare_bookmarks", JSON.stringify(next));
    }
  };

  const toggleSimulateSymptom = (keyName: string) => {
    setSimulatedItems((prev) =>
      prev.includes(keyName)
        ? prev.filter((k) => k !== keyName)
        : [...prev, keyName],
    );
  };

  const rawSymptoms = todayLog?.symptoms;
  const parsedSymptoms: string[] = Array.isArray(rawSymptoms)
    ? rawSymptoms
    : typeof rawSymptoms === "string" && rawSymptoms.trim() !== ""
      ? rawSymptoms
          .replace(/[{}"[\]]/g, "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  const rawMoods = todayLog?.mood;
  const parsedMoods: string[] =
    typeof rawMoods === "string" && rawMoods.trim() !== ""
      ? rawMoods
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean)
      : [];

  const rawCravings = todayLog?.cravings;
  const parsedCravings: string[] =
    typeof rawCravings === "string" && rawCravings.trim() !== ""
      ? rawCravings
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : [];

  const activePrescriptions: CareReminder[] = useMemo(() => {
    const list: CareReminder[] = [];
    const allActiveSymptoms = Array.from(
      new Set([...parsedSymptoms, ...simulatedItems]),
    );

    allActiveSymptoms.forEach((symptom) => {
      if (symptom === "None") return;
      const match = PROTOCOL_DB.symptomMap[symptom];
      if (match) list.push(match);
    });

    parsedMoods.forEach((mood) => {
      const match = PROTOCOL_DB.moodMap[mood];
      if (match) list.push(match);
    });

    if (todayLog?.flow && PROTOCOL_DB.flowMap[todayLog.flow]) {
      list.push(PROTOCOL_DB.flowMap[todayLog.flow]);
    }

    if (todayLog?.discharge && PROTOCOL_DB.dischargeMap[todayLog.discharge]) {
      list.push(PROTOCOL_DB.dischargeMap[todayLog.discharge]);
    }

    parsedCravings.forEach((craving) => {
      const cMatch = PROTOCOL_DB.cravingMap[craving];
      if (cMatch) list.push(cMatch);
    });

    if (todayLog?.what_you_need_note) {
      const plainNeed = todayLog.what_you_need_note
        .replace(/<[^>]*>/g, "")
        .trim();
      if (plainNeed) {
        list.push({
          id: "personal-need",
          code: "PN-001",
          keyName: "Personal Need",
          icon: Heart,
          title: "Your Personal Need Today",
          mechanism:
            "A personal comfort or boundary note you recorded in today's check-in.",
          text: `You noted that you need: "${plainNeed}". Give yourself permission to honor or ask for this today.`,
          cofactors: "Self-Kindness • Gentle Boundaries",
          category: "Personal Need",
        });
      }
    }

    return list;
  }, [parsedSymptoms, simulatedItems, parsedMoods, parsedCravings, todayLog]);

  const filteredLibrary: CareReminder[] = useMemo(() => {
    return PROTOCOL_DB.masterLibrary.filter((item) => {
      if (activeCategoryTab === "Saved" && !bookmarkedIds[item.id]) {
        return false;
      }
      if (
        activeCategoryTab !== "All" &&
        activeCategoryTab !== "Saved" &&
        item.category !== activeCategoryTab
      ) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.code.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.mechanism.toLowerCase().includes(q) ||
        item.text.toLowerCase().includes(q) ||
        item.cofactors.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [activeCategoryTab, searchQuery, bookmarkedIds]);

  // Reset feed batch count when filter or search changes

  useEffect(() => {
    setVisibleCount(INITIAL_FEED_COUNT);
  }, [activeCategoryTab, searchQuery]);

  const visibleFeedItems = useMemo(
    () => filteredLibrary.slice(0, visibleCount),
    [filteredLibrary, visibleCount],
  );

  // Automatic infinite-scroll handler inside the 3-column

  const handleFeedScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 420) {
      if (visibleCount < filteredLibrary.length) {
        setVisibleCount((prev) =>
          Math.min(filteredLibrary.length, prev + FEED_BATCH_SIZE),
        );
      }
    }
  };

  const combinedRituals = useMemo(
    () => [...DEFAULT_RITUAL_ITEMS, ...customRituals],
    [customRituals],
  );

  const completedRitualCount = useMemo(
    () => combinedRituals.filter((r) => checkedMap[r.id]).length,
    [combinedRituals, checkedMap],
  );

  const adherencePct = Math.round(
    (completedRitualCount / Math.max(1, combinedRituals.length)) * 100,
  );

  const currentBreathPhase =
    activeBreathProtocol.phases[breathPhaseIdx] ||
    activeBreathProtocol.phases[0];

  const formatClock = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="animate-in fade-in duration-300 max-w-[1320px] mx-auto pb-20 text-ink space-y-8">

      {/* I. ARCHITECTURAL MASTHEAD & TELEMETRY LEDGER */}

      <section className="bg-white border border-line rounded-[28px] shadow-soft overflow-hidden">
        <div className="p-7 sm:p-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#a55f78] mb-2.5">
              <Sparkles
                className="w-3.5 h-3.5 text-[#d990a8]"
                strokeWidth={1.5}
              />
              <span>
                {cycleContext.roman} • {cycleContext.phase} • Cycle Day{" "}
                {cycleContext.day}
              </span>
            </div>
            <h1
              style={{
                fontFamily: "'Georgia', 'Cambria', 'Times New Roman', serif",
              }}
              className="text-[30px] sm:text-[38px] font-normal text-ink tracking-tight leading-[1.12]"
            >
              Self-Care &amp; Body Comfort Studio
            </h1>
            <p className="text-[13.5px] text-muted mt-2 max-w-[640px] leading-relaxed">
              Guided breathing, soothing warmth timers, herbal tea recipes, and{" "}
              {PROTOCOL_DB.masterLibrary.length} easy-to-understand care guides
              tailored to how your body feels today.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
              Preview Care For Any Symptom
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                "Cramps",
                "Bloating",
                "Fatigue",
                "Headache",
                "Anxiety",
                "Insomnia",
              ].map((sym) => {
                const active =
                  simulatedItems.includes(sym) || parsedSymptoms.includes(sym);
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => toggleSimulateSymptom(sym)}
                    className={`px-3.5 py-1.5 rounded-full text-[11.5px] font-semibold border transition-all cursor-pointer ${
                      active
                        ? "bg-[#a55f78] text-white border-[#a55f78]"
                        : "bg-[#fcf9fa] text-muted border-line hover:text-ink hover:border-[#d990a8]"
                    }`}
                  >
                    {sym}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4-Column Hairline Telemetry Strip */}

        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-line border-t border-line bg-[#fcf9fa]">
          <div className="px-6 py-4 flex items-baseline justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted">
              Today&apos;s Care Guides
            </span>
            <span
              style={{
                fontFamily: "'Georgia', 'Cambria', 'Times New Roman', serif",
              }}
              className="text-[22px] text-ink tabular-nums"
            >
              {activePrescriptions.length}
            </span>
          </div>

          <div className="px-6 py-4 flex items-baseline justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted">
              Daily Checklist
            </span>
            <span
              style={{
                fontFamily: "'Georgia', 'Cambria', 'Times New Roman', serif",
              }}
              className="text-[22px] text-[#a55f78] tabular-nums"
            >
              {adherencePct}%
            </span>
          </div>

          <div className="px-6 py-4 flex items-baseline justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted">
              Breathing Cycles
            </span>
            <span
              style={{
                fontFamily: "'Georgia', 'Cambria', 'Times New Roman', serif",
              }}
              className="text-[22px] text-ink tabular-nums"
            >
              {completedBreathCycles}
            </span>
          </div>

          <div className="px-6 py-4 flex items-baseline justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted">
              Complete Care Library
            </span>
            <span
              style={{
                fontFamily: "'Georgia', 'Cambria', 'Times New Roman', serif",
              }}
              className="text-[22px] text-ink tabular-nums"
            >
              {PROTOCOL_DB.masterLibrary.length}
            </span>
          </div>
        </div>
      </section>


      {/* II. TODAY'S PERSONALIZED CARE GUIDES & DAILY COMFORT CHECKLIST */}


      <section className="bg-white border border-line rounded-[28px] shadow-soft overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-line">
          <div className="lg:col-span-7 p-7 sm:p-9 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4 pb-5 mb-6 border-b border-line/70">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a55f78] block">
                    Section I • Matched to Your Log
                  </span>
                  <h2
                    style={{
                      fontFamily:
                        "'Georgia', 'Cambria', 'Times New Roman', serif",
                    }}
                    className="text-[22px] font-normal text-ink tracking-tight mt-0.5"
                  >
                    Today&apos;s Personalized Care Guides
                  </h2>
                </div>

                {simulatedItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSimulatedItems([])}
                    className="text-[11.5px] font-bold text-[#a55f78] hover:underline cursor-pointer"
                  >
                    Clear Preview ({simulatedItems.length})
                  </button>
                )}
              </div>

              {loading ? (
                <div className="py-16 text-center text-[13px] text-muted">
                  Loading your personalized care guides...
                </div>
              ) : activePrescriptions.length > 0 ? (
                <div className="space-y-4 max-h-[540px] overflow-y-auto pr-2">
                  {activePrescriptions.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        className="p-5 rounded-2xl bg-[#fcf9fa] border border-line space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold text-[#a55f78] bg-[#fff0f3] border border-[#f4c2c2] rounded-md px-2 py-0.5 tabular-nums">
                              {item.code}
                            </span>
                            <span className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted">
                              {item.category}
                            </span>
                          </div>
                          <Icon
                            className="w-4 h-4 text-[#a55f78] shrink-0"
                            strokeWidth={1.75}
                          />
                        </div>

                        <h4 className="text-[15.5px] font-bold text-ink leading-snug">
                          {item.title}
                        </h4>

                        <div className="p-3 rounded-xl bg-white border border-line/70 text-[13px] text-muted leading-relaxed">
                          <strong className="text-[#a55f78] font-semibold">
                            Why this happens:{" "}
                          </strong>
                          {item.mechanism}
                        </div>

                        <p className="text-[13.5px] text-ink leading-relaxed">
                          <strong className="font-semibold">
                            What helps right now:{" "}
                          </strong>
                          {item.text}
                        </p>

                        <div className="pt-2 border-t border-line/60 text-[12px] text-muted">
                          <strong className="text-ink font-semibold">
                            Helpful support:{" "}
                          </strong>
                          {item.cofactors}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-14 px-6 rounded-2xl bg-[#fcf9fa] border border-dashed border-line text-center">
                  <p
                    style={{
                      fontFamily:
                        "'Georgia', 'Cambria', 'Times New Roman', serif",
                    }}
                    className="text-[17px] text-ink mb-1.5"
                  >
                    No symptoms or moods logged for today yet.
                  </p>
                  <p className="text-[13px] text-muted max-w-[420px] mx-auto leading-relaxed">
                    Click any symptom button at the top right (like{" "}
                    <strong>Cramps</strong> or <strong>Bloating</strong>) to
                    preview care tips, or scroll through all 685 guides below.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-5 mt-6 border-t border-line/60 flex items-center justify-between text-[11.5px] text-muted">
              <span>Automatically synced with your daily check-in</span>
              <span className="tabular-nums">{todayStr}</span>
            </div>
          </div>

          {/* RIGHT 5 COLUMNS: DAILY COMFORT CHECKLIST */}


          <div className="lg:col-span-5 p-7 sm:p-9 bg-[#fcf9fa] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3 pb-5 mb-5 border-b border-line/80">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a55f78] block">
                    Section II • Daily Habits
                  </span>
                  <h3
                    style={{
                      fontFamily:
                        "'Georgia', 'Cambria', 'Times New Roman', serif",
                    }}
                    className="text-[22px] font-normal text-ink tracking-tight mt-0.5"
                  >
                    Daily Comfort Checklist
                  </h3>
                </div>
                <span className="text-[12px] font-bold text-[#a55f78] tabular-nums">
                  {completedRitualCount} / {combinedRituals.length} Done
                </span>
              </div>

              <div className="divide-y divide-line/60 max-h-[380px] overflow-y-auto pr-1">
                {combinedRituals.map((item) => {
                  const isDone = Boolean(checkedMap[item.id]);
                  const isCustom = item.id.startsWith("custom-");
                  return (
                    <div
                      key={item.id}
                      className="py-3.5 first:pt-0 flex items-center justify-between gap-3 group"
                    >
                      <button
                        type="button"
                        onClick={() => toggleRitualCheck(item.id)}
                        className="flex items-start gap-3.5 text-left flex-1 cursor-pointer"
                      >
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isDone
                              ? "bg-[#a55f78] border-[#a55f78] text-white"
                              : "bg-white border-line group-hover:border-[#d990a8]"
                          }`}
                        >
                          {isDone && (
                            <Check className="w-3 h-3" strokeWidth={2.5} />
                          )}
                        </span>
                        <div className="min-w-0">
                          <span
                            className={`text-[13.5px] font-medium leading-snug block transition-opacity ${
                              isDone
                                ? "line-through text-muted opacity-65"
                                : "text-ink"
                            }`}
                          >
                            {item.label}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted mt-0.5 block">
                            {item.code} • {item.domain}
                          </span>
                        </div>
                      </button>

                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomRitual(item.id)}
                          aria-label="Remove custom ritual"
                          className="p-1 text-muted hover:text-red-500 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <form
              onSubmit={handleAddCustomRitual}
              className="pt-5 mt-5 border-t border-line/80 flex items-center gap-2"
            >
              <input
                type="text"
                value={newRitualInput}
                onChange={(e) => setNewRitualInput(e.target.value)}
                placeholder="Add your own daily comfort habit..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-line text-[12.5px] text-ink outline-none focus:border-[#d990a8]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-ink text-white text-[12px] font-bold hover:bg-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>
        </div>
      </section>



      {/* III. GUIDED BREATHING PACER, WARMTH TIMER & HERBAL TEAS */}


      <section className="bg-white border border-line rounded-[28px] shadow-soft overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-line">
          <div className="lg:col-span-6 p-7 sm:p-9 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-line/70">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a55f78] block">
                    Section III • Guided Breathing
                  </span>
                  <h3
                    style={{
                      fontFamily:
                        "'Georgia', 'Cambria', 'Times New Roman', serif",
                    }}
                    className="text-[22px] font-normal text-ink tracking-tight mt-0.5"
                  >
                    Calming Breathwork Pacer
                  </h3>
                </div>

                <div className="inline-flex bg-[#fcf9fa] border border-line rounded-xl p-0.5">
                  {BREATH_PROTOCOLS.map((bp) => (
                    <button
                      key={bp.id}
                      type="button"
                      onClick={() => setSelectedBreathId(bp.id)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        selectedBreathId === bp.id
                          ? "bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2]"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      {bp.code}
                    </button>
                  ))}
                </div>
              </div>



              <div className="mb-6">
                <h4 className="text-[15px] font-bold text-ink">
                  {activeBreathProtocol.name}
                </h4>
                <p className="text-[13px] text-muted mt-0.5">
                  {activeBreathProtocol.purpose}
                </p>
              </div>

              <div className="py-8 flex flex-col items-center justify-center">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-dashed border-line" />
                  <div
                    style={{
                      transform: `scale(${breathRunning ? currentBreathPhase.scale : 1})`,
                      transition: `transform ${currentBreathPhase.seconds}s ease-in-out`,
                    }}
                    className="w-32 h-32 rounded-full bg-[#fff8fa] border border-[#d990a8] flex flex-col items-center justify-center text-center p-3"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#a55f78]">
                      {breathRunning ? currentBreathPhase.label : "Ready"}
                    </span>
                    <span
                      style={{
                        fontFamily:
                          "'Georgia', 'Cambria', 'Times New Roman', serif",
                      }}
                      className="text-[34px] font-normal text-ink leading-none mt-1 tabular-nums"
                    >
                      {breathSecondsLeft}s
                    </span>
                  </div>
                </div>



                <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                  {activeBreathProtocol.phases.map((p, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold border tabular-nums transition-colors ${
                        idx === breathPhaseIdx && breathRunning
                          ? "bg-[#a55f78] text-white border-[#a55f78]"
                          : "bg-[#fcf9fa] text-muted border-line"
                      }`}
                    >
                      {p.label} ({p.seconds}s)
                    </span>
                  ))}
                </div>
              </div>
            </div>



            <div className="pt-5 border-t border-line/70 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setBreathRunning((p) => !p)}
                className="flex-1 py-3 px-4 rounded-xl bg-[#d990a8] hover:brightness-95 text-white text-[12.5px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {breathRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause Breathing</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Start Breathing Guide</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setBreathRunning(false);
                  setBreathPhaseIdx(0);
                  setBreathSecondsLeft(activeBreathProtocol.phases[0].seconds);
                }}
                aria-label="Reset breath pacer"
                className="p-3 rounded-xl bg-[#fcf9fa] border border-line text-muted hover:text-ink cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>



          <div className="lg:col-span-6 p-7 sm:p-9 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-line/70">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a55f78] block">
                    Section IV • Comfort Timer
                  </span>
                  <h3
                    style={{
                      fontFamily:
                        "'Georgia', 'Cambria', 'Times New Roman', serif",
                    }}
                    className="text-[22px] font-normal text-ink tracking-tight mt-0.5"
                  >
                    Heating Pad &amp; Relaxation Timer
                  </h3>
                </div>

                <div className="inline-flex bg-[#fcf9fa] border border-line rounded-xl p-0.5">
                  {SOMATIC_THERAPIES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedTherapyId(st.id)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer tabular-nums ${
                        selectedTherapyId === st.id
                          ? "bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2]"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      {st.code}
                    </button>
                  ))}
                </div>
              </div>



              <div className="space-y-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#a55f78] block">
                    Best For • {activeTherapy.target}
                  </span>
                  <h4 className="text-[16px] font-bold text-ink mt-1">
                    {activeTherapy.title}
                  </h4>
                  <p className="text-[13.5px] text-muted leading-relaxed mt-2">
                    {activeTherapy.instructions}
                  </p>
                </div>

                <div className="py-7 px-6 rounded-2xl bg-[#fcf9fa] border border-line flex items-center justify-between">
                  <div>
                    <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted block">
                      Recommended Time
                    </span>
                    <span className="text-[12.5px] font-semibold text-[#a55f78] mt-0.5 block">
                      {activeTherapy.durationMins}-minute soothing session
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily:
                        "'Georgia', 'Cambria', 'Times New Roman', serif",
                    }}
                    className="text-[40px] font-normal text-ink tabular-nums leading-none"
                  >
                    {formatClock(therapySecondsLeft)}
                  </div>
                </div>
              </div>
            </div>





            <div className="pt-5 mt-6 border-t border-line/70 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setTherapyRunning((p) => !p)}
                className="flex-1 py-3 px-4 rounded-xl bg-ink hover:bg-black text-white text-[12.5px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {therapyRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause Timer</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Start {activeTherapy.durationMins}-Minute Timer</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTherapyRunning(false);
                  setTherapySecondsLeft(activeTherapy.durationMins * 60);
                }}
                aria-label="Reset therapy timer"
                className="p-3 rounded-xl bg-[#fcf9fa] border border-line text-muted hover:text-ink cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>



        <div className="border-t border-line bg-[#fcf9fa]">
          <div className="px-7 sm:px-9 py-4 border-b border-line/70 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#a55f78]">
              Section V • Cycle-Soothing Herbal Teas
            </span>
            <span className="text-[12px] text-muted">
              Simple, natural tea blends for cramps, bloating, and restful sleep
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-line">
            {BOTANICAL_ELIXIRS.map((elx) => (
              <div
                key={elx.code}
                className="p-6 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#a55f78] mb-2">
                    <span>Recipe {elx.code}</span>
                    <span>{elx.phase}</span>
                  </div>
                  <h4
                    style={{
                      fontFamily:
                        "'Georgia', 'Cambria', 'Times New Roman', serif",
                    }}
                    className="text-[16px] font-semibold text-ink mb-2"
                  >
                    {elx.name}
                  </h4>
                  <p className="text-[13px] text-muted leading-relaxed">
                    {elx.effect}
                  </p>
                </div>
                <div className="pt-3 border-t border-line/60 text-[12px] space-y-1">
                  <div className="text-muted">
                    <strong className="text-ink">Key nutrients:</strong>{" "}
                    {elx.compounds}
                  </div>
                  <div className="text-[#a55f78] font-semibold">
                    How to make: {elx.steep}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IV. 3-COLUMN INSTAGRAM-STYLE CONTINUOUS SCROLL FEED  */}


      <section className="bg-white border border-line rounded-[28px] p-6 sm:p-9 shadow-soft space-y-6">


        {/* Top Header & Search Bar */}


        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-5 border-b border-line/70">
          <div>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#a55f78] block">
              Section VI • Continuous 3-Column Scroll Feed
            </span>
            <h3
              style={{
                fontFamily: "'Georgia', 'Cambria', 'Times New Roman', serif",
              }}
              className="text-[26px] sm:text-[30px] font-normal text-ink tracking-tight mt-1"
            >
              {PROTOCOL_DB.masterLibrary.length} Symptom, Mood, Flow, Craving
              &amp; Hormone Guides
            </h3>
            <p className="text-[13.5px] text-muted mt-1">
              Scroll freely through the 3-column feed—more guides load
              automatically as you scroll down.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-[360px]">
              <Search className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any symptom, mood, or craving (e.g. cramps, sleep)..."
                className="w-full pl-11 pr-9 py-3 border border-line rounded-2xl text-[13px] bg-[#fcf9fa] text-ink outline-none focus:bg-white focus:border-[#d990a8]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>



            {/* 3-Column / 2-Column / 1-Column Switcher */}


            <div className="hidden md:inline-flex bg-[#fcf9fa] border border-line rounded-2xl p-1 shrink-0">
              {([3, 2, 1] as const).map((colCount) => (
                <button
                  key={colCount}
                  type="button"
                  onClick={() => setGridColumns(colCount)}
                  className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all cursor-pointer ${
                    gridColumns === colCount
                      ? "bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2]"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {colCount} Col
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category Filter Pills + Live Scroll Counter */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              {
                id: "All",
                label: `All Guides (${PROTOCOL_DB.masterLibrary.length})`,
              },
              { id: "Symptom Care", label: "Physical Symptoms & Body (253)" },
              {
                id: "Emotional & Mental",
                label: "Moods, Calm & Sleep (161)",
              },

              {
                id: "Food & Cravings",
                label: "Cravings, Nutrition & Teas (141)",
              },

              {
                id: "Vaginal & Flow",
                label: "Flow & Intimate Care (80)",
              },

              {
                id: "Cycle & Hormone Balance",
                label: "Hormone Balance (50)",
              },

              { id: "Saved", label: "Bookmarked" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategoryTab(tab.id)}
                className={`px-4 py-2 rounded-full text-[12px] font-bold border transition-all cursor-pointer ${
                  activeCategoryTab === tab.id
                    ? "bg-[#a55f78] text-white border-[#a55f78]"
                    : "bg-[#fcf9fa] text-muted border-line hover:text-ink hover:border-[#d990a8]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-[12px] font-semibold text-muted tabular-nums">
            Showing {visibleFeedItems.length} of {filteredLibrary.length} guides
          </span>
        </div>

        {/* 3-Column Scrollable Feed Viewport (Loads More Automatically on Scroll) */}

        {visibleFeedItems.length > 0 ? (
          <div
            onScroll={handleFeedScroll}
            className="max-h-[82vh] overflow-y-auto pr-2 scroll-smooth space-y-6"
          >
            <div
              className={`grid grid-cols-1 ${
                gridColumns === 3
                  ? "md:grid-cols-2 lg:grid-cols-3"
                  : gridColumns === 2
                    ? "md:grid-cols-2"
                    : "grid-cols-1"
              } gap-5`}
            >
              {visibleFeedItems.map((item) => {
                const Icon = item.icon;
                const isSaved = Boolean(bookmarkedIds[item.id]);
                return (
                  <div
                    key={item.id}
                    className="p-5 sm:p-6 rounded-3xl bg-[#fcf9fa] border border-line hover:border-[#d990a8] transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      
                      
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#fff0f3] border border-[#f4c2c2] text-[10px] font-extrabold text-[#a55f78] tabular-nums shrink-0">
                            {item.code}
                          </span>
                          <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted truncate">
                            {item.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleBookmark(item.id)}
                            title={
                              isSaved
                                ? "Remove bookmark"
                                : "Bookmark this guide"
                            }
                            className="w-8 h-8 rounded-full bg-white border border-line flex items-center justify-center text-muted hover:text-[#a55f78] cursor-pointer"
                          >
                            <Bookmark
                              className={`w-3.5 h-3.5 ${
                                isSaved ? "fill-[#a55f78] text-[#a55f78]" : ""
                              }`}
                              strokeWidth={1.75}
                            />
                          </button>
                          <div className="w-8 h-8 rounded-full bg-white border border-line flex items-center justify-center text-[#a55f78]">
                            <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                          </div>
                        </div>
                      </div>

                      {/* Clear Editorial Title */}

                      <h4
                        style={{
                          fontFamily:
                            "'Georgia', 'Cambria', 'Times New Roman', serif",
                        }}
                        className="text-[17px] font-semibold text-ink leading-snug"
                      >
                        {item.title}
                      </h4>

                      {/* Why Your Body Feels This Box */}

                      <div className="p-3.5 rounded-2xl bg-white border border-line/80 space-y-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#a55f78] block">
                          Why Your Body Feels This
                        </span>
                        <p className="text-[13px] text-muted leading-relaxed">
                          {item.mechanism}
                        </p>
                      </div>

                      {/* What Helps Right Now */}
                      <div className="space-y-1 pt-0.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-ink block">
                          What Helps Right Now
                        </span>
                        <p className="text-[13.5px] text-ink leading-relaxed">
                          {item.text}
                        </p>
                      </div>
                    </div>

                    {/* Helpful Daily Support Footer */}

                    <div className="pt-3 border-t border-line/70 text-[12px] leading-snug">
                      <strong className="text-[#a55f78] font-bold">
                        Helpful Support:{" "}
                      </strong>
                      <span className="text-ink font-medium">
                        {item.cofactors}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Automatic Load-More Status Indicator at Bottom of Feed */}
            
            {visibleCount < filteredLibrary.length && (
              <div className="py-4 text-center">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount((prev) =>
                      Math.min(filteredLibrary.length, prev + FEED_BATCH_SIZE),
                    )
                  }
                  className="px-5 py-2.5 rounded-full bg-[#fcf9fa] border border-line hover:border-[#d990a8] text-[12px] font-bold text-[#a55f78] cursor-pointer transition-all"
                >
                  Scroll down or tap to load more guides ({visibleCount} of{" "}
                  {filteredLibrary.length})
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-16 text-center rounded-2xl bg-[#fcf9fa] border border-dashed border-line">
            <p className="text-[15px] font-bold text-ink mb-1">
              No matching care guides found
            </p>
            <p className="text-[13px] text-muted">
              Try searching for a simpler word (like &ldquo;cramps&rdquo;,
              &ldquo;sleep&rdquo;, &ldquo;bloating&rdquo;, or
              &ldquo;chocolate&rdquo;).
            </p>
          </div>
        )}
      </section>
    </div>
  );
}