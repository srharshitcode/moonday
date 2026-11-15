// src/utils/offlineTimestamps.ts

export interface TimestampedRecord {
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * Generates synchronized created_at and updated_at ISO timestamps
 * for offline-first IndexedDB writes and Supabase upserts.
 */
export function buildSyncTimestamps(
  existingRecord?: TimestampedRecord | null,
): {
  created_at: string;
  updated_at: string;
} {
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  // 1. Brand-new record (offline or online): lock both to the exact same timestamp
  if (!existingRecord?.created_at) {
    return {
      created_at: nowIso,
      updated_at: nowIso,
    };
  }

  // 2. Editing an existing record: preserve original created_at
  const createdMs = Date.parse(existingRecord.created_at);
  if (Number.isNaN(createdMs)) {
    return {
      created_at: nowIso,
      updated_at: nowIso,
    };
  }

  // Guard against client clock drift (guarantees updated_at is never earlier than created_at)
  const safeUpdatedMs = nowMs < createdMs ? createdMs + 1 : nowMs;

  return {
    created_at: new Date(createdMs).toISOString(),
    updated_at: new Date(safeUpdatedMs).toISOString(),
  };
}
