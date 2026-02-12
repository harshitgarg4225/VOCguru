import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Model configurations
export const MODELS = {
  FAST: 'llama3-8b-8192',      // For fast extraction tasks
  INTELLIGENT: 'llama3-70b-8192' // For complex analysis
};

// System prompts
export const PROMPTS = {
  CLEAN_TRANSCRIPT: `You are a transcript cleaner. You will receive a VTT file content with timestamps.
1. Remove all timestamps and metadata.
2. Format the text as "Speaker: [Text]".
3. Remove filler words (um, ah, like).
4. Return ONLY the clean text.`,

  EXTRACT_FEATURE: `You are a Senior Product Manager. Analyze the following user feedback.
Output a JSON object with these keys:
- "feature_title": A short, standard feature name (e.g., "Dark Mode", "SSO Support").
- "problem_summary": A 1-sentence summary of the user's pain.
- "sentiment": "positive", "neutral", or "negative".
- "urgency": 1-10 scale based on emotional language.
- "tags": Array of keywords (e.g., ["ux", "api", "billing"]).

IMPORTANT: Return ONLY valid JSON, no markdown code blocks or extra text.`,

  WRITE_RELEASE_NOTE: (featureTitle: string, date: string) => `Write a short, casual notification to a user.
Context: They asked for "${featureTitle}" on ${date}.
Update: We just shipped it.
Tone: Friendly, concise, no corporate jargon.
Output: Only the message body, nothing else.`
};

// AI Helper functions
export async function cleanTranscript(vttContent: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: PROMPTS.CLEAN_TRANSCRIPT },
      { role: 'user', content: vttContent }
    ],
    model: MODELS.FAST,
    temperature: 0.1,
    max_tokens: 4096,
  });
  
  return completion.choices[0]?.message?.content || '';
}

export interface ExtractedFeature {
  feature_title: string;
  problem_summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: number;
  tags: string[];
}

export async function extractFeature(content: string): Promise<ExtractedFeature> {
  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: PROMPTS.EXTRACT_FEATURE },
      { role: 'user', content: `Input Text: ${content}` }
    ],
    model: MODELS.INTELLIGENT,
    temperature: 0.2,
    max_tokens: 1024,
  });
  
  const response = completion.choices[0]?.message?.content || '{}';
  
  try {
    // Try to parse JSON, handling potential markdown code blocks
    const jsonStr = response.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse AI response:', response);
    return {
      feature_title: 'Unknown Feature',
      problem_summary: content.substring(0, 200),
      sentiment: 'neutral',
      urgency: 5,
      tags: []
    };
  }
}

export async function generateReleaseNote(featureTitle: string, date: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: PROMPTS.WRITE_RELEASE_NOTE(featureTitle, date) },
      { role: 'user', content: 'Generate the notification.' }
    ],
    model: MODELS.INTELLIGENT,
    temperature: 0.7,
    max_tokens: 256,
  });
  
  return completion.choices[0]?.message?.content || '';
}

// Generate embeddings using a simple approach (for production, use a proper embedding model)
export async function generateEmbedding(text: string): Promise<number[]> {
  // Note: Groq doesn't have native embeddings yet
  // For production, use OpenAI embeddings or local model
  // This is a placeholder that creates a simple hash-based embedding
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(384).fill(0);
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    for (let j = 0; j < word.length; j++) {
      const idx = (word.charCodeAt(j) * (i + 1) * (j + 1)) % 384;
      embedding[idx] += 1 / words.length;
    }
  }
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / (magnitude || 1));
}

