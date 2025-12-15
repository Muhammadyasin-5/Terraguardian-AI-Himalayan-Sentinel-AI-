import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import AnalysisPanel from './AnalysisPanel';
import { generateDeepThinkingInsight } from '../services/geminiService';
import { AiResponse } from '../types';
import { IconMap, IconPaw, IconLeaf } from './Icons';

const ecosystemData = [
  { subject: 'Biodiversity', A: 80, B: 110, fullMark: 150, baseline: 95 },
  { subject: 'Soil Stability', A: 90, B: 60, fullMark: 150, baseline: 105 },
  { subject: 'Water Quality', A: 120, B: 85, fullMark: 150, baseline: 130 },
  { subject: 'Vegetation', A: 70, B: 50, fullMark: 150, baseline: 85 },
  { subject: 'Prey Density', A: 85, B: 70, fullMark: 150, baseline: 90 },
  { subject: 'Human Impact', A: 40, B: 90, fullMark: 150, baseline: 30 },
];

const wildlifeData = [
  { 
    name: 'Snow Leopard', 
    scientific: 'Panthera uncia',
    niche: 'Apex Predator', 
    habitat: 'Alpine Tundra & Rocky Outcrops (3,000-5,400m)',
    diet: 'Blue Sheep, Ibex, Marmots',
    status: 'Vulnerable',
    trend: 'decreasing'
  },
  { 
    name: 'Himalayan Brown Bear', 
    scientific: 'Ursus arctos isabellinus',
    niche: 'Omnivore / Scavenger', 
    habitat: 'Subalpine Scrub & Meadows (3,000-5,000m)',
    diet: 'Grass, Roots, Insects, Small Mammals',
    status: 'Endangered',
    trend: 'stable'
  },
  { 
    name: 'Flare-Horned Markhor', 
    scientific: 'Capra falconeri falconeri',
    niche: 'Large Herbivore', 
    habitat: 'Steep Cliffs & Scrub Forests (600-3,600m)',
    diet: 'Grass, Leaves, Shoots',
    status: 'Near Threatened',
    trend: 'increasing'
  },
  { 
    name: 'Himalayan Monal', 
    scientific: 'Lophophorus impejanus',
    niche: 'Seed Disperser / Insectivore', 
    habitat: 'Oak-Conifer Forests & Open Slopes (2,400-4,500m)',
    diet: 'Seeds, Tubers, Insects',
    status: 'Least Concern',
    trend: 'stable'
  }
];

interface MigrationPoint {
  year: number;
  x: number;
  y: number;
  note: string;
}

