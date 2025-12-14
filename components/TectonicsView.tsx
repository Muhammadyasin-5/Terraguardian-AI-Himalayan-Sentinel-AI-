import React, { useState } from 'react';
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Area, ReferenceLine, Scatter, BarChart, Bar, Legend, Label, LabelList, ReferenceDot } from 'recharts';
import AnalysisPanel from './AnalysisPanel';
import { generateDeepThinkingInsight } from '../services/geminiService';
import { AiResponse } from '../types';
import { IconTectonics, IconActivity, IconAlertTriangle, IconMap, IconLayers, IconX, IconBeaker, IconHistory, IconClock } from './Icons';

interface VelocityVector {
  id: string;
  lat: number;
  long: number;
  vx: number; // East velocity mm/yr
  vy: number; // North velocity mm/yr
  station: string;
}

interface TectonicFault {
  id: string;
  name: string;
  type: string;
  status: string;
  description: string;
  geologicalSignificance: string;
  path: string;
  color: string;
  dashArray?: string;
  labelPos: { x: number; y: number };
}

interface PetrologyUnit {
    id: string;
    name: string;
    type: string;
    age: string;
    minerals: string;
    desc: string;
    color: string;
    height: number; // Percentage height in column
    pattern: 'granite' | 'gneiss' | 'mafic' | 'sediment';
}

interface GeochronEvent {
    id: string;
    time: string;
    event: string;
    desc: string;
    type: string;
    details: string;
    context: string;
}

const GPS_DATA: VelocityVector[] = [
  { id: 'GB01', lat: 30, long: 20, vx: 5, vy: 38, station: 'Besham' },
  { id: 'GB02', lat: 35, long: 35, vx: 8, vy: 35, station: 'Chilas' },
  { id: 'GB03', lat: 50, long: 50, vx: 12, vy: 25, station: 'Nanga Parbat Base' },
  { id: 'GB04', lat: 60, long: 65, vx: 10, vy: 18, station: 'Astor' },
  { id: 'GB05', lat: 25, long: 70, vx: 15, vy: 42, station: 'Skardu' },
  { id: 'GB06', lat: 80, long: 40, vx: 2, vy: 5, station: 'Gilgit (Stable)' },
];

const TECTONIC_FAULTS: TectonicFault[] = [
  {
    id: 'mmt',
    name: 'Main Mantle Thrust (MMT)',
    type: 'Suture Zone / Thrust',
    status: 'Reactivated',
    description: 'The defining suture zone separating the Indian Plate from the Kohistan Island Arc. Reactivated as a thrust fault accommodating rapid crustal shortening and extrusion.',
    geologicalSignificance: 'Defines the boundary between the Indian Plate and the Kohistan-Ladakh Arc. Its reactivation indicates that the Nanga Parbat massif is actively overriding the surrounding terranes.',
    path: 'M 20,100 C 30,60 40,30 50,25 C 60,30 70,60 80,100',
    color: '#ef4444',
    dashArray: '4 2',
    labelPos: { x: 50, y: 22 }
  },
  {
    id: 'raikot',
    name: 'Raikot Fault',
    type: 'Normal / Thrust',
    status: 'Critical (Holocene)',
    description: 'A major active boundary fault driving the rapid exhumation of the massif. Associated with the Tato hot springs and high seismicity rates.',
    geologicalSignificance: 'The primary structure accommodating the ~10mm/yr uplift. Its Holocene activity poses a significant seismic hazard and drives the high-relief topography.',
    path: 'M 48,32 Q 40,50 38,70',
    color: '#f97316',
    labelPos: { x: 38, y: 55 }
  },
  {
    id: 'stak',
    name: 'Stak Fault',
    type: 'Thrust System',
    status: 'Active',
    description: 'The eastern structural boundary contributing to the "pop-up" mechanics of the syntaxis, working in conjugate with the Raikot fault.',
    geologicalSignificance: 'Forms the eastern conjugate to the Raikot Fault, effectively squeezing the crustal block upwards in a "pop-up" mechanism.',
    path: 'M 52,32 Q 60,50 62,70',
    color: '#eab308',
    labelPos: { x: 62, y: 55 }
  },
  {
      id: 'diamir',
      name: 'Diamir Shear',
      type: 'Ductile Shear',
      status: 'Active (Ductile)',
      description: 'Deep crustal shear zone facilitating the vertical extrusion of the granulite core.',
      geologicalSignificance: 'Represents the rheological weak zone allowing the hot, partially molten middle crust to extrude vertically towards the surface.',
      path: 'M 45,35 L 35,45',
      color: '#fbbf24',
      dashArray: '1 1',
      labelPos: { x: 40, y: 40 }
  }
];

const CRUSTAL_PROFILE = [
  { dist: 0, depth: 35, terrain: 1000, label: 'Foreland' },
  { dist: 20, depth: 38, terrain: 1500, label: 'MBT' },
  { dist: 40, depth: 45, terrain: 2500, label: 'MCT' },
  { dist: 60, depth: 55, terrain: 4500, label: 'Lesser Him.' },
  { dist: 80, depth: 65, terrain: 6500, label: 'NP Massif' },
  { dist: 100, depth: 50, terrain: 4000, label: 'Indus Suture' }, // Thinning/Exhumation
  { dist: 120, depth: 55, terrain: 5000, label: 'Kohistan Arc' },
];

