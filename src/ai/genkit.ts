import {genkit, Genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Lazy initialization to prevent build-time errors
let aiInstance: Genkit | null = null;

function getAI(): Genkit {
  if (aiInstance) return aiInstance;
  
  try {
    aiInstance = genkit({
      plugins: [googleAI()],
      model: 'googleai/gemini-2.0-flash',
    });
  } catch (error) {
    console.warn('Genkit initialization failed (may be expected during build):', error);
    // Return a placeholder that will fail at runtime if used
    // This allows the build to succeed
    aiInstance = {} as Genkit;
  }
  
  return aiInstance;
}

// Export a getter that lazily initializes
export const ai = new Proxy({} as Genkit, {
  get(target, prop) {
    const instance = getAI();
    return (instance as any)[prop];
  },
});
