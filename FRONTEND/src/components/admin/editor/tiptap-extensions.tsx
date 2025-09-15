

'use client';

import * as React from 'react';
import { Node, Mark, mergeAttributes, findChildren, Extension } from '@tiptap/core';
import '@tiptap/extension-text-style'
import { ReactNodeViewRenderer, NodeViewWrapper, Range, Editor, EditorView } from '@tiptap/react';
import TiptapImage from '@tiptap/extension-image';
import { Plugin, PluginKey, EditorState } from 'prosemirror-state';
import slugify from 'slugify';
import Image from 'next/image';
import { Suggestion, type SuggestionOptions } from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy, {type Instance as TippyInstance, type Props as TippyProps} from 'tippy.js';
import Blockquote from '@tiptap/extension-blockquote';

import { getCitationByRefId, searchCitations } from '@/services/citation.service';
import { searchQuotes } from '@/services/quote.service';
import { getDiscoverableUsers } from '@/services/user.service';
import { type Citation, type Quote, type GlossaryTerm, type GlossaryCategory, UserProfile } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SuggestionList, QuoteSuggestionList, TagSuggestionList, UserSuggestionList } from './suggestion-list';
import { cn } from '@/lib/utils';
import { Decoration, DecorationSet } from 'prosemirror-view'

// --- TYPE DECLARATIONS FOR CUSTOM COMMANDS ---
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    note: {
      /**
       * Set a note
       */
      setNote: (attributes: { dataType: string; dataContent?: string; }) => ReturnType;
    };
    toc: {
      /**
       * Toggle a TOC mark
       */
      toggleTocMark: () => ReturnType;
    };
    versionWord: {
        setVersionWord: (attributes: { versions: string[] }) => ReturnType,
        toggleVersionWord: (attributes: { versions: string[] }) => ReturnType,
        unsetVersionWord: () => ReturnType,
    };
    fontSize: {
      /**
       * Set the font size
       */
      setFontSize: (size: string) => ReturnType;
      /**
       * Unset the font size
       */
      unsetFontSize: () => ReturnType;
    };
  }
}
// --- END TYPE DECLARATIONS ---


// Create a custom image extension to support class and style attributes for alignment and resizing.
export const CustomImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: null,
        parseHTML: element => element.getAttribute('class'),
        renderHTML: (attributes) => ({ class: attributes.class }),
      },
      style: {
        default: null,
        parseHTML: element => element.getAttribute('style'),
        renderHTML: (attributes) => ({ style: attributes.style }),
      },
    };
  },
});

export const CustomBlockquote = Blockquote.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            author: {
                default: null,
                parseHTML: element => element.getAttribute('data-author'),
                renderHTML: attributes => (attributes.author ? { 'data-author': attributes.author } : {}),
            }
        }
    }
});

export const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .run();
      },
    };
  },
});

// Extension to add a `class` attribute to paragraphs.
export const ParagraphClassExtension = Extension.create({
  name: 'paragraphClass',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph'],
        attributes: {
          class: {
            default: null,
            parseHTML: element => element.getAttribute('class'),
            renderHTML: attributes => {
              if (!attributes.class) {
                return {}
              }
              return {
                class: attributes.class,
              }
            },
          },
        },
      },
    ]
  },
});


function NoteComponent(props: any) {
    const { editor, node, getPos } = props;
    const { dataType, dataContent } = node.attrs;

    const noteNumber = React.useMemo(() => {
        try {
            const currentPos = getPos();
            if (typeof currentPos !== 'number') return 1;

            let noteIndex = 0;
            editor.state.doc.descendants((descendant: any, pos: number) => {
                if (pos >= currentPos) {
                    return false;
                }
                if (descendant.type.name === 'note' && descendant.attrs.dataType === dataType) {
                    noteIndex++;
                }
                return true;
            });
            return noteIndex + 1;
        } catch (e) {
            return 1; 
        }
    }, [editor.state.doc, getPos, dataType]);
        
    const className = dataType === 'footnote'
        ? 'text-blue-600 dark:text-blue-400 font-bold select-none text-[11px]'
        : 'text-red-600 dark:text-red-400 font-bold select-none text-[11px]';
        
    const content = dataType === 'footnote' ? `(${noteNumber})` : `[${noteNumber}]`;

    return (
        <NodeViewWrapper
            as="sup"
            data-type={dataType}
            data-content={dataContent}
            className={className + ' cursor-pointer hover:ring-2 hover:ring-primary rounded-sm p-0.5'}
            onClick={() => {
                if(editor.isEditable) {
                    editor.commands.setNodeSelection(getPos());
                }
            }}
        >
            {content}
        </NodeViewWrapper>
    );
}

