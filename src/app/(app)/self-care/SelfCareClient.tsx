"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { format } from "date-fns";
import {
  Heart,
  Coffee,
  Moon,
  Wind,
  CheckSquare,
  Square,
  Flame,
  Droplet,
  Smile,
  Activity,
  ShieldAlert,
  Sun,
  Star,
  BookOpen,
  Search,
} from "lucide-react";

type CareReminder = {
  icon: any;
  title: string;
  text: string;
  category: string;
};

type CareEntry = {
  icon: any;
  title: string;
  text: string;
};

// ============================================================================
// 1. ALL 104 SYMPTOMS FROM LOGCLIENT (9 CATEGORIES)
// ============================================================================
const SYMPTOM_REMINDERS: Record<string, CareEntry> = {
  // Menstrual/Pelvic Pain (13)
  Cramps: {
    icon: Flame,
    title: "Soothing Heat",
    text: "Place a warm heating pad on your lower belly for 20 minutes to relax contracting uterine muscles.",
  },
  "Mild cramps": {
    icon: Coffee,
    title: "Gentle Warmth",
    text: "Sip warm chamomile or ginger tea and do a few slow pelvic tilts to ease mild cramping.",
  },
  "Severe cramps": {
    icon: Flame,
    title: "Deep Pain Relief",
    text: "Rest in child's pose or fetal position with continuous heat, and take anti-inflammatory relief if needed.",
  },
  "Abdominal pain": {
    icon: Wind,
    title: "Belly Breathing",
    text: "Wear loose, soft waistbands today and practice slow diaphragmatic breathing to soften abdominal tension.",
  },
  "Pelvic pain": {
    icon: Moon,
    title: "Pelvic Floor Rest",
    text: "Elevate your knees with a pillow while lying down to take pressure off your pelvic bowl.",
  },
  "Lower-back pain": {
    icon: Flame,
    title: "Lumbar Support",
    text: "Apply a warm compress to your lower spine and try a gentle cat-cow stretch on a soft mat.",
  },
  Backache: {
    icon: Activity,
    title: "Spinal Decompression",
    text: "Avoid heavy lifting today; rest your back against a supportive pillow and use a warm bath to loosen tight muscles.",
  },
  "Heavy-feeling pelvis": {
    icon: Moon,
    title: "Legs-Up-The-Wall",
    text: "Lie on your back and rest your legs vertically against a wall for 10 minutes to drain pelvic congestion.",
  },
  "Painful bowel movements": {
    icon: Coffee,
    title: "Digestive Ease",
    text: "Drink plenty of warm water, eat soluble fiber, and use a footstool while sitting on the toilet to relax the pelvic floor.",
  },
  "Ovary pain": {
    icon: Flame,
    title: "Targeted Warmth",
    text: "One-sided ovulation twinges (mittelschmerz) respond well to a warm bath and gentle hydration.",
  },
  "Vulvar pain": {
    icon: Heart,
    title: "Breathable Comfort",
    text: "Wear 100% breathable cotton underwear, avoid tight clothing, and use a cool or warm sitz bath for relief.",
  },
  "Uterine spasms": {
    icon: Coffee,
    title: "Magnesium & Warmth",
    text: "Magnesium-rich foods (like dark chocolate or spinach) plus a hot water bottle can calm spasming smooth muscle.",
  },
  "Pelvic pressure": {
    icon: Moon,
    title: "Horizontal Rest",
    text: "Take breaks from standing for long periods; lying on your side with a pillow between your knees eases pressure.",
  },

  // General Pain (11)
  Headache: {
    icon: Droplet,
    title: "Dim Lights & Hydrate",
    text: "Drink a tall glass of water with electrolytes, lower your screen brightness, and massage your temples.",
  },
  Migraine: {
    icon: Moon,
    title: "Dark Sensory Retreat",
    text: "Retreat to a quiet, dark room with a cool compress over your forehead and eyes.",
  },
  "Body aches": {
    icon: Flame,
    title: "Warm Soak",
    text: "A warm shower or Epsom salt bath will boost circulation and ease full-body prostaglandin aches.",
  },
  "Muscle pain": {
    icon: Activity,
    title: "Gentle Release",
    text: "Skip high-impact training today; opt for light foam rolling or a warm compress on sore muscles.",
  },
  "Joint pain": {
    icon: Coffee,
    title: "Anti-Inflammatory Care",
    text: "Turmeric or ginger tea and gentle range-of-motion movements will help lubricate stiff joints.",
  },
  "Tender breasts": {
    icon: Heart,
    title: "Supportive Comfort",
    text: "Wear a soft, wire-free bralette or sports bra today and reduce extra salt and caffeine to ease tenderness.",
  },
  "Breast swelling": {
    icon: Droplet,
    title: "Lymphatic Care",
    text: "Hormonal fluid retention is normal right now; wear non-restrictive tops and stay well-hydrated.",
  },
  "Neck pain": {
    icon: Wind,
    title: "Neck Rolls & Heat",
    text: "Drop your shoulders away from your ears and do slow, gentle ear-to-shoulder stretches.",
  },
  "Shoulder pain": {
    icon: Flame,
    title: "Upper Body Unwind",
    text: "Drape a warm towel over your shoulders and unclench your jaw to release upper-body tension.",
  },
  "Leg cramps": {
    icon: Activity,
    title: "Calf Stretch & Minerals",
    text: "Gently flex your toes upward to stretch the calf, and eat potassium- or magnesium-rich snacks like bananas.",
  },
  "Joint stiffness": {
    icon: Sun,
    title: "Morning Mobility",
    text: "Start slowly with warm water and gentle ankle, wrist, and hip circles before getting into your day.",
  },

  // Digestive (14)
  Bloating: {
    icon: Coffee,
    title: "Peppermint & Potassium",
    text: "Sip peppermint or fennel tea and avoid carbonated drinks to gently reduce hormonal water retention.",
  },
  Gas: {
    icon: Activity,
    title: "Wind-Relieving Pose",
    text: "Hug your knees to your chest while lying on your back and rock gently side to side to help trapped gas pass.",
  },
  Nausea: {
    icon: Coffee,
    title: "Ginger & Small Sips",
    text: "Sip cold water or ginger tea slowly and stick to bland, easy-to-digest snacks like crackers or toast.",
  },
  Vomiting: {
    icon: Droplet,
    title: "Electrolyte Recovery",
    text: "Rest your stomach for 30 minutes, then take tiny sips of electrolyte water or clear broth.",
  },
  Diarrhea: {
    icon: Droplet,
    title: "BRAT & Replenish",
    text: "Prostaglandins can speed up digestion; focus on bananas, rice, applesauce, toast, and steady fluids.",
  },
  Constipation: {
    icon: Droplet,
    title: "Warm Water & Fiber",
    text: "Progesterone can slow the gut; start with a warm glass of lemon water, berries, chia seeds, and a short walk.",
  },
  "Appetite change": {
    icon: Heart,
    title: "Intuitive Nourishment",
    text: "Your metabolic needs shift across your cycle—listen to your hunger cues without judgment.",
  },
  "Increased appetite": {
    icon: Coffee,
    title: "Luteal Fueling",
    text: "Your body burns extra calories before your period! Pair complex carbs with protein and healthy fats to stay satisfied.",
  },
  "Reduced appetite": {
    icon: Coffee,
    title: "Nutrient-Dense Mini Meals",
    text: "If big meals feel unappealing, try smoothies, soups, or a handful of nuts to keep blood sugar steady.",
  },
  Indigestion: {
    icon: Wind,
    title: "Upright Rest",
    text: "Eat slowly, avoid lying flat right after meals, and take a slow 10-minute stroll to aid digestion.",
  },
  Heartburn: {
    icon: Moon,
    title: "Cool & Elevated",
    text: "Skip spicy or acidic foods tonight and prop your head up with an extra pillow when resting.",
  },
  "Food aversion": {
    icon: Heart,
    title: "Zero Food Guilt",
    text: "Eat whatever safe, simple comfort foods appeal to you today—fed is best.",
  },
  "Stomach cramps": {
    icon: Flame,
    title: "Soothing Belly Care",
    text: "Drink warm chamomile tea and rest a warm hand or heating pad over your midsection.",
  },
  "Gurgling stomach": {
    icon: Coffee,
    title: "Settle the Gut",
    text: "A warm cup of herbal tea and a light, plain snack can calm an overactive digestive tract.",
  },

  // Energy/Sleep (14)
  Fatigue: {
    icon: Moon,
    title: "Honor Your Battery",
    text: "Your body is doing heavy internal work. Cancel one non-essential task today and rest.",
  },
  Lethargy: {
    icon: Sun,
    title: "Gentle Sunlight",
    text: "Open the curtains for natural light and drink a glass of water—no pressure to be hyper-productive.",
  },
  "Low energy": {
    icon: Moon,
    title: "Pacing & Conservation",
    text: "Swap high-intensity workouts for restorative stretching or a 20-minute power nap.",
  },
  Weakness: {
    icon: Coffee,
    title: "Iron & Steady Carbs",
    text: "Nourish yourself with iron-rich foods paired with vitamin C (like spinach with lemon) and sit down whenever needed.",
  },
  Sleepiness: {
    icon: Moon,
    title: "Early Wind-Down",
    text: "Give yourself permission to get into bed 45 minutes earlier tonight.",
  },
  Insomnia: {
    icon: Wind,
    title: "Cool Room & 4-7-8 Breath",
    text: "Hormonal temperature shifts can block sleep; lower the room temperature and breathe out twice as long as you breathe in.",
  },
  "Poor sleep": {
    icon: Moon,
    title: "Screen-Free Buffer",
    text: "Dim overhead lights an hour before bed and swap scrolling for soothing audio or reading.",
  },
  "Disrupted sleep": {
    icon: Moon,
    title: "Gentle Today",
    text: "After a fragmented night, go easy on caffeine after 2 PM and take short eyes-closed breaks.",
  },
  "Restless legs": {
    icon: Activity,
    title: "Evening Leg Massage",
    text: "Stretch your calves and hamstrings before bed and try a warm bath or magnesium lotion on your legs.",
  },
  "Frequent waking": {
    icon: Moon,
    title: "Blood Sugar Balance",
    text: "A small protein-rich bedtime snack can prevent nighttime cortisol spikes that wake you up.",
  },
  "Vivid dreams": {
    icon: Wind,
    title: "Morning Grounding",
    text: "Luteal hormone surges often trigger intense dreams; take 3 deep breaths and plant your feet on the floor to ground yourself.",
  },
  Nightmares: {
    icon: Heart,
    title: "Safe & Grounded",
    text: "Remind yourself you are safe in the present moment; sip some water and play calming sounds before sleeping.",
  },
  "Difficulty falling asleep": {
    icon: Wind,
    title: "Brain Dump Journal",
    text: "Write down tomorrow's to-do list on paper so your mind knows it has permission to switch off.",
  },
  Oversleeping: {
    icon: Sun,
    title: "No Guilt Recovery",
    text: "If your body slept extra hours, it needed the repair. Hydrate and step into natural daylight.",
  },

  // Neurological (11)
  Dizziness: {
    icon: Droplet,
    title: "Sit & Hydrate",
    text: "Stand up slowly from sitting or lying down, and drink water with a pinch of salt and fruit juice.",
  },
  "Light-headedness": {
    icon: Coffee,
    title: "Steady Blood Sugar",
    text: "Have a quick, nourishing snack with protein and carbs, and rest your head between your knees if needed.",
  },
  "Brain fog": {
    icon: CheckSquare,
    title: "Single-Tasking",
    text: "Write things down instead of relying on working memory today, and tackle just one small thing at a time.",
  },
  "Difficulty concentrating": {
    icon: Wind,
    title: "Pomodoro & Grace",
    text: "Work in gentle 15-minute blocks followed by a break—don't fight your brain's natural rhythm.",
  },
  Forgetfulness: {
    icon: CheckSquare,
    title: "Externalize Reminders",
    text: "Use phone alarms and sticky notes today, and offer yourself patience.",
  },
  "Sensitivity to light": {
    icon: Moon,
    title: "Soft Lighting",
    text: "Switch devices to night/warm mode, wear sunglasses outdoors, and use lamps instead of overhead lights.",
  },
  "Sensitivity to sound": {
    icon: Wind,
    title: "Quiet Sanctuary",
    text: "Use noise-canceling headphones, earplugs, or soft brown noise to buffer overwhelming environments.",
  },
  Clumsiness: {
    icon: Activity,
    title: "Slow Your Pace",
    text: "Hormonal shifts can briefly affect proprioception; move mindfully and take your time on stairs.",
  },
  Sluggishness: {
    icon: Droplet,
    title: "Fresh Air & Water",
    text: "Step outside for 2 minutes of fresh air and a cold glass of water to gently wake up your system.",
  },
  Tingling: {
    icon: Activity,
    title: "Circulation Check",
    text: "Uncross your legs, shake out your hands and feet, and do gentle ankle and wrist rotations.",
  },
  Numbness: {
    icon: ShieldAlert,
    title: "Change Posture & Monitor",
    text: "Loosen tight clothing and shift positions; if numbness is sudden or persistent, check in with a doctor.",
  },

  // Skin/Body (16)
  Acne: {
    icon: Droplet,
    title: "Gentle Skin Barrier Care",
    text: "Resist picking! Use a gentle cleanser, a hydrocolloid pimple patch, and a fresh pillowcase tonight.",
  },
  "Oily skin": {
    icon: Droplet,
    title: "Lightweight Hydration",
    text: "Progesterone boosts sebum; use a light gel moisturizer rather than harsh stripping washes.",
  },
  "Dry skin": {
    icon: Droplet,
    title: "Moisture Lock",
    text: "Lower estrogen can dry the skin; apply moisturizer to damp skin right after showering and drink extra water.",
  },
  "Dry eyes": {
    icon: Moon,
    title: "20-20-20 Screen Rule",
    text: "Every 20 minutes, look 20 feet away for 20 seconds and blink slowly, or use lubricating eye drops.",
  },
  "Hot flashes": {
    icon: Wind,
    title: "Layered Cooling",
    text: "Dress in breathable layers, keep ice water nearby, and place a cool damp cloth on the back of your neck.",
  },
  "Night sweats": {
    icon: Moon,
    title: "Breathable Bedding",
    text: "Sleep in light cotton or bamboo fabrics and keep a glass of cool water on your nightstand.",
  },
  Sweating: {
    icon: Droplet,
    title: "Mineral Replenishment",
    text: "Replenish lost fluids with coconut water or electrolytes and wear loose, airy clothing.",
  },
  Chills: {
    icon: Flame,
    title: "Cozy Layers",
    text: "Put on warm socks, wrap up in a blanket, and sip a hot beverage to stabilize your core temperature.",
  },
  Fever: {
    icon: ShieldAlert,
    title: "Rest & Monitor Temp",
    text: "Prioritize complete rest, stay hydrated, and consult a healthcare provider if your fever persists.",
  },
  "Water retention": {
    icon: Droplet,
    title: "Flush With Water",
    text: "Drinking more water actually tells your body it's safe to release stored fluid; elevate your feet when sitting.",
  },
  "Puffy face": {
    icon: Droplet,
    title: "Cool Splash & Lymph Drainage",
    text: "Splash cool water on your face and gently sweep your fingers from the center of your face outward toward your ears.",
  },
  "Swollen fingers": {
    icon: Droplet,
    title: "Remove Tight Rings",
    text: "Slip off tight jewelry for the day, raise your hands above heart level briefly, and cut back on salty snacks.",
  },
  "Swollen ankles": {
    icon: Moon,
    title: "Elevate Your Feet",
    text: "Prop your ankles up on pillows while resting and do 10 slow ankle pumps to move fluid upward.",
  },
  "Hair thinning": {
    icon: Heart,
    title: "Gentle Scalp Care",
    text: "Avoid tight hairstyles today, use a wide-tooth comb, and focus on protein, iron, and stress reduction.",
  },
  "Brittle nails": {
    icon: Heart,
    title: "Cuticle & Hand Care",
    text: "Massage a drop of oil or thick cream into your nails and wear gloves when washing dishes.",
  },
  "Body odor changes": {
    icon: Droplet,
    title: "Natural Refresh",
    text: "Hormonal shifts naturally change apocrine sweat; a quick shower and breathable cotton fabrics will keep you fresh.",
  },

  // Urinary/Vaginal (8)
  "Vaginal itching": {
    icon: ShieldAlert,
    title: "Unscented & Breathable",
    text: "Rinse only with plain warm water (no scented soaps) and wear loose cotton underwear. See a doctor if it persists.",
  },
  "Vaginal dryness": {
    icon: Droplet,
    title: "Extra Hydration & Care",
    text: "Low estrogen days can cause dryness; stay hydrated and use a water-based, pH-balanced moisturizer if needed.",
  },
  "Urinary discomfort": {
    icon: Droplet,
    title: "Flush Your Bladder",
    text: "Drink plenty of plain water and avoid holding your pee; seek medical advice if burning continues.",
  },
  "Painful urination": {
    icon: ShieldAlert,
    title: "UTI Check & Hydration",
    text: "Drink water steadily, avoid caffeine/citrus irritants, and contact a doctor to rule out a urinary tract infection.",
  },
  "Urinary frequency": {
    icon: Droplet,
    title: "Pelvic Relaxation",
    text: "Hormonal fluid shifts or uterine pressure can increase trips to the bathroom; lean slightly forward when emptying your bladder.",
  },
  "Pain during sex": {
    icon: Heart,
    title: "Communicate & Go Slow",
    text: "Never push through pain. Pause, use plenty of lubricant, prioritize gentle intimacy, and consult a provider if recurring.",
  },
  "Unusual discharge": {
    icon: ShieldAlert,
    title: "Track & Observe",
    text: "Keep the area clean and dry with cotton underwear, and book a quick checkup if accompanied by itching or fever.",
  },
  "Strong odor": {
    icon: ShieldAlert,
    title: "Gentle pH Care",
    text: "Avoid douching (which disrupts natural flora); rinse externally with water and check in with a doctor if fishy or persistent.",
  },

  // Emotional & Mental (10)
  "Mood swings": {
    icon: Wind,
    title: "Ride the Wave",
    text: "Your neurochemistry is shifting with your hormones. Pause before reacting and give yourself 10 minutes of quiet space.",
  },
  Irritability: {
    icon: Wind,
    title: "Sensory Decompression",
    text: "Step away from noise and demands for 15 minutes; jaw-clenching and irritability are signs your nervous system is overstimulated.",
  },
  Anxiety: {
    icon: Wind,
    title: "Box Breathing Reset",
    text: "Inhale for 4s, hold for 4s, exhale for 4s, hold for 4s. Repeat 5 times to activate your vagus nerve.",
  },
  Sadness: {
    icon: Heart,
    title: "Self-Compassion Break",
    text: "Place a hand over your heart. It's okay to feel heavy today—watch a comfort show or wrap up in a warm blanket.",
  },
  Tearfulness: {
    icon: Droplet,
    title: "Let the Tears Flow",
    text: "Crying literally releases stress hormones like cortisol. Let it out without apologizing, then drink a glass of water.",
  },
  "Feeling overwhelmed": {
    icon: CheckSquare,
    title: "Rule of One",
    text: "Cross everything off your mental list except the single next tiny step. You don't have to solve the whole day right now.",
  },
  Paranoia: {
    icon: Heart,
    title: "Fact-Check With Kindness",
    text: "Luteal progesterone drops can amplify threat perception. Ground yourself in 5 things you can see and touch right now.",
  },
  "Intrusive thoughts": {
    icon: Wind,
    title: "Clouds in the Sky",
    text: "A thought is just a mental event, not a fact. Notice it passing by without judging yourself for having it.",
  },
  "Rejection sensitive": {
    icon: Heart,
    title: "Reassurance Reminder",
    text: "Hormonal dips can make neutral comments feel like rejection. Delay big relationship talks until you've rested and eaten.",
  },
  Apathy: {
    icon: Sun,
    title: "Low-Stakes Comfort",
    text: "When you feel flat or disconnected, don't force excitement. Sit in the sun or listen to a familiar playlist.",
  },

  // Immunity & Cold (6)
  "Sore throat": {
    icon: Coffee,
    title: "Warm Salt Gargle & Honey",
    text: "Gargle with warm salt water and sip herbal tea with honey to coat and soothe your throat.",
  },
  "Runny nose": {
    icon: Coffee,
    title: "Steam & Fluids",
    text: "Take a steamy shower and keep warm herbal tea nearby to thin mucus and stay hydrated.",
  },
  Cough: {
    icon: Wind,
    title: "Humidified Rest",
    text: "Prop your upper body up with pillows and sip warm water with honey to calm your airway.",
  },
  Congestion: {
    icon: Flame,
    title: "Warm Compress & Steam",
    text: "Place a warm, damp washcloth over your sinuses and inhale steam from a hot mug of tea.",
  },
  Sneezing: {
    icon: Heart,
    title: "Immune Support",
    text: "Period flu or seasonal allergies can flare before menstruation; rest up and get extra vitamin C.",
  },
  "Swollen lymph nodes": {
    icon: Moon,
    title: "Deep Immune Rest",
    text: "Your immune system is working hard. Skip workouts today, hydrate, and prioritize early sleep.",
  },
};

