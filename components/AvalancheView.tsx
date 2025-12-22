
import React, { useState, useMemo } from 'react';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ComposedChart, Legend, AreaChart, Area } from 'recharts';
import AnalysisPanel from './AnalysisPanel';
import ReactMarkdown from 'react-markdown';
import { generateDeepThinkingInsight } from '../services/geminiService';
import { AiResponse } from '../types';
import { IconAlertTriangle, IconGlobe, IconCpu, IconHistory, IconX, IconMountain, IconSnowflake, IconSave, IconCheck, IconActivity } from './Icons';

// Consolidated Sector Data - The Single Source of Truth
const SECTOR_DATA = [
  { zone: 'Rakhiot Face', risk: 85, lastScan: 72, depth: '2.4m', precip: '12mm', temp: '-14°C', trend: 'Unstable' },
  { zone: 'Diamir Base', risk: 45, lastScan: 40, depth: '1.1m', precip: '5mm', temp: '-8°C', trend: 'Stable' },
  { zone: 'Rupal Face', risk: 92, lastScan: 88, depth: '3.1m', precip: '28mm', temp: '-18°C', trend: 'Critical' },
  { zone: 'Fairy Meadows', risk: 30, lastScan: 35, depth: '0.8m', precip: '2mm', temp: '-4°C', trend: 'Low Risk' },
  { zone: 'Mazeno Ridge', risk: 65, lastScan: 55, depth: '1.8m', precip: '15mm', temp: '-12°C', trend: 'High Risk' },
];

// Helper to generate synthetic historical data for sparklines
const generateHistory = (baseValue: string) => {
  const base = parseFloat(baseValue.replace(/[^\d.-]/g, ''));
  return Array.from({ length: 12 }, (_, i) => ({
    time: i,
    val: Number((base + (Math.sin(i * 0.8) * 0.2) + (Math.random() * 0.1)).toFixed(2))
  }));
};

const SECTOR_HISTORY = SECTOR_DATA.reduce((acc, sector) => {
  acc[sector.zone] = generateHistory(sector.depth);
  return acc;
}, {} as Record<string, { time: number, val: number }[]>);

const getRiskColor = (val: number) => {
  if (val > 80) return '#ef4444'; // Red
  if (val > 50) return '#f59e0b'; // Orange
  return '#10b981'; // Green
};

const getTrendColor = (trend: string) => {
  if (trend === 'Critical') return '#ef4444';
  if (trend === 'Unstable' || trend === 'High Risk') return '#f59e0b';
  return '#10b981';
};

interface AlertLogEntry {
  id: number;
  timestamp: string;
  zones: string[];
  riskLevel: 'Critical' | 'High' | 'Moderate' | 'Low';
  message: string;
  threshold: number;
  audience: string;
}

