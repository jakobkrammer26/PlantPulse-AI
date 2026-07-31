import React from 'react';

export const PlantPulseLogo: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]"
      >
        {/* Background glow circle */}
        <circle cx="50" cy="50" r="45" fill="url(#pulseGrad)" fillOpacity="0.15" stroke="url(#strokeGrad)" strokeWidth="3" />
        
        {/* Plant leaf shape */}
        <path
          d="M50 18C30 32 25 55 35 75C45 90 60 88 68 76C78 60 72 32 50 18Z"
          fill="url(#leafGrad)"
        />
        
        {/* Leaf vein */}
        <path
          d="M50 18 C 48 40, 52 60, 50 82"
          stroke="#064e3b"
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        {/* Pulse / Electro cardiogram wave overlay */}
        <path
          d="M18 55 H34 L40 42 L46 68 L52 32 L58 60 L64 50 L68 55 H82"
          stroke="#6ee7b7"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-pulse"
        />

        {/* Water drop accent */}
        <path
          d="M72 30 C 72 30, 77 38, 77 41 C 77 44, 75 46, 72 46 C 69 46, 67 44, 67 41 C 67 38, 72 30, 72 30 Z"
          fill="#38bdf8"
        />

        <defs>
          <radialGradient id="pulseGrad" cx="50" cy="50" r="45" gradientUnits="userSpaceOnUse">
            <stop stopColor="#10b981" />
            <stop offset="1" stopColor="#022c22" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="strokeGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34d399" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="leafGrad" x1="25" y1="18" x2="75" y2="88" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34d399" />
            <stop offset="1" stopColor="#047857" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
