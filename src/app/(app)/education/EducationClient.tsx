"use client";

import { ADULT_INTIMACY_MASTERCLASS } from "@/data/AdultIntimacyMasterclass";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Droplet,
  Sun,
  Sparkles,
  Moon,
  Activity,
  Search,
  Brain,
  Coffee,
  Apple,
  Heart,
  Dumbbell,
  Shield,
  Thermometer,
  Leaf,
  BookOpen,
  Clock,
  Zap,
  Bed,
  Pill,
  Fingerprint,
  Smile,
  AlertCircle,
  Stethoscope,
  Flame,
  Wind,
  Baby,
  TestTube,
  Microscope,
  Dna,
  Flower2,
  Bone,
  User,
  Users,
  HeartHandshake,
  Lock,
  Unlock,
  Loader2,
} from "lucide-react";

// --- TEEN & FOUNDATIONAL LIBRARY ---
const TEEN_DATA = [
  {
    category: "Puberty & Early Menstruation",
    items: [
      {
        title: "Menarche (The First Period)",
        icon: Droplet,
        desc: "Menarche is a girl's first menstrual period, typically occurring between ages 11 and 14, marking the activation of the reproductive system.\n\nIt is entirely normal for the first 2 to 3 years of menstruation to be highly irregular, anovulatory, or painless, as the brain-ovary connection (the HPO axis) is still maturing and establishing its rhythmic communication.",
      },
      {
        title: "Tanner Stages of Development",
        icon: Activity,
        desc: "A scale of physical development in children, adolescents, and adults. For girls, puberty begins with breast budding (thelarche), followed by pubic hair growth (pubarche), and a growth spurt.\n\nMenarche typically occurs in Tanner Stage 4, about two to two-and-a-half years after breast budding begins, signaling that the body has achieved sufficient fat stores to support reproduction.",
      },
      {
        title: "Primary Amenorrhea",
        icon: AlertCircle,
        desc: "The medical term for when a girl has not experienced her first period by age 15, or has not shown any signs of breast development by age 13.\n\nThis requires medical evaluation and can be caused by chromosomal abnormalities, severe malnutrition, intense athletic training, or structural issues within the reproductive tract.",
      },
      {
        title: "Teen Hormonal Acne",
        icon: Sparkles,
        desc: "During puberty, the body experiences a massive surge in all sex hormones, particularly androgens (like testosterone).\n\nThese androgens drastically increase oil (sebum) production in the skin, which clogs pores and leads to acne. As the endocrine system matures and estrogen/progesterone balance out the androgens, this acne typically resolves in the late teens.",
      },
    ],
  },
  {
    category: "Anatomy & The Reproductive System",
    items: [
      {
        title: "The Uterus (Womb)",
        icon: Heart,
        desc: "A pear-shaped, incredibly strong muscular organ. It consists of three layers: the perimetrium (outer), the myometrium (thick middle muscle), and the endometrium (inner lining).\n\nThe uterus is remarkably elastic; it can expand from the size of a lemon to the size of a watermelon during pregnancy, and its muscular walls generate the contractions required for both menstruation and childbirth.",
      },
      {
        title: "The Endometrium",
        icon: Droplet,
        desc: "The innermost lining of the uterus, which acts as the 'soil' for a fertilized egg to implant. It is highly responsive to hormones.\n\nEstrogen causes it to proliferate and grow thick with blood vessels. Progesterone matures the lining, making it secretory and ready to nourish an embryo. If no pregnancy occurs, the sudden drop in hormones causes this entire complex layer to break down and shed as a period.",
      },
      {
        title: "The Ovaries",
        icon: Sparkles,
        desc: "Two almond-sized glands located on either side of the uterus. They are the female gonads, responsible for storing eggs and producing estrogen, progesterone, and testosterone.\n\nYou are born with all the eggs you will ever have (around 1-2 million), which rest in a dormant state until puberty, when the brain begins waking them up in monthly batches.",
      },
      {
        title: "The Fallopian Tubes",
        icon: Activity,
        desc: "Narrow, delicate tubes that connect the ovaries to the uterus. They are lined with microscopic, hair-like structures called cilia.\n\nWhen an egg is released during ovulation, the fimbriae (finger-like projections at the end of the tube) sweep the egg inside. Conception actually occurs inside the fallopian tube, and the cilia sweep the fertilized embryo down into the uterus over the next week.",
      },
      {
        title: "The Cervix",
        icon: Fingerprint,
        desc: "The lower, narrow end of the uterus that opens into the vagina. It acts as the gatekeeper of the reproductive system.\n\nFor most of the month, the cervix is tightly closed and sealed with a thick mucus plug to protect the uterus from bacteria. During ovulation, it softens, opens slightly, and produces fertile mucus to allow sperm to enter. During childbirth, it must dilate to 10 centimeters.",
      },
      {
        title: "The Vagina",
        icon: Activity,
        desc: "A highly elastic, muscular canal that connects the cervix to the outside of the body. It is a self-cleaning organ.\n\nA healthy vagina has a very acidic pH (3.8 to 4.5), maintained by beneficial Lactobacillus bacteria. This acidity kills invading pathogens and infections. Douching or using scented soaps destroys this delicate microbiome, leading to bacterial vaginosis and yeast infections.",
      },
      {
        title: "The Vulva & Clitoris",
        icon: Smile,
        desc: "The vulva is the external female genitalia, including the labia majora, labia minora, vaginal opening, and the clitoris.\n\nThe clitoris is an extensive sensory organ containing over 10,000 nerve endings. While only the glans (tip) is visible externally, the structure extends deep inside the pelvis, wrapping around the vaginal canal. Its sole biological function is sexual pleasure.",
      },
    ],
  },
  {
    category: "The Biological Blueprint (Cycle Phases)",
    items: [
      {
        title: "The Menstrual Phase (Days 1-5)",
        icon: Droplet,
        desc: "The cycle begins on the first day of full red bleeding. At this point, your primary sex hormones—estrogen and progesterone—have plummeted to their lowest baseline levels.\n\nWithout the structural support of progesterone, the spiral arteries in the uterine lining (endometrium) constrict, and the tissue begins to shed. Because your hormone levels are at rock bottom, your immune system is slightly weaker, and your basal metabolic rate is at its lowest. This is biologically a time designed for deep rest and recovery.",
      },
      {
        title: "The Follicular Phase (Days 6-14)",
        icon: Sun,
        desc: "Once bleeding stops, the brain's pituitary gland releases Follicle-Stimulating Hormone (FSH). This hormone travels to the ovaries and tells a group of follicles (sacs containing eggs) to start maturing.\n\nAs these follicles grow, they secrete estradiol (a potent form of estrogen). This rising estrogen acts like fertilizer for your body: it thickens the uterine lining, stimulates collagen production in your skin, and boosts serotonin and dopamine in the brain. You will likely feel a steady increase in energy, optimism, and cognitive sharpness.",
      },
      {
        title: "The Ovulatory Phase (Around Day 14)",
        icon: Sparkles,
        desc: "Estrogen reaches its absolute peak, which triggers the brain to release a massive surge of Luteinizing Hormone (LH). This LH surge is the mechanical trigger that causes the single most dominant follicle to rupture, releasing a mature egg into the fallopian tube.\n\nSimultaneously, a brief spike in testosterone occurs. This biological cocktail of peak estrogen and testosterone maximizes your physical stamina, pain tolerance, confidence, and libido. The egg only survives for 12 to 24 hours, making this your primary window of fertility.",
      },
      {
        title: "The Luteal Phase (Days 15-28)",
        icon: Moon,
        desc: "After the egg is released, the ruptured follicle collapses and transforms into a temporary endocrine gland called the Corpus Luteum. This incredible structure pumps out massive amounts of progesterone.\n\nProgesterone stabilizes the thick uterine lining and acts as a biological sedative, interacting with GABA receptors in the brain to make you feel calm and nested. However, if the egg is not fertilized, the corpus luteum begins to disintegrate around day 24. The sudden crash in progesterone and estrogen over the next few days is what triggers PMS symptoms and eventually menstruation.",
      },
      {
        title: "The Corpus Luteum",
        icon: Activity,
        desc: "The corpus luteum is arguably one of the most fascinating structures in human biology. It is a brand-new, temporary organ your body grows from scratch every single month after ovulation.\n\nIts sole purpose is to produce progesterone to sustain a potential pregnancy. It requires a massive blood supply and high amounts of zinc, Vitamin C, and cholesterol to function. If it is weak (often due to stress or poor nutrition), it produces insufficient progesterone, leading to spotting, severe PMS, or early miscarriages.",
      },
      {
        title: "Cycle Length Variations",
        icon: Clock,
        desc: "While medical textbooks use a 28-day cycle as the standard model, a perfectly healthy cycle can range anywhere from 21 to 35 days. The variation almost always happens in the first half of the cycle (the follicular phase).\n\nIf you are stressed, sick, or traveling, your brain can delay ovulation by days or weeks. However, once ovulation actually occurs, the luteal phase (the second half of the cycle) is strictly fixed at 10 to 14 days for almost all women. Therefore, a 'late period' usually just means 'late ovulation'.",
      },
      {
        title: "Anovulatory Cycles",
        icon: AlertCircle,
        desc: "An anovulatory cycle is a cycle where bleeding occurs, but no egg was actually released (no ovulation took place). The bleeding is caused by a drop in estrogen rather than a drop in progesterone.\n\nThese cycles are completely normal during puberty, postpartum, and perimenopause. However, if they happen frequently during prime reproductive years, they are a primary indicator of conditions like Polycystic Ovary Syndrome (PCOS), hypothalamic amenorrhea, or severe thyroid dysfunction.",
      },
      {
        title: "The 'Inner Seasons' Framework",
        icon: Leaf,
        desc: "Many holistic practitioners map the menstrual cycle to the four seasons to help women intuitively understand their energy levels.\n\nMenstruation is Winter: a time for going inward, resting, and conserving energy. The Follicular phase is Spring: a time for planting seeds, starting new projects, and socializing. Ovulation is Summer: highly extroverted, energetic, and expressive. The Luteal phase is Autumn: a time for wrapping up tasks, nesting, and preparing for the winter ahead.",
      },
    ],
  },
  {
    category: "The Master Hormones",
    items: [
      {
        title: "Estrogen (Estradiol)",
        icon: Zap,
        desc: "Estrogen is the ultimate growth hormone for the female body. Produced primarily by the ovarian follicles, it builds up the uterine lining, maintains bone density, and keeps the vaginal tissues lubricated and elastic.\n\nNeurologically, estrogen is a powerhouse. It increases neuroplasticity, boosts serotonin production, and makes you more resilient to stress. When estrogen crashes just before your period, the sudden lack of neurological support can trigger depressive moods and menstrual migraines.",
      },
      {
        title: "Progesterone",
        icon: Shield,
        desc: "Progesterone is the 'relaxing and protecting' hormone. Produced exclusively by the corpus luteum after ovulation, it stops the uterine lining from growing and matures it to receive an embryo.\n\nIt is deeply calming to the central nervous system, promotes deep slow-wave sleep, and increases core body temperature. It also stimulates the thyroid and increases your metabolic rate. A lack of progesterone relative to estrogen (Estrogen Dominance) is the leading cause of heavy periods, severe PMS, and fibroids.",
      },
      {
        title: "Testosterone",
        icon: Dumbbell,
        desc: "Though often thought of as a male hormone, women require healthy testosterone levels for optimal health. It is produced by the ovaries and adrenal glands.\n\nTestosterone spikes briefly around ovulation, contributing to a surge in libido, spatial awareness, and physical strength. Low testosterone can lead to lethargy, loss of muscle mass, and low sex drive. Conversely, abnormally high testosterone (hyperandrogenism) is a hallmark of PCOS, causing cystic acne, hair loss, and facial hair growth.",
      },
      {
        title: "Cortisol (The Stress Hormone)",
        icon: Brain,
        desc: "Cortisol is a life-saving hormone produced by the adrenal glands to manage stress. However, chronic modern stress keeps cortisol artificially high, which wreaks havoc on the menstrual cycle.\n\nBecause cortisol and progesterone share the same precursor hormone (pregnenolone), high stress causes the body to undergo the 'Pregnenolone Steal'. The body prioritizes making stress hormones over reproductive hormones, tanking your progesterone levels and leading to debilitating PMS, spotting, and irregular cycles.",
      },
      {
        title: "Luteinizing Hormone (LH)",
        icon: Activity,
        desc: "Luteinizing Hormone is secreted by the anterior pituitary gland in the brain. For most of the cycle, LH is relatively low. But as estrogen peaks, it triggers a massive surge of LH.\n\nThis surge is the biological 'match' that ignites ovulation, forcing the follicle to rupture within 12 to 36 hours. Over-the-counter ovulation predictor kits (OPKs) work by detecting this exact hormone in your urine.",
      },
      {
        title: "Follicle-Stimulating Hormone (FSH)",
        icon: Activity,
        desc: "FSH is the messenger hormone that starts the entire menstrual cycle. Released by the brain on Day 1 of your cycle, it travels to the ovaries and commands them to begin ripening a new batch of eggs.\n\nAs women age and the ovarian reserve drops, the brain has to shout louder (produce more FSH) to get the ovaries to respond. Therefore, a persistently high baseline FSH level on day 3 of the cycle is a clinical marker of approaching perimenopause or diminished ovarian reserve.",
      },
      {
        title: "Prolactin",
        icon: Baby,
        desc: "Prolactin is primarily known for stimulating breast milk production during and after pregnancy. However, it also fluctuates during a normal menstrual cycle.\n\nProlactin levels can rise slightly during the luteal phase, which contributes to the breast swelling and tenderness (mastalgia) many women experience before their period. Chronically high prolactin (hyperprolactinemia) outside of pregnancy can completely halt ovulation.",
      },
      {
        title: "Insulin",
        icon: TestTube,
        desc: "Insulin is the hormone responsible for unlocking your cells so they can absorb glucose (sugar) from your blood. While not a reproductive hormone, it heavily influences them.\n\nHigh insulin levels (insulin resistance) stimulate the ovaries to produce excess testosterone, halting ovulation and driving PCOS. Interestingly, women's natural insulin sensitivity changes throughout the month: you are highly insulin sensitive in the follicular phase, and naturally somewhat insulin resistant in the luteal phase.",
      },
      {
        title: "Thyroid Hormones (T3/T4)",
        icon: Activity,
        desc: "The thyroid gland regulates your entire body's metabolism. The reproductive system is highly sensitive to thyroid fluctuations.\n\nHypothyroidism (underactive thyroid) often leads to long, heavy, irregular periods and issues with ovulation. Hyperthyroidism (overactive thyroid) can lead to very short, light, or absent periods. If you have chronic cycle irregularities, a full thyroid panel is one of the first things a doctor should check.",
      },
      {
        title: "Sex Hormone Binding Globulin (SHBG)",
        icon: Dna,
        desc: "SHBG is a protein produced by the liver that binds to sex hormones (like estrogen and testosterone) and carries them through the blood.\n\nWhen hormones are bound to SHBG, they are biologically inactive. If SHBG is too low (often due to high insulin), too much free testosterone circulates, causing acne and hair loss. If SHBG is too high (often from birth control pills), it binds up all free testosterone, leading to zero libido and fatigue.",
      },
      {
        title: "DHEA-S",
        icon: Shield,
        desc: "Dehydroepiandrosterone sulfate (DHEA-S) is an androgen (male-type hormone) produced exclusively by the adrenal glands, not the ovaries.\n\nHigh levels of DHEA-S often indicate that a woman's hormonal imbalance (like adrenal PCOS) is driven by severe stress and adrenal fatigue, rather than insulin resistance in the ovaries.",
      },
      {
        title: "Melatonin",
        icon: Moon,
        desc: "Melatonin is the sleep hormone, but it is also a powerful antioxidant for the ovaries. High concentrations of melatonin are found in the fluid surrounding growing eggs.\n\nIt protects the egg from oxidative stress and DNA damage before ovulation. Because artificial blue light at night destroys melatonin production, chronic poor sleep can physically reduce egg quality over time.",
      },
    ],
  },
  {
    category: "Physical Symptoms Deep Dive",
    items: [
      {
        title: "Primary vs. Secondary Dysmenorrhea",
        icon: Activity,
        desc: "Primary dysmenorrhea is standard period pain caused by an excess of inflammatory prostaglandins. It usually begins a day before the period and lasts 1-3 days.\n\nSecondary dysmenorrhea is period pain caused by an underlying medical condition, such as endometriosis, fibroids, or adenomyosis. This pain is often debilitating, may not respond to standard painkillers, and can occur outside of the bleeding window.",
      },
      {
        title: "The 'Period Poops'",
        icon: Droplet,
        desc: "If you experience loose stools or diarrhea during the first two days of your period, it is not a coincidence. The same inflammatory prostaglandins that tell your uterus to contract and shed its lining also leak into your bloodstream.\n\nThese prostaglandins travel to the nearby smooth muscle of your intestines, commanding them to contract rapidly as well. Ibuprofen blocks prostaglandin production, which can alleviate both cramps and digestive upset.",
      },
      {
        title: "Hormonal Migraines",
        icon: Brain,
        desc: "True menstrual migraines are heavily linked to estrogen withdrawal. They typically occur in the 2 days before bleeding starts or during the first 3 days of the period.\n\nThe sudden drop in estrogen alters pain processing pathways in the brain and affects serotonin levels, triggering severe, throbbing pain, light sensitivity, and nausea. Stabilizing blood sugar and magnesium levels in the luteal phase can reduce their severity.",
      },
      {
        title: "Ovulation Pain (Mittelschmerz)",
        icon: Zap,
        desc: "About 20% of women can physically feel themselves ovulate. This pain, called Mittelschmerz (German for 'middle pain'), presents as a sharp, sudden twinge or a dull ache on one side of the lower abdomen.\n\nIt is caused by the physical swelling and rupturing of the follicle, as well as the release of a small amount of fluid and blood into the pelvic cavity, which briefly irritates the surrounding tissues.",
      },
      {
        title: "Luteal Phase Hot Flashes",
        icon: Flame,
        desc: "While hot flashes are the hallmark of menopause, some women experience them intensely during the late luteal phase.\n\nBecause progesterone naturally raises your core body temperature, your baseline is already warm. When estrogen drops sharply before your period, it briefly confuses the hypothalamus (the brain's thermostat), causing it to trigger sweating and vasodilation in an attempt to cool the body down.",
      },
      {
        title: "Cyclical Breast Pain (Mastalgia)",
        icon: Heart,
        desc: "Cyclical mastalgia (breast tenderness linked to the cycle) is caused by the combination of estrogen enlarging the breast ducts and progesterone stimulating the milk glands.\n\nThis tissue swelling can cause heaviness, aching, and sharp pains in the week before menstruation. Clinical studies have shown that high doses of Vitamin E, Evening Primrose Oil, and eliminating caffeine can significantly reduce this symptom.",
      },
      {
        title: "Ovulatory Spotting",
        icon: Droplet,
        desc: "Some women experience light pink or brown spotting for 1-2 days exactly in the middle of their cycle.\n\nThis is usually caused by the sudden, brief drop in estrogen that occurs immediately after the follicle ruptures, before the corpus luteum has had time to start producing enough progesterone to stabilize the lining. It is generally considered normal and highly fertile.",
      },
      {
        title: "Menstrual Nausea",
        icon: AlertCircle,
        desc: "Severe nausea and vomiting during the first few days of a period are caused by the overproduction of prostaglandins entering the bloodstream and affecting the stomach.\n\nHowever, if nausea is accompanied by excruciating pain that causes you to pass out or miss work, it is a primary red flag for Endometriosis, as endometrial lesions on the bowel can severely disrupt digestion.",
      },
      {
        title: "Joint & Lower Back Pain",
        icon: Activity,
        desc: "Lower back pain during menstruation is often referred pain from the contracting uterus, which shares nerve pathways with the lower back and upper thighs.\n\nAdditionally, the drop in estrogen reduces joint lubrication, making old injuries ache more and causing general stiffness in the days leading up to your period.",
      },
    ],
  },
  {
    category: "Neurobiology & Mental Health",
    items: [
      {
        title: "Serotonin & Estrogen",
        icon: Smile,
        desc: "Serotonin is the neurotransmitter responsible for feelings of well-being, happiness, and emotional stability. In the female brain, serotonin production is heavily dependent on estrogen.\n\nAs estrogen rises in the first half of the cycle, serotonin levels increase, making you feel positive and resilient. When estrogen plummets right before menstruation, serotonin crashes with it. This biological withdrawal is the primary driver of premenstrual sadness, tearfulness, and carbohydrate cravings (as carbs temporarily boost serotonin).",
      },
      {
        title: "Dopamine & Motivation",
        icon: Brain,
        desc: "Dopamine is the brain's reward, motivation, and pleasure chemical. Like serotonin, dopamine levels are enhanced by estrogen.\n\nDuring the late follicular phase and ovulation, high dopamine makes you feel driven, sociable, and eager for novelty. In the luteal phase, as estrogen drops and progesterone takes over, dopamine levels lower, which can lead to feelings of apathy, low motivation, and a desire to stay home.",
      },
      {
        title: "GABA & Progesterone",
        icon: Shield,
        desc: "GABA (Gamma-aminobutyric acid) is the primary inhibitory neurotransmitter in the brain—it acts as a neurological brake pedal, calming anxiety and inducing sleep.\n\nProgesterone and its metabolites directly stimulate GABA receptors. This is why healthy progesterone production in the luteal phase feels deeply soothing and promotes excellent deep sleep. However, when progesterone drops rapidly before the period, the sudden loss of GABA support can trigger severe premenstrual anxiety and insomnia.",
      },
      {
        title: "ADHD & The Menstrual Cycle",
        icon: Zap,
        desc: "Women with ADHD often experience extreme fluctuations in their symptoms throughout the month, largely due to the interaction between estrogen and dopamine.\n\nBecause ADHD is characterized by low baseline dopamine, the high-estrogen follicular phase often feels highly manageable, and stimulant medications work incredibly well. During the luteal phase, when estrogen drops, dopamine drops further, causing ADHD symptoms (executive dysfunction, brain fog, RSD) to skyrocket, and making medications feel ineffective.",
      },
      {
        title: "Histamine & Hormones",
        icon: AlertCircle,
        desc: "Histamine is a chemical involved in the immune response and allergies. Estrogen stimulates mast cells to release more histamine, and simultaneously down-regulates the DAO enzyme needed to clear it.\n\nFor women with histamine intolerance, the high-estrogen ovulatory and luteal phases can trigger intense allergy symptoms, hives, migraines, and debilitating menstrual cramps. Taking DAO enzymes or antihistamines can significantly reduce these cycle-specific symptoms.",
      },
      {
        title: "The 'Inner Critic' (Late Luteal Phase)",
        icon: Brain,
        desc: "During the late luteal phase, the brain's amygdala (the fear and threat center) becomes more active. Biologically, this was designed to make women more vigilant and protective of a potential pregnancy.\n\nIn modern life, this hyper-vigilance translates into the 'Inner Critic'. You become highly critical of yourself, your relationships, and your environment. While uncomfortable, this phase makes you an excellent editor, auditor, and problem-solver if channeled correctly.",
      },
      {
        title: "Brain Fog & Cognitive Dips",
        icon: Moon,
        desc: "Estrogen directly promotes neuroplasticity, memory formation, and verbal fluency in the hippocampus. \n\nWhen estrogen crashes in the days immediately preceding your period and during the first few days of bleeding, you physically lose this cognitive support. This manifests as 'brain fog', forgetting words mid-sentence, and struggling to concentrate on complex tasks. It is temporary and resolves as the follicular phase begins again.",
      },
    ],
  },
  {
    category: "Biomechanics & Exercise Physiology",
    items: [
      {
        title: "Follicular Phase: High Intensity",
        icon: Zap,
        desc: "As estrogen levels rise, your body's ability to utilize glycogen (stored carbohydrates) for energy becomes highly efficient. Muscle recovery is rapid.\n\nThis is the optimal time for High-Intensity Interval Training (HIIT), heavy weightlifting, sprinting, and long endurance runs. Your pain tolerance is increasing, and you are biologically primed to build lean muscle mass.",
      },
      {
        title: "Ovulation: Maximum Power",
        icon: Dumbbell,
        desc: "With both estrogen and testosterone at their absolute peak, this is your biological prime for physical output.\n\nYou have maximum strength, fast-twitch muscle fiber recruitment, and spatial awareness. This is the 2-3 day window where you are most likely to hit personal records (PRs) in the gym or endure grueling athletic events.",
      },
      {
        title: "Ovulation: Ligament Laxity",
        icon: AlertCircle,
        desc: "While you are at your strongest during ovulation, the peak in estrogen also affects the collagen in your joints, making tendons and ligaments slightly more lax (loose).\n\nSports science data shows that female athletes suffer significantly more ACL tears and joint sprains during their ovulatory window. Ensure impeccable form and warm up thoroughly before heavy lifting during this brief phase.",
      },
      {
        title: "Luteal Phase: The Taper",
        icon: Activity,
        desc: "Once progesterone takes over, your body's physiology shifts. Core body temperature rises, heart rate variability drops, and your body relies more on fat for fuel rather than quick carbs.\n\nYou will overheat faster and fatigue sooner. Attempting max-effort PRs in the late luteal phase often feels impossible. Transition to steady-state cardio, hypertrophy (muscle building) with longer rest periods, Pilates, and mobility work.",
      },
      {
        title: "Menstrual Phase: Active Recovery",
        icon: Moon,
        desc: "With all hormones at baseline and your body actively expending energy to shed the uterine lining, pushing through grueling workouts is counterproductive and increases inflammation.\n\nFocus on blood flow rather than breaking a sweat. Yin yoga, leisurely walks, and light core work help relieve pelvic congestion and cramping without taxing your already drained adrenal system.",
      },
      {
        title: "Exercise-Induced Amenorrhea",
        icon: Wind,
        desc: "Also known as Female Athlete Triad, this occurs when extreme energy expenditure (intense daily workouts) is not matched by sufficient caloric intake.\n\nThe brain perceives this energy deficit as a starvation state and completely shuts down the production of reproductive hormones to conserve energy, resulting in the total loss of the menstrual cycle and a severe drop in bone density.",
      },
      {
        title: "Pelvic Floor Physiology",
        icon: Brain,
        desc: "The pelvic floor is a hammock of muscles that supports your bladder, uterus, and bowels. It acts in tandem with your diaphragm during breathing.\n\nChronic stress, heavy lifting without breath control (valsalva maneuver), or conditions like endometriosis can cause the pelvic floor to become hypertonic (too tight), leading to painful intercourse, chronic pelvic pain, and severe cramping. Proper diaphragmatic breathing is essential for relaxation.",
      },
    ],
  },
];

