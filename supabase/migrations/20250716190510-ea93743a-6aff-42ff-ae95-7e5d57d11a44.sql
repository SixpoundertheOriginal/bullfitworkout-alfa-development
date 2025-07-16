-- Phase 1: Data Foundation & Cleanup - Fixed version
-- Step 1: Clean up existing inconsistent data and establish new taxonomy

-- First, let's clear the existing inconsistent exercise data
DELETE FROM exercises WHERE is_custom = true;

-- Now let's create a comprehensive system exercise library
-- Standard muscle groups taxonomy
INSERT INTO exercises (
  name, 
  description, 
  primary_muscle_groups, 
  secondary_muscle_groups, 
  equipment_type, 
  movement_pattern, 
  difficulty, 
  instructions, 
  is_compound, 
  is_custom,
  tips,
  variations,
  metadata
) VALUES 
-- CHEST exercises
('Push-ups', 'Classic bodyweight chest exercise', 
 ARRAY['chest'], ARRAY['shoulders', 'triceps'], ARRAY['bodyweight'], 
 'push', 'beginner', 
 '{"setup": "Start in plank position", "execution": "Lower chest to floor, push back up", "breathing": "Inhale down, exhale up"}',
 true, false,
 ARRAY['Keep core tight', 'Full range of motion', 'Maintain straight line'],
 ARRAY['Incline push-ups', 'Decline push-ups', 'Diamond push-ups'],
 '{"estimated_load_percent": 65, "energy_cost_factor": 0.8}'
),

('Bench Press', 'Fundamental barbell chest exercise', 
 ARRAY['chest'], ARRAY['shoulders', 'triceps'], ARRAY['barbell', 'bench'], 
 'push', 'intermediate', 
 '{"setup": "Lie on bench, grip barbell shoulder-width", "execution": "Lower to chest, press up", "breathing": "Inhale down, exhale up"}',
 true, false,
 ARRAY['Keep shoulders back', 'Touch chest lightly', 'Full lockout'],
 ARRAY['Incline bench press', 'Decline bench press', 'Close-grip bench press'],
 '{"progression_weight": 2.5, "safety_notes": "Use spotter for heavy weights"}'
),

('Dumbbell Bench Press', 'Chest exercise with dumbbells for better range of motion', 
 ARRAY['chest'], ARRAY['shoulders', 'triceps'], ARRAY['dumbbell', 'bench'], 
 'push', 'intermediate', 
 '{"setup": "Lie on bench with dumbbells", "execution": "Lower dumbbells to chest level, press up", "breathing": "Inhale down, exhale up"}',
 true, false,
 ARRAY['Greater range of motion than barbell', 'Control the weight', 'Squeeze at the top'],
 ARRAY['Incline dumbbell press', 'Decline dumbbell press', 'Single-arm dumbbell press'],
 '{"unilateral_training": true, "stabilization_required": "high"}'
),

('Chest Dips', 'Bodyweight exercise targeting lower chest', 
 ARRAY['chest'], ARRAY['shoulders', 'triceps'], ARRAY['bodyweight'], 
 'push', 'intermediate', 
 '{"setup": "Grip parallel bars, lean forward", "execution": "Lower body, push back up", "breathing": "Inhale down, exhale up"}',
 true, false,
 ARRAY['Lean forward for chest focus', 'Full range of motion', 'Control the descent'],
 ARRAY['Weighted dips', 'Ring dips', 'Bench dips'],
 '{"estimated_load_percent": 100, "progression_difficulty": "add weight"}'
),

-- BACK exercises
('Pull-ups', 'Classic bodyweight back exercise', 
 ARRAY['back'], ARRAY['biceps'], ARRAY['bodyweight'], 
 'pull', 'intermediate', 
 '{"setup": "Hang from bar, hands shoulder-width", "execution": "Pull up until chin over bar", "breathing": "Exhale up, inhale down"}',
 true, false,
 ARRAY['Full hang at bottom', 'Chin over bar', 'Control the descent'],
 ARRAY['Chin-ups', 'Wide-grip pull-ups', 'Weighted pull-ups'],
 '{"estimated_load_percent": 100, "progression_difficulty": "add weight or reps"}'
),

