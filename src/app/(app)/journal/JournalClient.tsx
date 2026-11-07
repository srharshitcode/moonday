"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { format, parseISO } from "date-fns";
import { Search, Plus, Save, Trash2, Tag, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useOfflineResilience,
  SaveStatusBadge,
  NetworkStatusBanner,
} from "@/components/NetworkResilience";

export default function JournalPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [activeUserId, setActiveUserId] = useState("local-user");

  // Composer state
  const [entryDate, setEntryDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentUpdatedAt, setCurrentUpdatedAt] = useState<string | null>(null);

  const supabase = createClient();

  const {
    isOnline,
    status,
    lastSavedAt,
    syncError,
    conflict,
    saveEntry,
    triggerAutosave,
    checkExistingDraft,
    clearDraft,
    resolveKeepLocal,
    resolveKeepServer,
  } = useOfflineResilience({
    userId: activeUserId,
    date: entryDate,
    table: "personal_notes",
    dateColumn: "entry_date",
    recordId: editingId,
    draftKeySuffix: editingId || "new_journal_draft",
    initialServerUpdatedAt: currentUpdatedAt,
    onServerRestore: (serverData: any) => {
      setTitle(serverData.title || "");
      setContent(serverData.content || "");
      setTags(serverData.tags || []);
      setCurrentUpdatedAt(serverData.updated_at);
    },
  });

  const fetchNotes = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }
    setActiveUserId(user.id);

    const { data } = await supabase
      .from("personal_notes")
      .select("*")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (data) setNotes(data);
    setLoading(false);
  }, [supabase]);

  // Load notes and restore any unsaved journal draft on reload/navigation
  useEffect(() => {
    fetchNotes();

    async function restoreUnsavedDraft() {
      const existing = await checkExistingDraft();
      if (existing && existing.payload) {
        const p = existing.payload as Record<string, any>;
        if (p.content || p.title) {
          setEntryDate(existing.date || format(new Date(), "yyyy-MM-dd"));
          setTitle(p.title === "Untitled Entry" ? "" : p.title || "");
          setContent(p.content || "");
          setTags(Array.isArray(p.tags) ? p.tags : []);
          setEditingId(existing.recordId || null);
          setIsComposing(true);
        }
      }
    }
    restoreUnsavedDraft();
  }, [fetchNotes, checkExistingDraft]);

  const generatePayload = useCallback(
    (currentTitle: string, currentContent: string, currentTags: string[]) => ({
      id: editingId || undefined,
      title: currentTitle || "Untitled Entry",
      content: currentContent,
      tags: currentTags,
    }),
    [editingId],
  );

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!tags.includes(newTag)) {
        const newTags = [...tags, newTag];
        setTags(newTags);
        // Save draft locally on keystroke (syncToCloud = false until Save button is clicked)
        triggerAutosave(generatePayload(title, content, newTags), false);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter((t) => t !== tagToRemove);
    setTags(newTags);
    triggerAutosave(generatePayload(title, content, newTags), false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const payload = generatePayload(title, content, tags);
    const success = await saveEntry(payload, true);

    if (success) {
      setIsComposing(false);
      resetComposer();
      await fetchNotes();
      router.refresh();
    } else if (!isOnline) {
      // Optimistically show the offline-queued entry in the list
      setNotes((prev) => [
        {
          id: editingId || `offline-${Date.now()}`,
          entry_date: entryDate,
          title: payload.title,
          content: payload.content,
          tags: payload.tags,
        },
        ...prev,
      ]);
      setIsComposing(false);
      resetComposer();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this journal entry?")) return;

    const { error } = await supabase
      .from("personal_notes")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Error deleting note: " + error.message);
      return;
    }

    await fetchNotes();
    router.refresh();
  };

  const resetComposer = () => {
    setEntryDate(format(new Date(), "yyyy-MM-dd"));
    setTitle("");
    setContent("");
    setTags([]);
    setEditingId(null);
    setCurrentUpdatedAt(null);
  };

  const handleCancel = async () => {
    await clearDraft();
    resetComposer();
    setIsComposing(false);
  };

  const openEditor = (note: any) => {
    setEntryDate(note.entry_date);
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags || []);
    setEditingId(note.id);
    setCurrentUpdatedAt(note.updated_at);
    setIsComposing(true);
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.tags &&
        n.tags.some((t: string) =>
          t.toLowerCase().includes(searchTerm.toLowerCase()),
        )),
  );

  return (
    <div className="animate-in fade-in duration-300 max-w-[800px] pb-10">
      <NetworkStatusBanner
        isOnline={isOnline}
        conflict={conflict}
        syncError={syncError}
        onKeepLocal={resolveKeepLocal}
        onKeepServer={resolveKeepServer}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-[25px]">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-[22px] font-bold text-ink mb-1">
              Personal Journal 📔
            </h2>
            {isComposing && (
              <SaveStatusBadge status={status} lastSavedAt={lastSavedAt} />
            )}
          </div>
          <p className="text-[13px] text-muted">
            A private space for your thoughts, completely separate from health
            logs.
          </p>
        </div>
        {!isComposing && (
          <button
            onClick={() => {
              resetComposer();
              setIsComposing(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#d990a8] text-white rounded-[12px] text-[13px] font-bold hover:brightness-95 transition-all"
          >
            <Plus className="w-4 h-4" /> New Entry
          </button>
        )}
      </div>

      {isComposing ? (
        <form
          onSubmit={handleSave}
          className="bg-surface border border-line rounded-xl p-[22px] shadow-soft mb-[25px]"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[15px] font-bold text-ink flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#a55f78]" />{" "}
              {editingId ? "Edit Entry" : "New Entry"}
            </h3>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => {
                setEntryDate(e.target.value);
                triggerAutosave(generatePayload(title, content, tags), false);
              }}
              required
              className="p-2 border border-line rounded-[10px] outline-none focus:border-[#d990a8] text-[12px]"
            />
          </div>

          <input
            type="text"
            placeholder="Entry Title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              triggerAutosave(
                generatePayload(e.target.value, content, tags),
                false,
              );
            }}
            className="w-full p-3 mb-4 border border-line rounded-[11px] text-[14px] font-bold outline-none focus:border-[#d990a8]"
          />

          <textarea
            placeholder="Write what's on your mind..."
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              triggerAutosave(
                generatePayload(title, e.target.value, tags),
                false,
              );
            }}
            required
            className="w-full min-h-[200px] p-3 mb-4 border border-line rounded-[11px] text-[13px] leading-relaxed outline-none focus:border-[#d990a8] resize-y"
          />

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2 px-1">
              <Tag className="w-3.5 h-3.5 text-muted" />
              <label className="text-[11px] font-bold text-muted">
                Tags (Press Enter to add)
              </label>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 text-[11px] bg-slate-100 text-[#66545f] px-2 py-1 rounded-md font-bold"
                >
                  {tag}{" "}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-muted hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="e.g., gratitude, reflection, vent..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="w-full p-2.5 border border-line rounded-[10px] text-[12px] bg-slate-50 outline-none focus:border-[#d990a8]"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-3 bg-slate-100 text-[#66545f] font-bold text-[13px] rounded-[11px] hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] flex items-center justify-center gap-2 py-3 bg-[#d990a8] text-white font-bold text-[13px] rounded-[11px] hover:brightness-95 transition-all"
            >
              <Save className="w-4 h-4" /> Save Entry
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="relative mb-[25px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search your journal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-3 border border-line rounded-[12px] text-[13px] bg-white outline-none focus:border-[#d990a8] shadow-sm"
            />
          </div>

          {loading ? (
            <div className="text-center p-8 text-muted text-[13px]">
              Loading your journal...
            </div>
          ) : filteredNotes.length > 0 ? (
            <div className="space-y-4">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white border border-line rounded-xl p-[20px] shadow-sm hover:border-[#eadfe4] transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-[15px] font-bold text-ink">
                        {note.title}
                      </h3>
                      <p className="text-[11px] text-[#a55f78] font-medium">
                        {format(parseISO(note.entry_date), "MMMM d, yyyy")}
                      </p>
                    </div>
                    {/* FIXED: Buttons now always visible on mobile, hover-only on desktop */}
                    <div className="flex gap-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity items-center">
                      <button
                        onClick={() => openEditor(note)}
                        className="text-[12px] text-[#66545f] hover:text-[#d990a8] font-bold bg-slate-50 md:bg-transparent px-3 py-1.5 md:p-0 rounded-md md:rounded-none border border-line md:border-transparent"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="text-[12px] text-red-400 hover:text-red-500 font-bold bg-red-50 md:bg-transparent px-3 py-1.5 md:p-0 rounded-md md:rounded-none border border-red-100 md:border-transparent flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[13px] text-[#66545f] leading-relaxed whitespace-pre-wrap line-clamp-3 mb-3">
                    {note.content}
                  </p>
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {note.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="text-[10px] bg-slate-50 text-[#826f79] px-2 py-1 rounded-md border border-line"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 bg-surface border border-line rounded-xl text-[13px] text-muted">
              {searchTerm
                ? "No entries match your search."
                : "Your journal is empty. Write your first entry today."}
            </div>
          )}
        </>
      )}
    </div>
  );
}
