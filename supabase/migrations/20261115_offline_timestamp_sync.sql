-- MoonDay Database Migration: Enforce Synchronized Offline Timestamps
-- Covers: personal_notes, daily_logs, husband_notes, intimacy_entries

-- 1. Fix any existing rows where updated_at is earlier than created_at
UPDATE public.personal_notes
SET created_at = updated_at
WHERE updated_at < created_at;

UPDATE public.daily_logs
SET created_at = updated_at
WHERE updated_at < created_at;

-- 2. Permanent Database Trigger to guarantee monotonic timestamp ordering
CREATE OR REPLACE FUNCTION public.sync_safe_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := COALESCE(NEW.created_at, NEW.updated_at, now());
    NEW.updated_at := GREATEST(COALESCE(NEW.updated_at, now()), NEW.created_at);
  ELSIF TG_OP = 'UPDATE' THEN
    -- Never allow an update to overwrite the original creation timestamp
    NEW.created_at := OLD.created_at;
    -- Ensure updated_at always moves forward and is never earlier than created_at
    NEW.updated_at := GREATEST(COALESCE(NEW.updated_at, now()), OLD.created_at);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Apply trigger to all tables modified via offline synchronization
DROP TRIGGER IF EXISTS trg_sync_timestamps_personal_notes ON public.personal_notes;
CREATE TRIGGER trg_sync_timestamps_personal_notes
BEFORE INSERT OR UPDATE ON public.personal_notes
FOR EACH ROW EXECUTE FUNCTION public.sync_safe_timestamps();

DROP TRIGGER IF EXISTS trg_sync_timestamps_daily_logs ON public.daily_logs;
CREATE TRIGGER trg_sync_timestamps_daily_logs
BEFORE INSERT OR UPDATE ON public.daily_logs
FOR EACH ROW EXECUTE FUNCTION public.sync_safe_timestamps();

DROP TRIGGER IF EXISTS trg_sync_timestamps_husband_notes ON public.husband_notes;
CREATE TRIGGER trg_sync_timestamps_husband_notes
BEFORE INSERT OR UPDATE ON public.husband_notes
FOR EACH ROW EXECUTE FUNCTION public.sync_safe_timestamps();

DROP TRIGGER IF EXISTS trg_sync_timestamps_intimacy_entries ON public.intimacy_entries;
CREATE TRIGGER trg_sync_timestamps_intimacy_entries
BEFORE INSERT OR UPDATE ON public.intimacy_entries
FOR EACH ROW EXECUTE FUNCTION public.sync_safe_timestamps();