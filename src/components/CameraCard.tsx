import React from 'react';
import { Direction, LightState } from '../types';

interface CameraCardProps {
  id: string;
  laneName: Direction;
  lightState: LightState;
  vehiclesCount: number;
  duration: number;
  imageUrl: string;
  videoUrl?: string | null;
  isActiveSelection: boolean;
  onSelect: () => void;
}

export const CameraCard: React.FC<CameraCardProps> = ({
  id,
  laneName,
  lightState,
  vehiclesCount,
  duration,
  imageUrl,
  videoUrl,
  isActiveSelection,
  onSelect,
}) => {
  const getLightDetails = (state: LightState) => {
    switch (state) {
      case 'green':
        return {
          text: 'GREEN',
          bgClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          dotClass: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse',
        };
      case 'yellow':
        return {
          text: 'YELLOW',
          bgClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          dotClass: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse',
        };
      case 'red':
      default:
        return {
          text: 'RED',
          bgClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          dotClass: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]',
        };
    }
  };

  const light = getLightDetails(lightState);

  return (
    <div
      id={id}
      onClick={onSelect}
      className={`relative h-44 rounded-xl overflow-hidden border cursor-pointer group transition-all duration-300 ${
        isActiveSelection
          ? 'border-cyan-500 ring-2 ring-cyan-500/10 scale-[1.01] shadow-cyan-950/20 shadow-lg'
          : 'border-slate-800 hover:border-slate-700 hover:shadow-md'
      }`}
    >
      {/* Background Image/Video with dimming overlay */}
      {videoUrl ? (
        <video
          src={videoUrl}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <img
          src={imageUrl}
          alt={`${laneName} approach camera`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-slate-950/60 transition-opacity" />

      {/* Camera Name overlay - top left */}
      <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded text-[11px] font-medium text-slate-200 border border-slate-700/30 flex items-center gap-1.5 font-sans">
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
        {laneName} · CAM
      </div>

      {/* Stats - top right badges */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        {lightState !== 'red' && (
          <span className="bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded text-[11px] min-w-[24px] text-center font-mono">
            {duration}s
          </span>
        )}
        <span className="bg-slate-950/85 backdrop-blur-md text-slate-300 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-705/30 font-mono">
          {vehiclesCount} veh
        </span>
      </div>

      {/* Signal Status - bottom left */}
      <div className="absolute bottom-3 left-3">
        <div className={`px-2.5 py-1 rounded border flex items-center gap-2 text-[10px] font-bold tracking-wider font-sans uppercase transition-all ${light.bgClass}`}>
          <span className={`w-2 h-2 rounded-full ${light.dotClass}`} />
          {light.text}
        </div>
      </div>

      {/* Live Frame Corners Indicator (aesthetic only) */}
      <div className="absolute inset-2 border border-emerald-400/0 group-hover:border-emerald-400/20 pointer-events-none rounded-lg transition-all" />
    </div>
  );
};
