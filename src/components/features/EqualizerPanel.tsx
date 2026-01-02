import { useState } from 'react';
import { X, Sliders, RotateCcw } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';

interface EqualizerPanelProps {
  onClose: () => void;
}

const PRESETS = {
  flat: { bass: 0, mid: 0, treble: 0 },
  bass_boost: { bass: 8, mid: 0, treble: -2 },
  treble_boost: { bass: -2, mid: 0, treble: 8 },
  vocal: { bass: -3, mid: 6, treble: 2 },
  rock: { bass: 6, mid: -2, treble: 5 },
  pop: { bass: 3, mid: 2, treble: 4 },
  jazz: { bass: 4, mid: 3, treble: 3 },
  classical: { bass: 4, mid: 2, treble: 5 },
  electronic: { bass: 7, mid: -1, treble: 6 },
  hip_hop: { bass: 8, mid: 1, treble: 3 },
};

export default function EqualizerPanel({ onClose }: EqualizerPanelProps) {
  const { equalizer, setEqualizer } = usePlayerStore();
  const [selectedPreset, setSelectedPreset] = useState('flat');
  
  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    setEqualizer({
      preset,
      ...PRESETS[preset as keyof typeof PRESETS],
      enabled: true,
    });
  };
  
  const handleSliderChange = (type: 'bass' | 'mid' | 'treble', value: number) => {
    setEqualizer({
      [type]: value,
      preset: 'custom',
      enabled: true,
    });
    setSelectedPreset('custom');
  };
  
  const handleReset = () => {
    setEqualizer({
      enabled: false,
      preset: 'flat',
      bass: 0,
      mid: 0,
      treble: 0,
    });
    setSelectedPreset('flat');
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-background via-background/95 to-background/90 border border-white/10 rounded-2xl w-full max-w-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sliders className="w-6 h-6" />
            Equalizer
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Enable Toggle */}
        <div className="mb-6 flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
          <span className="font-semibold">Enable Equalizer</span>
          <button
            onClick={() => setEqualizer({ enabled: !equalizer.enabled })}
            className={`relative w-14 h-8 rounded-full transition-colors ${
              equalizer.enabled ? 'bg-primary' : 'bg-white/20'
            }`}
          >
            <div
              className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                equalizer.enabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        {/* Presets */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-3">Presets</p>
          <div className="grid grid-cols-3 gap-2">
            {Object.keys(PRESETS).map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetChange(preset)}
                disabled={!equalizer.enabled}
                className={`p-3 rounded-xl border transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedPreset === preset
                    ? 'border-primary bg-primary/20 text-primary font-semibold'
                    : 'border-white/10 hover:bg-white/5'
                }`}
              >
                {preset.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
        
        {/* Sliders */}
        <div className="space-y-6">
          {/* Bass */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Bass</span>
              <span className="text-sm text-muted-foreground">{equalizer.bass > 0 ? '+' : ''}{equalizer.bass} dB</span>
            </div>
            <input
              type="range"
              min="-10"
              max="10"
              value={equalizer.bass}
              onChange={(e) => handleSliderChange('bass', Number(e.target.value))}
              disabled={!equalizer.enabled}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          
          {/* Mid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Mid</span>
              <span className="text-sm text-muted-foreground">{equalizer.mid > 0 ? '+' : ''}{equalizer.mid} dB</span>
            </div>
            <input
              type="range"
              min="-10"
              max="10"
              value={equalizer.mid}
              onChange={(e) => handleSliderChange('mid', Number(e.target.value))}
              disabled={!equalizer.enabled}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          
          {/* Treble */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Treble</span>
              <span className="text-sm text-muted-foreground">{equalizer.treble > 0 ? '+' : ''}{equalizer.treble} dB</span>
            </div>
            <input
              type="range"
              min="-10"
              max="10"
              value={equalizer.treble}
              onChange={(e) => handleSliderChange('treble', Number(e.target.value))}
              disabled={!equalizer.enabled}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
        
        {/* Info */}
        <p className="mt-6 text-xs text-muted-foreground text-center">
          Adjust frequencies to customize your sound experience
        </p>
      </div>
    </div>
  );
}
