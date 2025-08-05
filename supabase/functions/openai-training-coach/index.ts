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
  
  // Fetch workouts with detailed exercise data
  const { data: workouts } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', threeMonthsAgo.toISOString())
    .order('start_time', { ascending: false });

  // Fetch exercise sets with workout details
  const workoutIds = workouts?.map(w => w.id) || [];
  const { data: exerciseSets } = await supabase
    .from('exercise_sets')
    .select(`
      *,
      workout_sessions!inner(
        id,
        name,
        training_type,
        start_time,
        end_time,
        duration,
        notes
      )
    `)
    .in('workout_id', workoutIds)
    .order('workout_id', { ascending: false });

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

  // Create detailed workout sessions with exercises
  const detailedWorkouts = workouts?.map(workout => {
    const workoutSets = exerciseSets?.filter(set => set.workout_id === workout.id) || [];
    
    // Group sets by exercise
    const exerciseGroups = workoutSets.reduce((acc, set) => {
      if (!acc[set.exercise_name]) {
        acc[set.exercise_name] = {
          exercise_name: set.exercise_name,
          sets: []
        };
      }
      acc[set.exercise_name].sets.push({
        set_number: set.set_number,
        weight: set.weight,
        reps: set.reps,
        completed: set.completed,
        rest_time: set.rest_time
      });
      return acc;
    }, {} as Record<string, { exercise_name: string; sets: any[] }>);

    return {
      ...workout,
      exercises: Object.values(exerciseGroups),
      total_sets: workoutSets.length,
      total_volume: workoutSets.reduce((sum, set) => 
        set.completed ? sum + (set.weight * set.reps) : sum, 0),
      exercises_performed: Object.keys(exerciseGroups).length
    };
  }) || [];

  // Calculate exercise stats
  const exerciseStats = exerciseSets?.reduce((acc, set) => {
    if (!set.completed) return acc;
    
    if (!acc[set.exercise_name]) {
      acc[set.exercise_name] = { 
        volume: 0, 
        frequency: 0, 
        total_sets: 0,
        max_weight: 0,
        total_reps: 0,
        workouts_performed: new Set()
      };
    }
    acc[set.exercise_name].volume += set.weight * set.reps;
    acc[set.exercise_name].frequency += 1;
    acc[set.exercise_name].total_sets += 1;
    acc[set.exercise_name].total_reps += set.reps;
    acc[set.exercise_name].max_weight = Math.max(acc[set.exercise_name].max_weight, set.weight);
    acc[set.exercise_name].workouts_performed.add(set.workout_id);
    return acc;
  }, {} as Record<string, { 
    volume: number; 
    frequency: number; 
    total_sets: number;
    max_weight: number;
    total_reps: number;
    workouts_performed: Set<string>;
  }>) || {};

  // Convert sets to arrays for serialization
  const topExercises = Object.entries(exerciseStats)
    .map(([name, stats]) => ({ 
      name, 
      volume: stats.volume,
      frequency: stats.frequency,
      total_sets: stats.total_sets,
      max_weight: stats.max_weight,
      total_reps: stats.total_reps,
      workouts_performed: stats.workouts_performed.size
    }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10);

  return {
    totalWorkouts,
    totalVolume,
    totalSets,
    recentWorkouts: detailedWorkouts.slice(0, 10), // Include detailed exercise data
    allWorkouts: detailedWorkouts, // Full workout history for analysis
    topExercises,
    personalRecords: personalRecords || [],
    exerciseBreakdown: exerciseStats // Detailed exercise statistics
  };
}

function formatTrainingDataForAI(data: any): string {
  return `
RECENT PERFORMANCE SUMMARY:
- Total Workouts (3 months): ${data.totalWorkouts}
- Total Volume: ${data.totalVolume.toFixed(1)}kg
- Total Sets: ${data.totalSets}

TOP EXERCISES BY PERFORMANCE:
${data.topExercises.slice(0, 6).map((ex: any) => 
  `- ${ex.name}: ${ex.volume.toFixed(1)}kg total volume, ${ex.total_sets} sets across ${ex.workouts_performed} workouts (max: ${ex.max_weight}kg)`
).join('\n')}

RECENT PERSONAL RECORDS:
${data.personalRecords.slice(0, 5).map((pr: any) => 
  `- ${pr.exercise_name}: ${pr.value}${pr.unit} (${new Date(pr.date).toLocaleDateString()})`
).join('\n')}

DETAILED RECENT WORKOUT SESSIONS:
${data.recentWorkouts.slice(0, 5).map((w: any) => {
  const workoutDate = new Date(w.start_time).toLocaleDateString();
  const exerciseDetails = w.exercises.map((ex: any) => {
    const completedSets = ex.sets.filter((set: any) => set.completed);
    const setDetails = completedSets.map((set: any) => 
      `${set.weight}kg×${set.reps}`
    ).join(', ');
    return `  • ${ex.exercise_name}: ${completedSets.length} sets [${setDetails}]`;
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