('Deadlift', 'Fundamental hip-hinge movement', 
 ARRAY['back', 'glutes'], ARRAY['hamstrings', 'traps'], ARRAY['barbell'], 
 'hinge', 'intermediate', 
 '{"setup": "Stand with feet hip-width, bar over mid-foot", "execution": "Hip hinge to lift bar", "breathing": "Brace core, exhale at top"}',
 true, false,
 ARRAY['Keep bar close to body', 'Hip hinge movement', 'Neutral spine'],
 ARRAY['Sumo deadlift', 'Romanian deadlift', 'Trap bar deadlift'],
 '{"compound_movement": true, "safety_critical": true}'
),

('Bent-Over Row', 'Horizontal pulling movement for back', 
 ARRAY['back'], ARRAY['biceps'], ARRAY['barbell'], 
 'pull', 'intermediate', 
 '{"setup": "Bend over with neutral spine", "execution": "Pull bar to lower chest", "breathing": "Exhale pull, inhale lower"}',
 true, false,
 ARRAY['Keep core tight', 'Pull to lower chest', 'Control the weight'],
 ARRAY['Dumbbell rows', 'T-bar rows', 'Cable rows'],
 '{"stabilization_required": "high", "core_engagement": "high"}'
),

('Lat Pulldown', 'Vertical pulling movement using cable machine', 
 ARRAY['back'], ARRAY['biceps'], ARRAY['cable', 'machine'], 
 'pull', 'beginner', 
 '{"setup": "Sit at lat pulldown machine", "execution": "Pull bar to upper chest", "breathing": "Exhale pull, inhale release"}',
 true, false,
 ARRAY['Lean back slightly', 'Pull to upper chest', 'Squeeze shoulder blades'],
 ARRAY['Wide-grip pulldown', 'Close-grip pulldown', 'Reverse-grip pulldown'],
 '{"beginner_friendly": true, "scalable_resistance": true}'
),

-- SHOULDERS exercises
('Overhead Press', 'Vertical pressing movement for shoulders', 
 ARRAY['shoulders'], ARRAY['triceps'], ARRAY['barbell'], 
 'push', 'intermediate', 
 '{"setup": "Stand with feet hip-width, bar at shoulder height", "execution": "Press bar overhead", "breathing": "Exhale press, inhale lower"}',
 true, false,
 ARRAY['Keep core tight', 'Press in straight line', 'Full lockout'],
 ARRAY['Seated press', 'Dumbbell press', 'Push press'],
 '{"core_stability": "critical", "shoulder_mobility": "required"}'
),

('Lateral Raises', 'Isolation exercise for side delts', 
 ARRAY['shoulders'], ARRAY[]::text[], ARRAY['dumbbell'], 
 'push', 'beginner', 
 '{"setup": "Hold dumbbells at sides", "execution": "Raise arms to shoulder height", "breathing": "Exhale raise, inhale lower"}',
 false, false,
 ARRAY['Control the weight', 'Slight bend in elbows', 'Pause at top'],
 ARRAY['Cable lateral raises', 'Machine lateral raises', 'Plate raises'],
 '{"isolation_movement": true, "shoulder_health": "important"}'
),

('Face Pulls', 'Rear delt and upper back exercise', 
 ARRAY['shoulders'], ARRAY['back'], ARRAY['cable'], 
 'pull', 'beginner', 
 '{"setup": "Set cable at face height", "execution": "Pull rope to face, elbows high", "breathing": "Exhale pull, inhale return"}',
 false, false,
 ARRAY['High elbows', 'Squeeze shoulder blades', 'Control the return'],
 ARRAY['Band face pulls', 'Reverse fly', 'Rear delt fly'],
 '{"posture_improvement": true, "shoulder_health": "excellent"}'
),

