
/**
 * @fileOverview This file imports all Genkit flows to ensure they are registered.
 * In dev, guard against re-registering flows across HMR by loading once.
 */

const g = globalThis as any;
if (!g.__vaikhari_genkit_loaded__) {
  g.__vaikhari_genkit_loaded__ = true;
  ;(async () => {
    // Ensure the ai object is initialized first
    await import('./genkit');
    // Dynamically import flows once
    await import('@/ai/flows/extract-citations');
    await import('@/ai/flows/extract-glossary-terms');
    await import('@/ai/flows/generate-sanskrit-variations');
    await import('@/ai/flows/vaia-copilot');
    await import('@/ai/flows/parse-book-text');
    await import('@/ai/flows/search-quotes-contextually');
    await import('@/ai/flows/suggest-contextual-citations');
    await import('@/ai/flows/train-on-tag');
    await import('@/ai/flows/translate-text');
    await import('@/ai/flows/translate-to-sanskrit');
    await import('@/ai/flows/email-otp');
    await import('@/ai/flows/medhayu-copilot');
  })().catch(() => {});
}
