"use client";

import { Vector2 } from '@/lib/engine';
import { useMemo } from 'react';

interface StimulusDisplayProps {
  spatial: Vector2;
  color: number; // Hue
  shape: Vector2[];
  visible: boolean;
}

export const StimulusDisplay = ({ spatial, color, shape, visible }: StimulusDisplayProps) => {
  // Convert shape vertices to SVG polygon points string
  const points = useMemo(() => {
    if (!shape || shape.length === 0) {
      // Default square if shape is invalid
      return "20,20 80,20 80,80 20,80";
    }
    return shape.map(v => `${v.x * 100},${v.y * 100}`).join(' ');
  }, [shape]);

  // Ensure spatial coordinates are valid
  const safeX = typeof spatial?.x === 'number' && !isNaN(spatial.x) ? spatial.x : 0.5;
  const safeY = typeof spatial?.y === 'number' && !isNaN(spatial.y) ? spatial.y : 0.5;
  
  // Ensure color is valid
  const safeColor = typeof color === 'number' && !isNaN(color) ? color : 180;

  return (
    <div className="relative w-full h-full border border-gray-800 rounded-lg overflow-hidden bg-black/20 backdrop-blur-sm">
      {/* Stimulus - using CSS transitions instead of framer-motion for reliability */}
      <div
        style={{
          position: 'absolute',
          left: `${safeX * 100}%`,
          top: `${safeY * 100}%`,
          transform: 'translate(-50%, -50%)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.15s ease-out',
          pointerEvents: visible ? 'auto' : 'none',
        }}
        className="flex items-center justify-center"
      >
        <svg 
          width="60" 
          height="60" 
          viewBox="0 0 100 100"
          style={{ overflow: 'visible' }}
        >
          <polygon
            points={points}
            fill={`hsl(${safeColor}, 70%, 50%)`}
          />
        </svg>
      </div>
      
      {/* Grid lines for reference (very faint as per "High Resolution" theme) */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="w-full h-full grid grid-cols-10 grid-rows-10">
          {Array.from({ length: 100 }).map((_, i) => (
            <div key={i} className="border-[0.5px] border-white/20" />
          ))}
        </div>
      </div>
    </div>
  );
};
