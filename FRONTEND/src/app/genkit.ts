
// Note: Do NOT use 'use server' here; it causes Next to treat
// this module as a Server Actions file and reject non-async exports.

/**
 * @fileOverview Centralized Genkit configuration and initialization.
 */
import 'server-only';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { setMaxListeners } from 'events';

try {
  // Avoid noisy warnings in dev when modules reload
  setMaxListeners(50, process);
} catch {}




// Ensure single initialization across HMR in dev
const plugins = [googleAI()];
const g = globalThis as any;
export const ai = g.__vaikhari_ai__ ?? (g.__vaikhari_ai__ = genkit({ plugins }));

