"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  Infinity as InfinityIcon,
  Anchor,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";

type EducationLibrary = "teen" | "adult" | "relationship";

interface EducationTopicRow {
  id: string;
  library: EducationLibrary;
  category: string;
  category_order: number;
  item_order: number;
  title: string;
  icon_name: string | null;
  description: string;
}

interface EducationItem {
  id: string;
  title: string;
  icon: LucideIcon;
  desc: string;
}

interface EducationCategory {
  category: string;
  items: EducationItem[];
}

const ICON_MAP: Record<string, LucideIcon> = {
  Droplet,
  Sun,
  Sparkles,
  Moon,
  Activity,
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
  Infinity: InfinityIcon,
  Anchor,
};


function resolveIcon(iconName: string | null): LucideIcon {
  if (!iconName) return BookOpen;
  return ICON_MAP[iconName] || BookOpen;
}


function groupRowsByCategory(rows: EducationTopicRow[]): EducationCategory[] {
  const categoryMap = new Map<string, EducationItem[]>();


  for (const row of rows) {
    const existing = categoryMap.get(row.category) ?? [];
    existing.push({
      id: row.id,
      title: row.title,
      icon: resolveIcon(row.icon_name),
      desc: row.description,
    });
    categoryMap.set(row.category, existing);
  }


  return Array.from(categoryMap.entries()).map(([category, items]) => ({
    category,
    items,
  }));
}


export default function EducationClient() {
  const supabase = useMemo(() => createClient(), []);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<EducationLibrary>("teen");

  // SUPABASE LIBRARY DATA & LOADING STATE


  const [libraries, setLibraries] = useState<
    Record<EducationLibrary, EducationCategory[]>
  >({
    teen: [],
    adult: [],
    relationship: [],
  });
  const [loadedTabs, setLoadedTabs] = useState<
    Record<EducationLibrary, boolean>
  >({
    teen: false,
    adult: false,
    relationship: false,
  });
  const [loadingTab, setLoadingTab] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string>("");
  const [totalTopics, setTotalTopics] = useState<number | null>(null);

  // SECURE LOCK STATE

  const [isAdultUnlocked, setIsAdultUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [verifying, setVerifying] = useState(false);


  // Fetch a specific library from Supabase


  const fetchLibrary = useCallback(
    async (library: EducationLibrary, force = false) => {
      if (!force && loadedTabs[library]) return;

      setLoadingTab(true);
      setFetchError("");

      const { data, error } = await supabase
        .from("education_topics")
        .select(
          "id, library, category, category_order, item_order, title, icon_name, description",
        )
        .eq("library", library)
        .eq("is_published", true)
        .order("category_order", { ascending: true })
        .order("item_order", { ascending: true });

      if (error) {
        setFetchError(
          "Unable to load this library from the database right now.",
        );
        setLoadingTab(false);
        return;
      }

      const grouped = groupRowsByCategory((data as EducationTopicRow[]) || []);

      setLibraries((prev) => ({ ...prev, [library]: grouped }));
      setLoadedTabs((prev) => ({ ...prev, [library]: true }));
      setLoadingTab(false);
    },
    [loadedTabs, supabase],
  );


  // Fetch lightweight total count (headers only — zero content exposed)


  useEffect(() => {
    let active = true;

    async function fetchTotalCount() {
      const { count } = await supabase
        .from("education_topics")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true);

      if (active && typeof count === "number") {
        setTotalTopics(count);
      }
    }

    fetchTotalCount();
    return () => {
      active = false;
    };
  }, [supabase]);


  // Load Teen library immediately; load Adult / Relationship only after unlock


  useEffect(() => {
    if (activeTab === "teen") {
      fetchLibrary("teen");
    } else if (isAdultUnlocked) {
      fetchLibrary(activeTab);
    }
  }, [activeTab, isAdultUnlocked, fetchLibrary]);


  // Handle the custom global admin password check

  
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setPinError("");

    const { data } = await supabase
      .from("app_settings")
      .select("admin_password, secondary_password, tertiary_password")
      .eq("id", 1)
      .single();

    const primaryPassword =
      data && data.admin_password ? data.admin_password : "admin";
    const secondaryPassword =
      data && data.secondary_password ? data.secondary_password : "admin";
    const tertiaryPassword =
      data && data.tertiary_password ? data.tertiary_password : "admin";

    setTimeout(() => {
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


  // CRITICAL SECURITY: Never expose or search restricted libraries while locked


  const activeDataset = libraries[activeTab];
  const datasetToSearch =
    activeTab !== "teen" && !isAdultUnlocked ? [] : activeDataset;

  const filteredData = datasetToSearch
    .map((category) => ({
      ...category,
      items: category.items.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.desc.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    }))
    .filter((category) => category.items.length > 0);

  const isLockedView = activeTab !== "teen" && !isAdultUnlocked;

  return (
    <div className="animate-in fade-in duration-300 w-full max-w-[1400px] mx-auto pb-10 px-4 md:px-0">


      {/* HEADER & SEARCH */}


      <div className="mb-[30px] flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-[24px] md:text-[28px] font-extrabold text-ink mb-2 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#d990a8]" /> Education & Wellness
          </h2>
          <p className="text-[13px] md:text-[14px] text-muted">
            {totalTopics !== null && totalTopics > 0
              ? `Explore ${totalTopics} deep-dive topics on biology, endocrinology, and marital intimacy.`
              : "Explore deep-dive topics on biology, endocrinology, and marital intimacy."}
          </p>
        </div>


        <div className="relative w-full md:w-[320px]">
          <Search className="w-4 h-4 text-muted absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search topics, symptoms, hormones..."
            value={searchTerm}
            onChange={(e) => {
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


      {isLockedView ? (
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


          {/* LOADING / ERROR / CONTENT CATEGORIES */}


          {loadingTab && !loadedTabs[activeTab] ? (
            <div className="bg-white border border-[#fbeaf0] rounded-[24px] p-[60px] flex flex-col items-center justify-center gap-3 shadow-sm">
              <Loader2 className="w-8 h-8 animate-spin text-[#d990a8]" />
              <p className="text-[14px] text-muted font-medium">
                Loading library from MoonDay Sanctuary...
              </p>
            </div>
          ) : fetchError ? (
            <div className="bg-white border border-[#fbeaf0] rounded-[24px] p-[60px] text-center shadow-sm flex flex-col items-center gap-4">
              <AlertCircle className="w-8 h-8 text-[#a55f78]" />
              <p className="text-[15px] text-muted font-medium">{fetchError}</p>
              <button
                type="button"
                onClick={() => fetchLibrary(activeTab, true)}
                className="px-6 py-2.5 bg-[#a55f78] text-white font-bold text-[13px] rounded-[12px] hover:brightness-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="bg-white border border-[#fbeaf0] rounded-[24px] p-[60px] text-center shadow-sm">
              <p className="text-[15px] text-muted font-medium">
                {searchTerm
                  ? `No topics found for "${searchTerm}" in this library. Try switching tabs or using a different keyword.`
                  : "No published topics are available in this library yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-14">
              {filteredData.map((category) => (
                <div key={category.category}>
                  <h3 className="text-[20px] md:text-[22px] font-extrabold text-[#765f6b] mb-6 border-b-2 border-[#fbeaf0] pb-3 inline-block">
                    {category.category}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
                    {category.items.map((item) => (
                      <div
                        key={item.id}
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
