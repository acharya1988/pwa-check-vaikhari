
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getMediaFiles } from '@/services/media.service';
import { searchLinkableArticles, type LinkableArticle } from '@/services/book.service';
import { Plus, Trash2 } from 'lucide-react';

export function NoteDialog({ isOpen, onOpenChange, noteType, onSave, initialContent = '' }: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  noteType: string;
  onSave: (content: string) => void;
  initialContent?: string;
}) {
  const [content, setContent] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
    }
  }, [isOpen, initialContent]);

  const handleSave = () => {
    onSave(content);
    setContent('');
    onOpenChange(false);
  };
  
  const typeName = noteType.charAt(0).toUpperCase() + noteType.slice(1);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {typeName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="note-content">Content</Label>
          <Textarea 
            id="note-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Enter the text for your ${noteType}...`}
            rows={4}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
          <Button onClick={handleSave}>Save {typeName}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LinkDialog({
  isOpen,
  onOpenChange,
  onSave,
  initialUrl = ''
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (url: string) => void;
  initialUrl?: string;
}) {
  const [url, setUrl] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setUrl(initialUrl);
    }
  }, [isOpen, initialUrl]);

  const handleSave = () => {
    onSave(url);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set External Link</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
            <Label htmlFor="link-url">URL</Label>
            <Input 
                id="link-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
            />
        </div>
        <DialogFooter>
          <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={handleSave}>Save Link</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ArticleLinkDialog({ isOpen, onOpenChange, onSelectLink }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onSelectLink: (url: string) => void }) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<LinkableArticle[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }
  }, [isOpen]);

  React.useEffect(() => {
    const handler = setTimeout(async () => {
      if (query.length > 1) {
        setLoading(true);
        const articles = await searchLinkableArticles(query);
        setResults(articles);
        setLoading(false);
      } else {
        setResults([]);
      }
    }, 300); // Debounce

    return () => {
      clearTimeout(handler);
    };
  }, [query]);
  
  const handleSelect = (url: string) => {
    onSelectLink(url);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link to an Article</DialogTitle>
          <DialogDescription>Search for a published article to link to.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
            <Input 
                placeholder="Search by book, chapter, or verse..."
                value={query}
                onChange={e => setQuery(e.target.value)}
            />
            <ScrollArea className="h-64">
                <div className="space-y-1 pr-4">
                    {loading && <p className="text-sm text-muted-foreground p-2">Searching...</p>}
                    {!loading && results.length === 0 && query.length > 1 && <p className="text-sm text-muted-foreground p-2">No articles found.</p>}
                    {results.map(article => (
                        <Button key={article.id} variant="ghost" className="w-full justify-start h-auto py-2" onClick={() => handleSelect(article.url)}>
                            <span className="text-left">{article.label}</span>
                        </Button>
                    ))}
                </div>
            </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ImageDialog({ editor, isOpen, onOpenChange }: { editor: any, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
  const [mediaFiles, setMediaFiles] = React.useState<string[]>([]);
  const [url, setUrl] = React.useState('');
  const [alt, setAlt] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setUrl('');
      setAlt('');
      getMediaFiles().then(setMediaFiles);
    }
  }, [isOpen]);

  const handleInsertFromUrl = () => {
    if (url && editor) {
      editor.chain().focus().setImage({ src: url, alt }).run();
      onOpenChange(false);
    }
  };

  const handleSelectFromLibrary = (fileUrl: string) => {
    if (editor) {
      editor.chain().focus().setImage({ src: fileUrl, alt }).run();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="library">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library">Media Library</TabsTrigger>
            <TabsTrigger value="url">From URL</TabsTrigger>
          </TabsList>
          <TabsContent value="library" className="mt-4">
            {mediaFiles.length > 0 ? (
              <ScrollArea className="h-72">
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 pr-4">
                  {mediaFiles.map(fileUrl => (
                    <button
                      key={fileUrl}
                      onClick={() => handleSelectFromLibrary(fileUrl)}
                      className="relative aspect-square overflow-hidden rounded-md border transition-all hover:ring-2 hover:ring-primary focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <Image
                        src={fileUrl}
                        alt={`Media image ${fileUrl}`}
                        fill
                        sizes="(max-width: 768px) 33vw, 20vw"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex h-48 items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <p>Your media library is empty.<br />Upload an image via the Media page.</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="url" className="mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="img-url">Image URL</Label>
                <Input
                  id="img-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/image.png"
                />
              </div>
              <div>
                <Label htmlFor="img-alt">Alt Text (for accessibility)</Label>
                <Input
                  id="img-alt"
                  value={alt}
                  onChange={(e) => setAlt(e.target.value)}
                  placeholder="Description of the image"
                />
              </div>
              <DialogFooter>
                  <Button type="button" onClick={handleInsertFromUrl}>Insert Image</Button>
              </DialogFooter>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export function VersionSwitcherDialog({
    isOpen,
    onOpenChange,
    initialVersions,
    onSave,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    initialVersions: string[];
    onSave: (versions: string[]) => void;
}) {
    const [versions, setVersions] = React.useState<string[]>([]);

    React.useEffect(() => {
        if (isOpen) {
            setVersions(initialVersions.length > 0 ? initialVersions : ['']);
        }
    }, [isOpen, initialVersions]);

    const handleVersionChange = (index: number, value: string) => {
        const newVersions = [...versions];
        newVersions[index] = value;
        setVersions(newVersions);
    };

    const addVersionField = () => {
        setVersions([...versions, '']);
    };

    const removeVersionField = (index: number) => {
        if (versions.length > 1) {
            setVersions(versions.filter((_, i) => i !== index));
        }
    };

    const handleSave = () => {
        const filteredVersions = versions.map(v => v.trim()).filter(Boolean);
        if (filteredVersions.length > 0) {
            onSave(filteredVersions);
            onOpenChange(false);
        } else {
            // Or show a toast message
            alert('Please provide at least one version.');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add/Edit Textual Versions</DialogTitle>
                    <DialogDescription>
                        Provide the different readings for the selected text. The first entry will be the default.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    {versions.map((version, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <Label htmlFor={`version-${index}`} className="text-xs text-muted-foreground w-16">Ver. {index + 1}</Label>
                            <Input
                                id={`version-${index}`}
                                value={version}
                                onChange={(e) => handleVersionChange(index, e.target.value)}
                                placeholder={`Version ${index + 1}`}
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeVersionField(index)} disabled={versions.length <= 1}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addVersionField}>
                        <Plus className="mr-2 h-4 w-4" /> Add Version
                    </Button>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={handleSave}>Save Versions</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