// ============================================================================
// 2. ALL 61 MOODS FROM LOGCLIENT
// ============================================================================
const MOOD_REMINDERS: Record<string, CareEntry> = {
  Fine: {
    icon: Smile,
    title: "Steady Baseline",
    text: "You're feeling balanced today—maintain your rhythm with regular water and mindful breaks.",
  },
  Normal: {
    icon: Smile,
    title: "Consistent Flow",
    text: "Enjoy a steady, normal day! Keep nourishing your body with balanced meals and hydration.",
  },
  Calm: {
    icon: Wind,
    title: "Savor the Stillness",
    text: "Protect your peaceful energy today by setting gentle boundaries with your time.",
  },
  Happy: {
    icon: Sun,
    title: "Bottle This Joy",
    text: "Write down one sentence in your journal about what made you smile today so you can revisit it later.",
  },
  Sad: {
    icon: Heart,
    title: "Gentle Comfort",
    text: "Treat yourself like a dear friend who is feeling down—warm tea, soft clothes, and zero pressure.",
  },
  Confused: {
    icon: CheckSquare,
    title: "Pause Big Decisions",
    text: "When clarity is low, give yourself permission to sleep on decisions rather than forcing an answer today.",
  },
  Anxious: {
    icon: Wind,
    title: "5-4-3-2-1 Grounding",
    text: "Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you appreciate.",
  },
  Irritable: {
    icon: Wind,
    title: "Protect Your Space",
    text: "Lower sensory input—dim lights, silence notifications for an hour, and unclench your jaw.",
  },
  Hyperactive: {
    icon: Activity,
    title: "Channel the Spark",
    text: "Burn off restless energy with a brisk walk, dance break, or tackling an active project.",
  },
  Tired: {
    icon: Moon,
    title: "Micro-Rest Break",
    text: "Close your eyes for 10 minutes without screens—even quiet wakeful rest recharges the brain.",
  },
  Emotional: {
    icon: Heart,
    title: "Honor Your Sensitivity",
    text: "Your heart is close to the surface today. Avoid harsh news or stressful conversations if you can.",
  },
  Crying: {
    icon: Droplet,
    title: "Post-Cry Care",
    text: "Wash your face with cool water, place a cool spoon over puffy eyes, and drink a full glass of water.",
  },
  Peaceful: {
    icon: Wind,
    title: "Mindful Presence",
    text: "Take three slow breaths and soak in this sense of inner quiet.",
  },
  Content: {
    icon: Heart,
    title: "Gratitude Anchor",
    text: "Notice the simple comforts around you right now and let your nervous system rest in contentment.",
  },
  Excited: {
    icon: Star,
    title: "Ride the Momentum",
    text: "Follicular or ovulatory energy can feel electric—channel it into creative plans while remembering to eat and hydrate!",
  },
  Affectionate: {
    icon: Heart,
    title: "Connection Time",
    text: "Reach out for a long hug, cuddle a pet, or send a warm message to someone you love.",
  },
  Playful: {
    icon: Smile,
    title: "Make Time for Fun",
    text: "Lean into lightness today—play music, joke around, and enjoy not taking everything seriously.",
  },
  Lonely: {
    icon: Heart,
    title: "Gentle Reach-Out",
    text: "Text a trusted friend or partner just to say hi, or spend time in a cozy café around gentle background activity.",
  },
  Overwhelmed: {
    icon: Wind,
    title: "Triage Your Day",
    text: "Pick the 1 thing that truly matters today and let the rest wait until tomorrow.",
  },
  Stressed: {
    icon: Wind,
    title: "Physiological Sigh",
    text: "Take two quick inhales through the nose, followed by one long, slow exhale through the mouth to lower heart rate.",
  },
  Angry: {
    icon: Activity,
    title: "Safe Physical Release",
    text: "Anger is energy that needs to move—shake out your limbs, go for a fast walk, or vent into your private journal.",
  },
  Frustrated: {
    icon: Wind,
    title: "Step Away & Reset",
    text: "Walk away from whatever is blocking you for 10 minutes and grab a glass of cold water.",
  },
  Restless: {
    icon: Activity,
    title: "Stretch & Shake",
    text: "Stand up, stretch your arms overhead, and do 15 minutes of light movement to settle fidgety energy.",
  },
  Sensitive: {
    icon: Heart,
    title: "Soft Boundaries",
    text: "Wrap yourself in a metaphorical bubble today—it's okay to say 'I need some quiet time tonight.'",
  },
  Tearful: {
    icon: Heart,
    title: "Be Extra Kind to Yourself",
    text: "Keep tissues and warm tea close, and lower the bar for what 'productive' looks like today.",
  },
  Hopeful: {
    icon: Sun,
    title: "Plant a Seed",
    text: "Use this bright outlook to set one gentle intention for the week ahead.",
  },
  Motivated: {
    icon: CheckSquare,
    title: "High-Focus Window",
    text: "Tackle the task you've been procrastinating on while your natural drive is peaking!",
  },
  Unmotivated: {
    icon: Moon,
    title: "The 2-Minute Rule",
    text: "Don't force a marathon. Do just 2 minutes of an easy task, or simply embrace a guilt-free rest day.",
  },
  Insecure: {
    icon: Heart,
    title: "Inner Critic Detox",
    text: "Hormonal dips can distort self-image. Wear your most comfortable outfit and speak to yourself with warmth.",
  },
  Confident: {
    icon: Star,
    title: "Own Your Power",
    text: "Your energy is magnetic today—great time for important conversations, presentations, or bold choices.",
  },
  Numb: {
    icon: Coffee,
    title: "Gentle Sensory Awakening",
    text: "Hold a warm mug, smell something soothing like lavender or coffee, or take a warm shower to reconnect with your body.",
  },
  Disappointed: {
    icon: Heart,
    title: "Validate the Letdown",
    text: "Acknowledge that it hurts when things don't go as hoped, then treat yourself to something comforting.",
  },
  Grateful: {
    icon: Heart,
    title: "Savor the Good",
    text: "Share your appreciation with someone today or jot down 3 small wins in your journal.",
  },
  Relaxed: {
    icon: Moon,
    title: "Stay Unrushed",
    text: "Move at an unhurried pace today to keep your parasympathetic nervous system in charge.",
  },
  Bored: {
    icon: Sun,
    title: "Novelty Spark",
    text: "Change your scenery, try a new recipe or playlist, or take a different route on a short walk.",
  },
  Joyful: {
    icon: Sun,
    title: "Celebrate Your Spark",
    text: "Put on your favorite song and let yourself fully enjoy feeling good in your body.",
  },
  Proud: {
    icon: Star,
    title: "Acknowledge Your Effort",
    text: "Take a moment to celebrate how far you've come and what you've handled recently.",
  },
  Inspired: {
    icon: Star,
    title: "Capture Your Ideas",
    text: "Open your journal or notes app and jot down your creative sparks before they fade.",
  },
  Curious: {
    icon: Sun,
    title: "Explore & Learn",
    text: "Follow your curiosity today—read an article in the Education tab or dive into a topic you love.",
  },
  Homesick: {
    icon: Coffee,
    title: "Familiar Comforts",
    text: "Cook a nostalgic meal, call someone from home, or watch a favorite childhood movie.",
  },
  Rejected: {
    icon: Heart,
    title: "Self-Worth Anchor",
    text: "Your value isn't defined by one moment or person. Wrap yourself in comfort and reach out to someone who cherishes you.",
  },
  Panicky: {
    icon: Droplet,
    title: "Cold Water Dive Reflex",
    text: "Splash cold water on your face or hold an ice cube—this instantly signals your vagus nerve to slow a racing heart.",
  },
  Tense: {
    icon: Activity,
    title: "Progressive Muscle Release",
    text: "Squeeze your shoulders, hands, and toes tight for 5 seconds, then exhale and let them drop completely limp.",
  },
  Annoyed: {
    icon: Wind,
    title: "Take a Breather",
    text: "Put in headphones, step outside for fresh air, and give yourself space from minor irritations.",
  },
  Resentful: {
    icon: Heart,
    title: "Boundary Check",
    text: "Resentment often signals you've been over-giving. Ask yourself: 'What do I need to say no to right now?'",
  },
  Impatient: {
    icon: Wind,
    title: "Slow the Tempo",
    text: "Unclench your hands, lengthen your exhales, and remind yourself that not everything is an emergency.",
  },
  Indecisive: {
    icon: CheckSquare,
    title: "Reduce Choice Fatigue",
    text: "Simplify today's choices—eat a go-to meal, wear a favorite outfit, and save big decisions for another day.",
  },
  Distracted: {
    icon: CheckSquare,
    title: "Clear the Clutter",
    text: "Close extra browser tabs, put your phone in another room for 20 minutes, and focus on one thing.",
  },
  Forgetful: {
    icon: CheckSquare,
    title: "Be Your Own Assistant",
    text: "Write down appointments and tasks immediately today, and laugh it off gently.",
  },
  Drained: {
    icon: Moon,
    title: "Energy Boundaries",
    text: "Say no to draining social obligations tonight and prioritize a quiet evening recharge.",
  },
  Exhausted: {
    icon: Moon,
    title: "Full Permission to Stop",
    text: "Leave the dishes for tomorrow, get into pajamas early, and let your body rest deeply.",
  },
  Guilty: {
    icon: Heart,
    title: "Release False Guilt",
    text: "Resting, having needs, or not being 100% productive is part of being human—forgive yourself.",
  },
  Embarrassed: {
    icon: Heart,
    title: "Perspective Shift",
    text: "Everyone has awkward moments; no one is thinking about it as much as you are. Offer yourself a warm smile.",
  },
  Vulnerable: {
    icon: Heart,
    title: "Safe Harbor",
    text: "Surround yourself with safe, gentle people and environments today, or journal what's on your heart.",
  },
  Frisky: {
    icon: Heart,
    title: "Playful Intimacy",
    text: "Ovulatory or mid-cycle hormones often boost desire—enjoy solo pleasure or connect with your partner!",
  },
  Flirty: {
    icon: Smile,
    title: "Confidence Glow",
    text: "Lean into your natural magnetism today and send a playful note to your partner.",
  },
  Sensual: {
    icon: Heart,
    title: "Embodied Pleasure",
    text: "Indulge your senses—soft fabrics, warm bath oil, slow music, and mindful touch.",
  },
  Optimistic: {
    icon: Sun,
    title: "Forward Momentum",
    text: "Channel this bright energy into planning something you're excited to look forward to.",
  },
  Pessimistic: {
    icon: Wind,
    title: "Hormonal Lens Check",
    text: "Remember that luteal hormone dips can tint your outlook gray—things will look brighter in a few days.",
  },
  Apathetic: {
    icon: Coffee,
    title: "Zero-Pressure Routine",
    text: "Stick to basic self-care (water, a simple meal, fresh air) without forcing yourself to feel peppy.",
  },
  Nostalgic: {
    icon: Heart,
    title: "Sweet Reflection",
    text: "Look through favorite photos or journal about a cherished memory while enjoying a warm drink.",
  },
};

