import React, { useState } from 'react';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ComposedChart, Legend, AreaChart, Area } from 'recharts';
import AnalysisPanel from './AnalysisPanel';
import ReactMarkdown from 'react-markdown';
import { generateDeepThinkingInsight } from '../services/geminiService';
import { AiResponse } from '../types';
import { IconAlertTriangle, IconGlobe, IconCpu, IconHistory, IconX, IconMountain, IconSnowflake, IconSave, IconCheck, IconActivity } from './Icons';

const riskData = [
  { zone: 'Rakhiot Face', risk: 85, lastScan: 72, depth: '2.4m', trend: 'Unstable' },
  { zone: 'Diamir Base', risk: 45, lastScan: 40, depth: '1.1m', trend: 'Stable' },
  { zone: 'Rupal Face', risk: 92, lastScan: 88, depth: '3.1m', trend: 'Critical' },
  { zone: 'Fairy Meadows', risk: 30, lastScan: 35, depth: '0.8m', trend: 'Low Risk' },
  { zone: 'Mazeno Ridge', risk: 65, lastScan: 55, depth: '1.8m', trend: 'High Risk' },
];

const telemetryData = [
  { zone: 'Rakhiot Face', depth: '2.4m', precip: '12mm', temp: '-14°C', trend: 'Unstable' },
  { zone: 'Diamir Base', depth: '1.1m', precip: '5mm', temp: '-8°C', trend: 'Stable' },
  { zone: 'Rupal Face', depth: '3.1m', precip: '28mm', temp: '-18°C', trend: 'Critical' },
  { zone: 'Fairy Meadows', depth: '0.8m', precip: '2mm', temp: '-4°C', trend: 'Low Risk' },
  { zone: 'Mazeno Ridge', depth: '1.8m', precip: '15mm', temp: '-12°C', trend: 'High Risk' },
];

// Generate synthetic trend data for the mini-charts
const generateTrendData = (baseDepthStr: string) => {
  const base = parseFloat(baseDepthStr.replace(/[^\d.-]/g, ''));
  return Array.from({ length: 24 }, (_, i) => {
    // Simulate accumulation + sensor noise over 24h
    const trend = (i / 24) * 0.15; // +15cm over 24h
    const noise = (Math.sin(i * 0.5) * 0.02) + (Math.random() * 0.01);
    return {
      hour: i,
      depth: Math.max(0, Number((base - 0.15 + trend + noise).toFixed(3)))
    };
  });
};

const zoneTrends = telemetryData.reduce((acc, curr) => {
  acc[curr.zone] = generateTrendData(curr.depth);
  return acc;
}, {} as Record<string, {hour: number, depth: number}[]>);

