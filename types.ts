// Graph Definitions
export interface Coordinate {
  x: number;
  y: number;
}

export enum NodeType {
  INTERSECTION = 'INTERSECTION',
  POI = 'POI', // Point of Interest (School, Hospital)
  SENSOR = 'SENSOR'
}

export interface Node {
  id: string;
  type: NodeType;
  label: string;
  coords: Coordinate;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  capacity: number;
  currentFlow: number;
  baseWeight: number; // e.g., length in meters
  currentWeight: number; // Effective weight (length + congestion penalty)
  isClosed: boolean;
  speedLimit: number;
}

export interface CityGraph {
  nodes: Node[];
  edges: Edge[];
}

// Policy Definitions
export interface PolicyAction {
  type: 'close_road' | 'modify_speed' | 'adjust_capacity' | 'optimize_signal';
  target_id?: string; // Specific edge ID or zone
  target_tag?: string; // e.g., 'downtown', 'highway'
  value?: number; // New speed, or capacity multiplier
  description: string;
}

export interface SimulationMetrics {
  congestionIndex: number; // 0-100
  avgTravelTime: number; // minutes
  emergencyResponseTime: number; // minutes
  emissions: number; // CO2 tons/hr
  activePolicies: PolicyAction[];
}

// History for Charts
export interface MetricPoint {
  time: string;
  congestion: number;
  emissions: number;
  travelTime: number;
}

export enum SimulationState {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED'
}
