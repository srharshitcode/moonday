import { createClient } from "@/utils/supabase/client";

export type SyncStatus =
  | "idle"
  | "saving-draft"
  | "draft-saved"
  | "syncing"
  | "synced"
  | "offline-queued"
  | "conflict"
  | "error";

export interface OfflineDraft<T = Record<string, unknown>> {
  id: string;
  userId: string;
  date: string;
  table: string;
  dateColumn: string;
  conflictTarget?: string;
  recordId?: string | null;
  payload: T;
  baseUpdatedAt: string | null;
  localUpdatedAt: string;
  synced: boolean;
}

export interface ConflictItem<T = Record<string, unknown>> {
  draft: OfflineDraft<T>;
  serverRecord: T & { updated_at?: string };
}

const DB_NAME = "moonday_offline_store";
const DB_VERSION = 3;
const DRAFTS_STORE = "drafts";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB is not supported in this environment."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (db.objectStoreNames.contains(DRAFTS_STORE)) {
        db.deleteObjectStore(DRAFTS_STORE);
      }
      const store = db.createObjectStore(DRAFTS_STORE, { keyPath: "id" });
      store.createIndex("by_user", "userId", { unique: false });
      store.createIndex("by_synced", "synced", { unique: false });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLocalDraft<T = Record<string, unknown>>(
  draft: OfflineDraft<T>,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DRAFTS_STORE, "readwrite");
    const store = tx.objectStore(DRAFTS_STORE);
    store.put(draft);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getLocalDraft<T = Record<string, unknown>>(
  id: string,
): Promise<OfflineDraft<T> | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DRAFTS_STORE, "readonly");
    const store = tx.objectStore(DRAFTS_STORE);
    const req = store.get(id);
    req.onsuccess = () => resolve((req.result as OfflineDraft<T>) || null);
    req.onerror = () => reject(req.error);
  });
}

export async function removeLocalDraft(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DRAFTS_STORE, "readwrite");
    const store = tx.objectStore(DRAFTS_STORE);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingDrafts(
  userId: string,
): Promise<OfflineDraft[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DRAFTS_STORE, "readonly");
    const store = tx.objectStore(DRAFTS_STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      const results = (req.result as OfflineDraft[]) || [];
      resolve(
        results.filter(
          (item) =>
            !item.synced &&
            (item.userId === userId || item.userId === "local-user"),
        ),
      );
    };
    req.onerror = () => reject(req.error);
  });
}

export async function syncDraftToSupabase<T extends Record<string, unknown>>(
  draft: OfflineDraft<T>,
  forceOverwrite = false,
): Promise<{
  status: "synced" | "conflict" | "error";
  conflict?: ConflictItem<T>;
  errorMessage?: string;
  serverUpdatedAt?: string;
}> {
  const supabase = createClient();

  try {
    let effectiveUserId = draft.userId;
    if (!effectiveUserId || effectiveUserId === "local-user") {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { status: "error", errorMessage: "User not authenticated" };
      }
      effectiveUserId = user.id;
    }

    const isEntryDateTable =
      draft.table === "personal_notes" ||
      draft.table === "intimacy_entries" ||
      draft.table === "husband_notes";

    const dateCol = isEntryDateTable
      ? "entry_date"
      : draft.dateColumn || "log_date";

    const nowIso = new Date().toISOString();

    const cleanPayload: Record<string, unknown> = {
      ...(draft.payload as Record<string, unknown>),
    };
    const payloadId =
      typeof cleanPayload.id === "string" ? cleanPayload.id : undefined;
    delete cleanPayload.id;

    if (isEntryDateTable) {
      delete cleanPayload.log_date;
    } else {
      delete cleanPayload.entry_date;
    }

    const recordData: Record<string, unknown> = {
      ...cleanPayload,
      user_id: effectiveUserId,
      [dateCol]: draft.date,
      updated_at: nowIso,
    };

    // MODE A: Date-keyed table (e.g. daily_logs)
    if (draft.conflictTarget && !isEntryDateTable) {
      const { data: existingRows, error: fetchError } = await supabase
        .from(draft.table)
        .select("*")
        .eq("user_id", effectiveUserId)
        .eq(dateCol, draft.date)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (fetchError) {
        return { status: "error", errorMessage: fetchError.message };
      }

      const existingRecord =
        (existingRows?.[0] as T & { id?: string; updated_at?: string }) || null;

      // Only trigger conflict if not forcing overwrite, a base timestamp exists,
      // and the server record is strictly newer by more than 2 seconds
      if (
        !forceOverwrite &&
        existingRecord &&
        existingRecord.updated_at &&
        draft.baseUpdatedAt &&
        new Date(existingRecord.updated_at).getTime() -
          new Date(draft.baseUpdatedAt).getTime() >
          2000
      ) {
        return {
          status: "conflict",
          conflict: {
            draft: { ...draft, userId: effectiveUserId },
            serverRecord: existingRecord,
          },
        };
      }

      if (existingRecord) {
        const updateQuery = supabase
          .from(draft.table)
          .update(recordData)
          .eq("user_id", effectiveUserId)
          .eq(dateCol, draft.date);

        const { error: updateError } = await updateQuery;
        if (updateError) {
          return { status: "error", errorMessage: updateError.message };
        }
      } else {
        const { error: insertError } = await supabase
          .from(draft.table)
          .insert([recordData]);

        if (insertError) {
          return { status: "error", errorMessage: insertError.message };
        }
      }
    } else {
      // MODE B: ID-keyed table (e.g. personal_notes)
      const targetId = draft.recordId || payloadId;

      if (targetId) {
        const { error: updateError } = await supabase
          .from(draft.table)
          .update(recordData)
          .eq("id", targetId)
          .eq("user_id", effectiveUserId);

        if (updateError) {
          return { status: "error", errorMessage: updateError.message };
        }
      } else {
        const { error: insertError } = await supabase
          .from(draft.table)
          .insert([recordData]);

        if (insertError) {
          return { status: "error", errorMessage: insertError.message };
        }
      }
    }

    await removeLocalDraft(draft.id);
    return { status: "synced", serverUpdatedAt: nowIso };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    return { status: "error", errorMessage: message };
  }
}
