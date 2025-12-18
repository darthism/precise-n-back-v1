"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Stimulus, generateNextStimulus, INITIAL_STIMULUS, generateRandomStimulus, Modality } from '@/lib/engine';
import { StimulusDisplay } from './StimulusDisplay';
import { AudioEngine } from './AudioEngine';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import * as Tone from 'tone';
import { Brain, Settings, Play, RotateCcw, BarChart3, CheckCircle2, Square } from 'lucide-react';

const TRIAL_DURATION = 3000;
const STIMULUS_DURATION = 1000;
const STORAGE_KEY = 'neural-microscope-settings';

export const NBackGame = () => {
  // 1. Initial State from Local Storage
  const [isLoaded, setIsLoaded] = useState(false);
  const [n, setN] = useState(2);
  const [maxTrials, setMaxTrials] = useState(20);
  const [deltas, setDeltas] = useState<Record<Modality, number>>({
    spatial: 0.5, color: 0.5, audio: 0.5, shape: 0.5
  });
  const [activeModalities, setActiveModalities] = useState<Modality[]>(['spatial', 'audio', 'color', 'shape']);

  // Load settings on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.n) setN(parsed.n);
        if (parsed.maxTrials) setMaxTrials(parsed.maxTrials);
        if (parsed.deltas) setDeltas(parsed.deltas);
        if (parsed.activeModalities) setActiveModalities(parsed.activeModalities);
      } catch (e) {
        console.error("Failed to parse saved settings", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save settings on change
  useEffect(() => {
    if (!isLoaded) return;
    const settings = { n, maxTrials, deltas, activeModalities };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [n, maxTrials, deltas, activeModalities, isLoaded]);

  const [history, setHistory] = useState<Stimulus[]>([]);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [visible, setVisible] = useState(false);
  const [score, setScore] = useState({ hits: 0, misses: 0, falseAlarms: 0 });
  const [trialCount, setTrialCount] = useState(0);
  
  const responsesRef = useRef<Record<string, boolean>>({ spatial: false, color: false, audio: false, shape: false });
  const historyRef = useRef<Stimulus[]>([]);
  
  const [uiResponses, setUiResponses] = useState<Record<string, boolean>>({
    spatial: false, color: false, audio: false, shape: false,
  });

  const [feedback, setFeedback] = useState<Record<string, 'correct' | 'incorrect' | null>>({ 
    spatial: null, color: null, audio: null, shape: null 
  });

  const checkMatch = useCallback((modality: string, current: Stimulus, target: Stimulus) => {
    if (modality === 'spatial') return current.spatial.x === target.spatial.x && current.spatial.y === target.spatial.y;
    if (modality === 'color') return current.color === target.color;
    if (modality === 'audio') return current.audio === target.audio;
    if (modality === 'shape') return JSON.stringify(current.shape) === JSON.stringify(target.shape);
    return false;
  }, []);

  const handleResponse = useCallback((modality: Modality) => {
    if (gameState !== 'playing' || responsesRef.current[modality] || !activeModalities.includes(modality)) return;

    responsesRef.current[modality] = true;
    setUiResponses(prev => ({ ...prev, [modality]: true }));

    const currentHistory = historyRef.current;
    if (currentHistory.length > n) {
      const current = currentHistory[currentHistory.length - 1];
      const target = currentHistory[currentHistory.length - n - 1];
      const isMatch = checkMatch(modality, current, target);

      if (!isMatch) {
        setScore(prev => ({ ...prev, falseAlarms: prev.falseAlarms + 1 }));
        setFeedback(prev => ({ ...prev, [modality]: 'incorrect' }));
      } else {
        setScore(prev => ({ ...prev, hits: prev.hits + 1 }));
        setFeedback(prev => ({ ...prev, [modality]: 'correct' }));
      }
    }
  }, [gameState, n, checkMatch, activeModalities]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    if (trialCount >= maxTrials) {
      setGameState('finished');
      return;
    }

    const currentHistory = historyRef.current;
    if (currentHistory.length > n) {
      const lastTrialIdx = currentHistory.length - 1;
      const targetIdx = lastTrialIdx - n;
      const lastTrial = currentHistory[lastTrialIdx];
      const target = currentHistory[targetIdx];
      const lastResponses = responsesRef.current;

      activeModalities.forEach(m => {
        const isMatch = checkMatch(m, lastTrial, target);
        if (isMatch && !lastResponses[m]) {
          setScore(prev => ({ ...prev, misses: prev.misses + 1 }));
        }
      });
    }

    const { stimulus } = generateNextStimulus(currentHistory, n, deltas, activeModalities);
    const newHistory = [...currentHistory, stimulus];
    historyRef.current = newHistory;
    setHistory(newHistory);
    
    responsesRef.current = { spatial: false, color: false, audio: false, shape: false };
    setUiResponses({ spatial: false, color: false, audio: false, shape: false });
    setFeedback({ spatial: null, color: null, audio: null, shape: null });
    
    setVisible(true);

    const hideTimeout = setTimeout(() => setVisible(false), STIMULUS_DURATION);
    const trialTimeout = setTimeout(() => {
      setTrialCount(prev => prev + 1);
    }, TRIAL_DURATION);

    return () => {
      clearTimeout(hideTimeout);
      clearTimeout(trialTimeout);
    };
  }, [trialCount, gameState, n, deltas, activeModalities, maxTrials, checkMatch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      
      switch (e.key.toLowerCase()) {
        case 'a': handleResponse('spatial'); break;
        case 's': handleResponse('audio'); break;
        case 'd': handleResponse('color'); break;
        case 'f': handleResponse('shape'); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleResponse]);

  const toggleModality = (modality: Modality) => {
    if (gameState === 'playing') return;
    setActiveModalities(prev => 
      prev.includes(modality) 
        ? prev.filter(m => m !== modality)
        : [...prev, modality]
    );
  };

  const updateDelta = (modality: Modality, value: number) => {
    setDeltas(prev => ({ ...prev, [modality]: value }));
  };

  const startGame = async () => {
    if (activeModalities.length === 0) return;
    await Tone.start();
    setScore({ hits: 0, misses: 0, falseAlarms: 0 });
    setTrialCount(0);
    const initialHistory: Stimulus[] = [];
    for (let i = 0; i < n; i++) {
      initialHistory.push(generateRandomStimulus());
    }
    historyRef.current = initialHistory;
    setHistory(initialHistory);
    setGameState('playing');
  };

  const currentStimulus = history[history.length - 1];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-black text-white overflow-x-hidden">
      {/* Sidebar */}
      <aside className="w-full lg:w-80 lg:min-h-screen border-b lg:border-b-0 lg:border-r border-gray-800 p-6 flex flex-col gap-8 bg-black/50 backdrop-blur-md z-10 overflow-y-auto">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-blue-400" />
          <h1 className="text-xl font-bold tracking-tighter bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
            NEURAL MICROSCOPE
          </h1>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
            <Settings className="w-4 h-4" />
            CONFIGURATION
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs text-gray-500 uppercase tracking-wider">N-Back Level</label>
                <span className="text-xs font-mono text-blue-400">{n}</span>
              </div>
              <input 
                type="range" min="1" max="9" step="1"
                disabled={gameState === 'playing'}
                value={n} 
                onChange={e => setN(parseInt(e.target.value))}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs text-gray-500 uppercase tracking-wider">Trial Count</label>
                <span className="text-xs font-mono text-blue-400">{maxTrials}</span>
              </div>
              <input 
                type="range" min="10" max="100" step="5"
                disabled={gameState === 'playing'}
                value={maxTrials} 
                onChange={e => setMaxTrials(parseInt(e.target.value))}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div className="pt-4 border-t border-gray-800 space-y-4">
              <label className="text-xs text-gray-500 uppercase tracking-wider block">Modalities & Precision</label>
              {(['spatial', 'audio', 'color', 'shape'] as Modality[]).map(m => (
                <div key={m} className="space-y-3 p-3 rounded-lg bg-gray-900/30 border border-gray-800/50">
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => toggleModality(m)}
                      disabled={gameState === 'playing'}
                      className={`flex items-center gap-2 text-sm font-bold transition-colors ${
                        activeModalities.includes(m) ? 'text-blue-400' : 'text-gray-600'
                      }`}
                    >
                      <CheckCircle2 className={`w-4 h-4 ${activeModalities.includes(m) ? 'opacity-100' : 'opacity-20'}`} />
                      {m.toUpperCase()}
                    </button>
                    {activeModalities.includes(m) && (
                      <span className="text-[10px] font-mono text-gray-500">Δ {deltas[m].toFixed(2)}</span>
                    )}
                  </div>
                  {activeModalities.includes(m) && (
                    <input 
                      type="range" min="0.1" max="1.0" step="0.1"
                      disabled={gameState === 'playing'}
                      value={deltas[m]} 
                      onChange={e => updateDelta(m, parseFloat(e.target.value))}
                      className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-gray-800 space-y-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
            <BarChart3 className="w-4 h-4" />
            SESSION STATS
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800/50">
              <div className="text-[10px] text-gray-500 uppercase">Hits</div>
              <div className="text-xl font-mono text-green-400">{score.hits}</div>
            </div>
            <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800/50">
              <div className="text-[10px] text-gray-500 uppercase">Misses</div>
              <div className="text-xl font-mono text-red-400">{score.misses}</div>
            </div>
            <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800/50 col-span-2">
              <div className="text-[10px] text-gray-500 uppercase">False Alarms</div>
              <div className="text-xl font-mono text-yellow-400">{score.falseAlarms}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 gap-6 lg:gap-8 overflow-hidden">
        <div 
          className="w-full max-w-[500px] aspect-square relative shadow-2xl shadow-blue-500/10"
          style={{ 
            maxWidth: 'min(90vw, 500px, 70vh)',
            minWidth: '200px',
            minHeight: '200px'
          }}
        >
          <StimulusDisplay 
            spatial={currentStimulus?.spatial || INITIAL_STIMULUS.spatial}
            color={currentStimulus?.color || INITIAL_STIMULUS.color}
            shape={currentStimulus?.shape || INITIAL_STIMULUS.shape}
            visible={visible}
          />
          {currentStimulus && <AudioEngine frequency={currentStimulus.audio} play={visible} />}
        </div>

        {gameState === 'idle' && (
          <div className="text-center space-y-6 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Ready for integration?</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                You are about to process {activeModalities.length} high-precision data streams. 
                {activeModalities.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ')}. Focus on the {n}-back delta.
              </p>
            </div>
            <Button 
              onClick={startGame} 
              disabled={activeModalities.length === 0}
              className="w-full py-8 text-xl font-bold rounded-xl bg-blue-600 hover:bg-blue-500 transition-all hover:scale-[1.02] active:scale-[0.98] group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-6 h-6 mr-2 fill-current" />
              INITIATE SESSION
            </Button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="flex flex-col gap-4 w-full max-w-[min(90vw,500px)]">
            <div className={`grid gap-3 ${
              activeModalities.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
            }`}>
              {[
                { id: 'spatial', label: 'SPATIAL', key: 'A' },
                { id: 'audio', label: 'AUDIO', key: 'S' },
                { id: 'color', label: 'COLOR', key: 'D' },
                { id: 'shape', label: 'SHAPE', key: 'F' },
              ].filter(m => activeModalities.includes(m.id as Modality)).map((m) => {
                const modalityId = m.id as Modality;
                const status = feedback[modalityId];
                const isPressed = uiResponses[modalityId];
                
                let extraClasses = "";
                if (status === 'incorrect') {
                  extraClasses = "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] text-red-400 bg-red-500/10";
                } else if (isPressed) {
                  extraClasses = "border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] bg-blue-500/10";
                }

                return (
                  <Button 
                    key={m.id}
                    onClick={() => handleResponse(modalityId)}
                    variant="outline"
                    className={`h-16 lg:h-24 text-base lg:text-lg font-bold border-2 transition-all relative overflow-hidden active:scale-95 ${extraClasses}`}
                  >
                    <div className="flex flex-col items-center">
                      <span>{m.label}</span>
                      <span className="text-[10px] opacity-40 font-mono mt-1 hidden lg:block">PRESS {m.key}</span>
                    </div>
                  </Button>
                );
              })}
            </div>
            <Button 
              onClick={() => setGameState('finished')}
              variant="outline"
              className="h-10 text-sm font-medium border border-gray-700 text-gray-400 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-all"
            >
              <Square className="w-3 h-3 mr-2 fill-current" />
              STOP SESSION
            </Button>
          </div>
        )}

        {gameState === 'finished' && (
          <Card className="p-8 text-center bg-gray-900/80 backdrop-blur-xl border-gray-800 max-w-sm w-full animate-in zoom-in-95 duration-500">
            <h2 className="text-3xl font-black mb-6 italic tracking-tighter">SESSION COMPLETE</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-sm text-gray-500 uppercase">Accuracy</span>
                <span className="text-xl font-mono text-blue-400">
                  {Math.round((score.hits / Math.max(1, score.hits + score.misses)) * 100)}%
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500 uppercase">Precision</span>
                <span className="text-xl font-mono text-teal-400">
                  {Math.round((score.hits / Math.max(1, score.hits + score.falseAlarms)) * 100)}%
                </span>
              </div>
            </div>
            <Button onClick={() => setGameState('idle')} className="w-full py-4 font-bold bg-white text-black hover:bg-gray-200 rounded-lg transition-all flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" />
              RECONFIGURE
            </Button>
          </Card>
        )}

        <div className="w-full max-w-[min(90vw,500px)] mt-auto pt-8 lg:pt-0">
          <div className="flex justify-between text-[10px] font-mono text-gray-500 mb-2 uppercase tracking-widest">
            <span>Progress Vector</span>
            <span>{trialCount} / {maxTrials}</span>
          </div>
          <Progress value={(trialCount / maxTrials) * 100} className="h-1 bg-gray-900" />
        </div>
      </main>
    </div>
  );
};
