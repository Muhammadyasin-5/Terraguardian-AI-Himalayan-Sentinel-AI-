import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { IconMountain, IconSnowflake, IconActivity, IconAlertTriangle, IconGlobe, IconMap, IconDownload, IconX, IconCpu, IconShare, IconPlus, IconMinus, IconLocate, IconLayers, IconSun, IconBeaker } from './Icons';
import { MetricCardProps, AiResponse } from '../types';
import AnalysisPanel from './AnalysisPanel';
import { generateDeepThinkingInsight } from '../services/geminiService';

interface RiskZone {
  id: string;
  name: string;
  x: number; // Percentage from left
  y: number; // Percentage from top
  riskLevel: 'Critical' | 'High' | 'Moderate' | 'Low';
  riskScore: number;
  details: string;
  metric: string;
  gpsAccuracy?: number; // In meters
}

interface LithologyUnit {
  id: string;
  name: string;
  type: string;
  age: string;
  description: string;
  composition: string;
  color: string;
  height: string;
}

interface FaultSystem {
  id: string;
  name: string;
  type: string;
  activity: string;
  path: string;
  description: string;
  color: string;
  strokeDash?: string;
  labelPos: { x: number; y: number };
}

const ZONES: RiskZone[] = [
  { id: 'z1', name: 'Rupal Face', x: 45, y: 30, riskLevel: 'Critical', riskScore: 92, details: 'Deep slab instability detected. High shear stress on lower slopes.', metric: 'Depth: 2.4m', gpsAccuracy: 35 },
  { id: 'z2', name: 'Rakhiot Flank', x: 65, y: 25, riskLevel: 'High', riskScore: 85, details: 'Wind slab formation on leeward slopes due to recent storm.', metric: 'Load: 450kg/m²', gpsAccuracy: 18 },
  { id: 'z3', name: 'Chungphar Sector', x: 60, y: 55, riskLevel: 'Moderate', riskScore: 42, details: 'Rapid melt destabilizing seracs. Monitor icefall frequency.', metric: 'Melt: 4.2cm/day', gpsAccuracy: 12 },
  { id: 'z4', name: 'Diamir Base', x: 28, y: 50, riskLevel: 'Low', riskScore: 25, details: 'Stable snowpack. Low probability of wet loose avalanches.', metric: 'Temp: -8°C', gpsAccuracy: 5 },
  { id: 'z5', name: 'Mazeno Ridge', x: 50, y: 70, riskLevel: 'High', riskScore: 78, details: 'Cornice buildup observed. Trigger likely on heavy loading.', metric: 'Wind: 65km/h', gpsAccuracy: 42 },
];

const LITHOLOGY_DATA: LithologyUnit[] = [
  { 
    id: 'l1', 
    name: 'Tato Leucogranite', 
    type: 'Intrusive Pluton', 
    age: 'Pliocene (1-3 Ma)', 
    description: 'Youngest intrusive sheets. Formed by rapid decompression melting of the crust during fast exhumation.', 
    composition: 'Qtz + Kfs + Plag + Tur',
    color: 'bg-pink-400',
    height: '15%'
  },
  { 
    id: 'l2', 
    name: 'Mito Cover Sequence', 
    type: 'Metasedimentary Cover', 
    age: 'Paleozoic', 
    description: 'Folded bands of calc-silicates, marbles, and amphibolites wrapping the core.', 
    composition: 'Marble + Amphibolite',
    color: 'bg-emerald-700',
    height: '25%'
  },
  { 
    id: 'l3', 
    name: 'Iskere Gneiss', 
    type: 'Syntaxis Core', 
    age: 'Proterozoic (1.8 Ga)', 
    description: 'Massive biotite-rich orthogneiss forming the structural heart of the syntaxis.', 
    composition: 'Bio-Orthogneiss',
    color: 'bg-slate-600',
    height: '35%'
  },
  { 
    id: 'l4', 
    name: 'Shengus Gneiss', 
    type: 'Basement Complex', 
    age: 'Archean / Proterozoic', 
    description: 'Deepest basement rock, heavily migmatized and deformed by the syntaxial pop-up.', 
    composition: 'Migmatitic Gneiss',
    color: 'bg-stone-800',
    height: '25%'
  }
];

const FAULT_DATA: FaultSystem[] = [
  {
    id: 'f1',
    name: 'Main Mantle Thrust (MMT)',
    type: 'Tectonic Suture',
    activity: 'Re-activated',
    path: 'M 20,85 C 5,50 30,10 50,8 C 80,10 95,50 85,85',
    description: 'The defining suture zone separating the Indian Plate from the Kohistan Island Arc. It loops around the entire Nanga Parbat-Haramosh Syntaxis.',
    color: '#ef4444',
    strokeDash: '5,5',
    labelPos: { x: 50, y: 12 }
  },
  {
    id: 'f2',
    name: 'Raikot Fault',
    type: 'Active Normal/Thrust',
    activity: 'Critical (Holocene)',
    path: 'M 40,30 Q 35,50 30,70',
    description: 'The western bounding fault driving extreme relief and exhumation rates. Associated with the Tato hot springs and rapid uplift.',
    color: '#f59e0b',
    labelPos: { x: 32, y: 50 }
  },
  {
    id: 'f3',
    name: 'Diamir Shear Zone',
    type: 'Ductile Shear',
    activity: 'Continuous',
    path: 'M 45,35 Q 40,45 35,60',
    description: 'A zone of intense ductile deformation enabling the upward extrusion of the core gneisses.',
    color: '#fbbf24',
    strokeDash: '2,2',
    labelPos: { x: 38, y: 40 }
  },
  {
    id: 'f4',
    name: 'Stak Fault',
    type: 'Thrust System',
    activity: 'Active',
    path: 'M 65,30 Q 75,50 80,70',
    description: 'Eastern structural boundary contributing to the pop-up mechanics of the syntaxis.',
    color: '#fbbf24',
    labelPos: { x: 78, y: 60 }
  }
];

const LAYER_CONFIG = [
  { id: 'Satellite', icon: IconGlobe, label: 'Sat' },
  { id: 'Thermal', icon: IconActivity, label: 'Therm' },
  { id: 'Topographic', icon: IconMap, label: 'Topo' },
  { id: 'Terrain', icon: IconMountain, label: 'Terr' },
  { id: 'Ridge', icon: IconMountain, label: 'Ridge' },
  { id: 'Diagram', icon: IconBeaker, label: 'Diag' },
];

const getRiskPinColor = (level: string) => {
   switch (level) {
    case 'Critical': return 'bg-red-500 shadow-[0_0_25px_rgba(239,68,68,1)] border-red-100 ring-2 ring-red-500/50';
    case 'High': return 'bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.9)] border-orange-200';
    case 'Moderate': return 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.7)] border-yellow-200';
    default: return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] border-emerald-200';
  }
}

const getPulseSpeed = (level: string) => {
  switch (level) {
    case 'Critical': return '0.8s';
    case 'High': return '1.5s';
    case 'Moderate': return '3s';
    default: return '4s';
  }
}

const getPulseOpacity = (level: string) => {
  switch (level) {
    case 'Critical': return 'opacity-100';
    case 'High': return 'opacity-70';
    case 'Moderate': return 'opacity-40';
    default: return 'opacity-20';
  }
}

const getSelectionRing = (level: string) => {
   switch (level) {
    case 'Critical': return 'border-red-500';
    case 'High': return 'border-orange-500';
    case 'Moderate': return 'border-yellow-500';
    default: return 'border-emerald-500';
  }
}

