
'use server';

import { parseBookText } from '@/ai/flows/parse-book-text';
import { vaiaCopilot } from '@/ai/flows/vaia-copilot';
import type { ParseBookTextOutput } from '@/types';
import { ParseBookTextOutputSchema } from '@/types/import.types';
import { z } from 'zod';
import { getUserProfile } from '@/services/user.service';

const ParseSchema = z.object({
  text: z.string().min(50, 'Text must be at least 50 characters long.'),
});

/**
 * A Server Action to run the book parser AI flow.
 * @param prevState - The previous state.
 * @param formData - The form data containing the text to parse.
 * @returns An object with either the parsed data or an error message.
 */
export async function runBookParser(
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; data?: ParseBookTextOutput } | { error: string; fieldErrors?: any }> {
  const validatedFields = ParseSchema.safeParse({
    text: formData.get('text'),
  });

  if (!validatedFields.success) {
    return {
      error: 'Validation failed',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const aiResult = await parseBookText({ text: validatedFields.data.text });

    const parsedChapters = aiResult.chapters.map((rawChapter) => {
      const segments = (rawChapter.segments || []).map((aiSegment) => {
        const footnotes: Record<string, string> = {};

        if (aiSegment.footnoteText) {
          const noteRegex =
            /(?:[\[(]|\b)(\d+)[)\]]?\.?\s*–?\s*(.*?)(?=\s*(?:[\[(]|\b)\d+[)\]]?\.?\s*–?|$)/gs;
          let note;
          while ((note = noteRegex.exec(aiSegment.footnoteText)) !== null) {
            const noteNumberStr = note[1];
            const noteText = note[2].replace(/\n|\r/g, ' ').trim();
            footnotes[noteNumberStr] = noteText;
          }
        }

        return {
          id: crypto.randomUUID(),
          type: aiSegment.verseNumber.startsWith('prose') ? 'prose' : 'shloka',
          content: aiSegment.verseText.trim(),
          verseNumber: aiSegment.verseNumber,
          isAi: false,
          footnotes: footnotes,
        };
      });

      return {
        id: crypto.randomUUID(),
        name: rawChapter.name,
        segments: segments,
        children: [], // No change here, assuming flat structure from AI for now
      };
    });

    const finalData = {
      bookName: aiResult.bookName,
      chapters: parsedChapters,
    };

    const validatedOutput = ParseBookTextOutputSchema.safeParse(finalData);
    if (!validatedOutput.success) {
      console.error(
        'Final data structure validation failed:',
        validatedOutput.error.flatten()
      );
      return { error: 'Failed to structure the parsed data correctly.' };
    }

    return { success: true, data: validatedOutput.data };
  } catch (e: any) {
    console.error('AI Parser failed:', e);
    return { error: `AI processing failed: ${e.message}` };
  }
}

/**
 * A Server Action that wraps the VAIKHARI Copilot streaming flow.
 * @param history - The conversation history.
 * @param sessionId - A unique ID for the conversation session.
 * @returns The complete string response from the AI.
 */
export async function runCopilot(
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  sessionId: string
): Promise<string> {
    if (!history || history.length === 0) {
        throw new Error("Message history cannot be empty.");
    }
    const userProfile = await getUserProfile();

    const result = await vaiaCopilot({ 
      history, 
      userName: userProfile.preferredAiName || userProfile.name,
      userId: userProfile.email,
      userRole: "Scholar", // This can be made dynamic later
      sessionId,
    });
    return result;
}
