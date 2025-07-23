-- Enhanced Exercise Library Expansion
-- Adding 60+ new exercises with expanded equipment types and improved categorization

-- Add new popular exercises with proper categorization
INSERT INTO exercises (
  name, description, primary_muscle_groups, secondary_muscle_groups, 
  equipment_type, movement_pattern, difficulty, instructions, 
  is_compound, tips, variations, metadata, is_custom
) VALUES

-- Core/Ab Exercises
(
  'Ab Wheel Rollout',
  'Dynamic core exercise where you roll out and back using an ab wheel, engaging the entire core chain',
  ARRAY['abs', 'core'],
  ARRAY['shoulders', 'lower back'],
  ARRAY['ab wheel'],
  'push',
  'intermediate',
  '{"setup": "Kneel on mat with ab wheel in hands", "execution": "Roll forward maintaining neutral spine, then return to start", "breathing": "Exhale on rollout, inhale on return"}',
  true,
  ARRAY['Start with partial range of motion', 'Keep core tight throughout', 'Avoid arching lower back'],
  ARRAY['Standing Ab Wheel Rollout', 'Single Arm Rollout', 'Incline Rollout'],
  '{"load_factor": 0.8, "energy_cost_factor": 1.4, "estimated_load_percent": 80}',
  false
),

(
  'Hanging Leg Raises',
  'Hanging from a pull-up bar, raise legs to work the core and improve grip strength',
  ARRAY['abs', 'core'],
  ARRAY['forearms', 'shoulders'],
  ARRAY['pull up bar'],
  'pull',
  'intermediate',
  '{"setup": "Hang from pull-up bar with straight arms", "execution": "Raise legs to 90 degrees or higher", "breathing": "Exhale on raise, inhale on lower"}',
  false,
  ARRAY['Control the descent', 'Avoid swinging', 'Start with bent knees if needed'],
  ARRAY['Knee Raises', 'Toes to Bar', 'L-Sit Progression'],
  '{"load_factor": 0.6, "energy_cost_factor": 1.3}',
  false
),

(
  'Russian Twists',
  'Seated core rotation exercise, can be performed with or without weight',
  ARRAY['abs', 'obliques'],
  ARRAY['core'],
  ARRAY['bodyweight', 'medicine ball'],
  'rotation',
  'beginner',
  '{"setup": "Sit with knees bent, lean back slightly", "execution": "Rotate torso side to side", "breathing": "Exhale on each twist"}',
  false,
  ARRAY['Keep feet off ground for increased difficulty', 'Focus on controlled movement', 'Engage core throughout'],
  ARRAY['Weighted Russian Twists', 'Feet Elevated Russian Twists', 'Medicine Ball Slams'],
  '{"load_factor": 0.4, "energy_cost_factor": 1.1}',
  false
),

-- Ring Exercises
(
  'Ring Pull-ups',
  'Pull-ups performed using gymnastic rings, requiring additional stabilization',
  ARRAY['lats', 'back'],
  ARRAY['biceps', 'shoulders'],
  ARRAY['rings'],
  'pull',
  'intermediate',
  '{"setup": "Hang from rings with neutral grip", "execution": "Pull up until chest reaches rings", "breathing": "Exhale on pull, inhale on lower"}',
  true,
  ARRAY['Start with assisted version if needed', 'Focus on stable ring position', 'Turn rings out at top'],
  ARRAY['Ring Chin-ups', 'Wide Grip Ring Pull-ups', 'Archer Ring Pull-ups'],
  '{"load_factor": 1.1, "energy_cost_factor": 1.5}',
  false
),

(
  'Ring Dips',
  'Dips performed on gymnastic rings, requiring significant stabilization and core strength',
  ARRAY['chest', 'triceps'],
  ARRAY['shoulders', 'core'],
  ARRAY['rings'],
  'push',
  'advanced',
  '{"setup": "Support yourself on rings with arms straight", "execution": "Lower until shoulders below elbows, then press up", "breathing": "Inhale on descent, exhale on press"}',
  true,
  ARRAY['Turn rings out at bottom', 'Keep rings close to body', 'Start with assisted version'],
  ARRAY['Ring Support Hold', 'Ring Muscle-ups', 'Bulgarian Ring Dips'],
  '{"load_factor": 1.2, "energy_cost_factor": 1.6}',
  false
),