const getPanelBorder = (level: string) => {
  switch (level) {
    case 'Critical': return 'border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.2)]';
    case 'High': return 'border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.2)]';
    case 'Moderate': return 'border-yellow-500 shadow-[0_0_40px_rgba(234,179,8,0.2)]';
    default: return 'border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.2)]';
  }
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, trend, icon }) => (
  <div className="bg-sentinel-800 p-6 rounded-xl border border-sentinel-700 hover:border-sky-500/50 transition-colors shadow-lg group">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-sentinel-900 rounded-lg text-sky-400 group-hover:text-sky-300 transition-colors">
        {icon}
      </div>
      {change && (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          trend === 'down' ? 'bg-red-500/10 text-red-400' : 
          trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-300'
        }`}>
          {change}
        </span>
      )}
    </div>
    <p className="text-slate-400 text-sm font-medium">{title}</p>
    <div className="flex items-baseline gap-2 mt-1">
      <h3 className="text-3xl font-bold text-white font-mono min-w-[100px]">{value}</h3>
      {title === "Daily Melt Volume" && (
         <span className="flex w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
      )}
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [selectedZone, setSelectedZone] = useState<RiskZone | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());
  const [activeLayer, setActiveLayer] = useState<string>('Satellite');
  const [showTerrain, setShowTerrain] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState(false);
  
  // Layer Control State
  const [showLayerControls, setShowLayerControls] = useState(false);
  const [showRiskLayer, setShowRiskLayer] = useState(false);
  const [showLithology, setShowLithology] = useState(false);
  const [showFaults, setShowFaults] = useState(false); // New Faults State
  const [riskOpacity, setRiskOpacity] = useState(40);
  const [terrainOpacity, setTerrainOpacity] = useState(100);
  const [solarIntensity, setSolarIntensity] = useState(50);

  // Map View State (Pan/Zoom)
  const [viewState, setViewState] = useState({ x: 0, y: 0, scale: 1.2 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);

  // Sun Simulation State for Dynamic Shading
  const [sunPosition, setSunPosition] = useState(45); // Degrees

  // Simulate Sun Movement
  useEffect(() => {
    const interval = setInterval(() => {
      setSunPosition(prev => (prev + 0.15) % 360);
    }, 50); 
    return () => clearInterval(interval);
  }, []);
  
  // Analysis State
  const [viewMode, setViewMode] = useState<'details' | 'analysis'>('details');
  const [aiState, setAiState] = useState<AiResponse>({
    markdown: '',
    loading: false,
    isThinking: false
  });

  // Reset analysis view when zone changes or closes
  useEffect(() => {
    if (selectedZone) {
        setViewMode('details');
        setAiState({ markdown: '', loading: false, isThinking: false });
    }
  }, [selectedZone]);
  
  // Real-time Metrics State
  const [metrics, setMetrics] = useState({
    iceThickness: 142.00,
    meltVolume: 420,
    activeSensors: 84,
    exhumationRate: 9.2 // mm/yr
  });

  // Dynamic Telemetry Data for Graph
  const zoneTelemetry = useMemo(() => {
    if (!selectedZone) return [];
    
    // Parse metric string (e.g. "Depth: 2.4m")
    const parts = selectedZone.metric.split(':');
    const label = parts[0].trim(); // "Depth"
    const rawValue = parts[1].trim(); // "2.4m"
    const numericValue = parseFloat(rawValue.replace(/[^\d.-]/g, ''));
    const unit = rawValue.replace(/[\d.-]/g, '').trim(); // "m"

    const now = new Date();
    const currentHour = now.getHours();
    
    return Array.from({ length: 7 }, (_, i) => {
      const hour = (currentHour - 6 + i + 24) % 24;
      // Generate somewhat realistic trend data with noise
      const noise = (Math.sin(hour * 0.5) * (numericValue * 0.2)) + ((Math.random() - 0.5) * (numericValue * 0.1));
      let val = numericValue + noise;
      
      // Basic clamps
      if (label.toLowerCase().includes('risk')) val = Math.min(100, Math.max(0, val));
      if (val < 0 && (label.toLowerCase().includes('depth') || label.toLowerCase().includes('load'))) val = 0;
      
      return {
        time: `${hour}:00`,
        value: Number(val.toFixed(1)),
        unit: unit,
        metric: label
      };
    });
  }, [selectedZone]);

  // Simulate real-time data feed
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date().toLocaleTimeString());
      setMetrics(prev => ({
        // Slight reduction to simulate constant melt
        iceThickness: Number((prev.iceThickness - (Math.random() * 0.005)).toFixed(3)),
        // Fluctuate melt volume
        meltVolume: Math.max(0, Math.floor(prev.meltVolume + (Math.random() * 15 - 5))),
        // Fluctuate uplift slightly (noise)
        exhumationRate: Number((9.2 + (Math.random() * 0.05)).toFixed(2)),
        activeSensors: prev.activeSensors
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Map Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag if not clicking a button/interactive element
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
    
    setIsDragging(true);
    hasDragged.current = false;
    dragStart.current = { x: e.clientX - viewState.x, y: e.clientY - viewState.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    
    if (Math.abs(dx - viewState.x) > 3 || Math.abs(dy - viewState.y) > 3) {
        hasDragged.current = true;
    }
    
    setViewState(prev => ({
      ...prev,
      x: dx,
      y: dy
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (delta: number) => {
    setViewState(prev => ({
        ...prev,
        scale: Math.min(Math.max(1, prev.scale + delta), 5)
    }));
  };

  const handleResetView = () => {
      setViewState({ x: 0, y: 0, scale: 1.2 });
  };

  const handleOverlayClick = () => {
      if (!hasDragged.current) {
          setSelectedZone(null);
      }
  };

  const handleDownloadSnapshot = () => {
    const dataToExport = {
        reportType: "Mission Control Snapshot",
        generatedAt: new Date().toISOString(),
        metrics: metrics,
        riskZones: ZONES,
        activeLayer: activeLayer,
        overlays: {
            contours: showTerrain,
            sunPosition: sunPosition,
            riskLayer: showRiskLayer,
            lithology: showLithology,
            faults: showFaults,
            layerSettings: {
               riskOpacity,
               terrainOpacity,
               solarIntensity
            }
        }
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentinel_dashboard_snapshot_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    setIsSharing(true);
    // In a real application, this would be a deep link with state parameters.
    const shareUrl = `${window.location.origin}${window.location.pathname}?snapshot=${Date.now()}`;
    navigator.clipboard.writeText(shareUrl);
    setTimeout(() => setIsSharing(false), 2000);
  };

  const handleZoneAnalysis = async () => {
     if (!selectedZone) return;
     setViewMode('analysis');
     
     // Only generate if we haven't already for this session/zone
     if (!aiState.markdown && !aiState.loading) {
         setAiState({ markdown: '', loading: true, isThinking: true });
         
         const prompt = `
           SYSTEM ALERT: TACTICAL ANALYSIS REQUEST
           Target Zone: ${selectedZone.name} (Nanga Parbat Massif)
           Risk Profile: ${selectedZone.riskLevel} (Index: ${selectedZone.riskScore})
           Live Telemetry: ${selectedZone.metric}
           Observation: ${selectedZone.details}

           Generate a high-priority Situation Report (SITREP) for the field command.
           Structure requirements:
           1. **Threat Assessment**: Physics-based analysis of the instability (e.g., shear stress, thermodynamics).
           2. **Projected Evolution**: 24-hour forecast based on current load and melt rates.
           3. **Tactical Directives**: 
              - Drone flight vectors for detailed scanning.
              - Ground team exclusion zones (geofenced).
              - Sensor recalibration requirements.
           
           Tone: Military-grade scientific precision. Urgent.
         `;

         try {
             const result = await generateDeepThinkingInsight(prompt);
             setAiState({ markdown: result, loading: false, isThinking: false });
         } catch (e) {
             console.error(e);
             setAiState({ markdown: "**Error:** Telemetry link unstable. Unable to generate analysis.", loading: false, isThinking: false });
         }
     }
  };

  const handleGeologyAnalysis = async () => {
     setSelectedZone({
         id: 'geo-master',
         name: 'Nanga Parbat-Haramosh Syntaxis',
         x: 0, y: 0,
         riskLevel: 'Critical',
         riskScore: 99,
         details: 'Rapid tectonic exhumation event within the Indus Suture Zone.',
         metric: 'Uplift: 10mm/yr'
     });
     setViewMode('analysis');
     setAiState({ markdown: '', loading: true, isThinking: true });

     const prompt = `
        **GEOLOGICAL & GEOMORPHOLOGICAL ANALYSIS: NANGA PARBAT-HARAMOSH SYNTAXIS**

        Provide a rigorous scientific explanation of the rapid exhumation of this crustal anomaly.
        
        Key Analysis Vectors:
        1. **The Syntaxial Structure**: Explain the orthogonal rotation of the strike relative to the main Himalaya, forming the Nanga Parbat-Haramosh loop.
        2. **The Tectonic Aneurysm Model**: Explain the feedback loop between the Indus River's rapid erosion (incision) and the crustal isostatic rebound. 
        3. **Vertical Uplift Dynamics**: Analyze the ~10mm/year uplift rate. Compare this to the surrounding Himalayan range.
        4. **Structural Geology**: Detail the role of the Raikot Fault and the Main Mantle Thrust (MMT). Mention the exposure of high-grade metamorphic rocks (migmatites/gneiss) from the deep crust.

        Tone: Advanced Geological Survey Report. Precise, academic, and authoritative.
     `;

     try {
         const result = await generateDeepThinkingInsight(prompt);
         setAiState({ markdown: result, loading: false, isThinking: false });
     } catch (e) {
         setAiState({ markdown: "Analysis failed due to API connectivity.", loading: false, isThinking: false });
     }
  };
  
  const handleLithologyUnitAnalysis = async (unit: LithologyUnit) => {
      setSelectedZone({
         id: `litho-${unit.id}`,
         name: unit.name,
         x: 0, y: 0,
         riskLevel: 'Moderate',
         riskScore: 50,
         details: unit.description,
         metric: `Age: ${unit.age}`
     });
     setViewMode('analysis');
     setAiState({ markdown: '', loading: true, isThinking: true });
     
     const prompt = `
        **LITHOLOGICAL ANALYSIS: ${unit.name.toUpperCase()}**
        
        Detailed Geological Characterization Request.
        Unit: ${unit.name} (${unit.type})
        Composition: ${unit.composition}
        Age: ${unit.age}
        
        Analysis Requirements:
        1. **Petrogenesis**: Explain the origin of this rock unit. (e.g., decompression melting for leucogranites, prograde metamorphism for gneisses).
        2. **Structural Context**: How does this unit fit into the Nanga Parbat Syntaxis structure? Is it part of the cover or the core?
        3. **Mineralogy**: Detail the significance of key minerals (e.g., Tourmaline, Cordierite, Biotite) found here.
        4. **Exhumation History**: What does this rock tell us about the P-T-t (Pressure-Temperature-time) path of the mountain?
        
        Tone: Senior Geologist / Petrologist.
     `;
     
     try {
         const result = await generateDeepThinkingInsight(prompt);
         setAiState({ markdown: result, loading: false, isThinking: false });
     } catch (e) {
         setAiState({ markdown: "Lithology analysis failed due to API connectivity.", loading: false, isThinking: false });
     }
  };
  
  const handleFaultAnalysis = async (fault: FaultSystem) => {
     setSelectedZone({
         id: `fault-${fault.id}`,
         name: fault.name,
         x: 0, y: 0,
         riskLevel: 'High',
         riskScore: 88,
         details: fault.description,
         metric: `Type: ${fault.type}`
     });
     setViewMode('analysis');
     setAiState({ markdown: '', loading: true, isThinking: true });

     const prompt = `
        **STRUCTURAL GEOLOGY ANALYSIS: ${fault.name.toUpperCase()}**

        Detailed Tectonic Analysis Request.
        Structure: ${fault.name}
        Type: ${fault.type}
        Activity Status: ${fault.activity}

        Analysis Requirements:
        1. **Kinematics**: Describe the movement vector (e.g., thrusting, normal faulting, strike-slip).
        2. **Exhumation Role**: How does this specific fault contribute to the 10mm/yr uplift of Nanga Parbat?
        3. **Seismic Hazard**: Assess the potential for major earthquakes associated with this structure.
        4. **Geothermal interaction**: Connection to hot springs (like Tato/Raikot) and fluid flow.

        Tone: Tectonics Specialist.
     `;
     
     try {
         const result = await generateDeepThinkingInsight(prompt);
         setAiState({ markdown: result, loading: false, isThinking: false });
     } catch (e) {
         setAiState({ markdown: "Fault analysis failed due to API connectivity.", loading: false, isThinking: false });
     }
  };

  const handleDeepSimulation = async () => {
     if (!selectedZone) return;
     setViewMode('analysis');
     setAiState({ markdown: '', loading: true, isThinking: true });

     const prompt = `
       INITIATE DEEP PHYSICS SIMULATION: ${selectedZone.name}
       
       Input Parameters:
       - Stability Index: ${selectedZone.riskScore}/100
       - Primary Driver: ${selectedZone.details}
       - Telemetry: ${selectedZone.metric}

       Execute a multi-variable Monte Carlo simulation (n=10,000) to predict catastrophic failure modes.
       
       Output Requirements:
       1. **Failure Probability**: quantitative probability of slab fracture within 48h.
       2. **Runout Modeling**: Detailed path prediction of debris flow including velocity and impact force.
       3. **Secondary Hazards**: Potential for glacial lake outburst or aerosol dispersion.
       4. **Mitigation Simulation**: Projected efficacy of controlled explosives vs. closures.

       Format as a high-level scientific computation log with timestamps and simulation steps.
     `;

     try {
         const result = await generateDeepThinkingInsight(prompt);
         setAiState({ markdown: result, loading: false, isThinking: false });
     } catch (e) {
         setAiState({ markdown: "Simulation failed due to API connectivity.", loading: false, isThinking: false });
     }
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Mission Control: Nanga Parbat Massif</h2>
            <p className="text-slate-400">Real-time telemetry and predictive monitoring.</p>
          </div>
          <div className="flex items-center gap-4">
             <button
                onClick={() => setShowFaults(!showFaults)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    showFaults 
                    ? 'bg-red-500/20 text-red-400 border-red-500/50' 
                    : 'bg-sentinel-800 text-slate-400 border-sentinel-700 hover:text-white hover:bg-sentinel-700'
                }`}
                title="View Major Fault Lines"
             >
                <IconActivity className="w-4 h-4" />
                FAULTS
             </button>
             <button
                onClick={() => setShowLithology(!showLithology)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    showLithology 
                    ? 'bg-amber-600/30 text-amber-300 border-amber-500/50' 
                    : 'bg-sentinel-800 text-slate-400 border-sentinel-700 hover:text-white hover:bg-sentinel-700'
                }`}
                title="View Rock Sequence / Stratigraphy"
             >
                <IconLayers className="w-4 h-4" />
                LITHOLOGY
             </button>
             <button
                onClick={handleGeologyAnalysis}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-300 rounded-lg text-xs font-bold transition-all border border-indigo-500/30 hover:border-indigo-400"
                title="View Geological Profile & Exhumation Data"
             >
                <IconMountain className="w-4 h-4" />
                GEOLOGICAL PROFILE
             </button>
             <button
                onClick={handleShare}
                className="flex items-center gap-2 px-3 py-1.5 bg-sentinel-800 hover:bg-sentinel-700 text-sky-400 rounded-lg text-xs font-bold transition-all border border-sentinel-700 hover:border-sky-500/50"
                title="Share Public Dashboard Link"
             >
                <IconShare className="w-4 h-4" />
                {isSharing ? 'COPIED!' : 'SHARE'}
             </button>
             <button
                onClick={handleDownloadSnapshot}
                className="flex items-center gap-2 px-3 py-1.5 bg-sentinel-800 hover:bg-sentinel-700 text-sky-400 rounded-lg text-xs font-bold transition-all border border-sentinel-700 hover:border-sky-500/50"
                title="Download Dashboard Report"
             >
                <IconDownload className="w-4 h-4" />
                EXPORT
             </button>
            <span className="text-xs font-mono text-slate-500 hidden sm:inline">Last updated: {lastUpdated}</span>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                LIVE
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="Avg. Ice Thickness" 
            value={`${metrics.iceThickness.toFixed(2)}m`} 
            change="-2.4m / yr" 
            trend="down"
            icon={<IconSnowflake />}
          />
          <MetricCard 
            title="Daily Melt Volume" 
            value={`${metrics.meltVolume}k L`} 
            change="+12%" 
            trend="down" // down meaning 'bad', actually number is up
            icon={<IconActivity />}
          />
          <MetricCard 
            title="Avalanche Risk" 
            value="High" 
            change="Level 4/5" 
            trend="down"
            icon={<IconAlertTriangle />}
          />
          <MetricCard 
            title="Vertical Exhumation" 
            value={`+${metrics.exhumationRate}mm/yr`} 
            change="Fastest on Earth" 
            trend="up"
            icon={<IconMountain />}
          />
        </div>

        {/* Main Map View */}
        <div className={`flex-1 min-h-[500px] bg-sentinel-900 rounded-2xl relative overflow-hidden group select-none shadow-2xl transition-all duration-500 border cursor-grab active:cursor-grabbing ${
          (activeLayer === 'Topographic') 
            ? 'border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/10' 
            : 'border-sentinel-700'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          
          {/* Movable World Container */}
          <div 
            className="w-full h-full absolute top-0 left-0 origin-center will-change-transform"
            style={{ 
                transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.scale})`,
                transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
              {/* Layer Rendering - Stacked images for smooth transition */}
              <div className="absolute inset-0 bg-sentinel-900">
                {/* Satellite Layer - Always Base Layer */}
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/e/e6/Nanga_Parbat_NASA_Earth_Observatory.jpg" 
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out opacity-100 z-0"
                  alt="The view of Nanga Parbat mountain, Pakistan - Satellite View"
                  title="The view of Nanga Parbat mountain, Pakistan"
                />

                {/* Satellite HUD Overlay - Only visible when Satellite is active base */}
                <div className={`absolute inset-0 pointer-events-none z-20 transition-opacity duration-500 ${activeLayer === 'Satellite' ? 'opacity-100' : 'opacity-0'}`}>
                    {/* Grid System */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
                    
                    {/* Central Crosshair */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white/10 rounded-full flex items-center justify-center">
                        <div className="w-1 h-1 bg-sky-400 rounded-full animate-pulse"></div>
                    </div>

                    {/* Scanning Effect */}
                    <div className="absolute inset-x-0 h-[1px] bg-sky-400/30 shadow-[0_0_10px_rgba(56,189,248,0.4)] animate-[pulse_3s_ease-in-out_infinite] top-1/2"></div>
                </div>
                
                {/* Thermal Layer */}
                <div 
                   className="absolute inset-0 w-full h-full transition-opacity duration-700 z-10"
                   style={{ opacity: activeLayer === 'Thermal' ? 1 : 0 }}
                >
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/e/e6/Nanga_Parbat_NASA_Earth_Observatory.jpg" 
                      className="absolute inset-0 w-full h-full object-cover filter grayscale invert contrast-[1.5] brightness-90"
                      alt="The view of Nanga Parbat mountain, Pakistan - Thermal Analysis"
                      title="The view of Nanga Parbat mountain, Pakistan"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-800 to-orange-400 mix-blend-hard-light opacity-90"></div>
                    {/* Hotspots */}
                    <div className="absolute top-[30%] left-[45%] w-24 h-24 bg-orange-500/40 rounded-full blur-xl animate-pulse mix-blend-screen"></div>
                    <div className="absolute top-[25%] left-[65%] w-16 h-16 bg-red-500/30 rounded-full blur-xl animate-pulse delay-700 mix-blend-screen"></div>
                </div>

                {/* Topographic Layer */}
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Nanga_Parbat_Karte_1936.jpg/1280px-Nanga_Parbat_Karte_1936.jpg" 
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out contrast-110 brightness-105 z-10"
                  style={{ opacity: activeLayer === 'Topographic' ? 1 : 0 }}
                  alt="The view of Nanga Parbat mountain, Pakistan - Topographic Map"
                  title="The view of Nanga Parbat mountain, Pakistan"
                />

                {/* Terrain Layer (Simulated 3D) */}
                <div 
                    className="absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out z-10 bg-slate-800"
                    style={{ opacity: activeLayer === 'Terrain' ? 1 : 0 }}
                >
                    <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Nanga_Parbat_massif_from_space.jpg/1280px-Nanga_Parbat_massif_from_space.jpg" 
                        className="absolute inset-0 w-full h-full object-cover filter contrast-125 sepia-[0.3]"
                        style={{ opacity: terrainOpacity / 100 }}
                        alt="The view of Nanga Parbat mountain, Pakistan - Terrain Model"
                        title="The view of Nanga Parbat mountain, Pakistan"
                    />
                    {/* Synthetic Mesh Overlay */}
                    <div className="absolute inset-0 opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
                </div>

                {/* Ridge Layer */}
                <img 
                  src="https://picsum.photos/seed/himalaya_ridge/1600/900" 
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out grayscale contrast-[1.2] brightness-90 z-10"
                  style={{ opacity: activeLayer === 'Ridge' ? 1 : 0 }}
                  alt="The view of Nanga Parbat mountain, Pakistan - Ridge Line"
                  title="The view of Nanga Parbat mountain, Pakistan"
                />

                {/* Risk Layer (Independent Overlay) */}
                <img 
                  src="https://picsum.photos/seed/himalaya_dark/1600/900" 
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out grayscale brightness-75 mix-blend-multiply z-20 pointer-events-none"
                  style={{ opacity: showRiskLayer ? riskOpacity / 100 : 0 }}
                  alt="The view of Nanga Parbat mountain, Pakistan - Risk Zone"
                  title="The view of Nanga Parbat mountain, Pakistan"
                />

                {/* Dynamic Hillshade / Terrain Relief (Procedural) */}
                {(activeLayer === 'Topographic' || activeLayer === 'Terrain') && (
                    <div 
                        className="absolute inset-0 z-20 pointer-events-none mix-blend-soft-light transition-opacity duration-700"
                        style={{ opacity: solarIntensity / 60 }} // Adjusted intensity
                    >
                        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                            <filter id="hillshade-filter">
                                 {/* Create rugged terrain texture */}
                                <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="4" seed="5" result="noise" />
                                
                                {/* 
                                   Dynamic Lighting:
                                   - azimuth: sunPosition (rotating)
                                   - elevation: 25 (low angle for dramatic shadows)
                                   - surfaceScale: 20 (high value = steep slopes)
                                */}
                                <feDiffuseLighting in="noise" lightingColor="#ffffff" surfaceScale="20" diffuseConstant="1.5" result="light">
                                    <feDistantLight azimuth={sunPosition - 90} elevation={25} />
                                </feDiffuseLighting>
                                
                                {/* Enhance contrast to define ridges */}
                                <feComponentTransfer in="light" result="shaded">
                                     <feFuncR type="linear" slope="2.5" intercept="-0.7"/>
                                     <feFuncG type="linear" slope="2.5" intercept="-0.7"/>
                                     <feFuncB type="linear" slope="2.5" intercept="-0.7"/>
                                </feComponentTransfer>
                            </filter>
                            <rect width="100%" height="100%" filter="url(#hillshade-filter)" fill="transparent" />
                        </svg>
                    </div>
                )}

                {/* Ambient Solar Gradient (General Directionality) */}
                <div 
                    className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-700 mix-blend-overlay"
                    style={{
                      background: `linear-gradient(${sunPosition}deg, rgba(0,0,0,0.4) 0%, transparent 50%, rgba(255,255,255,0.2) 100%)`,
                      opacity: solarIntensity / 100
                    }}
                />

                {/* Risk Overlay Pattern (Only visible if Risk Layer is on) */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay transition-opacity duration-700 z-20 pointer-events-none"
                     style={{ opacity: showRiskLayer ? 0.4 : 0 }}>
                </div>
                
                {/* Terrain / Contour Overlay - ENHANCED */}
                <div className={`absolute inset-0 z-20 pointer-events-none transition-opacity duration-700 ${showTerrain ? 'opacity-100' : 'opacity-0'}`}>
                    <svg className="w-full h-full opacity-50 mix-blend-plus-lighter" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <defs>
                            <linearGradient id="elevation-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="white" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="white" stopOpacity="0.1" />
                            </linearGradient>
                        </defs>
                        
                        <g stroke="url(#elevation-gradient)" strokeWidth="0.1" fill="none">
                            {/* Summit Region (High elevation, tight lines) */}
                            <ellipse cx="55" cy="25" rx="2" ry="1.5" strokeWidth="0.2" />
                            <ellipse cx="55" cy="25" rx="5" ry="3.5" />
                            <path d="M48,25 Q55,18 62,25 T48,25" />
                            
                            {/* Rakhiot Face (Steep gradients) */}
                            <path d="M45,20 Q55,10 65,20 T75,30" />
                            <path d="M42,18 Q55,5 68,18 T80,35" />
                            <path d="M40,15 Q55,0 70,15 T85,40" />

                            {/* Diamir Face (West) */}
                            <path d="M45,30 Q30,35 25,50" />
                            <path d="M48,32 Q32,40 28,60" />
                            <path d="M50,35 Q35,45 30,70" />

                            {/* Rupal Face (South - Very Steep) */}
                            <path d="M50,30 Q55,50 50,70" />
                            <path d="M55,32 Q60,55 55,75" />
                            <path d="M60,35 Q65,60 60,80" />
                            <path d="M65,38 Q70,65 65,85" />

                            {/* Lower Slopes (Broader curves) */}
                            <path d="M10,80 Q30,70 50,85 T90,80" opacity="0.5" />
                            <path d="M5,85 Q25,75 55,90 T95,85" opacity="0.5" />
                            <path d="M0,90 Q40,85 100,95" opacity="0.3" />
                            
                            {/* Topo Labels */}
                            <g fill="rgba(255,255,255,0.5)" fontSize="1.5" fontFamily="monospace" stroke="none">
                                <text x="58" y="24">8126m</text>
                                <text x="70" y="35">7000m</text>
                                <text x="30" y="50">6000m</text>
                                <text x="50" y="80">4500m</text>
                            </g>
                        </g>
                    </svg>
                </div>

                {/* GEOLOGICAL LITHOLOGY OVERLAY (New Map Representation) */}
                {showLithology && (
                    <div className="absolute inset-0 z-20 transition-opacity duration-700 pointer-events-auto">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <defs>
                                <pattern id="diag-gneiss" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
                                    <path d="M0,2 Q1,0 2,2 T4,2" fill="none" stroke="white" strokeWidth="0.1" opacity="0.3" />
                                </pattern>
                                <pattern id="diag-granite" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
                                    <circle cx="1.5" cy="1.5" r="0.2" fill="white" opacity="0.4" />
                                </pattern>
                                <pattern id="diag-marble" x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
                                    <path d="M0,0 L5,5 M5,0 L0,5" stroke="white" strokeWidth="0.05" opacity="0.2" />
                                </pattern>
                            </defs>
                            
                            {/* Outer Layer: Shengus Gneiss */}
                            <path 
                                d="M 20,80 C 10,60 30,20 50,15 C 70,20 90,60 80,80 C 70,95 30,95 20,80 Z" 
                                fill="#292524" fillOpacity="0.4" stroke="#44403c" strokeWidth="0.2"
                                className="cursor-pointer hover:fill-opacity-60 transition-all"
                                onClick={(e) => { e.stopPropagation(); handleLithologyUnitAnalysis(LITHOLOGY_DATA[3]); }}
                            />
                            <rect x="20" y="15" width="60" height="70" fill="url(#diag-gneiss)" pointerEvents="none" opacity="0.3" />

                            {/* Middle Layer: Mito Cover Sequence */}
                            <path 
                                d="M 30,75 C 25,60 35,35 50,30 C 65,35 75,60 70,75 C 65,85 35,85 30,75 Z" 
                                fill="#065f46" fillOpacity="0.5" stroke="#064e3b" strokeWidth="0.2"
                                className="cursor-pointer hover:fill-opacity-70 transition-all"
                                onClick={(e) => { e.stopPropagation(); handleLithologyUnitAnalysis(LITHOLOGY_DATA[1]); }}
                            />
                            <rect x="25" y="30" width="50" height="50" fill="url(#diag-marble)" pointerEvents="none" opacity="0.3" />

                            {/* Core Layer: Iskere Gneiss */}
                            <path 
                                d="M 40,65 C 38,55 42,45 50,42 C 58,45 62,55 60,65 C 58,72 42,72 40,65 Z" 
                                fill="#475569" fillOpacity="0.6" stroke="#334155" strokeWidth="0.3"
                                className="cursor-pointer hover:fill-opacity-80 transition-all"
                                onClick={(e) => { e.stopPropagation(); handleLithologyUnitAnalysis(LITHOLOGY_DATA[2]); }}
                            />
                            
                            {/* Intrusions: Tato Leucogranite */}
                            <circle 
                                cx="52" cy="45" r="3" fill="#f472b6" fillOpacity="0.8" stroke="#ec4899" strokeWidth="0.2"
                                className="cursor-pointer hover:scale-110 transition-transform origin-center"
                                onClick={(e) => { e.stopPropagation(); handleLithologyUnitAnalysis(LITHOLOGY_DATA[0]); }}
                            />
                            <circle 
                                cx="48" cy="48" r="2.5" fill="#f472b6" fillOpacity="0.8" stroke="#ec4899" strokeWidth="0.2"
                                className="cursor-pointer hover:scale-110 transition-transform origin-center"
                                onClick={(e) => { e.stopPropagation(); handleLithologyUnitAnalysis(LITHOLOGY_DATA[0]); }}
                            />
                            <rect x="45" y="42" width="10" height="10" fill="url(#diag-granite)" pointerEvents="none" opacity="0.5" />
                        </svg>
                    </div>
                )}

                {/* SCHEMATIC DIAGRAM LAYER (New) */}
                {activeLayer === 'Diagram' && (
                    <div className="absolute inset-0 z-20 bg-[#1a5276] overflow-hidden transition-opacity duration-500">
                        {/* Sky Gradient Effect */}
                        <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-[#1a5276] to-[#3498db] opacity-50"></div>
                        
                        {/* Stars */}
                        <div className="absolute inset-0 opacity-80">
                             {[...Array(20)].map((_, i) => (
                                 <div 
                                    key={i} 
                                    className="absolute bg-white rounded-full animate-pulse"
                                    style={{
                                        top: `${Math.random() * 40}%`,
                                        left: `${Math.random() * 100}%`,
                                        width: `${Math.random() * 3 + 1}px`,
                                        height: `${Math.random() * 3 + 1}px`,
                                        animationDelay: `${Math.random() * 2}s`
                                    }}
                                 ></div>
                             ))}
                        </div>

                        <svg className="w-full h-full relative z-10" viewBox="0 0 140 110" preserveAspectRatio="none">
                            {/* Moon */}
                            <circle cx="120" cy="20" r="4" fill="#f7dc6f" stroke="#f4d03f" strokeWidth="0.5" />
                            <circle cx="119" cy="20" r="3.5" fill="#1a5276" />
                            <text x="120" y="28" fontSize="3" fill="#f4d03f" textAnchor="middle" fontWeight="bold">7:37 PM</text>

                            {/* Ground */}
                            <rect x="0" y="50" width="140" height="60" fill="#2e4053" opacity="0.9" />

                            {/* Shadow Mountain (Back) */}
                            <polygon 
                                points="80,90 100,50 120,40 130,50 135,70 130,90" 
                                fill="#34495e" stroke="#2c3e50" strokeWidth="2"
                            />
                            <text x="105" y="70" fontSize="4" fontWeight="bold" fill="#ecf0f1" textAnchor="middle">SHADOW</text>

                            {/* Main Mountain (Front) */}
                            <polygon 
                                points="20,90 40,30 60,20 80,25 100,50 120,90" 
                                fill="#d5dbdb" stroke="#7f8c8d" strokeWidth="2"
                            />

                            {/* Glacier */}
                            <polygon 
                                points="45,60 55,40 65,30 75,35 85,55 90,70" 
                                fill="#aed6f1" stroke="#5dade2" strokeWidth="1.5" opacity="0.85"
                            />
                            <text x="65" y="45" fontSize="4" fontWeight="bold" fill="#1a5276" textAnchor="middle">GLACIER</text>
                            <text x="65" y="50" fontSize="3" fontStyle="italic" fill="#2874a6" textAnchor="middle">glaçier</text>

                            {/* Summit Marker */}
                            <path d="M 60 20 L 58 24 L 62 24 Z" fill="white" stroke="#2c3e50" strokeWidth="0.5" />
                            <text x="60" y="15" fontSize="4" fontWeight="bold" fill="#2c3e50" textAnchor="middle">SUMMIT</text>
                            <text x="62" y="18" fontSize="3" fontStyle="italic" fill="#7f8c8d" textAnchor="middle">sunmill</text>

                            {/* Explorer Figure */}
                            <rect x="38.5" y="80" width="1.5" height="8" fill="#1b4f72" stroke="#154360" strokeWidth="0.5" />
                            <rect x="40" y="80" width="1.5" height="8" fill="#1b4f72" stroke="#154360" strokeWidth="0.5" />
                            <ellipse cx="40" cy="80" rx="3" ry="8" fill="#2c3e50" stroke="#1c2833" strokeWidth="0.5" />
                            <circle cx="40" cy="70" r="2.5" fill="#f7dc6f" stroke="#d4ac0d" strokeWidth="0.5" />
                            <rect x="35" y="76" width="3.5" height="1.2" rx="0.5" fill="#1b4f72" stroke="#154360" strokeWidth="0.5" />
                            <rect x="41.5" y="76" width="3.5" height="1.2" rx="0.5" fill="#1b4f72" stroke="#154360" strokeWidth="0.5" />
                            <text x="40" y="95" fontSize="3" fontWeight="bold" fill="#ecf0f1" textAnchor="middle">EXPLORER</text>

                            {/* Foreground Rocks */}
                            {[...Array(5)].map((_, i) => (
                                <ellipse 
                                    key={i}
                                    cx={20 + i * 25} 
                                    cy={95 + (i % 2) * 2} 
                                    rx={2 + (i%3)} 
                                    ry={1.5} 
                                    fill="#566573" 
                                    stroke="#2c3e50" 
                                    strokeWidth="0.5" 
                                />
                            ))}
                        </svg>
                        
                        <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md p-2 rounded border border-white/20">
                            <h4 className="text-white text-xs font-bold uppercase">Schematic View</h4>
                            <p className="text-[10px] text-sky-200">Generated from Field Python Model</p>
                        </div>
                    </div>
                )}
              </div>
            
            {/* LITHOLOGY OVERLAY (Visual Sequence) */}
            {showLithology && (
                <div className="absolute top-6 left-6 z-40 w-64 animate-in fade-in slide-in-from-left-4">
                    <div className="bg-sentinel-900/95 backdrop-blur-md rounded-xl border border-amber-500/30 overflow-hidden shadow-2xl">
                        <div className="p-3 bg-amber-950/30 border-b border-amber-500/20 flex items-center justify-between">
                            <h4 className="text-xs font-bold text-amber-100 flex items-center gap-2">
                                <IconLayers className="w-4 h-4 text-amber-500" />
                                STRATIGRAPHIC COLUMN
                            </h4>
                            <span className="text-[10px] text-amber-500/60 font-mono">SYNTAXIS CORE</span>
                        </div>
                        
                        <div className="p-2 flex flex-col gap-1 relative">
                            {/* Depth Ruler */}
                            <div className="absolute left-0 top-2 bottom-2 w-1 border-r border-slate-700/50 flex flex-col justify-between text-[8px] text-slate-600 font-mono pr-1 text-right">
                                <span>0km</span>
                                <span>5km</span>
                                <span>15km</span>
                                <span>25km</span>
                            </div>

                            {LITHOLOGY_DATA.map((unit) => (
                                <button
                                    key={unit.id}
                                    onClick={(e) => { e.stopPropagation(); handleLithologyUnitAnalysis(unit); }}
                                    className="relative group text-left transition-all duration-200 hover:scale-[1.02] focus:outline-none"
                                    style={{ height: 'auto', minHeight: '60px' }}
                                >
                                    <div className={`w-full h-full rounded border border-white/10 ${unit.color} relative overflow-hidden`}>
                                        {/* Texture Overlay */}
                                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-multiply"></div>
                                        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent"></div>
                                        
                                        <div className="relative p-2 z-10">
                                            <span className="text-[10px] font-bold text-white uppercase tracking-wider block shadow-black drop-shadow-sm">{unit.name}</span>
                                            <span className="text-[9px] text-white/80 block mt-0.5">{unit.age}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Hover info */}
                                    <div className="absolute left-full top-0 ml-2 w-48 bg-sentinel-900 border border-slate-700 p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                                        <p className="text-xs font-bold text-white mb-1">{unit.type}</p>
                                        <p className="text-[10px] text-slate-400 leading-tight">{unit.description}</p>
                                        <p className="text-[9px] font-mono text-emerald-400 mt-1">{unit.composition}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="p-2 bg-amber-950/20 text-[9px] text-amber-500/50 text-center font-mono border-t border-amber-500/10">
                            TAP UNIT FOR PETROLOGICAL ANALYSIS
                        </div>
                    </div>
                </div>
            )}
            
            {/* FAULT LINE OVERLAY (SVG Overlay) */}
            {showFaults && (
              <div className="absolute inset-0 z-30 pointer-events-none animate-in fade-in duration-500">
                 <svg className="w-full h-full pointer-events-auto" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                       <filter id="faultGlow">
                          <feGaussianBlur stdDeviation="0.8" result="coloredBlur"/>
                          <feMerge>
                             <feMergeNode in="coloredBlur"/>
                             <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                       </filter>
                       {/* Teeth marker for Thrust Faults */}
                       <marker id="thrustTeeth" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                           <path d="M 0 0 L 6 3 L 0 6 z" fill="#ef4444" opacity="0.8" />
                       </marker>
                    </defs>

                    {FAULT_DATA.map((fault) => (
                       <g key={fault.id} onClick={(e) => { e.stopPropagation(); handleFaultAnalysis(fault); }} className="cursor-pointer group">
                           {/* Hover Hit Area (Thicker transparent line) */}
                           <path 
                              d={fault.path} 
                              stroke="transparent" 
                              strokeWidth="8" 
                              fill="none" 
                           />
                           
                           {/* Visible Fault Line */}
                           <path 
                              d={fault.path} 
                              stroke={fault.color} 
                              strokeWidth={1.2} 
                              fill="none" 
                              strokeDasharray={fault.strokeDash || "0"}
                              filter="url(#faultGlow)"
                              className="opacity-80 group-hover:opacity-100 group-hover:stroke-[1.5] transition-all duration-300"
                              markerEnd={fault.type.includes('Thrust') ? "url(#thrustTeeth)" : ""}
                           />

                           {/* Interactive Node Markers along path (Start/Mid/End) */}
                           <circle cx={fault.labelPos.x} cy={fault.labelPos.y} r="1.5" fill={fault.color} className="animate-pulse" />
                           
                           {/* Fault Label */}
                           <text 
                              x={fault.labelPos.x} 
                              y={fault.labelPos.y - 3} 
                              fill="white" 
                              fontSize="2.5" 
                              textAnchor="middle" 
                              className="font-mono font-bold uppercase drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity bg-black/50"
                           >
                              {fault.name}
                           </text>
                       </g>
                    ))}
                 </svg>
                 
                 {/* Legend for Faults */}
                 <div className="absolute bottom-6 right-6 bg-sentinel-900/90 p-3 rounded-lg border border-red-500/30 backdrop-blur-md pointer-events-auto">
                    <h5 className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">Structural Key</h5>
                    <div className="space-y-1.5">
                       <div className="flex items-center gap-2">
                          <div className="w-6 h-0.5 bg-red-500 border-b border-red-500 border-dashed"></div>
                          <span className="text-[9px] text-slate-300">Suture Zone (MMT)</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <div className="w-6 h-0.5 bg-amber-500"></div>
                          <span className="text-[9px] text-slate-300">Active Fault</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <div className="w-6 h-0.5 bg-amber-400 border-b border-amber-400 border-dotted"></div>
                          <span className="text-[9px] text-slate-300">Ductile Shear</span>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {/* Interactive Pins */}
            {ZONES.map((zone) => {
              const isSelected = selectedZone?.id === zone.id;
              return (
                <button
                  key={zone.id}
                  onClick={(e) => { e.stopPropagation(); setSelectedZone(zone); }}
                  className={`absolute w-6 h-6 group transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 focus:outline-none cursor-pointer ${isSelected ? 'z-40 scale-125' : 'z-30 hover:scale-110'}`}
                  style={{ top: `${zone.y}%`, left: `${zone.x}%` }}
                >
                    {/* GPS Accuracy Circle */}
                    {isSelected && zone.gpsAccuracy && (
                      <div 
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-400/30 bg-sky-400/10 pointer-events-none animate-[pulse_3s_ease-in-out_infinite]"
                        style={{ width: `${zone.gpsAccuracy * 4}px`, height: `${zone.gpsAccuracy * 4}px` }} 
                      >
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full text-[6px] font-mono text-sky-400 whitespace-nowrap opacity-80">
                            ±{zone.gpsAccuracy}m
                         </div>
                      </div>
                    )}

                    {/* Selected Highlight Ring */}
                    {isSelected && (
                      <>
                        <span className={`absolute -inset-4 rounded-full border-2 opacity-50 animate-[ping_2s_ease-out_infinite] ${getSelectionRing(zone.riskLevel)}`}></span>
                        <span className={`absolute -inset-2 rounded-full border-2 ${getSelectionRing(zone.riskLevel)} bg-sentinel-900/30 backdrop-blur-sm`}></span>
                      </>
                    )}

                    {/* Pulsing effect - Variable speed based on risk */}
                    {!isSelected && (
                      <span 
                        className={`absolute inset-0 rounded-full animate-ping ${getPulseOpacity(zone.riskLevel)} ${getRiskPinColor(zone.riskLevel).split(' ')[0]}`}
                        style={{ animationDuration: getPulseSpeed(zone.riskLevel) }}
                      ></span>
                    )}
                    {/* Pin Core */}
                    <span className={`relative block w-4 h-4 rounded-full border-2 border-white mx-auto mt-1 ${getRiskPinColor(zone.riskLevel)}`}></span>
                </button>
              );
            })}
          </div>
          
          {/* Map Overlay UI - Background for dismissing selections */}
          <div 
             className="absolute inset-0 bg-gradient-to-tr from-sentinel-900/60 via-transparent to-transparent z-20 pointer-events-none" 
          />
          {/* Invisible click catcher that respects dragging */}
          <div 
            className="absolute inset-0 z-10"
            onClick={handleOverlayClick}
          />

          {/* Solar Azimuth Indicator */}
          <div className="absolute top-4 right-4 z-30 flex flex-col items-center gap-1 transition-opacity duration-300">
             {(activeLayer === 'Topographic') && (
                <div className="bg-sentinel-900/80 backdrop-blur p-2 rounded-full border border-sentinel-700 shadow-lg animate-in fade-in zoom-in duration-300" title="Simulated Solar Azimuth">
                  <div className="relative w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-sentinel-950/50">
                      {/* Sun Orbit */}
                      <div 
                        className="absolute w-full h-full rounded-full"
                        style={{ transform: `rotate(${sunPosition}deg)` }}
                      >
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.8)]"></div>
                         <div className="w-[1px] h-4 bg-gradient-to-b from-yellow-400/50 to-transparent mx-auto mt-1"></div>
                      </div>
                      {/* Center Point */}
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                      {/* Compass Marks */}
                      <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-[1px] h-1 bg-slate-600"></div>
                      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-[1px] h-1 bg-slate-600"></div>
                      <div className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1 h-[1px] bg-slate-600"></div>
                      <div className="absolute right-0.5 top-1/2 -translate-y-1/2 w-1 h-[1px] bg-slate-600"></div>
                  </div>
                  <div className="text-[9px] font-mono text-center mt-1 text-slate-500 font-bold">SOLAR</div>
                </div>
             )}
          </div>

          {/* Map Controls */}
          <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-30 items-start">
            
            {/* Layer Settings Popup */}
            {showLayerControls && (
                <div className="bg-sentinel-900/95 p-4 rounded-xl border border-sentinel-700 backdrop-blur-md shadow-2xl animate-in slide-in-from-bottom-4 mb-2 min-w-[200px]">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                        <IconLayers className="w-3 h-3" /> Map Layers
                    </h4>
                    
                    {/* Risk Layer Toggle */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-300">Risk Overlay</span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowRiskLayer(!showRiskLayer); }}
                                className={`w-8 h-4 rounded-full p-0.5 transition-colors ${showRiskLayer ? 'bg-red-500' : 'bg-sentinel-700'}`}
                            >
                                <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${showRiskLayer ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </button>
                        </div>
                        <input 
                            type="range" min="0" max="100" 
                            disabled={!showRiskLayer}
                            value={riskOpacity} onChange={(e) => setRiskOpacity(Number(e.target.value))}
                            className="w-full h-1.5 bg-sentinel-700 rounded-lg appearance-none cursor-pointer accent-red-500 hover:accent-red-400 disabled:opacity-50"
                        />
                    </div>

                    {/* Terrain Opacity (New Control) */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-300">Terrain Opacity</span>
                            <span className="text-[10px] text-slate-500 font-mono">{terrainOpacity}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="100" 
                            disabled={activeLayer !== 'Terrain'}
                            value={terrainOpacity} onChange={(e) => setTerrainOpacity(Number(e.target.value))}
                            className="w-full h-1.5 bg-sentinel-700 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400 disabled:opacity-50"
                        />
                    </div>

                    {/* Solar Intensity */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-300">Solar Shading</span>
                            <IconSun className="w-3 h-3 text-yellow-500" />
                        </div>
                        <input 
                            type="range" min="0" max="100" 
                            value={solarIntensity} onChange={(e) => setSolarIntensity(Number(e.target.value))}
                            className="w-full h-1.5 bg-sentinel-700 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-400"
                        />
                    </div>
                </div>
            )}

            {/* Main Control Cluster */}
            <div className="flex items-end gap-2">
                {/* Zoom Controls */}
                <div className="bg-sentinel-900/90 p-1.5 rounded-xl border border-sentinel-700/50 backdrop-blur-md shadow-2xl flex flex-col items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); handleZoom(0.5); }} className="p-2 text-slate-400 hover:text-white hover:bg-sentinel-800 rounded-lg transition-colors"><IconPlus className="w-4 h-4" /></button>
                    <div className="w-4 h-px bg-sentinel-700/50"></div>
                    <button onClick={(e) => { e.stopPropagation(); handleZoom(-0.5); }} className="p-2 text-slate-400 hover:text-white hover:bg-sentinel-800 rounded-lg transition-colors"><IconMinus className="w-4 h-4" /></button>
                    <div className="w-4 h-px bg-sentinel-700/50"></div>
                    <button onClick={(e) => { e.stopPropagation(); handleResetView(); }} className="p-2 text-slate-400 hover:text-sky-400 hover:bg-sentinel-800 rounded-lg transition-colors"><IconLocate className="w-4 h-4" /></button>
                </div>

                {/* Layer Toggle Button */}
                <div className="bg-sentinel-900/90 p-1.5 rounded-xl border border-sentinel-700/50 backdrop-blur-md shadow-2xl flex flex-col items-center gap-1">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowLayerControls(!showLayerControls); }}
                        className={`p-2 rounded-lg transition-colors ${showLayerControls ? 'text-sky-400 bg-sentinel-800' : 'text-slate-400 hover:text-white hover:bg-sentinel-800'}`}
                        title="Layer Settings"
                    >
                        <IconLayers className="w-4 h-4" />
                    </button>
                </div>

                {/* Layer Selector */}
                <div className="bg-sentinel-900/90 p-1.5 rounded-xl border border-sentinel-700/50 backdrop-blur-md shadow-2xl flex items-center gap-1">
                    {LAYER_CONFIG.map((layer) => (
                        <button
                            key={layer.id}
                            onClick={(e) => { e.stopPropagation(); setActiveLayer(layer.id); }}
                            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-all duration-200 border relative overflow-hidden
                            ${activeLayer === layer.id 
                                ? 'bg-sky-600 border-sky-500 text-white shadow-[0_0_15px_rgba(2,132,199,0.5)] ring-1 ring-sky-400/30' 
                                : 'bg-transparent border-transparent text-slate-400 hover:bg-sentinel-800 hover:text-white'}
                            `}
                            title={`${layer.id} View`}
                        >
                            {/* Active Glow Backdrop */}
                            {activeLayer === layer.id && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite] -skew-x-12"></div>
                            )}

                            <layer.icon className={`w-3.5 h-3.5 relative z-10 ${activeLayer === layer.id ? 'text-white' : 'text-slate-500'}`} />
                            <span className="hidden xl:inline relative z-10">{layer.id}</span>
                            <span className="xl:hidden relative z-10">{layer.label}</span>
                            
                            {/* Active Dot Indicator */}
                            {activeLayer === layer.id && (
                                <span className="relative flex h-1.5 w-1.5 ml-0.5 z-10">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                                </span>
                            )}
                        </button>
                    ))}
                </div>
                
                {/* Contours Toggle (Simplified) */}
                <div className="flex items-center gap-3 bg-sentinel-900/90 p-2 rounded-xl border border-sentinel-700/50 backdrop-blur-md w-fit">
                    <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${showTerrain ? 'text-white' : 'text-slate-500'}`}>Contours</span>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowTerrain(!showTerrain); }}
                        className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${showTerrain ? 'bg-sky-500' : 'bg-sentinel-700'}`}
                        title="Toggle Elevation Contours"
                    >
                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-200 ${showTerrain ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                </div>
            </div>
          </div>
          

          {/* Selected Zone Details / Analysis Overlay */}
          {selectedZone && (
            viewMode === 'details' ? (
                <div className={`absolute top-6 right-6 w-96 bg-sentinel-900/95 backdrop-blur-md border rounded-xl overflow-hidden animate-in fade-in slide-in-from-right-4 z-40 transition-all duration-300 ${getPanelBorder(selectedZone.riskLevel)}`}>
                {/* Color Stripe */}
                <div className={`h-1.5 w-full ${getRiskPinColor(selectedZone.riskLevel).split(' ')[0]}`}></div>
                
                <div className="p-5 overflow-y-auto max-h-[85vh] custom-scrollbar">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                        <h3 className="text-lg font-bold text-white leading-tight">{selectedZone.name}</h3>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                selectedZone.riskLevel === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                                selectedZone.riskLevel === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' :
                                selectedZone.riskLevel === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20' :
                                'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                            }`}>
                                {selectedZone.riskLevel} Risk
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">SCORE: {selectedZone.riskScore}</span>
                        </div>
                        </div>
                        <button 
                            onClick={() => setSelectedZone(null)} 
                            className="text-slate-400 hover:text-white transition-colors bg-sentinel-800 hover:bg-sentinel-700 w-6 h-6 rounded-md flex items-center justify-center"
                        >
                        <IconX className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-sentinel-800/50 p-3 rounded-lg border border-sentinel-700/50">
                        <div className="flex justify-between items-center mb-1">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Key Telemetry</p>
                            <IconActivity className="w-3 h-3 text-sky-500" />
                        </div>
                        <p className="text-sm font-mono text-sky-200">{selectedZone.metric}</p>
                        <div className="h-px bg-sentinel-700/50 my-2"></div>
                        <p className="text-xs text-slate-400 leading-relaxed">{selectedZone.details}</p>
                        </div>

                        {/* NEW GRAPH SECTION */}
                        <div className="bg-sentinel-800/50 p-3 rounded-lg border border-sentinel-700/50">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                                    Last 6h {zoneTelemetry[0]?.metric || 'Telemetry'}
                                </p>
                                <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
                                    <span className="text-[10px] text-sky-400 font-mono">LIVE FEED</span>
                                </div>
                            </div>
                            <div className="h-24 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={zoneTelemetry}>
                                        <defs>
                                            <linearGradient id="telemetryGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="time" hide />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px', padding: '4px 8px' }}
                                            itemStyle={{ color: '#38bdf8' }}
                                            cursor={{ stroke: 'rgba(56,189,248,0.2)' }}
                                            labelStyle={{ color: '#94a3b8', marginBottom: '2px' }}
                                            formatter={(val: number) => [`${val}${zoneTelemetry[0]?.unit}`, zoneTelemetry[0]?.metric]}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="value" 
                                            stroke="#38bdf8" 
                                            fill="url(#telemetryGradient)" 
                                            strokeWidth={2}
                                            animationDuration={1500}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button className="col-span-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/50 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 group/btn">
                                <IconAlertTriangle className="w-3 h-3 group-hover/btn:animate-bounce" />
                                BROADCAST
                            </button>
                            <button 
                                onClick={handleZoneAnalysis}
                                className="col-span-1 bg-sky-600 hover:bg-sky-500 text-white border border-sky-500 hover:border-sky-400 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-900/20"
                            >
                                <IconGlobe className="w-3 h-3" />
                                ANALYSIS
                            </button>
                        </div>
                        
                        {/* DEEP SIMULATION BUTTON */}
                        <button
                            onClick={handleDeepSimulation}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 hover:border-indigo-400 py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] group/sim"
                        >
                            <IconCpu className="w-4 h-4 group-hover/sim:animate-[spin_3s_linear_infinite]" />
                            RUN DEEP PHYSICS SIMULATION
                        </button>

                    </div>
                </div>
                </div>
            ) : (
                <div className={`absolute top-6 right-6 w-[500px] h-[600px] bg-sentinel-900/95 backdrop-blur-md border rounded-xl overflow-hidden animate-in fade-in slide-in-from-right-4 z-40 flex flex-col transition-all duration-300 ${getPanelBorder(selectedZone.riskLevel)}`}>
                     <div className="flex justify-between items-center px-4 py-3 border-b border-sentinel-700 bg-sentinel-950/50">
                         <button 
                           onClick={() => setViewMode('details')}
                           className="text-xs font-bold text-sky-400 hover:text-white flex items-center gap-1 uppercase tracking-wider transition-colors"
                         >
                            <span className="text-lg">‹</span> Back to Telemetry
                         </button>
                         <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-mono">AI-LINK: ACTIVE</span>
                            <button 
                               onClick={() => setSelectedZone(null)}
                               className="text-slate-400 hover:text-white transition-colors"
                            >
                               <IconX className="w-5 h-5" />
                            </button>
                         </div>
                     </div>
                     <div className="flex-1 relative overflow-hidden bg-sentinel-800">
                         <div className="absolute inset-0 overflow-y-auto">
                             <AnalysisPanel 
                                title={`SITREP: ${selectedZone.name}`}
                                markdown={aiState.markdown}
                                loading={aiState.loading}
                                isThinking={aiState.isThinking}
                                onAnalyze={() => { setAiState(prev => ({...prev, markdown: '', loading:false, isThinking:false})); handleZoneAnalysis(); }}
                                onSave={() => console.log('Saved to log')}
                             />
                         </div>
                     </div>
                </div>
            )
          )}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;