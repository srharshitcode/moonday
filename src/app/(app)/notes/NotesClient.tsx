"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { format, parseISO } from "date-fns";
import { HeartHandshake, ShieldAlert, Trash2, Pencil } from "lucide-react";

const LOCAL_NOTES_KEY = "moonday_partner_notes";

function getLocalNotesMap(userId: string): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(`${LOCAL_NOTES_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function removeLocalNote(userId: string, dateStr: string) {
  if (typeof window === "undefined") return;
  try {
    const map = getLocalNotesMap(userId);
    delete map[dateStr];
    localStorage.setItem(`${LOCAL_NOTES_KEY}_${userId}`, JSON.stringify(map));
  } catch {
    // Ignore storage errors
  }
}

export default function HusbandNotesPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch all rows for user without a fragile column-specific .order()
    const { data } = await supabase
      .from("husband_notes")
      .select("*")
      .eq("user_id", user.id);

    const localMap = getLocalNotesMap(user.id);
    const mergedByDate = new Map<string, any>();

    if (Array.isArray(data)) {
      data.forEach((row: any) => {
        const d =
          row.date ||
          row.entry_date ||
          row.log_date ||
          (row.created_at ? String(row.created_at).slice(0, 10) : "");
        const content = (row.content || row.note || "").trim();
        if (d && content) {
          mergedByDate.set(d, {
            id: row.id,
            noteDate: d,
            content,
          });
        }
      });
    }

    // Merge any locally cached notes so autosaved or offline notes always appear
    Object.entries(localMap).forEach(([dateStr, content]) => {
      const trimmed = (content || "").trim();
      if (trimmed && !mergedByDate.has(dateStr)) {
        mergedByDate.set(dateStr, {
          id: `local-${dateStr}`,
          noteDate: dateStr,
          content: trimmed,
        });
      } else if (trimmed && mergedByDate.has(dateStr)) {
        const existing = mergedByDate.get(dateStr);
        mergedByDate.set(dateStr, { ...existing, content: trimmed });
      }
    });

    const sorted = Array.from(mergedByDate.values()).sort((a, b) =>
      b.noteDate.localeCompare(a.noteDate),
    );

    setNotes(sorted);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleDelete = async (note: any) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      removeLocalNote(user.id, note.noteDate);
      if (note.id && !String(note.id).startsWith("local-")) {
        await supabase.from("husband_notes").delete().eq("id", note.id);
      }
    }
    fetchNotes();
  };

  return (
    <div className="animate-in fade-in duration-300 max-w-[800px]">
      <div className="mb-[25px]">
        <h2 className="text-[22px] font-bold text-ink mb-1 flex items-center gap-2">
          Notes for Your Husband 💌
        </h2>
        <p className="text-[13px] text-muted">
          A collection of notes you've logged specifically for him.
        </p>
      </div>

      <div className="bg-[#fff8fa] border border-[#fbeaf0] rounded-xl p-[18px] mb-[25px] flex gap-3">
        <ShieldAlert className="w-5 h-5 text-[#a55f78] shrink-0 mt-0.5" />
        <div>
          <h3 className="text-[13px] font-bold text-[#a55f78] mb-1">
            Privacy Notice
          </h3>
          <p className="text-[12px] text-[#66545f] leading-relaxed">
            These notes are saved securely and are <b>completely private</b>.
            MoonDay does not automatically send, email, or push these notes to
            your partner. You retain full control over when and how you choose
            to share them.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-8 text-muted text-[13px]">
          Loading notes...
        </div>
      ) : notes.length > 0 ? (
        <div className="space-y-4">
          {notes.map((note) => (
            <div
              key={note.id || note.noteDate}
              className="bg-white border border-[#f4c2c2] rounded-xl p-[20px] shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-[#fff0f3]">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-[#d990a8]" />
                  <h3 className="text-[14px] font-bold text-ink">
                    {format(parseISO(note.noteDate), "EEEE, MMMM d, yyyy")}
                  </h3>
                </div>

                <div className="flex items-center gap-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/log?date=${note.noteDate}`}
                    className="text-muted hover:text-[#d990a8] transition-colors"
                    title="Edit Note"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(note)}
                    className="text-muted hover:text-red-500 transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-[14px] text-[#66545f] leading-relaxed whitespace-pre-wrap">
                {note.content}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 bg-surface border border-line rounded-xl text-[13px] text-muted">
          No husband notes logged yet. You can write these from the "Log your
          MoonDay" screen.
        </div>
      )}
    </div>
  );
}
