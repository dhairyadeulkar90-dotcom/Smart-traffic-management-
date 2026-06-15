import React from 'react';
import { Direction, LightState } from '../types';

interface ControlsPanelProps {
  id: string;
  isAdaptive: boolean;
  onToggleAdaptive: () => void;
  isManual: boolean;
  onToggleManual: () => void;
  arrivalRate: number;
  onArrivalRateChange: (val: number) => void;
  laneStates: Array<{ name: Direction; light: LightState }>;
  manualDurations: Record<Direction, number>;
  onManualDurationChange: (dir: Direction, val: number) => void;
  onTriggerManualGo: (dir: Direction) => void;
  onTriggerAllRed: () => void;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  id,
  isAdaptive,
  onToggleAdaptive,
  isManual,
  onToggleManual,
  arrivalRate,
  onArrivalRateChange,
  laneStates,
  manualDurations,
  onManualDurationChange,
  onTriggerManualGo,
  onTriggerAllRed,
}) => {
  return (
    <div id={id} className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg">
      {/* Controls Master Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h4 className="font-display font-bold text-sm uppercase tracking-wider text-slate-100 flex items-center gap-2">
            Controls
          </h4>
        </div>
        <button
          onClick={onToggleAdaptive}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold font-sans tracking-wide transition-all ${
            isAdaptive
              ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold focus:ring-2 focus:ring-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          Adaptive {isAdaptive ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Arrival Rate Slider */}
      <div className="mt-4">
        <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
          <span className="text-slate-300">Vehicle arrival rate</span>
          <span className="text-cyan-400 font-mono">{arrivalRate}%</span>
        </div>
        <div className="relative flex items-center">
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={arrivalRate}
            onChange={(e) => onArrivalRateChange(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition"
          />
        </div>
        {/* Arrival status indicator line */}
        <div className="w-full bg-slate-950 h-1 rounded-full mt-2 overflow-hidden">
          <div
            className="bg-cyan-500 h-full rounded-full transition-all duration-300 shadow-[0_0_6px_rgba(6,182,212,0.5)]"
            style={{ width: `${arrivalRate}%` }}
          />
        </div>
      </div>

      {/* Manual Signal Control Subsection */}
      <div className="mt-6 pt-5 border-t border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h5 className="font-sans font-bold text-sm text-slate-200">Manual signal control</h5>
          </div>
          <button
            onClick={onToggleManual}
            className={`px-3 py-1 rounded-md text-[11px] font-bold font-mono tracking-wider transition-all uppercase ${
              isManual
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            Manual {isManual ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* 4 Lanes Override Grids */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {laneStates.map((lane) => {
            const isGreen = lane.light === 'green' || lane.light === 'yellow';
            // Find current duration config
            const currentSeconds = manualDurations[lane.name] || 15;

            return (
              <div
                key={lane.name}
                className={`bg-slate-900/60 p-3 rounded-lg border flex flex-col justify-between ${
                  isManual
                    ? 'border-slate-800 hover:border-slate-700'
                    : 'border-slate-900 opacity-60 pointer-events-none'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-200">{lane.name}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isGreen
                        ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                        : 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]'
                    }`}
                  />
                </div>

                <div className="flex items-center bg-slate-950 rounded border border-slate-800 mb-2 px-2 py-1">
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={currentSeconds}
                    disabled={!isManual}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        onManualDurationChange(lane.name, Math.max(5, Math.min(60, val)));
                      }
                    }}
                    className="w-full bg-transparent border-none text-slate-100 font-mono text-xs focus:ring-0 text-center outline-none"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">s</span>
                </div>

                <button
                  disabled={!isManual}
                  onClick={() => onTriggerManualGo(lane.name)}
                  className={`w-full py-1 rounded text-[11px] font-bold font-sans transition-all ${
                    isManual
                      ? isGreen
                        ? 'bg-slate-800 text-emerald-400 border border-emerald-500/10 cursor-not-allowed'
                        : 'bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 border border-slate-700/50'
                      : 'bg-slate-950 text-slate-600 border border-transparent'
                  }`}
                >
                  {isGreen ? 'Active' : `Go ${currentSeconds}s`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Emergency Stop All Red Button */}
        <div className="mt-4">
          <button
            onClick={onTriggerAllRed}
            disabled={!isManual}
            className={`w-full py-2 rounded-lg text-xs font-bold tracking-wider font-sans uppercase border transition-all ${
              isManual
                ? 'bg-rose-950/40 hover:bg-rose-950/70 text-rose-400 border-rose-500/20 active:scale-[0.99]'
                : 'bg-slate-950 text-slate-600 border-transparent cursor-not-allowed'
            }`}
          >
            All Red (stop all)
          </button>
        </div>
      </div>
    </div>
  );
};
