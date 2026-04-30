-- Missing common exercises that every coach programs
-- Run after the main seed

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes) VALUES
('Leg Extension', 'machine', true, 'machine', 'beginner', 'push', 'isolation',
  ARRAY['Sit on the machine with your back against the pad', 'Hook your feet under the roller pad, ankles against it', 'Extend your legs until they are straight, squeeze quads at top', 'Lower slowly with control back to starting position', 'Do not swing or use momentum'],
  ARRAY['quadriceps'], ARRAY[]::TEXT[],
  ARRAY['Squeeze quads hard at the top and hold 1 second', 'Control the descent — 2-3 seconds down', 'Point toes slightly up to engage quads more', 'Great as a finisher after squats or leg press', 'Adjust the back pad so your knee joint lines up with the pivot'],
  ARRAY['Swinging the weight up with momentum', 'Not going to full extension', 'Letting the weight drop on the way down'])
ON CONFLICT DO NOTHING;

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes) VALUES
('Leg Curl', 'machine', true, 'machine', 'beginner', 'pull', 'isolation',
  ARRAY['Lie face down on the leg curl machine', 'Hook your ankles under the pad', 'Curl the weight up by bending your knees', 'Squeeze hamstrings at the top', 'Lower slowly back to start'],
  ARRAY['hamstrings'], ARRAY['calves'],
  ARRAY['Squeeze hamstrings hard at the top', 'Dont let your hips rise off the pad', 'Control the negative — slow on the way down', 'Keep toes pointed toward shins for more hamstring activation', 'Great paired with Romanian Deadlifts'],
  ARRAY['Hips lifting off the pad', 'Using momentum to swing weight up', 'Not going through full range of motion'])
ON CONFLICT DO NOTHING;

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes) VALUES
('Lat Pulldown', 'cable', true, 'cable', 'beginner', 'pull', 'compound',
  ARRAY['Sit at the lat pulldown machine with thighs secured under the pads', 'Grab the bar with a wide overhand grip', 'Pull the bar down to your upper chest while leaning back slightly', 'Squeeze your lats at the bottom', 'Control the bar back up to full stretch'],
  ARRAY['lats'], ARRAY['biceps', 'middle back'],
  ARRAY['Pull with your elbows, not your hands', 'Lean back about 15-20 degrees', 'Squeeze shoulder blades together at bottom', 'Let the bar stretch your lats at the top', 'Think about pulling your elbows to your back pockets'],
  ARRAY['Pulling behind the neck', 'Leaning too far back', 'Using momentum to swing the weight down', 'Grip too narrow for lat focus'])
ON CONFLICT DO NOTHING;

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes) VALUES
('Tricep Pushdown', 'cable', true, 'cable', 'beginner', 'push', 'isolation',
  ARRAY['Stand facing a high pulley cable with a straight or V-bar attachment', 'Grab the bar with an overhand grip, elbows at your sides', 'Push the bar down until your arms are fully extended', 'Squeeze triceps at the bottom', 'Slowly return to starting position, elbows stay pinned'],
  ARRAY['triceps'], ARRAY[]::TEXT[],
  ARRAY['Keep elbows pinned to your sides the entire time', 'Squeeze triceps hard at full extension', 'Dont lean over the bar — stand upright', 'Use the rope attachment for more range of motion', 'Control the weight up — dont let it fly back'],
  ARRAY['Elbows flaring out or moving forward', 'Leaning into the pushdown', 'Using too much weight with bad form', 'Cutting range of motion short'])
ON CONFLICT DO NOTHING;

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes) VALUES
('Romanian Deadlift', 'barbell', true, 'barbell', 'intermediate', 'pull', 'compound',
  ARRAY['Stand with feet hip width apart holding a barbell at hip height', 'Push your hips back while keeping legs nearly straight', 'Lower the bar along your legs until you feel a deep hamstring stretch', 'Drive hips forward to return to standing', 'Keep the bar close to your body throughout'],
  ARRAY['hamstrings'], ARRAY['glutes', 'lower back'],
  ARRAY['This is a HIP HINGE not a squat — push hips back', 'Keep a slight bend in knees, they dont move much', 'Bar stays touching or nearly touching your legs', 'Feel the stretch in your hamstrings at the bottom', 'Squeeze glutes hard at the top to lock out'],
  ARRAY['Rounding the lower back', 'Bending knees too much (turns into a deadlift)', 'Bar drifting away from legs', 'Not feeling it in hamstrings (usually too much knee bend)'])
