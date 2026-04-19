-- Seed exercise library (~60 common exercises)
-- Run once in Supabase SQL editor

INSERT INTO exercises (name, category, is_public) VALUES
-- Chest
('Bench Press', 'barbell', true),
('Incline Bench Press', 'barbell', true),
('Dumbbell Bench Press', 'dumbbell', true),
('Incline Dumbbell Press', 'dumbbell', true),
('Cable Fly', 'cable', true),
('Chest Dip', 'bodyweight', true),
('Push-Up', 'bodyweight', true),
('Machine Chest Press', 'machine', true),

-- Back
('Deadlift', 'barbell', true),
('Barbell Row', 'barbell', true),
('Dumbbell Row', 'dumbbell', true),
('Pull-Up', 'bodyweight', true),
('Chin-Up', 'bodyweight', true),
('Lat Pulldown', 'cable', true),
('Seated Cable Row', 'cable', true),
('T-Bar Row', 'barbell', true),
('Face Pull', 'cable', true),

-- Shoulders
('Overhead Press', 'barbell', true),
('Dumbbell Shoulder Press', 'dumbbell', true),
('Lateral Raise', 'dumbbell', true),
('Rear Delt Fly', 'dumbbell', true),
('Cable Lateral Raise', 'cable', true),
('Arnold Press', 'dumbbell', true),
('Upright Row', 'barbell', true),

-- Arms
('Barbell Curl', 'barbell', true),
('Dumbbell Curl', 'dumbbell', true),
('Hammer Curl', 'dumbbell', true),
('Preacher Curl', 'barbell', true),
('Tricep Pushdown', 'cable', true),
('Overhead Tricep Extension', 'dumbbell', true),
('Skull Crusher', 'barbell', true),
('Close Grip Bench Press', 'barbell', true),

-- Legs
('Squat', 'barbell', true),
('Front Squat', 'barbell', true),
('Leg Press', 'machine', true),
('Romanian Deadlift', 'barbell', true),
('Bulgarian Split Squat', 'dumbbell', true),
('Leg Extension', 'machine', true),
('Leg Curl', 'machine', true),
('Hip Thrust', 'barbell', true),
('Walking Lunge', 'dumbbell', true),
('Calf Raise', 'machine', true),
('Goblet Squat', 'dumbbell', true),

-- Core
('Plank', 'bodyweight', true),
('Cable Crunch', 'cable', true),
('Hanging Leg Raise', 'bodyweight', true),
('Ab Wheel Rollout', 'bodyweight', true),
('Russian Twist', 'bodyweight', true),

-- Cardio
('Treadmill Run', 'cardio', true),
('Rowing Machine', 'cardio', true),
('Cycling', 'cardio', true),
('Stair Climber', 'cardio', true),
('Jump Rope', 'cardio', true),

-- Full Body
('Clean and Press', 'barbell', true),
('Kettlebell Swing', 'dumbbell', true),
('Burpee', 'bodyweight', true),
('Thruster', 'barbell', true)
ON CONFLICT DO NOTHING;