// ============================================================================
// 3. FLOW INTENSITY & PERIOD PARAMETERS FROM LOGCLIENT
// ============================================================================
const FLOW_REMINDERS: Record<string, CareEntry> = {
  "Very heavy": {
    icon: Droplet,
    title: "Heavy Flow Replenishment",
    text: "Prioritize iron-rich foods (lentils, spinach, red meat) with vitamin C, hydrate with electrolytes, and change protection every 2–3 hours.",
  },
  Heavy: {
    icon: Droplet,
    title: "Iron & Rest Focus",
    text: "Keep extra pads/tampons handy, drink plenty of water, and take it easy on strenuous standing today.",
  },
  Medium: {
    icon: Droplet,
    title: "Steady Cycle Care",
    text: "Maintain comfortable protection, sip warm herbal teas, and listen to your body's energy cues.",
  },
  Low: {
    icon: Droplet,
    title: "Light Flow Comfort",
    text: "Light protection or period underwear works great today—keep hydrating as your lining finishes shedding.",
  },
  Spotting: {
    icon: Droplet,
    title: "Liner & Observation",
    text: "Wear a breathable cotton liner; mid-cycle spotting can happen around ovulation or hormone shifts.",
  },
  "No bleeding": {
    icon: Sun,
    title: "Non-Bleeding Phase",
    text: "Enjoy your bleed-free day and nourish yourself according to your current cycle phase!",
  },
};

