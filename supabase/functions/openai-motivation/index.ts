import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!openAiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { tonnage, sets, reps, deltaPct, period, periodType, locale } = await req.json();
    if (typeof tonnage !== 'number' || typeof sets !== 'number' || typeof reps !== 'number' ||
        typeof deltaPct !== 'number' || !period || !periodType || !locale) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: corsHeaders });
    }

    const cacheQuery = supabase
      .from('ai_motivation_cache')
      .select('text')
      .eq('user_id', user.id)
      .eq('period_type', periodType)
      .eq('period_id', period)
      .eq('locale', locale)
      .maybeSingle();
    const { data: cacheHit } = await cacheQuery;
    if (cacheHit && cacheHit.text) {
      return new Response(JSON.stringify({ text: cacheHit.text, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are a concise fitness coach. Generate a motivational, punchy message for the user’s Home screen. Max 2 lines, ≤ 140 characters total. Include the tonnage number and a relatable real‑world comparison. Use at most 2 emojis. Respond in ${locale}.`;
    const userPrompt = `Period: ${periodType} ${period}\nTonnage: ${tonnage} kg (Δ ${deltaPct}% vs prior)\nSets: ${sets}, Reps: ${reps}\nOutput: 1 motivational message (no markdown).`;

    let text = 'Great effort this week! Keep pushing forward 💪';
    let fallback = false;
    let success = false;

    for (let attempt = 0; attempt < 2 && !success; attempt++) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 80,
          temperature: 0.9,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        text = data.choices?.[0]?.message?.content?.trim() || text;
        success = true;
      } else if (response.status === 429 || response.status >= 500) {
        await new Promise(r => setTimeout(r, Math.random() * 400 + 300));
      } else {
        break;
      }
    }

    if (!success) {
      fallback = true;
    }

    await supabase.from('ai_motivation_cache').upsert({
      user_id: user.id,
      period_type: periodType,
      period_id: period,
      locale,
      text,
      updated_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ text, cached: false, fallback }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('openai-motivation error:', error);
    const fallbackText = 'Keep moving forward! Every rep counts 💪';
    return new Response(JSON.stringify({ text: fallbackText, cached: false, fallback: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
