
'use server';

import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';

// Firestore Integration: This service interacts with Firebase Storage for media files.

export async function getMediaFiles(): Promise<string[]> {
    const listRef = ref(storage, 'media');
    try {
        const res = await listAll(listRef);
        const urls = await Promise.all(res.items.map(itemRef => getDownloadURL(itemRef)));
        return urls;
    } catch (error) {
        console.error("Error reading media directory from storage:", error);
        return [];
    }
}

export async function addMediaFile(fileName: string, fileBuffer: Buffer): Promise<string> {
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '');
    const storageRef = ref(storage, `media/${safeFileName}`);
    
    try {
        const snapshot = await uploadBytes(storageRef, fileBuffer);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        return downloadUrl;
    } catch (error) {
        console.error(`Error writing file ${safeFileName} to storage:`, error);
        throw new Error('Could not save the file to Firebase Storage.');
    }
}
