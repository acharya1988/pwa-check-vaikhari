"use client";
import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  action: () => Promise<any> | any;
  busyText?: string;
};

export default function ActionButton({ action, busyText = 'Working…', children, disabled, ...rest }: Props) {
  const [busy, setBusy] = React.useState(false);
  return (
    <button
      {...rest}
      disabled={disabled || busy}
      onClick={async (e) => {
        e.preventDefault();
        if (busy) return;
        try {
          setBusy(true);
          await action();
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? busyText : children}
    </button>
  );
}