ON CONFLICT DO NOTHING;

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes) VALUES
('Overhead Press', 'barbell', true, 'barbell', 'intermediate', 'push', 'compound',
  ARRAY['Stand with feet shoulder width apart, bar at shoulder height', 'Grip bar just outside shoulder width', 'Press the bar straight overhead until arms are locked out', 'Lower the bar back to shoulders with control', 'Keep core braced and glutes squeezed throughout'],
  ARRAY['shoulders'], ARRAY['triceps', 'traps'],
  ARRAY['Brace core like youre about to get punched', 'Press the bar in a straight line — move your head out of the way', 'Lock out arms fully at the top', 'Dont lean back excessively — use strict form', 'This is the king of shoulder exercises'],
  ARRAY['Excessive back lean', 'Not locking out overhead', 'Pressing the bar forward instead of straight up', 'Flaring ribs — keep core tight'])
ON CONFLICT DO NOTHING;

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes) VALUES
('Lateral Raise', 'dumbbell', true, 'dumbbell', 'beginner', 'push', 'isolation',
  ARRAY['Stand with dumbbells at your sides, slight bend in elbows', 'Raise arms out to the sides until shoulder height', 'Hold briefly at the top', 'Lower slowly back to starting position'],
  ARRAY['shoulders'], ARRAY[]::TEXT[],
  ARRAY['Lead with your elbows, not your hands', 'Slight forward lean helps target the side delt', 'Thumbs slightly tilted down like pouring water from a pitcher', 'Use lighter weight with perfect form — ego kills this exercise', 'Control the descent, dont just drop the weight'],
  ARRAY['Using too much weight and swinging', 'Going above shoulder height', 'Shrugging shoulders up toward ears', 'Swinging body for momentum'])
ON CONFLICT DO NOTHING;

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes) VALUES
('Preacher Curl', 'dumbbell', true, 'dumbbell', 'beginner', 'pull', 'isolation',
  ARRAY['Sit at a preacher curl bench with your upper arms on the pad', 'Hold dumbbells or a barbell with an underhand grip', 'Curl the weight up, squeezing biceps at the top', 'Lower slowly until arms are nearly fully extended', 'Do not swing or use momentum'],
  ARRAY['biceps'], ARRAY[]::TEXT[],
  ARRAY['Keep upper arms flat on the pad throughout', 'Squeeze biceps at the top, dont just lift the weight', 'Lower slowly — the eccentric is where growth happens', 'Dont fully lock out at bottom to keep tension on biceps', 'Great for eliminating cheating on curls'],
  ARRAY['Lifting elbows off the pad', 'Swinging the weight', 'Going too heavy and losing form', 'Locking out at the bottom (stresses elbows)'])
ON CONFLICT DO NOTHING;

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes) VALUES
('Skull Crusher', 'barbell', true, 'barbell', 'intermediate', 'push', 'isolation',
  ARRAY['Lie on a flat bench holding a barbell or EZ bar above your chest', 'Keep upper arms vertical and stationary', 'Bend elbows to lower the bar toward your forehead', 'Extend arms back to the starting position', 'Keep elbows pointed at the ceiling throughout'],
  ARRAY['triceps'], ARRAY[]::TEXT[],
  ARRAY['Keep elbows narrow — dont let them flare', 'Lower to forehead or just behind your head for more stretch', 'Upper arms stay vertical, only forearms move', 'Use an EZ curl bar for wrist comfort', 'Great superset with close-grip bench press'],
  ARRAY['Elbows flaring out wide', 'Moving upper arms (turns into a press)', 'Going too heavy and losing control near your face', 'Not getting full range of motion'])
ON CONFLICT DO NOTHING;

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes) VALUES
('Face Pull', 'cable', true, 'cable', 'beginner', 'pull', 'compound',
  ARRAY['Set a cable pulley to upper chest or face height with a rope attachment', 'Grab the rope with both hands, palms facing each other', 'Pull the rope toward your face, separating the ends', 'Squeeze rear delts and upper back at the end position', 'Return with control to the starting position'],
  ARRAY['shoulders'], ARRAY['middle back', 'traps'],
  ARRAY['Pull to your face, not your chest — elbows high', 'Spread the rope apart at the end like a double bicep pose', 'Squeeze rear delts and hold 1 second', 'One of the most important exercises for shoulder health and posture', 'Do these every upper body day — seriously'],
  ARRAY['Pulling too low (becomes a row)', 'Using too much weight and leaning back', 'Not spreading the rope at the end', 'Rushing through reps without squeezing'])
ON CONFLICT DO NOTHING;

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes) VALUES
('Push-Up', 'body only', true, 'body only', 'beginner', 'push', 'compound',
  ARRAY['Start in a plank position with hands shoulder width apart', 'Lower your body until your chest nearly touches the floor', 'Keep your body in a straight line from head to heels', 'Push back up to the starting position', 'Breathe in on the way down, out on the way up'],
  ARRAY['chest'], ARRAY['shoulders', 'triceps'],
  ARRAY['Keep core tight — dont let hips sag', 'Elbows at 45 degrees, not flared to 90', 'Full range of motion — chest to floor', 'If too hard, do them from knees or elevated surface', 'If too easy, add a weight plate on your back'],
  ARRAY['Sagging hips', 'Flaring elbows too wide', 'Half reps — not going deep enough', 'Looking up instead of keeping neck neutral'])
