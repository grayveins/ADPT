-- Curate exercise library: 750 → ~125 science-based exercises that real coaches program.
-- Strategy:
--   1. DELETE rows not in the keep-list (using their CURRENT names so we hit them).
--   2. UPDATE clunky names to clean ones (preserves cues, instructions, muscles).
--   3. INSERT a few staples that the source library was missing (Bulgarian Split Squat,
--      Seated Leg Press, Assisted Pull-Up Machine).
-- Custom user-created exercises (created_by IS NOT NULL) are untouched.

BEGIN;

-- ============================================================================
-- 1. DELETE non-curated exercises
--    Names listed below are the CURRENT names — pre-rename — for everything we keep.
-- ============================================================================
DELETE FROM exercises
WHERE is_public = true
  AND created_by IS NULL
  AND name NOT IN (
    -- CHEST
    'Barbell Bench Press - Medium Grip',
    'Barbell Incline Bench Press - Medium Grip',
    'Decline Barbell Bench Press',
    'Close-Grip Barbell Bench Press',
    'Dumbbell Bench Press',
    'Incline Dumbbell Press',
    'Decline Dumbbell Bench Press',
    'Dumbbell Flyes',
    'Incline Dumbbell Flyes',
    'Cable Crossover',
    'Cable Chest Press',
    'Pushups',
    'Incline Push-Up',
    'Decline Push-Up',
    'Dips - Chest Version',
    'Dip Machine',
    'Machine Bench Press',
    'Bent-Arm Dumbbell Pullover',
    'Butterfly',
    'Incline Cable Flye',
    -- BACK
    'Pullups',
    'Chin-Up',
    'Weighted Pull Ups',
    'Wide-Grip Lat Pulldown',
    'Close-Grip Front Lat Pulldown',
    'V-Bar Pulldown',
    'Underhand Cable Pulldowns',
    'Straight-Arm Pulldown',
    'Bent Over Barbell Row',
    'One-Arm Dumbbell Row',
    'Seated Cable Rows',
    'T-Bar Row with Handle',
    'Inverted Row',
    'Reverse Grip Bent-Over Rows',
    'Hyperextensions (Back Extensions)',
    'Rack Pulls',
    'Leverage Iso Row',
    'Seated One-arm Cable Pulley Rows',
    'One Arm Lat Pulldown',
    -- DEADLIFTS
    'Barbell Deadlift',
    'Sumo Deadlift',
    'Romanian Deadlift',
    'Stiff-Legged Barbell Deadlift',
    'Trap Bar Deadlift',
    -- SHOULDERS
    'Barbell Shoulder Press',
    'Seated Barbell Military Press',
    'Standing Dumbbell Press',
    'Seated Dumbbell Press',
    'Arnold Dumbbell Press',
    'Push Press',
    'Side Lateral Raise',
    'Cable Seated Lateral Raise',
    'Front Dumbbell Raise',
    'Reverse Flyes',
    'Reverse Machine Flyes',
    'Face Pull',
    'Upright Barbell Row',
    'Machine Shoulder (Military) Press',
    'Barbell Shrug',
    'Dumbbell Shrug',
    -- BICEPS
    'Barbell Curl',
    'EZ-Bar Curl',
    'Dumbbell Bicep Curl',
    'Hammer Curls',
    'Incline Dumbbell Curl',
    'Preacher Curl',
    'Cable Preacher Curl',
    'Concentration Curls',
    'Cable Hammer Curls - Rope Attachment',
    'Standing Biceps Cable Curl',
    'Spider Curl',
    'Machine Bicep Curl',
    'Reverse Barbell Curl',
    -- TRICEPS
    'Triceps Pushdown',
    'Triceps Pushdown - Rope Attachment',
    'EZ-Bar Skullcrusher',
    'Tricep Dumbbell Kickback',
    'Cable Rope Overhead Triceps Extension',
    'Lying Dumbbell Tricep Extension',
    'Bench Dips',
    'Dips - Triceps Version',
    'Machine Triceps Extension',
    'Reverse Grip Triceps Pushdown',
    -- LEGS (squats/lunges/press)
    'Barbell Squat',
    'Front Barbell Squat',
    'Goblet Squat',
    'Bodyweight Squat',
    'Hack Squat',
    'Barbell Hack Squat',
    'Leg Press',
    'Dumbbell Lunges',
    'Barbell Lunge',
    'Barbell Walking Lunge',
    'Dumbbell Step Ups',
    'Box Squat',
    'Smith Machine Squat',
    'Plie Dumbbell Squat',
    -- LEGS (curl/extension/calf)
    'Leg Extensions',
    'Lying Leg Curls',
    'Seated Leg Curl',
    'Standing Leg Curl',
    'Calf Press On The Leg Press Machine',
    'Standing Calf Raises',
    'Seated Calf Raise',
    'Donkey Calf Raises',
    -- GLUTES / HIPS / POSTERIOR
    'Barbell Hip Thrust',
    'Barbell Glute Bridge',
    'Single Leg Glute Bridge',
    'Glute Kickback',
    'Cable Hip Adduction',
    'Thigh Abductor',
    'Thigh Adductor',
    'Pull Through',
    'Glute Ham Raise',
    'Reverse Hyperextension',
    -- CORE
    'Plank',
    'Side Bridge',
    'Crunches',
    'Sit-Up',
    'Decline Crunch',
    'Reverse Crunch',
    'Cable Crunch',
    'Russian Twist',
    'Hanging Leg Raise',
    'Knee/Hip Raise On Parallel Bars',
    'Pallof Press',
    'Ab Roller',
    'Ab Crunch Machine',
    'Mountain Climbers',
    'Dead Bug',
    -- KETTLEBELL / FUNCTIONAL
    'One-Arm Kettlebell Swings',
    'Kettlebell Turkish Get-Up (Squat style)',
    'Farmer',
    -- CARDIO
    'Running, Treadmill',
    'Walking, Treadmill',
    'Bicycling, Stationary',
    'Recumbent Bike',
    'Rowing, Stationary',
    'Stairmaster',
    'Elliptical Trainer',
    'Rope Jumping'
  );

