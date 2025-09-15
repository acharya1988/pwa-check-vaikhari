
// 'use client';

// import React, { useState, useEffect } from 'react';
// import { Button } from '@/components/ui/button';
// import { Volume2, Loader2, RefreshCw } from 'lucide-react';
// import { marked } from 'marked';
// import { textToSpeech } from '@/ai/flows/text-to-speech';
// import { cn } from '@/lib/utils';
// import { Bot } from 'lucide-react';

// export function AssistantMessage({ content }: { content: string }) {
//     const [audioSrc, setAudioSrc] = useState<string | null>(null);
//     const [isLoadingAudio, setIsLoadingAudio] = useState(true);
//     const [isPlaying, setIsPlaying] = useState(false);
//     const audioRef = React.useRef<HTMLAudioElement | null>(null);

//     const generateAndPlayAudio = async () => {
//         if (!content) return;
//         setIsLoadingAudio(true);
//         try {
//             const result = await textToSpeech({ text: content });
//             setAudioSrc(result.audioDataUri);
//             setIsPlaying(true);
//         } catch (error) {
//             console.error("Text-to-speech error:", error);
//         } finally {
//             setIsLoadingAudio(false);
//         }
//     };

//     useEffect(() => {
//         generateAndPlayAudio();
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [content]);

//     useEffect(() => {
//         if (audioSrc && audioRef.current) {
//             if (isPlaying) {
//                 audioRef.current.play().catch(e => console.error("Audio play failed:", e));
//             } else {
//                 audioRef.current.pause();
//             }
//         }
//     }, [isPlaying, audioSrc]);

//     const handleButtonClick = () => {
//         if (audioSrc) {
//             setIsPlaying(!isPlaying);
//         } else {
//             generateAndPlayAudio();
//         }
//     };

//     return (
//         <div className="flex items-start gap-3">
//             <div className="flex flex-col items-center">
//                 <Bot className="h-6 w-6 text-primary" />
//                 <span className="text-xs text-muted-foreground">VAIA</span>
//             </div>
//             <div className="flex-1 p-3 rounded-lg bg-muted prose prose-sm dark:prose-invert max-w-none prose-p:my-1">
//                 <div dangerouslySetInnerHTML={{ __html: marked(content) as string }} />
//                 <div className="flex justify-end mt-2 -mb-2 -mr-2">
//                     <Button onClick={handleButtonClick} variant="ghost" size="icon" className="h-7 w-7" title="Play audio">
//                         {isLoadingAudio ? (
//                             <Loader2 className="h-4 w-4 animate-spin" />
//                         ) : isPlaying ? (
//                             <Volume2 className="h-4 w-4 text-primary" />
//                         ) : (
//                             <RefreshCw className="h-4 w-4 text-muted-foreground" />
//                         )}
//                     </Button>
//                 </div>
//             </div>
//             {audioSrc && (
//                 <audio 
//                     ref={audioRef}
//                     src={audioSrc}
//                     onPlay={() => setIsPlaying(true)}
//                     onPause={() => setIsPlaying(false)}
//                     onEnded={() => setIsPlaying(false)}
//                     className="hidden"
//                 />
//             )}
//         </div>
//     );
// }
