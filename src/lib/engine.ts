export interface Vector2 {
  x: number;
  y: number;
}

export interface Stimulus {
  spatial: Vector2;
  color: number; // Hue (0-360)
  audio: number; // Frequency (Hz)
  shape: Vector2[]; // Vertices
}

export const INITIAL_STIMULUS: Stimulus = {
  spatial: { x: 0.5, y: 0.5 },
  color: 180,
  audio: 440,
  shape: [
    { x: 0.2, y: 0.2 },
    { x: 0.8, y: 0.2 },
    { x: 0.8, y: 0.8 },
    { x: 0.2, y: 0.8 },
  ],
};

export function generateRandomStimulus(): Stimulus {
  return {
    spatial: { 
      x: 0.1 + Math.random() * 0.8, 
      y: 0.1 + Math.random() * 0.8 
    },
    color: Math.random() * 360,
    audio: 220 + Math.random() * 660, // 220Hz to 880Hz
    shape: Array.from({ length: 4 }, () => ({
      x: 0.2 + Math.random() * 0.6,
      y: 0.2 + Math.random() * 0.6,
    })),
  };
}

export function applyDelta(stimulus: Stimulus, delta: number): Stimulus {
  // delta is 0.0 (identical) to 1.0 (completely different)
  // Target: delta = 0.1 (nearly identical)
  
  const jitter = (val: number, range: number, min: number = 0, max: number = 1) => {
    const shift = (Math.random() - 0.5) * 2 * range * delta;
    return Math.max(min, Math.min(max, val + shift));
  };

  return {
    spatial: {
      x: jitter(stimulus.spatial.x, 0.2, 0.1, 0.9),
      y: jitter(stimulus.spatial.y, 0.2, 0.1, 0.9),
    },
    color: (stimulus.color + (Math.random() - 0.5) * 2 * 30 * delta + 360) % 360,
    audio: stimulus.audio + (Math.random() - 0.5) * 2 * 50 * delta,
    shape: stimulus.shape.map(v => ({
      x: jitter(v.x, 0.1, 0.1, 0.9),
      y: jitter(v.y, 0.1, 0.1, 0.9),
    })),
  };
}

export function generateNextStimulus(
  history: Stimulus[],
  currentN: number,
  similarityDelta: number
): { stimulus: Stimulus; isTarget: boolean; isLure: boolean } {
  const isTarget = Math.random() < 0.25; // 25% chance of N-match
  const isLure = !isTarget && Math.random() < 0.20; // 20% chance of lure

  if (isTarget && history.length >= currentN) {
    return {
      stimulus: history[history.length - currentN],
      isTarget: true,
      isLure: false,
    };
  } else if (isLure && history.length >= currentN) {
    // Create a stimulus that is ALMOST the target
    const target = history[history.length - currentN];
    return {
      stimulus: applyDelta(target, similarityDelta),
      isTarget: false,
      isLure: true,
    };
  } else {
    return {
      stimulus: generateRandomStimulus(),
      isTarget: false,
      isLure: false,
    };
  }
}
