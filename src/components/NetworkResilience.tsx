"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  CloudOff,
  Loader2,
} from "lucide-react";
import {
  SyncStatus,
  OfflineDraft,
  ConflictItem,
  saveLocalDraft,
  getLocalDraft,
  removeLocalDraft,
  getPendingDrafts,
  syncDraftToSupabase,
} from "@/utils/offlineSync";

interface UseOfflineResilienceProps<T extends Record<string, unknown>> {
  userId: string;
  date: string;
  table: string;
  dateColumn?: string;
  conflictTarget?: string;
  recordId?: string | null;
  draftKeySuffix?: string;
  initialServerUpdatedAt?: string | null;
  onServerRestore?: (serverData: T) => void;
}

export function useOfflineResilience<T extends Record<string, unknown>>({
  userId,
  date,
  table,
  dateColumn = "log_date",
  conflictTarget,
  recordId = null,
  draftKeySuffix = "",
  initialServerUpdatedAt = null,
  onServerRestore,
}: UseOfflineResilienceProps<T>) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [conflict, setConflict] = useState<ConflictItem<T> | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Track the latest server updated_at across autosaves to prevent self-conflict
  const latestBaseUpdatedAtRef = useRef<string | null>(initialServerUpdatedAt);
  useEffect(() => {
    latestBaseUpdatedAtRef.current = initialServerUpdatedAt;
  }, [initialServerUpdatedAt, date]);

  const effectiveKey = draftKeySuffix || date || "default";
  const draftId = `${table}_${effectiveKey}`;
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setStatus((prev) => (prev === "syncing" ? "offline-queued" : prev));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const checkExistingDraft =
    useCallback(async (): Promise<OfflineDraft<T> | null> => {
      if (!effectiveKey) return null;
      try {
        const existing = await getLocalDraft<T>(draftId);
        if (existing && !existing.synced) {
          setStatus("draft-saved");
          return existing;
        }
      } catch {
        // Ignore IndexedDB errors
      }
      return null;
    }, [draftId, effectiveKey]);

  const clearDraft = useCallback(async () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    setIsDirty(false);
    setConflict(null);
    setSyncError(null);
    await removeLocalDraft(draftId);
    setStatus("idle");
  }, [draftId]);

  const saveEntry = useCallback(
    async (payload: T, syncImmediately = true): Promise<boolean> => {
      if (!date) return false;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      setStatus("saving-draft");
      setSyncError(null);

      const draft: OfflineDraft<T> = {
        id: draftId,
        userId: userId || "local-user",
        date,
        table,
        dateColumn,
        conflictTarget,
        recordId,
        payload,
        baseUpdatedAt: latestBaseUpdatedAtRef.current,
        localUpdatedAt: new Date().toISOString(),
        synced: false,
      };

      try {
        await saveLocalDraft(draft);
        setIsDirty(false);
        const timeStr = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        setLastSavedAt(timeStr);

        if (!navigator.onLine) {
          setStatus("offline-queued");
          return true;
        }

        if (!syncImmediately) {
          setStatus("draft-saved");
          return true;
        }

        setStatus("syncing");
        // Force overwrite when user explicitly saves or autosaves from active session
        const result = await syncDraftToSupabase(draft, true);

        if (result.status === "synced") {
          if (result.serverUpdatedAt) {
            latestBaseUpdatedAtRef.current = result.serverUpdatedAt;
          }
          setConflict(null);
          setSyncError(null);
          setStatus("synced");
          return true;
        } else if (result.status === "conflict" && result.conflict) {
          setConflict(result.conflict);
          setStatus("conflict");
          return false;
        } else {
          setSyncError(result.errorMessage || "Failed to sync with database");
          setStatus("error");
          return false;
        }
      } catch (err: unknown) {
        setSyncError(err instanceof Error ? err.message : "Save failed");
        setStatus("error");
        return false;
      }
    },
    [userId, date, table, dateColumn, conflictTarget, recordId, draftId],
  );

  const triggerAutosave = useCallback(
    (payload: T, syncToCloud = true) => {
      setIsDirty(true);
      setStatus("saving-draft");

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        saveEntry(payload, syncToCloud && navigator.onLine);
      }, 1000);
    },
    [saveEntry],
  );

  useEffect(() => {
    if (!isOnline || !userId || userId === "local-user") return;

    const flushPendingDrafts = async () => {
      const pending = await getPendingDrafts(userId);
      if (pending.length === 0) return;

      setStatus("syncing");
      for (const item of pending) {
        const res = await syncDraftToSupabase(item as OfflineDraft<T>, true);
        if (res.status === "synced" && res.serverUpdatedAt) {
          latestBaseUpdatedAtRef.current = res.serverUpdatedAt;
        } else if (res.status === "conflict" && res.conflict) {
          setConflict(res.conflict);
          setStatus("conflict");
          return;
        } else if (res.status === "error") {
          setSyncError(res.errorMessage || "Sync error");
          setStatus("error");
          return;
        }
      }
      setConflict(null);
      setSyncError(null);
      setStatus("synced");
    };

    flushPendingDrafts();
  }, [isOnline, userId]);

  const resolveKeepLocal = async () => {
    if (!conflict) return;
    setStatus("syncing");
    setSyncError(null);
    const res = await syncDraftToSupabase(conflict.draft, true);
    if (res.status === "synced") {
      if (res.serverUpdatedAt) {
        latestBaseUpdatedAtRef.current = res.serverUpdatedAt;
      }
      setConflict(null);
      setStatus("synced");
    } else {
      setSyncError(res.errorMessage || "Failed to overwrite");
      setStatus("error");
    }
  };

  const resolveKeepServer = async () => {
    if (!conflict) return;
    await removeLocalDraft(conflict.draft.id);
    if (conflict.serverRecord.updated_at) {
      latestBaseUpdatedAtRef.current = conflict.serverRecord.updated_at;
    }
    if (onServerRestore) {
      onServerRestore(conflict.serverRecord);
    }
    setConflict(null);
    setSyncError(null);
    setStatus("synced");
  };

  return {
    isOnline,
    status,
    isDirty,
    lastSavedAt,
    syncError,
    conflict,
    saveEntry,
    triggerAutosave,
    checkExistingDraft,
    clearDraft,
    resolveKeepLocal,
    resolveKeepServer,
  };
}