// --- ADULT & CLINICAL LIBRARY ---
const ADULT_DATA = [
  {
    category: "Pathology & Conditions",
    items: [
      {
        title: "Endometriosis",
        icon: AlertCircle,
        desc: "Endometriosis is an inflammatory, whole-body disease where tissue similar to the lining of the uterus grows entirely outside the uterus—on the ovaries, fallopian tubes, bowels, or bladder.\n\nThese lesions respond to monthly hormones, swelling and bleeding internally, causing excruciating chronic pain, digestive issues, and potential infertility. It cannot be diagnosed via standard ultrasound and often requires laparoscopic surgery to identify and excise.",
      },
      {
        title: "PCOS (Polycystic Ovary Syndrome)",
        icon: Shield,
        desc: "PCOS is an endocrine and metabolic disorder affecting up to 10% of women. It is primarily driven by insulin resistance, which causes the ovaries to overproduce androgens (like testosterone).\n\nSymptoms include irregular or absent periods, cystic acne, excess body hair (hirsutism), thinning scalp hair, and weight gain. The 'cysts' are actually immature follicles that stalled in development because the hormonal environment wasn't right to trigger ovulation.",
      },
      {
        title: "Adenomyosis",
        icon: Activity,
        desc: "Often described as the 'sister' to endometriosis, adenomyosis occurs when the endometrial tissue grows deep into the muscular wall of the uterus itself.\n\nThis causes the uterus to become enlarged and boggy. The hallmark symptoms are exceptionally heavy, prolonged menstrual bleeding (often involving large clots) and severe, sharp, knife-like pelvic pain during menstruation.",
      },
      {
        title: "Uterine Fibroids",
        icon: Heart,
        desc: "Fibroids are non-cancerous, solid muscular tumors that grow within or on the walls of the uterus. They are incredibly common, especially in women in their 30s and 40s.\n\nFibroid growth is heavily fueled by estrogen dominance. While many are asymptomatic, large or poorly positioned fibroids can cause extremely heavy bleeding, anemia, painful intercourse, and intense pressure on the bladder or bowels.",
      },
      {
        title: "PMDD (Premenstrual Dysphoric Disorder)",
        icon: Brain,
        desc: "PMDD is a severe, debilitating mood disorder that occurs in the luteal phase. It is fundamentally different from regular PMS. \n\nResearch indicates that women with PMDD do not have abnormal hormone levels; rather, their brains have a severe, genetic cellular sensitivity to normal hormonal fluctuations. The sudden shifts in estrogen and progesterone trigger catastrophic emotional responses, including deep depression, rage, panic attacks, and suicidal ideation, which vanish once the period starts.",
      },
      {
        title: "Pelvic Inflammatory Disease (PID)",
        icon: Flame,
        desc: "PID is an infection of the female reproductive organs, usually caused when sexually transmitted bacteria (like chlamydia or gonorrhea) spread from the vagina to the uterus and fallopian tubes.\n\nIf left untreated, it can cause severe lower abdominal pain, fever, and permanent scarring of the fallopian tubes, which is a leading cause of ectopic pregnancies and preventable infertility.",
      },
      {
        title: "Bacterial Vaginosis (BV) vs. Yeast",
        icon: Microscope,
        desc: "Both cause vaginal discomfort, but they require entirely different treatments. BV is caused by an overgrowth of Gardnerella bacteria when vaginal pH becomes too basic, leading to a thin, greyish discharge and a distinct fishy odor.\n\nA Yeast Infection (Candidiasis) is a fungal overgrowth caused by an imbalance in the microbiome (often after antibiotics or high sugar intake). It presents with intense itching, redness, and a thick, white, cottage-cheese-like discharge with no strong odor.",
      },
      {
        title: "Hypothalamic Amenorrhea (HA)",
        icon: Wind,
        desc: "HA is the loss of a menstrual cycle due to the brain shutting down reproductive functions in response to extreme stress, under-eating, or over-exercising.\n\nThe hypothalamus perceives the environment as a 'famine' and halts the release of GnRH, which completely stops the production of FSH, LH, estrogen, and progesterone. Treatment requires prolonged periods of rest, stress reduction, and significant caloric surplus to signal safety to the brain.",
      },
      {
        title: "Vaginismus",
        icon: Shield,
        desc: "Vaginismus is the involuntary tensing or spasming of the pelvic floor muscles surrounding the vagina, making penetration (tampons, exams, or intercourse) extremely painful or impossible.\n\nIt is often a physical conditioned response to pain, trauma, or anxiety. Treatment involves pelvic floor physical therapy, dilator therapy, and psychological support to retrain the brain-muscle connection.",
      },
      {
        title: "Vulvodynia",
        icon: Flame,
        desc: "Vulvodynia is chronic, unexplained pain in the vulvar area that lasts for more than three months. The pain can be generalized or localized, provoked by touch or unprovoked.\n\nThe exact cause is unknown but is believed to involve nerve injury, abnormal response to infection, or hormonal shifts. It requires a multidisciplinary approach including topical anesthetics, nerve medications, and pelvic floor therapy.",
      },
      {
        title: "Interstitial Cystitis (IC)",
        icon: Droplet,
        desc: "Often called Painful Bladder Syndrome, IC causes chronic pelvic pain and a persistent, urgent need to urinate, often mimicking a UTI but without any bacteria present.\n\nSymptoms frequently flare during the luteal and menstrual phases due to hormonal shifts and increased pelvic inflammation. Dietary triggers (like caffeine, citrus, and tomatoes) play a massive role in symptom management.",
      },
      {
        title: "Asherman's Syndrome",
        icon: AlertCircle,
        desc: "A rare acquired condition where scar tissue (adhesions) forms inside the cavity of the uterus, causing the front and back walls to stick together.\n\nIt almost always occurs following a surgical procedure like a D&C (dilation and curettage). The primary symptoms are extremely light periods (hypomenorrhea) or a complete cessation of periods (amenorrhea), and it is a major cause of secondary infertility.",
      },
    ],
  },
  {
    category: "Nutrition & The Microbiome",
    items: [
      {
        title: "The Estrobolome",
        icon: Leaf,
        desc: "The estrobolome is a specialized collection of bacteria in your gut microbiome that is solely responsible for metabolizing and excreting excess estrogen.\n\nIf your gut is unhealthy (dysbiosis) or you suffer from chronic constipation, these bacteria produce an enzyme that reactivates the estrogen your liver just tried to detoxify. The estrogen is reabsorbed into your bloodstream, leading to severe Estrogen Dominance symptoms like heavy periods and hormonal acne.",
      },
      {
        title: "Iron & Menstruation",
        icon: Apple,
        desc: "Women of reproductive age are highly susceptible to iron deficiency anemia due to monthly blood loss. Heavy bleeders can lose significant iron stores very quickly.\n\nSymptoms of low iron include extreme fatigue, pale skin, cold hands/feet, and hair loss. During and immediately after your period, prioritize heme iron (red meat, liver) or non-heme iron (lentils, spinach) paired strictly with Vitamin C to multiply absorption. Avoid drinking coffee with iron-rich meals, as tannins block absorption.",
      },
      {
        title: "Magnesium (The Miracle Mineral)",
        icon: Pill,
        desc: "Magnesium is involved in over 300 enzymatic reactions in the body. It is arguably the most important mineral for menstrual health.\n\nIt relaxes the smooth muscle of the uterus (stopping cramps), clears estrogen through the liver, lowers cortisol, and promotes GABA production for sleep. Because stress rapidly depletes magnesium, most modern women are deficient. Magnesium Glycinate is the best highly-absorbable form for cycle health.",
      },
      {
        title: "Zinc for Ovarian Health",
        icon: Sparkles,
        desc: "Zinc is crucial for follicle maturation, ovulation, and the health of the corpus luteum. It is also a natural anti-inflammatory.\n\nZinc blocks the 5-alpha-reductase enzyme, which prevents testosterone from converting into its more aggressive form (DHT). This makes zinc an incredibly powerful nutrient for clearing hormonal jawline acne and reducing excess hair growth in PCOS.",
      },
      {
        title: "Vitamin D3",
        icon: Sun,
        desc: "Vitamin D is technically a pro-hormone, not just a vitamin. Every single cell in the female reproductive system has a Vitamin D receptor.\n\nLow Vitamin D is heavily linked to irregular cycles, severe PMS, and poor egg quality. Because it is fat-soluble, it should always be taken with a healthy fat (like olive oil or avocado) to ensure absorption.",
      },
      {
        title: "B-Vitamins & Liver Detox",
        icon: TestTube,
        desc: "The liver requires B-Vitamins (especially B6, B9/Folate, and B12) to successfully process and package estrogen for excretion.\n\nVitamin B6 in particular is famous for reducing PMS symptoms because it helps the body synthesize progesterone and serotonin. The birth control pill rapidly depletes the body's natural stores of B-Vitamins, requiring targeted supplementation.",
      },
      {
        title: "Omega-3 Fatty Acids",
        icon: Droplet,
        desc: "Omega-3s (found in wild salmon, chia seeds, and walnuts) are the ultimate biological anti-inflammatories.\n\nThey actively suppress the production of the specific series of prostaglandins that cause severe menstrual cramps. Taking a high-quality Omega-3 supplement daily has been shown in clinical trials to be more effective than ibuprofen for treating primary dysmenorrhea.",
      },
      {
        title: "Blood Sugar Balance",
        icon: Activity,
        desc: "Insulin sensitivity fluctuates throughout your cycle. You are most insulin sensitive in the follicular phase, and naturally insulin resistant in the luteal phase.\n\nSpiking your blood sugar with naked carbs during the luteal phase will result in a massive crash, which the body interprets as an emergency, releasing cortisol and adrenaline. This cycle is the root cause of the intense mood swings and rage often associated with PMS.",
      },
      {
        title: "Intermittent Fasting (IF) for Women",
        icon: Clock,
        desc: "While intermittent fasting is excellent for cellular repair, the female reproductive system is highly sensitive to calorie restriction.\n\nStrict 16:8 fasting during the luteal phase can stress the adrenal glands, raise cortisol, and tank progesterone. If you practice IF, it is biologically safer to do so during the follicular phase, and switch to gentle, 12-hour overnight fasting during the luteal phase to keep blood sugar stable.",
      },
      {
        title: "Caffeine's Hormonal Impact",
        icon: Coffee,
        desc: "Caffeine stimulates the adrenal glands to release adrenaline and cortisol. In a healthy body, a morning coffee is fine, but in a stressed body, it exacerbates hormonal chaos.\n\nBecause cortisol blocks progesterone production, drinking high amounts of caffeine during the luteal phase can shorten your luteal phase and severely worsen PMS anxiety and breast tenderness. Consider switching to matcha or herbal teas in the week before your period.",
      },
      {
        title: "Alcohol and Estrogen",
        icon: AlertCircle,
        desc: "Alcohol is a potent endocrine disruptor. The liver prioritizes processing alcohol above all other toxins. \n\nWhen you drink, your liver stops detoxifying estrogen to focus on the alcohol. This leads to a sudden backlog of circulating estrogen. Studies show that drinking alcohol, especially in the luteal phase, drastically increases the severity of PMS, disrupts REM sleep, and exacerbates hormonal acne.",
      },
    ],
  },
  {
    category: "Fertility Awareness & Biomarkers",
    items: [
      {
        title: "Basal Body Temperature (BBT)",
        icon: Thermometer,
        desc: "BBT is your body's temperature at complete rest. Because progesterone produces heat, tracking your BBT every morning before getting out of bed allows you to confirm ovulation.\n\nBefore ovulation, BBT is typically lower (e.g., 97.0–97.7°F). After ovulation, the sudden release of progesterone causes a sustained thermal shift, raising temps by at least 0.4°F (e.g., 97.8–98.6°F) until the period starts.",
      },
      {
        title: "Cervical Mucus (The Sperm Highway)",
        icon: Droplet,
        desc: "Cervical mucus is the truest real-time indicator of approaching ovulation. Throughout the month, it changes under the influence of estrogen to either block or aid sperm.\n\nAfter your period, you are dry. As estrogen rises, mucus becomes sticky, then creamy. Right before ovulation, it becomes clear, wet, and highly stretchy (resembling raw egg whites). This peak mucus is rich in nutrients and creates channels that guide sperm directly into the uterus, keeping them alive for up to 5 days.",
      },
      {
        title: "Cervical Position",
        icon: Fingerprint,
        desc: "The cervix physically moves and changes texture throughout the cycle. You can track this by checking internally at the same time each day.\n\nDuring the infertile phases, the cervix is Low, Firm (feels like the tip of your nose), and Closed (SHOW). During the fertile ovulatory window, high estrogen causes it to pull High, become Soft (feels like your lips), and Open (SHOW) to admit sperm.",
      },
      {
        title: "The 6-Day Fertile Window",
        icon: Clock,
        desc: "Biologically, a woman is only fertile for about 6 days per cycle. This is determined by the lifespan of sperm and the lifespan of the egg.\n\nAn egg survives for a maximum of 24 hours after it is released. However, healthy sperm can survive inside the crypts of the cervix (if fertile mucus is present) for up to 5 days, waiting for the egg to drop. Therefore, intercourse leading up to ovulation is more likely to result in pregnancy than intercourse on the day of ovulation itself.",
      },
      {
        title: "Ovulation Predictor Kits (OPK)",
        icon: Activity,
        desc: "Urine test strips that detect the Luteinizing Hormone (LH) surge. A positive test means ovulation will likely occur in the next 12-36 hours.\n\nOPKs are predictive, not confirmative. Women with PCOS often experience multiple false LH surges without actually ovulating, making OPKs unreliable for them unless paired with BBT tracking to confirm the temperature shift.",
      },
      {
        title: "Luteal Phase Defect (LPD)",
        icon: AlertCircle,
        desc: "A healthy luteal phase must be at least 11 to 14 days long. If it is 10 days or shorter, it is considered a Luteal Phase Defect.\n\nIn a short luteal phase, the corpus luteum fails early, and progesterone drops prematurely. This means the uterine lining sheds before a newly fertilized embryo has enough time (usually 7-10 days) to travel down the fallopian tube and implant securely, resulting in early chemical pregnancies.",
      },
      {
        title: "AMH (Anti-Müllerian Hormone)",
        icon: TestTube,
        desc: "AMH is a hormone secreted by the developing follicles in your ovaries. A blood test for AMH is the standard medical gauge for measuring your remaining 'ovarian reserve'.\n\nWhile a low AMH indicates fewer eggs remaining (important for IVF dosing), it does NOT mean you cannot get pregnant naturally right now, as it tells doctors nothing about the genetic quality of the eggs you do have left.",
      },
      {
        title: "The Implantation Window",
        icon: Flower2,
        desc: "If an egg is fertilized in the fallopian tube, it takes about 6 to 10 days to travel down into the uterus and embed itself into the uterine lining.\n\nDuring this implantation window, many women experience a small, temporary dip in their BBT chart (an implantation dip) or light pink spotting. A pregnancy test will not turn positive until 2-3 days after successful implantation has occurred.",
      },
    ],
  },
  {
    category: "Contraception & Interventions",
    items: [
      {
        title: "The Combination Pill",
        icon: Pill,
        desc: "The most common form of birth control. It contains synthetic ethinyl estradiol and a synthetic progestin. It works by severing the communication between your brain and ovaries.\n\nBecause the brain senses a constant level of synthetic hormones, it never releases FSH or LH. Therefore, your follicles never grow, and you never ovulate. You do not have a true cycle on the pill.",
      },
      {
        title: "The Progestin-Only Pill (Mini-Pill)",
        icon: Pill,
        desc: "Contains only synthetic progestin. It works primarily by thickening the cervical mucus so sperm cannot enter the uterus, and thinning the uterine lining.\n\nDepending on the specific brand and dose, about 40% of women on the mini-pill will still ovulate. It must be taken at the exact same time every day to be effective.",
      },
      {
        title: "The 'Withdrawal Bleed' Illusion",
        icon: Droplet,
        desc: "The bleeding experienced during the placebo week of the birth control pill is NOT a menstruation. \n\nA true period is the shedding of a thick lining following the biological events of ovulation and the death of a corpus luteum. The pill bleed is simply a 'withdrawal bleed'—a chemical reaction where the sudden removal of synthetic hormones causes the thin uterine lining to destabilize and shed.",
      },
      {
        title: "Hormonal IUDs (Mirena, Kyleena)",
        icon: Shield,
        desc: "Hormonal IUDs are T-shaped devices inserted into the uterus that slowly release a steady micro-dose of synthetic progestin (levonorgestrel).\n\nUnlike the pill, they do not always suppress ovulation. Their primary mechanism is thinning the uterine lining so nothing can implant, and thickening cervical mucus into an impenetrable plug so sperm cannot enter the uterus. Many women still ovulate and experience natural hormonal mood shifts.",
      },
      {
        title: "The Copper IUD (Paragard)",
        icon: Zap,
        desc: "The Copper IUD is 100% non-hormonal. Your brain-ovary connection remains intact, you ovulate normally, and you experience a true menstrual cycle.\n\nIt works by releasing copper ions into the uterus, which creates a highly toxic, inflammatory environment that destroys sperm before they can reach the egg. Because of the localized inflammation, Copper IUDs frequently cause much heavier, longer, and crampier periods.",
      },
      {
        title: "Post-Birth Control Syndrome",
        icon: Activity,
        desc: "When coming off hormonal birth control, it is very common for the body to experience a shock period lasting 3 to 12 months as the brain and ovaries attempt to 're-learn' how to communicate.\n\nSymptoms often include post-pill amenorrhea (no period for months), severe acne rebound, hair shedding, and mood instability while the body clears synthetic hormones and attempts to kickstart natural ovulation.",
      },
      {
        title: "Plan B (Emergency Contraception)",
        icon: AlertCircle,
        desc: "Plan B (Levonorgestrel) is a massive dose of synthetic progestin. Its only mechanism of action is to drastically delay or prevent the LH surge, thereby delaying ovulation so sperm die before an egg is released.\n\nCrucially, if the LH surge has already begun, or if you have ALREADY ovulated, Plan B will not work. It does not abort an existing pregnancy or prevent a fertilized egg from implanting.",
      },
      {
        title: "Fertility Awareness Method (FAM)",
        icon: BookOpen,
        desc: "A highly scientific, non-hormonal method of avoiding pregnancy by identifying the 6-day fertile window through daily tracking of Basal Body Temperature and Cervical Mucus.\n\nWhen practiced strictly using a sympto-thermal method (like Sensiplan), it boasts a 99.4% perfect-use efficacy rate, matching the birth control pill. It requires daily dedication and body literacy.",
      },
    ],
  },
  {
    category: "Holistic Modalities & Naturopathy",
    items: [
      {
        title: "Vitex (Chaste Tree Berry)",
        icon: Leaf,
        desc: "Vitex is one of the most thoroughly researched botanical medicines for female hormonal health. It acts directly on the pituitary gland in the brain.\n\nIt gently suppresses prolactin and encourages the production of Luteinizing Hormone (LH), which naturally boosts ovulation and subsequent progesterone production. It is highly effective for extending short luteal phases and reducing PMS, but takes 3-4 months to show full effects.",
      },
      {
        title: "Maca Root",
        icon: Zap,
        desc: "An adaptogenic root from the Andes mountains. Unlike other herbs, Maca does not contain any plant hormones (phytoestrogens).\n\nInstead, it nourishes the hypothalamus and pituitary glands, helping the body respond better to stress and balance its own hormone production. It is clinically studied for boosting libido, reducing perimenopausal hot flashes, and improving energy.",
      },
      {
        title: "Inositol (Myo-Inositol)",
        icon: TestTube,
        desc: "A naturally occurring sugar molecule that is profoundly effective for women with PCOS. It acts as a secondary messenger for insulin.\n\nSupplementing with a 40:1 ratio of Myo-Inositol to D-Chiro-Inositol drastically improves insulin sensitivity, lowers circulating testosterone, and has been proven in clinical trials to restore regular ovulation in PCOS patients just as effectively as pharmaceutical Metformin.",
      },
      {
        title: "DIM (Diindolylmethane)",
        icon: Shield,
        desc: "DIM is a compound found in cruciferous vegetables like broccoli and Brussels sprouts. It acts as a targeted traffic cop in the liver.\n\nIt forces the liver to process estrogen down the healthy, protective pathway (2-OH) rather than the toxic, inflammatory pathways (4-OH and 16-OH). It is a frontline holistic treatment for estrogen-dominant conditions like fibroids, heavy bleeding, and hormonal acne.",
      },
      {
        title: "Castor Oil Packs",
        icon: Leaf,
        desc: "A traditional naturopathic therapy involving placing organic, cold-pressed castor oil over the liver or pelvic region, covered with a heating pad.\n\nRicinoleic acid, the active compound in castor oil, penetrates the skin to stimulate lymphatic drainage and boost liver detoxification. When done consistently in the follicular phase, it helps the liver clear excess estrogen, reducing cramps and fibroid pain.",
      },
      {
        title: "Red Raspberry Leaf Tea",
        icon: Coffee,
        desc: "Revered as the ultimate uterine tonic. Red raspberry leaf is rich in fragarine, an alkaloid that helps tone and tighten the smooth muscles of the pelvic region and uterus.\n\nDrinking it daily during the luteal phase helps condition the uterus to contract more efficiently during menstruation, significantly reducing the severity and duration of menstrual cramps.",
      },
      {
        title: "Acupuncture & TCM",
        icon: Activity,
        desc: "Traditional Chinese Medicine (TCM) views the menstrual cycle through the flow of Qi (energy) and Blood. Painful periods are viewed as 'Blood Stagnation', while missing periods are 'Blood Deficiency'.\n\nClinical studies show that targeted acupuncture can significantly increase blood flow to the ovaries and uterus, reduce sympathetic nervous system stress, and successfully regulate cycles in women with PCOS or HA.",
      },
    ],
  },
  {
    category: "Pregnancy & Postpartum Endocrinology",
    items: [
      {
        title: "Conception & Fertilization",
        icon: Dna,
        desc: "Fertilization occurs in the outer third of the fallopian tube when a single sperm successfully breaches the egg's outer layer (zona pellucida).\n\nThe fertilized egg (now a zygote) begins rapidly dividing as it spends the next week traveling down the tube to eventually implant into the nutrient-rich, progesterone-prepared uterine lining.",
      },
      {
        title: "hCG (Human Chorionic Gonadotropin)",
        icon: Activity,
        desc: "hCG is the 'pregnancy hormone' produced by the cells that will eventually form the placenta.\n\nIts primary job is to shout to the corpus luteum: 'Do not die! Keep making progesterone to sustain this pregnancy!' hCG is the exact hormone that home pregnancy tests detect in your urine.",
      },
      {
        title: "The Placental Shift",
        icon: Shield,
        desc: "For the first 10 weeks of pregnancy, the corpus luteum in the ovary produces all the progesterone necessary to keep the baby alive.\n\nAround weeks 10-12, the placenta is fully formed and takes over hormone production, pumping out massive amounts of estrogen and progesterone. This transition is often when morning sickness and first-trimester fatigue begin to lift.",
      },
      {
        title: "The Postpartum Hormone Crash",
        icon: Brain,
        desc: "Within 24 hours of delivering the placenta, a woman's estrogen and progesterone levels plummet from the highest they will ever be in her life, back down to nearly zero.\n\nThis is the single largest and most sudden hormonal shift a human being can experience. This drastic crash is the biological trigger for the 'baby blues' and is a major contributing factor to Postpartum Depression and Anxiety.",
      },
      {
        title: "Prolactin & Breastfeeding",
        icon: Baby,
        desc: "Prolactin is the hormone responsible for producing breast milk. While nursing, prolactin levels remain extremely high.\n\nHigh prolactin actively suppresses the release of FSH and LH from the brain, which keeps the ovaries dormant, preventing ovulation and menstruation (Lactational Amenorrhea). Once nursing frequency decreases, prolactin drops, and the menstrual cycle returns.",
      },
      {
        title: "Postpartum Thyroiditis",
        icon: AlertCircle,
        desc: "During pregnancy, the immune system is naturally suppressed so the body doesn't reject the baby. After birth, the immune system rebounds aggressively.\n\nIn some women, this rebound causes the immune system to mistakenly attack the thyroid gland. This leads to a temporary phase of hyperthyroidism (anxiety, weight loss) followed by a crash into hypothyroidism (severe fatigue, depression, weight gain) in the first year postpartum.",
      },
    ],
  },
  {
    category: "Perimenopause & Menopause",
    items: [
      {
        title: "Perimenopause Defined",
        icon: Clock,
        desc: "The transitional phase leading up to menopause, often starting in a woman's early 40s and lasting 4 to 10 years.\n\nDuring this time, the ovaries begin to run out of viable eggs, leading to erratic ovulation. Estrogen levels wildly fluctuate (spiking incredibly high before dropping), and progesterone levels plummet due to missed ovulations, creating a chaotic hormonal environment.",
      },
      {
        title: "Menopause Defined",
        icon: Moon,
        desc: "Menopause is officially reached when a woman has gone 12 consecutive months without a menstrual period, marking the permanent end of ovarian function and natural fertility.\n\nThe average age of menopause is 51. After menopause, the ovaries produce almost zero estrogen or progesterone, though the adrenal glands continue to produce small amounts of hormones.",
      },
      {
        title: "The Etiology of Hot Flashes",
        icon: Flame,
        desc: "Vasomotor symptoms (hot flashes and night sweats) affect up to 80% of perimenopausal women.\n\nAs estrogen levels definitively drop, the hypothalamus (the brain's temperature control center) becomes hyper-sensitive. It falsely perceives minor changes in body temperature as severe overheating, triggering a massive, sudden release of heat through rapid sweating and flushed skin.",
      },
      {
        title: "Bone Density & Osteoporosis",
        icon: Bone,
        desc: "Estrogen is directly responsible for inhibiting osteoclasts, the cells that break down bone tissue. \n\nWhen estrogen plummets during menopause, bone breakdown outpaces bone building, leading to a rapid loss of bone mass in the first five years post-menopause. Strength training and adequate calcium/Vitamin D are critical to prevent osteoporosis.",
      },
      {
        title: "Vaginal Atrophy",
        icon: Droplet,
        desc: "The tissues of the vagina and vulva are densely packed with estrogen receptors. When estrogen vanishes after menopause, these tissues become thin, dry, and lose elasticity.\n\nThis condition, known as Genitourinary Syndrome of Menopause (GSM), causes severe pain during intercourse, chronic itching, and frequent urinary tract infections. Localized vaginal estrogen cream is a highly effective, safe treatment.",
      },
      {
        title: "Hormone Replacement Therapy (HRT)",
        icon: Pill,
        desc: "Menopausal Hormone Therapy (MHT) involves supplementing the body with bioidentical estrogen and progesterone to alleviate severe menopausal symptoms.\n\nModern clinical consensus shows that when started within 10 years of menopause, HRT is profoundly safe for most women and provides massive protective benefits for the heart, brain, and bones, drastically improving quality of life.",
      },
    ],
  },
];

