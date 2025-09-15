

'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { Citation, Quote, UserProfile } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tag } from 'lucide-react';

export const SuggestionList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];

    if (item) {
      props.command({ refId: item.refId });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  return React.createElement(
    Card,
    { className: 'p-2 shadow-xl' },
    React.createElement(
      CardContent,
      { className: 'p-0' },
      props.items.length
        ? props.items.map((item: Citation, index: number) =>
            React.createElement(
              'button',
              {
                className: `w-full text-left p-2 rounded-md hover:bg-muted ${
                  index === selectedIndex ? 'bg-muted' : ''
                }`,
                key: index,
                onClick: () => selectItem(index),
              },
              React.createElement('p', { className: 'font-bold' }, item.refId),
              React.createElement(
                'p',
                { className: 'text-sm text-muted-foreground' },
                `${item.source} - ${item.location}`
              ),
              React.createElement(
                'p',
                { className: 'text-sm font-headline truncate' },
                item.sanskrit
              )
            )
          )
        : React.createElement('div', { className: 'p-2' }, 'No results')
    )
  );
});

SuggestionList.displayName = 'SuggestionList';


export const QuoteSuggestionList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ quote: item.quote, author: item.author });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') { upHandler(); return true; }
      if (event.key === 'ArrowDown') { downHandler(); return true; }
      if (event.key === 'Enter') { enterHandler(); return true; }
      return false;
    },
  }));

  return (
    <Card className="p-2 shadow-xl">
      <CardContent className="p-0">
        {props.items.length ? (
          props.items.map((item: Quote, index: number) => (
            <button
              className={`w-full text-left p-2 rounded-md hover:bg-muted ${index === selectedIndex ? 'bg-muted' : ''}`}
              key={index}
              onClick={() => selectItem(index)}
            >
              <p className="font-bold">{item.title}</p>
              <p className="text-sm text-muted-foreground italic">"{item.quote.substring(0, 50)}..."</p>
              <p className="text-xs text-right text-muted-foreground">— {item.author}</p>
            </button>
          ))
        ) : (
          <div className="p-2">No results</div>
        )}
      </CardContent>
    </Card>
  );
});

QuoteSuggestionList.displayName = 'QuoteSuggestionList';


export const UserSuggestionList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: item.label });
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') { setSelectedIndex(prev => (prev + props.items.length - 1) % props.items.length); return true; }
      if (event.key === 'ArrowDown') { setSelectedIndex(prev => (prev + 1) % props.items.length); return true; }
      if (event.key === 'Enter') { selectItem(selectedIndex); return true; }
      return false;
    },
  }));

  useEffect(() => setSelectedIndex(0), [props.items]);

  return (
    <Card className="p-2 shadow-xl">
        <CardContent className="p-0 space-y-1">
            {props.items.length ? props.items.map((item: {id: string, label: string, avatar: string}, index: number) => (
                <button
                    className={`w-full text-left p-2 rounded-md hover:bg-muted flex items-center gap-2 ${index === selectedIndex ? 'bg-muted' : ''}`}
                    key={index}
                    onClick={() => selectItem(index)}
                >
                    <Avatar className="h-6 w-6"><AvatarImage src={item.avatar} /><AvatarFallback>{item.label[0]}</AvatarFallback></Avatar>
                    <span className="font-medium text-sm">{item.label}</span>
                </button>
            )) : <div className="p-2">No results</div>}
        </CardContent>
    </Card>
  );
});
UserSuggestionList.displayName = 'UserSuggestionList';


export const TagSuggestionList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: item.label });
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') { setSelectedIndex(prev => (prev + props.items.length - 1) % props.items.length); return true; }
      if (event.key === 'ArrowDown') { setSelectedIndex(prev => (prev + 1) % props.items.length); return true; }
      if (event.key === 'Enter') { selectItem(selectedIndex); return true; }
      return false;
    },
  }));

  useEffect(() => setSelectedIndex(0), [props.items]);

  return (
     <Card className="p-2 shadow-xl">
        <CardContent className="p-0 space-y-1">
             {props.items.length ? props.items.map((item: {id: string, label: string}, index: number) => (
                <button
                    className={`w-full text-left p-2 rounded-md hover:bg-muted flex items-center gap-2 ${index === selectedIndex ? 'bg-muted' : ''}`}
                    key={index}
                    onClick={() => selectItem(index)}
                >
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{item.label}</span>
                </button>
            )) : <div className="p-2">No results</div>}
        </CardContent>
    </Card>
  );
});
TagSuggestionList.displayName = 'TagSuggestionList';
