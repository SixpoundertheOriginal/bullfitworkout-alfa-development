// Privacy-safe data structure for OpenAI
interface SafeWorkoutData {
  exercises: string[];
  duration: number;
  training_type: string;
  muscle_groups: string[];
  total_sets: number;
  avg_weight?: number;
  is_strength_focused?: boolean;
}

interface OpenAIResponse {
  suggestions: Array<{
    id: string;
    name: string;
    reasoning: string;
    style: 'descriptive' | 'motivational' | 'technical' | 'creative';
    confidence: number;
  }>;
  reasoning: string;
  confidence: number;
}

export class OpenAIService {
  private static instance: OpenAIService;
  private cache = new Map<string, { data: OpenAIResponse; timestamp: number }>();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  constructor() {
    console.log('✅ OpenAI service initialized (using edge function)');
  }

  async generateWorkoutNames(workoutData: SafeWorkoutData): Promise<OpenAIResponse> {
    // Check cache first
    const cacheKey = this.generateCacheKey(workoutData);
    const cached = this.getCachedResponse(cacheKey);
    if (cached) {
      console.log('🎯 Using cached OpenAI response');
      return cached;
    }

    try {
      console.log('🚀 Calling OpenAI edge function');
      const startTime = performance.now();
      
      // Import supabase client dynamically
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Call our edge function instead of OpenAI directly
      const { data, error } = await supabase.functions.invoke('openai-workout-naming', {
        body: { workoutData: this.sanitizeWorkoutData(workoutData) }
      });
      
      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Edge function error: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('No data received from edge function');
      }
      
      const responseTime = performance.now() - startTime;
      console.log(`✅ OpenAI edge function call successful in ${Math.round(responseTime)}ms`);
      
      // Cache successful response
      this.cacheResponse(cacheKey, data);
      
      // Track performance
      this.trackPerformance('generateWorkoutNames', responseTime, data.suggestions?.length || 0);
      
      return data;
      
    } catch (error) {
      console.error('🔥 OpenAI service error:', error);
      
      // Return fallback suggestions
      return this.getFallbackResponse(workoutData);
    }
  }

  async generateMotivationForPeriod(input: {
    tonnage: number;
    sets: number;
    reps: number;
    deltaPct: number;
    period: string;
    periodType: 'week' | 'month';
    locale: string;
    style?: 'epic' | 'calm' | 'data' | 'tough-love';
  }): Promise<{ text: string; item?: { label: string; n: number; emoji?: string; fact: string } }> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('openai-motivation', {
        body: { ...input, style: input.style || 'epic' },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Edge function error: ${error.message}`);
      }

      const line = (data?.text as string)?.split('\n')[1]?.trim() || data?.text || 'Keep lifting—every rep counts.';
      const item = data?.item
        ? { label: data.item.label, n: data.item.n, emoji: data.item.emoji, fact: data.item.fact }
        : undefined;

      return { text: line, item };
    } catch (err) {
      console.error('generateMotivationForPeriod error:', err);
      return { text: 'Keep lifting—every rep counts.' };
    }
  }

  private getFallbackResponse(workoutData: SafeWorkoutData): OpenAIResponse {
    return {
      suggestions: [
        {
          id: 'fallback-1',
          name: `${workoutData.training_type} Session`,
          reasoning: 'Fallback suggestion due to API unavailability',
          style: 'descriptive' as const,
          confidence: 0.5
        }
      ],
      reasoning: 'Using fallback suggestions',
      confidence: 0.5
    };
  }

  private sanitizeWorkoutData(data: SafeWorkoutData): SafeWorkoutData {
    // Ensure no personal data is included
    return {
      exercises: data.exercises.map(ex => ex.toLowerCase().trim()),
      duration: Math.max(0, Math.min(300, data.duration)), // Cap at 5 hours
      training_type: data.training_type.toLowerCase().trim(),
      muscle_groups: data.muscle_groups.map(mg => mg.toLowerCase().trim()),
      total_sets: Math.max(0, Math.min(50, data.total_sets)), // Reasonable caps
      avg_weight: data.avg_weight ? Math.max(0, Math.min(500, data.avg_weight)) : undefined,
      is_strength_focused: data.is_strength_focused
    };
  }

  private buildWorkoutNamingPrompt(data: SafeWorkoutData): string {
    const exerciseList = data.exercises.slice(0, 8).join(', '); // Limit for prompt length
    const muscleGroups = data.muscle_groups.slice(0, 4).join(', ');
    
    return `Generate 4 creative workout names for a ${data.training_type} session with the following characteristics:

Exercises: ${exerciseList}
Duration: ${data.duration} minutes
Primary muscle groups: ${muscleGroups}
Total sets: ${data.total_sets}
${data.is_strength_focused ? 'Focus: Strength/Heavy weights' : 'Focus: General fitness'}

Requirements:
- Create names that reflect the workout's character and intensity
- Mix different styles: descriptive, motivational, technical, and creative
- Each name should be 2-6 words, engaging and memorable
- Include reasoning for each suggestion
- Assign confidence scores (0.1-1.0) based on how well the name fits

Respond with valid JSON in this exact format:
{
  "suggestions": [
    {
      "name": "Power Push Paradise",
      "reasoning": "Emphasizes the push movements and strength focus",
      "style": "motivational",
      "confidence": 0.85
    }
  ]
}`;
  }

  private parseOpenAIResponse(content: string): OpenAIResponse {
    try {
      const parsed = JSON.parse(content);
      
      if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
        throw new Error('Invalid response format: missing suggestions array');
      }

      // Validate and clean suggestions
      const validSuggestions = parsed.suggestions
        .filter((s: any) => s.name && s.reasoning && s.style && typeof s.confidence === 'number')
        .map((s: any, index: number) => ({
          id: s.id || `suggestion-${Date.now()}-${index}`,
          name: String(s.name).slice(0, 50), // Limit name length
          reasoning: String(s.reasoning).slice(0, 200), // Limit reasoning length
          style: ['descriptive', 'motivational', 'technical', 'creative'].includes(s.style) 
            ? s.style : 'descriptive',
          confidence: Math.max(0.1, Math.min(1.0, Number(s.confidence)))
        }))
        .slice(0, 5); // Max 5 suggestions

      if (validSuggestions.length === 0) {
        throw new Error('No valid suggestions in OpenAI response');
      }

      return { 
        suggestions: validSuggestions,
        reasoning: parsed.reasoning || 'AI-generated suggestions',
        confidence: parsed.confidence || 0.8
      };
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      throw new Error('Invalid response format from OpenAI');
    }
  }

  private generateCacheKey(data: SafeWorkoutData): string {
    // Create a deterministic cache key from workout characteristics
    const keyData = {
      exercises: data.exercises.sort().slice(0, 5), // Top 5 exercises
      duration: Math.floor(data.duration / 10) * 10, // Round to nearest 10 minutes
      training_type: data.training_type,
      total_sets: Math.floor(data.total_sets / 5) * 5 // Round to nearest 5 sets
    };
    return btoa(JSON.stringify(keyData));
  }

  private getCachedResponse(key: string): OpenAIResponse | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key); // Remove expired cache
    }
    return null;
  }

  private cacheResponse(key: string, data: OpenAIResponse): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Cleanup old cache entries (keep last 100)
    if (this.cache.size > 100) {
      const entries = Array.from(this.cache.entries())
        .sort(([,a], [,b]) => b.timestamp - a.timestamp)
        .slice(0, 100);
      this.cache.clear();
      entries.forEach(([k, v]) => this.cache.set(k, v));
    }
  }

  private trackPerformance(operation: string, responseTime: number, suggestionCount: number): void {
    if (responseTime > 5000) { // 5 second threshold
      console.warn(`OpenAI ${operation} took ${Math.round(responseTime)}ms (slow response)`);
    }
    
    // Could send to analytics service here
    console.log(`🔍 OpenAI Performance: ${operation} - ${Math.round(responseTime)}ms - ${suggestionCount} suggestions`);
  }

  // Method to test if service is available
  isAvailable(): boolean {
    return true; // Always available with edge function
  }

  // Method to clear cache (useful for testing)
  clearCache(): void {
    this.cache.clear();
  }
}
