"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { format, parseISO } from "date-fns";
import {
  Search,
  Plus,
  Save,
  Trash2,
  Tag,
  BookOpen,
  Calendar as CalendarIcon,
  PenLine,
  X,
  Sparkles,
  Bold,
  Italic,
  Underline,
  Link as LinkIcon,
  List,
  Type,
  Highlighter,
  RemoveFormatting,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useOfflineResilience,
  SaveStatusBadge,
  NetworkStatusBanner,
} from "@/components/NetworkResilience";
import { buildSyncTimestamps } from "@/utils/offlineTimestamps";

const SUGGESTED_JOURNAL_TAGS = [
  "gratitude",
  "reflection",
  "self-care",
  "mood",
  "vent",
  "milestone",
];

const FONT_SIZES = [
  { label: "Very Tiny", size: "10px" },
  { label: "Tiny", size: "12px" },
  { label: "Small", size: "14px" },
  { label: "Medium", size: "16px" },
  { label: "Normal (Default)", size: "18px" },
  { label: "Large", size: "22px" },
  { label: "Extra Large", size: "28px" },
  { label: "Huge", size: "36px" },
];

/**
 * Rich Text Editor with Infinite Native Color Pickers & Preserved Selection
 */


const RichTextEditor = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
  });
  const [selectedFontSizeLabel, setSelectedFontSizeLabel] =
    useState("Normal (Default)");

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (value === "" || !editorRef.current.contains(document.activeElement)) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value]);

  const updateActiveStates = () => {
    if (typeof window === "undefined") return;
    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
    });
  };

  // Crucial: Save selection right before the native color picker steals focus

  const saveCurrentSelection = () => {

    const sel = window.getSelection();
    if (
      sel &&
      sel.rangeCount > 0 &&
      editorRef.current?.contains(sel.anchorNode)
    ) {
      savedRangeRef.current = sel.getRangeAt(0);
    }
  };

  const executeCommand = (command: string, arg: string = "") => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    updateActiveStates();
  };

  const handleFontSizeSelect = (label: string, sizeValue: string) => {
    setSelectedFontSizeLabel(label);
    editorRef.current?.focus();

    // Restore selection if available


    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }

    if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const span = document.createElement("span");
      span.style.fontSize = sizeValue;
      try {
        span.appendChild(range.extractContents());
        range.insertNode(span);
        sel.removeAllRanges();
      } catch {
        document.execCommand("styleWithCSS", false, "true");
        document.execCommand("fontSize", false, "7");
        editorRef.current?.querySelectorAll('font[size="7"]').forEach((el) => {
          el.removeAttribute("size");
          (el as HTMLElement).style.fontSize = sizeValue;
        });
      }

    } else {
      const span = document.createElement("span");
      span.style.fontSize = sizeValue;
      span.innerHTML = "&#8203;";
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.insertNode(span);
        range.setStart(span.firstChild!, 1);
        range.setEnd(span.firstChild!, 1);
        sel.removeAllRanges();
        sel.addRange(range);
      } else if (editorRef.current) {
        editorRef.current.appendChild(span);
      }
    }

    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    updateActiveStates();
  };

  const handleClearFormatting = () => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }

    if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
      document.execCommand("removeFormat", false);
    } else if (editorRef.current) {
      const plainText = editorRef.current.innerText;
      editorRef.current.innerHTML = plainText;
      setSelectedFontSizeLabel("Normal (Default)");
    }

    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    updateActiveStates();
  };

  // Instant Native Color Applicator

  const handleColorChange = (
    command: "foreColor" | "hiliteColor",
    color: string,
  ) => {
    editorRef.current?.focus();

    // Restore selection immediately so the color applies to the correct text

    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }

    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(command, false, color);

    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    updateActiveStates();
  };

  const handleInsertLink = (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    let url = linkUrl.trim();
    if (url) {
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`;
      }
      editorRef.current?.focus();
      const sel = window.getSelection();
      if (sel && savedRangeRef.current) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
      const selectedText =
        sel && !sel.isCollapsed && sel.toString().trim() ? sel.toString() : url;

      const linkHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer" title="Opens: ${url}" style="color: #2563eb; text-decoration: underline; cursor: pointer;">${selectedText}</a>`;
      document.execCommand("insertHTML", false, linkHTML);

      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
      updateActiveStates();
      setLinkUrl("");
      setShowLinkInput(false);
      savedRangeRef.current = null;
    }
  };

  
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest("a");
    if (anchor && anchor.href) {
      e.preventDefault();
      window.open(anchor.href, "_blank", "noopener,noreferrer");
    }
  };

  const currentWordCount = useMemo(() => {
    if (!value) return 0;
    const plainText = value.replace(/<[^>]*>/g, " ").trim();
    return plainText ? plainText.split(/\s+/).length : 0;
  }, [value]);

  const currentCharacterCount = useMemo(() => {
    if (!value) return 0;
    return value.replace(/<[^>]*>/g, "").length;
  }, [value]);

  return (
    <div className="border border-line rounded-xl bg-white overflow-hidden shadow-2xs focus-within:border-[#d990a8] transition-colors flex flex-col">
      <div
        className="flex flex-wrap items-center gap-1.5 bg-[#fcf9fa] border-b border-line px-3 py-2 text-slate-700"
        onMouseDown={(e) => {
          if (
            (e.target as HTMLElement).tagName !== "INPUT" &&
            (e.target as HTMLElement).tagName !== "SELECT"
          ) {
            e.preventDefault();
          }
        }}
      >
        <button
          type="button"
          onClick={() => executeCommand("bold")}
          title="Bold"
          className={`p-1.5 rounded font-bold text-xs cursor-pointer transition-colors ${
            activeFormats.bold
              ? "bg-[#fff0f3] text-[#a55f78]"
              : "hover:bg-slate-200 text-slate-700"
          }`}
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("italic")}
          title="Italic"
          className={`p-1.5 rounded font-bold text-xs cursor-pointer transition-colors ${
            activeFormats.italic
              ? "bg-[#fff0f3] text-[#a55f78]"
              : "hover:bg-slate-200 text-slate-700"
          }`}
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("underline")}
          title="Underline"
          className={`p-1.5 rounded font-bold text-xs cursor-pointer transition-colors ${
            activeFormats.underline
              ? "bg-[#fff0f3] text-[#a55f78]"
              : "hover:bg-slate-200 text-slate-700"
          }`}
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-4 bg-line mx-0.5" />


        {/* Dropdown Font Size Selector */}


        <div className="flex items-center gap-1 bg-white border border-line rounded px-2 py-1 text-xs font-semibold text-ink">
          <Type className="w-3 h-3 text-muted shrink-0" />
          <select
            aria-label="Font Size Selector"
            value={selectedFontSizeLabel}
            onMouseDown={saveCurrentSelection}
            onChange={(e) => {
              const found = FONT_SIZES.find((f) => f.label === e.target.value);
              if (found) handleFontSizeSelect(found.label, found.size);
            }}
            className="bg-transparent border-0 outline-none text-xs cursor-pointer font-semibold text-ink pr-1"
          >
            {FONT_SIZES.map((f) => (
              <option key={f.size} value={f.label}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Formatting Button */}


        <button
          type="button"
          onClick={handleClearFormatting}
          onMouseDown={saveCurrentSelection}
          title="Remove all text formatting"
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1"
        >
          <RemoveFormatting className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-4 bg-line mx-0.5" />

        {/* Native Infinite Text Color Picker */}


        <div className="flex items-center gap-1 ml-0.5" title="Text Color">
          <input
            type="color"
            aria-label="Text Color"
            onMouseDown={saveCurrentSelection}
            onInput={(e) =>
              handleColorChange(
                "foreColor",
                (e.target as HTMLInputElement).value,
              )
            }
            defaultValue="#1E171B"
            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
          />
        </div>

        {/* Native Infinite Highlight Color Picker */}
        <div className="flex items-center gap-1 ml-0.5" title="Highlight Color">
          <Highlighter className="w-3.5 h-3.5 text-muted" />
          <input
            type="color"
            aria-label="Highlight Color"
            onMouseDown={saveCurrentSelection}
            onInput={(e) =>
              handleColorChange(
                "hiliteColor",
                (e.target as HTMLInputElement).value,
              )
            }
            defaultValue="#FFF0F3"
            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
          />
        </div>

        <span className="w-px h-4 bg-line mx-0.5" />

        <button
          type="button"
          onClick={() => {
            if (!showLinkInput) saveCurrentSelection();
            setShowLinkInput((prev) => !prev);
          }}
          title="Insert Link"
          className="p-1.5 rounded hover:bg-slate-200 font-bold text-xs cursor-pointer text-slate-700"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("insertUnorderedList")}
          title="Bullet List"
          className="p-1.5 rounded hover:bg-slate-200 font-bold text-xs cursor-pointer text-slate-700"
        >
          <List className="w-3.5 h-3.5" />
        </button>
      </div>

      {showLinkInput && (
        <div className="flex items-center gap-2 p-2.5 bg-slate-50 border-b border-line text-xs">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Paste URL (https://google.com)"
            className="flex-1 px-3 py-1.5 bg-white border border-line rounded-lg text-xs text-ink outline-none focus:border-[#d990a8]"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleInsertLink(e);
              }
            }}
          />
          <button
            type="button"
            onClick={handleInsertLink}
            className="px-3 py-1.5 bg-[#d990a8] text-white rounded-lg font-bold text-xs cursor-pointer"
          >
            Add Link
          </button>
          <button
            type="button"
            onClick={() => {
              setShowLinkInput(false);
              savedRangeRef.current = null;
            }}
            className="px-2.5 py-1.5 bg-slate-200 text-slate-700 rounded-lg font-bold text-xs cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}


      {/* Editable Writing Canvas with base size matching the dropdown default */}


      <div
        ref={editorRef}
        contentEditable
        spellCheck={false}
        onClick={handleEditorClick}
        onMouseUp={updateActiveStates}
        onKeyUp={updateActiveStates}
        onInput={(e) => {
          onChange(e.currentTarget.innerHTML);
          updateActiveStates();
        }}
        aria-label={placeholder}
        style={{ fontSize: "18px" }}
        className="w-full min-h-[220px] p-4 text-ink leading-relaxed outline-none overflow-y-auto resize-y [&_a]:text-blue-600 [&_a]:underline [&_a]:cursor-pointer hover:[&_a]:text-blue-800 [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5"
      />

      <div className="bg-[#fcf9fa] border-t border-line px-3.5 py-1.5 flex justify-end items-center text-[11px] font-medium text-muted tabular-nums select-none">
        <span>
          {currentWordCount} {currentWordCount === 1 ? "word" : "words"} •{" "}
          {currentCharacterCount} chars
        </span>
      </div>
    </div>
  );
};

