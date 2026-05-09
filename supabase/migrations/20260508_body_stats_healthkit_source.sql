-- ============================================================================
-- body_stats: allow source='healthkit'
--
-- Why: Apple HealthKit auto-sync needs its own distinct source so it can
-- coexist with manual log-progress entries (separate rows by virtue of the
-- existing UNIQUE (client_id, date, source) constraint). Using a dedicated
-- 'healthkit' value (instead of generic 'wearable') leaves room for future
-- Fitbit / Garmin / Health Connect sources without further migrations.
-- ============================================================================

ALTER TABLE public.body_stats
  DROP CONSTRAINT valid_stat_source;

ALTER TABLE public.body_stats
  ADD CONSTRAINT valid_stat_source
  CHECK (source IN ('manual', 'check_in', 'wearable', 'healthkit'));