export const NoteNode = Node.create({
  name: 'note',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      dataType: {
        default: 'footnote',
        parseHTML: element => element.getAttribute('data-type'),
      },
      dataContent: {
        default: '',
        parseHTML: element => element.getAttribute('data-content'),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'sup[data-type]' }];
  },
  
  renderHTML({ node, HTMLAttributes }) {
      return [
        'sup',
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
          'data-type': node.attrs.dataType,
          'data-content': node.attrs.dataContent,
        }),
      ];
  },

  addCommands() {
    return {
      setNote: (attributes) => ({ chain }) => {
        return chain().insertContent({ type: this.name, attrs: attributes }).run();
      },
    };
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(NoteComponent);
  },
});


function CitationComponent(props: any) {
  const [citation, setCitation] = React.useState<CitationType | null>(null);
  
  React.useEffect(() => {
    async function fetchCitation() {
      const data = await getCitationByRefId(props.node.attrs.refId);
      setCitation(data);
    }
    fetchCitation();
  }, [props.node.attrs.refId]);

  return (
    <NodeViewWrapper as="div" className="my-4">
      <figure>
        <blockquote className="border-l-4 border-primary/50 pl-4 py-2 bg-muted/50 rounded-r-md">
            {citation ? (
              <>
                <p className="font-devanagari text-lg">{citation.sanskrit}</p>
                {citation.translation && <p className="italic text-muted-foreground mt-2">{citation.translation}</p>}
              </>
            ) : (
                <p className="text-muted-foreground italic">Loading citation...</p>
            )}
        </blockquote>
        <figcaption className="text-right text-sm text-muted-foreground mt-1 pr-2">
            — {citation ? `${citation.source}, ${citation.location}` : props.node.attrs.refId}
        </figcaption>
      </figure>
    </NodeViewWrapper>
  );
};


export const citationSuggestionOptions: Omit<SuggestionOptions, 'editor'> = {
  char: '[[',
  pluginKey: new PluginKey('citationSuggestion'),
  command: ({ editor, range, props }) => {
    // This now just inserts the node. The node view component does the rendering.
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .insertContent({
        type: 'citation',
        attrs: { refId: props.refId },
      })
      .run();
  },
  allow: ({ editor, range }) => {
    return editor.can().deleteRange(range);
  },
  items: async ({ query }) => {
    const items = await searchCitations(query);
    return items;
  },
  render: () => {
    let component: any;
    let popup: any;

    return {
      onStart: (props) => {
        if (typeof window === 'undefined' || !props.clientRect) {
          return;
        }

        component = new ReactRenderer(SuggestionList, {
          props,
          editor: props.editor,
        });

        const getReferenceClientRect = () => {
          const rect = props.clientRect?.();
          return rect || new DOMRect(0, 0, 0, 0);
        };
        
        popup = tippy('body', {
          getReferenceClientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });
      },
      onUpdate(props) {
        if (!component) return;
        component.updateProps(props);
        
        if (!props.clientRect) {
            return;
        }

        const getReferenceClientRect = () => {
          const rect = props.clientRect?.();
          return rect || new DOMRect(0, 0, 0, 0);
        };
        
        if (popup) {
            popup[0].setProps({
              getReferenceClientRect,
            });
        }
      },
      onKeyDown(props) {
        if (!popup) return false;
        if (props.event.key === 'Escape') {
          popup[0].hide();
          return true;
        }
        return component.ref?.onKeyDown(props) ?? false;
      },
      onExit() {
        popup?.[0].destroy();
        component?.destroy();
      },
    };
  },
};


export const CitationNode = Node.create({
  name: 'citation',
  group: 'block', // Changed from inline to block
  atom: true,

  addAttributes() {
    return {
      refId: {
        default: null,
        parseHTML: element => element.getAttribute('data-ref-id'),
        renderHTML: attributes => ({ 'data-ref-id': attributes.refId }),
      },
    };
  },

  parseHTML() {
    return [{ 
      tag: 'div[data-citation-node]',
      getAttrs: dom => ({
          refId: (dom as HTMLElement).getAttribute('data-ref-id')
      })
    }];
  },
  
  renderHTML({ node, HTMLAttributes }) {
      return [
        'div', 
        mergeAttributes(HTMLAttributes, { 
          'data-citation-node': 'true',
          'data-ref-id': node.attrs.refId, 
        }),
        // This content will be replaced by the NodeView
        `Loading ${node.attrs.refId}...`
      ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CitationComponent);
  },

  addProseMirrorPlugins() {
    if (typeof window === 'undefined') {
      return [];
    }
    return [
      Suggestion({
        editor: this.editor,
        ...citationSuggestionOptions,
      }),
    ];
  },
});


