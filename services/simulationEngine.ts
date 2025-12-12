import { CityGraph, Edge, Node, SimulationMetrics, PolicyAction } from '../types';

// Helper: Deep copy graph
export const cloneGraph = (graph: CityGraph): CityGraph => {
  return {
    nodes: graph.nodes.map(n => ({ ...n })),
    edges: graph.edges.map(e => ({ ...e }))
  };
};

// 1. Apply Policies to Graph
export const applyPolicy = (graph: CityGraph, actions: PolicyAction[]): CityGraph => {
  const newGraph = cloneGraph(graph);

  actions.forEach(action => {
    newGraph.edges.forEach(edge => {
      let isTarget = false;
      
      // Determine if edge matches target
      if (action.target_tag === 'all') isTarget = true;
      if (action.target_tag === 'downtown') {
        // Mock logic: Downtown is roughly middle coordinates
        if (edge.id.includes('n_2_2') || edge.id.includes('n_1_2') || edge.id.includes('n_2_1')) isTarget = true;
      }
      
      if (isTarget) {
        if (action.type === 'close_road') {
          edge.isClosed = true;
          edge.currentWeight = Infinity;
        } else if (action.type === 'modify_speed') {
          edge.speedLimit = action.value || 30;
          // Recalculate base weight (inverse to speed)
          edge.baseWeight = (1000 / edge.speedLimit); // Simplified
        } else if (action.type === 'adjust_capacity') {
          edge.capacity = edge.capacity * (action.value || 1);
        }
      }
    });
  });

  return newGraph;
};

// 2. Run Flow Simulation (Simplification of Network Flow)
// We simulate random traffic trying to route between POIs
export const runTrafficSimulation = (graph: CityGraph): SimulationMetrics => {
  
  // Reset flows
  graph.edges.forEach(e => e.currentFlow = Math.floor(Math.random() * 100)); // Base random flow

  // Simulate routing from Hospital (0,0) to Industrial (4,4) and Downtown (2,2)
  const routes = [
    { start: 'n_0_0', end: 'n_4_4', volume: 500 },
    { start: 'n_4_0', end: 'n_0_4', volume: 300 }, // Cross city
    { start: 'n_2_0', end: 'n_2_4', volume: 400 }  // Vertical trunk
  ];

  let totalTravelTime = 0;
  let totalTrips = 0;

  routes.forEach(route => {
    const path = findShortestPath(graph, route.start, route.end);
    if (path.length > 0) {
      // Add flow to edges
      path.forEach(edgeId => {
        const edge = graph.edges.find(e => e.id === edgeId);
        if (edge && !edge.isClosed) {
          edge.currentFlow += route.volume;
          // Congestion penalty: Weight increases exponentially if Flow > Capacity
          const utilization = edge.currentFlow / edge.capacity;
          const penalty = utilization > 0.8 ? Math.pow(utilization, 2) * 10 : 0;
          edge.currentWeight = edge.baseWeight + penalty;
          totalTravelTime += edge.currentWeight;
        }
      });
      totalTrips++;
    }
  });

  // Calculate Metrics
  const totalCongestion = graph.edges.reduce((acc, edge) => {
    return acc + (edge.currentFlow / edge.capacity);
  }, 0);
  
  const avgCongestion = (totalCongestion / graph.edges.length) * 100;
  const emissions = graph.edges.reduce((acc, edge) => acc + (edge.currentFlow * 0.05), 0); // Mock CO2 calc

  return {
    congestionIndex: Math.min(avgCongestion, 100),
    avgTravelTime: totalTrips > 0 ? totalTravelTime / totalTrips : 0,
    emergencyResponseTime: (totalTravelTime / totalTrips) * 0.8, // Emergency vehicles are faster
    emissions: Math.floor(emissions),
    activePolicies: []
  };
};

// Dijkstra's Algorithm
function findShortestPath(graph: CityGraph, startNodeId: string, endNodeId: string): string[] {
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const queue: string[] = [];

  graph.nodes.forEach(node => {
    distances[node.id] = Infinity;
    previous[node.id] = null;
    queue.push(node.id);
  });

  distances[startNodeId] = 0;

  while (queue.length > 0) {
    // Sort queue by distance (inefficient for large graphs but fine for demo)
    queue.sort((a, b) => distances[a] - distances[b]);
    const u = queue.shift();

    if (!u) break;
    if (u === endNodeId) break;

    if (distances[u] === Infinity) break; // Unreachable

    // Find neighbors
    const neighbors = graph.edges.filter(e => e.source === u && !e.isClosed);
    
    neighbors.forEach(edge => {
      const v = edge.target;
      if (queue.includes(v)) {
        const alt = distances[u] + edge.currentWeight;
        if (alt < distances[v]) {
          distances[v] = alt;
          previous[v] = edge.id; // Store edge ID to reconstruct path
        }
      }
    });
  }

  // Reconstruct path (Edges)
  const path: string[] = [];
  let curr: string | null = endNodeId;
  
  // Note: 'previous' maps Node -> Edge that led to it. 
  // We need to trace back nodes to find edges.
  // Wait, my Dijkstra structure above maps Node -> Edge ID. 
  // But wait, standard Dijkstra `previous` maps Node -> Previous Node.
  // Let's correct: `previous` usually maps to Node. 
  // For simplicity, let's map Node -> Edge ID that entered it.
  
  while (curr && curr !== startNodeId) {
    const edgeId = previous[curr];
    if (edgeId) {
      path.unshift(edgeId);
      const edge = graph.edges.find(e => e.id === edgeId);
      curr = edge ? edge.source : null;
    } else {
      break;
    }
  }

  return path;
}
