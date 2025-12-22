import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Area, BarChart, Bar, Cell } from 'recharts';
import AnalysisPanel from './AnalysisPanel';
import { generateDeepThinkingInsight } from '../services/geminiService';
import { AiResponse } from '../types';
import { IconTectonics, IconActivity, IconMap, IconLayers, IconBeaker, IconHistory, IconNavigation, IconMountain, IconActivity as IconDisplacement } from './Icons';

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
  displacement_m: number;
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
    id: 'mkt',
    name: 'MKT',
    type: 'Northern Suture',
    status: 'Inactive/Dormant',
    description: 'Main Kohistan Thrust: The Northern Suture zone separating the Kohistan Island Arc from Eurasia.',
    geologicalSignificance: 'Represents the site of initial closure between the arc and the mainland.',
    path: 'M 10,20 Q 50,15 90,20',
    color: '#8b5cf6',
    displacement_m: 12000,
    dashArray: '3 3',
    labelPos: { x: 50, y: 15 }
  },
  {
    id: 'rbt',
    name: 'RBT (Back Thrust)',
    type: 'Reverse Retro-Thrust',
    status: 'Deep Activity',
    description: 'Reverse Back Thrust: A northward-verging fault accommodating internal shortening within the syntaxial wedge.',
    geologicalSignificance: 'Crucial for maintaining the vertical exhumation pop-up mechanics.',
    path: 'M 35,28 Q 50,25 65,28',
    color: '#fb7185',
    displacement_m: 180,
    dashArray: '2 1',
    labelPos: { x: 50, y: 22 }
  },
  {
    id: 'mmt',
    name: 'MMT',
    type: 'Southern Suture',
    status: 'Reactivated',
    description: 'Main Mantle Thrust: Separates the Kohistan Island Arc from the Indian Plate.',
    geologicalSignificance: 'The primary collision boundary defining the syntaxial loop.',
    path: 'M 20,100 C 30,60 40,30 50,25 C 60,30 70,60 80,100',
    color: '#ef4444',
    displacement_m: 8500,
    dashArray: '4 2',
    labelPos: { x: 50, y: 28 }
  },
  {
    id: 'raikot',
    name: 'Raikot Fault',
    type: 'Active Normal/Thrust',
    status: 'Critical',
    description: 'Western bounding fault of the Nanga Parbat Syntaxis.',
    geologicalSignificance: 'Primary exhumation structure accommodating vertical extrusion.',
    path: 'M 48,32 Q 40,50 38,70',
    color: '#f97316',
    displacement_m: 450,
    labelPos: { x: 36, y: 55 }
  },
  {
    id: 'jhelum',
    name: 'Jhelum Fault',
    type: 'Shear Zone',
    status: 'Active',
    description: 'A major dextral shear zone accommodating the rotation and westward escape of the syntaxial block.',
    geologicalSignificance: 'Defines the western kinetic boundary of the Himalayan bend.',
    path: 'M 20,120 Q 25,100 35,70',
    color: '#34d399',
    displacement_m: 1100,
    dashArray: '5 2',
    labelPos: { x: 25, y: 90 }
  },
  {
    id: 'stak',
    name: 'Stak Fault',
    type: 'Thrust System',
    status: 'Active',
    description: 'Eastern bounding structural boundary of the syntaxial pop-up.',
    geologicalSignificance: 'Conjugate structure to Raikot.',
    path: 'M 52,32 Q 60,50 62,70',
    color: '#eab308',
    displacement_m: 320,
    labelPos: { x: 64, y: 55 }
  },
  {
    id: 'mct',
    name: 'MCT',
    type: 'Major Crustal Thrust',
    status: 'Active (Depth)',
    description: 'Main Central Thrust: Separating the Higher and Lesser Himalayan sequences.',
    geologicalSignificance: 'Accommodates massive crustal shortening and high-grade transport.',
    path: 'M 0,110 Q 50,90 100,110',
    color: '#ec4899',
    displacement_m: 15000,
    dashArray: '8 4',
    labelPos: { x: 20, y: 95 }
  },
  {
    id: 'mbt',
    name: 'MBT',
    type: 'Active Frontal Thrust',
    status: 'Active',
    description: 'Main Boundary Thrust: Frontal thrust system separating Lesser Himalaya from the Siwaliks.',
    geologicalSignificance: 'Most recent and active major frontal thrust.',
    path: 'M 0,120 Q 50,105 100,120',
    color: '#06b6d4',
    displacement_m: 5000,
    labelPos: { x: 80, y: 110 }
  }
];

