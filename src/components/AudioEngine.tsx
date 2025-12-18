"use client";

import { useEffect, useRef } from 'react';
import * as Tone from 'tone';

interface AudioEngineProps {
  frequency: number;
  play: boolean;
}

export const AudioEngine = ({ frequency, play }: AudioEngineProps) => {
  const osc = useRef<Tone.Oscillator | null>(null);

  useEffect(() => {
    osc.current = new Tone.Oscillator(frequency, "sine").toDestination();
    
    return () => {
      osc.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (osc.current) {
      osc.current.frequency.value = frequency;
    }
  }, [frequency]);

  useEffect(() => {
    if (play) {
      osc.current?.start().stop("+0.5");
    }
  }, [play]);

  return null;
};