export function SaveStatusBadge({
  status,
  lastSavedAt,
}: {
  status: SyncStatus;
  lastSavedAt: string | null;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all bg-white border-[#eadfe4] text-[#765f6b]"
    >
      {status === "saving-draft" && (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#d990a8]" />
          <span>Saving...</span>
        </>
      )}
      {status === "draft-saved" && (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
          <span>
            Draft saved locally {lastSavedAt ? `at ${lastSavedAt}` : ""}
          </span>
        </>
      )}
      {status === "syncing" && (
        <>
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#d990a8]" />
          <span>Syncing to cloud...</span>
        </>
      )}
      {status === "synced" && (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Saved to cloud {lastSavedAt ? `at ${lastSavedAt}` : ""}</span>
        </>
      )}
      {status === "offline-queued" && (
        <>
          <CloudOff className="w-3.5 h-3.5 text-amber-600" />
          <span>Saved offline (Will sync automatically)</span>
        </>
      )}
      {status === "conflict" && (
        <>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Sync conflict detected</span>
        </>
      )}
      {status === "error" && (
        <>
          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          <span>Cloud sync error (Draft safe on device)</span>
        </>
      )}
      {status === "idle" && <span className="text-muted">Autosave active</span>}
    </div>
  );
}

export function NetworkStatusBanner<T extends Record<string, unknown>>({
  isOnline,
  conflict,
  syncError,
  onKeepLocal,
  onKeepServer,
}: {
  isOnline: boolean;
  conflict?: ConflictItem<T> | null;
  syncError?: string | null;
  onKeepLocal?: () => void;
  onKeepServer?: () => void;
}) {
  if (isOnline && !conflict && !syncError) return null;

  return (
    <div className="mb-4 space-y-2" role="alert" aria-live="assertive">
      {!isOnline && (
        <div className="flex items-center justify-between px-4 py-3 rounded-[16px] bg-amber-50 border border-amber-200 text-amber-900 text-[13px]">
          <div className="flex items-center gap-2.5 font-semibold">
            <WifiOff className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              You are currently offline. Changes are saved to your device and
              will sync automatically when reconnected.
            </span>
          </div>
        </div>
      )}

      {syncError && isOnline && (
        <div className="flex items-center justify-between px-4 py-3 rounded-[16px] bg-red-50 border border-red-200 text-red-900 text-[13px]">
          <div className="flex items-center gap-2.5 font-semibold">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              Database sync warning: {syncError}. Your draft is still preserved
              locally on this device.
            </span>
          </div>
        </div>
      )}

      {conflict && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 rounded-[16px] bg-rose-50 border border-rose-200 text-rose-950 text-[13px]">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Record Changed on Another Device</p>
              <p className="text-[12px] text-rose-800 mt-0.5">
                This entry ({conflict.draft.date}) was updated elsewhere. Choose
                which version to keep:
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onKeepLocal}
              className="px-3 py-1.5 rounded-lg bg-[#a55f78] text-white font-bold text-[12px] hover:bg-[#8e4f66] transition-colors"
            >
              Keep My Draft
            </button>
            <button
              type="button"
              onClick={onKeepServer}
              className="px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-900 font-bold text-[12px] hover:bg-rose-100 transition-colors"
            >
              Load Server Version
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