// ============================================================================
// 4. ALL 24 VAGINAL DISCHARGE TYPES FROM LOGCLIENT
// ============================================================================
const DISCHARGE_REMINDERS: Record<string, CareEntry> = {
  "No discharge": {
    icon: Sun,
    title: "Dry Phase Care",
    text: "Low-mucus days are common right after your period or in the late luteal phase—wear breathable cotton underwear.",
  },
  Creamy: {
    icon: Droplet,
    title: "Healthy Progesterone Sign",
    text: "Creamy discharge is very common in the luteal or early follicular phase; keep wearing breathable cotton.",
  },
  Watery: {
    icon: Droplet,
    title: "Rising Estrogen",
    text: "Watery fluid often signals rising estrogen as you approach your fertile window; a light cotton liner can keep you comfortable.",
  },
  "Yellow-Bright": {
    icon: ShieldAlert,
    title: "Observe & Hydrate",
    text: "Slight yellow tint can happen when discharge oxidizes on fabric, but monitor for any itching or odor.",
  },
  Sticky: {
    icon: Droplet,
    title: "Early/Late Cycle Mucus",
    text: "Sticky cervical fluid is normal during low-fertility days—stay hydrated and wear airy fabrics.",
  },
  "Egg-white-like": {
    icon: Star,
    title: "Peak Fertility Sign",
    text: "Clear, stretchy egg-white cervical mucus is a classic sign of ovulation and healthy estrogen levels!",
  },
  Spotting: {
    icon: Droplet,
    title: "Light Spotting Care",
    text: "Use a breathable pantyliner and note whether you're near ovulation or the start/end of your Moonday.",
  },
  Unusual: {
    icon: ShieldAlert,
    title: "Medical Check Recommended",
    text: "Whenever discharge looks or feels unusual for your baseline, avoid scented products and consider checking in with a gynecologist.",
  },
  "Clumpy white": {
    icon: ShieldAlert,
    title: "Yeast Balance Check",
    text: "Clumpy white discharge (especially with itching) can indicate a yeast imbalance; wear loose cotton and consult a doctor or pharmacist.",
  },
  Gray: {
    icon: ShieldAlert,
    title: "BV Screening Reminder",
    text: "Grayish discharge can be a sign of bacterial vaginosis (BV); book a quick, easy swab with your healthcare provider.",
  },
  Milky: {
    icon: Droplet,
    title: "Normal Vaginal Self-Cleaning",
    text: "Milky smooth fluid is a healthy sign of your body naturally cleansing and moisturizing itself.",
  },
  Clumpy: {
    icon: ShieldAlert,
    title: "pH & Flora Care",
    text: "Avoid tight synthetic leggings today, rinse only with plain water, and monitor for any irritation.",
  },
  "Quick-drying": {
    icon: Droplet,
    title: "Low-Estrogen Mucus",
    text: "Quick-drying fluid is normal outside your fertile window; drink plenty of water.",
  },
  Thick: {
    icon: Droplet,
    title: "Luteal Barrier Mucus",
    text: "Thick cervical mucus naturally forms under progesterone's influence—completely normal.",
  },
  "Lotion-like": {
    icon: Droplet,
    title: "Smooth Hormone Transition",
    text: "Lotion-like discharge is a classic, healthy mid-to-late cycle observation.",
  },
  Clear: {
    icon: Star,
    title: "Estrogen Hydration",
    text: "Clear fluid reflects well-hydrated cervical glands and rising estrogen.",
  },
  Cloudy: {
    icon: Droplet,
    title: "Standard Cycle Fluid",
    text: "Cloudy white/off-white fluid is typical throughout non-ovulatory days.",
  },
  Yellowish: {
    icon: ShieldAlert,
    title: "Airy Fabrics & Watch",
    text: "Normal discharge often dries yellowish on underwear; if accompanied by burning or odor, check in with a doctor.",
  },
  Brownish: {
    icon: Droplet,
    title: "Old Blood Clearing",
    text: "Brownish discharge is simply older, oxidized blood making its way out at the start or tail end of your period.",
  },
  Pinkish: {
    icon: Droplet,
    title: "Light Cervical Tint",
    text: "Pinkish fluid mixes a tiny drop of fresh blood with cervical mucus—common around ovulation or period onset.",
  },
  "Blood-tinged": {
    icon: Droplet,
    title: "Cycle Transition",
    text: "Keep a liner handy as your body either gears up for or finishes a bleed, or navigates ovulation.",
  },
  "Jelly-like": {
    icon: Droplet,
    title: "Cervical Mucus Plug/Surge",
    text: "Thick jelly-like mucus can appear around hormone transitions; stay well-hydrated.",
  },
  Stretchy: {
    icon: Star,
    title: "Fertile Window Indicator",
    text: "Stretchy mucus shows high estrogen and approaching ovulation!",
  },
  Dry: {
    icon: Droplet,
    title: "Internal & External Hydration",
    text: "Drink extra water today and avoid harsh soaps around the vulva.",
  },
};

