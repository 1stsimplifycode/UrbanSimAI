import { CityGraph, NodeType, Edge, Node } from './types';

// Generate a synthetic city grid (5x5 Manhattan style + Diagonal Highway)
const GRID_SIZE = 5;
const BLOCK_SIZE = 100; // Visual units

const nodes: Node[] = [];
const edges: Edge[] = [];

// Generate Nodes (Intersections)
for (let y = 0; y < GRID_SIZE; y++) {
  for (let x = 0; x < GRID_SIZE; x++) {
    const id = `n_${x}_${y}`;
    let type = NodeType.INTERSECTION;
    let label = `Intersection ${x}-${y}`;

    // Mark some as POIs
    if (x === 2 && y === 2) {
      type = NodeType.POI;
      label = "City Center (POI)";
    } else if (x === 0 && y === 0) {
      type = NodeType.POI;
      label = "Hospital (Emergency)";
    } else if (x === 4 && y === 4) {
      type = NodeType.POI;
      label = "Industrial Zone";
    }

    nodes.push({
      id,
      type,
      label,
      coords: { x: x * BLOCK_SIZE + 50, y: y * BLOCK_SIZE + 50 }
    });
  }
}

// Generate Edges (Roads)
// Horizontal
for (let y = 0; y < GRID_SIZE; y++) {
  for (let x = 0; x < GRID_SIZE - 1; x++) {
    edges.push(createEdge(`n_${x}_${y}`, `n_${x + 1}_${y}`, 'horizontal'));
    edges.push(createEdge(`n_${x + 1}_${y}`, `n_${x}_${y}`, 'horizontal')); // Bi-directional
  }
}
// Vertical
for (let x = 0; x < GRID_SIZE; x++) {
  for (let y = 0; y < GRID_SIZE - 1; y++) {
    edges.push(createEdge(`n_${x}_${y}`, `n_${x}_${y + 1}`, 'vertical'));
    edges.push(createEdge(`n_${x}_${y + 1}`, `n_${x}_${y}`, 'vertical')); // Bi-directional
  }
}

// Helper to create edge
function createEdge(source: string, target: string, orient: string): Edge {
  const isHighway = (source === 'n_0_0' && target === 'n_1_1') || (source === 'n_1_1' && target === 'n_2_2'); // Diagonal shortcut simulated
  
  return {
    id: `e_${source}_${target}`,
    source,
    target,
    capacity: isHighway ? 2000 : 800,
    currentFlow: Math.floor(Math.random() * 400),
    baseWeight: 10, // Base cost (distance)
    currentWeight: 10,
    isClosed: false,
    speedLimit: isHighway ? 80 : 40,
  };
}

export const INITIAL_CITY_GRAPH: CityGraph = {
  nodes,
  edges
};

export const GEMINI_SYSTEM_INSTRUCTION = `
You are the AI Policy Core for UDAPS (Urban Digital Twin). 
Your goal is to interpret natural language city policies and convert them into structured simulation actions.

The city is a grid. Key locations:
- "Downtown" / "City Center": Middle of grid (approx n_2_2).
- "Hospital": Top left (n_0_0).
- "Industrial": Bottom right (n_4_4).

Available Actions:
1. close_road: Close roads in a specific area or specific ID.
2. modify_speed: Change speed limit (affects travel time).
3. adjust_capacity: Restrict lanes (e.g., bus lane only reduces general capacity).

Output JSON ONLY. Schema:
{
  "actions": [
    {
      "type": "close_road" | "modify_speed" | "adjust_capacity",
      "target_tag": "downtown" | "hospital_route" | "highway" | "all",
      "value": number (optional, e.g. new speed or capacity factor 0.0-1.0),
      "description": "Short summary of action"
    }
  ],
  "reasoning": "Brief explanation of expected impact"
}
`;