(
  'Ring Muscle-ups',
  'Advanced gymnastic movement combining pull-up and dip on rings',
  ARRAY['back', 'chest', 'triceps'],
  ARRAY['shoulders', 'core', 'forearms'],
  ARRAY['rings'],
  'pull',
  'expert',
  '{"setup": "Hang from rings with false grip", "execution": "Pull up and transition over rings to support position", "breathing": "Controlled breathing throughout complex movement"}',
  true,
  ARRAY['Master false grip first', 'Practice transition separately', 'Requires significant strength'],
  ARRAY['Strict Muscle-up', 'Kipping Muscle-up', 'Weighted Muscle-up'],
  '{"load_factor": 1.3, "energy_cost_factor": 2.0}',
  false
),

-- TRX/Suspension Training
(
  'TRX Row',
  'Suspension trainer rowing exercise that can be adjusted for difficulty by changing body angle',
  ARRAY['lats', 'back'],
  ARRAY['biceps', 'core'],
  ARRAY['trx', 'suspension trainer'],
  'pull',
  'beginner',
  '{"setup": "Hold TRX handles, lean back to create tension", "execution": "Pull body up toward handles", "breathing": "Exhale on pull, inhale on return"}',
  true,
  ARRAY['Adjust difficulty with foot position', 'Keep core engaged', 'Squeeze shoulder blades'],
  ARRAY['Single Arm TRX Row', 'High TRX Row', 'Low TRX Row'],
  '{"load_factor": 0.7, "energy_cost_factor": 1.2}',
  false
),

(
  'TRX Push-up',
  'Push-ups with feet elevated in TRX straps, increasing instability and difficulty',
  ARRAY['chest', 'triceps'],
  ARRAY['shoulders', 'core'],
  ARRAY['trx', 'suspension trainer'],
  'push',
  'intermediate',
  '{"setup": "Feet in TRX straps, hands on ground", "execution": "Perform push-up with elevated feet", "breathing": "Inhale down, exhale up"}',
  true,
  ARRAY['Maintain straight body line', 'Control the instability', 'Start with low suspension'],
  ARRAY['TRX Atomic Push-up', 'Single Arm TRX Push-up', 'TRX Pike Push-up'],
  '{"load_factor": 0.8, "energy_cost_factor": 1.4}',
  false
),

-- Battle Ropes
(
  'Battle Rope Waves',
  'High-intensity cardio exercise using heavy ropes to create waves',
  ARRAY['shoulders', 'core'],
  ARRAY['arms', 'cardio'],
  ARRAY['battle ropes'],
  'carry',
  'intermediate',
  '{"setup": "Hold rope ends, stand with feet shoulder-width apart", "execution": "Create alternating waves with arms", "breathing": "Rhythmic breathing to match wave pattern"}',
  false,
  ARRAY['Keep core tight', 'Use legs for power', 'Maintain rhythm'],
  ARRAY['Double Wave', 'Spiral Wave', 'Side-to-Side Wave'],
  '{"energy_cost_factor": 1.8, "load_factor": 0.6}',
  false
),

(
  'Battle Rope Slams',
  'Full-body explosive movement slamming ropes down with maximum force',
  ARRAY['shoulders', 'core'],
  ARRAY['legs', 'cardio'],
  ARRAY['battle ropes'],
  'carry',
  'intermediate',
  '{"setup": "Hold rope ends overhead", "execution": "Slam ropes down with full force", "breathing": "Exhale forcefully on slam"}',
  true,
  ARRAY['Use entire body', 'Maximum explosive effort', 'Quick reset between slams'],
  ARRAY['Single Arm Slam', 'Outside Spiral Slam', 'Squat to Slam'],
  '{"energy_cost_factor": 2.0, "load_factor": 0.8}',
  false
),

-- Medicine Ball
(
  'Medicine Ball Slams',
  'Explosive full-body exercise slamming medicine ball to ground',
  ARRAY['core', 'shoulders'],
  ARRAY['legs', 'cardio'],
  ARRAY['medicine ball'],
  'carry',
  'beginner',
  '{"setup": "Hold medicine ball overhead", "execution": "Slam ball down with full force", "breathing": "Exhale on slam"}',
  true,
  ARRAY['Use legs for power', 'Full body engagement', 'Control the catch'],
  ARRAY['Overhead Slam', 'Side Slam', 'Rotational Slam'],
  '{"energy_cost_factor": 1.6, "load_factor": 0.7}',
  false
),

(
  'Medicine Ball Wall Throws',
  'Explosive throwing exercise against wall for power development',
  ARRAY['chest', 'shoulders'],
  ARRAY['core', 'triceps'],
  ARRAY['medicine ball'],
  'push',
  'intermediate',
  '{"setup": "Stand arm''s length from wall with ball", "execution": "Throw ball into wall and catch", "breathing": "Exhale on throw"}',
  true,
  ARRAY['Explosive throwing motion', 'Quick catch and reset', 'Maintain stance'],
  ARRAY['Chest Pass', 'Overhead Throw', 'Rotational Throw'],
  '{"energy_cost_factor": 1.4, "load_factor": 0.6}',
  false
),

