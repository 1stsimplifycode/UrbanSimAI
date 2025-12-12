import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Cpu, Map, Send, Terminal, AlertTriangle, Play, Shield } from 'lucide-react';
import CityTwin from './components/CityTwin';
import MetricsDashboard from './components/MetricsDashboard';
import { INITIAL_CITY_GRAPH } from './constants';
import { interpretPolicy, getAIRecommendations } from './services/geminiService';
import { applyPolicy, runTrafficSimulation } from './services/simulationEngine';
import { CityGraph, MetricPoint, PolicyAction, SimulationMetrics, SimulationState } from './types';

const App: React.FC = () => {
  // State
  const [cityGraph, setCityGraph] = useState<CityGraph>(INITIAL_CITY_GRAPH);
  const [metrics, setMetrics] = useState<SimulationMetrics>({
    congestionIndex: 45,
    avgTravelTime: 12,
    emergencyResponseTime: 8,
    emissions: 150,
    activePolicies: []
  });
  const [history, setHistory] = useState<MetricPoint[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);
  const [simState, setSimState] = useState<SimulationState>(SimulationState.IDLE);
  const [recommendation, setRecommendation] = useState<string>("");

  // Initial Simulation Loop (Background traffic)
  useEffect(() => {
    const interval = setInterval(() => {
      if (simState === SimulationState.IDLE || simState === SimulationState.RUNNING) {
        setCityGraph(prev => {
          const res = runTrafficSimulation(prev);
          setMetrics(m => ({ ...res, activePolicies: m.activePolicies })); // Preserve active policies
          
          setHistory(h => {
            const newPoint = {
              time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }),
              congestion: res.congestionIndex,
              emissions: res.emissions,
              travelTime: res.avgTravelTime
            };
            return [...h.slice(-19), newPoint]; // Keep last 20 points
          });
          return { ...prev }; // Trigger re-render of map
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [simState]);

  // Handle Policy Submission
  const handlePolicySubmit = async () => {
    if (!inputText.trim()) return;
    
    setIsProcessing(true);
    setAiReasoning("Interpreting policy via Gemini 2.0 Flash...");

    try {
      const result = await interpretPolicy(inputText);
      
      setAiReasoning(`Interpretation Complete: ${result.reasoning}`);
      
      // Apply Policy
      setCityGraph(prev => {
        const newGraph = applyPolicy(prev, result.actions);
        return newGraph;
      });

      setMetrics(prev => ({
        ...prev,
        activePolicies: [...prev.activePolicies, ...result.actions]
      }));

      // Trigger Recommendation Update
      const rec = await getAIRecommendations(metrics);
      setRecommendation(rec);

    } catch (error) {
      console.error(error);
      setAiReasoning("Error interpreting policy.");
    } finally {
      setIsProcessing(false);
      setInputText('');
    }
  };

  const handleReset = () => {
    setCityGraph(INITIAL_CITY_GRAPH);
    setMetrics(prev => ({ ...prev, activePolicies: [] }));
    setAiReasoning(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center px-6 justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white">UDAPS <span className="text-slate-500 font-normal">| Urban Digital Twin</span></h1>
            <p className="text-[10px] text-blue-400 font-mono tracking-widest uppercase">System Operational</p>
          </div>
        </div>
        <div className="flex gap-4 text-sm font-medium text-slate-400">
           <div className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
             Pub/Sub Connected
           </div>
           <div className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-blue-500"></span>
             Gemini Active
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto w-full">
        
        {/* Left Column: Visual Twin (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <CityTwin graph={cityGraph} height={500} />
          <MetricsDashboard history={history} current={metrics} />
        </div>

        {/* Right Column: Control & Policy (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Policy Input */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="w-5 h-5 text-purple-400" />
              <h2 className="font-semibold text-white">Policy Command Center</h2>
            </div>
            
            <div className="relative">
              <textarea 
                className="w-full h-32 bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm font-mono text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                placeholder="e.g., 'Close downtown roads to private cars during rush hour' or 'Reduce speed limit in industrial zone'"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if(e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handlePolicySubmit();
                  }
                }}
              />
              <button 
                onClick={handlePolicySubmit}
                disabled={isProcessing}
                className={`absolute bottom-3 right-3 p-2 rounded-md transition-all ${isProcessing ? 'bg-slate-700' : 'bg-blue-600 hover:bg-blue-500'} text-white`}
              >
                {isProcessing ? <Activity className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>

            {aiReasoning && (
              <div className="mt-4 p-3 bg-slate-800/50 rounded border border-slate-700 text-xs text-slate-300 font-mono">
                <span className="text-purple-400 font-bold">AI_CORE_LOG:</span> {aiReasoning}
              </div>
            )}
          </div>

          {/* Active Policies List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex-1 overflow-hidden flex flex-col">
             <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                <h2 className="font-semibold text-white">Active Policies</h2>
              </div>
              <button onClick={handleReset} className="text-xs text-red-400 hover:text-red-300 underline">Reset All</button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {metrics.activePolicies.length === 0 ? (
                <div className="text-center py-10 text-slate-600 italic">No active policies applied.</div>
              ) : (
                metrics.activePolicies.map((p, i) => (
                  <div key={i} className="p-3 bg-slate-800 rounded border border-slate-700 border-l-4 border-l-green-500">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold uppercase text-green-400">{p.type}</span>
                      <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">{p.target_tag}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{p.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RL Recommendations */}
           <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-indigo-400" />
              <h2 className="font-semibold text-white">RL Agent Recommendations</h2>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {recommendation || "System analyzing traffic patterns for optimization..."}
            </p>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
