
'use server';
/**
 * @fileOverview This file defines a Genkit flow to simulate an AI training process on tagged content.
 *
 * - trainOnTag - A function that handles the training simulation.
 * - TrainOnTagInput - The input type for the trainOnTag function.
 * - TrainOnTagOutput - The return type for the trainOnTag function.
 */

import { ai } from '@/app/genkit';
import {
  type TrainOnTagInput,
  TrainOnTagInputSchema,
  type TrainOnTagOutput,
  TrainOnTagOutputSchema,
} from '@/types/ai.types';

export type { TrainOnTagInput, TrainOnTagOutput };

const trainOnTagFlow = ai.defineFlow(
    {
      name: 'trainOnTagFlow',
      inputSchema: TrainOnTagInputSchema,
      outputSchema: TrainOnTagOutputSchema,
    },
    async (input) => {
      console.log(`[AI Training] Starting training for tag: #${input.tag}`);
      
      const itemsProcessed = input.contentItems.length;
      console.log(`[AI Training] Preparing to process ${itemsProcessed} items.`);
      
      await new Promise(resolve => setTimeout(resolve, 1500));

      const summary = `Successfully completed training simulation for tag #${input.tag}. Processed ${itemsProcessed} content items.`;
      console.log(`[AI Training] ${summary}`);
      
      return {
        summary,
        itemsProcessed,
      };
    }
);

export async function trainOnTag(input: TrainOnTagInput): Promise<TrainOnTagOutput> {
  return trainOnTagFlow(input);
}
