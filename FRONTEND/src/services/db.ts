
'use server';

// Firestore Integration: This file is now deprecated.
// All data access logic has been moved to individual service files
// that interact directly with Firestore. This file can be removed
// in a future cleanup.

import fs from 'fs/promises';
import path from 'path';

export async function readJsonFile<T>(filePath: string): Promise<T | null> {
    const fullPath = path.join(process.cwd(), filePath);
    try {
        await fs.access(fullPath); // Check if file exists first
        const fileContent = await fs.readFile(fullPath, 'utf8');
        if (fileContent.trim() === '') {
            return null;
        }
        return JSON.parse(fileContent);
    } catch (error) {
        return null;
    }
}

export async function writeJsonFile(filePath: string, data: any): Promise<void> {
     const fullPath = path.join(process.cwd(), filePath);
    try {
        await fs.writeFile(fullPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`Error writing JSON file at ${filePath}:`, error);
    }
}
