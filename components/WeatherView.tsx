import React, { useState } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, Legend } from 'recharts';
import AnalysisPanel from './AnalysisPanel';
import { generateDeepThinkingInsight } from '../services/geminiService';
import { AiResponse } from '../types';
import { IconWind, IconCloudRain, IconSun, IconThermometer, IconNavigation, IconAlertTriangle, IconActivity } from './Icons';

// Mock Forecast Data
const FORECAST_DATA = [
  { day: 'Mon', tempHigh: -15, tempLow: -22, windSpeed: 45, snow: 5, freezingLevel: 4200 },
  { day: 'Tue', tempHigh: -18, tempLow: -25, windSpeed: 65, snow: 12, freezingLevel: 3800 },
  { day: 'Wed', tempHigh: -20, tempLow: -28, windSpeed: 85, snow: 25, freezingLevel: 3500 },
  { day: 'Thu', tempHigh: -12, tempLow: -20, windSpeed: 30, snow: 0, freezingLevel: 4500 },
  { day: 'Fri', tempHigh: -10, tempLow: -18, windSpeed: 25, snow: 0, freezingLevel: 4800 },
  { day: 'Sat', tempHigh: -14, tempLow: -21, windSpeed: 40, snow: 2, freezingLevel: 4300 },
  { day: 'Sun', tempHigh: -16, tempLow: -24, windSpeed: 55, snow: 8, freezingLevel: 4000 },
];

