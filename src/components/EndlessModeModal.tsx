import React, { useState } from 'react';
import { Bot, CheckCircle, Loader2, Play, Sparkles, X } from 'lucide-react';
import { EnergyType, Level } from '../types/game';
import { LevelValidator } from '../engine/levelValidator';

interface EndlessModeModalProps {
  onStartEndlessLevel: (level: Level) => void;
  onClose: () => void;
}

export const EndlessModeModal: React.FC<EndlessModeModalProps> = ({
  onStartEndlessLevel,
  onClose,
}) => {
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyType>('aqua');
  const [difficulty, setDifficulty] = useState<number>(3);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStatusMessage('Querying Gemini AI for level layout...');

    let levelToPlay: Level | null = null;

    try {
      // Retry up to 3 times to get a verified solvable level from API
      for (let attempt = 1; attempt <= 3; attempt++) {
        setStatusMessage(`Generating AI level & validating solution path (Attempt ${attempt}/3)...`);
        const response = await fetch('/api/gemini/generate-level', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            theme: 'Cyberpunk Laboratory',
            difficulty,
            energyTypes: [selectedEnergy],
          }),
        });

        const data = await response.json();

        if (data.success && data.level) {
          const validation = LevelValidator.validateLevel(data.level);
          if (validation.isValid && validation.solutionPoints && validation.solutionPoints.length >= 2) {
            levelToPlay = {
              ...data.level,
              hintData: {
                ...data.level.hintData,
                guideLinePoints: validation.solutionPoints,
              },
            };
            break; // Solvable level found with verified blueprint!
          }
          // Unsolvable level layout rejected! Loop to retry generation.
        }
      }
      if (!levelToPlay) {
        throw new Error('Could not generate a verified solvable AI level in 3 attempts');
      }
    } catch (err: any) {
      console.warn('API level generation fallback:', err);
      setStatusMessage('Creating local AI-validated blueprint level...');

      // Procedural level generation strictly verified by internal physics solver engine
      for (let attempt = 0; attempt < 8; attempt++) {
        const spawnX = 300 + Math.floor(Math.random() * 200);
        const containerX = 300 + Math.floor(Math.random() * 200);

        const candidateLevel: Level = {
          id: `endless_${Date.now()}_${attempt}`,
          worldId: 1,
          levelNumber: 777,
          title: `Endless ${selectedEnergy.toUpperCase()} Trial #${attempt + 1}`,
          theme: 'Cyberpunk Laboratory',
          description: 'Procedural Endless AI Level with verified solution path.',
          energyType: selectedEnergy,
          dropCount: 25,
          dropSpawn: { x: spawnX, y: 90 },
          containers: [
            { id: 'ec1', x: containerX, y: 500, width: 90, height: 110, targetCount: 18, requiredType: selectedEnergy },
          ],
          obstacles: [
            { id: 'e_obs1', type: 'ramp', x: (spawnX + containerX) / 2 - 20, y: 280, width: 160, height: 20, rotation: 0.2, isStatic: true, color: '#334155' },
          ],
          parLineLength: 420,
          hintText: 'Follow the glowing blueprint guide line to solve the puzzle.',
        };

        const val = LevelValidator.validateLevel(candidateLevel);
        if (val.isValid && val.solutionPoints && val.solutionPoints.length >= 2) {
          candidateLevel.hintData = {
            guideLinePoints: val.solutionPoints,
          };
          levelToPlay = candidateLevel;
          break;
        }
      }
    }

    setTimeout(() => {
      setIsGenerating(false);
      if (levelToPlay) {
        onStartEndlessLevel(levelToPlay);
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl relative text-slate-100 animate-scale-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
            <Bot className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-100">Endless AI Level Generator</h3>
            <p className="text-xs text-slate-400">Infinite levels verified by automated physics solver</p>
          </div>
        </div>

        {/* Energy Type Selector */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Select Energy Type
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['aqua', 'plasma', 'cryo', 'electric', 'nature', 'gravity', 'light', 'shadow'] as EnergyType[]).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedEnergy(type)}
                className={`py-2 rounded-xl text-xs font-bold capitalize border transition-all cursor-pointer ${
                  selectedEnergy === type
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Slider */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
            <span className="uppercase tracking-wider">Difficulty Level</span>
            <span className="text-cyan-400">{difficulty} / 5 Stars</span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* Status Indicator */}
        {isGenerating && (
          <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-2xl border border-cyan-500/30 mb-6 text-xs text-cyan-300 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50"
        >
          {isGenerating ? (
            <span>Generating & Validating...</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>Generate Endless Level</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
