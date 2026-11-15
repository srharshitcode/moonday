
export interface TimestampedRecord {
  created_at?: string | null;
  updated_at?: string | null;
}

export function buildSyncTimestamps(
  existingRecord?: TimestampedRecord | null,
): {
  created_at: string;
  updated_at: string;
} {
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  if (!existingRecord?.created_at) {
    return {
      created_at: nowIso,
      updated_at: nowIso,
    };
  }

  const createdMs = Date.parse(existingRecord.created_at);
  if (Number.isNaN(createdMs)) {
    return {
      created_at: nowIso,
      updated_at: nowIso,
    };
  }

 
  const safeUpdatedMs = nowMs < createdMs ? createdMs + 1 : nowMs;

  return {
    created_at: new Date(createdMs).toISOString(),
    updated_at: new Date(safeUpdatedMs).toISOString(),
  };
}
