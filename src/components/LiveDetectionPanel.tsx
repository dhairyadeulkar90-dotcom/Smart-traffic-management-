import React, { useState, useEffect } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import { Direction } from '../types';

interface LiveDetectionPanelProps {
  id: string;
  activeCamera: Direction;
  onSelectCamera: (dir: Direction) => void;
  laneVehicles: Record<Direction, number>;
  cameraImages: Record<Direction, string>;
  uploadedVideoUrl?: string | null;
  onUploadVideo: (url: string | null) => void;
}

interface BoundingBox {
  id: number;
  label: string;
  confidence: number;
  x: number; // percentage from left
  y: number; // percentage from top
  width: number; // percentage width
  height: number; // percentage height
  color: string;
}

export const LiveDetectionPanel: React.FC<LiveDetectionPanelProps> = ({
  id,
  activeCamera,
  onSelectCamera,
  laneVehicles,
  cameraImages,
  uploadedVideoUrl,
  onUploadVideo,
}) => {
  const [jitter, setJitter] = useState({ x: 0, y: 0 });
  const confidenceFilter = 0.75;

  // Generate bounding boxes based on direction and actual vehicle count
  const getSimulatedBoxes = (dir: Direction, count: number): BoundingBox[] => {
    // Generate a fixed deterministic-looking distribution based on vehicle count
    const vehicleTypes = ['sedan', 'suv', 'truck', 'van', 'taxi', 'motorcycle'];
    const colors = [
      'border-emerald-500 text-emerald-400 bg-emerald-500/10',
      'border-amber-500 text-amber-400 bg-amber-500/10',
      'border-cyan-500 text-cyan-400 bg-cyan-500/10',
    ];

    const boxes: BoundingBox[] = [];
    for (let i = 0; i < count; i++) {
      // Pick dynamic but predictable positioning
      let type = vehicleTypes[(i + dir.charCodeAt(0)) % vehicleTypes.length];
      const confidence = 0.82 + ((i * 3 + dir.charCodeAt(1)) % 17) / 100;

      // Make lines distribute nicely along paths
      let x = 15 + ((i * 12 + 7) % 65);
      let y = 20 + ((i * 14 + 11) % 60);
      let pWidth = 12 + ((i * 3) % 6);
      let pHeight = 10 + ((i * 2) % 6);

      // Adjust positions a bit specifically for different lane aesthetics
      if (dir === 'North') {
        // Precise custom tracking coordinates fitted to the Highway 401 Toronto image
        const northCoords = [
          { x: 52, y: 84, w: 22, h: 14, type: 'sedan' }, // Foreground white sedan
          { x: 86, y: 70, w: 13, h: 12, type: 'suv' },   // Foreground right dark SUV
          { x: 39, y: 64, w: 15, h: 10, type: 'sedan' }, // Midground center silver sedan
          { x: 2, y: 65, w: 16, h: 10, type: 'sedan' },  // Midground left red sedan
          { x: 28, y: 57, w: 13, h: 10, type: 'suv' },   // Midground left dark SUV
          { x: 60, y: 52, w: 11, h: 8, type: 'sedan' },   // Midground right blue sedan
          { x: 47, y: 47, w: 10, h: 8, type: 'suv' },    // Midground center silver SUV
          { x: 28, y: 44, w: 12, h: 11, type: 'truck' },  // Upper midground white truck
          { x: 88, y: 38, w: 11, h: 12, type: 'truck' },  // Upper right cement truck
          { x: 75, y: 44, w: 8, h: 6, type: 'sedan' },   // Upper right black car
          { x: 62, y: 44, w: 8, h: 6, type: 'suv' },     // Upper right dark SUV
          { x: 68, y: 39, w: 8, h: 6, type: 'sedan' },   // Upper center white car
          { x: 50, y: 39, w: 10, h: 10, type: 'truck' },  // Farther up van/truck
          { x: 54, y: 34, w: 6, h: 5, type: 'sedan' },   // Tiny background car
          { x: 8, y: 40, w: 8, h: 6, type: 'sedan' },    // Left far lanes
        ];
        const coord = northCoords[i % northCoords.length];
        x = coord.x;
        y = coord.y;
        pWidth = coord.w;
        pHeight = coord.h;
        type = coord.type;
      } else if (dir === 'South') {
        // Precise custom tracking coordinates fitted to the Highway 401 Toronto image
        const southCoords = [
          { x: 52, y: 84, w: 22, h: 14, type: 'sedan' }, // Foreground white sedan
          { x: 86, y: 70, w: 13, h: 12, type: 'suv' },   // Foreground right dark SUV
          { x: 39, y: 64, w: 15, h: 10, type: 'sedan' }, // Midground center silver sedan
          { x: 2, y: 65, w: 16, h: 10, type: 'sedan' },  // Midground left red sedan
          { x: 28, y: 57, w: 13, h: 10, type: 'suv' },   // Midground left dark SUV
          { x: 60, y: 52, w: 11, h: 8, type: 'sedan' },   // Midground right blue sedan
          { x: 47, y: 47, w: 10, h: 8, type: 'suv' },    // Midground center silver SUV
          { x: 28, y: 44, w: 12, h: 11, type: 'truck' },  // Upper midground white truck
          { x: 88, y: 38, w: 11, h: 12, type: 'truck' },  // Upper right cement truck
          { x: 75, y: 44, w: 8, h: 6, type: 'sedan' },   // Upper right black car
          { x: 62, y: 44, w: 8, h: 6, type: 'suv' },     // Upper right dark SUV
          { x: 68, y: 39, w: 8, h: 6, type: 'sedan' },   // Upper center white car
          { x: 50, y: 39, w: 10, h: 10, type: 'truck' },  // Farther up van/truck
          { x: 54, y: 34, w: 6, h: 5, type: 'sedan' },   // Tiny background car
          { x: 8, y: 40, w: 8, h: 6, type: 'sedan' },    // Left far lanes
        ];
        const coord = southCoords[i % southCoords.length];
        x = coord.x;
        y = coord.y;
        pWidth = coord.w;
        pHeight = coord.h;
        type = coord.type;
      } else if (dir === 'East') {
        // Bridge long view
        x = 15 + ((i * 13) % 70);
        y = 30 + ((i * 9) % 45);
        pWidth = 10 + (i % 4);
        pHeight = 8 + (i % 4);
      } else {
        // West multi flyover
        x = 25 + ((i * 11) % 60);
        y = 15 + ((i * 13) % 65);
        pWidth = 12;
        pHeight = 9;
      }

      boxes.push({
        id: i,
        label: type,
        confidence,
        x,
        y,
        width: pWidth,
        height: pHeight,
        color: colors[i % colors.length],
      });
    }

    return boxes.filter(box => box.confidence >= confidenceFilter);
  };

  const activeBoxes = getSimulatedBoxes(activeCamera, laneVehicles[activeCamera]);

  // Jitter effect representing tracking updates on timer
  useEffect(() => {
    const jitterInterval = setInterval(() => {
      setJitter({
        x: (Math.random() - 0.5) * 0.4,
        y: (Math.random() - 0.5) * 0.4,
      });
    }, 700);

    return () => clearInterval(jitterInterval);
  }, []);

  return (
    <div id={id} className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
        <div>
          <h4 className="font-display font-bold text-sm uppercase tracking-wider text-slate-100 flex items-center gap-2">
            Live camera detection
          </h4>
        </div>

        {/* Direction Nav Selector and Video Action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Direction nav */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(['North', 'East', 'South', 'West'] as Direction[]).map((dir) => (
              <button
                key={dir}
                onClick={() => onSelectCamera(dir)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all font-sans ${
                  activeCamera === dir
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {dir}
              </button>
            ))}
          </div>

          {/* Upload video action */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-800/60 rounded-lg cursor-pointer transition-all duration-205 shadow-sm">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Video</span>
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = URL.createObjectURL(file);
                    onUploadVideo(url);
                  }
                }}
              />
            </label>
            
            {uploadedVideoUrl && (
              <button
                onClick={() => onUploadVideo(null)}
                className="p-1 px-2 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-900/60 transition-all cursor-pointer"
                title="Remove Custom Feed"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Single Layout with full-width video view */}
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 group shadow-md select-none">
        {/* Main surveillance image / video */}
        {uploadedVideoUrl ? (
          <video
            src={uploadedVideoUrl}
            className="w-full h-full object-cover grayscale-[15%] group-hover:grayscale-0 transition-all duration-300"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img
            src={cameraImages[activeCamera]}
            alt={`Live feeds detection stream ${activeCamera}`}
            className="w-full h-full object-cover grayscale-[15%] group-hover:grayscale-0 transition-all duration-300"
            referrerPolicy="no-referrer"
          />
        )}

        {/* SVG/HTML overlay of tracking boxes */}
        <div className="absolute inset-0 pointer-events-none">
          {activeBoxes.map((box) => {
            // Add jitter to coordinate percentages
            const currentX = box.x + jitter.x;
            const currentY = box.y + jitter.y;

            return (
              <div
                key={box.id}
                className={`absolute border-2 rounded transition-all duration-500 flex flex-col justify-start leading-none ${box.color}`}
                style={{
                  left: `${currentX}%`,
                  top: `${currentY}%`,
                  width: `${box.width}%`,
                  height: `${box.height}%`,
                }}
              >
                {/* Label tag above box */}
                <span className="absolute -top-4 left-0 bg-slate-950/90 text-[8px] font-mono font-bold tracking-wide py-0.5 px-1 rounded uppercase flex items-center gap-1 border border-slate-800">
                  <span className="w-1 h-1 bg-emerald-400 rounded-full inline-block" />
                  {box.label} {(box.confidence * 100).toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>

        {/* HUD Graphics Overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 pointer-events-none">
          <span className="bg-red-500 text-white font-bold font-mono text-[9px] px-1.5 py-0.5 rounded tracking-wide animate-pulse flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full inline-block" />
            LIVE · {activeCamera.toUpperCase()}
          </span>
          <span className="bg-slate-950/80 backdrop-blur-sm text-slate-300 font-mono text-[9px] px-1.5 py-0.5 rounded border border-slate-800">
            {laneVehicles[activeCamera]} vehicles
          </span>
        </div>

        {/* HUD Tech Metrics right */}
        <div className="absolute top-3 right-3 text-right font-mono text-[9px] text-emerald-400 pointer-events-none bg-slate-950/70 backdrop-blur-sm p-1.5 rounded border border-slate-800/40 space-y-0.5">
          <div>FPS: 29.97</div>
          <div>RES: 1920x1080</div>
          <div>EDGE_NODE: #8ECA</div>
        </div>

        {/* CCTV grid overlays */}
        <div className="absolute inset-x-0 top-1/2 border-t border-slate-100/5 pointer-events-none" />
        <div className="absolute inset-y-0 left-1/2 border-l border-slate-100/5 pointer-events-none" />
        <div className="absolute inset-4 border border-slate-100/5 rounded pointer-events-none" />
      </div>
    </div>
  );
};
