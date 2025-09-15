

import React from 'react';
import './loading-animation.css';
import { VaikhariLogo } from '../icons';

export function LoadingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
        <div className="book-loader-container">
            <div className="spine"></div>
            <div className="page" style={{ '--page-num': 1 } as React.CSSProperties}></div>
            <div className="page" style={{ '--page-num': 2 } as React.CSSProperties}></div>
            <div className="page" style={{ '--page-num': 3 } as React.CSSProperties}></div>
            <div className="page" style={{ '--page-num': 4 } as React.CSSProperties}></div>
            <div className="page static right"></div>
            <div className="page static left"></div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
            <VaikhariLogo className="h-6 w-6" />
            <p className="font-semibold tracking-widest text-lg">VAIKHARI</p>
        </div>
    </div>
  );
}

