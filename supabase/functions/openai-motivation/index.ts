import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import items from '../../../src/data/epic_equivalents.json' assert { type: 'json' };

type EpicItem = { id: string; label: string; baseKg: number; fact: string; emoji?: string };

function bestEpicMatch(tonnageKg: number, list: EpicItem[]) {
  let best = { item: list[0], n: 1, approxKg: list[0].baseKg };
  let bestDiff = Math.abs(tonnageKg - best.approxKg);
  for (const item of list) {
    const n = Math.min(60, Math.max(1, Math.round(tonnageKg / item.baseKg)) || 1);
    const approxKg = n * item.baseKg;
    const diff = Math.abs(tonnageKg - approxKg);
    if (diff < bestDiff) {
      best = { item, n, approxKg };
      bestDiff = diff;
    }
  }
  return best;
}

const allowedLabels = (items as EpicItem[]).map((i) => i.label);
const allowedCsv = allowedLabels.join(', ');

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

    const { tonnage, sets, reps, deltaPct, period, periodType, locale, style } = await req.json();
    if (typeof tonnage !== 'number' || typeof sets !== 'number' || typeof reps !== 'number' ||
        typeof deltaPct !== 'number' || !period || !periodType || !locale || !style) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: corsHeaders });
    }

    const cacheQuery = supabase
      .from('ai_motivation_cache')
      .select('text')
      .eq('user_id', user.id)
      .eq('period_type', periodType)
      .eq('period_id', period)
      .eq('locale', locale)
      .eq('style', style)
      .maybeSingle();
    const { data: cacheHit } = await cacheQuery;
    if (cacheHit && cacheHit.text) {
      console.info('motivation cache hit');
      let cachedItem: EpicItem | undefined;
      let n: number | undefined;
      for (const it of items as EpicItem[]) {
        if (cacheHit.text.toLowerCase().includes(it.label.toLowerCase())) {
          cachedItem = it;
          n = Math.min(60, Math.max(1, Math.round(tonnage / it.baseKg)) || 1);
          break;
        }
      }
      return new Response(
        JSON.stringify({
          text: cacheHit.text,
          variant: 'A',
          item: cachedItem ? { ...cachedItem, n } : undefined,
          cached: true,
          fallback: false,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    console.info('motivation cache miss');

    const systemPrompt = `You are a concise, epic-tone strength coach. Output **max 2 lines**, **≤140 chars total**.\nLine 1: bold hook with the tonnage + one equivalence from the **allowed list** only (1–60 multiples).\nLine 2: a short educational nudge (no medical claims). Use at most **1 emoji**. Respond in ${locale}.\nAllowed items: ${allowedCsv}. Return **two variants** separated by |||. Plain text only.`;
    const userPrompt = `Period: ${periodType} ${period}\nTonnage: ${tonnage} kg (Δ ${deltaPct}% vs prior)\nContext: sets ${sets}, reps ${reps}\nStyle: epic\nIf helpful, choose an item and integer multiple (1–60).`;

    let text = '';
    let chosenItem: EpicItem | undefined;
    let variant: 'A' | 'B' = 'A';
    let fallback = false;
    let success = false;

    for (let attempt = 0; attempt < 2 && !success; attempt++) {
      const start = Date.now();
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
      console.info('openai response', response.status, 'latency', Date.now() - start);

      if (response.ok) {
        const data = await response.json();
        const raw = data.choices?.[0]?.message?.content?.trim() || '';
        const variants = raw.split('|||').map((v: string) => v.trim());
        for (let i = 0; i < variants.length; i++) {
          const v = variants[i];
          const found = (items as EpicItem[]).find(it => v.toLowerCase().includes(it.label.toLowerCase()));
          if (found) {
            text = v;
            chosenItem = found;
            variant = i === 0 ? 'A' : 'B';
            break;
          }
        }
        if (!text) {
          const match = bestEpicMatch(tonnage, items as EpicItem[]);
          chosenItem = match.item;
          const equiv = `≈ ${match.n} ${match.item.label}${match.n > 1 ? 's' : ''}`;
          text = `${tonnage} kg — ${equiv}\n${match.item.fact}`;
          fallback = true;
        }
        success = true;
      } else if (response.status === 429 || response.status >= 500) {
        await new Promise(r => setTimeout(r, Math.random() * 400 + 300));
      } else {
        break;
      }
    }

    if (!success) {
      const match = bestEpicMatch(tonnage, items as EpicItem[]);
      chosenItem = match.item;
      const equiv = `≈ ${match.n} ${match.item.label}${match.n > 1 ? 's' : ''}`;
      text = `${tonnage} kg — ${equiv}\n${match.item.fact}`;
      fallback = true;
    }

    await supabase.from('ai_motivation_cache').upsert({
      user_id: user.id,
      period_type: periodType,
      period_id: period,
      locale,
      style,
      text,
      updated_at: new Date().toISOString(),
    });

    const n = chosenItem ? Math.min(60, Math.max(1, Math.round(tonnage / chosenItem.baseKg)) || 1) : undefined;

    return new Response(JSON.stringify({ text, variant, item: chosenItem ? { ...chosenItem, n } : undefined, cached: false, fallback }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('openai-motivation error:', error);
    const fallbackText = 'Keep moving forward! Every rep counts.';
    return new Response(JSON.stringify({ text: fallbackText, cached: false, fallback: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

