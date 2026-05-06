-- Beta-tester feedback: people search for "adductor machine" / "abductor machine"
-- (the gym-floor names), not the free-exercise-db originals.
-- Rename the curated rows so they show up in search.

UPDATE exercises SET name = 'Adductor Machine'
WHERE name = 'Thigh Adductor' AND is_public = true AND created_by IS NULL;

UPDATE exercises SET name = 'Abductor Machine'
WHERE name = 'Thigh Abductor' AND is_public = true AND created_by IS NULL;
