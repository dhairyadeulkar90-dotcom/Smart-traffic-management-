import { useState, useEffect, useRef } from 'react';
import {
  Car,
  Clock,
  RotateCw,
  Video,
  Activity,
  Sliders,
  Tv,
  AlertTriangle,
  Play,
  Pause,
  Layers,
  Network,
  Cpu,
} from 'lucide-react';
import { Direction, LaneState } from './types';
import { MetricCard } from './components/MetricCard';
import { CameraCard } from './components/CameraCard';
import { ControlsPanel } from './components/ControlsPanel';
import { ApproachLoad } from './components/ApproachLoad';
import { LiveDetectionPanel } from './components/LiveDetectionPanel';

// High-quality traffic surveillance imagery seeds
const CAMERA_IMAGES: Record<Direction, string> = {
  North: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Highway_401_by_Yonge_St_Toronto.jpg',
  South: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Highway_401_by_Yonge_St_Toronto.jpg',
  East: 'https://images.unsplash.com/photo-1519003722824-192d992a6557?auto=format&fit=crop&w=800&q=80',
  West: 'https://images.unsplash.com/photo-1522083165195-3427ec0297b3?auto=format&fit=crop&w=800&q=80',
};

export default function App() {


  // App states
  const [isAdaptive, setIsAdaptive] = useState<boolean>(true);
  const [isManual, setIsManual] = useState<boolean>(false);
  const [arrivalRateSlider, setArrivalRateSlider] = useState<number>(50);
  const [activeDirection, setActiveDirection] = useState<Direction>('North');
  const [activeLiveCamera, setActiveLiveCamera] = useState<Direction>('North');
  const [totalCycles, setTotalCycles] = useState<number>(0);
  const [uploadedVideos, setUploadedVideos] = useState<Record<Direction, string | null>>({
    North: null,
    East: null,
    South: null,
    West: null,
  });

  const handleUploadVideo = (direction: Direction, url: string | null) => {
    setUploadedVideos((prev) => ({
      ...prev,
      [direction]: url,
    }));
  };

  // Manual configuration seconds inputs per lane
  const [manualSeconds, setManualSeconds] = useState<Record<Direction, number>>({
    North: 15,
    East: 15,
    South: 15,
    West: 15,
  });

  // Initializing lanes exactly with the values from the mockup
  // North is green with 4s left. Other lines are red with 9, 5, 14 vehicles.
  const [lanes, setLanes] = useState<LaneState[]>([
    {
      name: 'North',
      light: 'green',
      vehicles: 15,
      duration: 4,
      recommendedGreen: 26,
      maxVehicles: 25,
      arrivalRate: 1.0,
    },
    {
      name: 'East',
      light: 'red',
      vehicles: 9,
      duration: 0,
      recommendedGreen: 19,
      maxVehicles: 25,
      arrivalRate: 1.5,
    },
    {
      name: 'South',
      light: 'red',
      vehicles: 15,
      duration: 0,
      recommendedGreen: 26,
      maxVehicles: 25,
      arrivalRate: 1.2,
    },
    {
      name: 'West',
      light: 'red',
      vehicles: 14,
      duration: 0,
      recommendedGreen: 25,
      maxVehicles: 25,
      arrivalRate: 1.8,
    },
  ]);

  // Aggregate stats
  const totalVehiclesCount = lanes.reduce((acc, lane) => acc + lane.vehicles, 0);

  // Status categories matching dashboard aesthetics
  const getTrafficStatusLabel = (count: number) => {
    if (count < 10) return { text: 'Fluid Flow', color: 'text-emerald-400' };
    if (count < 25) return { text: 'Moderate Load', color: 'text-amber-500' };
    return { text: 'High Congestion', color: 'text-rose-500' };
  };
  const trafficStatus = getTrafficStatusLabel(totalVehiclesCount);

  // Keep a reference to current state values to read inside the static interval
  const stateRef = useRef({
    lanes,
    activeDirection,
    isAdaptive,
    isManual,
    arrivalRateSlider,
    totalCycles,
  });

  useEffect(() => {
    stateRef.current = {
      lanes,
      activeDirection,
      isAdaptive,
      isManual,
      arrivalRateSlider,
      totalCycles,
    };
  }, [lanes, activeDirection, isAdaptive, isManual, arrivalRateSlider, totalCycles]);

  // Unified simulation countdown and vehicle spawning logic
  useEffect(() => {
    const tick = setInterval(() => {
      const current = stateRef.current;

      // 1. Vehicle arrivals simulation
      // Spawns vehicles onto each lane with a random factor based on slider rate & lane arrival rate
      const updatedLanes = current.lanes.map((lane) => {
        // High slider and fast scale increases chance
        const baseChance = 0.15;
        const scaleChance = (current.arrivalRateSlider / 50) * lane.arrivalRate * baseChance;

        let extraVehicles = 0;
        if (Math.random() < scaleChance) {
          extraVehicles = Math.random() < 0.3 ? 2 : 1;
        }

        // Clip maximum capacity to prevent numerical overflow
        const newCount = Math.min(lane.maxVehicles, lane.vehicles + extraVehicles);
        const nextRecommended = Math.round(8 + newCount * 1.2);

        return {
          ...lane,
          vehicles: newCount,
          recommendedGreen: nextRecommended,
        };
      });

      // 2. Active green lane vehicles clearing flow
      // Vehicles are exiting the junction when the light is Green
      const activeLaneIndex = updatedLanes.findIndex((l) => l.name === current.activeDirection);
      const activeLane = { ...updatedLanes[activeLaneIndex] };

      if (activeLane.light === 'green' && activeLane.vehicles > 0) {
        // Multi-vehicle clearing representing smooth flow
        const clearCount = Math.min(activeLane.vehicles, Math.random() < 0.4 ? 2 : 1);
        activeLane.vehicles = Math.max(0, activeLane.vehicles - clearCount);
        activeLane.recommendedGreen = Math.round(8 + activeLane.vehicles * 1.2);
        updatedLanes[activeLaneIndex] = activeLane;
      }

      // 3. Time countdown tracking
      let nextActiveDir = current.activeDirection;
      let nextTotalCycles = current.totalCycles;

      if (activeLane.duration > 0) {
        // Decrease remaining seconds
        activeLane.duration -= 1;
        updatedLanes[activeLaneIndex] = activeLane;

        // Still running active phase
        setLanes(updatedLanes);
      } else {
        // Phase timer reached zero! Move to transitions
        if (activeLane.light === 'green') {
          // Transition Green -> Yellow (standard safety phase 2s)
          activeLane.light = 'yellow';
          activeLane.duration = 2;
          updatedLanes[activeLaneIndex] = activeLane;
          setLanes(updatedLanes);
        } else if (activeLane.light === 'yellow') {
          // Transition Yellow -> Red. Determine next Green phase
          activeLane.light = 'red';
          activeLane.duration = 0;
          updatedLanes[activeLaneIndex] = activeLane;

          nextTotalCycles += 1;
          setTotalCycles(nextTotalCycles);

          if (current.isManual) {
            // Manual mode stops automatic sequence; all turn red until manual override activation
            setLanes(updatedLanes);
          } else {
            // Pick next lane according to operational strategy
            if (current.isAdaptive) {
              // Adaptive Strategy: select the lane with the highest accumulated density!
              // Filter to get lanes and find the peak vehicle depth
              let candidateLanes = updatedLanes.filter((l) => l.name !== current.activeDirection);
              candidateLanes.sort((a, b) => b.vehicles - a.vehicles);

              const chosen = candidateLanes[0];
              const chosenIndex = updatedLanes.findIndex((l) => l.name === chosen.name);

              const delay = chosen.recommendedGreen;

              updatedLanes[chosenIndex] = {
                ...chosen,
                light: 'green',
                duration: delay,
              };
              nextActiveDir = chosen.name;
            } else {
              // Standard Cycling sequence (Fixed Round-Robin style)
              const order: Direction[] = ['North', 'East', 'South', 'West'];
              const curIndex = order.indexOf(current.activeDirection);
              const nextIndex = (curIndex + 1) % order.length;
              nextActiveDir = order[nextIndex];

              const targetLaneIndex = updatedLanes.findIndex((l) => l.name === nextActiveDir);
              updatedLanes[targetLaneIndex] = {
                ...updatedLanes[targetLaneIndex],
                light: 'green',
                duration: 15, // Fixed 15s green phase
              };
            }

            setActiveDirection(nextActiveDir);
            setLanes(updatedLanes);
          }
        } else {
          // All Red phase recovery / Manual selection
          setLanes(updatedLanes);
        }
      }
    }, 1000);

    return () => clearInterval(tick);
  }, []);

  // MANUAL ACTIONS CONTROLLER
  const handleToggleAdaptive = () => {
    setIsAdaptive((prev) => {
      const next = !prev;
      if (next) {
        setIsManual(false); // Can't be in manual when adaptive is active
      }
      return next;
    });
  };

  const handleToggleManual = () => {
    setIsManual((prev) => {
      const next = !prev;
      if (next) {
        setIsAdaptive(false); // Disable adaptive
      }
      return next;
    });
  };

  const handleManualDurationChange = (dir: Direction, val: number) => {
    setManualSeconds((prev) => ({
      ...prev,
      [dir]: val,
    }));
  };

  const handleTriggerManualGo = (dir: Direction) => {
    if (!isManual) return;
    const duration = manualSeconds[dir] || 15;

    // Transition all other lanes to RED instantly
    const nextLanes = lanes.map((lane) => {
      if (lane.name === dir) {
        return {
          ...lane,
          light: 'green' as const,
          duration,
        };
      } else {
        return {
          ...lane,
          light: 'red' as const,
          duration: 0,
        };
      }
    });

    setActiveDirection(dir);
    setLanes(nextLanes);
    setTotalCycles((prev) => prev + 1);
  };

  const handleTriggerAllRed = () => {
    if (!isManual) return;

    const nextLanes = lanes.map((lane) => ({
      ...lane,
      light: 'red' as const,
      duration: 0,
    }));

    setLanes(nextLanes);
  };

  // Switch the bottom live panel active camera safely
  const handleSelectCamera = (dir: Direction) => {
    setActiveLiveCamera(dir);
  };

  // Build a map of lane values for quick component feeding
  const laneVehiclesMap: Record<Direction, number> = {
    North: lanes[0].vehicles,
    East: lanes[1].vehicles,
    South: lanes[2].vehicles,
    West: lanes[3].vehicles,
  };

  const activeLaneState = lanes.find((l) => l.name === activeDirection);
  const activeLightText = activeLaneState ? activeLaneState.light.toUpperCase() : 'RED';
  const greenLeftDisplay = activeLaneState && activeLaneState.light !== 'red'
    ? `${activeLaneState.duration}s`
    : '0s';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Sidebar Panel */}
      <aside className="w-full md:w-64 border-r border-slate-900 bg-slate-105 flex flex-col justify-between shrink-0">
        <div className="flex flex-col">
          {/* Logo Header Container */}
          <div className="p-6 border-b border-slate-900/60 flex items-center">
            <div>
              <span className="font-bold text-sm tracking-tight text-white font-display uppercase block leading-tight">
                Smart Traffic Management
              </span>
            </div>
          </div>

          {/* Nav Categories */}
          <nav className="p-4 flex flex-col gap-1.5">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2 font-display">
              System Control
            </div>
            <a
              href="#controls-dashboard-row"
              className="flex items-center px-3 py-2.5 rounded-lg text-xs font-semibold text-cyan-400 bg-cyan-500/5 border-l-2 border-cyan-500 transition-all font-sans"
            >
              Signal Settings
            </a>
            <a
              href="#cam-card-north"
              className="flex items-center px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-900/50 transition-all font-sans"
            >
              Surveillance Feeds
            </a>
            <a
              href="#computer-vision-live-feed"
              className="flex items-center px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-900/50 transition-all font-sans"
            >
              CV Live Analytics
            </a>
          </nav>
        </div>


      </aside>

      {/* 2. Main Content Space Container */}
      <div className="flex-1 flex flex-col md:h-screen md:overflow-y-auto bg-slate-950">


        {/* Dashboard Frame Inner Body */}
        <div className="p-4 md:p-6 flex-1 flex flex-col gap-6 max-w-7xl w-full mx-auto">

          {/* 4 Metrics Display row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              id="metric-total-veh"
              title="Total vehicles"
              value={totalVehiclesCount}
              subValue={trafficStatus.text}
              subColorClass={trafficStatus.color}
            />
            <MetricCard
              id="metric-green-timer"
              title="Green left"
              value={greenLeftDisplay}
              subValue={
                activeLaneState && activeLaneState.light !== 'red'
                  ? `Serving ${activeLaneState.name}`
                  : 'All Red active'
              }
              subColorClass={
                activeLaneState && activeLaneState.light === 'green'
                  ? 'text-emerald-400'
                  : activeLaneState && activeLaneState.light === 'yellow'
                  ? 'text-amber-400 animate-pulse'
                  : 'text-rose-400'
              }
            />
            <MetricCard
              id="metric-cleared-cycles"
              title="Cycles"
              value={totalCycles}
              subValue=""
              subColorClass="text-slate-400"
            />
            <MetricCard
              id="metric-camera-feed"
              title="Camera feed"
              value={`Live → ${activeLiveCamera[0]}`}
              subValue=""
              subColorClass="text-cyan-400"
            />
          </div>

          {/* Mid Section: Cameras List & interactive Signal Settings side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Cameras Panel List Grid */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                <h3 className="text-xs uppercase tracking-widest font-extrabold text-slate-300 font-display">SURVEILLANCE CCTV INDEX</h3>
                <span className="text-[10px] font-mono text-slate-500">4 ACTIVE NODES</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {lanes.map((lane) => (
                  <CameraCard
                    key={lane.name}
                    id={`cam-card-${lane.name.toLowerCase()}`}
                    laneName={lane.name}
                    lightState={lane.light}
                    vehiclesCount={lane.vehicles}
                    duration={lane.duration}
                    imageUrl={CAMERA_IMAGES[lane.name]}
                    videoUrl={uploadedVideos[lane.name]}
                    isActiveSelection={activeLiveCamera === lane.name}
                    onSelect={() => handleSelectCamera(lane.name)}
                  />
                ))}
              </div>
              {/* Approach Summary Load panel */}
              <ApproachLoad
                id="approach-loads-summary"
                lanes={lanes}
                activeDirection={activeDirection}
              />
            </div>

            {/* Right Signal Controllers */}
            <div className="lg:col-span-5 flex flex-col">
              <ControlsPanel
                id="controls-dashboard-row"
                isAdaptive={isAdaptive}
                onToggleAdaptive={handleToggleAdaptive}
                isManual={isManual}
                onToggleManual={handleToggleManual}
                arrivalRate={arrivalRateSlider}
                onArrivalRateChange={setArrivalRateSlider}
                laneStates={lanes.map((l) => ({ name: l.name, light: l.light }))}
                manualDurations={manualSeconds}
                onManualDurationChange={handleManualDurationChange}
                onTriggerManualGo={handleTriggerManualGo}
                onTriggerAllRed={handleTriggerAllRed}
              />
            </div>
          </div>

          {/* Computer Vision Full Detection Analyzer Feed */}
          <LiveDetectionPanel
            id="computer-vision-live-feed"
            activeCamera={activeLiveCamera}
            onSelectCamera={handleSelectCamera}
            laneVehicles={laneVehiclesMap}
            cameraImages={CAMERA_IMAGES}
            uploadedVideoUrl={uploadedVideos[activeLiveCamera]}
            onUploadVideo={(url) => handleUploadVideo(activeLiveCamera, url)}
          />
        </div>


      </div>
    </main>
  );
}