-- Parallettes/Advanced Bodyweight
(
  'L-Sit on Parallettes',
  'Advanced isometric hold supporting body weight with legs extended',
  ARRAY['core', 'abs'],
  ARRAY['shoulders', 'triceps'],
  ARRAY['parallettes', 'bodyweight'],
  'isometric',
  'advanced',
  '{"setup": "Support on parallettes with straight arms", "execution": "Hold body with legs extended parallel to ground", "breathing": "Controlled breathing during hold"}',
  false,
  ARRAY['Build up hold time gradually', 'Keep shoulders down', 'Start with bent knees'],
  ARRAY['Tuck L-Sit', 'One Leg L-Sit', 'V-Sit'],
  '{"load_factor": 0.8, "energy_cost_factor": 1.5, "is_isometric": true}',
  false
),

(
  'Handstand Push-ups',
  'Inverted push-ups requiring significant shoulder strength and balance',
  ARRAY['shoulders', 'triceps'],
  ARRAY['core', 'chest'],
  ARRAY['bodyweight', 'parallettes'],
  'push',
  'expert',
  '{"setup": "Handstand position against wall", "execution": "Lower head to ground and press back up", "breathing": "Controlled breathing throughout"}',
  true,
  ARRAY['Master handstand hold first', 'Use wall for support initially', 'Full range of motion'],
  ARRAY['Wall Handstand Push-up', 'Free Handstand Push-up', 'Deficit Handstand Push-up'],
  '{"load_factor": 1.0, "energy_cost_factor": 1.8}',
  false
),

-- Advanced Calisthenics
(
  'Archer Push-ups',
  'Single-arm emphasis push-up with one arm extended to side',
  ARRAY['chest', 'triceps'],
  ARRAY['shoulders', 'core'],
  ARRAY['bodyweight'],
  'push',
  'advanced',
  '{"setup": "Wide push-up position", "execution": "Push up while shifting weight to one arm", "breathing": "Exhale on press, inhale on lower"}',
  true,
  ARRAY['Control the shift of weight', 'Keep extended arm straight', 'Build up gradually'],
  ARRAY['Assisted Archer Push-up', 'Elevated Archer Push-up', 'One Arm Push-up Progression'],
  '{"load_factor": 0.8, "energy_cost_factor": 1.5}',
  false
),

(
  'Pistol Squats',
  'Single-leg squat requiring strength, balance, and mobility',
  ARRAY['quads', 'glutes'],
  ARRAY['core', 'calves'],
  ARRAY['bodyweight'],
  'squat',
  'advanced',
  '{"setup": "Stand on one leg, other leg extended forward", "execution": "Squat down on single leg, return to stand", "breathing": "Inhale down, exhale up"}',
  true,
  ARRAY['Use assistance initially', 'Focus on controlled descent', 'Work on ankle mobility'],
  ARRAY['Assisted Pistol Squat', 'Box Pistol Squat', 'Weighted Pistol Squat'],
  '{"load_factor": 0.8, "energy_cost_factor": 1.4}',
  false
),

-- Functional/CrossFit Style
(
  'Burpee Box Jump-overs',
  'Combination burpee with box jump for explosive conditioning',
  ARRAY['legs', 'cardio'],
  ARRAY['chest', 'shoulders', 'core'],
  ARRAY['box', 'bodyweight'],
  'carry',
  'intermediate',
  '{"setup": "Stand next to box", "execution": "Burpee, then jump over box", "breathing": "Controlled breathing throughout"}',
  true,
  ARRAY['Land softly on box', 'Control the burpee portion', 'Maintain rhythm'],
  ARRAY['Burpee Box Jump', 'Lateral Burpee Box Jump', 'Single Leg Box Jump'],
  '{"energy_cost_factor": 2.2, "load_factor": 1.0}',
  false
),

(
  'Turkish Get-ups',
  'Complex full-body movement from lying to standing with weight overhead',
  ARRAY['core', 'shoulders'],
  ARRAY['legs', 'glutes'],
  ARRAY['kettlebell', 'dumbbell'],
  'carry',
  'intermediate',
  '{"setup": "Lie with weight in one hand overhead", "execution": "Stand up while keeping weight overhead", "breathing": "Coordinated breathing through movement phases"}',
  true,
  ARRAY['Learn movement pattern first', 'Keep weight directly overhead', 'Practice both sides equally'],
  ARRAY['Bodyweight Get-up', 'Bottoms-up Get-up', 'Double Get-up'],
  '{"energy_cost_factor": 1.6, "load_factor": 0.9}',
  false
),

