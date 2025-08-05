import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
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
    const { message, userId, conversationHistory = [] } = await req.json();

    console.log('Training coach request:', { userId, messageLength: message.length });

    // Get user's training data
    const trainingData = await getUserTrainingData(userId);
    console.log('Training data fetched:', { 
      totalWorkouts: trainingData.totalWorkouts,
      totalVolume: trainingData.totalVolume 
    });

    // Build context-aware system prompt
    const systemPrompt = `You are an AI Training Coach with access to the user's complete workout history. Your role is to:

1. Analyze their training data and provide personalized insights
2. Answer questions about their progress, patterns, and performance
3. Suggest improvements based on their actual training history
4. Help them understand their strengths and areas for improvement

USER'S TRAINING DATA:
${formatTrainingDataForAI(trainingData)}

GUIDELINES:
- Be encouraging but honest about their progress
- Use specific data from their workouts when making recommendations
- Suggest realistic goals based on their current performance
- If they ask about specific exercises, reference their actual performance with those exercises
- Focus on actionable advice that builds on their existing routine
- If you notice concerning patterns (overtraining, imbalances), point them out constructively

Keep responses conversational but data-driven. Always reference their actual training data when relevant.`;

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    console.log('Sending to OpenAI with', messages.length, 'messages');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    console.log('OpenAI response generated successfully');

    // Store conversation in database for context
    try {
      await supabase.from('ai_conversations').insert({
        user_id: userId,
        message_type: 'coach',
        user_message: message,
        ai_response: reply,
        training_data_snapshot: trainingData,
      });
    } catch (dbError) {
      console.warn('Failed to store conversation:', dbError);
    }

    return new Response(JSON.stringify({ 
      reply,
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

async function getUserTrainingData(userId: string) {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  // Fetch workouts
  const { data: workouts } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', threeMonthsAgo.toISOString())
    .order('start_time', { ascending: false });

  // Fetch exercise sets
  const workoutIds = workouts?.map(w => w.id) || [];
  const { data: exerciseSets } = await supabase
    .from('exercise_sets')
    .select('*')
    .in('workout_id', workoutIds);

  // Fetch personal records
  const { data: personalRecords } = await supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(10);

  const totalWorkouts = workouts?.length || 0;
  const totalSets = exerciseSets?.filter(set => set.completed).length || 0;
  const totalVolume = exerciseSets?.reduce((sum, set) => 
    set.completed ? sum + (set.weight * set.reps) : sum, 0) || 0;

  // Calculate exercise stats
  const exerciseStats = exerciseSets?.reduce((acc, set) => {
    if (!set.completed) return acc;
    
    if (!acc[set.exercise_name]) {
      acc[set.exercise_name] = { volume: 0, frequency: 0 };
    }
    acc[set.exercise_name].volume += set.weight * set.reps;
    acc[set.exercise_name].frequency += 1;
    return acc;
  }, {} as Record<string, { volume: number; frequency: number }>) || {};

  const topExercises = Object.entries(exerciseStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 8);

  return {
    totalWorkouts,
    totalVolume,
    totalSets,
    recentWorkouts: workouts?.slice(0, 5) || [],
    topExercises,
    personalRecords: personalRecords || [],
  };
}

function formatTrainingDataForAI(data: any): string {
  return `
RECENT PERFORMANCE:
- Total Workouts (3 months): ${data.totalWorkouts}
- Total Volume: ${data.totalVolume.toFixed(1)}kg
- Total Sets: ${data.totalSets}

TOP EXERCISES BY VOLUME:
${data.topExercises.slice(0, 5).map((ex: any) => 
  `- ${ex.name}: ${ex.volume.toFixed(1)}kg total, ${ex.frequency} sets`
).join('\n')}

RECENT PERSONAL RECORDS:
${data.personalRecords.slice(0, 3).map((pr: any) => 
  `- ${pr.exercise_name}: ${pr.value}${pr.unit} (${new Date(pr.date).toLocaleDateString()})`
).join('\n')}

RECENT WORKOUTS:
${data.recentWorkouts.slice(0, 3).map((w: any) => 
  `- ${w.name} (${w.training_type}) - ${Math.round(w.duration)}min on ${new Date(w.start_time).toLocaleDateString()}`
).join('\n')}
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