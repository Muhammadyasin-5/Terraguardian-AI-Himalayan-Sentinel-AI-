import React, { useState, useMemo, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html, Cloud } from '@react-three/drei';
import * as THREE from 'three';
import AnalysisPanel from './AnalysisPanel';
import { generateDeepThinkingInsight } from '../services/geminiService';
import { AiResponse } from '../types';
import { IconMap, IconLayers } from './Icons';

// --- Types ---
interface Poi {
  id: string;
  position: [number, number, number];
  name: string;
  desc: string;
  elevation: string;
}

// --- Constants ---
// Adjusted positions to align with the generated heightmap terrain
const POI_DATA: Poi[] = [
  { id: 'summit', position: [0, 0, 3.5], name: 'Summit', desc: '8,126m - The "Killer Mountain"', elevation: '8126m' },
  { id: 'raikot', position: [3, 3, 2], name: 'Raikot Face', desc: 'Active fault zone, extreme relief.', elevation: '6800m' },
  { id: 'diamir', position: [-4, 2, 1.5], name: 'Diamir Face', desc: 'Primary expedition staging area.', elevation: '4200m' },
  { id: 'rupal', position: [0, -5, 2.5], name: 'Rupal Face', desc: 'Highest vertical wall on Earth (4600m).', elevation: '5000m' },
  { id: 'mazeno', position: [5, -2, 1.8], name: 'Mazeno Ridge', desc: 'Longest ridge line on any 8000er.', elevation: '7100m' }
];

// --- Helper Functions ---
function generateHeightMapTexture(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Background (Lowlands)
    ctx.fillStyle = '#020617'; 
    ctx.fillRect(0, 0, 512, 512);

    // 1. Main Peak Complex (Radial Gradient)
    const grd = ctx.createRadialGradient(256, 256, 0, 256, 256, 300);
    grd.addColorStop(0, "rgba(255, 255, 255, 1)");
    grd.addColorStop(0.2, "rgba(180, 180, 180, 0.8)");
    grd.addColorStop(0.5, "rgba(60, 60, 60, 0.4)");
    grd.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 512, 512);

    // 2. Ridge Lines (White noise strokes)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 100; i++) {
        ctx.beginPath();
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        ctx.moveTo(256, 256); // Radiate from center
        ctx.bezierCurveTo(256 + (Math.random()-0.5)*100, 256 + (Math.random()-0.5)*100, x, y, x + (Math.random()-0.5)*50, y + (Math.random()-0.5)*50);
        ctx.stroke();
    }

    // 3. Perlin-ish Noise (Random Circles for ruggedness)
    for (let i = 0; i < 500; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = Math.random() * 10;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.05})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    return canvas;
}

// --- 3D Components ---

const TerrainMesh: React.FC<{ 
    wireframe: boolean; 
    heatmap: boolean; 
    exaggeration: number; 
    onSelectPoi: (poi: Poi) => void; 
}> = ({ wireframe, heatmap, exaggeration, onSelectPoi }) => {
    
    const displacementMap = useMemo(() => new THREE.CanvasTexture(generateHeightMapTexture()), []);
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.z += 0.001; // Slow rotation
        }
    });

    return (
        // Rotate -90 deg on X to make the plane flat (Z becomes Up)
        <group rotation={[-Math.PI / 2, 0, 0]}> 
            <mesh ref={meshRef} position={[0, 0, 0]}>
                <planeGeometry args={[24, 24, 128, 128]} />
                <meshStandardMaterial 
                    color={heatmap ? "#ffffff" : "#94a3b8"}
                    wireframe={wireframe}
                    displacementMap={displacementMap}
                    displacementScale={4 * exaggeration}
                    roughness={0.6}
                    metalness={0.1}
                    emissive={heatmap ? "#ef4444" : "#000000"}
                    emissiveIntensity={heatmap ? 0.3 : 0}
                    flatShading={true} // Low poly look
                />
                
                {/* POI Markers attached to the rotating mesh */}
                {POI_DATA.map((poi) => (
                    <group key={poi.id} position={[poi.position[0], poi.position[1], 0]}>
                        {/* 
                           Note on positioning:
                           The plane is on XY local. Displacement is along Z local.
                           Markers are placed at XY local.
                           We use Html to project text. We offset Z local to float above terrain.
                           The parent mesh rotates around Z local (which is Y world).
                        */}
                        <Html position={[0, 0, poi.position[2]]} center zIndexRange={[100, 0]} distanceFactor={15}>
                            <div className="group relative cursor-pointer" onClick={(e) => { e.stopPropagation(); onSelectPoi(poi); }}>
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 bg-sky-500 rounded-full border border-white shadow-[0_0_10px_rgba(14,165,233,0.8)] animate-pulse group-hover:scale-150 transition-transform"></div>
                                    <div className="mt-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded border border-white/10 backdrop-blur-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-mono">
                                        {poi.name} <span className="text-sky-300">{poi.elevation}</span>
                                    </div>
                                </div>
                            </div>
                        </Html>
                    </group>
                ))}
            </mesh>
        </group>
    );
};

