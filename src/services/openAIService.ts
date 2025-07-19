import OpenAI from 'openai';

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
    name: string;
    reasoning: string;
    style: 'descriptive' | 'motivational' | 'technical' | 'creative';
    confidence: number;
  }>;
}

export class OpenAIService {
  private static instance: OpenAIService;
  private openai: OpenAI | null = null;
  private cache = new Map<string, { data: OpenAIResponse; timestamp: number }>();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour
  private readonly REQUEST_TIMEOUT = 5000; // 5 seconds
  private readonly MAX_RETRIES = 2;

  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  constructor() {
    try {
      // Initialize OpenAI client with API key from environment
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        console.warn('OpenAI API key not found. AI features will use fallback suggestions.');
        return;
      }

      this.openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true // Only for client-side usage
      });
    } catch (error) {
      console.error('Failed to initialize OpenAI service:', error);
    }
  }

  async generateWorkoutNames(workoutData: SafeWorkoutData): Promise<OpenAIResponse> {
    // Check cache first
    const cacheKey = this.generateCacheKey(workoutData);
    const cached = this.getCachedResponse(cacheKey);
    if (cached) {
      console.log('🎯 Using cached OpenAI response');
      return cached;
    }

    if (!this.openai) {
      throw new Error('OpenAI service not available');
    }

    const sanitizedData = this.sanitizeWorkoutData(workoutData);
    const prompt = this.buildWorkoutNamingPrompt(sanitizedData);

    let attempt = 0;
    while (attempt < this.MAX_RETRIES) {
      try {
        console.log('🤖 Generating AI workout names...', { attempt: attempt + 1 });
        
        const startTime = performance.now();
        
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('OpenAI request timeout')), this.REQUEST_TIMEOUT);
        });

        // Create OpenAI request promise
        const openaiPromise = this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `You are a creative fitness expert who generates engaging workout names. 
              You understand different training styles and can create names that match the workout's character.
              Always respond with valid JSON in the exact format requested.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.8,
          response_format: { type: "json_object" }
        });

        // Race between timeout and actual request
        const response = await Promise.race([openaiPromise, timeoutPromise]);
        
        const responseTime = performance.now() - startTime;
        console.log(`✅ OpenAI response received in ${Math.round(responseTime)}ms`);

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Empty response from OpenAI');
        }

        const parsedResponse = this.parseOpenAIResponse(content);
        
        // Cache successful response
        this.cacheResponse(cacheKey, parsedResponse);
        
        // Track performance
        this.trackPerformance('generateWorkoutNames', responseTime, parsedResponse.suggestions.length);
        
        return parsedResponse;

      } catch (error) {
        attempt++;
        console.warn(`OpenAI attempt ${attempt} failed:`, error);
        
        if (attempt >= this.MAX_RETRIES) {
          throw new Error(`OpenAI service failed after ${this.MAX_RETRIES} attempts: ${error}`);
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new Error('Failed to generate workout names');
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
        .map((s: any) => ({
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

      return { suggestions: validSuggestions };
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
    if (responseTime > this.REQUEST_TIMEOUT * 0.8) {
      console.warn(`OpenAI ${operation} took ${Math.round(responseTime)}ms (approaching timeout)`);
    }
    
    // Could send to analytics service here
    console.log(`🔍 OpenAI Performance: ${operation} - ${Math.round(responseTime)}ms - ${suggestionCount} suggestions`);
  }

  // Method to test if service is available
  isAvailable(): boolean {
    return this.openai !== null;
  }

  // Method to clear cache (useful for testing)
  clearCache(): void {
    this.cache.clear();
  }
}