export default function EducationClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"teen" | "adult" | "relationship">(
    "teen",
  );

  // SECURE LOCK STATE
  const [isAdultUnlocked, setIsAdultUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Determine which array of data to show based on the toggle state
  let activeDataset = TEEN_DATA;
  if (activeTab === "adult") {
    activeDataset = ADULT_DATA;
  } else if (activeTab === "relationship") {
    activeDataset = ADULT_INTIMACY_MASTERCLASS;
  }

  // Handle the custom global admin password check
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setPinError("");

    const supabase = createClient();

    // Fetch all THREE global admin passwords from the app_settings table
    const { data, error } = await supabase
      .from("app_settings")
      .select("admin_password, secondary_password, tertiary_password")
      .eq("id", 1)
      .single();

    // Enforce strict fallbacks if the table is empty or missing
    const primaryPassword =
      data && data.admin_password ? data.admin_password : "admin";
    const secondaryPassword =
      data && data.secondary_password ? data.secondary_password : "admin";
    const tertiaryPassword =
      data && data.tertiary_password ? data.tertiary_password : "admin";

    setTimeout(() => {
      // Check if the input matches ANY of the three passwords
      if (
        pinInput === primaryPassword ||
        pinInput === secondaryPassword ||
        pinInput === tertiaryPassword
      ) {
        setIsAdultUnlocked(true);
        setPinInput("");
      } else {
        setPinError("Incorrect Admin Password.");
        setPinInput("");
      }
      setVerifying(false);
    }, 500);

  };
  
  // Filter topics based on search keyword
  // CRITICAL SECURITY: If searching while locked, ONLY search TEEN_DATA.
  const datasetToSearch =
    activeTab !== "teen" && !isAdultUnlocked ? [] : activeDataset;

  const filteredData = datasetToSearch
    .map((category) => {
      return {
        ...category,
        items: category.items.filter(
          (item) =>
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.desc.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      };
    })
    .filter((category) => category.items.length > 0);

  // Calculate the grand total of all topics
  const totalTopics =
    TEEN_DATA.reduce((acc, cat) => acc + cat.items.length, 0) +
    ADULT_DATA.reduce((acc, cat) => acc + cat.items.length, 0) +
    ADULT_INTIMACY_MASTERCLASS.reduce((acc, cat) => acc + cat.items.length, 0);

  return (
    <div className="animate-in fade-in duration-300 w-full max-w-[1400px] mx-auto pb-10 px-4 md:px-0">
      {/* HEADER & SEARCH */}
      <div className="mb-[30px] flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-[24px] md:text-[28px] font-extrabold text-ink mb-2 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#d990a8]" /> Education & Wellness
          </h2>
          <p className="text-[13px] md:text-[14px] text-muted">
            Explore {totalTopics} deep-dive topics on biology, endocrinology,
            and marital intimacy.
          </p>
        </div>

        <div className="relative w-full md:w-[320px]">
          <Search className="w-4 h-4 text-muted absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search topics, symptoms, hormones..."
            value={searchTerm}
            onChange={(e) => {
              // If user is typing in search while on a locked adult tab, force them back to teen tab to see results securely
              if (!isAdultUnlocked && activeTab !== "teen") {
                setActiveTab("teen");
              }
              setSearchTerm(e.target.value);
            }}
            className="w-full pl-9 pr-4 py-2.5 border border-[#eadfe4] rounded-[14px] bg-white outline-none focus:border-[#d990a8] text-[13px] shadow-sm transition-colors"
          />
        </div>
      </div>

      {/* THREE-WAY SEGMENTED TOGGLE SWITCH */}
      <div className="flex justify-center mb-10 w-full">
        <div className="bg-[#fff0f3] border border-[#fbeaf0] p-1.5 rounded-[20px] md:rounded-full inline-flex relative shadow-inner w-full md:w-auto flex-col md:flex-row gap-2 md:gap-0">
          <div
            className={`hidden md:block absolute top-1.5 bottom-1.5 w-[calc(33.33%-4px)] bg-white rounded-full shadow-sm border border-[#f4c2c2] transition-all duration-300 ease-out z-0
              ${
                activeTab === "teen"
                  ? "left-1.5"
                  : activeTab === "adult"
                    ? "left-[calc(33.33%+1px)]"
                    : "left-[calc(66.66%-1.5px)]"
              }`}
          ></div>

          <button
            onClick={() => setActiveTab("teen")}
            className={`relative z-10 px-4 sm:px-8 py-3 md:py-2.5 text-[13px] md:text-[14px] font-extrabold rounded-[16px] md:rounded-full flex items-center justify-center gap-2 transition-colors duration-300 w-full md:w-auto
              ${activeTab === "teen" ? "bg-white md:bg-transparent text-[#841617] shadow-sm md:shadow-none border border-[#f4c2c2] md:border-transparent" : "text-[#a55f78] hover:text-[#841617]"}`}
          >
            <User className="w-4 h-4" /> Teen & Foundational
          </button>

          <button
            onClick={() => setActiveTab("adult")}
            className={`relative z-10 px-4 sm:px-8 py-3 md:py-2.5 text-[13px] md:text-[14px] font-extrabold rounded-[16px] md:rounded-full flex items-center justify-center gap-2 transition-colors duration-300 w-full md:w-auto
              ${activeTab === "adult" ? "bg-white md:bg-transparent text-[#841617] shadow-sm md:shadow-none border border-[#f4c2c2] md:border-transparent" : "text-[#a55f78] hover:text-[#841617]"}`}
          >
            <Users className="w-4 h-4" /> Adult & Clinical
            {!isAdultUnlocked && (
              <Lock className="w-3.5 h-3.5 ml-1 opacity-70" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("relationship")}
            className={`relative z-10 px-4 sm:px-8 py-3 md:py-2.5 text-[13px] md:text-[14px] font-extrabold rounded-[16px] md:rounded-full flex items-center justify-center gap-2 transition-colors duration-300 w-full md:w-auto
              ${activeTab === "relationship" ? "bg-white md:bg-transparent text-[#841617] shadow-sm md:shadow-none border border-[#f4c2c2] md:border-transparent" : "text-[#a55f78] hover:text-[#841617]"}`}
          >
            <HeartHandshake className="w-4 h-4" /> Adult Relationship
            {!isAdultUnlocked && (
              <Lock className="w-3.5 h-3.5 ml-1 opacity-70" />
            )}
          </button>
        </div>
      </div>

      {/* SECURITY LOCK SCREEN FOR ADULT TABS */}
      {activeTab !== "teen" && !isAdultUnlocked ? (
        <div className="bg-white border border-[#fbeaf0] rounded-[24px] p-8 md:p-[60px] text-center shadow-sm max-w-[500px] mx-auto animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-[#fff0f3] rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-[#d990a8]" />
          </div>
          <h3 className="text-[20px] font-extrabold text-ink mb-2">
            Age Restricted Content
          </h3>
          <p className="text-[14px] text-muted mb-8 leading-relaxed">
            The Adult & Clinical and Marital Intimacy libraries contain
            sensitive physiological and anatomical topics. Please enter the
            global Admin Password to unlock this session.
          </p>

          <form
            onSubmit={handlePinSubmit}
            className="flex flex-col items-center gap-4"
          >
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter Admin Password"
              className="w-full max-w-[250px] text-center text-[16px] font-bold p-3 border-2 border-[#eadfe4] rounded-[16px] bg-slate-50 outline-none focus:border-[#d990a8] focus:bg-white transition-colors"
              autoFocus
            />
            {pinError && (
              <span className="text-[13px] font-bold text-[#841617]">
                {pinError}
              </span>
            )}

            <button
              type="submit"
              disabled={pinInput.length === 0 || verifying}
              className="mt-2 px-8 py-3 bg-ink text-white font-bold text-[14px] rounded-[14px] hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {verifying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Unlock className="w-4 h-4" />
              )}
              {verifying ? "Verifying..." : "Unlock Content"}
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* CONTEXTUAL BANNER BASED ON TAB */}
          {!searchTerm && (
            <div className="bg-[#fcf8fa] border border-[#f5e6ec] rounded-[24px] p-6 mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-sm">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-[#eadfe4]">
                {activeTab === "teen" && (
                  <User className="w-6 h-6 text-[#a55f78]" />
                )}
                {activeTab === "adult" && (
                  <Stethoscope className="w-6 h-6 text-[#a55f78]" />
                )}
                {activeTab === "relationship" && (
                  <HeartHandshake className="w-6 h-6 text-[#a55f78]" />
                )}
              </div>
              <div>
                <h4 className="text-[16px] font-extrabold text-[#765f6b] mb-1.5 flex items-center gap-2">
                  {activeTab === "teen" && "Your Body, Your Blueprint"}
                  {activeTab === "adult" && (
                    <>
                      Advanced Body Literacy{" "}
                      {isAdultUnlocked && (
                        <Unlock className="w-3.5 h-3.5 text-[#d990a8]" />
                      )}
                    </>
                  )}
                  {activeTab === "relationship" && (
                    <>
                      Marital Intimacy & Education{" "}
                      {isAdultUnlocked && (
                        <Unlock className="w-3.5 h-3.5 text-[#d990a8]" />
                      )}
                    </>
                  )}
                </h4>
                <p className="text-[14px] text-muted leading-relaxed">
                  {activeTab === "teen" &&
                    "Understanding your cycle is a superpower. Below you will find the biological foundations of how your body works, from the four phases of the month to how hormones affect your sports performance and moods."}
                  {activeTab === "adult" &&
                    "The female endocrine system is incredibly complex. The encyclopedia below bridges the gap between clinical pathology, fertility awareness, and deep endocrinology."}
                  {activeTab === "relationship" &&
                    "True intimacy requires both biological knowledge and psychological safety. This masterclass covers everything from female sexual anatomy and libido fluctuations to navigating the roommate phase and long-term connection with your husband."}
                </p>
              </div>
            </div>
          )}

          {/* CONTENT CATEGORIES */}
          {filteredData.length === 0 ? (
            <div className="bg-white border border-[#fbeaf0] rounded-[24px] p-[60px] text-center shadow-sm">
              <p className="text-[15px] text-muted font-medium">
                No topics found for "{searchTerm}" in this library. Try
                switching tabs or using a different keyword.
              </p>
            </div>
          ) : (
            <div className="space-y-14">
              {filteredData.map((category, idx) => (
                <div key={idx}>
                  <h3 className="text-[20px] md:text-[22px] font-extrabold text-[#765f6b] mb-6 border-b-2 border-[#fbeaf0] pb-3 inline-block">
                    {category.category}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
                    {category.items.map((item, itemIdx) => (
                      <div
                        key={itemIdx}
                        className="bg-white border border-[#fbeaf0] rounded-[24px] p-6 md:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-[#d990a8] transition-all duration-300 group flex flex-col h-full"
                      >
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 rounded-full bg-slate-50 border border-[#eadfe4] flex items-center justify-center group-hover:bg-[#fff0f3] group-hover:border-[#f4c2c2] transition-colors shadow-sm flex-shrink-0">
                            <item.icon className="w-6 h-6 text-[#a55f78]" />
                          </div>
                          <h4 className="text-[16px] md:text-[18px] font-extrabold text-ink leading-tight">
                            {item.title}
                          </h4>
                        </div>

                        {/* DYNAMIC PARAGRAPH RENDERER */}
                        <div className="text-[14px] text-muted leading-relaxed flex-1 flex flex-col gap-4">
                          {item.desc.split("\n\n").map((paragraph, pIdx) => (
                            <p key={pIdx}>{paragraph}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
