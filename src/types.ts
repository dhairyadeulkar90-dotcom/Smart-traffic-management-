export type Direction = 'North' | 'East' | 'South' | 'West';

export type LightState = 'green' | 'yellow' | 'red';

export interface LaneState {
  name: Direction;
  light: LightState;
  vehicles: number;
  duration: number; // Remaining time for current state
  recommendedGreen: number; // Suggested green phase duration based on vehicles
  maxVehicles: number; // Maximum capacity for representation
  arrivalRate: number; // Speed of vehicle generation for this lane
}

export interface SimulationStats {
  totalVehicles: number;
  cyclesCleared: number;
  avgWaitingTime: number;
  activeDirection: Direction;
}