// ============================================================================
// 5. ALL 41 CRAVINGS FROM LOGCLIENT
// ============================================================================
const CRAVING_REMINDERS: Record<string, CareEntry> = {
  Sweet: {
    icon: Coffee,
    title: "Pair Sweets with Protein",
    text: "Enjoy something sweet paired with Greek yogurt, nuts, or seeds to keep your blood sugar from crashing.",
  },
  Chocolate: {
    icon: Heart,
    title: "Dark Chocolate Magnesium",
    text: "70%+ dark chocolate is rich in magnesium, which genuinely helps relax cramping muscles and boost serotonin!",
  },
  Salty: {
    icon: Droplet,
    title: "Mineral & Electrolyte Check",
    text: "Salty cravings can signal mineral needs; enjoy lightly salted nuts, olives, or popcorn alongside a big glass of water.",
  },
  Spicy: {
    icon: Flame,
    title: "Endorphin Kick",
    text: "Spicy foods trigger endorphins! Enjoy them earlier in the day if you're prone to luteal heartburn.",
  },
  Sour: {
    icon: Sun,
    title: "Citrus & Refreshment",
    text: "Try lemon/lime water, berries, or fermented foods to satisfy sour cravings and boost vitamin C.",
  },
  "Crunchy snacks": {
    icon: Activity,
    title: "Jaw Tension Release",
    text: "Craving crunch often links to stress stored in the jaw—enjoy carrots, hummus, apples, or roasted chickpeas!",
  },
  "Savory snacks": {
    icon: Coffee,
    title: "Umami Nourishment",
    text: "Satisfy savory cravings with eggs, avocado toast, roasted nuts, or warm broth.",
  },
  Dairy: {
    icon: Heart,
    title: "Calcium Comfort",
    text: "Calcium helps ease PMS mood and cramp symptoms—enjoy yogurt, kefir, or a warm latte.",
  },
  Beverages: {
    icon: Droplet,
    title: "Sip & Hydrate",
    text: "Treat yourself to a fun mocktail, iced herbal tea, or infused sparkling water.",
  },
  "Energy drinks": {
    icon: Moon,
    title: "Gentle Energy Swap",
    text: "High caffeine can spike anxiety and cramps; consider matcha, B-vitamins, or a short rest if you're running on empty.",
  },
  "Caffeinated drinks": {
    icon: Coffee,
    title: "Buffer Your Caffeine",
    text: "Have your coffee or tea *after* breakfast rather than on an empty stomach to protect your hormone balance.",
  },
  "indulgent desserts": {
    icon: Heart,
    title: "Mindful Indulgence",
    text: "Plate your dessert, sit down, and savor every bite completely guilt-free!",
  },
  "warm soups": {
    icon: Flame,
    title: "Soothing Warmth",
    text: "Warm soups are easy on menstrual digestion and replenish both fluids and minerals.",
  },
  "light salads": {
    icon: Sun,
    title: "Follicular Freshness",
    text: "Crisp greens with olive oil and protein are wonderful for supporting liver estrogen metabolism.",
  },
  "rich sauces": {
    icon: Coffee,
    title: "Healthy Fats",
    text: "Your body uses healthy fats to build hormones—enjoy rich flavors in comfortable portions.",
  },
  "baked goods": {
    icon: Heart,
    title: "Serotonin Carbs",
    text: "Carbohydrates help tryptophan enter the brain to make serotonin. Pair pastries with a side of protein!",
  },
  Savory: {
    icon: Coffee,
    title: "Protein & Iron Cue",
    text: "A strong savory craving often means your body is asking for amino acids and iron.",
  },
  "Fast food": {
    icon: Heart,
    title: "Zero-Guilt Convenience",
    text: "If you're too tired to cook, fed is best. Drink extra water to balance out the extra sodium.",
  },
  "Comfort food": {
    icon: Heart,
    title: "Emotional & Physical Warmth",
    text: "Warm, familiar comfort meals calm the nervous system during the luteal and menstrual phases.",
  },
  Fruit: {
    icon: Sun,
    title: "Natural Hydration & Fiber",
    text: "Fresh fruit delivers antioxidants, fiber, and cellular hydration—enjoy a generous bowl!",
  },
  "Cold drinks": {
    icon: Droplet,
    title: "Cool Refreshment",
    text: "Great for hot flashes or warm days; sip slowly if you have active menstrual cramps.",
  },
  "Hot drinks": {
    icon: Coffee,
    title: "Internal Heating Pad",
    text: "Warm mugs of herbal tea or cocoa relax smooth muscle in the digestive and reproductive tracts.",
  },
  Tea: {
    icon: Coffee,
    title: "Herbal Ritual",
    text: "Raspberry leaf, ginger, peppermint, or chamomile tea are cycle superpowers.",
  },
  Coffee: {
    icon: Coffee,
    title: "Hydrate Alongside Coffee",
    text: "Drink one full glass of water for every cup of coffee to prevent dehydration headaches.",
  },
  Carbs: {
    icon: Sun,
    title: "Luteal Metabolic Fuel",
    text: "Progesterone increases your basal metabolic rate—complex carbs like oats, rice, and sweet potatoes keep you fueled.",
  },
  "Ice cream": {
    icon: Heart,
    title: "Sweet Calcium Treat",
    text: "Enjoy a scoop mindfully! If dairy triggers bloating for you, coconut- or oat-milk ice cream is a great cozy swap.",
  },
  Pastries: {
    icon: Coffee,
    title: "Cozy Café Moment",
    text: "Savor a warm pastry with a protein-rich drink to keep your energy smooth.",
  },
  Cheese: {
    icon: Heart,
    title: "Satisfying Fats & Calcium",
    text: "Pair cheese with fruit or whole-grain crackers for a balanced, satisfying snack.",
  },
  Meat: {
    icon: Flame,
    title: "Heme Iron Signal",
    text: "Craving meat is a classic biological signal that your body wants to rebuild iron stores.",
  },
  "Fried food": {
    icon: Coffee,
    title: "Balance With Greens",
    text: "Enjoy crispy favorites in moderation and pair with water or peppermint tea to help digestion.",
  },
  Vegetables: {
    icon: Sun,
    title: "Micronutrient Boost",
    text: "Cruciferous and leafy veggies support healthy hormone detoxification.",
  },
  Juice: {
    icon: Droplet,
    title: "Vitamin C Boost",
    text: "Vitamin C in fresh juice boosts iron absorption and supports progesterone production.",
  },
  Water: {
    icon: Droplet,
    title: "Deep Thirst Cue",
    text: "Add a pinch of sea salt or squeeze of lemon to your water for better cellular absorption.",
  },
  Crunchy: {
    icon: Activity,
    title: "Satisfying Texture",
    text: "Nuts, seeds, sliced apples, or popcorn give great crunch plus fiber.",
  },
  Chewy: {
    icon: Heart,
    title: "Medjool Dates & Treats",
    text: "Dates with nut butter are a delicious chewy treat packed with minerals.",
  },
  Breads: {
    icon: Coffee,
    title: "Sourdough & Whole Grains",
    text: "Toast with avocado or eggs gives steady B-vitamins and comfort.",
  },
  Pasta: {
    icon: Flame,
    title: "Cozy Carb Bowl",
    text: "Toss some spinach, olive oil, and protein into your pasta for an easy, comforting meal.",
  },
  Chips: {
    icon: Droplet,
    title: "Salt & Crunch",
    text: "Portion into a bowl rather than eating from the bag, and pair with plenty of water.",
  },
  Candy: {
    icon: Smile,
    title: "Quick Glucose Pick-Me-Up",
    text: "Have a few pieces after a meal containing protein so your blood sugar stays stable.",
  },
  Noodles: {
    icon: Flame,
    title: "Warm Noodle Bowl",
    text: "Brothy noodles are hydrating, comforting, and gentle on the stomach.",
  },
  Hydra: {
    icon: Droplet,
    title: "Electrolyte Hydration",
    text: "Replenish fluids with coconut water, herbal infusions, or electrolyte packets.",
  },
};

