import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { CityGraph } from '../types';

interface CityTwinProps {
  graph: CityGraph;
  width?: number;
  height?: number;
}

const CityTwin: React.FC<CityTwinProps> = ({ graph, width = 600, height = 500 }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !graph) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const g = svg.append("g");
    
    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom);

    // Render Edges (Roads)
    g.selectAll(".edge")
      .data(graph.edges)
      .enter()
      .append("line")
      .attr("class", "edge")
      .attr("x1", d => graph.nodes.find(n => n.id === d.source)?.coords.x || 0)
      .attr("y1", d => graph.nodes.find(n => n.id === d.source)?.coords.y || 0)
      .attr("x2", d => graph.nodes.find(n => n.id === d.target)?.coords.x || 0)
      .attr("y2", d => graph.nodes.find(n => n.id === d.target)?.coords.y || 0)
      .attr("stroke-width", d => Math.max(2, (d.currentFlow / d.capacity) * 8)) // Width based on congestion
      .attr("stroke", d => {
        if (d.isClosed) return "#ef4444"; // Red (Closed)
        const congestion = d.currentFlow / d.capacity;
        if (congestion > 0.8) return "#f59e0b"; // Amber (High Traffic)
        return "#3b82f6"; // Blue (Normal)
      })
      .attr("stroke-opacity", 0.6)
      .attr("stroke-linecap", "round");

    // Render Nodes (Intersections)
    g.selectAll(".node")
      .data(graph.nodes)
      .enter()
      .append("circle")
      .attr("class", "node")
      .attr("cx", d => d.coords.x)
      .attr("cy", d => d.coords.y)
      .attr("r", d => d.type === 'POI' ? 8 : 4)
      .attr("fill", d => d.type === 'POI' ? "#10b981" : "#94a3b8")
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 2);

    // Labels for POIs
    g.selectAll(".label")
      .data(graph.nodes.filter(n => n.type === 'POI'))
      .enter()
      .append("text")
      .attr("x", d => d.coords.x + 12)
      .attr("y", d => d.coords.y + 4)
      .text(d => d.label)
      .attr("fill", "#e2e8f0")
      .attr("font-size", "10px")
      .attr("font-family", "monospace");
      
  }, [graph, width, height]);

  return (
    <div className="relative border border-slate-700 rounded-xl overflow-hidden bg-slate-900 shadow-2xl">
      <div className="absolute top-4 left-4 z-10 bg-slate-800/80 backdrop-blur px-3 py-1 rounded text-xs text-slate-300 border border-slate-600">
        LIVE TWIN VIEW
      </div>
      <svg ref={svgRef} width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="cursor-move bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
        {/* Grid pattern definition could go here */}
      </svg>
    </div>
  );
};

export default CityTwin;
