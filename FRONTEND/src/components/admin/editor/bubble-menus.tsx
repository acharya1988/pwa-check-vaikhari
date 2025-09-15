
'use client';

import * as React from 'react';
import { BubbleMenu, type Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Trash2, Pencil, Ban, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { NoteDialog } from './dialogs';

export function TableBubbleMenu({ editor }: { editor: Editor }) {
  return (
    <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} shouldShow={({ editor }) => editor.isActive('table')} className="flex gap-1 p-1 bg-background border border-border rounded-md shadow-lg">
      <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column After">Col +</Button>
      <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete Column">Col -</Button>
      <Separator orientation="vertical" className="h-auto" />
      <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row After">Row +</Button>
      <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().deleteRow().run()} title="Delete Row">Row -</Button>
       <Separator orientation="vertical" className="h-auto" />
       <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().mergeOrSplit().run()} title="Merge/Split Cells">Merge/Split</Button>
      <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleHeaderRow().run()} title="Toggle Header Row">Header</Button>
       <Separator orientation="vertical" className="h-auto" />
      <Button size="icon" variant="ghost" onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </BubbleMenu>
  )
}

export function ImageBubbleMenu({ editor }: { editor: Editor }) {
  const setAlignment = (alignClass: string | null) => {
    editor.chain().focus().updateAttributes('image', { class: alignClass }).run();
  };

  const setWidth = (width: string | null) => {
    editor.chain().focus().updateAttributes('image', { style: width ? `width: ${width};` : null }).run();
  };

  const currentClass = editor.getAttributes('image').class || '';
  const currentStyle = editor.getAttributes('image').style || '';
  const currentWidth = currentStyle.match(/width:\s*([^;]+)/)?.[1] || null;

  return (
    <BubbleMenu 
      editor={editor} 
      tippyOptions={{ duration: 100, placement: 'top' }} 
      shouldShow={({ editor }) => editor.isActive('image')} 
      className="flex gap-1 p-1 bg-background border border-border rounded-md shadow-lg"
    >
      {/* Alignment */}
      <Button size="icon" variant={currentClass.includes('float-left') ? 'secondary' : 'ghost'} onClick={() => setAlignment('float-left')} title="Align Left">
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button size="icon" variant={currentClass.includes('mx-auto') ? 'secondary' : 'ghost'} onClick={() => setAlignment('block mx-auto')} title="Align Center">
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button size="icon" variant={currentClass.includes('float-right') ? 'secondary' : 'ghost'} onClick={() => setAlignment('float-right')} title="Align Right">
        <AlignRight className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-auto" />

      {/* Sizing */}
      <Button size="sm" variant={currentWidth === '25%' ? 'secondary' : 'ghost'} onClick={() => setWidth('25%')}>S</Button>
      <Button size="sm" variant={currentWidth === '50%' ? 'secondary' : 'ghost'} onClick={() => setWidth('50%')}>M</Button>
      <Button size="sm" variant={currentWidth === '75%' ? 'secondary' : 'ghost'} onClick={() => setWidth('75%')}>L</Button>
      <Button size="sm" variant={!currentWidth || currentWidth === '100%' ? 'secondary' : 'ghost'} onClick={() => setWidth('100%')}>Full</Button>
      
      <Separator orientation="vertical" className="h-auto" />

      {/* Clear */}
      <Button size="icon" variant="ghost" onClick={() => editor.chain().focus().updateAttributes('image', { class: null, style: null }).run()} title="Remove Formatting">
        <Ban className="h-4 w-4" />
      </Button>
    </BubbleMenu>
  );
}

export function NoteBubbleMenu({ editor }: { editor: Editor }) {
  const [dialogState, setDialogState] = React.useState({ isOpen: false, type: '', content: '' });

  const handleEdit = () => {
    const { dataType, dataContent } = editor.getAttributes('note');
    setDialogState({ isOpen: true, type: dataType || 'footnote', content: dataContent || '' });
  };

  const handleSave = (newContent: string) => {
    editor.chain().focus().updateAttributes('note', { dataContent: newContent }).run();
    setDialogState({ isOpen: false, type: '', content: '' });
  };
  
  const handleDelete = () => {
    editor.chain().focus().deleteSelection().run();
  }

  return (
    <>
      <BubbleMenu 
        editor={editor} 
        tippyOptions={{ duration: 100 }} 
        shouldShow={({ editor }) => editor.isActive('note')} 
        className="flex gap-1 p-1 bg-background border border-border rounded-md shadow-lg"
      >
        <Button size="sm" variant="ghost" onClick={handleEdit}><Pencil className="mr-2 h-4 w-4"/>Edit Note</Button>
        <Button size="icon" variant="ghost" onClick={handleDelete} title="Delete Note">
            <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </BubbleMenu>
      <NoteDialog
        isOpen={dialogState.isOpen}
        onOpenChange={(isOpen) => setDialogState(prev => ({ ...prev, isOpen }))}
        noteType={dialogState.type}
        initialContent={dialogState.content}
        onSave={handleSave}
      />
    </>
  );
}