export const TocMark = Mark.create({
  name: 'toc',
  inclusive: false,

  addAttributes() {
    return {
      'data-id': {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => (attributes['data-id'] ? { 'data-id': attributes['data-id'] } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-toc-mark]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-toc-mark': 'true' }), 0];
  },

  addCommands() {
    return {
      toggleTocMark: () => ({ commands, tr }) => {
        // Generate a unique ID only when adding the mark
        const { selection } = tr;
        const hasMark = this.editor.isActive(this.name);

        if (hasMark) {
          return commands.unsetMark(this.name);
        } else {
           const uniqueId = `toc-mark-${crypto.randomUUID()}`;
           return commands.setMark(this.name, { 'data-id': uniqueId });
        }
      },
    };
  },
});

export function headingIdPlugin() {
    return new Plugin({
        appendTransaction: (transactions, oldState, newState) => {
            if (!transactions.some(transaction => transaction.docChanged)) {
                return null;
            }

            const tr = newState.tr;
            const ids = new Set<string>();

            findChildren(newState.doc, node => node.type.name === 'heading').forEach(item => {
                const id = slugify(item.node.textContent || '', { lower: true, strict: true }) || `heading-${item.pos}`;
                
                let uniqueId = id;
                let count = 1;
                while (ids.has(uniqueId)) {
                    uniqueId = `${id}-${count++}`;
                }
                ids.add(uniqueId);
                
                if (item.node.attrs.id !== uniqueId) {
                    tr.setNodeAttribute(item.pos, 'id', uniqueId);
                }
            });
            
            return tr.docChanged ? tr : null;
        },
    });
}

// --- QUOTE EXTENSIONS ---

export const quoteSuggestionOptions: Omit<SuggestionOptions, 'editor'> = {
  char: '"',
  pluginKey: new PluginKey('quoteSuggestion'),
  command: ({ editor, range, props }) => {
    editor.chain().focus().deleteRange(range).insertContent({
        type: 'blockquote',
        attrs: { author: props.author },
        content: [{ type: 'paragraph', content: [{ type: 'text', text: `“${props.quote}”` }] }]
    }).run();
  },
  allow: ({ editor, range }) => {
    const textBefore = editor.state.doc.textBetween(range.from - 1, range.from, "\n");
    return textBefore === ' ' || textBefore === '';
  },
  items: async ({ query }) => {
    const items = await searchQuotes(query);
    return items;
  },
  render: () => {
    let component: any;
    let popup: any;
    return {
      onStart: props => {
        if (typeof window === 'undefined' || !props.clientRect) return;
        component = new ReactRenderer(QuoteSuggestionList, { props, editor: props.editor });
        const getReferenceClientRect = () => props.clientRect?.() || new DOMRect();
        popup = tippy('body', { getReferenceClientRect, appendTo: () => document.body, content: component.element, showOnCreate: true, interactive: true, trigger: 'manual', placement: 'bottom-start' });
      },
      onUpdate: props => {
        if (!component) return;
        component.updateProps(props);
        if (!props.clientRect) return;
        const getReferenceClientRect = () => props.clientRect?.() || new DOMRect();
        if (popup) popup[0].setProps({ getReferenceClientRect });
      },
      onKeyDown: props => {
        if (!popup) return false;
        if (props.event.key === 'Escape') { popup[0].hide(); return true; }
        return component.ref?.onKeyDown(props) ?? false;
      },
      onExit: () => {
        popup?.[0].destroy();
        component?.destroy();
      },
    };
  },
};

export const QuoteSuggestions = Extension.create({
  name: 'quoteSuggestions',

  addProseMirrorPlugins() {
    if (typeof window === 'undefined') {
      return [];
    }
    return [
      Suggestion({
        editor: this.editor,
        ...quoteSuggestionOptions,
      }),
    ];
  },
});


export const QuoteCapture = Extension.create<{ onNewQuoteFound: (text: string, range: Range) => void }>({
  name: 'quoteCapture',

  addOptions() {
    return {
      onNewQuoteFound: () => {},
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('quoteCapture'),
        props: {
          handleTextInput: (view, from, to, text) => {
            if (text !== '"') return false;

            const { state } = view;
            const $from = state.doc.resolve(from);
            
            if ($from.parent.type.name === 'blockquote') return false;

            const textContentBefore = $from.parent.textBetween(0, $from.parentOffset, undefined, '\uFFFC');
            const openingQuoteIndex = textContentBefore.lastIndexOf('"');

            if (openingQuoteIndex !== -1) {
              const quoteText = textContentBefore.substring(openingQuoteIndex + 1);
              if (quoteText.trim()) {
                const quoteStartPos = $from.start() + openingQuoteIndex;
                const quoteEndPos = to;
                
                this.options.onNewQuoteFound(quoteText, { from: quoteStartPos, to: quoteEndPos });
              }
            }
            return false;
          },
        },
      }),
    ];
  },
});