const CRUSTAL_PROFILE = [
  { dist: 0, depth: 35, terrain: 1000, label: 'Foreland' },
  { dist: 20, depth: 38, terrain: 1500, label: 'MBT' },
  { dist: 40, depth: 45, terrain: 2500, label: 'MCT' },
  { dist: 60, depth: 55, terrain: 4500, label: 'Lesser Him.' },
  { dist: 80, depth: 65, terrain: 6500, label: 'NP Massif' },
  { dist: 100, depth: 50, terrain: 4000, label: 'Indus Suture' },
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
    color: '#fbcfe8',
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
    color: '#4ade80',
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
    color: '#334155',
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
    color: '#94a3b8',
    height: 55,
    pattern: 'gneiss'
  }
];

const TectonicsView: React.FC = () => {
  const [viewMode, setViewMode] = useState<'map' | 'profile' | 'section' | 'petrology' | 'geochron' | 'displacement'>('map');
  const [activeFault, setActiveFault] = useState<TectonicFault | null>(null);
  const [selectedGps, setSelectedGps] = useState<VelocityVector | null>(null);
  const [activeUnit, setActiveUnit] = useState<PetrologyUnit | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<GeochronEvent | null>(null);
  const [hoveredUnit, setHoveredUnit] = useState<string | null>(null);
  
  const [aiState, setAiState] = useState<AiResponse>({
    markdown: '',
    loading: false,
    isThinking: false
  });

  const displacementData = useMemo(() => {
    return [...TECTONIC_FAULTS]
      .sort((a, b) => b.displacement_m - a.displacement_m)
      .map(f => ({ name: f.name, displacement: f.displacement_m, color: f.color }));
  }, []);

  const handleAnalysis = async (target?: any) => {
    setAiState({ markdown: '', loading: true, isThinking: true });

    let prompt = '';

    if (viewMode === 'displacement') {
      prompt = `
        **DISPLACEMENT MAGNITUDE ANALYSIS: NANGA PARBAT FAULT SYSTEMS**
        
        Analyze the relative displacement magnitudes across the identified fault systems:
        1. **Major Crustal Shortening**: MCT at 15km and MKT at 12km displacement. Discuss the deep-time historical significance of these sutures.
        2. **Active Exhumation Systems**: Raikot (450m) and Stak (320m). Contrast these values with their extreme modern slip rates.
        3. **Kinetic Boundaries**: The Jhelum shear zone at 1.1km and the **Reverse Back Thrust (RBT)** at 180m. 
        4. **Structural Interpretation**: Explain the importance of back-thrusting (RBT) in the context of the syntaxial "wedge" mechanics and how it facilitates core extrusion.

        **Tone:** Senior Tectonophysicist.
      `;
    } else if (viewMode === 'section') {
      prompt = `
        **STRUCTURAL CROSS-SECTION ANALYSIS: NANGA PARBAT SYNTAXIS**
        
        Analyze the provided balanced cross-section geometry:
        1. **Kinematic Modeling**: Explain the "pop-up" mechanism between the Raikot and Stak faults.
        2. **Retro-Vergence**: Interpret the role of the Reverse Back Thrust (RBT) in the section.
        3. **Isostatic Response**: Link the 7km vertical relief to the erosional feedback from the Indus River (Tectonic Aneurysm).
        4. **Deep Structure**: Interpret the role of the Indian crustal ramp and the Main Mantle Thrust (MMT) loop at depth.

        **Tone:** Senior Structural Geologist.
      `;
    } else if (target?.station) {
      prompt = `
        **GEODETIC ANALYSIS: STATION ${target.station}**
        
        **GNSS Data:**
        - Easting Velocity (Vx): ${target.vx} mm/yr
        - Northing Velocity (Vy): ${target.vy} mm/yr
        - Vector Magnitude: ${Math.sqrt(target.vx**2 + target.vy**2).toFixed(2)} mm/yr
        
        **Analysis Requirements:**
        1. **Regional Kinematics**: Interpret this motion vector in the context of the Indian Plate's NNE convergence (~40mm/yr).
        2. **Strain Accumulation**: Is this station showing an extrusion signature relative to the stable Tibetan plateau?
        
        **Tone:** Senior Geodesist.
      `;
    } else if (target?.name && target?.status) {
      prompt = `
        **FAULT ANALYSIS: ${target.name.toUpperCase()}**
        
        **Structural Data:**
        - Type: ${target.type}
        - Status: ${target.status}
        - Displacement: ${target.displacement_m}m
        
        **Analysis Requirements:**
        1. **Kinematic Role**: Detail the fault's role in the syntaxial pop-up or shear escape mechanism.
        2. **Critical Assessment**: If this is the **Reverse Back Thrust (RBT)**, explain its importance in maintaining structural stability during rapid vertical exhumation.
        3. **Cumulative vs. Instantaneous**: How does the displacement of ${target.displacement_m}m compare to the predicted seismic cycle of this structure?
        
        **Tone:** Structural Geologist / Tectonophysicist.
      `;
    } else if (viewMode === 'petrology') {
      prompt = `
        **PETROLOGICAL & GEOCHEMICAL ANALYSIS: NANGA PARBAT**
        Analyze the metamorphic P-T evolution and the fluid-absent melting models forming "Tato Leucogranites".
        **Tone:** Senior Petrologist.
      `;
    } else if (viewMode === 'geochron') {
      const event = target || selectedEvent;
      prompt = event ? `
          **EVENT ANALYSIS: ${event.event.toUpperCase()} (${event.time})**
          ${event.details}
          Tone: Senior Geochronologist.
      ` : `
          **GEOCHRONOLOGICAL OVERVIEW: NANGA PARBAT SYNTAXIS**
          Analyze the extreme thermochronological gradient of the massif.
          Tone: Senior Scientist.
      `;
    } else {
      prompt = `
        **TECTONIC STRUCTURAL ANALYSIS: NANGA PARBAT SYNTAXIS**
        Provide a physics-based explanation of the Western Himalayan Syntaxis.
        Tone: Senior Tectonophysicist.
      `;
    }

    try {
      const result = await generateDeepThinkingInsight(prompt);
      setAiState({ markdown: result, loading: false, isThinking: false });
    } catch (e) {
      setAiState({ markdown: "Analysis failed due to link degradation.", loading: false, isThinking: false });
    }
  };

  useEffect(() => {
    if (activeFault) {
      handleAnalysis(activeFault);
      setSelectedGps(null);
    }
  }, [activeFault?.id]);

  useEffect(() => {
    if (selectedGps) {
      handleAnalysis(selectedGps);
      setActiveFault(null);
    }
  }, [selectedGps?.id]);

  useEffect(() => {
    if (viewMode === 'section' || viewMode === 'displacement') {
      handleAnalysis();
    }
  }, [viewMode]);

  const handleExport = () => {
    const report = {
      type: "TECTONIC_STRUCTURAL_REPORT",
      timestamp: new Date().toISOString(),
      viewMode,
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
    if (selectedGps) return `Station ${selectedGps.station} Intel`;
    if (activeFault) return `Fault SITREP: ${activeFault.name}`;
    if (viewMode === 'section') return "Balanced Cross-Section Intel";
    if (viewMode === 'displacement') return "Displacement Magnitude Intel";
    if (viewMode === 'petrology') return "Petrology Analysis";
    if (viewMode === 'geochron') return "Geochronology Intel";
    return "Regional Geodynamic Intel";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full p-6 overflow-hidden">
      <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
        
        <div className="bg-sentinel-800 p-6 rounded-xl border border-sentinel-700 shadow-lg flex-shrink-0 flex flex-col h-[600px] relative overflow-hidden">
           <div className="flex justify-between items-center mb-6 relative z-10">
              <div>
                 <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {viewMode === 'petrology' ? <IconBeaker className="w-6 h-6 text-pink-400" /> : 
                     viewMode === 'geochron' ? <IconHistory className="w-6 h-6 text-teal-400" /> :
                     viewMode === 'section' ? <IconMountain className="w-6 h-6 text-emerald-400" /> :
                     viewMode === 'displacement' ? <IconDisplacement className="w-6 h-6 text-red-400" /> :
                     <IconTectonics className="w-6 h-6 text-orange-500" />}
                    {viewMode === 'petrology' ? 'Petrology' : viewMode === 'geochron' ? 'Geochronology' : viewMode === 'section' ? 'Balanced Section' : viewMode === 'displacement' ? 'Displacement' : 'Geodynamics'}
                 </h3>
                 <p className="text-slate-400 text-sm">
                     {viewMode === 'petrology' ? 'Metamorphic P-T evolution & composition.' : 
                      viewMode === 'geochron' ? 'Thermochronometry & Exhumation Rates.' :
                      viewMode === 'section' ? 'Structural geometry & pop-up mechanics.' :
                      viewMode === 'displacement' ? 'Fault displacement magnitudes (m).' :
                      'Plate motion kinematics & fault systems.'}
                 </p>
              </div>
              <div className="flex bg-sentinel-900 rounded-lg p-1 border border-sentinel-700 shadow-inner overflow-x-auto no-scrollbar">
                 <button onClick={() => setViewMode('map')} className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all whitespace-nowrap ${viewMode === 'map' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>MAP</button>
                 <button onClick={() => setViewMode('profile')} className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all whitespace-nowrap ${viewMode === 'profile' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>CRUST</button>
                 <button onClick={() => setViewMode('section')} className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all whitespace-nowrap ${viewMode === 'section' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>SECTION</button>
                 <button onClick={() => setViewMode('displacement')} className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all whitespace-nowrap ${viewMode === 'displacement' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>DISP</button>
                 <button onClick={() => setViewMode('petrology')} className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all whitespace-nowrap ${viewMode === 'petrology' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>PETRO</button>
                 <button onClick={() => setViewMode('geochron')} className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all whitespace-nowrap ${viewMode === 'geochron' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>AGE</button>
              </div>
           </div>

           <div className="flex-1 relative bg-sentinel-900 rounded-xl overflow-hidden border border-sentinel-700/50 p-4 shadow-inner">
              {viewMode === 'map' ? (
                 <div className="w-full h-full relative">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                       <defs>
                          <marker id="arrowhead" markerWidth="4" markerHeight="4" refX="4" refY="2" orient="auto">
                             <polygon points="0 0, 4 2, 0 4" fill="#38bdf8" />
                          </marker>
                          <marker id="thrustTeeth" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                              <path d="M 0 0 L 6 3 L 0 6 z" fill="#ef4444" opacity="0.9" />
                          </marker>
                          <marker id="thrustTeethAlt" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                              <path d="M 0 0 L 6 3 L 0 6 z" fill="#8b5cf6" opacity="0.9" />
                          </marker>
                          <marker id="backThrustTeeth" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                              <path d="M 6 0 L 0 3 L 6 6 z" fill="#fb7185" opacity="0.9" />
                          </marker>
                          
                          <filter id="glow">
                             <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                             <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                          </filter>
                          
                          <pattern id="pattern-grid" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                             <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.05" opacity="0.05"/>
                          </pattern>
                       </defs>

                       <rect width="100" height="100" fill="url(#pattern-grid)" />

                       <path 
                          d="M 10,20 Q 50,15 90,20 C 85,45 65,45 50,25 C 35,45 15,45 10,20 Z" 
                          fill="#8b5cf6" 
                          fillOpacity="0.1" 
                          stroke="#8b5cf6"
                          strokeWidth="0.1"
                          strokeDasharray="1 1"
                       />
                       <text x="50" y="22" fontSize="2.5" fill="#8b5cf6" textAnchor="middle" fontWeight="bold" opacity="0.6">KOHISTAN ISLAND ARC</text>

                       <path d="M 0,0 L 100,0 L 100,100 L 0,100 Z" fill="#0f172a" opacity="0.5" />
                       
                       {TECTONIC_FAULTS.map((fault) => (
                           <g key={fault.id} onClick={() => { setActiveFault(activeFault?.id === fault.id ? null : fault); setSelectedGps(null); }} className="cursor-pointer group">
                               <path d={fault.path} fill="none" stroke="transparent" strokeWidth="10" />
                               <path 
                                  d={fault.path} 
                                  fill="none" 
                                  stroke={fault.color} 
                                  strokeWidth={activeFault?.id === fault.id ? 2.5 : 1.2} 
                                  strokeDasharray={fault.dashArray}
                                  markerEnd={
                                    fault.id === 'mkt' ? "url(#thrustTeethAlt)" : 
                                    fault.id === 'rbt' ? "url(#backThrustTeeth)" :
                                    fault.type.includes('Thrust') ? "url(#thrustTeeth)" : ""
                                  }
                                  className="transition-all duration-300 group-hover:stroke-[1.8]"
                                  filter={activeFault?.id === fault.id ? "url(#glow)" : ""}
                               />
                               <circle cx={fault.labelPos.x} cy={fault.labelPos.y} r="1" fill={fault.color} className="animate-pulse" />
                               
                               <text 
                                  x={fault.labelPos.x} 
                                  y={fault.labelPos.y - 2} 
                                  fontSize="1.8" 
                                  fill={fault.color} 
                                  textAnchor="middle" 
                                  className="font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-black/50"
                               >
                                   {fault.name}
                               </text>
                           </g>
                       ))}

                       {GPS_DATA.map((vec) => (
                          <g key={vec.id} onClick={() => { setSelectedGps(selectedGps?.id === vec.id ? null : vec); setActiveFault(null); }} className="cursor-pointer group">
                             <circle cx={vec.long} cy={100 - vec.lat} r="4" fill="transparent" />
                             <line 
                                x1={vec.long} y1={100 - vec.lat} 
                                x2={vec.long + (vec.vx / 4)} y2={(100 - vec.lat) - (vec.vy / 4)} 
                                stroke="#38bdf8" 
                                strokeWidth={selectedGps?.id === vec.id ? 1.5 : 0.8} 
                                markerEnd="url(#arrowhead)"
                             />
                             <circle cx={vec.long} cy={100 - vec.lat} r={selectedGps?.id === vec.id ? 1.5 : 0.8} fill={selectedGps?.id === vec.id ? "#fff" : "#0ea5e9"} stroke={selectedGps?.id === vec.id ? "#38bdf8" : "none"} strokeWidth="0.5" />
                             <text x={vec.long + 2} y={100 - vec.lat + 1} fontSize="2" fill={selectedGps?.id === vec.id ? "#fff" : "#94a3b8"} className={`font-bold uppercase tracking-widest transition-opacity ${selectedGps?.id === vec.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>{vec.station}</text>
                          </g>
                       ))}
                    </svg>

                    <div className="absolute top-4 left-4 pointer-events-none">
                        <div className="bg-sentinel-900/80 backdrop-blur p-3 rounded-lg border border-sentinel-700 shadow-xl">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Examination Key</h5>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2"><IconNavigation className="w-3 h-3 text-sky-400 transform -rotate-45" /><span className="text-[9px] text-slate-300">GPS Velocity (mm/yr)</span></div>
                                <div className="flex items-center gap-2"><div className="w-4 h-0.5 bg-red-500 border-b border-red-500 relative flex items-center justify-end"><div className="w-1.5 h-1.5 border-t border-r border-red-500 transform rotate-45 -mr-1"></div></div><span className="text-[9px] text-slate-300">Main Suture (MMT)</span></div>
                                <div className="flex items-center gap-2"><div className="w-4 h-0.5 bg-purple-500 border-b border-purple-500 border-dashed"></div><span className="text-[9px] text-slate-300">Northern Suture (MKT)</span></div>
                                <div className="flex items-center gap-2"><div className="w-4 h-0.5 bg-[#fb7185] border-b border-[#fb7185] border-dotted"></div><span className="text-[9px] text-slate-300">Reverse Back Thrust</span></div>
                                <div className="flex items-center gap-2"><div className="w-4 h-0.5 bg-[#34d399] border-b border-[#34d399] border-dashed"></div><span className="text-[9px] text-slate-300">Jhelum Shear Zone</span></div>
                                <div className="flex items-center gap-2"><div className="w-4 h-0.5 bg-cyan-500"></div><span className="text-[9px] text-slate-300">Frontal Thrust (MBT/MCT)</span></div>
                            </div>
                        </div>
                    </div>
                 </div>
              ) : viewMode === 'profile' ? (
                 <div className="w-full h-full p-4">
                    <ResponsiveContainer width="100%" height="100%">
                       <ComposedChart data={CRUSTAL_PROFILE} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="dist" label={{ value: 'Distance (km)', position: 'insideBottom', offset: -5, fill: '#64748b' }} stroke="#94a3b8" />
                          <YAxis yAxisId="depth" reversed label={{ value: 'Moho Depth (km)', angle: -90, position: 'insideLeft', fill: '#64748b' }} stroke="#94a3b8" domain={[0, 80]} />
                          <YAxis yAxisId="terrain" orientation="right" hide domain={[0, 9000]} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                          <Area yAxisId="depth" type="monotone" dataKey="depth" name="Moho Depth" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={3} />
                          <Area yAxisId="terrain" type="monotone" dataKey="terrain" name="Surface Elevation" stroke="#cbd5e1" fill="#cbd5e1" fillOpacity={0.1} strokeWidth={1} />
                       </ComposedChart>
                    </ResponsiveContainer>
                 </div>
              ) : viewMode === 'displacement' ? (
                  <div className="w-full h-full flex flex-col p-4">
                      <div className="flex-1 bg-sentinel-900/50 rounded-lg p-4 border border-sentinel-700/50 shadow-inner overflow-hidden">
                          <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-4">Fault Displacement Magnitude (m)</h4>
                          <ResponsiveContainer width="100%" height="95%">
                              <BarChart data={displacementData} layout="vertical" margin={{ left: 10, right: 30 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                  <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                                  <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 10 }} width={80} />
                                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                                  <Bar dataKey="displacement" radius={[0, 4, 4, 0]}>
                                      {displacementData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />)}
                                  </Bar>
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                      <div className="mt-4 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                          <p className="text-[10px] text-slate-400 font-mono italic leading-tight">Sorted by magnitude. Major crustal sutures (MCT/MKT) dominate the structural history, while active exhumation systems show recent intense slip signatures.</p>
                      </div>
                  </div>
              ) : viewMode === 'section' ? (
                 <div className="w-full h-full bg-[#020617] relative flex flex-col p-4">
                    <div className="flex-1 border border-emerald-500/20 rounded-xl overflow-hidden relative group">
                        <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
                            <defs>
                                <pattern id="diag-gneiss-core" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                    <path d="M0,10 Q5,0 10,10 T20,10" fill="none" stroke="white" strokeWidth="0.5" opacity="0.1" />
                                </pattern>
                                <linearGradient id="sky-grad" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#0f172a" /><stop offset="100%" stopColor="#1e293b" /></linearGradient>
                            </defs>
                            <rect width="400" height="300" fill="url(#sky-grad)" />
                            <path d="M 0,280 Q 150,250 250,200 L 400,220 L 400,300 L 0,300 Z" fill="#1c1917" stroke="#44403c" strokeWidth="1" onMouseEnter={() => setHoveredUnit("Indian Plate Basement")} onMouseLeave={() => setHoveredUnit(null)} />
                            <path d="M 0,250 Q 100,220 200,180 Q 220,120 250,140 Q 280,180 400,190 L 400,220 L 250,200 Q 150,250 0,280 Z" fill="#065f46" fillOpacity="0.4" stroke="#059669" strokeWidth="1" onMouseEnter={() => setHoveredUnit("Mito Cover Sequence (Folded)")} onMouseLeave={() => setHoveredUnit(null)} />
                            <path d="M 120,220 Q 180,80 200,40 Q 220,80 280,220 L 250,250 Q 200,150 150,250 Z" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" onMouseEnter={() => setHoveredUnit("Iskere Gneiss Core (Pop-up)")} onMouseLeave={() => setHoveredUnit(null)} />
                            <rect x="150" y="40" width="100" height="200" fill="url(#diag-gneiss-core)" pointerEvents="none" />
                            <path d="M 190,60 Q 200,40 210,60 Z" fill="#fbcfe8" fillOpacity="0.8" stroke="#ec4899" strokeWidth="0.5" />
                            <path d="M 130,280 Q 150,150 175,42" fill="none" stroke="#f97316" strokeWidth="2.5" strokeDasharray="4 2" />
                            <path d="M 320,280 Q 280,150 250,42" fill="none" stroke="#eab308" strokeWidth="2.5" strokeDasharray="4 2" />
                            <path d="M 50,300 Q 100,50 200,20 Q 300,50 350,300" fill="none" stroke="#ef4444" strokeWidth="3" opacity="0.8" />
                            <path d="M 220,100 Q 200,80 180,85" fill="none" stroke="#fb7185" strokeWidth="1.5" strokeDasharray="2 1" />
                            <path d="M 0,230 L 100,210 L 150,150 L 200,20 L 250,150 L 300,180 L 400,190" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                            <g fontSize="6" fill="white" fontWeight="bold" fontFamily="monospace">
                                <text x="185" y="15" textAnchor="middle">NANGA PARBAT PEAK</text>
                                <text x="140" y="120" transform="rotate(-70 140,120)" fill="#f97316">RAIKOT FAULT</text>
                                <text x="275" y="120" transform="rotate(70 275,120)" fill="#eab308">STAK FAULT</text>
                                <text x="50" y="150" fill="#ef4444">MMT SUTURE</text>
                                <text x="175" y="100" fill="#fb7185" fontSize="4">BACK THRUST</text>
                                <text x="200" y="270" textAnchor="middle" opacity="0.3">INDIAN CRUSTAL RAMP</text>
                            </g>
                        </svg>
                        <div className="absolute top-4 left-4 bg-sentinel-950/80 backdrop-blur p-3 rounded-lg border border-emerald-500/30">
                            <h5 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Structural Interpretation</h5>
                            <div className="mt-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div><span className="text-[8px] text-slate-300 font-mono">STABILITY: CRITICAL</span></div>
                        </div>
                        {hoveredUnit && <div className="absolute bottom-4 left-4 right-4 bg-sentinel-900/90 backdrop-blur p-2 rounded border border-white/10 text-center animate-in fade-in slide-in-from-bottom-2"><span className="text-xs font-bold text-white uppercase tracking-tighter">{hoveredUnit}</span></div>}
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                         <div className="bg-sentinel-800/50 p-2 rounded-lg border border-white/5 flex flex-col items-center"><span className="text-[8px] text-slate-500 uppercase font-black">Core Exhumation</span><span className="text-sm font-mono font-bold text-emerald-400">10 mm/yr</span></div>
                         <div className="bg-sentinel-800/50 p-2 rounded-lg border border-white/5 flex flex-col items-center"><span className="text-[8px] text-slate-500 uppercase font-black">Strain Balance</span><span className="text-sm font-mono font-bold text-emerald-400">Stable</span></div>
                         <div className="bg-sentinel-800/50 p-2 rounded-lg border border-white/5 flex flex-col items-center"><span className="text-[8px] text-slate-500 uppercase font-black">Model Confidence</span><span className="text-sm font-mono font-bold text-emerald-400">92%</span></div>
                    </div>
                 </div>
              ) : viewMode === 'geochron' ? (
                  <div className="w-full h-full flex flex-col gap-4 overflow-y-auto custom-scrollbar p-2">
                      <div className="h-64 flex-shrink-0 bg-sentinel-900/50 rounded-lg p-2 border border-sentinel-700/50 shadow-inner">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={COOLING_HISTORY} margin={{ top: 10, right: 30, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis type="number" dataKey="age" reversed domain={[0, 20]} stroke="#94a3b8" />
                                <YAxis type="number" dataKey="temp" domain={[0, 800]} stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px' }} />
                                <Line type="monotone" dataKey="temp" stroke="#2dd4bf" strokeWidth={2} dot={{ r: 4, fill: '#2dd4bf' }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="flex-1 bg-sentinel-900/50 rounded-lg p-4 border border-sentinel-700/50 overflow-y-auto shadow-inner">
                        <div className="space-y-4">
                            {GEOCHRON_EVENTS.map((event) => (
                                <div key={event.id} className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedEvent?.id === event.id ? 'bg-teal-500/10 border-teal-400 shadow-lg' : 'bg-sentinel-800 border-white/5 hover:border-white/10'}`} onClick={() => { setSelectedEvent(event); handleAnalysis(event); }}>
                                    <div className="flex justify-between items-center mb-2"><span className="text-[10px] font-black font-mono text-teal-400 uppercase tracking-tighter">{event.time}</span><span className="text-[9px] text-slate-500 font-mono uppercase">{event.type}</span></div>
                                    <h4 className="text-sm font-bold text-white mb-1">{event.event}</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">{event.desc}</p>
                                </div>
                            ))}
                        </div>
                     </div>
                  </div>
              ) : (
                 <div className="w-full h-full flex flex-col gap-4 overflow-y-auto custom-scrollbar p-2">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                         <div className="bg-sentinel-900/50 rounded-lg p-4 border border-sentinel-700/50 flex flex-col shadow-inner">
                             <h4 className="text-xs font-bold text-pink-400 uppercase tracking-widest mb-4">Stratigraphic Column</h4>
                             <div className="flex-1 relative flex">
                                 <div className="w-8 flex flex-col justify-between text-[9px] text-slate-600 font-mono py-1 pr-1 border-r border-slate-800"><span>0 Ma</span><span>2 Ga</span></div>
                                 <div className="flex-1 relative ml-2">
                                     <svg width="100%" height="100%" preserveAspectRatio="none">
                                         {PETROLOGY_UNITS.map((unit, index) => {
                                             const prevHeight = PETROLOGY_UNITS.slice(0, index).reduce((acc, u) => acc + u.height, 0);
                                             return (
                                                 <g key={unit.id} onClick={() => setActiveUnit(activeUnit?.id === unit.id ? null : unit)} className="cursor-pointer group">
                                                     <rect x="0" y={`${prevHeight}%`} width="100%" height={`${unit.height}%`} fill={unit.color} stroke="#0f172a" strokeWidth="1" className="transition-all group-hover:opacity-90" />
                                                     <text x="50%" y={`${prevHeight + unit.height/2}%`} dominantBaseline="middle" textAnchor="middle" fontSize="8" className="font-bold fill-sentinel-900 pointer-events-none uppercase">{unit.id}</text>
                                                 </g>
                                             );
                                         })}
                                     </svg>
                                 </div>
                             </div>
                         </div>
                         <div className="flex flex-col gap-4">
                             <div className="h-48 bg-sentinel-900/50 rounded-lg p-3 border border-sentinel-700/50 shadow-inner">
                                <h4 className="text-[10px] font-bold text-pink-400 uppercase mb-2">Metamorphic P-T Path</h4>
                                <ResponsiveContainer width="100%" height="85%">
                                    <ComposedChart data={PT_PATH_DATA}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" /><XAxis type="number" dataKey="temp" domain={[200, 900]} stroke="#94a3b8" tick={{fontSize: 9}} /><YAxis type="number" dataKey="pressure" reversed domain={[0, 12]} stroke="#94a3b8" tick={{fontSize: 9}} /><Line type="natural" dataKey="pressure" stroke="#f472b6" strokeWidth={2} dot={{ r: 3, fill: '#f472b6' }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                             </div>
                             <div className="flex-1 bg-sentinel-900/50 rounded-lg p-3 border border-sentinel-700/50 shadow-inner">
                                <h4 className="text-[10px] font-bold text-indigo-400 uppercase mb-2">SiO2 vs Geochem Units</h4>
                                <ResponsiveContainer width="100%" height="80%">
                                    <BarChart data={GEOCHEM_DATA} margin={{ left: -30 }}><XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9 }} /><Bar dataKey="gneiss" fill="#64748b" radius={[2, 2, 0, 0]} /><Bar dataKey="leuco" fill="#f472b6" radius={[2, 2, 0, 0]} /></BarChart>
                                </ResponsiveContainer>
                             </div>
                         </div>
                     </div>
                 </div>
              )}
           </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-shrink-0">
             <div className="bg-sentinel-800 p-4 rounded-xl border border-sentinel-700 shadow-lg group hover:border-orange-500/50 transition-colors"><p className="text-[10px] text-slate-500 uppercase font-black mb-1 group-hover:text-orange-400 transition-colors">Convergence</p><div className="flex items-baseline gap-1"><p className="text-2xl font-mono font-bold text-white tracking-tighter">38.2</p><span className="text-[10px] text-slate-500">mm/yr</span></div><div className="w-full bg-sentinel-900 h-1 mt-2 rounded-full overflow-hidden"><div className="bg-sky-500 h-full w-[80%] animate-pulse"></div></div></div>
             <div className="bg-sentinel-800 p-4 rounded-xl border border-sentinel-700 shadow-lg group hover:border-orange-500/50 transition-colors"><p className="text-[10px] text-slate-500 uppercase font-black mb-1 group-hover:text-orange-400 transition-colors">Exhumation</p><div className="flex items-baseline gap-1"><p className="text-2xl font-mono font-bold text-orange-400 tracking-tighter">+10.5</p><span className="text-[10px] text-slate-500">mm/yr</span></div><div className="w-full bg-sentinel-900 h-1 mt-2 rounded-full overflow-hidden"><div className="bg-orange-500 h-full w-[95%]"></div></div></div>
             <div className="bg-sentinel-800 p-4 rounded-xl border border-sentinel-700 shadow-lg group hover:border-red-500/50 transition-colors"><p className="text-[10px] text-slate-500 uppercase font-black mb-1 group-hover:text-red-400 transition-colors">Locked Segments</p><p className="text-2xl font-mono font-bold text-red-500 tracking-tighter">42%</p><p className="text-[8px] text-slate-600 mt-1 font-bold">Strain Gradient: High</p></div>
             <div className="bg-sentinel-800 p-4 rounded-xl border border-sentinel-700 shadow-lg group hover:border-emerald-500/50 transition-colors"><p className="text-[10px] text-slate-500 uppercase font-black mb-1 group-hover:text-emerald-400 transition-colors">Moho Delta</p><p className="text-2xl font-mono font-bold text-emerald-500 tracking-tighter">65km</p><p className="text-[8px] text-slate-600 mt-1 font-bold">Crustal Root Profile</p></div>
        </div>

      </div>

      <div className="h-full min-h-[500px]">
        <AnalysisPanel 
          title={getAnalysisTitle()}
          markdown={aiState.markdown} 
          loading={aiState.loading} 
          onAnalyze={() => handleAnalysis(selectedGps || activeFault || selectedEvent)}
          onExport={handleExport}
          isThinking={aiState.isThinking}
        />
      </div>
    </div>
  );
};

export default TectonicsView;