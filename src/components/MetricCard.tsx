import React from 'react';

interface MetricCardProps {
  id: string;
  title: string;
  value: string | number;
  subValue: string;
  subColorClass?: string;
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  id,
  title,
  value,
  subValue,
  subColorClass = 'text-slate-400',
  icon,
}) => {
  return (
    <div
      id={id}
      className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 flex items-center gap-4 hover:border-cyan-500/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.08)] transition-all duration-300 group"
    >
      {icon && (
        <div className="p-3 bg-slate-950/60 rounded-lg text-cyan-400 group-hover:bg-cyan-500/10 group-hover:text-cyan-300 transition-colors border border-slate-800/55">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase font-display">
          {title}
        </p>
        <h3 className="text-2xl font-bold font-sans text-slate-100 tracking-tight mt-1">
          {value}
        </h3>
        {subValue && (
          <p className={`text-xs mt-0.5 font-mono truncate ${subColorClass}`}>
            {subValue}
          </p>
        )}
      </div>
    </div>
  );
};
