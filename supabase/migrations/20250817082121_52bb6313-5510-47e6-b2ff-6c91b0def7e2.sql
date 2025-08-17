-- Create conversation threading system
CREATE TABLE ai_conversation_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  message_count integer DEFAULT 0,
  context_tags text[],
  is_archived boolean DEFAULT false
);

-- Add RLS for conversation threads
ALTER TABLE ai_conversation_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own threads" ON ai_conversation_threads
  FOR ALL USING (auth.uid() = user_id);

-- Create enhanced messages table
CREATE TABLE ai_conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid REFERENCES ai_conversation_threads(id) ON DELETE CASCADE,
  role text CHECK (role IN ('user', 'assistant')),
  content text,
  images jsonb DEFAULT '[]'::jsonb,
  training_data_snapshot jsonb,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Add RLS for messages
ALTER TABLE ai_conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access messages in their threads" ON ai_conversation_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ai_conversation_threads 
      WHERE ai_conversation_threads.id = ai_conversation_messages.thread_id 
      AND ai_conversation_threads.user_id = auth.uid()
    )
  );

-- Create storage bucket for AI coaching images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ai-coach-images', 'AI Coach Images', false);

-- Create storage policies for images
CREATE POLICY "Users can upload their own coaching images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'ai-coach-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own coaching images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'ai-coach-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own coaching images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'ai-coach-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own coaching images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'ai-coach-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create indexes for performance
CREATE INDEX idx_ai_threads_user_id ON ai_conversation_threads(user_id);
CREATE INDEX idx_ai_threads_updated_at ON ai_conversation_threads(updated_at DESC);
CREATE INDEX idx_ai_messages_thread_id ON ai_conversation_messages(thread_id);
CREATE INDEX idx_ai_messages_created_at ON ai_conversation_messages(created_at DESC);

-- Create function to update thread message count and timestamp
CREATE OR REPLACE FUNCTION update_thread_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE ai_conversation_threads 
    SET 
      message_count = message_count + 1,
      updated_at = now()
    WHERE id = NEW.thread_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ai_conversation_threads 
    SET 
      message_count = GREATEST(message_count - 1, 0),
      updated_at = now()
    WHERE id = OLD.thread_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger for automatic thread stats updates
CREATE TRIGGER update_thread_stats_trigger
  AFTER INSERT OR DELETE ON ai_conversation_messages
  FOR EACH ROW EXECUTE FUNCTION update_thread_stats();