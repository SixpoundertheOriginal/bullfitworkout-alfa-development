import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetchTrainingData } from "../_shared/training-data.ts";
import { formatLocalDate } from "../_shared/time.ts";
// Environment and API setup
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Core functionality diagnostic
console.log('🏋️ AI Training Coach - Function Start:', {
  hasOpenAIKey: !!openAIApiKey,
  keyFormat: openAIApiKey ? (openAIApiKey.startsWith('sk-') ? 'valid' : 'invalid') : 'missing',
  hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
  hasSupabaseKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
});

if (!openAIApiKey) {
  console.error('❌ OpenAI API key not configured in Supabase Edge Function secrets');
  throw new Error('OpenAI API key missing - add OPENAI_API_KEY to Supabase secrets');
}

if (!openAIApiKey.startsWith('sk-')) {
  console.error('❌ Invalid OpenAI API key format');
  throw new Error('OpenAI API key format invalid');
}

const OPENAI_CONFIG = {
  model: {
    text: 'gpt-4o',
    vision: 'gpt-4o',
    fallback: 'gpt-4-turbo'
  },
  limits: {
    maxTokens: 1000,
    temperature: 0.7,
    timeout: 30000
  },
  retries: {
    maxRetries: 2,
    backoffMs: 1000
  }
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, threadId, images = [], conversationHistory = [] } = await req.json();

    console.log('Training coach request:', { userId, messageLength: message.length, images: images.length, threadId });

    // Get or create conversation thread
    let currentThreadId = threadId;
    if (!currentThreadId) {
      const { data: newThread, error: threadError } = await supabase
        .from('ai_conversation_threads')
        .insert({
          user_id: userId,
          title: message.length > 50 ? message.substring(0, 50) + '...' : message,
          context_tags: detectContextTags(message)
        })
        .select()
        .single();
      
      if (threadError) {
        console.error('Failed to create thread:', threadError);
      } else {
        currentThreadId = newThread.id;
      }
    }

    // Get user's training data
    const trainingData = await fetchTrainingData(userId);
    console.log('Training data fetched:', { 
      totalWorkouts: trainingData.totalWorkouts,
      totalVolume: trainingData.totalVolume 
    });

    // Process images if provided
    let imageAnalysis = '';
    if (images.length > 0) {
      console.log('Processing', images.length, 'images');
      imageAnalysis = await analyzeImages(images, trainingData);
    }

    // Build enhanced system prompt with vision capabilities
    const systemPrompt = `You are an AI Training Coach with access to the user's complete workout history and image analysis capabilities. Your role is to:

1. Analyze their training data and provide personalized insights
2. Answer questions about their progress, patterns, and performance
3. Suggest improvements based on their actual training history
4. Analyze workout photos, form checks, and progress photos when provided
5. Help them understand their strengths and areas for improvement

USER'S TRAINING DATA:
${formatTrainingDataForAI(trainingData)}

${imageAnalysis ? `IMAGE ANALYSIS:\n${imageAnalysis}\n` : ''}

GUIDELINES:
- Be encouraging but honest about their progress
- Use specific data from their workouts when making recommendations
- Suggest realistic goals based on their current performance
- If analyzing images, provide specific technical feedback on form, equipment, or progress
- Focus on actionable advice that builds on their existing routine
- If you notice concerning patterns (overtraining, imbalances), point them out constructively
- For form checks: be specific about angles, positioning, and safety
- For progress photos: note changes and suggest areas for focus

Keep responses conversational but data-driven. Always reference their actual training data when relevant.`;

    // Prepare messages for OpenAI (with vision support if images present)
    const userMessage = images.length > 0 ? {
      role: 'user',
      content: [
        { type: 'text', text: message },
        ...images.map(img => ({
          type: 'image_url',
          image_url: { url: img.url }
        }))
      ]
    } : { role: 'user', content: message };

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      userMessage
    ];

    console.log('Sending to OpenAI with', messages.length, 'messages');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: images.length > 0 ? OPENAI_CONFIG.model.vision : OPENAI_CONFIG.model.text,
        messages,
        max_tokens: OPENAI_CONFIG.limits.maxTokens,
        temperature: OPENAI_CONFIG.limits.temperature
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = { message: errorText };
      }

      console.error('OpenAI API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        error: errorDetails,
        requestModel: images.length > 0 ? OPENAI_CONFIG.model.vision : OPENAI_CONFIG.model.text,
        hasApiKey: !!openAIApiKey,
        apiKeyPrefix: openAIApiKey?.substring(0, 7) + '...'
      });

      throw new Error(`OpenAI API error: ${response.status} - ${errorDetails.error?.message || errorText}`);
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || 'No response generated';

    console.log('OpenAI response generated successfully');

    // Store conversation in enhanced threading system
    try {
      if (currentThreadId) {
        // Store user message
        await supabase.from('ai_conversation_messages').insert({
          thread_id: currentThreadId,
          role: 'user',
          content: message,
          images: images,
          training_data_snapshot: trainingData
        });

        // Store assistant response
        await supabase.from('ai_conversation_messages').insert({
          thread_id: currentThreadId,
          role: 'assistant',
          content: reply,
          training_data_snapshot: trainingData
        });

        // Update thread message count and timestamp
        const { data: messageCount } = await supabase
          .from('ai_conversation_messages')
          .select('id', { count: 'exact' })
          .eq('thread_id', currentThreadId);

        await supabase
          .from('ai_conversation_threads')
          .update({ 
            message_count: messageCount?.length || 0,
            updated_at: new Date().toISOString() 
          })
          .eq('id', currentThreadId);

        console.log('Conversation stored successfully');
      }
    } catch (dbError) {
      console.warn('Failed to store conversation:', dbError);
    }

    return new Response(JSON.stringify({ 
      reply,
      threadId: currentThreadId,
      trainingInsights: generateQuickInsights(trainingData)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in training coach function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process request',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function formatTrainingDataForAI(data: any): string {
  const earliest = data.earliestSessionUTC
    ? formatLocalDate(data.earliestSessionUTC)
    : 'N/A';
  return `
RECENT PERFORMANCE SUMMARY:
- Earliest Workout: ${earliest}
- Total Workouts: ${data.totalWorkouts}
- Total Volume: ${data.totalVolume.toFixed(1)}kg
- Total Sets: ${data.totalSets}

TOP EXERCISES BY PERFORMANCE:
${data.topExercises.slice(0, 6).map((ex: any) => 
  `- ${ex.name}: ${ex.volume.toFixed(1)}kg total volume, ${ex.total_sets} sets across ${ex.workouts_performed} workouts (max: ${ex.max_weight}kg)${ex.average_rest_time ? ` | Avg rest: ${ex.average_rest_time}s` : ''}`
).join('\n')}

REST TIME ANALYTICS BY EXERCISE:
${Object.entries(data.restAnalytics || {}).slice(0, 8).map(([exercise, analytics]: [string, any]) => 
  `- ${exercise}: ${analytics.average_rest}s avg (${analytics.min_rest}s-${analytics.max_rest}s range), consistency: ${analytics.rest_consistency < 100 ? 'excellent' : analytics.rest_consistency < 400 ? 'good' : 'needs improvement'}`
).join('\n')}

RECENT PERSONAL RECORDS:
${data.personalRecords.slice(0, 5).map((pr: any) =>
  `- ${pr.exercise_name}: ${pr.value}${pr.unit} (${formatLocalDate(pr.date)})`
).join('\n')}

DETAILED RECENT WORKOUT SESSIONS:
${data.recentWorkouts.slice(0, 5).map((w: any) => {
  const workoutDate = formatLocalDate(w.start_time);
  const exerciseDetails = w.exercises.map((ex: any) => {
    const completedSets = ex.sets.filter((set: any) => set.completed);
    const setDetails = completedSets.map((set: any) => 
      `${set.weight}kg×${set.reps}${set.rest_time ? ` (${set.rest_time}s rest)` : ''}`
    ).join(', ');
    
    // Calculate average rest time for this exercise in this workout
    const restTimes = completedSets.map((set: any) => set.rest_time).filter(Boolean);
    const avgRest = restTimes.length > 0 ? Math.round(restTimes.reduce((sum: number, time: number) => sum + time, 0) / restTimes.length) : null;
    
    return `  • ${ex.exercise_name}: ${completedSets.length} sets [${setDetails}]${avgRest ? ` | Avg rest: ${avgRest}s` : ''}`;
  }).join('\n');
  
  return `📅 ${workoutDate} - ${w.name} (${w.training_type}, ${Math.round(w.duration)}min):
${exerciseDetails}
💪 Total Volume: ${w.total_volume.toFixed(1)}kg | ${w.exercises_performed} exercises | ${w.total_sets} sets\n`;
}).join('\n')}
  `;
}

function generateQuickInsights(data: any) {
  const insights = [];
  
  if (data.totalWorkouts < 4) {
    insights.push("Building consistency - aim for 3-4 workouts per week");
  } else if (data.totalWorkouts > 20) {
    insights.push("Great consistency! Your training frequency is excellent");
  }
  
  if (data.totalVolume > 10000) {
    insights.push("High volume training - make sure you're recovering well");
  }
  
  return insights;
}

function detectContextTags(message: string): string[] {
  const tags = [];
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('form') || lowerMessage.includes('technique') || lowerMessage.includes('posture')) {
    tags.push('form-check');
  }
  if (lowerMessage.includes('progress') || lowerMessage.includes('before') || lowerMessage.includes('after')) {
    tags.push('progress');
  }
  if (lowerMessage.includes('nutrition') || lowerMessage.includes('diet') || lowerMessage.includes('meal')) {
    tags.push('nutrition');
  }
  if (lowerMessage.includes('equipment') || lowerMessage.includes('gear') || lowerMessage.includes('gym')) {
    tags.push('equipment');
  }
  if (lowerMessage.includes('pain') || lowerMessage.includes('injury') || lowerMessage.includes('hurt')) {
    tags.push('recovery');
  }
  
  return tags;
}

async function analyzeImages(images: any[], trainingData: any): Promise<string> {
  try {
    const imageDescriptions = images.map((img, index) => {
      const type = img.type || 'general';
      return `Image ${index + 1} (${type}): ${img.metadata?.description || 'Workout-related image'}`;
    });

    return `IMAGES PROVIDED:
${imageDescriptions.join('\n')}

Based on the user's training history, provide specific feedback about:
1. Form and technique if exercise photos
2. Progress comparison if before/after photos  
3. Equipment setup and safety
4. Environmental factors that might affect training`;
  } catch (error) {
    console.error('Error analyzing images:', error);
    return 'Images provided but analysis temporarily unavailable.';
  }
}