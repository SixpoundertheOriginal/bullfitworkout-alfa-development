-- Add unique constraint to personal_records table to support ON CONFLICT operations
ALTER TABLE personal_records 
ADD CONSTRAINT unique_user_exercise_type 
UNIQUE (user_id, exercise_name, type);

-- Create index for better performance on PR queries
CREATE INDEX IF NOT EXISTS idx_personal_records_user_exercise 
ON personal_records (user_id, exercise_name);