-- ============================================================================
-- 2. RENAME clunky names to clean ones (cues, muscles, etc. preserved on the row)
-- ============================================================================
UPDATE exercises SET name = 'Barbell Bench Press' WHERE name = 'Barbell Bench Press - Medium Grip' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Barbell Incline Bench Press' WHERE name = 'Barbell Incline Bench Press - Medium Grip' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Push-Up' WHERE name = 'Pushups' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Dumbbell Pullover' WHERE name = 'Bent-Arm Dumbbell Pullover' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Chest Dip' WHERE name = 'Dips - Chest Version' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Machine Dip' WHERE name = 'Dip Machine' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Pec Deck' WHERE name = 'Butterfly' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Incline Cable Fly' WHERE name = 'Incline Cable Flye' AND is_public = true AND created_by IS NULL;

UPDATE exercises SET name = 'Pull-Up' WHERE name = 'Pullups' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Weighted Pull-Up' WHERE name = 'Weighted Pull Ups' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Lat Pulldown' WHERE name = 'Wide-Grip Lat Pulldown' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Close-Grip Lat Pulldown' WHERE name = 'Close-Grip Front Lat Pulldown' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Underhand Lat Pulldown' WHERE name = 'Underhand Cable Pulldowns' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Barbell Bent Over Row' WHERE name = 'Bent Over Barbell Row' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Dumbbell Row' WHERE name = 'One-Arm Dumbbell Row' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Seated Cable Row' WHERE name = 'Seated Cable Rows' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'T-Bar Row' WHERE name = 'T-Bar Row with Handle' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Reverse Grip Barbell Row' WHERE name = 'Reverse Grip Bent-Over Rows' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Back Extension' WHERE name = 'Hyperextensions (Back Extensions)' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Rack Pull' WHERE name = 'Rack Pulls' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Machine Row' WHERE name = 'Leverage Iso Row' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Single-Arm Cable Row' WHERE name = 'Seated One-arm Cable Pulley Rows' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Single-Arm Lat Pulldown' WHERE name = 'One Arm Lat Pulldown' AND is_public = true AND created_by IS NULL;