const getRiskColor = (val: number) => {
  if (val > 80) return '#ef4444'; // Red
  if (val > 50) return '#f59e0b'; // Orange
  return '#10b981'; // Green
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

  // Configuration State
  const [alertThreshold, setAlertThreshold] = useState<number>(75);
  const [audience, setAudience] = useState<'researchers' | 'communities' | 'public'>('researchers');
  const [showLastScan, setShowLastScan] = useState(false);

  // History State
  const [history, setHistory] = useState<AlertLogEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
  const [historySaved, setHistorySaved] = useState(false);

  const handleAnalysis = async () => {
    setAiState({ ...aiState, loading: true, isThinking: true });
    
    // Check max risk to conditionally add advisory
    const currentMaxRisk = Math.max(...riskData.map(z => z.risk));
    const isHighRisk = currentMaxRisk > 50;
    const includeAdvisory = audience === 'public' && isHighRisk;

    const prompt = `
      Current Avalanche Risk Assessment for Nanga Parbat Sectors:
      ${JSON.stringify(riskData)}
      
      User Configuration:
      - Risk Threshold for Alerts: >${alertThreshold}%
      - Notification Target Audience: ${audience.toUpperCase()}
      
      Recent weather: Heavy snowfall (48h), Temp -12C rising to -2C.
      
      Tasks:
      1. Analyze the risk data. Identify ALL zones exceeding the ${alertThreshold}% threshold.
      2. For the identified high-risk zones, draft a specific alert message based on the audience:
         - IF AUDIENCE IS RESEARCHERS: Use glaciological terminology, discuss specific shear stress factors, weak layer depth (hoar frost), and crystal metamorphism.
         - IF AUDIENCE IS COMMUNITIES: Use simple, urgent language. Focus on evacuation orders, road closures (KKH), and immediate safety actions. Avoid jargon.
         - IF AUDIENCE IS PUBLIC: Focus on travel advisories for tourists, trekkers, and climbers. Emphasize "Go/No-Go" decisions for specific routes, base camp safety, and hiking permits.
      3. Explain the underlying snowpack instability mechanisms driving these specific risks.
      4. Provide a 24-hour forecast window for travel safety.
      ${includeAdvisory ? `
      5. **MANDATORY GO/NO-GO ADVISORY**:
         Since the risk level is HIGH/CRITICAL and the audience is PUBLIC, you MUST append a distinct markdown section at the end titled "**## GO/NO-GO ADVISORY**".
         - List each major sector (Rakhiot, Diamir, Rupal, Fairy Meadows, Mazeno).
         - Assign a clear status: "✅ GO", "⚠️ CAUTION", or "⛔ NO-GO".
         - Provide a 1-sentence justification for each based on the risk percentage and trends provided.
      ` : ''}
    `;

    const result = await generateDeepThinkingInsight(prompt);
    
    // Log the alert
    const affectedZones = riskData.filter(z => z.risk > alertThreshold).map(z => z.zone);
    const maxRiskVal = Math.max(...riskData.filter(z => z.risk > alertThreshold).map(z => z.risk), 0);
    let riskLevel: AlertLogEntry['riskLevel'] = 'Low';
    if (maxRiskVal > 80) riskLevel = 'Critical';
    else if (maxRiskVal > 50) riskLevel = 'High';
    else if (affectedZones.length > 0) riskLevel = 'Moderate';

    const newLog: AlertLogEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      zones: affectedZones,
      riskLevel,
      message: result,
      threshold: alertThreshold,
      audience
    };

    setHistory(prev => [newLog, ...prev]);
    setAiState({ markdown: result, loading: false, isThinking: false });
  };

  const handleExport = () => {
    const dataToExport = {
      reportType: "Avalanche Risk Assessment",
      generatedAt: new Date().toISOString(),
      configuration: {
          threshold: alertThreshold,
          audience: audience
      },
      currentRiskProfile: riskData,
      alertHistory: history,
      latestAnalysis: aiState.markdown || "No analysis generated yet."
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentinel_avalanche_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    // Save report to localStorage with comprehensive metadata
    const report = {
        id: Date.now(),
        type: 'AVALANCHE_RISK',
        content: aiState.markdown,
        timestamp: new Date().toISOString(),
        metadata: {
            configuration: {
                threshold: alertThreshold,
                audience: audience
            },
            riskProfile: riskData,
            alertHistory: history,
            telemetry: telemetryData
        }
    };
    
    const existing = localStorage.getItem('sentinel_reports');
    const reports = existing ? JSON.parse(existing) : [];
    reports.push(report);
    localStorage.setItem('sentinel_reports', JSON.stringify(reports));
  };

  const handleSaveAllLogs = () => {
    const existing = localStorage.getItem('sentinel_reports');
    const reports = existing ? JSON.parse(existing) : [];
    
    const logsToSave = history.map(log => ({
        id: Date.now() + Math.random(), // Ensure unique ID
        type: 'AVALANCHE_RISK_LOG',
        content: log.message,
        timestamp: new Date().toISOString(),
        metadata: {
            logTimestamp: log.timestamp,
            riskLevel: log.riskLevel,
            affectedZones: log.zones,
            configuration: {
                threshold: log.threshold,
                audience: log.audience
            }
        }
    }));
    
    localStorage.setItem('sentinel_reports', JSON.stringify([...reports, ...logsToSave]));
    setHistorySaved(true);
    setTimeout(() => setHistorySaved(false), 2000);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-sentinel-900 border border-sentinel-700 p-4 rounded-lg shadow-xl min-w-[180px]">
          <p className="text-white font-bold mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-400">{p.dataKey === 'risk' ? 'Current Risk' : 'Last Scan'}:</span>
                <span className="text-sm font-mono font-bold" style={{ color: p.color }}>
                  {p.value}%
                </span>
              </div>
            ))}
            
            <div className="mt-3 pt-2 border-t border-sentinel-700/50 flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Snow Depth:</span>
                    <span className="text-xs text-white font-mono">{data.depth}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Stability Trend:</span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        data.trend === 'Critical' ? 'bg-red-500/10 text-red-400' : 
                        data.trend === 'Unstable' || data.trend === 'High Risk' ? 'bg-orange-500/10 text-orange-400' : 
                        'bg-emerald-500/10 text-emerald-400'
                    }`}>
                        {data.trend}
                    </span>
                </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative h-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full p-6 overflow-hidden">
        {/* Visual Column - Scrollable */}
        <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
          {/* Risk Chart */}
          <div className="bg-sentinel-800 p-6 rounded-xl border border-sentinel-700 shadow-lg flex-shrink-0">
            <div className="flex justify-between items-start mb-6">
              <div>
                  <h3 className="text-xl font-bold text-white mb-1">Regional Risk Profile</h3>
                  <p className="text-slate-400 text-sm">Real-time snowpack telemetry probability.</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                 <div className="px-3 py-1 bg-sentinel-900 rounded border border-sentinel-700 text-xs font-mono text-emerald-400 animate-pulse border-emerald-500/30">
                     LIVE FEED
                 </div>
                 
                 <button 
                    onClick={() => setShowLastScan(!showLastScan)}
                    className="flex items-center gap-2 group cursor-pointer focus:outline-none"
                    title="Toggle comparison with previous scan data"
                 >
                    <span className={`text-xs transition-colors ${showLastScan ? 'text-sky-400 font-medium' : 'text-slate-400 group-hover:text-slate-300'}`}>
                        Compare Last Scan
                    </span>
                    <div className={`w-9 h-5 rounded-full p-1 transition-colors duration-200 ease-in-out ${showLastScan ? 'bg-sky-600' : 'bg-sentinel-700 border border-sentinel-600'}`}>
                        <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${showLastScan ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                 </button>
              </div>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={riskData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" />
                  <YAxis dataKey="zone" type="category" stroke="#f8fafc" width={100} tick={{fontSize: 12}} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#334155', opacity: 0.2}} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  
                  {showLastScan && (
                      <Bar dataKey="lastScan" name="Last Scan (24h ago)" barSize={12} fill="#64748b" radius={[0, 4, 4, 0]} animationDuration={500} />
                  )}
                  
                  <Bar dataKey="risk" name="Current Risk Probability" barSize={20} radius={[0, 4, 4, 0]} animationDuration={500}>
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getRiskColor(entry.risk)} />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Telemetry Section */}
          <div className="bg-sentinel-800 p-6 rounded-xl border border-sentinel-700 shadow-lg flex-shrink-0">
             <div className="flex justify-between items-center mb-4">
                <h4 className="text-white font-bold flex items-center gap-2">
                   <IconSnowflake className="w-5 h-5 text-sky-400" />
                   Sector Telemetry
                </h4>
                <span className="text-[10px] font-mono text-slate-500 uppercase">Live Sensor Feed</span>
             </div>
             
             <div className="grid grid-cols-1 gap-3">
                {telemetryData.map((t, i) => (
                   <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-sentinel-900/50 border border-sentinel-700/50 hover:border-sky-500/30 transition-all group">
                      <div className="flex flex-col">
                         <span className="text-sm font-bold text-slate-200 group-hover:text-sky-300 transition-colors">{t.zone}</span>
                         <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5" title="Snow Depth">
                               <span className="text-sky-500">↕</span> {t.depth}
                            </span>
                            <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5" title="Precipitation (24h)">
                               <span className="text-indigo-400">💧</span> {t.precip}
                            </span>
                            <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5" title="Temperature">
                               <span className="text-rose-400">🌡</span> {t.temp}
                            </span>
                         </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                           t.trend === 'Critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                           t.trend === 'Unstable' || t.trend === 'High Risk' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                           'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                          {t.trend}
                      </div>
                   </div>
                ))}
             </div>
          </div>

          {/* NEW SECTION: Snow Depth Trends */}
          <div className="bg-sentinel-800 p-6 rounded-xl border border-sentinel-700 shadow-lg flex-shrink-0">
             <div className="flex justify-between items-center mb-4">
                <h4 className="text-white font-bold flex items-center gap-2">
                   <IconActivity className="w-5 h-5 text-indigo-400" />
                   24h Snow Accumulation
                </h4>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {telemetryData.map((t, i) => (
                   <div key={i} className="p-3 rounded-lg bg-sentinel-900/50 border border-sentinel-700/50 hover:border-indigo-500/30 transition-all flex flex-col justify-between h-28">
                      <div className="flex justify-between items-start">
                         <div>
                             <span className="text-xs font-bold text-slate-300 block">{t.zone}</span>
                             <span className="text-[10px] text-slate-500 font-mono">RATE: +1.2cm/h</span>
                         </div>
                         <span className="text-sm font-mono font-bold text-indigo-300">{t.depth}</span>
                      </div>
                      <div className="h-14 w-full mt-2">
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={zoneTrends[t.zone]}>
                               <defs>
                                  <linearGradient id={`trendGradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                                     <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                                     <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                                  </linearGradient>
                               </defs>
                               <Area 
                                  type="monotone" 
                                  dataKey="depth" 
                                  stroke="#818cf8" 
                                  strokeWidth={2} 
                                  fill={`url(#trendGradient-${i})`} 
                                  isAnimationActive={true}
                                  animationDuration={1500}
                               />
                            </AreaChart>
                         </ResponsiveContainer>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          {/* Configuration Panel */}
          <div className="bg-sentinel-800 p-6 rounded-xl border border-sentinel-700 shadow-lg flex-shrink-0">
            <div className="flex justify-between items-center mb-6 border-b border-sentinel-700 pb-4">
              <h4 className="text-white font-bold flex items-center gap-2">
                  <IconAlertTriangle className="w-5 h-5 text-warning-500" />
                  Prediction & Alert Settings
              </h4>
              <button 
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-sentinel-900 hover:bg-sentinel-700 text-sky-400 rounded-lg text-xs font-bold transition-colors border border-sentinel-700"
              >
                <IconHistory className="w-3 h-3" />
                HISTORY
                {history.length > 0 && (
                  <span className="bg-sky-500 text-white text-[10px] px-1.5 rounded-full">{history.length}</span>
                )}
              </button>
            </div>

            {/* Threshold Control */}
            <div className="mb-8">
              <div className="flex justify-between items-end mb-4">
                <label className="text-sm font-medium text-slate-300">Alert Threshold</label>
                <div className="flex items-center gap-2 bg-sentinel-900 px-3 py-1 rounded border border-sentinel-700">
                    <span className={`w-2 h-2 rounded-full ${alertThreshold < 50 ? 'bg-emerald-500' : alertThreshold < 80 ? 'bg-orange-500' : 'bg-red-500'}`}></span>
                    <span className="font-mono text-sky-400 font-bold">{alertThreshold}%</span>
                </div>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                value={alertThreshold} 
                onChange={(e) => setAlertThreshold(Number(e.target.value))}
                className="w-full h-2 bg-sentinel-900 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400 transition-all"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
                <span>ALL RISKS</span>
                <span>CRITICAL ONLY</span>
              </div>
            </div>

            {/* Audience Control */}
            <div>
              <label className="text-sm font-medium text-slate-300 mb-4 block">Notification Protocol</label>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                  {/* Option 1: Researchers */}
                  <button 
                    onClick={() => setAudience('researchers')}
                    className={`p-3 rounded-xl border-2 text-left transition-all duration-200 relative overflow-hidden group ${
                      audience === 'researchers' 
                      ? 'bg-indigo-900/20 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.15)]' 
                      : 'bg-sentinel-900 border-sentinel-700 hover:border-sentinel-600 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-2">
                          <IconCpu className={`w-4 h-4 ${audience === 'researchers' ? 'text-indigo-400' : 'text-slate-400'}`} />
                          <span className={`text-sm font-bold ${audience === 'researchers' ? 'text-indigo-100' : 'text-slate-300'}`}>Scientific</span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-slate-400 mt-auto">Shear stress metrics & metamorphism data.</p>
                    </div>
                  </button>

                  {/* Option 2: Communities */}
                  <button 
                    onClick={() => setAudience('communities')}
                    className={`p-3 rounded-xl border-2 text-left transition-all duration-200 relative overflow-hidden group ${
                      audience === 'communities' 
                      ? 'bg-emerald-900/20 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
                      : 'bg-sentinel-900 border-sentinel-700 hover:border-sentinel-600 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-2">
                          <IconGlobe className={`w-4 h-4 ${audience === 'communities' ? 'text-emerald-400' : 'text-slate-400'}`} />
                          <span className={`text-sm font-bold ${audience === 'communities' ? 'text-emerald-100' : 'text-slate-300'}`}>Community</span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-slate-400 mt-auto">Evacuation orders & road closures.</p>
                    </div>
                  </button>

                  {/* Option 3: Public (Climbers/Tourists) */}
                  <button 
                    onClick={() => setAudience('public')}
                    className={`p-3 rounded-xl border-2 text-left transition-all duration-200 relative overflow-hidden group ${
                      audience === 'public' 
                      ? 'bg-orange-900/20 border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.15)]' 
                      : 'bg-sentinel-900 border-sentinel-700 hover:border-sentinel-600 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-2">
                          <IconMountain className={`w-4 h-4 ${audience === 'public' ? 'text-orange-400' : 'text-slate-400'}`} />
                          <span className={`text-sm font-bold ${audience === 'public' ? 'text-orange-100' : 'text-slate-300'}`}>General Public</span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-slate-400 mt-auto">Travel advisories & route safety.</p>
                    </div>
                  </button>
              </div>
            </div>
          </div>

          {/* Thermal Map */}
          <div className="bg-sentinel-800 rounded-xl overflow-hidden border border-sentinel-700 relative h-48 flex-shrink-0">
            <img 
              src="https://picsum.photos/seed/snowmount/800/400" 
              className="w-full h-full object-cover opacity-50 mix-blend-luminosity" 
              alt="Terrain"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-sentinel-900 to-transparent"></div>
            <div className="absolute top-1/4 left-1/4 w-24 h-24 bg-red-500/30 blur-xl rounded-full animate-pulse"></div>
            <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-orange-500/20 blur-xl rounded-full"></div>
            
            <div className="absolute bottom-4 left-4">
              <h4 className="text-white font-bold text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                Live Thermal Instability Overlay
              </h4>
            </div>
          </div>
        </div>

        <div className="h-full min-h-[500px]">
          <AnalysisPanel 
            title="Avalanche Prediction Engine" 
            markdown={aiState.markdown} 
            loading={aiState.loading} 
            onAnalyze={handleAnalysis}
            onExport={handleExport}
            onSave={handleSave}
            isThinking={aiState.isThinking}
          />
        </div>
      </div>

      {/* History Modal Overlay */}
      {showHistory && (
        <div className="absolute inset-0 z-50 bg-sentinel-900/95 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between p-6 border-b border-sentinel-700 bg-sentinel-900">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-500/10 rounded-lg">
                <IconHistory className="w-6 h-6 text-sky-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Alert Generation Log</h2>
                <p className="text-xs text-slate-400 font-mono">AUDIT TRAIL: IMMUTABLE</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
                {history.length > 0 && (
                    <button
                        onClick={handleSaveAllLogs}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            historySaved 
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' 
                            : 'bg-sentinel-800 text-slate-400 border-sentinel-700 hover:text-white hover:border-sentinel-600'
                        }`}
                    >
                        {historySaved ? <IconCheck className="w-3 h-3" /> : <IconSave className="w-3 h-3" />}
                        {historySaved ? 'SAVED' : 'SAVE ALL TO LOCAL'}
                    </button>
                )}
                <button 
                onClick={() => setShowHistory(false)}
                className="p-2 hover:bg-sentinel-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                <IconX className="w-6 h-6" />
                </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <IconHistory className="w-16 h-16 mb-4 opacity-20" />
                <p>No alerts generated in this session.</p>
              </div>
            ) : (
              <div className="space-y-4 max-w-4xl mx-auto">
                {history.map((log) => (
                  <div key={log.id} className="bg-sentinel-800 border border-sentinel-700 rounded-xl overflow-hidden shadow-lg transition-all hover:border-sentinel-600">
                    <div 
                      className="p-4 flex items-center gap-6 cursor-pointer hover:bg-sentinel-700/30 transition-colors"
                      onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                    >
                      <div className="flex flex-col items-center min-w-[80px]">
                        <span className="text-xs font-mono text-slate-400">{log.timestamp.split(',')[0]}</span>
                        <span className="text-sm font-bold text-white">{log.timestamp.split(',')[1]}</span>
                      </div>

                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Risk Level</p>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold ${
                            log.riskLevel === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                            log.riskLevel === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' :
                            log.riskLevel === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20' :
                            'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              log.riskLevel === 'Critical' ? 'bg-red-500' :
                              log.riskLevel === 'High' ? 'bg-orange-500' :
                              log.riskLevel === 'Moderate' ? 'bg-yellow-500' :
                              'bg-emerald-500'
                            }`}></span>
                            {log.riskLevel}
                          </span>
                        </div>

                        <div>
                           <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Affected Zones</p>
                           <p className="text-sm text-slate-200 truncate" title={log.zones.join(', ')}>
                             {log.zones.length > 0 ? log.zones.join(', ') : 'None'}
                           </p>
                        </div>

                         <div>
                           <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Audience</p>
                           <div className="flex items-center gap-1.5">
                             {log.audience === 'researchers' && <IconCpu className="w-3 h-3 text-indigo-400"/>}
                             {log.audience === 'communities' && <IconGlobe className="w-3 h-3 text-emerald-400"/>}
                             {log.audience === 'public' && <IconMountain className="w-3 h-3 text-orange-400"/>}
                             <span className={`text-sm ${
                               log.audience === 'researchers' ? 'text-indigo-300' : 
                               log.audience === 'communities' ? 'text-emerald-300' : 
                               'text-orange-300'
                             }`}>
                               {log.audience === 'researchers' ? 'Scientific' : log.audience === 'communities' ? 'Public' : 'General Public'}
                             </span>
                           </div>
                        </div>

                        <div>
                           <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Threshold</p>
                           <p className="text-sm font-mono text-slate-300">
                             &gt;{log.threshold}%
                           </p>
                        </div>
                      </div>

                      <div className="text-slate-400">
                        {expandedLogId === log.id ? <IconX className="w-5 h-5" /> : <span className="text-2xl leading-none">+</span>}
                      </div>
                    </div>

                    {expandedLogId === log.id && (
                      <div className="p-6 bg-sentinel-900/50 border-t border-sentinel-700 animate-in slide-in-from-top-2">
                        <div className="prose prose-sm prose-invert prose-sky max-w-none">
                          <ReactMarkdown>{log.message}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AvalancheView;