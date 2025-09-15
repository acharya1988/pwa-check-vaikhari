
'use client';

import React from 'react';
import './profile-progress.css';
import { Check } from 'lucide-react';

interface ProfileProgressProps {
  percent: number;
}

export function ProfileCompletionCircle({ percent }: ProfileProgressProps) {
  const radius = 18; // 40 (viewBox/2) - 2 (stroke-width/2)
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="progress-summary-profile-circle" data-progress={percent}>
      <svg width="40" height="40" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" className="progress-circle">
        <circle id="background-circle" cx="20" cy="20" r={radius} />
        <circle
          id="foreground-circle"
          cx="20"
          cy="20"
          r={radius}
          transform="rotate(-90 20 20)"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      {percent < 100 ? (
        <span className="progress-summary-profile-percent">{percent}%</span>
      ) : (
        <div className="progress-summary-profile-completed-icon">
          <Check className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}