-- ARMS exercises
('Bicep Curls', 'Isolation exercise for biceps', 
 ARRAY['biceps'], ARRAY[]::text[], ARRAY['dumbbell'], 
 'pull', 'beginner', 
 '{"setup": "Hold dumbbells at sides", "execution": "Curl weights to shoulders", "breathing": "Exhale curl, inhale lower"}',
 false, false,
 ARRAY['Control the weight', 'Full range of motion', 'Squeeze at top'],
 ARRAY['Hammer curls', 'Concentration curls', 'Cable curls'],
 '{"isolation_movement": true, "tempo_important": true}'
),

('Tricep Dips', 'Bodyweight exercise for triceps', 
 ARRAY['triceps'], ARRAY['shoulders'], ARRAY['bodyweight'], 
 'push', 'beginner', 
 '{"setup": "Hands on bench behind you", "execution": "Lower body, push back up", "breathing": "Inhale down, exhale up"}',
 false, false,
 ARRAY['Keep elbows close', 'Lower until 90 degrees', 'Control the movement'],
 ARRAY['Weighted dips', 'Ring dips', 'Parallel bar dips'],
 '{"estimated_load_percent": 70, "progression_friendly": true}'
),

('Close-Grip Push-ups', 'Push-up variation targeting triceps', 
 ARRAY['triceps'], ARRAY['chest'], ARRAY['bodyweight'], 
 'push', 'intermediate', 
 '{"setup": "Push-up position, hands close together", "execution": "Lower chest, push up", "breathing": "Inhale down, exhale up"}',
 true, false,
 ARRAY['Keep elbows close to body', 'Full range of motion', 'Control the descent'],
 ARRAY['Diamond push-ups', 'Archer push-ups', 'One-arm push-ups'],
 '{"estimated_load_percent": 65, "tricep_focus": "high"}'
),

-- LEGS exercises
('Squats', 'Fundamental lower body movement', 
 ARRAY['quads'], ARRAY['glutes', 'core'], ARRAY['bodyweight'], 
 'squat', 'beginner', 
 '{"setup": "Feet shoulder-width apart", "execution": "Lower hips back and down", "breathing": "Inhale down, exhale up"}',
 true, false,
 ARRAY['Keep knees tracking over toes', 'Full depth', 'Drive through heels'],
 ARRAY['Goblet squats', 'Back squats', 'Front squats'],
 '{"fundamental_movement": true, "scalable": true}'
),

('Lunges', 'Unilateral leg exercise', 
 ARRAY['quads'], ARRAY['glutes', 'hamstrings'], ARRAY['bodyweight'], 
 'lunge', 'beginner', 
 '{"setup": "Step forward into lunge position", "execution": "Lower back knee, push back up", "breathing": "Inhale down, exhale up"}',
 true, false,
 ARRAY['Keep front knee over ankle', 'Lower back knee toward ground', 'Push through front heel'],
 ARRAY['Reverse lunges', 'Walking lunges', 'Lateral lunges'],
 '{"unilateral_training": true, "balance_required": "moderate"}'
),

('Romanian Deadlift', 'Hip-hinge movement targeting hamstrings', 
 ARRAY['hamstrings'], ARRAY['glutes', 'back'], ARRAY['barbell'], 
 'hinge', 'intermediate', 
 '{"setup": "Hold bar with overhand grip", "execution": "Hip hinge, lower bar along legs", "breathing": "Inhale down, exhale up"}',
 true, false,
 ARRAY['Keep bar close to legs', 'Slight knee bend', 'Feel stretch in hamstrings'],
 ARRAY['Dumbbell RDL', 'Single-leg RDL', 'Stiff-leg deadlift'],
 '{"hip_hinge_pattern": true, "hamstring_focus": "high"}'
),

-- CORE exercises
('Plank', 'Isometric core exercise', 
 ARRAY['core'], ARRAY[]::text[], ARRAY['bodyweight'], 
 'isometric', 'beginner', 
 '{"setup": "Forearm plank position", "execution": "Hold position with straight body", "breathing": "Breathe normally while holding"}',
 true, false,
 ARRAY['Keep body straight', 'Engage core', 'Breathe normally'],
 ARRAY['Side plank', 'Plank up-downs', 'Plank with leg lifts'],
 '{"isometric_hold": true, "core_stability": "fundamental"}'
),

