export interface Vector2 {
  x: number;
  y: number;
}

export type Modality = 'spatial' | 'color' | 'audio' | 'shape';

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

const jitter = (val: number, range: number, delta: number, min: number = 0, max: number = 1) => {
  const shift = (Math.random() - 0.5) * 2 * range * delta;
  return Math.max(min, Math.min(max, val + shift));
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

export function generateNextStimulus(
  history: Stimulus[],
  currentN: number,
  deltas: Record<Modality, number>,
  activeModalities: Modality[]
): { stimulus: Stimulus } {
  const target = history.length >= currentN ? history[history.length - currentN] : null;
  const random = generateRandomStimulus();

  // Probability of target match per modality
  const P_TARGET = 0.25;
  // Probability of lure per modality
  const P_LURE = 0.20;

  const nextStimulus: Stimulus = { ...random };

  if (target) {
    // Spatial
    if (activeModalities.includes('spatial')) {
      const rSpatial = Math.random();
      if (rSpatial < P_TARGET) {
        nextStimulus.spatial = { ...target.spatial };
      } else if (rSpatial < P_TARGET + P_LURE) {
        nextStimulus.spatial = {
          x: jitter(target.spatial.x, 0.2, deltas.spatial, 0.1, 0.9),
          y: jitter(target.spatial.y, 0.2, deltas.spatial, 0.1, 0.9),
        };
      }
    }

    // Color
    if (activeModalities.includes('color')) {
      const rColor = Math.random();
      if (rColor < P_TARGET) {
        nextStimulus.color = target.color;
      } else if (rColor < P_TARGET + P_LURE) {
        nextStimulus.color = (target.color + (Math.random() - 0.5) * 2 * 30 * deltas.color + 360) % 360;
      }
    }

    // Audio
    if (activeModalities.includes('audio')) {
      const rAudio = Math.random();
      if (rAudio < P_TARGET) {
        nextStimulus.audio = target.audio;
      } else if (rAudio < P_TARGET + P_LURE) {
        nextStimulus.audio = target.audio + (Math.random() - 0.5) * 2 * 50 * deltas.audio;
      }
    }

    // Shape
    if (activeModalities.includes('shape')) {
      const rShape = Math.random();
      if (rShape < P_TARGET) {
        nextStimulus.shape = target.shape.map(v => ({ ...v }));
      } else if (rShape < P_TARGET + P_LURE) {
        nextStimulus.shape = target.shape.map(v => ({
          x: jitter(v.x, 0.1, deltas.shape, 0.1, 0.9),
          y: jitter(v.y, 0.1, deltas.shape, 0.1, 0.9),
        }));
      }
    }
  }

  return { stimulus: nextStimulus };
}