export default function SelfCarePage() {
  const [todayLog, setTodayLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAllLibrary, setShowAllLibrary] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [checklist, setChecklist] = useState({
    water: false,
    stretch: false,
    rest: false,
    breathe: false,
    medication: false,
  });
  const supabase = createClient();

  useEffect(() => {
    async function fetchTodayLog() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const today = format(new Date(), "yyyy-MM-dd");
      const { data } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("log_date", today)
        .maybeSingle();

      if (data) setTodayLog(data);
      setLoading(false);
    }
    fetchTodayLog();
  }, [supabase]);

  const toggleChecklist = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Parse Today's Logged Data
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

  const suggestions: CareReminder[] = [];

  // 1. Physical & Emotional Symptoms (104 items)
  parsedSymptoms.forEach((symptom) => {
    if (symptom === "None") return;
    const match = SYMPTOM_REMINDERS[symptom];
    if (match) {
      suggestions.push({
        icon: match.icon,
        title: `${symptom}: ${match.title}`,
        text: match.text,
        category: "Symptom Care",
      });
    }
  });

  // 2. Moods (61 items)
  parsedMoods.forEach((mood) => {
    const match = MOOD_REMINDERS[mood];
    if (match) {
      suggestions.push({
        icon: match.icon,
        title: `Mood (${mood}): ${match.title}`,
        text: match.text,
        category: "Emotional & Mental",
      });
    }
  });

  // 3. Flow Intensity (6 items)
  if (todayLog?.flow && FLOW_REMINDERS[todayLog.flow]) {
    const fMatch = FLOW_REMINDERS[todayLog.flow];
    suggestions.push({
      icon: fMatch.icon,
      title: `Flow (${todayLog.flow}): ${fMatch.title}`,
      text: fMatch.text,
      category: "Moonday Flow",
    });
  }

  // 4. Vaginal Discharge (24 items)
  if (todayLog?.discharge && DISCHARGE_REMINDERS[todayLog.discharge]) {
    const dMatch = DISCHARGE_REMINDERS[todayLog.discharge];
    suggestions.push({
      icon: dMatch.icon,
      title: `Discharge (${todayLog.discharge}): ${dMatch.title}`,
      text: dMatch.text,
      category: "Vaginal Health",
    });
  }

  // 5. Cravings (41 items)
  parsedCravings.forEach((craving) => {
    const cMatch = CRAVING_REMINDERS[craving];
    if (cMatch) {
      suggestions.push({
        icon: cMatch.icon,
        title: `Craving (${craving}): ${cMatch.title}`,
        text: cMatch.text,
        category: "Food & Cravings",
      });
    }
  });

  // 6. Stated Personal Need Note
  if (todayLog?.what_you_need_note) {
    suggestions.push({
      icon: Heart,
      title: "Your Stated Need Today",
      text: `You noted that you need: "${todayLog.what_you_need_note}". Make sure to give yourself—or ask your partner for—this today.`,
      category: "Personal Need",
    });
  }

  // Build Complete Library for browsing all 104 symptoms + 61 moods + 24 discharge + 41 cravings
  const allLibraryItems: CareReminder[] = [
    ...Object.entries(SYMPTOM_REMINDERS).map(([key, val]) => ({
      icon: val.icon,
      title: `${key} — ${val.title}`,
      text: val.text,
      category: "Physical & Mental Symptom",
    })),
    ...Object.entries(MOOD_REMINDERS).map(([key, val]) => ({
      icon: val.icon,
      title: `${key} — ${val.title}`,
      text: val.text,
      category: "Mood & Feeling",
    })),
    ...Object.entries(FLOW_REMINDERS).map(([key, val]) => ({
      icon: val.icon,
      title: `${key} — ${val.title}`,
      text: val.text,
      category: "Flow Intensity",
    })),
    ...Object.entries(DISCHARGE_REMINDERS).map(([key, val]) => ({
      icon: val.icon,
      title: `${key} — ${val.title}`,
      text: val.text,
      category: "Vaginal Discharge",
    })),
    ...Object.entries(CRAVING_REMINDERS).map(([key, val]) => ({
      icon: val.icon,
      title: `${key} — ${val.title}`,
      text: val.text,
      category: "Craving Guide",
    })),
  ].filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="animate-in fade-in duration-300 max-w-[950px] pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-[25px]">
        <div>
          <h2 className="text-[22px] font-bold text-ink mb-1">
            Self-Care & Comfort 🍵
          </h2>
          <p className="text-[13px] text-muted">
            1-to-1 care reminders tailored to every symptom, mood, and parameter
            in your log.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAllLibrary(!showAllLibrary)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#fff0f3] border border-[#f4c2c2] text-[#a55f78] rounded-[12px] text-[12px] font-bold hover:brightness-95 transition-all self-start sm:self-auto"
        >
          <BookOpen className="w-4 h-4" />
          {showAllLibrary
            ? "Hide Full Symptom Library"
            : `Browse All (${Object.keys(SYMPTOM_REMINDERS).length + Object.keys(MOOD_REMINDERS).length}+) Reminders`}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] mb-[25px] items-start">
        <div className="bg-surface border border-line rounded-xl p-[22px] shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-bold text-ink flex items-center gap-2">
              <Heart className="w-4 h-4 text-[#a55f78]" /> Personalized for You
              Today
            </h3>
            {suggestions.length > 0 && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2]">
                {suggestions.length} Active
              </span>
            )}
          </div>

          {loading ? (
            <div className="text-[12px] text-muted">
              Loading your daily insights...
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {suggestions.map((item, i) => (
                <div
                  key={i}
                  className="flex gap-3 bg-[#fff8fa] p-3.5 rounded-[12px] border border-[#fbeaf0]"
                >
                  <div className="mt-0.5 shrink-0">
                    <item.icon className="w-4 h-4 text-[#d990a8]" />
                  </div>
                  <div>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#a55f78] mb-0.5">
                      {item.category}
                    </span>
                    <h4 className="text-[13px] font-bold text-ink mb-1">
                      {item.title}
                    </h4>
                    <p className="text-[12px] text-[#66545f] leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[12px] text-[#66545f] bg-slate-50 p-4 rounded-[12px] border border-line">
              No symptoms or moods logged for today yet. Log your day or click{" "}
              <strong>Browse All Reminders</strong> above to explore all{" "}
              {Object.keys(SYMPTOM_REMINDERS).length} symptom guides!
            </div>
          )}
        </div>

        <div className="bg-surface border border-line rounded-xl p-[22px] shadow-soft">
          <h3 className="text-[15px] font-bold text-ink mb-4 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-[#a55f78]" /> Daily Comfort
            Checklist
          </h3>
          <div className="space-y-2">
            {[
              { key: "water", label: "Drank a large glass of water" },
              { key: "stretch", label: "Did 5 minutes of gentle movement" },
              { key: "rest", label: "Took a proper break to rest" },
              { key: "breathe", label: "Practiced deep breathing" },
              {
                key: "medication",
                label: "Took necessary vitamins/medication",
              },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() =>
                  toggleChecklist(item.key as keyof typeof checklist)
                }
                className="w-full flex items-center gap-3 p-3 rounded-[10px] hover:bg-slate-50 transition-colors text-left border border-transparent hover:border-line"
              >
                {checklist[item.key as keyof typeof checklist] ? (
                  <CheckSquare className="w-5 h-5 text-[#d990a8]" />
                ) : (
                  <Square className="w-5 h-5 text-[#b6a5ad]" />
                )}
                <span
                  className={`text-[13px] font-bold ${checklist[item.key as keyof typeof checklist] ? "text-muted line-through" : "text-ink"}`}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* COMPLETE ENCYCLOPEDIA OF ALL LOGCLIENT SYMPTOM & MOOD REMINDERS */}
      {showAllLibrary && (
        <div className="bg-surface border border-line rounded-xl p-[22px] shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-[16px] font-bold text-ink">
                Complete Symptom & Mood Care Directory
              </h3>
              <p className="text-[12px] text-muted">
                Showing {allLibraryItems.length} reminders across all symptoms, moods, flow, discharge, and cravings Care for you beautiful.
              </p>
            </div>
            <div className="relative w-full sm:w-[280px]">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any symptom or mood..."
                className="w-full pl-9 pr-3 py-2 border border-line rounded-[10px] text-[12px] bg-slate-50 outline-none focus:border-[#d990a8]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
            {allLibraryItems.map((item, idx) => (
              <div
                key={idx}
                className="flex gap-3 bg-[#fff8fa] p-3.5 rounded-[12px] border border-[#fbeaf0]"
              >
                <div className="mt-0.5 shrink-0">
                  <item.icon className="w-4 h-4 text-[#d990a8]" />
                </div>
                <div>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#a55f78] mb-0.5">
                    {item.category}
                  </span>
                  <h4 className="text-[13px] font-bold text-ink mb-1">
                    {item.title}
                  </h4>
                  <p className="text-[12px] text-[#66545f] leading-relaxed">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
