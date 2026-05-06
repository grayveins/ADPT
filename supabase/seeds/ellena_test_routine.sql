-- ============================================================================
-- ONE-OFF SEED: Upper/Lower + Arms routine for Ellena (ellena.y@hotmail.com).
-- NOT a real migration — paste into Supabase Studio → SQL Editor and run once.
--
-- To re-run cleanly:
--   DELETE FROM coaching_programs WHERE name = 'Upper/Lower + Arms'
--     AND client_id = (SELECT id FROM auth.users WHERE email = 'ellena.y@hotmail.com');
-- ============================================================================

DO $$
DECLARE
  COACH_EMAIL TEXT := 'trohoy123@gmail.com';
  CLIENT_EMAIL TEXT := 'ellena.y@hotmail.com';
  v_coach_id UUID;
  v_client_id UUID;
  v_program_id UUID;
  v_phase_id UUID;
BEGIN
  SELECT id INTO v_coach_id FROM auth.users WHERE email = COACH_EMAIL;
  IF v_coach_id IS NULL THEN
    RAISE EXCEPTION 'Coach not found: %', COACH_EMAIL;
  END IF;

  SELECT id INTO v_client_id FROM auth.users WHERE email = CLIENT_EMAIL;
  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'Client not found: %', CLIENT_EMAIL;
  END IF;

  INSERT INTO coach_clients (coach_id, client_id, status, started_at)
  VALUES (v_coach_id, v_client_id, 'active', NOW())
  ON CONFLICT (coach_id, client_id) DO UPDATE
    SET status = 'active',
        started_at = COALESCE(coach_clients.started_at, EXCLUDED.started_at);

  INSERT INTO coaching_programs (
    coach_id, client_id, name, description, status, start_date
  ) VALUES (
    v_coach_id, v_client_id,
    'Upper/Lower + Arms',
    '5-day hypertrophy split: chest+lats / quad / back-thickness / glutes+hams / shoulders+arms. RIR 2 default.',
    'active', CURRENT_DATE
  )
  RETURNING id INTO v_program_id;

  INSERT INTO program_phases (
    program_id, name, description, phase_number, duration_weeks, goal, status, start_date
  ) VALUES (
    v_program_id, 'Block 1',
    'Accumulation block — moderate volume, moderate intensity, RIR 2.',
    1, 4, 'hypertrophy', 'active', CURRENT_DATE
  )
  RETURNING id INTO v_phase_id;

  -- Day 1 (Mon) — Upper · Chest + Lats Bias
  INSERT INTO phase_workouts (phase_id, day_number, name, exercises) VALUES (
    v_phase_id, 1, 'Upper — Chest + Lats Bias',
    jsonb_build_array(
      jsonb_build_object('exercise_name','Machine Chest Press','sets',2,'reps','5-8','rir',2,'rest_seconds',120,'notes','sternal pec / horizontal adduction','order',0,'superset_group',NULL),
      jsonb_build_object('exercise_name','Lat Pulldown','sets',2,'reps','6-8','rir',2,'rest_seconds',120,'notes','lower lats / shoulder extension','order',1,'superset_group',NULL),
      jsonb_build_object('exercise_name','Incline DB Press','sets',2,'reps','8-12','rir',2,'rest_seconds',90,'notes','clavicular pec / shoulder flexion','order',2,'superset_group',NULL),
      jsonb_build_object('exercise_name','Neutral Chest-Supported Row','sets',2,'reps','6-10','rir',2,'rest_seconds',90,'notes','mid-back / shoulder extension','order',3,'superset_group',NULL),
      jsonb_build_object('exercise_name','Kelso Shrug','sets',2,'reps','10-15','rir',2,'rest_seconds',60,'notes','upper traps / scapular elevation','order',4,'superset_group',NULL),
      jsonb_build_object('exercise_name','Cable Lateral Raise','sets',2,'reps','10-15','rir',2,'rest_seconds',60,'notes','lateral delts / shoulder abduction','order',5,'superset_group',NULL),
      jsonb_build_object('exercise_name','Hammer Preacher Curl','sets',2,'reps','10-12','rir',2,'rest_seconds',60,'notes','biceps long head / brachioradialis / shoulder extension','order',6,'superset_group',NULL),
      jsonb_build_object('exercise_name','Standing Rope Tricep Extension','sets',2,'reps','10-12','rir',2,'rest_seconds',60,'notes','triceps long head / shoulder flexion','order',7,'superset_group',NULL)
    )
  );

  -- Day 2 (Tue) — Lower · Quad Bias
  INSERT INTO phase_workouts (phase_id, day_number, name, exercises) VALUES (
    v_phase_id, 2, 'Lower — Quad Bias',
    jsonb_build_array(
      jsonb_build_object('exercise_name','Hack Squat','sets',2,'reps','4-8','rir',2,'rest_seconds',150,'notes','quads / knee extension','order',0,'superset_group',NULL),
      jsonb_build_object('exercise_name','Leg Extension','sets',2,'reps','10-15','rir',2,'rest_seconds',75,'notes','rectus femoris / knee extension','order',1,'superset_group',NULL),
      jsonb_build_object('exercise_name','Seated Leg Curl','sets',2,'reps','8-12','rir',2,'rest_seconds',90,'notes','hamstrings / knee flexion','order',2,'superset_group',NULL),
      jsonb_build_object('exercise_name','Adductor Machine','sets',2,'reps','10-15','rir',2,'rest_seconds',60,'notes','adductors / hip adduction','order',3,'superset_group',NULL),
      jsonb_build_object('exercise_name','Calf Raise','sets',2,'reps','10-15','rir',2,'rest_seconds',60,'notes','gastrocnemius / plantarflexion','order',4,'superset_group',NULL)
    )
  );

  -- Day 4 (Thu) — Upper · Back Thickness Bias
  INSERT INTO phase_workouts (phase_id, day_number, name, exercises) VALUES (
    v_phase_id, 4, 'Upper — Back Thickness Bias',
    jsonb_build_array(
      jsonb_build_object('exercise_name','Wide-Grip Pulldown','sets',2,'reps','6-10','rir',2,'rest_seconds',120,'notes','lats / shoulder extension','order',0,'superset_group',NULL),
      jsonb_build_object('exercise_name','Pronated Machine Row','sets',2,'reps','8-12','rir',2,'rest_seconds',90,'notes','upper back / horizontal abduction','order',1,'superset_group',NULL),
      jsonb_build_object('exercise_name','Incline DB Press','sets',1,'reps','8-12','rir',2,'rest_seconds',90,'notes','clavicular pec / shoulder flexion','order',2,'superset_group',NULL),
      jsonb_build_object('exercise_name','Machine Pec Fly','sets',2,'reps','10-15','rir',2,'rest_seconds',75,'notes','pecs lengthened / horizontal adduction','order',3,'superset_group',NULL),
      jsonb_build_object('exercise_name','Rear Delt Fly','sets',1,'reps','12-15','rir',2,'rest_seconds',60,'notes','rear delts / horizontal abduction','order',4,'superset_group',NULL),
      jsonb_build_object('exercise_name','Preacher Curl','sets',1,'reps','6-10','rir',2,'rest_seconds',75,'notes','biceps short head / elbow flexion','order',5,'superset_group',NULL),
      jsonb_build_object('exercise_name','Tricep Pushdown','sets',1,'reps','10-12','rir',2,'rest_seconds',60,'notes','triceps lateral head / elbow extension','order',6,'superset_group',NULL)
    )
  );

  -- Day 5 (Fri) — Lower · Glutes + Hamstrings
  INSERT INTO phase_workouts (phase_id, day_number, name, exercises) VALUES (
    v_phase_id, 5, 'Lower — Glutes + Hamstrings',
    jsonb_build_array(
      jsonb_build_object('exercise_name','Smith SLDL','sets',2,'reps','6-10','rir',2,'rest_seconds',120,'notes','glutes / hip extension','order',0,'superset_group',NULL),
      jsonb_build_object('exercise_name','Single-Leg Knee Extension','sets',2,'reps','8-12','rir',2,'rest_seconds',75,'notes','all quad muscles','order',1,'superset_group',NULL),
      jsonb_build_object('exercise_name','Hip Thrust','sets',2,'reps','4-8','rir',2,'rest_seconds',150,'notes','glutes shortened / hip extension','order',2,'superset_group',NULL),
      jsonb_build_object('exercise_name','Seated Leg Curl','sets',2,'reps','8-12','rir',2,'rest_seconds',90,'notes','hamstrings / knee flexion','order',3,'superset_group',NULL),
      jsonb_build_object('exercise_name','Hip Abduction','sets',2,'reps','10-15','rir',2,'rest_seconds',60,'notes','glute med/min / hip abduction','order',4,'superset_group',NULL),
      jsonb_build_object('exercise_name','Calf Raise','sets',2,'reps','10-15','rir',2,'rest_seconds',60,'notes','gastrocnemius / plantarflexion','order',5,'superset_group',NULL)
    )
  );

  -- Day 6 (Sat) — Shoulders + Arms · Low Fatigue
  INSERT INTO phase_workouts (phase_id, day_number, name, exercises) VALUES (
    v_phase_id, 6, 'Shoulders + Arms — Low Fatigue',
    jsonb_build_array(
      jsonb_build_object('exercise_name','Full ROM Machine Shoulder Press','sets',2,'reps','8-12','rir',2,'rest_seconds',90,'notes','anterior + medial delts / shoulder flexion','order',0,'superset_group',NULL),
      jsonb_build_object('exercise_name','Rear Delt Fly','sets',2,'reps','10-15','rir',2,'rest_seconds',60,'notes','rear delts / horizontal abduction','order',1,'superset_group',NULL),
      jsonb_build_object('exercise_name','Cable Lateral Raise','sets',2,'reps','10-15','rir',2,'rest_seconds',60,'notes','lateral delts / shoulder abduction','order',2,'superset_group',NULL),
      jsonb_build_object('exercise_name','Incline DB Curl','sets',2,'reps','10-12','rir',2,'rest_seconds',60,'notes','biceps long head / shoulder extension','order',3,'superset_group',NULL),
      jsonb_build_object('exercise_name','Top-Partial Cuffed Cable Curl','sets',1,'reps','6-10','rir',2,'rest_seconds',60,'notes','biceps / elbow flexion','order',4,'superset_group',NULL),
      jsonb_build_object('exercise_name','Overhead Tricep Extension','sets',2,'reps','10-15','rir',2,'rest_seconds',60,'notes','triceps long head / shoulder flexion','order',5,'superset_group',NULL),
      jsonb_build_object('exercise_name','Tricep Pushdown','sets',2,'reps','12-15','rir',2,'rest_seconds',60,'notes','triceps lateral head / elbow extension','order',6,'superset_group',NULL)
    )
  );

  RAISE NOTICE 'Seeded program % (phase %) for client %', v_program_id, v_phase_id, CLIENT_EMAIL;
END $$;