const WeatherView: React.FC = () => {
  const [aiState, setAiState] = useState<AiResponse>({
    markdown: '',
    loading: false,
    isThinking: false
  });

  const handleAnalysis = async () => {
    setAiState({ ...aiState, loading: true, isThinking: true });
    
    const prompt = `
      **METEOROLOGICAL SITREP REQUEST: NANGA PARBAT SECTOR**
      
      Input Telemetry (7-Day Forecast):
      ${JSON.stringify(FORECAST_DATA)}
      
      **Analysis Requirements:**
      1. **Synoptic Overview**: Identify the pressure systems driving this pattern (e.g., Western Disturbance, Jet Stream Dip).
      2. **Flight Feasibility**: Analyze wind shear and visibility for rotor-wing operations (Medevac/Supply).
      3. **Summit Window Identification**: Pinpoint the optimal <= 24h window for high-altitude movement based on wind chill and precipitation.
      4. **Objective Hazard Forecast**: Correlate freezing levels and snow loading to predict specific avalanche cycles (Wet Slab vs. Wind Slab).

      **Output Protocol:**
      - Strict military/scientific tone.
      - Use markdown for headers.
      - Bold key risk metrics.
    `;

    const result = await generateDeepThinkingInsight(prompt);
    setAiState({ markdown: result, loading: false, isThinking: false });
  };

  const handleExport = () => {
      const report = {
          type: "METEOROLOGICAL_REPORT",
          timestamp: new Date().toISOString(),
          forecast: FORECAST_DATA,
          analysis: aiState.markdown
      };
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sentinel_weather_log_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-sentinel-900 border border-sentinel-700 p-4 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-white font-bold mb-2 font-mono uppercase">{label}</p>
          <div className="space-y-2 text-xs">
            {payload.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <span className="text-slate-400">{p.name}:</span>
                <span className="font-mono font-bold" style={{ color: p.color }}>
                  {p.value} {p.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full p-6 overflow-hidden">
      {/* Left Column: Visuals & Data */}
      <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
        
        {/* Header Card */}
        <div className="bg-sentinel-800 p-6 rounded-xl border border-sentinel-700 shadow-lg flex-shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <IconWind className="w-24 h-24 text-sky-400" />
            </div>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <IconActivity className="w-5 h-5 text-sky-400" />
                        Atmospheric Monitoring Station
                    </h3>
                    <p className="text-slate-400 text-sm font-mono mt-1">SECTOR 4: DIAMIR FLANK (6,400m)</p>
                </div>
                <div className="flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded text-sky-400 text-xs font-bold animate-pulse">
                    LIVE TELEMETRY
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-sentinel-900/50 p-3 rounded-lg border border-sentinel-700/50">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Summit Temp</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-mono text-white">-24.5</span>
                        <span className="text-xs text-slate-400">°C</span>
                    </div>
                </div>
                <div className="bg-sentinel-900/50 p-3 rounded-lg border border-sentinel-700/50">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Wind Speed</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-mono text-orange-400">65</span>
                        <span className="text-xs text-slate-400">km/h</span>
                    </div>
                </div>
                <div className="bg-sentinel-900/50 p-3 rounded-lg border border-sentinel-700/50">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Wind Chill</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-mono text-red-400">-42</span>
                        <span className="text-xs text-slate-400">°C</span>
                    </div>
                </div>
                <div className="bg-sentinel-900/50 p-3 rounded-lg border border-sentinel-700/50">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Pressure</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-mono text-emerald-400">465</span>
                        <span className="text-xs text-slate-400">hPa</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Main Chart */}
        <div className="bg-sentinel-800 p-6 rounded-xl border border-sentinel-700 shadow-lg flex-1 min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
                <h4 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    <IconNavigation className="w-4 h-4 text-indigo-400" />
                    7-Day Synoptic Forecast
                </h4>
                <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-sky-500"></span> Temp (°C)
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-slate-600"></span> Wind (km/h)
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-indigo-500/50"></span> Snow (cm)
                    </div>
                </div>
            </div>
            
            <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={FORECAST_DATA} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                        <defs>
                            <linearGradient id="snowGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="day" stroke="#94a3b8" tick={{fontSize: 12}} />
                        <YAxis yAxisId="left" stroke="#94a3b8" tick={{fontSize: 12}} label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                        <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" tick={{fontSize: 12}} label={{ value: 'Wind (km/h)', angle: 90, position: 'insideRight', fill: '#64748b' }} />
                        
                        <Tooltip content={<CustomTooltip />} />
                        
                        {/* Snow Accumulation Area */}
                        <Area yAxisId="right" type="monotone" dataKey="snow" name="Snow" fill="url(#snowGradient)" stroke="#818cf8" strokeWidth={2} />
                        
                        {/* Wind Speed Bars */}
                        <Bar yAxisId="right" dataKey="windSpeed" name="Wind" barSize={20} fill="#475569" radius={[4, 4, 0, 0]} />
                        
                        {/* Temperature Lines */}
                        <Line yAxisId="left" type="monotone" dataKey="tempHigh" name="High" stroke="#38bdf8" strokeWidth={3} dot={{r: 4, fill: '#0f172a', strokeWidth: 2}} />
                        <Line yAxisId="left" type="monotone" dataKey="tempLow" name="Low" stroke="#0284c7" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Jet Stream Visualizer */}
        <div className="bg-sentinel-800 p-6 rounded-xl border border-sentinel-700 shadow-lg flex-shrink-0 relative overflow-hidden h-48">
             <div className="absolute inset-0 opacity-30">
                 <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white to-transparent animate-[shimmer_2s_infinite]"></div>
                 {/* Visual sugar for wind streamlines */}
                 {[...Array(5)].map((_, i) => (
                     <div key={i} className="absolute h-[1px] bg-white/20 w-full" style={{ top: `${20 + i * 15}%`, left: 0, animation: `slideRight ${3 + i}s linear infinite` }}></div>
                 ))}
             </div>
             
             <div className="relative z-10 flex flex-col h-full justify-between">
                 <div className="flex justify-between items-start">
                     <h4 className="text-white font-bold text-sm uppercase flex items-center gap-2">
                        <IconAlertTriangle className="w-4 h-4 text-warning-500" />
                        Jet Stream Proximity
                     </h4>
                     <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/20 font-bold">CRITICAL</span>
                 </div>
                 
                 <div className="flex items-end gap-4">
                     <div>
                         <p className="text-[10px] text-slate-400 uppercase">Vertical Clearance</p>
                         <p className="text-2xl font-mono text-white">1,200m</p>
                     </div>
                     <div className="h-8 w-px bg-sentinel-600"></div>
                     <div>
                         <p className="text-[10px] text-slate-400 uppercase">Core Velocity</p>
                         <p className="text-2xl font-mono text-white">180 <span className="text-sm text-slate-500">km/h</span></p>
                     </div>
                 </div>
             </div>
        </div>

      </div>

      {/* Right Column: AI Analysis */}
      <div className="h-full min-h-[500px]">
        <AnalysisPanel 
          title="Synoptic Analysis Engine" 
          markdown={aiState.markdown} 
          loading={aiState.loading} 
          onAnalyze={handleAnalysis}
          onExport={handleExport}
          onSave={() => console.log('Saved')}
          isThinking={aiState.isThinking}
        />
      </div>
    </div>
  );
};

export default WeatherView;