ON CONFLICT DO NOTHING;

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes) VALUES
('Incline Dumbbell Press', 'dumbbell', true, 'dumbbell', 'intermediate', 'push', 'compound',
  ARRAY['Set bench to 30-45 degree incline', 'Hold dumbbells at chest height with palms facing forward', 'Press dumbbells up and slightly together', 'Lower slowly until upper arms are parallel to floor', 'Keep shoulder blades pinched throughout'],
  ARRAY['chest'], ARRAY['shoulders', 'triceps'],
  ARRAY['30 degrees targets upper chest best — dont go too steep', 'Press up and slightly inward, dumbbells nearly touch at top', 'Keep shoulder blades retracted and depressed', 'Great alternative to barbell incline for more range of motion', 'Control the negative — 2 seconds down minimum'],
  ARRAY['Bench angle too steep (becomes shoulder press)', 'Bouncing dumbbells off chest', 'Losing shoulder blade tightness', 'Going too heavy and losing control'])
ON CONFLICT DO NOTHING;

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes) VALUES
('Cable Fly', 'cable', true, 'cable', 'beginner', 'push', 'isolation',
  ARRAY['Set both cable pulleys to shoulder height', 'Stand in the middle with a split stance, grab both handles', 'With a slight bend in elbows, bring hands together in front of chest', 'Squeeze chest hard when hands meet', 'Open arms back slowly with control, feel the chest stretch'],
  ARRAY['chest'], ARRAY['shoulders'],
  ARRAY['Slight bend in elbows throughout — locked position', 'Squeeze chest like youre hugging a barrel', 'Great for the mind-muscle connection with chest', 'Constant tension throughout the movement', 'Try different pulley heights: high = lower chest, low = upper chest'],
  ARRAY['Straightening arms (turns into a press)', 'Going too heavy and losing the squeeze', 'Excessive body lean or momentum'])
ON CONFLICT DO NOTHING;

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes) VALUES
('Dumbbell Shoulder Press', 'dumbbell', true, 'dumbbell', 'intermediate', 'push', 'compound',
  ARRAY['Sit on a bench with back support, dumbbells at shoulder height', 'Press dumbbells overhead until arms are extended', 'Lower slowly back to shoulder height', 'Keep core braced throughout the movement'],
  ARRAY['shoulders'], ARRAY['triceps', 'traps'],
  ARRAY['Press up and slightly inward — dumbbells nearly touch at top', 'Dont lock elbows aggressively at top', 'Keep back against the pad, dont arch excessively', 'Standing version works core more', 'Great for fixing left-right imbalances'],
  ARRAY['Excessive back arch', 'Pressing too far in front instead of overhead', 'Flaring elbows too wide at the bottom'])
ON CONFLICT DO NOTHING;

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes) VALUES
('Rear Delt Fly', 'dumbbell', true, 'dumbbell', 'beginner', 'pull', 'isolation',
  ARRAY['Bend forward at the hips, flat back, dumbbells hanging below', 'Raise dumbbells out to the sides with slightly bent elbows', 'Squeeze rear delts at the top', 'Lower slowly back to starting position'],
  ARRAY['shoulders'], ARRAY['middle back'],
  ARRAY['Lead with your elbows, not your hands', 'Think about pulling your shoulder blades apart on the way down, together on the way up', 'Use light weight — rear delts are small muscles', 'Can also be done on an incline bench face down for better isolation', 'Essential for balanced shoulder development and posture'],
  ARRAY['Using too much weight and swinging', 'Turning it into a row by bending elbows too much', 'Not squeezing at the top'])
ON CONFLICT DO NOTHING;

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes) VALUES
('Seated Leg Curl', 'machine', true, 'machine', 'beginner', 'pull', 'isolation',
  ARRAY['Sit on the machine and adjust the pad to rest on your lower calves', 'Hold the handles for stability', 'Curl your legs under you by bending your knees', 'Squeeze hamstrings at the bottom', 'Return slowly to starting position'],
  ARRAY['hamstrings'], ARRAY['calves'],
  ARRAY['Squeeze hamstrings hard at the fully contracted position', 'Keep your back against the pad', 'Slow and controlled reps — no swinging', 'Try single-leg to find and fix imbalances', 'Pair with RDLs for complete hamstring training'],
  ARRAY['Using momentum instead of muscle', 'Not going through full range of motion', 'Leaning forward off the pad'])
ON CONFLICT DO NOTHING;
