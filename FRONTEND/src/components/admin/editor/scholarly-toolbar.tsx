

'use client';

import { BubbleMenu, type Editor } from '@tiptap/react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Quote, ListTree, Layers, FileText, BotMessageSquare } from 'lucide-react';
import { Ab1Icon, Sn1Icon } from '@/components/icons';
import { Toggle } from '@/components/ui/toggle';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { ContentBlock, BookStructure } from '@/types';
import { VersionSwitcherDialog } from './dialogs';

interface ScholarlyToolbarProps {
    editor: Editor;
    onNoteButtonClick: (type: 'footnote' | 'specialnote') => void;
    onCitationClick: () => void;
    onQuoteClick: () => void;
    block?: Partial<ContentBlock>;
    structure?: BookStructure;
    onBlockUpdate?: (id: string, updates: Partial<Omit<ContentBlock, 'id'>>) => void;
}

export function ScholarlyToolbar({ editor, onNoteButtonClick, onCitationClick, onQuoteClick, block, structure, onBlockUpdate }: ScholarlyToolbarProps) {
  
  const [isVersionSwitcherOpen, setIsVersionSwitcherOpen] = React.useState(false);
  
  const isTextSelected = !editor.state.selection.empty;
  const canChangeBlockPurpose = block && structure && onBlockUpdate;

  const handleBlockTypeChange = (purpose: 'source' | 'commentary') => {
    if (!block?.id || !structure) return;

    let newType = block.type || 'shloka';
    if (purpose === 'source') {
        newType = structure.sourceTypes?.[0] || 'shloka';
    } else {
        newType = structure.commentaryTypes?.[0] || 'bhashya';
    }
    onBlockUpdate?.(block.id, { type: newType });
  };
  
  const handleOpenVersionSwitcher = () => {
    if (editor.isActive('versionWord')) {
      const versions = editor.getAttributes('versionWord').versions || [];
      // Logic to open dialog with existing versions
    }
    setIsVersionSwitcherOpen(true);
  };

  const handleSaveVersions = (versions: string[]) => {
    if (versions.length > 0) {
      editor.chain().focus().setVersionWord({ versions }).run();
    }
    setIsVersionSwitcherOpen(false);
  };
  
  return (
    <BubbleMenu 
        editor={editor} 
        tippyOptions={{ 
            duration: 100,
            popperOptions: {
                strategy: 'fixed',
            },
        }}
        shouldShow={({ editor }) => {
            // Do not show if another specific bubble menu is active to avoid overlap.
            if (editor.isActive('table') || editor.isActive('image') || editor.isActive('note')) {
                return false;
            }
            // Show the toolbar whenever the editor is focused.
            return editor.isFocused;
        }}
    >
      <VersionSwitcherDialog
        isOpen={isVersionSwitcherOpen}
        onOpenChange={setIsVersionSwitcherOpen}
        initialVersions={editor.getAttributes('versionWord').versions || [editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ')]}
        onSave={handleSaveVersions}
      />
        <div className="flex gap-1 p-1 bg-background border border-border rounded-md shadow-lg">
            {canChangeBlockPurpose && (
                <Popover modal={false}>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            aria-label="Change Block Purpose"
                            title="Change Block Purpose"
                        >
                            <Layers className="h-5 w-5" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-1">
                         <div className="flex flex-col">
                            <Button variant="ghost" className="justify-start" onMouseDown={() => handleBlockTypeChange('source')} disabled={!structure.sourceTypes || structure.sourceTypes.length === 0}>
                                Convert to Source Text
                            </Button>
                            <Button variant="ghost" className="justify-start" onMouseDown={() => handleBlockTypeChange('commentary')} disabled={!structure.commentaryTypes || structure.commentaryTypes.length === 0}>
                                Convert to Commentary
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            )}

            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => onNoteButtonClick('footnote')}
                aria-label="Add Footnote"
                title="Add Footnote"
                disabled={isTextSelected}
            >
                <Ab1Icon className="h-6 w-6" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => onNoteButtonClick('specialnote')}
                aria-label="Add Special Note"
                title="Add Special Note"
                disabled={isTextSelected}
            >
                <Sn1Icon className="h-6 w-6" />
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={handleOpenVersionSwitcher}
              disabled={!isTextSelected}
              aria-label="Add Version"
              title="Add Version"
            >
                <BotMessageSquare className="h-5 w-5" />
            </Button>

            <Toggle size="sm" pressed={editor.isActive('toc')} onPressedChange={() => editor.chain().focus().toggleTocMark().run()} aria-label="Toggle TOC Mark" title="Toggle TOC Mark" disabled={!isTextSelected}>
                <ListTree className="h-4 w-4" />
            </Toggle>
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={onCitationClick}
              disabled={!isTextSelected}
              aria-label="Create Citation"
              title="Create Citation"
            >
                <FileText className="h-5 w-5" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={onQuoteClick}
              disabled={!isTextSelected}
              aria-label="Create Quote from Selection"
              title="Create Quote from Selection"
            >
                <Quote className="h-5 w-5" />
            </Button>
        </div>
    </BubbleMenu>
  );
}
