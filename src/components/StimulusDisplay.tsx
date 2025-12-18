"use client";

import { Vector2 } from '@/lib/engine';
import { motion } from 'framer-motion';

interface StimulusDisplayProps {
  spatial: Vector2;
  color: number; // Hue
  shape: Vector2[];
  visible: boolean;
}

export const StimulusDisplay = ({ spatial, color, shape, visible }: StimulusDisplayProps) => {
  // Convert shape vertices to SVG path string
  const pathData = shape
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${v.x * 100} ${v.y * 100}`)
    .join(' ') + ' Z';

  return (
    <div className="relative w-full h-full border border-gray-800 rounded-lg overflow-hidden bg-black/20 backdrop-blur-sm">
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          style={{
            position: 'absolute',
            left: `${spatial.x * 100}%`,
            top: `${spatial.y * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className="flex items-center justify-center"
        >
          <svg width="60" height="60" viewBox="0 0 100 100">
            <motion.path
              d={pathData}
              fill={`hsl(${color}, 70%, 50%)`}
              initial={false}
              animate={{ d: pathData }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />
          </svg>
        </motion.div>
      )}
      
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
