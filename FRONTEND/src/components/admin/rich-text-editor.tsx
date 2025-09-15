

'use client';

import * as React from 'react';
import { useEditor, EditorContent, type Editor, type Range } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import { Link as LinkExtension } from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import Heading from '@tiptap/extension-heading';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import type { Citation, Quote, QuoteCategory, GlossaryCategory } from '@/types';
import { getQuoteData } from '@/services/quote.service';

import {
  CustomImage,
  NoteNode,
  CitationNode,
  TocMark,
  headingIdPlugin,
  FontSize,
  QuoteSuggestions,
  QuoteCapture,
  ParagraphClassExtension,
  GlossaryHighlighterExtension,
  VersionWordMark,
  CustomBlockquote,
} from './editor/tiptap-extensions';
import { EditorToolbar } from './editor/toolbar';
import { ScholarlyToolbar } from './editor/scholarly-toolbar';
import { TableBubbleMenu, ImageBubbleMenu, NoteBubbleMenu } from './editor/bubble-menus';
import { NoteDialog } from './editor/dialogs';
import { CreateQuoteDialog } from './quote-forms';
import Placeholder from '@tiptap/extension-placeholder';

type RichTextEditorProps = {
  id: string;
  content: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  setEditorInstance?: (id: string, editor: Editor) => void;
  removeEditorInstance?: (id: string) => void;
  activeGlossary?: GlossaryCategory | null;
  onNewQuoteFound?: (text: string, range: Range) => void;
  showScholarlyToolbar?: boolean;
};


export const RichTextEditor = React.memo(({ 
  id,
  content, 
  onChange, 
  placeholder, 
  onFocus, 
  setEditorInstance,
  removeEditorInstance,
  activeGlossary = null,
  onNewQuoteFound,
  showScholarlyToolbar = true,
}: RichTextEditorProps) => {
  const [isClient, setIsClient] = React.useState(false);
  const [noteState, setNoteState] = React.useState<{ isOpen: boolean; type: string, position?: number }>({ isOpen: false, type: '' });
  
  const [quoteCategories, setQuoteCategories] = React.useState<QuoteCategory[]>([]);

  React.useEffect(() => {
    setIsClient(true);
    getQuoteData().then(setQuoteCategories);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
          heading: false,
          codeBlock: false, 
          code: false,
          horizontalRule: false,
          blockquote: false,
      }),
      Placeholder.configure({ placeholder }),
      CustomBlockquote,
      Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }).extend({
        addAttributes() {
            return {
                ...this.parent?.(),
                id: {
                    default: null,
                    parseHTML: element => element.getAttribute('id'),
                    renderHTML: attributes => ({ id: attributes.id }),
                },
            };
        },
      }),
      ParagraphClassExtension,
      HorizontalRule,
      Underline,
      Superscript,
      Subscript,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      FontFamily,
      Color,
      FontSize,
      CustomImage.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      LinkExtension.configure({
        openOnClick: false,
        autolink: false,
        validate: href => /^https?:\/\//.test(href) || /^\/articles\//.test(href),
        inclusive: false,
      }),
      NoteNode,
      CitationNode,
      TocMark,
      VersionWordMark,
      QuoteSuggestions,
      QuoteCapture.configure({
          onNewQuoteFound: onNewQuoteFound || (() => {}),
      }),
      headingIdPlugin(),
      GlossaryHighlighterExtension.configure({
        terms: activeGlossary ? activeGlossary.terms : [],
        colorTheme: activeGlossary?.colorTheme,
      }),
    ],
    content: content,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    onFocus() {
      onFocus?.();
    },
    editorProps: {
        attributes: {
            class: 'ProseMirror',
        },
    },
  }, [activeGlossary]);

  const handleNoteButtonClick = React.useCallback((type: 'footnote' | 'specialnote') => {
    if (!editor) return;
    const { from } = editor.state.selection;
    setNoteState({ isOpen: true, type, position: from });
  }, [editor]);

  const handleSaveNote = React.useCallback((content: string) => {
    if (!content || !editor || noteState.position === undefined) return;
    
    editor.chain().focus().insertContentAt(noteState.position, {
        type: 'note',
        attrs: {
            dataType: noteState.type,
            dataContent: content
        }
    }).run();
    
    setNoteState({ isOpen: false, type: '' });
  }, [editor, noteState.type, noteState.position]);

  const handleCitationClick = React.useCallback(() => {
    // This is now handled by the suggestion menu `[[`
    // Placeholder in case of future direct citation button.
  }, []);

  const handleQuoteClick = React.useCallback(() => {
    if (!editor) return;
    const { from, to, empty } = editor.state.selection;
    if (empty) return;
    const text = editor.state.doc.textBetween(from, to, ' ');
    onNewQuoteFound?.(text, { from, to });
  }, [editor, onNewQuoteFound]);


  React.useEffect(() => {
    if (editor && !editor.isFocused && editor.getHTML() !== content) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  React.useEffect(() => {
    if (editor) {
      setEditorInstance?.(id, editor);
    }
    return () => {
      removeEditorInstance?.(id);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, editor, setEditorInstance, removeEditorInstance]);

  if (!isClient || !editor) {
    return (
      <div className="prose-styling min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 animate-pulse" />
    );
  }

  return (
    <div className="bg-transparent">
        <NoteDialog 
            isOpen={noteState.isOpen}
            onOpenChange={(isOpen) => setNoteState(prev => ({ ...prev, isOpen }))}
            noteType={noteState.type}
            onSave={handleSaveNote}
        />
        <TableBubbleMenu editor={editor} />
        <ImageBubbleMenu editor={editor} />
        <NoteBubbleMenu editor={editor} />
        {showScholarlyToolbar && (
            <ScholarlyToolbar 
                editor={editor} 
                onNoteButtonClick={handleNoteButtonClick} 
                onCitationClick={handleCitationClick}
                onQuoteClick={handleQuoteClick}
            />
        )}
      
      <EditorContent editor={editor} />
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

