"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Calendar,
  Droplet,
  Pill,
  Moon,
  Save,
  Loader2,
  VolumeX,
} from "lucide-react";

export default function RemindersClient() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [permission, setPermission] = useState<string>("default");

  // Toggle States
  const [moondayAlert, setMoondayAlert] = useState(false);
  const [dailyAlert, setDailyAlert] = useState(false);
  const [hydrationAlert, setHydrationAlert] = useState(true);
  const [medicationAlert, setMedicationAlert] = useState(false);

  // Quiet Hours
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("07:00");

  useEffect(() => {
    // Check initial notification permission on load
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // --- NATIVE DESKTOP NOTIFICATION SYSTEM ---
  const sendSystemNotification = (title: string, body: string) => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications.");
      return;
    }

    if (Notification.permission === "granted") {
      new Notification(title, {
        body: body,
        icon: "/icon.png",
        vibrate: [200, 100, 200],
      } as any);
    }
  };

  const handleToggle = async (
    currentValue: boolean,
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    title: string,
    successBody: string,
  ) => {
    const newValue = !currentValue;
    setter(newValue);

    // If turning ON, we must request browser permission
    if (newValue) {
      if (!("Notification" in window)) {
        alert(
          "Desktop notifications are not supported on this browser/device.",
        );
        setter(false);
        return;
      }

      let perm = Notification.permission;
      if (perm !== "granted") {
        perm = await Notification.requestPermission();
        setPermission(perm);
      }

      if (perm === "granted") {
        // Fire a live test notification to the desktop instantly
        sendSystemNotification(`🔔 ${title} Enabled`, successBody);
      } else {
        alert(
          "You must allow notifications in your browser settings to use this feature.",
        );
        setter(false); // Revert toggle if denied
      }
    }
  };

  const handleSave = () => {
    setSaving(true);
    // Here you would normally push these states to your Supabase 'profiles' table
    setTimeout(() => {
      setSaving(false);
      setMessage("Preferences saved securely ✨");
      setTimeout(() => setMessage(""), 3000);
    }, 800);
  };

  // Background Simulation: This will trigger a desktop notification every 2 hours if Hydration is ON and the tab is open
  useEffect(() => {
    if (hydrationAlert && permission === "granted") {
      const interval = setInterval(
        () => {
          sendSystemNotification(
            "💧 Hydration Check-in",
            "Take a moment to drink a glass of water!",
          );
        },
        1000 * 60 * 60 * 2,
      ); // 2 hours
      return () => clearInterval(interval);
    }
  }, [hydrationAlert, permission]);

  return (
    <div className="animate-in fade-in duration-300 max-w-[800px]">
      <div className="mb-[30px]">
        <h2 className="text-[24px] font-bold text-ink mb-1 flex items-center gap-2">
          Notifications & Reminders{" "}
          <Bell className="w-6 h-6 text-[#d990a8] fill-[#d990a8]" />
        </h2>
        <p className="text-[13px] text-muted">
          Control how and when MoonDay checks in with you.
        </p>

        {message && (
          <div className="mt-4 p-3 bg-[#fff0f3] border border-[#f4c2c2] text-[#a55f78] text-[13px] font-bold rounded-lg inline-block">
            {message}
          </div>
        )}

        {permission === "denied" && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-[13px] font-bold rounded-lg inline-block">
            ⚠️ You have blocked notifications in your browser settings. Please
            click the lock icon in your URL bar to allow them.
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Health & Cycle Alerts Card */}
        <div className="bg-white border border-[#fbeaf0] rounded-[24px] p-[24px] shadow-sm">
          <h3 className="text-[15px] font-bold text-ink mb-5">
            Health & Cycle Alerts
          </h3>

          <div className="space-y-4">
            {/* Moonday Reminder */}
            <div className="flex items-center justify-between p-4 border border-[#eadfe4] rounded-[16px] hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#fff0f3] rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#d990a8]" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-ink">
                    Expected Moonday Reminder
                  </h4>
                  <p className="text-[12px] text-muted mt-0.5">
                    Notifies you 2 days before your predicted start date.
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  handleToggle(
                    moondayAlert,
                    setMoondayAlert,
                    "Moonday Reminder",
                    "We will alert you 2 days before your next cycle begins.",
                  )
                }
                className={`w-12 h-6 rounded-full transition-colors relative ${moondayAlert ? "bg-[#d990a8]" : "bg-[#eadfe4]"}`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${moondayAlert ? "left-7" : "left-1"}`}
                ></span>
              </button>
            </div>

            {/* Daily Logging */}
            <div className="flex items-center justify-between p-4 border border-[#eadfe4] rounded-[16px] hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#fff0f3] rounded-full flex items-center justify-center">
                  <Bell className="w-5 h-5 text-[#d990a8]" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-ink">
                    Daily Logging Reminder
                  </h4>
                  <p className="text-[12px] text-muted mt-0.5">
                    A gentle nudge to log your symptoms at 8:00 PM.
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  handleToggle(
                    dailyAlert,
                    setDailyAlert,
                    "Daily Reminder",
                    "You will now receive a gentle logging nudge every evening.",
                  )
                }
                className={`w-12 h-6 rounded-full transition-colors relative ${dailyAlert ? "bg-[#d990a8]" : "bg-[#eadfe4]"}`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${dailyAlert ? "left-7" : "left-1"}`}
                ></span>
              </button>
            </div>

            {/* Hydration */}
            <div className="flex items-center justify-between p-4 border border-[#eadfe4] rounded-[16px] hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#fff0f3] rounded-full flex items-center justify-center">
                  <Droplet className="w-5 h-5 text-[#d990a8]" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-ink">
                    Hydration Check-ins
                  </h4>
                  <p className="text-[12px] text-muted mt-0.5">
                    Periodic reminders to drink water during the day.
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  handleToggle(
                    hydrationAlert,
                    setHydrationAlert,
                    "Hydration Check-ins",
                    "Time to grab a glass of water! We'll remind you periodically.",
                  )
                }
                className={`w-12 h-6 rounded-full transition-colors relative ${hydrationAlert ? "bg-[#d990a8]" : "bg-[#eadfe4]"}`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${hydrationAlert ? "left-7" : "left-1"}`}
                ></span>
              </button>
            </div>

            {/* Medication */}
            <div className="flex items-center justify-between p-4 border border-[#eadfe4] rounded-[16px] hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#fff0f3] rounded-full flex items-center justify-center">
                  <Pill className="w-5 h-5 text-[#d990a8]" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-ink">
                    Medication / Vitamins
                  </h4>
                  <p className="text-[12px] text-muted mt-0.5">
                    Reminds you to take daily supplements or birth control.
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  handleToggle(
                    medicationAlert,
                    setMedicationAlert,
                    "Medication Alerts",
                    "Your supplement reminders are now active.",
                  )
                }
                className={`w-12 h-6 rounded-full transition-colors relative ${medicationAlert ? "bg-[#d990a8]" : "bg-[#eadfe4]"}`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${medicationAlert ? "left-7" : "left-1"}`}
                ></span>
              </button>
            </div>
          </div>
        </div>

        {/* Quiet Hours Card */}
        <div className="bg-white border border-[#fbeaf0] rounded-[24px] p-[24px] shadow-sm">
          <h3 className="text-[15px] font-bold text-ink mb-5 flex items-center gap-2">
            <VolumeX className="w-5 h-5" /> Quiet Hours
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[12px] font-bold text-[#765f6b] mb-1.5">
                Do not disturb from
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={quietStart}
                  onChange={(e) => setQuietStart(e.target.value)}
                  className="w-full p-3 border border-[#eadfe4] rounded-[12px] bg-slate-50 outline-none focus:border-[#d990a8] text-[13px] font-bold text-ink"
                />
                <Moon className="w-4 h-4 text-muted absolute right-4 top-3.5 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#765f6b] mb-1.5">
                Until
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={quietEnd}
                  onChange={(e) => setQuietEnd(e.target.value)}
                  className="w-full p-3 border border-[#eadfe4] rounded-[12px] bg-slate-50 outline-none focus:border-[#d990a8] text-[13px] font-bold text-ink"
                />
                <Moon className="w-4 h-4 text-muted absolute right-4 top-3.5 pointer-events-none" />
              </div>
            </div>
          </div>
          <p className="text-[12px] text-muted">
            All notifications will be snoozed during these hours.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-[#d990a8] hover:bg-[#c47b93] text-white font-bold text-[14px] rounded-[16px] transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? "Saving Preferences..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}