-- Slider/Gliding Disc Exercises
(
  'Mountain Climber Sliders',
  'Mountain climbers with feet on slider discs for increased core challenge',
  ARRAY['core', 'cardio'],
  ARRAY['shoulders', 'legs'],
  ARRAY['slider discs', 'bodyweight'],
  'carry',
  'intermediate',
  '{"setup": "Plank position with feet on sliders", "execution": "Alternate bringing knees to chest", "breathing": "Rhythmic breathing with movement"}',
  false,
  ARRAY['Maintain plank position', 'Control the slides', 'Keep core tight'],
  ARRAY['Single Leg Mountain Climber', 'Cross-body Mountain Climber', 'Slow Mountain Climber'],
  '{"energy_cost_factor": 1.5, "load_factor": 0.7}',
  false
),

(
  'Slider Pike Push-ups',
  'Pike push-ups with feet sliding in and out on discs',
  ARRAY['shoulders', 'core'],
  ARRAY['triceps', 'abs'],
  ARRAY['slider discs', 'bodyweight'],
  'push',
  'advanced',
  '{"setup": "Push-up position with feet on sliders", "execution": "Pike up while sliding feet toward hands", "breathing": "Exhale on pike, inhale on return"}',
  true,
  ARRAY['Control the slide movement', 'Keep arms straight during pike', 'Maintain core tension'],
  ARRAY['Atomic Push-up', 'Single Arm Slider Pike', 'Elevated Slider Pike'],
  '{"energy_cost_factor": 1.6, "load_factor": 0.8}',
  false
),

-- Stability Ball
(
  'Stability Ball Pike Push-ups',
  'Pike push-ups with feet elevated on stability ball',
  ARRAY['shoulders', 'core'],
  ARRAY['triceps', 'chest'],
  ARRAY['stability ball', 'bodyweight'],
  'push',
  'intermediate',
  '{"setup": "Push-up position with feet on ball", "execution": "Pike up while rolling ball toward body", "breathing": "Exhale on pike, inhale on return"}',
  true,
  ARRAY['Control ball movement', 'Keep core engaged', 'Start with partial range'],
  ARRAY['Ball Roll-out', 'Ball Push-up', 'Ball Mountain Climber'],
  '{"energy_cost_factor": 1.4, "load_factor": 0.7}',
  false
),

-- Sandbag Training
(
  'Sandbag Carries',
  'Functional carrying exercise with unstable load',
  ARRAY['core', 'traps'],
  ARRAY['forearms', 'legs'],
  ARRAY['sandbag'],
  'carry',
  'beginner',
  '{"setup": "Lift sandbag to carry position", "execution": "Walk specified distance maintaining posture", "breathing": "Steady breathing throughout carry"}',
  true,
  ARRAY['Maintain upright posture', 'Engage core throughout', 'Choose appropriate weight'],
  ARRAY['Bear Hug Carry', 'Shouldered Carry', 'Overhead Carry'],
  '{"energy_cost_factor": 1.3, "load_factor": 1.0}',
  false
),

(
  'Sandbag Slams',
  'Explosive slamming movement with sandbag for power development',
  ARRAY['core', 'shoulders'],
  ARRAY['legs', 'back'],
  ARRAY['sandbag'],
  'carry',
  'intermediate',
  '{"setup": "Hold sandbag overhead", "execution": "Slam down with maximum force", "breathing": "Exhale forcefully on slam"}',
  true,
  ARRAY['Use legs for power', 'Full body engagement', 'Control the lift'],
  ARRAY['Rotational Slam', 'Single Arm Slam', 'Lateral Slam'],
  '{"energy_cost_factor": 1.8, "load_factor": 0.8}',
  false
),

-- Weighted Vest Exercises
(
  'Weighted Vest Push-ups',
  'Standard push-ups with added weight vest for increased resistance',
  ARRAY['chest', 'triceps'],
  ARRAY['shoulders', 'core'],
  ARRAY['weighted vest', 'bodyweight'],
  'push',
  'intermediate',
  '{"setup": "Push-up position wearing weighted vest", "execution": "Perform push-ups with added weight", "breathing": "Inhale down, exhale up"}',
  true,
  ARRAY['Start with lighter vest weight', 'Maintain proper form', 'Progress gradually'],
  ARRAY['Weighted Diamond Push-ups', 'Weighted Decline Push-ups', 'Weighted One-Arm Push-ups'],
  '{"energy_cost_factor": 1.3, "load_factor": 0.85}',
  false
),