UPDATE exercises SET name = 'Stiff-Leg Deadlift' WHERE name = 'Stiff-Legged Barbell Deadlift' AND is_public = true AND created_by IS NULL;

UPDATE exercises SET name = 'Seated Barbell Press' WHERE name = 'Seated Barbell Military Press' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Arnold Press' WHERE name = 'Arnold Dumbbell Press' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Dumbbell Lateral Raise' WHERE name = 'Side Lateral Raise' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Cable Lateral Raise' WHERE name = 'Cable Seated Lateral Raise' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Dumbbell Front Raise' WHERE name = 'Front Dumbbell Raise' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Rear Delt Fly' WHERE name = 'Reverse Flyes' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Machine Rear Delt Fly' WHERE name = 'Reverse Machine Flyes' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Barbell Upright Row' WHERE name = 'Upright Barbell Row' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Machine Shoulder Press' WHERE name = 'Machine Shoulder (Military) Press' AND is_public = true AND created_by IS NULL;

UPDATE exercises SET name = 'Hammer Curl' WHERE name = 'Hammer Curls' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Concentration Curl' WHERE name = 'Concentration Curls' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Cable Hammer Curl' WHERE name = 'Cable Hammer Curls - Rope Attachment' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Cable Curl' WHERE name = 'Standing Biceps Cable Curl' AND is_public = true AND created_by IS NULL;

UPDATE exercises SET name = 'Cable Rope Pushdown' WHERE name = 'Triceps Pushdown - Rope Attachment' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Skullcrusher' WHERE name = 'EZ-Bar Skullcrusher' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Dumbbell Tricep Kickback' WHERE name = 'Tricep Dumbbell Kickback' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Overhead Cable Tricep Extension' WHERE name = 'Cable Rope Overhead Triceps Extension' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Dumbbell Skullcrusher' WHERE name = 'Lying Dumbbell Tricep Extension' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Bench Dip' WHERE name = 'Bench Dips' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Tricep Dip' WHERE name = 'Dips - Triceps Version' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Machine Tricep Extension' WHERE name = 'Machine Triceps Extension' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Reverse Grip Pushdown' WHERE name = 'Reverse Grip Triceps Pushdown' AND is_public = true AND created_by IS NULL;

UPDATE exercises SET name = 'Barbell Back Squat' WHERE name = 'Barbell Squat' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Barbell Front Squat' WHERE name = 'Front Barbell Squat' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Dumbbell Lunge' WHERE name = 'Dumbbell Lunges' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Dumbbell Step-Up' WHERE name = 'Dumbbell Step Ups' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Leg Extension' WHERE name = 'Leg Extensions' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Lying Leg Curl' WHERE name = 'Lying Leg Curls' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Calf Press' WHERE name = 'Calf Press On The Leg Press Machine' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Standing Calf Raise' WHERE name = 'Standing Calf Raises' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Donkey Calf Raise' WHERE name = 'Donkey Calf Raises' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Sumo Squat' WHERE name = 'Plie Dumbbell Squat' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Cable Pull Through' WHERE name = 'Pull Through' AND is_public = true AND created_by IS NULL;

UPDATE exercises SET name = 'Crunch' WHERE name = 'Crunches' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Side Plank' WHERE name = 'Side Bridge' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Captain''s Chair Leg Raise' WHERE name = 'Knee/Hip Raise On Parallel Bars' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Mountain Climber' WHERE name = 'Mountain Climbers' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Ab Wheel Rollout' WHERE name = 'Ab Roller' AND is_public = true AND created_by IS NULL;

