"use client";

import { Vector2 } from '@/lib/engine';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

interface StimulusDisplayProps {
  spatial: Vector2;
  color: number; // Hue
  shape: Vector2[];
  visible: boolean;
}

export const StimulusDisplay = ({ spatial, color, shape, visible }: StimulusDisplayProps) => {
  // Convert shape vertices to SVG polygon points string
  // Using polygon instead of path for better browser compatibility
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
      <AnimatePresence mode="wait">
        {visible && (
          <motion.div
            key="stimulus"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              left: `${safeX * 100}%`,
              top: `${safeY * 100}%`,
              transform: 'translate(-50%, -50%)',
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
                style={{ transition: 'fill 0.1s ease-out' }}
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
      
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