const EcosystemView: React.FC = () => {
  const [aiState, setAiState] = useState<AiResponse>({
    markdown: '',
    loading: false,
    isThinking: false
  });

  const [migrationPath, setMigrationPath] = useState<MigrationPoint[]>([]);
  const [showBaseline, setShowBaseline] = useState(false);

  const handleAnalysis = async () => {
    setAiState({ ...aiState, loading: true, isThinking: true });
    setMigrationPath([]); // Reset path on new analysis
    
    // Deep thinking required for complex ecological web interactions
    const prompt = `
      Perform a complex ecosystem simulation for the Nanga Parbat Biosphere based on these metrics (A=Current, B=Projected 2040):
      ${JSON.stringify(ecosystemData)}
      
      And these Key Species Profiles:
      ${JSON.stringify(wildlifeData)}
      
      1. Analyze the trophic cascade effects of reduced vegetation and soil stability on the specific niches listed (e.g., how does loss of Subalpine Scrub affect the Brown Bear?).
      2. Model the migration patterns of the Snow Leopard (Panthera uncia) specifically, considering the upward shift of the Alpine Tundra zone.
      3. Evaluate the loss of ecosystem services (carbon storage, water filtration) in economic terms.
      4. Create a 50-year resilience strategy focusing on habitat connectivity between the distinct elevation bands listed in the species profiles.

      IMPORTANT: At the very end of your response, provide the projected migration path for the Snow Leopard as a JSON object with key "migrationPath" containing an array of 4-5 objects.
      Each object must have: "year" (integer), "x" (percentage 10-90), "y" (percentage 10-90), "note" (short string).
      Format:
      \`\`\`json
      {
        "migrationPath": [
           {"year": 2024, "x": 20, "y": 80, "note": "Current Range"},
           {"year": 2030, "x": 45, "y": 60, "note": "Seeking Higher Altitude"},
           ...
        ]
      }
      \`\`\`
    `;

    const result = await generateDeepThinkingInsight(prompt);

    // Parse migration path
    try {
        const jsonMatch = result.match(/```json\s*({[\s\S]*?})\s*```/);
        if (jsonMatch && jsonMatch[1]) {
            const parsed = JSON.parse(jsonMatch[1]);
            if (parsed.migrationPath && Array.isArray(parsed.migrationPath)) {
                setMigrationPath(parsed.migrationPath);
            }
        }
    } catch (e) {
        console.warn("Failed to parse migration path", e);
    }

    setAiState({ markdown: result, loading: false, isThinking: false });
  };

  const handleExport = () => {
    const dataToExport = {
      reportType: "Ecosystem Resilience Index",
      generatedAt: new Date().toISOString(),
      metrics: ecosystemData,
      speciesProfile: wildlifeData,
      migrationProjection: migrationPath,
      aiAnalysis: aiState.markdown || "No analysis generated yet."
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentinel_ecosystem_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    // Simulate saving to local storage or backend
    const report = {
        id: Date.now(),
        type: 'ECOSYSTEM_MODEL',
        content: aiState.markdown,
        date: new Date().toISOString()
    };
    
    const existing = localStorage.getItem('sentinel_reports');
    const reports = existing ? JSON.parse(existing) : [];
    reports.push(report);
    localStorage.setItem('sentinel_reports', JSON.stringify(reports));
  };

  // Helper to construct SVG path from points
  const getPathString = () => {
      if (migrationPath.length === 0) return "";
      return migrationPath.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-sentinel-900 border border-sentinel-700 p-4 rounded-lg shadow-xl">
          <p className="text-white font-bold mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.stroke || p.fill }}></span>
                <span className="text-sm font-bold text-slate-200">
                  {p.name}: {p.value}
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
      <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
        <div className="bg-sentinel-800 p-6 rounded-xl border border-sentinel-700 shadow-lg flex-shrink-0">
          <div className="flex justify-between items-center mb-6">
             <div>
                <h3 className="text-xl font-bold text-white mb-1">Ecosystem Resilience Index</h3>
                <p className="text-slate-400 text-sm">Comparing metrics against projection & baseline.</p>
             </div>
             <label className="flex items-center gap-2 cursor-pointer group">
                <span className="text-xs text-slate-400 group-hover:text-white transition-colors">Compare 2000 Baseline</span>
                <div 
                    onClick={() => setShowBaseline(!showBaseline)}
                    className={`w-8 h-4 rounded-full p-0.5 transition-colors ${showBaseline ? 'bg-sky-600' : 'bg-sentinel-700'}`}
                >
                    <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${showBaseline ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
             </label>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={ecosystemData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                
                <Radar name="Current Status" dataKey="A" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.4} />
                <Radar name="2040 Projection" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                
                {showBaseline && (
                    <Radar 
                        name="2000 Baseline" 
                        dataKey="baseline" 
                        stroke="#64748b" 
                        strokeDasharray="4 4" 
                        fill="#64748b" 
                        fillOpacity={0.1} 
                    />
                )}
                
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Wildlife Species Detail Section */}
        <div className="bg-sentinel-800 p-6 rounded-xl border border-sentinel-700 shadow-lg flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <IconLeaf className="w-4 h-4 text-emerald-400" />
              Species Niche & Habitat Matrix
            </h4>
          </div>
          <div className="space-y-3">
            {wildlifeData.map((species, i) => (
              <div key={i} className="bg-sentinel-900/50 border border-sentinel-700/50 rounded-lg p-3 hover:border-emerald-500/30 transition-colors group">
                <div className="flex justify-between items-start mb-1">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">{species.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                species.status === 'Endangered' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                species.status === 'Vulnerable' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                                {species.status}
                            </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono italic">{species.scientific}</span>
                    </div>
                    <div className="text-right">
                         <span className={`text-[10px] font-mono ${
                             species.trend === 'decreasing' ? 'text-red-400' : 
                             species.trend === 'increasing' ? 'text-emerald-400' : 'text-slate-400'
                         }`}>
                             {species.trend === 'decreasing' ? '↘' : species.trend === 'increasing' ? '↗' : '→'} TREND
                         </span>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div className="bg-sentinel-800/50 p-2 rounded">
                        <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Ecological Niche</span>
                        <span className="text-slate-300">{species.niche}</span>
                    </div>
                    <div className="bg-sentinel-800/50 p-2 rounded">
                        <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Habitat Range</span>
                        <span className="text-slate-300">{species.habitat}</span>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Migration Map Visualization */}
        <div className="bg-sentinel-800 rounded-xl border border-sentinel-700 shadow-lg flex-shrink-0 overflow-hidden">
            <div className="p-4 border-b border-sentinel-700 flex justify-between items-center bg-sentinel-900/50">
                <h4 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                    <IconMap className="w-4 h-4 text-emerald-400" />
                    Projected Migration Patterns
                </h4>
                {migrationPath.length > 0 && (
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                        AI Model Generated
                    </span>
                )}
            </div>
            
            <div className="relative h-64 w-full bg-sentinel-900 group">
                 {/* Background Terrain */}
                 <img 
                    src="https://picsum.photos/seed/snowleopard_habitat/800/400" 
                    alt="The view of Nanga Parbat mountain, Pakistan - Ecosystem Terrain"
                    className="w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity grayscale"
                 />
                 
                 {/* Grid Overlay */}
                 <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

                 {migrationPath.length > 0 ? (
                     <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                         <defs>
                             <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                 <feGaussianBlur stdDeviation="2" result="blur" />
                                 <feComposite in="SourceGraphic" in2="blur" operator="over" />
                             </filter>
                             {/* Paw path definition for reuse */}
                             <path id="pawIcon" d="M12 2c1.7 0 3 1.3 3 3v2a3 3 0 0 1-6 0V5c0-1.7 1.3-3 3-3ZM19 8c1.7 0 3 1.3 3 3v2a3 3 0 0 1-6 0v-2c0-1.7 1.3-3 3-3ZM5 8c1.7 0 3 1.3 3 3v2a3 3 0 0 1-6 0v-2c0-1.7 1.3-3 3-3ZM12 12c-2.8 0-5 2.2-5 5v1a5 5 0 0 0 10 0v-1c0-2.8-2.2-5-5-5Z" />
                         </defs>
                         
                         {/* Connection Path */}
                         <path 
                            d={getPathString()} 
                            fill="none" 
                            stroke="#10b981" 
                            strokeWidth="0.5" 
                            strokeDasharray="2"
                            className="opacity-60"
                         />

                         {/* Moving Snow Leopard Animation */}
                         <g>
                            <circle r="4" fill="rgba(16, 185, 129, 0.2)">
                               <animateMotion 
                                  dur="8s" 
                                  repeatCount="indefinite"
                                  path={getPathString()}
                               />
                            </circle>
                             <g transform="translate(-1.5, -1.5) scale(0.12)">
                                <use href="#pawIcon" fill="#34d399" filter="url(#glow)" />
                                <animateMotion 
                                  dur="8s" 
                                  repeatCount="indefinite"
                                  path={getPathString()}
                                  rotate="auto"
                                />
                             </g>
                         </g>

                         {/* Waypoints */}
                         {migrationPath.map((point, index) => (
                             <g key={index}>
                                 <circle 
                                    cx={point.x} 
                                    cy={point.y} 
                                    r={index === 0 ? 1.5 : 1} 
                                    fill={index === 0 ? '#34d399' : '#ffffff'} 
                                    stroke="#064e3b" 
                                    strokeWidth="0.2"
                                    filter="url(#glow)"
                                 />
                                 <text 
                                    x={point.x} 
                                    y={point.y - 3} 
                                    fontSize="3" 
                                    fill="white" 
                                    textAnchor="middle" 
                                    className="font-mono drop-shadow-md"
                                 >
                                     {point.year}
                                 </text>
                             </g>
                         ))}
                     </svg>
                 ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                        <p className="text-xs">Waiting for analysis...</p>
                    </div>
                 )}

                 {/* Current Hover Note for Points (simplified, could be interactive) */}
                 {migrationPath.length > 0 && (
                     <div className="absolute bottom-2 left-2 right-2 bg-sentinel-900/80 backdrop-blur border border-sentinel-700 p-2 rounded text-xs text-slate-300">
                         <span className="text-emerald-400 font-bold">Latest Projection: </span>
                         {migrationPath[migrationPath.length-1].note}
                     </div>
                 )}
            </div>
        </div>
      </div>

      <div className="h-full min-h-[500px]">
        <AnalysisPanel 
          title="Biosphere Impact Simulation" 
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

export default EcosystemView;