import React from 'react';
import { Direction, LaneState } from '../types';

interface ApproachLoadProps {
  id: string;
  lanes: LaneState[];
  activeDirection: Direction;
}

export const ApproachLoad: React.FC<ApproachLoadProps> = ({ id, lanes, activeDirection }) => {
  const getSeverity = (count: number) => {
    if (count === 0) return { label: 'Clear', textClass: 'text-slate-500', barClass: 'bg-emerald-500/20' };
    if (count < 5) return { label: 'Light', textClass: 'text-emerald-400', barClass: 'bg-emerald-500' };
    if (count <= 10) return { label: 'Moderate', textClass: 'text-amber-500', barClass: 'bg-amber-500' };
    return { label: 'Heavy', textClass: 'text-rose-500', barClass: 'bg-rose-500' };
  };

  return (
    <div id={id} className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg">
      <h4 className="font-display font-bold text-sm uppercase tracking-wider text-slate-100 mb-4">Approach load</h4>

      <div className="space-y-4">
        {lanes.map((lane) => {
          const percent = Math.min(100, (lane.vehicles / lane.maxVehicles) * 100);
          const severity = getSeverity(lane.vehicles);
          const isServing = lane.name === activeDirection && lane.light !== 'red';

          return (
            <div key={lane.name} className="space-y-1.5 p-3 hover:bg-slate-900/30 rounded-lg transition-colors border border-slate-800/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isServing
                        ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                        : 'bg-slate-600'
                    }`}
                  />
                  <span className="font-semibold text-xs text-slate-200">{lane.name}</span>
                  {isServing && (
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                      SERVING
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-slate-100">{lane.vehicles}</span>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider font-sans -mt-0.5 ${severity.textClass}`}>
                    {severity.label}
                  </p>
                </div>
              </div>

              {/* Progress bar background */}
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${severity.barClass}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
