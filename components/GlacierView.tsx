import React, { useState, useMemo } from 'react';
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line, Brush, Legend, ReferenceDot, ReferenceLine } from 'recharts';
import AnalysisPanel from './AnalysisPanel';
import { generateDeepThinkingInsight } from '../services/geminiService';
import { GlacierData, AiResponse } from '../types';
import { IconClock, IconActivity, IconCpu, IconShare } from './Icons';

const mockData: (GlacierData & { historicalAvg: number })[] = [
  { year: 1990, massBalance: 0, meltRate: 1.2, historicalAvg: -2.0 },
  { year: 1995, massBalance: -5, meltRate: 1.4, historicalAvg: -6.5 },
  { year: 2000, massBalance: -12, meltRate: 1.8, historicalAvg: -11.0 },
  { year: 2005, massBalance: -25, meltRate: 2.1, historicalAvg: -15.5 },
  { year: 2010, massBalance: -38, meltRate: 2.5, historicalAvg: -20.0 },
  { year: 2015, massBalance: -55, meltRate: 3.2, historicalAvg: -24.5 },
  { year: 2020, massBalance: -72, meltRate: 3.8, historicalAvg: -29.0 },
  { year: 2024, massBalance: -85, meltRate: 4.1, historicalAvg: -33.5 },
];

