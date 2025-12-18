"use client";

import { useEffect, useRef } from 'react';
import * as Tone from 'tone';

interface AudioEngineProps {
  frequency: number;
  play: boolean;
}

export const AudioEngine = ({ frequency, play }: AudioEngineProps) => {
  const oscRef = useRef<Tone.Oscillator | null>(null);
  const isPlayingRef = useRef(false);

  // Ensure frequency is valid
  const safeFrequency = typeof frequency === 'number' && !isNaN(frequency) && frequency > 0 
    ? Math.max(20, Math.min(20000, frequency)) 
    : 440;

  useEffect(() => {
    // Create oscillator on mount
    oscRef.current = new Tone.Oscillator(safeFrequency, "sine").toDestination();
    oscRef.current.volume.value = -10; // Reduce volume slightly
    
    return () => {
      oscRef.current?.dispose();
      oscRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (oscRef.current) {
      oscRef.current.frequency.value = safeFrequency;
    }
  }, [safeFrequency]);

  useEffect(() => {
    if (play && oscRef.current && !isPlayingRef.current) {
      isPlayingRef.current = true;
      try {
        oscRef.current.start();
        oscRef.current.stop("+0.5");
        // Reset playing state after the note finishes
        setTimeout(() => {
          isPlayingRef.current = false;
        }, 600);
      } catch (e) {
        console.error("Audio playback error:", e);
        isPlayingRef.current = false;
      }
    }
  }, [play]);

  return null;
};