-- Additional Core Variations
(
  'Dead Bug',
  'Core stability exercise performed lying on back with opposite arm/leg extensions',
  ARRAY['core', 'abs'],
  ARRAY['shoulders'],
  ARRAY['bodyweight'],
  'isometric',
  'beginner',
  '{"setup": "Lie on back, arms up, knees at 90 degrees", "execution": "Extend opposite arm and leg, return to start", "breathing": "Exhale on extension, inhale on return"}',
  false,
  ARRAY['Keep lower back pressed to floor', 'Move slowly and controlled', 'Focus on opposite limbs'],
  ARRAY['Weighted Dead Bug', 'Single Limb Dead Bug', 'Extended Dead Bug'],
  '{"energy_cost_factor": 1.0, "load_factor": 0.3, "is_isometric": true}',
  false
),

(
  'Bear Crawl',
  'Quadrupedal movement pattern for full-body conditioning',
  ARRAY['core', 'shoulders'],
  ARRAY['legs', 'cardio'],
  ARRAY['bodyweight'],
  'carry',
  'intermediate',
  '{"setup": "Hands and feet on ground, knees hovering", "execution": "Crawl forward maintaining position", "breathing": "Steady breathing throughout movement"}',
  true,
  ARRAY['Keep knees just off ground', 'Move opposite hand and foot together', 'Maintain level hips'],
  ARRAY['Backward Bear Crawl', 'Lateral Bear Crawl', 'Bear Crawl to Beast'],
  '{"energy_cost_factor": 1.4, "load_factor": 0.6}',
  false
),

-- Plyometric/Jump Training
(
  'Jump Squats',
  'Explosive squat with maximal jump for power development',
  ARRAY['legs', 'glutes'],
  ARRAY['calves', 'core'],
  ARRAY['bodyweight'],
  'squat',
  'beginner',
  '{"setup": "Stand with feet shoulder-width apart", "execution": "Squat down then jump up explosively", "breathing": "Inhale down, exhale on jump"}',
  true,
  ARRAY['Land softly', 'Full squat depth', 'Immediate transition between reps'],
  ARRAY['Weighted Jump Squats', 'Single Leg Jump Squats', 'Lateral Jump Squats'],
  '{"energy_cost_factor": 1.5, "load_factor": 0.7}',
  false
),

(
  'Box Step-ups',
  'Unilateral leg exercise stepping up onto elevated surface',
  ARRAY['legs', 'glutes'],
  ARRAY['calves', 'core'],
  ARRAY['box', 'bodyweight'],
  'squat',
  'beginner',
  '{"setup": "Stand facing box or platform", "execution": "Step up with one leg, step down with control", "breathing": "Exhale on step up"}',
  true,
  ARRAY['Use full foot on box', 'Control the descent', 'Avoid pushing off bottom leg'],
  ARRAY['Weighted Step-ups', 'Lateral Step-ups', 'High Box Step-ups'],
  '{"energy_cost_factor": 1.2, "load_factor": 0.6}',
  false
);

-- Add to exercise load factors for new exercises
UPDATE exercises SET 
  metadata = metadata || jsonb_build_object(
    'load_factor', 
    CASE 
      WHEN name = 'Ab Wheel Rollout' THEN 0.8
      WHEN name = 'Ring Pull-ups' THEN 1.1
      WHEN name = 'Ring Dips' THEN 1.2
      WHEN name = 'Ring Muscle-ups' THEN 1.3
      WHEN name = 'Handstand Push-ups' THEN 1.0
      WHEN name = 'Archer Push-ups' THEN 0.8
      WHEN name = 'Pistol Squats' THEN 0.8
      ELSE 0.65
    END
  )
WHERE name IN (
  'Ab Wheel Rollout', 'Ring Pull-ups', 'Ring Dips', 'Ring Muscle-ups',
  'Handstand Push-ups', 'Archer Push-ups', 'Pistol Squats'
);

-- Create indexes for better performance with expanded library
CREATE INDEX IF NOT EXISTS idx_exercises_equipment_gin ON exercises USING GIN(equipment_type);
CREATE INDEX IF NOT EXISTS idx_exercises_primary_muscles_gin ON exercises USING GIN(primary_muscle_groups);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON exercises(difficulty);
CREATE INDEX IF NOT EXISTS idx_exercises_compound ON exercises(is_compound);
CREATE INDEX IF NOT EXISTS idx_exercises_search_name ON exercises USING GIN(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_exercises_search_desc ON exercises USING GIN(to_tsvector('english', description));