// --- Glossary Plugin Implementation ---

function calculateDecorations(doc: any, stemmedTermObjects: GlossaryTerm[], colorTheme: string | undefined, glossaryTermsMap: Map<string, GlossaryTerm>): DecorationSet {
    const decorations: Decoration[] = [];
    if (!stemmedTermObjects || stemmedTermObjects.length === 0) return DecorationSet.empty;

    const highlightClass = colorTheme ? `glossary-highlight-${colorTheme}` : 'glossary-term-highlight';
    
    const sortedTerms = [...stemmedTermObjects].sort((a, b) => b.term.length - a.term.length);

    const escapedTerms = sortedTerms.map(g => g.term.trim())
        .filter(Boolean)
        .map(term => term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));

    if (escapedTerms.length === 0) return DecorationSet.empty;
    
    const pattern = `(${escapedTerms.join('|')})`;
    const regex = new RegExp(pattern, 'gu');

    doc.descendants((node: any, pos: number) => {
        if (!node.isText || !node.text) return;

        let isInsideNonHighlightable = false;
        doc.resolve(pos).marks().forEach((mark: any) => {
            if (['link', 'citation', 'note'].includes(mark.type.name)) {
                isInsideNonHighlightable = true;
            }
        });
        if (isInsideNonHighlightable) return;

        for (const match of node.text.matchAll(regex)) {
            if (match.index === undefined) continue;
            
            const from = pos + match.index;
            const to = from + match[0].length;
            const matchedTermText = match[1];
            const termData = glossaryTermsMap.get(matchedTermText);

            if (termData) {
                decorations.push(
                    Decoration.inline(from, to, {
                        class: highlightClass,
                        'data-tippy-content': `<strong>${termData.term}</strong><br/><em>${termData.transliteration || ''}</em><hr class='my-1'/>${termData.definition}`,
                    })
                );
            }
        }
    });

    return DecorationSet.create(doc, decorations);
};

class TooltipView {
  private tippyInstances: TippyInstance[];

  constructor(private view: EditorView) {
    this.tippyInstances = [];
    this.updateTooltips(view);
  }

  update(view: EditorView, prevState: EditorState) {
    const docChanged = !prevState.doc.eq(view.state.doc);
    const decorationsChanged = !prevState.plugins.some((p, i) => !p.spec.decorations?.(prevState)?.eq(view.state.plugins[i].spec.decorations?.(view.state.doc)));
    
    if (docChanged || decorationsChanged) {
        this.updateTooltips(view);
    }
  }

  updateTooltips(view: EditorView) {
    this.destroy(); 
    this.tippyInstances = tippy(view.dom.querySelectorAll('[data-tippy-content]'), {
        content: (reference) => reference.getAttribute('data-tippy-content'),
        allowHTML: true,
        interactive: true,
        appendTo: () => document.body,
        placement: 'bottom',
    });
  }

  destroy() {
    this.tippyInstances.forEach(instance => {
      if (instance && !instance.state.isDestroyed) {
        instance.destroy();
      }
    });
    this.tippyInstances = [];
  }
}