const AtmosphericLights: React.FC = () => {
    return (
        <>
            <ambientLight intensity={0.3} color="#64748b" />
            <directionalLight position={[10, 5, 10]} intensity={1.5} color="#e0f2fe" castShadow />
            <pointLight position={[-10, -10, 5]} intensity={0.8} color="#38bdf8" />
            <pointLight position={[10, -5, 2]} intensity={0.5} color="#f472b6" />
            
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <Cloud position={[-8, 0, 5]} speed={0.1} opacity={0.3} args={[3, 2]} segments={20} bounds={[10, 2, 2]} color="#cbd5e1" />
            <Cloud position={[8, 5, 2]} speed={0.1} opacity={0.2} args={[3, 2]} segments={20} bounds={[10, 2, 2]} color="#cbd5e1" />
        </>
    );
};

// --- Main Component ---

const TerrainView: React.FC = () => {
    const [wireframe, setWireframe] = useState(false);
    const [heatmap, setHeatmap] = useState(false);
    const [exaggeration, setExaggeration] = useState(1.0);
    const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);

    const [aiState, setAiState] = useState<AiResponse>({
        markdown: '',
        loading: false,
        isThinking: false
    });

    const handleAnalyze = async () => {
        if (!selectedPoi) return;

        setAiState({ markdown: '', loading: true, isThinking: true });
        
        const prompt = `
        **TERRAIN & TOPOGRAPHY ANALYSIS: ${selectedPoi.name.toUpperCase()}**
        
        **Feature Data:**
        - Elevation: ${selectedPoi.elevation}
        - Classification: ${selectedPoi.desc}
        
        **Analysis Requirements:**
        1. **Geomorphology**: Describe the formation processes of this specific feature (e.g., glacial carving, tectonic uplift).
        2. **Tactical Significance**: Analyze line-of-sight advantages and accessibility challenges for logistics.
        3. **Climate Exposure**: Assess exposure to jet stream winds and solar radiation based on its elevation and aspect.
        4. **Risk Profile**: Identify specific objective hazards (serac fall, rockfall) pertinent to this location.

        **Tone:** Military Geographic Intelligence.
        `;

        try {
            const result = await generateDeepThinkingInsight(prompt);
            setAiState({ markdown: result, loading: false, isThinking: false });
        } catch (e) {
            setAiState({ markdown: "Unable to generate terrain analysis.", loading: false, isThinking: false });
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 h-full overflow-hidden">
            {/* 3D Canvas Area */}
            <div className="lg:col-span-2 relative h-[50vh] lg:h-full bg-black">
                <Canvas camera={{ position: [0, -20, 15], fov: 35 }}>
                    <Suspense fallback={<Html center><span className="text-white text-xs animate-pulse">Initializing Terrain...</span></Html>}>
                         <color attach="background" args={['#020617']} />
                         <fog attach="fog" args={['#020617', 10, 50]} />
                         <AtmosphericLights />
                         <TerrainMesh 
                            wireframe={wireframe} 
                            heatmap={heatmap} 
                            exaggeration={exaggeration}
                            onSelectPoi={setSelectedPoi}
                         />
                         <OrbitControls 
                            enablePan={false} 
                            enableZoom={true} 
                            minPolarAngle={Math.PI / 4} 
                            maxPolarAngle={Math.PI / 2}
                            minDistance={10}
                            maxDistance={40}
                         />
                    </Suspense>
                </Canvas>

                {/* Overlay Controls */}
                <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-4 items-end pointer-events-none">
                     <div className="bg-sentinel-900/90 backdrop-blur-md p-4 rounded-xl border border-sentinel-700 pointer-events-auto shadow-2xl">
                         <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                             <IconLayers className="w-4 h-4 text-sky-400" />
                             Visualization Controls
                         </h4>
                         
                         <div className="flex items-center gap-4 mb-4">
                             <label className="flex items-center gap-2 cursor-pointer group">
                                 <input type="checkbox" checked={wireframe} onChange={(e) => setWireframe(e.target.checked)} className="hidden" />
                                 <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${wireframe ? 'bg-sky-500' : 'bg-sentinel-700'}`}>
                                     <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${wireframe ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                 </div>
                                 <span className="text-xs text-slate-400 group-hover:text-white">Wireframe</span>
                             </label>

                             <label className="flex items-center gap-2 cursor-pointer group">
                                 <input type="checkbox" checked={heatmap} onChange={(e) => setHeatmap(e.target.checked)} className="hidden" />
                                 <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${heatmap ? 'bg-red-500' : 'bg-sentinel-700'}`}>
                                     <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${heatmap ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                 </div>
                                 <span className="text-xs text-slate-400 group-hover:text-white">Thermal Mode</span>
                             </label>
                         </div>

                         <div>
                             <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-slate-400">Vertical Exaggeration</span>
                                <span className="text-[10px] font-mono text-sky-400">x{exaggeration.toFixed(1)}</span>
                             </div>
                             <input 
                                type="range" min="0.5" max="2.5" step="0.1"
                                value={exaggeration} 
                                onChange={(e) => setExaggeration(Number(e.target.value))}
                                className="w-full h-1.5 bg-sentinel-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                             />
                         </div>
                     </div>

                     <div className="bg-sentinel-900/90 backdrop-blur-md p-3 rounded-xl border border-sentinel-700 pointer-events-auto ml-auto">
                         <div className="flex items-center gap-2 text-xs text-slate-400">
                             <IconMap className="w-4 h-4" />
                             <span>Navigate: Left Click (Rotate) • Scroll (Zoom)</span>
                         </div>
                     </div>
                </div>
            </div>

            {/* Analysis Panel Sidebar */}
            <div className="lg:col-span-1 h-[50vh] lg:h-full overflow-hidden border-l border-sentinel-800 bg-sentinel-900 flex flex-col">
                <div className="p-4 bg-sentinel-950/50 border-b border-sentinel-800">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <IconMap className="w-5 h-5 text-emerald-400" />
                        Topographic Intel
                    </h3>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                    {selectedPoi ? (
                        <div className="h-full flex flex-col">
                            <div className="bg-sentinel-800 p-4 rounded-xl border border-sentinel-700 mb-4 animate-in fade-in slide-in-from-top-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h2 className="text-xl font-bold text-white">{selectedPoi.name}</h2>
                                    <span className="bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded text-xs border border-sky-500/20 font-mono">
                                        {selectedPoi.elevation}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-400 mb-3">{selectedPoi.desc}</p>
                                <div className="flex gap-2 text-[10px] uppercase font-bold text-slate-500">
                                    <span className="flex items-center gap-1"><IconMap className="w-3 h-3" /> Lat: 35.23°N</span>
                                    <span className="flex items-center gap-1"><IconMap className="w-3 h-3" /> Long: 74.58°E</span>
                                </div>
                            </div>

                            <div className="flex-1 min-h-[300px]">
                                <AnalysisPanel 
                                    title="Terrain Feature Analysis"
                                    markdown={aiState.markdown}
                                    loading={aiState.loading}
                                    isThinking={aiState.isThinking}
                                    onAnalyze={handleAnalyze}
                                    onExport={() => {}}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
                            <IconMap className="w-16 h-16 mb-4 opacity-20" />
                            <h4 className="text-white font-bold mb-2">Select a Feature</h4>
                            <p className="text-sm">Explore the 3D model and click on any marked point of interest (blue markers) to initiate a topographic analysis.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TerrainView;