UPDATE exercises SET name = 'Kettlebell Swing' WHERE name = 'One-Arm Kettlebell Swings' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Turkish Get-Up' WHERE name = 'Kettlebell Turkish Get-Up (Squat style)' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Farmer Carry' WHERE name = 'Farmer' AND is_public = true AND created_by IS NULL;

UPDATE exercises SET name = 'Treadmill Run' WHERE name = 'Running, Treadmill' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Treadmill Walk' WHERE name = 'Walking, Treadmill' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Stationary Bike' WHERE name = 'Bicycling, Stationary' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Rowing Machine' WHERE name = 'Rowing, Stationary' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Jump Rope' WHERE name = 'Rope Jumping' AND is_public = true AND created_by IS NULL;

-- ============================================================================
-- 3. INSERT staples missing from the source library
-- ============================================================================
INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Bulgarian Split Squat', 'dumbbell', true, 'dumbbell', 'intermediate', 'push', 'compound',
  ARRAY[
    'Stand 2-3 feet in front of a bench, holding dumbbells at your sides.',
    'Place the top of your back foot on the bench behind you.',
    'Lower your back knee toward the floor by bending your front leg.',
    'Drive through your front heel to return to the start position.',
    'Complete reps on one side before switching legs.'
  ],
  ARRAY['quadriceps'],
  ARRAY['glutes','hamstrings'],
  ARRAY[
    'Front knee tracks over the toes, not past them',
    'Most weight on front heel — back leg is for balance only',
    'Keep torso upright; lean slightly forward to bias glutes',
    'Lower under control, then drive up explosively',
    'Pause briefly at the bottom for full ROM'
  ],
  ARRAY[
    'Standing too close to the bench (knee jams forward)',
    'Pushing off the back foot — defeats the unilateral purpose',
    'Letting the front knee cave inward'
  ]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Bulgarian Split Squat');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Seated Leg Press', 'machine', true, 'machine', 'beginner', 'push', 'compound',
  ARRAY[
    'Sit in the seated leg press machine with your back firmly against the pad.',
    'Place feet shoulder-width apart on the platform, knees bent.',
    'Release the safety and press the platform away by extending your knees and hips.',
    'Stop just short of locking the knees out.',
    'Lower under control until knees reach about 90 degrees, then press back up.'
  ],
  ARRAY['quadriceps'],
  ARRAY['glutes','hamstrings'],
  ARRAY[
    'Back stays flat against the pad the entire set',
    'Don''t let knees cave in — track them over the toes',
    'Stop short of lockout to keep tension on the quads',
    'Higher foot placement = more glute/hamstring; lower = more quad',
    'Control the eccentric — 2-3 seconds down'
  ],
  ARRAY[
    'Lifting hips off the seat (rounds the lower back)',
    'Locking knees out at the top',
    'Going so deep that lower back rounds off the pad'
  ]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Seated Leg Press');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Assisted Pull-Up Machine', 'machine', true, 'machine', 'beginner', 'pull', 'compound',
  ARRAY[
    'Set the assistance weight on the machine — more weight = more help.',
    'Step or kneel onto the assist platform, gripping the handles overhead.',
    'Pull yourself up until your chin clears the bar.',
    'Lower under control to a full hang.',
    'As you get stronger, reduce the assistance weight over time.'
  ],
  ARRAY['lats'],
  ARRAY['biceps','middle back'],
  ARRAY[
    'Treat it like a real pull-up — drive elbows down to your ribs',
    'Full hang at the bottom — don''t cheat the eccentric',
    'Reduce assistance ~5lb every 1-2 weeks as you progress',
    'Squeeze shoulder blades together at the top',
    'Wide grip = more lats, narrow/neutral = more biceps'
  ],
  ARRAY[
    'Bouncing off the platform at the bottom',
    'Stopping reps before chin clears the bar',
    'Using too much assistance — set it so the last rep is genuinely hard'
  ]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Assisted Pull-Up Machine');

COMMIT;