export const GlossaryHighlighterExtension = Extension.create<{
    terms: GlossaryTerm[],
    colorTheme?: string,
}>({
    name: 'glossaryHighlighter',

    addOptions() {
        return {
            terms: [],
            colorTheme: undefined,
        };
    },

    addProseMirrorPlugins() {
        const { options } = this;
        
        const glossaryTermsMap = new Map<string, GlossaryTerm>();
        options.terms.forEach(g => {
            const stemmedTerm = g.term.replace(/ः$/, '');
            if (!glossaryTermsMap.has(stemmedTerm)) {
                glossaryTermsMap.set(stemmedTerm, g);
            }
        });

        const stemmedTermObjects: GlossaryTerm[] = [];
        glossaryTermsMap.forEach((originalTerm, stemmedKey) => {
            stemmedTermObjects.push({ ...originalTerm, term: stemmedKey });
        });

        const highlighterPlugin = new Plugin({
            key: new PluginKey('glossaryHighlighter'),
            state: {
                init: (_, { doc }) => calculateDecorations(doc, stemmedTermObjects, options.colorTheme, glossaryTermsMap),
                apply: (tr, value) => {
                    if (tr.docChanged) {
                        return calculateDecorations(tr.doc, stemmedTermObjects, options.colorTheme, glossaryTermsMap);
                    }
                    return value.map(tr.mapping, tr.doc);
                },
            },
            props: {
                decorations(state) {
                    return this.getState(state);
                },
            },
        });
        
        const tooltipPlugin = new Plugin({
            key: new PluginKey('glossaryTooltips'),
            view: (editorView) => new TooltipView(editorView),
        });

        return [highlighterPlugin, tooltipPlugin];
    },
});

interface VersionWordOptions {
    versions: string[];
}

export const VersionWordMark = Mark.create<VersionWordOptions>({
    name: 'versionWord',
    inclusive: false,

    addOptions() {
        return {
            versions: [],
        };
    },

    addAttributes() {
        return {
            versions: {
                default: [],
                parseHTML: element => JSON.parse(element.getAttribute('data-versions') || '[]'),
                renderHTML: attributes => {
                    if (!attributes.versions || attributes.versions.length === 0) {
                        return {};
                    }
                    return { 'data-versions': JSON.stringify(attributes.versions) };
                },
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-versions]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes, { class: 'version-word' }), 0];
    },

    addCommands() {
        return {
            setVersionWord: (attributes) => ({ commands }) => {
                return commands.setMark(this.name, attributes);
            },
            toggleVersionWord: (attributes) => ({ commands }) => {
                return commands.toggleMark(this.name, attributes);
            },
            unsetVersionWord: () => ({ commands }) => {
                return commands.unsetMark(this.name);
            },
        };
    },
});

// --- TAGGING/MENTION EXTENSIONS ---

const getSuggestionItems = async ({ query, char }: { query: string; char: string }) => {
  if (char === '@') {
    const users = await getDiscoverableUsers();
    return users
      .filter(user => user.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5)
      .map(user => ({ id: user.email, label: user.name, avatar: user.avatarUrl }));
  }
  if (char === '#') {
    // Replace with a real tag fetching service
    const tags = ['Sushruta', 'Ayurveda', 'Rigveda', 'Yoga', 'Vedanta'];
    return tags
      .filter(tag => tag.toLowerCase().includes(query.toLowerCase()))
      .map(tag => ({ id: tag, label: tag }));
  }
  if (char === '*') {
     // Replace with a real tag fetching service
    const metaTags = ['reference', 'doubt', 'insight', 'parallel', 'verified', 'draft', 'annotation', 'summary'];
    return metaTags
      .filter(tag => tag.toLowerCase().includes(query.toLowerCase()))
      .map(tag => ({ id: tag, label: tag }));
  }
  return [];
};

const createSuggestionConfig = (char: string, component: any) => ({
    char,
    items: ({ query }: { query: string }) => getSuggestionItems({ query, char }),
    render: () => {
        let renderer: any;
        let popup: any;

        return {
          onStart: (props: any) => {
            renderer = new ReactRenderer(component, { props, editor: props.editor });
            if (!props.clientRect) return;
            popup = tippy('body', {
              getReferenceClientRect: props.clientRect,
              appendTo: () => document.body,
              content: renderer.element,
              showOnCreate: true,
              interactive: true,
              trigger: 'manual',
              placement: 'bottom-start',
            });
          },
          onUpdate: (props: any) => {
            renderer.updateProps(props);
            if (!props.clientRect) return;
            popup[0].setProps({ getReferenceClientRect: props.clientRect });
          },
          onKeyDown: (props: any) => {
            if (props.event.key === 'Escape') {
              popup[0].hide();
              return true;
            }
            return renderer.ref?.onKeyDown(props) ?? false;
          },
          onExit: () => {
            popup[0].destroy();
            renderer.destroy();
          },
        };
    },
});

export const TagSuggestion = Suggestion(createSuggestionConfig('#', TagSuggestionList));
export const MentionSuggestion = Suggestion(createSuggestionConfig('@', UserSuggestionList));
export const MetaTagSuggestion = Suggestion(createSuggestionConfig('*', TagSuggestionList));