const AvalancheView: React.FC = () => {
  const [aiState, setAiState] = useState<AiResponse>({
    markdown: '',
    loading: false,
    isThinking: false
  });

  const [alertThreshold, setAlertThreshold] = useState<number>(75);
  const [audience, setAudience] = useState<'researchers' | 'communities' | 'public'>('researchers');
  const [showLastScan, setShowLastScan] = useState(false);
  const [history, setHistory] = useState<AlertLogEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
  const [showRunoutSim, setShowRunoutSim] = useState(false);

  const isCriticalRisk = useMemo(() => SECTOR_DATA.some(s => s.risk > 80), []);

  const handleAnalysis = async () => {
    setAiState({ ...aiState, loading: true, isThinking: true });
    
    const prompt = `
      Current Avalanche Risk Assessment for Nanga Parbat Sectors:
      ${JSON.stringify(SECTOR_DATA)}
      
      User Configuration:
      - Alert Threshold: >${alertThreshold}%
      - Audience: ${audience.toUpperCase()}
      
      Analyze the stability of each sector and provide tactical recommendations.
    `;

    const result = await generateDeepThinkingInsight(prompt);
    
    // Log the alert
    const affectedZones = SECTOR_DATA.filter(z => z.risk > alertThreshold).map(z => z.zone);
    const maxRiskVal = Math.max(...SECTOR_DATA.map(z => z.risk), 0);
    
    const newLog: AlertLogEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      zones: affectedZones,
      riskLevel: maxRiskVal > 80 ? 'Critical' : maxRiskVal > 50 ? 'High' : 'Low',
      message: result,
      threshold: alertThreshold,
      audience
    };

    setHistory(prev => [newLog, ...prev]);
    setAiState({ markdown: result, loading: false, isThinking: false });
  };

  return (
    <div className="relative h-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full p-6 overflow-hidden">
        {/* Visual Column */}
        <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
          
          {/* Risk Profile Card */}
          <div className="bg-sentinel-800 p-6 rounded-xl border border-sentinel-700 shadow-lg flex-shrink-0">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Regional Risk Profile</h3>
                <p className="text-slate-400 text-sm">Aggregated probability of slab release.</p>
              </div>
              <button 
                onClick={() => setShowLastScan(!showLastScan)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${showLastScan ? 'bg-sky-600 border-sky-500 text-white' : 'bg-sentinel-900 border-sentinel-700 text-slate-400'}`}
              >
                {showLastScan ? 'HIDDEN COMPARISON' : 'COMPARE LAST SCAN'}
              </button>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={SECTOR_DATA} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" />
                  <YAxis dataKey="zone" type="category" stroke="#f8fafc" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  {showLastScan && <Bar dataKey="lastScan" name="Last Scan" fill="#475569" barSize={10} radius={[0, 2, 2, 0]} />}
                  <Bar dataKey="risk" name="Current Risk" barSize={20} radius={[0, 4, 4, 0]}>
                    {SECTOR_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getRiskColor(entry.risk)} />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Unified Telemetry & Trends List */}
          <div className="bg-sentinel-800 p-6 rounded-xl border border-sentinel-700 shadow-lg flex-shrink-0">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-bold flex items-center gap-2">
                <IconActivity className="w-5 h-5 text-sky-400" />
                Sector Telemetry & Trends
              </h3>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Live Multi-Sensor Link</span>
            </div>
            
            <div className="space-y-3">
              {SECTOR_DATA.map((sector) => (
                <div key={sector.zone} className="flex items-center gap-4 p-3 rounded-xl bg-sentinel-900/50 border border-sentinel-700/50 hover:border-sky-500/30 transition-all group">
                  <div className="w-32 flex-shrink-0">
                    <p className="text-sm font-bold text-slate-200 truncate">{sector.zone}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] text-slate-500 font-mono">{sector.temp}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{sector.precip}</span>
                    </div>
                  </div>

                  {/* Integrated Sparkline Area Chart */}
                  <div className="flex-1 h-12 min-w-[100px] bg-sentinel-900/80 rounded-lg overflow-hidden border border-sentinel-800">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={SECTOR_HISTORY[sector.zone]}>
                        <defs>
                          <linearGradient id={`grad-${sector.zone}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={getTrendColor(sector.trend)} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={getTrendColor(sector.trend)} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area 
                          type="monotone" 
                          dataKey="val" 
                          stroke={getTrendColor(sector.trend)} 
                          fill={`url(#grad-${sector.zone})`}
                          strokeWidth={1.5}
                          dot={false}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="w-20 text-right">
                    <p className="text-xs font-mono text-sky-400 font-bold">{sector.depth}</p>
                    <span className={`text-[10px] font-bold uppercase ${
                      sector.trend === 'Critical' ? 'text-red-400' : 
                      sector.trend === 'Stable' ? 'text-emerald-400' : 'text-orange-400'
                    }`}>
                      {sector.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Configuration & Controls */}
          <div className="bg-sentinel-800 p-6 rounded-xl border border-sentinel-700 shadow-lg">
             <div className="flex items-center justify-between mb-6">
               <h4 className="text-white font-bold flex items-center gap-2">
                 <IconAlertTriangle className="w-5 h-5 text-warning-500" />
                 Alert Generation Configuration
               </h4>
               <button onClick={() => setShowHistory(true)} className="p-2 bg-sentinel-900 hover:bg-sentinel-700 rounded-lg text-sky-400 border border-sentinel-700">
                 <IconHistory className="w-4 h-4" />
               </button>
             </div>
             
             <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">
                    <span>Probability Threshold</span>
                    <span className="text-sky-400 font-mono">{alertThreshold}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" step="5" value={alertThreshold} 
                    onChange={(e) => setAlertThreshold(Number(e.target.value))}
                    className="w-full h-1.5 bg-sentinel-900 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {['researchers', 'communities', 'public'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setAudience(opt as any)}
                      className={`px-2 py-3 rounded-lg border text-[10px] font-bold uppercase transition-all ${
                        audience === opt ? 'bg-sky-600 border-sky-400 text-white shadow-lg' : 'bg-sentinel-900 border-sentinel-700 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
             </div>
          </div>
        </div>

        {/* Analysis Panel */}
        <div className="h-full">
          <AnalysisPanel 
            title="Avalanche Prediction Engine"
            markdown={aiState.markdown}
            loading={aiState.loading}
            isThinking={aiState.isThinking}
            onAnalyze={handleAnalysis}
          />
        </div>
      </div>

      {/* History Modal Overlay */}
      {showHistory && (
        <div className="absolute inset-0 z-50 bg-sentinel-900/95 backdrop-blur-sm p-6 flex flex-col animate-in fade-in duration-200">
           <div className="flex justify-between items-center mb-6 border-b border-sentinel-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <IconHistory className="w-6 h-6 text-sky-400" />
                Alert Audit History
              </h2>
              <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-white"><IconX className="w-6 h-6" /></button>
           </div>
           
           <div className="flex-1 overflow-y-auto space-y-4">
              {history.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-600 italic">No logs generated for this session.</div>
              ) : (
                history.map(log => (
                  <div key={log.id} className="bg-sentinel-800 border border-sentinel-700 rounded-xl overflow-hidden">
                    <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-sentinel-700/50" onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}>
                      <div className="flex gap-4 items-center">
                        <span className="text-xs font-mono text-slate-500">{log.timestamp}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.riskLevel === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                          {log.riskLevel}
                        </span>
                        <span className="text-xs text-white font-bold">{log.zones.join(', ')}</span>
                      </div>
                      <IconPlus className={`w-4 h-4 transition-transform ${expandedLogId === log.id ? 'rotate-45' : ''}`} />
                    </div>
                    {expandedLogId === log.id && (
                      <div className="p-6 bg-sentinel-950/50 border-t border-sentinel-800 text-sm leading-relaxed prose prose-invert max-w-none">
                        <ReactMarkdown>{log.message}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                ))
              )}
           </div>
        </div>
      )}
    </div>
  );
};

// Internal icon for history expansion
const IconPlus = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default AvalancheView;