const PT_PATH_DATA = [
  { stage: 'M1 Prograde', temp: 450, pressure: 5, label: 'M1' },
  { stage: 'M2 Peak', temp: 750, pressure: 10, label: 'M2 Peak' },
  { stage: 'M3 Decompression', temp: 700, pressure: 4, label: 'M3 Cordierite' },
  { stage: 'M4 Cooling', temp: 300, pressure: 1, label: 'M4' },
];

const GEOCHEM_DATA = [
  { name: 'SiO2', gneiss: 64.5, leuco: 73.8 },
  { name: 'Al2O3', gneiss: 15.2, leuco: 14.1 },
  { name: 'FeOt', gneiss: 5.8, leuco: 1.2 },
  { name: 'CaO', gneiss: 3.2, leuco: 0.8 },
  { name: 'K2O', gneiss: 3.1, leuco: 4.8 },
  { name: 'Na2O', gneiss: 3.4, leuco: 3.9 },
];

const COOLING_HISTORY = [
    { age: 20, temp: 750, method: 'Initial', label: 'Prograde' },
    { age: 12, temp: 700, method: 'Mnz U-Pb', label: 'Peak Metamorphism' },
    { age: 8, temp: 500, method: 'Hbl Ar-Ar', label: 'Cooling Onset' },
    { age: 5, temp: 350, method: 'Ms Ar-Ar', label: 'Rapid Exhumation' },
    { age: 3, temp: 300, method: 'Bt Ar-Ar', label: 'Tato Granite' },
    { age: 1.2, temp: 240, method: 'Zrn FT', label: 'Fission Track' },
    { age: 0.5, temp: 110, method: 'Ap FT', label: 'Recent Uplift' },
    { age: 0, temp: 15, method: 'Surface', label: 'Now' },
];

const GEOCHRON_EVENTS: GeochronEvent[] = [
    {
        id: 'e1',
        time: '55 Ma',
        event: 'India-Asia Collision',
        desc: 'Initial soft collision closing the Tethys Ocean.',
        type: 'Tectonic',
        details: 'The onset of the Himalayan Orogeny. Closure of the Neo-Tethys ocean and initial subduction of the Indian continental margin beneath the Kohistan-Ladakh Arc.',
        context: 'Analyze the initial collision dynamics at 55Ma. Focus on the closure of the Tethys Ocean and the initial crustal thickening before the formation of the syntaxis.'
    },
    {
        id: 'e2',
        time: '10-12 Ma',
        event: 'Syntaxis Formation',
        desc: 'Initiation of the syntaxial loop structure and MMT reactivation.',
        type: 'Structural',
        details: 'Rotation of the stress field leading to the formation of the Nanga Parbat-Haramosh Syntaxis. Reactivation of the Main Mantle Thrust (MMT) as a thrust fault.',
        context: 'Analyze the structural reorganization at 10-12Ma. Explain the mechanics of the syntaxial loop formation and the reactivation of the MMT.'
    },
    {
        id: 'e3',
        time: '1-3 Ma',
        event: 'Exhumation Pulse',
        desc: 'Extreme uplift rates (>5mm/yr) driven by tectonic aneurysm mechanics.',
        type: 'Thermal',
        details: 'Rapid cooling of the core gneisses (Iskere Gneiss) and emplacement of the Tato Leucogranites due to decompression melting. Coupled with incision by the Indus River.',
        context: 'Analyze the recent exhumation pulse (1-3Ma). Connect the rapid cooling rates derived from Ar-Ar and Fission Track data to the tectonic aneurysm model and river incision.'
    }
];

const PETROLOGY_UNITS: PetrologyUnit[] = [
    {
        id: 'tato',
        name: 'Tato Leucogranite',
        type: 'Intrusive Sheet',
        age: 'Pliocene (1-3 Ma)',
        minerals: 'Qtz + Kfs + Plag + Tur ± Grt',
        desc: 'Fluid-absent decompression melts. Youngest granites in the Himalaya, proving rapid recent exhumation.',
        color: '#fbcfe8', // pink-200
        height: 15,
        pattern: 'granite'
    },
    {
        id: 'mito',
        name: 'Mito Cover Sequence',
        type: 'Metasedimentary',
        age: 'Paleozoic',
        minerals: 'Cal + Dol + Di + Phl',
        desc: 'Folded bands of calc-silicates and marbles wrapping the syntaxial core. Protolith: Tethyan sediments.',
        color: '#4ade80', // green-400
        height: 20,
        pattern: 'sediment'
    },
    {
        id: 'amph',
        name: 'Shengus Amphibolite',
        type: 'Mafic Dyke/Sill',
        age: 'Paleozoic',
        minerals: 'Hbl + Plag + Grt + Ilm',
        desc: 'Mafic bands folded within the gneiss, providing P-T markers for peak metamorphism.',
        color: '#334155', // slate-700
        height: 10,
        pattern: 'mafic'
    },
    {
        id: 'iskere',
        name: 'Iskere Gneiss',
        type: 'Core Orthogneiss',
        age: 'Proterozoic (1.8 Ga)',
        minerals: 'Qtz + Kfs + Bio + Sil + Crd',
        desc: 'The massively deformed basement core. Shows pervasive migmatization indicating high-T conditions.',
        color: '#94a3b8', // slate-400
        height: 55,
        pattern: 'gneiss'
    }
];