const GlacierView: React.FC = () => {
  const [aiState, setAiState] = useState<AiResponse>({
    markdown: '',
    loading: false,
    isThinking: false
  });

  const [predictions, setPredictions] = useState<{ 
    p2030: number | null, 
    p2030_min: number | null,
    p2030_max: number | null,
    p2040: number | null,
    p2040_min: number | null,
    p2040_max: number | null
  }>({
    p2030: null, p2030_min: null, p2030_max: null,
    p2040: null, p2040_min: null, p2040_max: null
  });

  const [showHistorical, setShowHistorical] = useState(false);

  const handleAnalysis = async () => {
    setAiState({ ...aiState, loading: true, isThinking: true });
    
    // Using deep thinking for complex historical data analysis and future projection
    const prompt = `
      Analyze the following glacial melt data for the Nanga Parbat region (1990-2024):
      ${JSON.stringify(mockData)}
      
      Tasks:
      1. **Statistical Time-Series Modeling**: Treat the data as a non-stationary time series. Apply an ARIMA (AutoRegressive Integrated Moving Average) or Prophet-like decomposition to isolate trend, seasonality, and residuals.
      2. **Climate Forcing (RCP 8.5)**: Project the mass balance to 2030 and 2040, integrating the accelerated warming signal characteristic of the RCP 8.5 scenario.
      3. **Uncertainty Quantification**: Calculate 95% confidence intervals for your predictions, accounting for feedback loops like albedo reduction and debris cover changes.
      4. **Hydrological Impact**: Quantify the potential reduction in dry-season water flow for the Indus Basin agriculture and hydroelectric capacity.
      5. **Intervention Strategy**: Propose 3 distinct engineering or policy interventions with Feasibility Ratings.

      IMPORTANT: At the very end of your response, strictly provide the numerical mass balance predictions (negative integers) for 2030 and 2040 in a JSON block. Include the confidence intervals (min/max).
      Format:
      \`\`\`json
      {
        "p2030": -115,
        "p2030_min": -125,
        "p2030_max": -105,
        "p2040": -145,
        "p2040_min": -160,
        "p2040_max": -130
      }
      \`\`\`
    `;

    const result = await generateDeepThinkingInsight(prompt);
    
    // Attempt to extract predictions from JSON block
    try {
      const jsonMatch = result.match(/```json\s*({[\s\S]*?})\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        setPredictions({
          p2030: parsed.p2030 || null,
          p2030_min: parsed.p2030_min || parsed.p2030 - 10,
          p2030_max: parsed.p2030_max || parsed.p2030 + 10,
          p2040: parsed.p2040 || null,
          p2040_min: parsed.p2040_min || parsed.p2040 - 15,
          p2040_max: parsed.p2040_max || parsed.p2040 + 15,
        });
      }
    } catch (e) {
      console.warn("Could not parse predictions from AI response", e);
    }

    setAiState({ markdown: result, loading: false, isThinking: false });
  };

  const handleExport = () => {
    const dataToExport = {
      reportType: "Glacier Health Analysis & Forecast",
      generatedAt: new Date().toISOString(),
      methodology: "ARIMA-Simulated Projection (RCP 8.5)",
      metrics: mockData,
      predictions: predictions,
      aiAnalysis: aiState.markdown || "No analysis generated yet."
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentinel_glacier_forecast_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
      const report = {
          id: Date.now(),
          type: 'GLACIER_HEALTH',
          content: aiState.markdown,
          date: new Date().toISOString()
      };
      
      const existing = localStorage.getItem('sentinel_reports');
      const reports = existing ? JSON.parse(existing) : [];
      reports.push(report);
      localStorage.setItem('sentinel_reports', JSON.stringify(reports));
  };

  // Combine historical data with AI predictions for the chart
  const chartData = useMemo(() => {
    const data = mockData.map(d => ({ 
        ...d, 
        predictedMassBalance: null as number | null,
        confidenceRange: null as [number, number] | null
    }));
    
    if (predictions.p2030 !== null && predictions.p2040 !== null) {
       // Find the last historical point to connect the line
       const lastIndex = data.findIndex(d => d.year === 2024);
       if (lastIndex !== -1) {
           data[lastIndex].predictedMassBalance = data[lastIndex].massBalance;
           // Anchor confidence range at the known point (zero variance)
           data[lastIndex].confidenceRange = [data[lastIndex].massBalance, data[lastIndex].massBalance];
       }
       
       // Add prediction points
       data.push({
           year: 2030,
           massBalance: null as any,
           meltRate: 0,
           historicalAvg: null as any,
           predictedMassBalance: predictions.p2030,
           confidenceRange: [predictions.p2030_min!, predictions.p2030_max!]
       });
       
       data.push({
           year: 2040,
           massBalance: null as any,
           meltRate: 0,
           historicalAvg: null as any,
           predictedMassBalance: predictions.p2040,
           confidenceRange: [predictions.p2040_min!, predictions.p2040_max!]
       });
    }
    return data;
  }, [predictions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const prediction = payload.find((p: any) => p.name === 'AI Projection (2040)');
      const range = payload.find((p: any) => p.dataKey === 'confidenceRange');
      
      return (
        <div className="bg-sentinel-900 border border-sentinel-700 p-4 rounded-lg shadow-xl backdrop-blur-md bg-opacity-95 min-w-[200px]">
          <p className="text-slate-300 font-mono text-xs mb-2">Year: <span className="text-white font-bold">{label}</span></p>
          <div className="space-y-2">
            {payload.map((p: any, i: number) => {
                if (p.dataKey === 'confidenceRange') return null; // Handle custom display for range
                return (
                    <div key={i} className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{p.name}</span>
                            <span className="text-sm font-bold text-white font-mono">
                            {typeof p.value === 'number' ? p.value.toFixed(1) : p.value} <span className="text-xs text-slate-500 font-sans">m.w.e.</span>
                            </span>
                        </div>
                    </div>
                );
            })}
            
            {/* Display Confidence Range explicitly if available */}
            {range && range.value && (
                <div className="flex items-center gap-3 pt-2 mt-2 border-t border-sentinel-700/50">
                    <span className="w-2 h-2 rounded-full bg-indigo-500/30 border border-indigo-500"></span>
                    <div className="flex flex-col">
                        <span className="text-xs text-indigo-300 uppercase tracking-wider font-semibold">95% Conf. Interval</span>
                        <span className="text-xs font-mono text-indigo-200">
                           [{range.value[0]?.toFixed(1)} to {range.value[1]?.toFixed(1)}]
                        </span>
                    </div>
                </div>
            )}
          </div>
          {label > 2024 && (
             <div className="mt-2 pt-2 border-t border-sentinel-700">
                <div className="flex items-center gap-1.5 text-xs text-indigo-400">
                    <IconCpu className="w-3 h-3" />
                    <span>Gemini 3 Pro + ARIMA</span>
                </div>
             </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full p-6 overflow-hidden">
      {/* Visual Column */}
      <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
        <div className="bg-sentinel-800 p-6 rounded-xl border border-sentinel-700 shadow-lg flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
            <div>
                <h3 className="text-xl font-bold text-white mb-1">Glacier Mass Balance Forecast</h3>
                <p className="text-slate-400 text-sm">Cumulative mass change (meters water equivalent).</p>
            </div>
            <div className="flex items-center gap-2 bg-sentinel-900 p-1 rounded-lg border border-sentinel-700">
                <button
                    onClick={() => setShowHistorical(!showHistorical)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        showHistorical ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    Avg. Overlay
                </button>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMass" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="year" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" label={{ value: 'm.w.e', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} />
                
                {/* Confidence Interval Area */}
                <Area 
                    dataKey="confidenceRange" 
                    stroke="none" 
                    fill="#818cf8" 
                    fillOpacity={0.15} 
                    name="95% Confidence Interval"
                    legendType="rect"
                />

                <Area 
                    type="monotone" 
                    dataKey="massBalance" 
                    name="Observed Mass"
                    stroke="#ef4444" 
                    fillOpacity={1} 
                    fill="url(#colorMass)" 
                />
                
                {/* AI Prediction Line */}
                {predictions.p2030 && (
                     <Line 
                        type="monotone" 
                        dataKey="predictedMassBalance" 
                        name="AI Projection (2040)"
                        stroke="#818cf8" 
                        strokeWidth={3}
                        strokeDasharray="4 4"
                        dot={({ cx, cy, payload }) => {
                            if (payload.year === 2030 || payload.year === 2040) {
                                return (
                                    <svg x={cx - 5} y={cy - 5} width={10} height={10} fill="#818cf8" viewBox="0 0 10 10">
                                        <circle cx="5" cy="5" r="5" />
                                        <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
                                    </svg>
                                );
                            }
                            return <circle cx={cx} cy={cy} r={0} fill="none" />;
                        }}
                        activeDot={{ r: 6, fill: "#fff", stroke: "#818cf8", strokeWidth: 2 }}
                    />
                )}

                {showHistorical && (
                    <Line 
                        type="monotone" 
                        dataKey="historicalAvg" 
                        name="Hist. Average"
                        stroke="#64748b" 
                        strokeWidth={2}
                        strokeDasharray="2 2"
                        dot={false}
                    />
                )}
                
                <Brush 
                    dataKey="year" 
                    height={30} 
                    stroke="#475569" 
                    fill="#1e293b" 
                    tickFormatter={(val) => val.toString()}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 flex-shrink-0">
           <div className="bg-sentinel-800 p-4 rounded-xl border border-sentinel-700">
             <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-xs uppercase tracking-wider">Melt Rate</p>
                <IconActivity className="w-4 h-4 text-red-500" />
             </div>
             <p className="text-2xl font-mono font-bold text-red-400">4.1 <span className="text-sm text-slate-500">cm/d</span></p>
             <div className="w-full bg-sentinel-900 h-1.5 mt-3 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full w-[85%]"></div>
             </div>
           </div>
           <div className="bg-sentinel-800 p-4 rounded-xl border border-sentinel-700">
             <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-xs uppercase tracking-wider">Water Yield</p>
                <IconActivity className="w-4 h-4 text-sky-500" />
             </div>
             <p className="text-2xl font-mono font-bold text-sky-400">1.2M <span className="text-sm text-slate-500">m³</span></p>
             <div className="w-full bg-sentinel-900 h-1.5 mt-3 rounded-full overflow-hidden">
                <div className="bg-sky-500 h-full w-[65%]"></div>
             </div>
           </div>
        </div>

        {/* AI Projections Section */}
        <div className="bg-sentinel-800 p-5 rounded-xl border border-sentinel-700 shadow-lg flex-shrink-0">
           <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                  <IconClock className="w-5 h-5 text-indigo-400" />
                  <h4 className="text-white font-bold text-sm uppercase tracking-wider">AI Future Mass Balance Projections</h4>
               </div>
               {predictions.p2030 && (
                   <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
                       ARIMA + GEMINI 3 PRO
                   </span>
               )}
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-sentinel-900/50 p-3 rounded-lg border border-sentinel-700/50 relative overflow-hidden group transition-all hover:border-indigo-500/30">
                 <div className="absolute top-0 right-0 p-2 opacity-10">
                    <span className="text-4xl font-bold text-slate-600">30</span>
                 </div>
                 <p className="text-[10px] text-slate-400 font-mono mb-1 uppercase">Year 2030 Model</p>
                 <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-mono font-bold ${predictions.p2030 ? 'text-indigo-200' : 'text-slate-600'}`}>
                      {predictions.p2030 !== null ? predictions.p2030 : '---'}
                    </span>
                    <span className="text-xs text-slate-500">m.w.e.</span>
                 </div>
                 {predictions.p2030 && (
                    <div className="mt-1 text-[9px] text-indigo-400/70 font-mono">
                        ±{((predictions.p2030_max! - predictions.p2030_min!) / 2).toFixed(1)} (95% CI)
                    </div>
                 )}
                 {predictions.p2030 && <div className="mt-2 w-full bg-sentinel-700 h-1 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full animate-pulse" style={{ width: '85%' }}></div>
                 </div>}
              </div>

              <div className="bg-sentinel-900/50 p-3 rounded-lg border border-sentinel-700/50 relative overflow-hidden group transition-all hover:border-indigo-500/30">
                 <div className="absolute top-0 right-0 p-2 opacity-10">
                    <span className="text-4xl font-bold text-slate-600">40</span>
                 </div>
                 <p className="text-[10px] text-slate-400 font-mono mb-1 uppercase">Year 2040 Model</p>
                 <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-mono font-bold ${predictions.p2040 ? 'text-indigo-200' : 'text-slate-600'}`}>
                      {predictions.p2040 !== null ? predictions.p2040 : '---'}
                    </span>
                     <span className="text-xs text-slate-500">m.w.e.</span>
                 </div>
                 {predictions.p2040 && (
                    <div className="mt-1 text-[9px] text-indigo-400/70 font-mono">
                        ±{((predictions.p2040_max! - predictions.p2040_min!) / 2).toFixed(1)} (95% CI)
                    </div>
                 )}
                  {predictions.p2040 && <div className="mt-2 w-full bg-sentinel-700 h-1 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full animate-pulse" style={{ width: '95%' }}></div>
                 </div>}
              </div>
           </div>
           
           {!predictions.p2030 && !aiState.loading && (
             <p className="text-[10px] text-slate-500 mt-3 text-center italic">Initiate analysis to generate predictive models</p>
           )}
           {aiState.loading && (
              <div className="mt-3 flex flex-col items-center justify-center gap-1.5 text-xs text-indigo-400 animate-pulse">
                <div className="flex items-center gap-2">
                   <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                   <span>Simulating ARIMA trajectory (RCP 8.5)...</span>
                </div>
                <div className="w-full max-w-[200px] h-0.5 bg-sentinel-700 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-1/2 animate-[shimmer_1s_infinite]"></div>
                </div>
              </div>
           )}
        </div>

        <div className="relative h-32 w-full rounded-xl overflow-hidden border border-sentinel-700 group flex-shrink-0">
          <img 
            src="https://picsum.photos/seed/glacier2/800/400" 
            alt="Glacier Visual" 
            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="bg-black/50 px-3 py-1 rounded text-xs text-white backdrop-blur-sm border border-white/20">Satellite Imagery: Rakhiot Glacier</span>
          </div>
        </div>
      </div>

      {/* Analysis Column */}
      <div className="h-full min-h-[500px]">
        <AnalysisPanel 
          title="Predictive Health Model" 
          markdown={aiState.markdown} 
          loading={aiState.loading} 
          onAnalyze={handleAnalysis}
          onExport={handleExport}
          onSave={handleSave}
          isThinking={aiState.isThinking}
        />
      </div>
    </div>
  );
};

export default GlacierView;