export default function JournalPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedNoteIds, setExpandedNoteIds] = useState<
    Record<string, boolean>
  >({});
  const [isComposing, setIsComposing] = useState(false);
  const [activeUserId, setActiveUserId] = useState("local-user");

  // Composer state
  const [entryDate, setEntryDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentCreatedAt, setCurrentCreatedAt] = useState<string | null>(null);
  const [currentUpdatedAt, setCurrentUpdatedAt] = useState<string | null>(null);
  const draftCreatedAtRef = useRef<string | null>(null);

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
      setCurrentCreatedAt(serverData.created_at || null);
      setCurrentUpdatedAt(serverData.updated_at || null);
      draftCreatedAtRef.current = serverData.created_at || null;
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
          if (p.created_at) {
            setCurrentCreatedAt(p.created_at);
            draftCreatedAtRef.current = p.created_at;
          }
          if (p.updated_at) {
            setCurrentUpdatedAt(p.updated_at);
          }
          setIsComposing(true);
        }
      }
    }
    restoreUnsavedDraft();
  }, [fetchNotes, checkExistingDraft]);

  const generatePayload = useCallback(
    (currentTitle: string, currentContent: string, currentTags: string[]) => {
      const timestamps = buildSyncTimestamps({
        created_at: currentCreatedAt || draftCreatedAtRef.current,
        updated_at: currentUpdatedAt,
      });

      if (!draftCreatedAtRef.current) {
        draftCreatedAtRef.current = timestamps.created_at;
      }

      return {
        id: editingId || undefined,
        title: currentTitle || "Untitled Entry",
        content: currentContent,
        tags: currentTags,
        created_at: timestamps.created_at,
        updated_at: timestamps.updated_at,
      };
    },
    [editingId, currentCreatedAt, currentUpdatedAt],
  );

  const addTagValue = (rawTag: string) => {
    const newTag = rawTag.trim().replace(/^#/, "");
    if (!newTag) return;
    if (!tags.includes(newTag)) {
      const newTags = [...tags, newTag];
      setTags(newTags);
      triggerAutosave(generatePayload(title, content, newTags), false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      addTagValue(tagInput);
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
      setNotes((prev) => [
        {
          id: editingId || `offline-${Date.now()}`,
          entry_date: entryDate,
          title: payload.title,
          content: payload.content,
          tags: payload.tags,
          created_at: payload.created_at,
          updated_at: payload.updated_at,
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
    setCurrentCreatedAt(null);
    setCurrentUpdatedAt(null);
    draftCreatedAtRef.current = null;
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
    const initialCreated = note.created_at || note.updated_at || null;
    setCurrentCreatedAt(initialCreated);
    setCurrentUpdatedAt(note.updated_at || null);
    draftCreatedAtRef.current = initialCreated;
    setIsComposing(true);
  };

  const allExistingTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => {
      if (Array.isArray(n.tags)) {
        n.tags.forEach((t: string) => {
          if (t && t.trim()) set.add(t.trim());
        });
      }
    });
    return Array.from(set).slice(0, 10);
  }, [notes]);

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

    <div className="animate-in fade-in duration-300 max-w-[820px] mx-auto pb-14 text-ink">
      <NetworkStatusBanner
        isOnline={isOnline}
        conflict={conflict}
        syncError={syncError}
        onKeepLocal={resolveKeepLocal}
        onKeepServer={resolveKeepServer}
      />


      {/* EDITORIAL JOURNAL MASTHEAD */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#a55f78] mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#d990a8]" />
            <span>Private Sanctuary • Encrypted Reflections</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-[24px] sm:text-[26px] font-bold text-ink tracking-tight">
              Personal Journal 📔
            </h2>
            {!isComposing && notes.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2] tabular-nums">
                {notes.length} {notes.length === 1 ? "entry" : "entries"}
              </span>
            )}
            {isComposing && (
              <SaveStatusBadge status={status} lastSavedAt={lastSavedAt} />
            )}
          </div>
          <p className="text-[13px] text-muted mt-0.5">
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
            className="self-start sm:self-auto flex items-center gap-2 px-5 py-3 bg-[#d990a8] text-white rounded-xl text-[13px] font-bold hover:brightness-95 transition-all shadow-[0_6px_20px_-6px_rgba(217,144,168,0.65)] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Entry
          </button>
        )}
      </div>


      {isComposing ? (

        /* STATIONERY-GRADE JOURNAL COMPOSER */

        <form
          onSubmit={handleSave}
          className="bg-white border border-[#d990a8]/60 rounded-2xl p-5 sm:p-7 shadow-[0_12px_36px_-16px_rgba(165,95,120,0.16)] mb-7 animate-in fade-in duration-200"
        >
          {/* Composer Top Bar */}
          <div className="flex flex-wrap justify-between items-center gap-3 pb-4 mb-5 border-b border-line/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#fff0f3] border border-[#f4c2c2] flex items-center justify-center text-[#a55f78]">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-ink leading-tight">
                  {editingId ? "Edit Reflection" : "New Journal Entry"}
                </h3>
                <p className="text-[11px] text-muted">
                  Saved automatically to your device while you type
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[#fcf9fa] border border-line rounded-xl px-3 py-1.5 focus-within:border-[#d990a8]">
              <CalendarIcon className="w-3.5 h-3.5 text-[#a55f78]" />
              <input
                type="date"
                value={entryDate}
                onChange={(e) => {
                  setEntryDate(e.target.value);
                  triggerAutosave(generatePayload(title, content, tags), false);
                }}
                required
                aria-label="Journal entry date"
                className="bg-transparent outline-none text-[12px] font-bold text-ink cursor-pointer"
              />
            </div>
          </div>

          {/* Editorial Title Input */}

          <div className="mb-4">
            <input
              type="text"
              placeholder="Give your reflection a title..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                triggerAutosave(
                  generatePayload(e.target.value, content, tags),
                  false,
                );
              }}
              className="w-full px-4 py-3.5 bg-[#fcf9fa] border border-line rounded-xl text-[16px] sm:text-[17px] font-bold text-ink placeholder:text-muted/60 outline-none focus:bg-white focus:border-[#d990a8] transition-colors"
            />
          </div>


          {/* Upgraded Gmail-Style Rich Text Editor for Journal Content */}

          <div className="mb-5">
            <RichTextEditor
              value={content}
              onChange={(html) => {
                setContent(html);
                triggerAutosave(generatePayload(title, html, tags), false);
              }}
              placeholder="Write what's on your mind... Format text or add links below."
            />
          </div>

          {/* Refined Tag Studio */}
          <div className="mb-6 p-4 rounded-xl bg-[#fcf9fa] border border-line">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#a55f78]" />
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#66545f]">
                  Tags (Press Enter to add)
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {SUGGESTED_JOURNAL_TAGS.map((preset) => {
                  const active = tags.includes(preset);
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        active ? handleRemoveTag(preset) : addTagValue(preset)
                      }
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                        active
                          ? "bg-[#a55f78] text-white border-[#a55f78]"
                          : "bg-white text-[#826f79] border-line hover:border-[#d990a8] hover:text-[#a55f78]"
                      }`}
                    >
                      +{preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 text-[11px] bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2] px-3 py-1 rounded-full font-bold"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-[#a55f78] hover:text-red-500 transition-colors cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <input
              type="text"
              placeholder="e.g., gratitude, reflection, vent..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="w-full p-2.5 border border-line rounded-xl text-[12px] bg-white outline-none focus:border-[#d990a8] transition-colors"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="sm:flex-1 py-3.5 bg-slate-100 text-[#66545f] font-bold text-[13px] rounded-xl hover:bg-slate-200 transition-all active:scale-[0.99] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="sm:flex-[2.2] flex items-center justify-center gap-2 py-3.5 bg-[#d990a8] text-white font-bold text-[13px] sm:text-[14px] rounded-xl hover:brightness-95 transition-all shadow-[0_6px_20px_-6px_rgba(217,144,168,0.65)] active:scale-[0.99] cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save Entry
            </button>
          </div>
        </form>
      ) : (
        <>

          {/* SEARCH & TAG FILTER BAR */}

          <div className="bg-white border border-line rounded-2xl p-3.5 shadow-soft mb-6 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search your journal by title, thoughts, or #tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 border border-line rounded-xl text-[13px] bg-[#fcf9fa] outline-none focus:bg-white focus:border-[#d990a8] transition-colors"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {allExistingTags.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                <span className="text-[11px] font-bold text-muted shrink-0 mr-1">
                  Filter:
                </span>
                {allExistingTags.map((t) => {
                  const isSelected =
                    searchTerm.toLowerCase() === t.toLowerCase();
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSearchTerm(isSelected ? "" : t)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#a55f78] text-white border-[#a55f78]"
                          : "bg-[#fcf9fa] text-[#826f79] border-line hover:border-[#d990a8] hover:text-[#a55f78]"
                      }`}
                    >
                      #{t}
                    </button>
                  );
                })}
              </div>
            )}
          </div>


          {loading ? (
            <div className="text-center p-12 bg-white border border-line rounded-2xl text-muted text-[13px] shadow-soft">
              Loading your journal...
            </div>
          ) : filteredNotes.length > 0 ? (
            <div className="space-y-4">
              {filteredNotes.map((note) => {
                const parsedDate = parseISO(note.entry_date);
                const isExpanded = Boolean(expandedNoteIds[note.id]);
                const isLongNote = (note.content || "").length > 240;

                return (
                  <div
                    key={note.id}
                    className="bg-white border border-line rounded-2xl p-5 sm:p-6 shadow-soft hover:border-[#d990a8]/60 hover:shadow-[0_8px_28px_-14px_rgba(165,95,120,0.14)] transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3.5 min-w-0">

                        {/* Editorial Date Badge */}

                        <div className="w-12 h-12 rounded-xl bg-[#fff0f3] border border-[#f4c2c2] flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#a55f78] leading-none">
                            {format(parsedDate, "MMM")}
                          </span>
                          <span className="text-[16px] font-extrabold text-ink leading-tight mt-0.5 tabular-nums">
                            {format(parsedDate, "dd")}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-[16px] font-bold text-ink tracking-tight truncate">
                            {note.title}
                          </h3>
                          <p className="text-[12px] text-[#a55f78] font-medium mt-0.5">
                            {format(parsedDate, "EEEE, MMMM d, yyyy")}
                          </p>
                        </div>
                      </div>

                      {/* Tactile Edit & Delete Actions */}
                      <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity items-center shrink-0">
                        <button
                          onClick={() => openEditor(note)}
                          className="inline-flex items-center gap-1.5 text-[12px] text-[#66545f] hover:text-[#a55f78] hover:border-[#d990a8] font-bold bg-[#fcf9fa] px-3 py-1.5 rounded-lg border border-line transition-colors cursor-pointer"
                        >
                          <PenLine className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
                          aria-label="Delete entry"
                          className="text-[12px] text-red-400 hover:text-red-600 hover:bg-red-50 font-bold bg-[#fcf9fa] p-2 rounded-lg border border-line hover:border-red-200 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Render HTML content from RichTextEditor securely */}

                    <div
                      dangerouslySetInnerHTML={{ __html: note.content }}
                      className={`text-[13.5px] text-[#66545f] leading-relaxed mb-3 [&_a]:text-blue-600 [&_a]:underline [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 ${
                        !isExpanded ? "line-clamp-3" : ""
                      }`}
                    />

                    {isLongNote && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedNoteIds((prev) => ({
                            ...prev,
                            [note.id]: !prev[note.id],
                          }))
                        }
                        className="text-[12px] font-bold text-[#a55f78] hover:underline mb-3 inline-block cursor-pointer"
                      >
                        {isExpanded ? "Show less" : "Read full entry"}
                      </button>
                    )}

                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-line/60">
                        {note.tags.map((tag: string) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setSearchTerm(tag)}
                            className="text-[11px] font-semibold bg-[#fcf9fa] hover:bg-[#fff0f3] text-[#826f79] hover:text-[#a55f78] px-2.5 py-1 rounded-full border border-line hover:border-[#f4c2c2] transition-colors cursor-pointer"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
          ) : (
            <div className="text-center py-14 px-6 bg-white border border-line rounded-2xl shadow-soft">
              <div className="w-12 h-12 rounded-2xl bg-[#fff0f3] border border-[#f4c2c2] text-[#a55f78] flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-[15px] font-bold text-ink mb-1">
                {searchTerm
                  ? "No matching entries found"
                  : "Your journal is waiting"}
              </h3>
              <p className="text-[13px] text-muted max-w-[360px] mx-auto">
                {searchTerm
                  ? "Try clearing your search filter or searching for a different keyword."
                  : "Capture your thoughts, reflections, or daily gratitude in your private space."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