('Dead Bug', 'Core stability exercise', 
 ARRAY['core'], ARRAY[]::text[], ARRAY['bodyweight'], 
 'rotation', 'beginner', 
 '{"setup": "Lie on back, arms up, knees bent", "execution": "Lower opposite arm and leg", "breathing": "Exhale on extension, inhale return"}',
 false, false,
 ARRAY['Keep lower back pressed to floor', 'Slow controlled movement', 'Opposite arm and leg'],
 ARRAY['Bird dog', 'Modified dead bug', 'Dead bug with bands'],
 '{"core_stability": "excellent", "beginner_friendly": true}'
),

('Mountain Climbers', 'Dynamic core and cardio exercise', 
 ARRAY['core'], ARRAY['shoulders'], ARRAY['bodyweight'], 
 'rotation', 'intermediate', 
 '{"setup": "Start in plank position", "execution": "Alternate bringing knees to chest", "breathing": "Breathe rhythmically"}',
 true, false,
 ARRAY['Keep hips stable', 'Quick leg movement', 'Maintain plank position'],
 ARRAY['Slow mountain climbers', 'Cross-body mountain climbers', 'Plank jacks'],
 '{"cardio_component": true, "full_body": true}'
),

-- CARDIO exercises
('Burpees', 'Full-body cardio exercise', 
 ARRAY['full body'], ARRAY[]::text[], ARRAY['bodyweight'], 
 'squat', 'intermediate', 
 '{"setup": "Stand with feet shoulder-width", "execution": "Drop to pushup, jump back up", "breathing": "Coordinate with movement"}',
 true, false,
 ARRAY['Full range of motion', 'Explosive jump', 'Maintain form when tired'],
 ARRAY['Half burpees', 'Burpee box jumps', 'Burpee pull-ups'],
 '{"cardio_intensive": true, "full_body": true, "calorie_burn": "high"}'
),

('Jumping Jacks', 'Simple cardio exercise', 
 ARRAY['cardio'], ARRAY[]::text[], ARRAY['bodyweight'], 
 'squat', 'beginner', 
 '{"setup": "Stand with feet together", "execution": "Jump feet apart while raising arms", "breathing": "Breathe rhythmically"}',
 false, false,
 ARRAY['Land softly', 'Maintain rhythm', 'Keep core engaged'],
 ARRAY['Star jumps', 'Seal jacks', 'Cross jacks'],
 '{"warm_up": "excellent", "cardio_endurance": true}'
),

('High Knees', 'Running in place with high knee lift', 
 ARRAY['cardio'], ARRAY['core'], ARRAY['bodyweight'], 
 'squat', 'beginner', 
 '{"setup": "Stand with feet hip-width", "execution": "Run in place lifting knees high", "breathing": "Breathe rhythmically"}',
 false, false,
 ARRAY['Lift knees to waist level', 'Stay on balls of feet', 'Pump arms'],
 ARRAY['Butt kickers', 'Running in place', 'High knee marches'],
 '{"cardio_endurance": true, "coordination": "moderate"}'
);

-- Add some validation constraints
ALTER TABLE exercises ADD CONSTRAINT exercises_name_not_empty CHECK (length(name) > 0);
ALTER TABLE exercises ADD CONSTRAINT exercises_primary_muscles_not_empty CHECK (array_length(primary_muscle_groups, 1) > 0);
ALTER TABLE exercises ADD CONSTRAINT exercises_equipment_not_empty CHECK (array_length(equipment_type, 1) > 0);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_groups ON exercises USING GIN(primary_muscle_groups);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment ON exercises USING GIN(equipment_type);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON exercises(difficulty);
CREATE INDEX IF NOT EXISTS idx_exercises_movement_pattern ON exercises(movement_pattern);
CREATE INDEX IF NOT EXISTS idx_exercises_compound ON exercises(is_compound);
CREATE INDEX IF NOT EXISTS idx_exercises_custom ON exercises(is_custom);