const getStatusColor = (status: string) => {
    if (status.includes('Critical')) return 'bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse';
    if (status.includes('Active')) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (status.includes('Reactivated')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
};

const TectonicsView: React.FC = () => {
  const [viewMode, setViewMode] = useState<'map' | 'profile' | 'petrology' | 'geochron'>('map');
  const [activeFault, setActiveFault] = useState<TectonicFault | null>(null);
  const [activeUnit, setActiveUnit] = useState<PetrologyUnit | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<GeochronEvent | null>(null);
  
  const [aiState, setAiState] = useState<AiResponse>({
    markdown: '',
    loading: false,
    isThinking: false
  });

  const handleAnalysis = async () => {
    setAiState({ ...aiState, loading: true, isThinking: true });

    let prompt = '';

    if (viewMode === 'petrology') {
        prompt = `
        **PETROLOGICAL & GEOCHEMICAL ANALYSIS: NANGA PARBAT**
        
        **Context:**
        - Nanga Parbat exposes deep crustal rocks (~30km depth) exhumed rapidly (<5 Ma).
        - Key feature: Decompression melting forming "Tato Leucogranites".
        
        **Analysis Requirements:**
        1. **P-T Evolution Path:** Analyze the significance of the "Clockwise P-T path" showing rapid isothermal decompression (ITD). What does the stability of Cordierite + Spinel tell us about the uplift rate?
        2. **Leucogranite Genesis:** Explain the geochemical data (High SiO2, High K2O, Low CaO/FeOt) of the Tato Leucogranites. Confirm if this indicates "Fluid-Absent Muscovite Breakdown Melting".
        3. **Exhumation Velocity:** Correlate the radiometric ages (U-Pb on Zircon vs. Ar-Ar on Biotite) to calculate the cooling rate (°C/Myr).
        4. **Tectonic Implication:** How does this petrology support the "Tectonic Aneurysm" hypothesis?

        **Tone:** Senior Petrologist. Focus on metamorphic phase equilibria and geochronology.
        `;
    } else if (viewMode === 'geochron') {
        if (selectedEvent) {
             prompt = `
            **EVENT ANALYSIS: ${selectedEvent.event.toUpperCase()} (${selectedEvent.time})**

            **Context:**
            ${selectedEvent.details}

            **Analysis Request:**
            ${selectedEvent.context}
            
            1. **Geological Context:** Provide a detailed breakdown of the tectonic drivers behind this event.
            2. **Regional Impact:** How did this event influence the surrounding terranes (Kohistan Arc / Indian Plate) and local stratigraphy?
            3. **Modern Signatures:** What specific petrological or structural evidence visible today dates back to this specific event?

            **Tone:** Senior Geologist. Detailed and rigorous.
            `;
        } else {
            prompt = `
            **GEOCHRONOLOGICAL ANALYSIS: NANGA PARBAT SYNTAXIS**

            **Dataset:**
            - Cooling History: Peak Metamorphism (700°C @ 12Ma) -> Rapid Exhumation (350°C @ 5Ma) -> Surface (Now).
            - Apatite Fission Track Ages: < 1 Ma (0.5 - 0.7 Ma).
            - Biotite Ar-Ar Ages: ~3 Ma.

            **Analysis Requirements:**
            1. **Cooling Rate Calculation**: Calculate the implied cooling rate (°C/Myr) between the Biotite Ar-Ar closure (~300°C) and Apatite FT closure (~110°C).
            2. **Exhumation Velocity**: Assuming a geothermal gradient of 30-50°C/km, convert the cooling rate into an exhumation velocity (mm/yr). 
            3. **The "Youngest" Granites**: Discuss the significance of the 1-3 Ma U-Pb Zircon ages in the Tato Leucogranites relative to the general Himalayan orogeny.
            4. **Erosion Coupling**: Does this data support the hypothesis that rapid incision by the Indus River is driving this tectonic uplift?

            **Tone:** Senior Geochronologist. Quantitative and precise.
            `;
        }
    } else {
        prompt = `
        **TECTONIC STRUCTURAL ANALYSIS: NANGA PARBAT SYNTAXIS**
        
        **Geodynamic Context:**
        - Indian Plate Convergence: ~38-42 mm/yr (NNE vector)
        - Exhumation Rate: ~10mm/yr (Highest on Earth)
        - Structural Setting: Western Himalayan Syntaxis (Axis of crustal rotation)
        
        **Analysis Vectors:**
        1. **The Tectonic Aneurysm Model**: Provide a physics-based explanation of how rapid river incision by the Indus River weakens the crust, leading to isostatic rebound and the upward extrusion of hot lower-crustal rocks.
        2. **Seismic Gap Assessment**: Evaluate the strain accumulation along the Main Mantle Thrust (MMT). Is the Raikot Fault currently locked?
        3. **Risk Forecast**: Probability of a >M7.0 event in the next decade based on current geodetic strain rates.

        **Tone:** Senior Tectonophysicist. Use rigorous academic structure.
        `;
    }

    const result = await generateDeepThinkingInsight(prompt);
    setAiState({ markdown: result, loading: false, isThinking: false });
  };

  const handleExport = () => {
    const report = {
        type: "TECTONIC_STRUCTURAL_REPORT",
        timestamp: new Date().toISOString(),
        viewMode,
        data: viewMode === 'petrology' ? { PT_PATH_DATA, GEOCHEM_DATA, PETROLOGY_UNITS } : 
              viewMode === 'geochron' ? { COOLING_HISTORY, GEOCHRON_EVENTS } :
              { GPS_DATA, TECTONIC_FAULTS, CRUSTAL_PROFILE },
        analysis: aiState.markdown
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentinel_tectonics_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getAnalysisTitle = () => {
    if (viewMode === 'petrology') return "Petrology & Geochronology Engine";
    if (viewMode === 'geochron') {
        return selectedEvent ? `Event Analysis: ${selectedEvent.time}` : "Geochronology Engine";
    }
    return "Structural Geology Engine";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full p-6 overflow-hidden">
      {/* Visual Column */}
      <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
        
        {/* Main Visualization Card */}
        <div className="bg-sentinel-800 p-6 rounded-xl border border-sentinel-700 shadow-lg flex-shrink-0 flex flex-col h-[600px]">
           <div className="flex justify-between items-center mb-6">
              <div>
                 <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {viewMode === 'petrology' ? <IconBeaker className="w-6 h-6 text-pink-400" /> : 
                     viewMode === 'geochron' ? <IconHistory className="w-6 h-6 text-teal-400" /> :
                     <IconTectonics className="w-6 h-6 text-orange-500" />}
                    {viewMode === 'petrology' ? 'Petrology' : viewMode === 'geochron' ? 'Geochronology' : 'Geodynamics'}
                 </h3>
                 <p className="text-slate-400 text-sm">
                     {viewMode === 'petrology' ? 'Metamorphic P-T evolution & composition.' : 
                      viewMode === 'geochron' ? 'Thermochronometry & Exhumation Rates.' :
                      'Plate motion kinematics & lithospheric structure.'}
                 </p>
              </div>
              <div className="flex bg-sentinel-900 rounded-lg p-1 border border-sentinel-700">
                 <button 
                   onClick={() => setViewMode('map')}
                   className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'map' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
                 >
                    MAP
                 </button>
                 <button 
                   onClick={() => setViewMode('profile')}
                   className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'profile' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
                 >
                    PROFILE
                 </button>
                 <button 
                   onClick={() => setViewMode('petrology')}
                   className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'petrology' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'}`}
                 >
                    PETRO
                 </button>
                 <button 
                   onClick={() => setViewMode('geochron')}
                   className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'geochron' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`}
                 >
                    AGE
                 </button>
              </div>
           </div>

           <div className="flex-1 relative bg-sentinel-900 rounded-xl overflow-hidden border border-sentinel-700/50 p-4">
              {viewMode === 'map' ? (
                 <div className="w-full h-full relative">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                       <defs>
                          <marker id="arrowhead" markerWidth="4" markerHeight="4" refX="0" refY="2" orient="auto">
                             <polygon points="0 0, 4 2, 0 4" fill="#38bdf8" />
                          </marker>
                          {/* Fault Markers */}
                          <marker id="thrustTeeth" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                              <path d="M 0 0 L 6 3 L 0 6 z" fill="#ef4444" opacity="0.9" />
                          </marker>
                          <marker id="shearArrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                              <path d="M 0 0 L 6 3 L 0 6" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
                          </marker>
                          
                          <filter id="glow">
                             <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                             <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                          </filter>
                          <filter id="criticalGlow">
                             <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                             <feFlood floodColor="#ef4444" floodOpacity="0.6" result="glowColor" />
                             <feComposite in="glowColor" in2="coloredBlur" operator="in" result="coloredBlur" />
                             <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                          </filter>
                          
                          {/* Terrane Patterns */}
                          <pattern id="pattern-kohistan" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                             <circle cx="2" cy="2" r="0.8" fill="#475569" opacity="0.3"/>
                          </pattern>
                          <pattern id="pattern-indian" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                             <path d="M0,12 l12,-12" stroke="#475569" strokeWidth="0.5" opacity="0.2"/>
                          </pattern>
                       </defs>

                       {/* REGIONAL TECTONIC MAP BASE */}
                       
                       {/* 1. Kohistan-Ladakh Arc (Hanging Wall) */}
                       <rect x="0" y="0" width="100" height="100" fill="#0f172a" />
                       <rect x="0" y="0" width="100" height="100" fill="url(#pattern-kohistan)" />
                       <text x="50" y="10" fill="white" opacity="0.15" fontSize="6" fontWeight="900" textAnchor="middle" letterSpacing="0.2em">KOHISTAN ARC</text>

                       {/* 2. Indian Plate / Nanga Parbat Syntaxis (Footwall inside MMT) */}
                       {/* Using MMT Path logic to define the Indian Plate promontory */}
                       <path 
                          d="M 20,100 C 30,60 40,30 50,25 C 60,30 70,60 80,100 L 100,100 L 100,110 L 0,110 Z" 
                          fill="#1e293b" 
                          stroke="none" 
                       />
                       <path 
                          d="M 20,100 C 30,60 40,30 50,25 C 60,30 70,60 80,100 L 100,100 L 100,110 L 0,110 Z" 
                          fill="url(#pattern-indian)" 
                          stroke="none" 
                       />
                       <text x="50" y="80" fill="white" opacity="0.1" fontSize="6" fontWeight="900" textAnchor="middle" letterSpacing="0.1em">INDIAN PLATE</text>
                       
                       {/* 3. Indus River System */}
                       {/* Flows from East, bends North around the syntaxis, then cuts West */}
                       <path 
                          d="M 95,100 C 90,60 75,15 50,10 C 25,15 10,40 0,45" 
                          fill="none" 
                          stroke="#0ea5e9" 
                          strokeWidth="0.8" 
                          strokeDasharray="3 1" 
                          opacity="0.5" 
                       />
                       <text x="88" y="85" fill="#0ea5e9" opacity="0.5" fontSize="2" fontWeight="bold" transform="rotate(-80 88,85)">INDUS RIVER</text>

                       {/* Tectonic Faults Layer */}
                       {TECTONIC_FAULTS.map((fault) => {
                           const isActive = activeFault?.id === fault.id;
                           const isCritical = fault.status.includes('Critical');
                           // Determine marker based on fault type
                           let markerEnd = "";
                           if (fault.type.includes('Thrust') || fault.type.includes('Suture')) markerEnd = "url(#thrustTeeth)";
                           else if (fault.type.includes('Shear')) markerEnd = "url(#shearArrow)";

                           return (
                               <g 
                                 key={fault.id} 
                                 onClick={() => setActiveFault(isActive ? null : fault)}
                                 className="cursor-pointer group"
                               >
                                   {/* Hover Target */}
                                   <path d={fault.path} fill="none" stroke="transparent" strokeWidth="10" />
                                   
                                   {/* Fault Line */}
                                   <path 
                                      d={fault.path} 
                                      fill="none" 
                                      stroke={fault.color} 
                                      strokeWidth={isActive ? "2" : isCritical ? "1.5" : "1.2"} 
                                      strokeDasharray={fault.dashArray}
                                      markerEnd={markerEnd}
                                      filter={isCritical ? "url(#criticalGlow)" : ""}
                                      className={`transition-all duration-300 group-hover:stroke-[1.8] ${isCritical && !isActive ? 'animate-pulse' : ''}`}
                                   />
                                   
                                   {/* Label Node */}
                                   <circle 
                                      cx={fault.labelPos.x} 
                                      cy={fault.labelPos.y} 
                                      r={isActive ? "2" : "1.2"} 
                                      fill={fault.color} 
                                      className={`transition-all duration-300 ${isActive || isCritical ? 'animate-ping' : ''}`} 
                                   />
                                   <circle cx={fault.labelPos.x} cy={fault.labelPos.y} r={isActive ? "1" : "0.8"} fill="#fff" />
                                   <text 
                                      x={fault.labelPos.x} y={fault.labelPos.y - 4} 
                                      fill={fault.color} fontSize="3" textAnchor="middle" fontWeight="bold"
                                      className={`transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}
                                      style={{ textShadow: '0px 1px 2px rgba(0,0,0,1)' }}
                                   >{fault.name}</text>
                               </g>
                           );
                       })}

                       {/* Nanga Parbat Massif */}
                       <circle cx="50" cy="35" r="5" fill="#f97316" opacity="0.8" filter="url(#glow)" className="pointer-events-none" />
                       <text x="50" y="34" fill="white" fontSize="2" textAnchor="middle" fontWeight="bold" className="pointer-events-none">NANGA PARBAT</text>

                       {/* GPS Vectors */}
                       {GPS_DATA.map((vec) => (
                          <g key={vec.id} className="pointer-events-none opacity-60">
                             <line 
                                x1={vec.long} y1={100 - vec.lat} 
                                x2={vec.long + (vec.vx / 4)} y2={(100 - vec.lat) - (vec.vy / 4)} 
                                stroke="#38bdf8" strokeWidth="0.5" markerEnd="url(#arrowhead)"
                             />
                             <circle cx={vec.long} cy={100 - vec.lat} r="1" fill="#0ea5e9" />
                             <text x={vec.long + 2} y={100 - vec.lat} fontSize="2" fill="#94a3b8">{vec.station}</text>
                          </g>
                       ))}
                    </svg>

                    {/* Structural Key Legend */}
                    <div className="absolute top-4 left-4 bg-sentinel-900/90 backdrop-blur p-3 rounded-lg border border-sentinel-700 shadow-xl pointer-events-none">
                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Regional Features</h5>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-3 bg-slate-800 border border-slate-600"></div>
                                <span className="text-[9px] text-slate-300">Kohistan Arc</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-3 bg-slate-700 border border-slate-500 relative overflow-hidden">
                                     <div className="absolute inset-0 opacity-30" style={{backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '4px 4px'}}></div>
                                </div>
                                <span className="text-[9px] text-slate-300">Indian Plate</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-0.5 bg-sky-500 border-b border-sky-500 border-dashed"></div>
                                <span className="text-[9px] text-slate-300">Indus River</span>
                            </div>
                            <div className="my-1 border-t border-slate-700"></div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-0.5 bg-red-500 relative flex items-center justify-end">
                                    <div className="w-0 h-0 border-t-[3px] border-t-transparent border-l-[4px] border-l-red-500 border-b-[3px] border-b-transparent"></div>
                                </div>
                                <span className="text-[9px] text-slate-300">Thrust / Suture</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-0.5 bg-amber-400 border-b border-amber-400 border-dashed relative flex items-center justify-end">
                                    <div className="w-1.5 h-1.5 border-t border-r border-amber-400 transform rotate-45"></div>
                                </div>
                                <span className="text-[9px] text-slate-300">Shear Zone</span>
                            </div>
                        </div>
                    </div>
                    
                    {activeFault && (
                        <div className="absolute bottom-4 left-4 right-4 bg-sentinel-900/95 backdrop-blur-md p-4 rounded-lg border border-sentinel-700 shadow-2xl animate-in slide-in-from-bottom-2">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                        <span style={{ color: activeFault.color }}><IconActivity className="w-4 h-4" /></span>
                                        {activeFault.name}
                                    </h4>
                                    <div className="flex gap-2 mt-1">
                                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sentinel-800 border border-sentinel-700 text-slate-300">TYPE: {activeFault.type}</span>
                                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${getStatusColor(activeFault.status)}`}>
                                            STATUS: {activeFault.status}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={() => setActiveFault(null)} className="text-slate-500 hover:text-white"><IconX className="w-4 h-4" /></button>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed mb-3">{activeFault.description}</p>
                            
                            {/* Geological Significance Section */}
                            <div className="bg-sentinel-800/50 p-2.5 rounded border border-sentinel-700/50 flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                    <IconTectonics className="w-3 h-3 text-indigo-400" />
                                    <span className="text-[10px] text-indigo-200 uppercase font-bold">Geological Significance</span>
                                </div>
                                <p className="text-xs text-slate-400 italic leading-relaxed">"{activeFault.geologicalSignificance}"</p>
                            </div>
                        </div>
                    )}
                 </div>
              ) : viewMode === 'profile' ? (
                 <div className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <ComposedChart data={CRUSTAL_PROFILE} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="dist" label={{ value: 'Distance (km)', position: 'insideBottom', offset: -5, fill: '#64748b' }} stroke="#94a3b8" />
                          <YAxis yAxisId="depth" reversed label={{ value: 'Moho Depth (km)', angle: -90, position: 'insideLeft', fill: '#64748b' }} stroke="#94a3b8" domain={[0, 80]} />
                          <YAxis yAxisId="terrain" orientation="right" hide domain={[0, 9000]} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                          <Area yAxisId="depth" type="monotone" dataKey="depth" name="Moho Depth" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={3} />
                          <Area yAxisId="terrain" type="monotone" dataKey="terrain" name="Surface Elevation" stroke="#cbd5e1" fill="#cbd5e1" fillOpacity={0.1} strokeWidth={1} />
                          <ReferenceLine yAxisId="depth" x={80} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'SYNTAXIAL AXIS', fill: '#ef4444', fontSize: 10 }} />
                          
                          <ReferenceDot yAxisId="depth" x={80} y={65} r={6} fill="#ef4444" stroke="none">
                              <Label value="MAX THICKNESS (65km)" position="top" fill="#ef4444" fontSize={10} fontWeight="bold" />
                          </ReferenceDot>

                          <ReferenceDot yAxisId="depth" x={20} y={38} r={4} fill="#f59e0b" stroke="none">
                              <Label value="MOHO DISCONTINUITY" position="bottom" fill="#f59e0b" fontSize={10} />
                          </ReferenceDot>

                          <ReferenceDot yAxisId="depth" x={50} y={45} r={4} fill="#cbd5e1" stroke="none">
                              <Label value="INDIAN PLATE (Underthrusting)" position="insideBottomRight" fill="#cbd5e1" fontSize={10} />
                          </ReferenceDot>
                       </ComposedChart>
                    </ResponsiveContainer>
                 </div>
              ) : viewMode === 'geochron' ? (
                  <div className="w-full h-full flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
                      {/* Cooling History Chart */}
                      <div className="h-72 flex-shrink-0 bg-sentinel-900/50 rounded-lg p-2 border border-sentinel-700/50">
                        <div className="flex justify-between items-center px-2 mb-2">
                            <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider">Cooling History (Thermochronology)</h4>
                            <span className="text-[10px] text-slate-500">Exhumation Rate Indicator</span>
                        </div>
                        <ResponsiveContainer width="100%" height="90%">
                            <ComposedChart data={COOLING_HISTORY} margin={{ top: 10, right: 30, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis 
                                    type="number" 
                                    dataKey="age" 
                                    reversed 
                                    domain={[0, 20]} 
                                    label={{ value: 'Age (Ma)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }} 
                                    stroke="#94a3b8" 
                                />
                                <YAxis 
                                    type="number" 
                                    dataKey="temp" 
                                    domain={[0, 800]} 
                                    label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} 
                                    stroke="#94a3b8" 
                                />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px' }} cursor={{ strokeDasharray: '3 3' }} />
                                <Line 
                                    type="monotone" 
                                    dataKey="temp" 
                                    stroke="#2dd4bf" 
                                    strokeWidth={2} 
                                    dot={{ r: 4, fill: '#2dd4bf' }} 
                                    activeDot={{ r: 6 }} 
                                >
                                    <LabelList dataKey="method" position="right" style={{ fill: '#94a3b8', fontSize: '9px' }} />
                                </Line>
                            </ComposedChart>
                        </ResponsiveContainer>
                     </div>

                     {/* Events Timeline - Interactive */}
                     <div className="flex-1 bg-sentinel-900/50 rounded-lg p-4 border border-sentinel-700/50 overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Key Tectonic Events</h4>
                            <IconClock className="w-4 h-4 text-teal-500" />
                        </div>
                        <div className="relative border-l border-teal-500/30 ml-3 space-y-6 pb-2">
                            {GEOCHRON_EVENTS.map((event) => (
                                <div 
                                    key={event.id} 
                                    className={`relative pl-6 cursor-pointer transition-all duration-300 group ${selectedEvent?.id === event.id ? 'scale-105' : 'hover:opacity-80'}`}
                                    onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
                                >
                                    {/* Timeline Dot */}
                                    <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 transition-colors ${selectedEvent?.id === event.id ? 'bg-teal-500 border-teal-300 shadow-[0_0_10px_rgba(20,184,166,0.5)]' : 'bg-sentinel-900 border-teal-500'}`}></div>
                                    
                                    {/* Card Body */}
                                    <div className={`flex flex-col p-3 rounded-lg border transition-all ${selectedEvent?.id === event.id ? 'bg-sentinel-800 border-teal-500/50 shadow-lg' : 'border-transparent hover:bg-sentinel-800/50'}`}>
                                        <span className="text-[10px] font-mono text-teal-400 font-bold bg-teal-500/10 px-1.5 py-0.5 rounded w-fit mb-1">{event.time}</span>
                                        <span className="text-sm font-bold text-white">{event.event}</span>
                                        <p className="text-xs text-slate-400 mt-1">{event.desc}</p>
                                        
                                        {/* Expanded details if selected */}
                                        {selectedEvent?.id === event.id && (
                                            <div className="mt-3 pt-2 border-t border-sentinel-700 animate-in fade-in slide-in-from-top-2">
                                                <p className="text-[10px] text-slate-300 leading-relaxed italic mb-2">
                                                    {event.details}
                                                </p>
                                                <div className="flex items-center gap-1 text-[9px] text-teal-400 uppercase font-bold bg-teal-500/5 p-1 rounded">
                                                    <IconActivity className="w-3 h-3" />
                                                    Ready for Deep Analysis
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>
                  </div>
              ) : (
                 <div className="w-full h-full flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
                     
                     <div className="flex gap-4 h-[500px]">
                         {/* Interactive Stratigraphic Column */}
                         <div className="w-1/3 bg-sentinel-900/50 rounded-lg p-3 border border-sentinel-700/50 flex flex-col">
                             <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Stratigraphy</h4>
                                <span className="text-[10px] text-slate-500">Relative Thickness</span>
                             </div>
                             
                             <div className="flex-1 relative flex">
                                 {/* Time Scale Axis */}
                                 <div className="w-8 flex flex-col justify-between text-[9px] text-slate-500 font-mono py-1 pr-1 border-r border-slate-700/50 text-right">
                                     <span>0 Ma</span>
                                     <span>10 Ma</span>
                                     <span>50 Ma</span>
                                     <span>500 Ma</span>
                                     <span>1.8 Ga</span>
                                 </div>
                                 
                                 {/* SVG Column */}
                                 <div className="flex-1 relative ml-2">
                                     <svg width="100%" height="100%" preserveAspectRatio="none">
                                         <defs>
                                             {/* Granite Pattern */}
                                             <pattern id="pat-granite" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                                                 <rect width="10" height="10" fill="currentColor" fillOpacity="0.1"/>
                                                 <circle cx="2" cy="2" r="1" fill="currentColor" fillOpacity="0.4"/>
                                                 <circle cx="7" cy="7" r="1" fill="currentColor" fillOpacity="0.4"/>
                                                 <path d="M5,2 L6,3 M8,5 L7,6" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3"/>
                                             </pattern>
                                             {/* Gneiss Pattern (Wavy) */}
                                             <pattern id="pat-gneiss" x="0" y="0" width="20" height="10" patternUnits="userSpaceOnUse">
                                                  <rect width="20" height="10" fill="currentColor" fillOpacity="0.1"/>
                                                  <path d="M0,5 Q5,2 10,5 T20,5" stroke="currentColor" strokeWidth="0.5" fill="none" strokeOpacity="0.4"/>
                                             </pattern>
                                             {/* Sediment Pattern (Brick/Block) */}
                                             <pattern id="pat-sediment" x="0" y="0" width="20" height="10" patternUnits="userSpaceOnUse">
                                                 <rect width="20" height="10" fill="currentColor" fillOpacity="0.1"/>
                                                 <path d="M0,10 L20,10 M10,0 L10,10" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.4"/>
                                             </pattern>
                                              {/* Mafic Pattern (Darker Dashes) */}
                                             <pattern id="pat-mafic" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                                                  <rect width="8" height="8" fill="currentColor" fillOpacity="0.2"/>
                                                  <path d="M0,8 L8,0" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3"/>
                                             </pattern>
                                         </defs>
                                         
                                         {PETROLOGY_UNITS.map((unit, index) => {
                                             // Calculate Y position based on previous heights
                                             const prevHeight = PETROLOGY_UNITS.slice(0, index).reduce((acc, u) => acc + u.height, 0);
                                             return (
                                                 <g 
                                                    key={unit.id}
                                                    onClick={() => setActiveUnit(activeUnit?.id === unit.id ? null : unit)}
                                                    className="cursor-pointer hover:opacity-90 transition-opacity"
                                                 >
                                                     <rect 
                                                        x="0" 
                                                        y={`${prevHeight}%`} 
                                                        width="100%" 
                                                        height={`${unit.height}%`} 
                                                        fill={unit.color}
                                                        stroke="#0f172a"
                                                        strokeWidth="1"
                                                     />
                                                     {/* Pattern Overlay */}
                                                     <rect 
                                                        x="0" 
                                                        y={`${prevHeight}%`} 
                                                        width="100%" 
                                                        height={`${unit.height}%`} 
                                                        fill={`url(#pat-${unit.pattern})`}
                                                        className={activeUnit?.id === unit.id ? 'text-white' : 'text-slate-900'}
                                                        style={{ mixBlendMode: 'overlay' }}
                                                     />
                                                     
                                                     {/* Label inside bar */}
                                                     <text 
                                                        x="50%" 
                                                        y={`${prevHeight + (unit.height/2)}%`} 
                                                        dominantBaseline="middle" 
                                                        textAnchor="middle" 
                                                        fill={unit.pattern === 'mafic' ? 'white' : 'black'} 
                                                        fontSize="10" 
                                                        fontWeight="bold"
                                                        className="pointer-events-none drop-shadow-md opacity-0 hover:opacity-100 md:opacity-100"
                                                        style={{ textShadow: '0px 0px 4px rgba(255,255,255,0.5)' }}
                                                     >
                                                         {unit.id.toUpperCase()}
                                                     </text>
                                                 </g>
                                             );
                                         })}
                                     </svg>
                                 </div>
                             </div>
                         </div>
                         
                         {/* Charts & Details Column */}
                         <div className="w-2/3 flex flex-col gap-4 overflow-y-auto pr-1">
                             {/* Detail Card (Contextual) */}
                             <div className={`p-4 rounded-lg border transition-all duration-300 ${
                                 activeUnit 
                                 ? 'bg-sentinel-800 border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.1)]' 
                                 : 'bg-sentinel-900/30 border-dashed border-slate-700'
                             }`}>
                                 {activeUnit ? (
                                     <div className="animate-in fade-in slide-in-from-left-2">
                                         <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeUnit.color }}></span>
                                                    {activeUnit.name}
                                                </h4>
                                                <p className="text-xs font-mono text-pink-400">{activeUnit.age} • {activeUnit.type}</p>
                                            </div>
                                            <button onClick={() => setActiveUnit(null)} className="text-slate-500 hover:text-white">
                                                <IconX className="w-4 h-4" />
                                            </button>
                                         </div>
                                         <p className="text-sm text-slate-300 mb-3 leading-relaxed">{activeUnit.desc}</p>
                                         <div className="bg-sentinel-900 p-2 rounded border border-sentinel-700">
                                             <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Key Mineral Assemblage</p>
                                             <p className="text-xs font-mono text-emerald-300">{activeUnit.minerals}</p>
                                         </div>
                                     </div>
                                 ) : (
                                     <div className="h-full flex flex-col items-center justify-center text-slate-500 py-6">
                                         <IconLayers className="w-8 h-8 mb-2 opacity-20" />
                                         <p className="text-xs">Select a unit from the column to view petrological details</p>
                                     </div>
                                 )}
                             </div>

                             {/* P-T Path Chart */}
                             <div className="h-48 flex-shrink-0 bg-sentinel-900/50 rounded-lg p-2 border border-sentinel-700/50">
                                <div className="flex justify-between items-center px-2 mb-2">
                                    <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider">Metamorphic P-T Path</h4>
                                    <span className="text-[10px] text-slate-500">Decompression Trajectory</span>
                                </div>
                                <ResponsiveContainer width="100%" height="85%">
                                    <ComposedChart data={PT_PATH_DATA} margin={{ top: 10, right: 30, bottom: 20, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis type="number" dataKey="temp" domain={[200, 900]} label={{ value: 'T (°C)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }} stroke="#94a3b8" tick={{fontSize: 10}} />
                                        <YAxis type="number" dataKey="pressure" reversed domain={[0, 12]} label={{ value: 'P (kbar)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} stroke="#94a3b8" tick={{fontSize: 10}} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px' }} cursor={{ strokeDasharray: '3 3' }} />
                                        <Line type="natural" dataKey="pressure" stroke="#f472b6" strokeWidth={2} dot={{ r: 3, fill: '#f472b6' }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                             </div>

                             {/* Geochem Chart */}
                             <div className="h-48 flex-shrink-0 bg-sentinel-900/50 rounded-lg p-2 border border-sentinel-700/50">
                                <div className="flex justify-between items-center px-2 mb-2">
                                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Geochemistry</h4>
                                    <span className="text-[10px] text-slate-500">Major Oxides (Wt%)</span>
                                </div>
                                <ResponsiveContainer width="100%" height="85%">
                                    <BarChart data={GEOCHEM_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                        <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                                        <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px' }} cursor={{fill: '#1e293b'}} />
                                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                                        <Bar dataKey="gneiss" name="Gneiss" fill="#64748b" />
                                        <Bar dataKey="leuco" name="Leucogranite" fill="#f472b6" />
                                    </BarChart>
                                </ResponsiveContainer>
                             </div>
                         </div>
                     </div>
                 </div>
              )}
           </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-shrink-0">
             <div className="bg-sentinel-800 p-4 rounded-xl border border-sentinel-700">
                 <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Convergence Rate</p>
                 <p className="text-2xl font-mono text-white">38 <span className="text-xs text-slate-500">mm/yr</span></p>
                 <div className="w-full bg-sentinel-900 h-1 mt-2 rounded-full overflow-hidden">
                     <div className="bg-sky-500 h-full w-[80%]"></div>
                 </div>
             </div>
             <div className="bg-sentinel-800 p-4 rounded-xl border border-sentinel-700">
                 <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Max Uplift</p>
                 <p className="text-2xl font-mono text-orange-400">12 <span className="text-xs text-slate-500">mm/yr</span></p>
                 <div className="w-full bg-sentinel-900 h-1 mt-2 rounded-full overflow-hidden">
                     <div className="bg-orange-500 h-full w-[95%]"></div>
                 </div>
             </div>
             <div className="bg-sentinel-800 p-4 rounded-xl border border-sentinel-700">
                 <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Seismic Strain</p>
                 <p className="text-2xl font-mono text-red-400">High</p>
                 <p className="text-[10px] text-slate-500 mt-1">Locked Segment</p>
             </div>
             <div className="bg-sentinel-800 p-4 rounded-xl border border-sentinel-700">
                 <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Moho Depth</p>
                 <p className="text-2xl font-mono text-emerald-400">65 <span className="text-xs text-slate-500">km</span></p>
                 <p className="text-[10px] text-slate-500 mt-1">Crustal Root</p>
             </div>
        </div>

      </div>

      {/* Analysis Column */}
      <div className="h-full min-h-[500px]">
        <AnalysisPanel 
          title={getAnalysisTitle()}
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

export default TectonicsView;