
'use client';

import React, { useState, useEffect, useRef, useCallback, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Send, Loader2, X, Mic } from 'lucide-react';
import { useCopilot } from '@/contexts/copilot-context';
import { cn } from '@/lib/utils';
import { runCopilot } from '@/actions/ai.actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getUserProfile } from '@/services/user.service';
import type { UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { AnimatePresence, motion } from 'framer-motion';


interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function ToggleCopilotButton() {
  const { isCopilotOpen, setCopilotOpen } = useCopilot();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setCopilotOpen(prev => !prev)}
      title="Toggle AI Copilot"
      className="h-10 w-10"
    >
      <Sparkles className={cn("h-5 w-5", isCopilotOpen && "text-primary")} />
    </Button>
  )
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" size="icon" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
    );
}

function ChatBot() {
    const { contextText, clearCopilotContext } = useCopilot();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    
   

    useEffect(() => {
        getUserProfile().then(setCurrentUser);
    }, []);

    const handleConversation = useCallback(async (history: Message[]) => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            const result = await runCopilot(history, "temp-session-id");
            console.log("result",result)
            const assistantMessage: Message = { role: 'assistant', content: result };
            console.log("assistantMessage",assistantMessage)
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Copilot error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        if (contextText && currentUser) {
            const initialUserMessage: Message = {
                role: 'user',
                content: `Please analyze the following text:\n\n---\n\n${contextText}`
            };
            const newHistory = [initialUserMessage];
            setMessages(newHistory);
            handleConversation(newHistory);
            clearCopilotContext();
        }
    }, [contextText, currentUser, handleConversation, clearCopilotContext]);

    const scrollToBottom = useCallback(() => {
        const scrollArea = scrollAreaRef.current;
        if (scrollArea) {
            const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }, []);

    useEffect(scrollToBottom, [messages]);
    
    const sendInputAsMessage = useCallback((text: string) => {
        if (!text.trim() || isLoading || !currentUser) return;
        const userMessage: Message = { role: 'user', content: text };
        const newHistory = [...messages, userMessage];
        console.log("userMessage",userMessage)
        console.log("newHistory",newHistory)
        setMessages(newHistory);
        setInput('');
        handleConversation(newHistory);
    }, [isLoading, currentUser, messages, handleConversation]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        sendInputAsMessage(input);
    };
    

    return (
        <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                 <div className="space-y-4">
                 
                    {messages.map((message, index) => (
                        <div key={index}>
                           
                                <div className="flex items-start gap-3 justify-end">
                                    <div className="p-3 rounded-lg max-w-sm prose prose-sm dark:prose-invert prose-p:my-0 bg-primary text-primary-foreground">
                                        {message.content.split('---')[0]}
                                    </div>
                                </div>
                           
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                             <div className="p-3 rounded-lg bg-muted flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin"/>
                                <span className="text-xs text-muted-foreground">VAIA is now analyzing...</span>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
            <div className="p-4 border-t flex-shrink-0 space-y-2">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <Textarea 
                        id="copilot-textarea"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type or click the mic to speak..."
                        className="flex-1 resize-none"
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                e.currentTarget.form?.requestSubmit();
                            }
                        }}
                        disabled={isLoading || !currentUser}
                    />
                  
                    <SubmitButton />
                </form>
            </div>
        </div>
    )
}

export function CopilotSidebar() {
    const { isCopilotOpen, setCopilotOpen, isMobile } = useCopilot();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null;
    }
    
    if (isMobile) {
        return (
             <AnimatePresence>
                {isCopilotOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed h-full w-full inset-0 bg-black/60 z-50"
                            onClick={() => setCopilotOpen(false)}
                        />
                         <motion.aside
                            key="copilot-sidebar-mobile"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="fixed h-full w-[360px] max-w-[calc(100vw-40px)] inset-y-0 right-0 bg-card z-[100] flex flex-col"
                        >
                            <header className="p-4 border-b flex-shrink-0 flex items-center justify-between">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    VAIA Copilot
                                </h3>
                                <Button variant="ghost" size="icon" onClick={() => setCopilotOpen(false)}>
                                    <X className="h-5 w-5" />
                                </Button>
                            </header>
                            <ChatBot />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        );
    }
    
    return (
        <AnimatePresence>
            {isCopilotOpen && (
                <motion.aside 
                    key="copilot-sidebar"
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className={cn(
                        "h-full w-[360px] bg-card border-l flex flex-col flex-shrink-0",
                    )}
                >
                     <header className="p-4 border-b flex-shrink-0">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            VAIA Copilot
                        </h3>
                    </header>
                    <ChatBot />
                </motion.aside>
            )}
        </AnimatePresence>
    );
}
