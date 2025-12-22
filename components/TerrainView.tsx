
import React, { useState, useMemo, useRef, Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html, Cloud } from '@react-three/drei';
import * as THREE from 'this';
import AnalysisPanel from './AnalysisPanel';
import { generateDeepThinkingInsight } from '../services/geminiService';
import { AiResponse } from '../types';
import { IconMap, IconLayers, IconActivity, IconMountain, IconHistory } from './Icons';

// --- Types ---
interface Poi {
  id: string;
  position: [number, number, number];
  name: string;
  desc: string;
  elevation: string;
  color: string;
}

// --- Constants ---
const POI_DATA: Poi[] = [
  { id: 'summit', position: [0, 0, 3.8], name: 'Summit (Main)', desc: '8,126m - The "Killer Mountain". Peak of the massif.', elevation: '8126m', color: '#f8fafc' },
  { id: 'raikot', position: [3, 3, 2.2], name: 'Raikot Glacier', desc: 'Active fault zone, massive ice volume.', elevation: '6800m', color: '#0ea5e9' },
  { id: 'diamir', position: [-4, 2, 1.8], name: 'Diamir Face', desc: 'Primary expedition staging area.', elevation: '4200m', color: '#10b981' },
  { id: 'rupal', position: [0, -5, 2.8], name: 'Rupal Face', desc: 'Highest vertical wall on Earth (4600m).', elevation: '5000m', color: '#ef4444' },
  { id: 'mazeno', position: [5, -2, 2.1], name: 'Mazeno Ridge', desc: 'Longest ridge line on any 8000er.', elevation: '7100m', color: '#f59e0b' }
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
    grd.addColorStop(0.2, "rgba(200, 200, 200, 0.9)");
    grd.addColorStop(0.5, "rgba(80, 80, 80, 0.4)");
    grd.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 512, 512);

    // 2. Ridge Lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 4;
    for (let i = 0; i < 80; i++) {
        ctx.beginPath();
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        ctx.moveTo(256, 256);
        ctx.bezierCurveTo(256 + (Math.random()-0.5)*150, 256 + (Math.random()-0.5)*150, x, y, x + (Math.random()-0.5)*50, y + (Math.random()-0.5)*50);
        ctx.stroke();
    }

    // 3. Texture Detail
    for (let i = 0; i < 600; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = Math.random() * 12;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.04})`;
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
    showLabels: boolean;
    onSelectPoi: (poi: Poi) => void; 
}> = ({ wireframe, heatmap, exaggeration, showLabels, onSelectPoi }) => {
    
    const displacementMap = useMemo(() => new THREE.CanvasTexture(generateHeightMapTexture()), []);
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.z = state.clock.getElapsedTime() * 0.05; // Slow ambient rotation
        }
    });

    return (
        <group rotation={[-Math.PI / 2, 0, 0]}> 
            <mesh ref={meshRef}>
                <planeGeometry args={[26, 26, 128, 128]} />
                <meshStandardMaterial 
                    color={heatmap ? "#ffffff" : "#64748b"}
                    wireframe={wireframe}
                    displacementMap={displacementMap}
                    displacementScale={5 * exaggeration}
                    roughness={0.7}
                    metalness={0.2}
                    emissive={heatmap ? "#ef4444" : "#000000"}
                    emissiveIntensity={heatmap ? 0.4 : 0}
                    flatShading={!wireframe}
                />
                
                {POI_DATA.map((poi) => (
                    <group key={poi.id} position={[poi.position[0], poi.position[1], 0]}>
                        <Html 
                          position={[0, 0, poi.position[2] * exaggeration + 0.5]} 
                          center 
                          distanceFactor={10}
                          zIndexRange={[100, 0]}
                        >
                            <div 
                              className={`flex flex-col items-center transition-all duration-500 ${showLabels ? 'opacity-100' : 'opacity-0 scale-90 pointer-events-none'}`}
                              onClick={(e) => { e.stopPropagation(); onSelectPoi(poi); }}
                            >
                                <div className="group cursor-pointer flex flex-col items-center">
                                    <div className="flex items-center gap-2 bg-sentinel-900/90 backdrop-blur-md border border-white/20 rounded-lg p-2 shadow-2xl transition-all group-hover:bg-sky-900/80 group-hover:border-sky-400/50 group-hover:-translate-y-1">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: poi.color }}></div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-white uppercase tracking-tighter whitespace-nowrap leading-none">{poi.name}</span>
                                            <span className="text-[9px] font-mono text-sky-400 font-bold mt-0.5">{poi.elevation}</span>
                                        </div>
                                    </div>
                                    <div className="w-px h-6 bg-gradient-to-t from-white/40 to-transparent"></div>
                                    <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse"></div>
                                </div>
                            </div>
                        </Html>
                        
                        {!showLabels && (
                          <Html position={[0, 0, poi.position[2] * exaggeration]} center>
                             <div 
                                onClick={(e) => { e.stopPropagation(); onSelectPoi(poi); }}
                                className="w-2 h-2 bg-sky-500 rounded-full border border-white/50 cursor-pointer hover:scale-150 transition-transform shadow-[0_0_10px_rgba(14,165,233,0.5)]"
                             ></div>
                          </Html>
                        )}
                    </group>
                ))}
            </mesh>
        </group>
    );
};

const AtmosphericLights: React.FC = () => {
    return (
        <>
            <ambientLight intensity={0.4} color="#e2e8f0" />
            <directionalLight position={[20, 10, 20]} intensity={2.0} color="#f8fafc" castShadow />
            <pointLight position={[-15, -15, 10]} intensity={1.5} color="#38bdf8" />
            <pointLight position={[15, -10, 5]} intensity={1.0} color="#f472b6" />
            
            <Stars radius={120} depth={60} count={6000} factor={5} saturation={0} fade speed={0.5} />
            <Cloud position={[-10, 0, 8]} speed={0.2} opacity={0.2} args={[4, 2]} segments={20} bounds={[10, 2, 2]} color="#94a3b8" />
            <Cloud position={[10, 6, 4]} speed={0.2} opacity={0.15} args={[4, 2]} segments={20} bounds={[10, 2, 2]} color="#94a3b8" />
        </>
    );
};

// --- Main Component ---

const TerrainView: React.FC = () => {
    const [wireframe, setWireframe] = useState(false);
    const [heatmap, setHeatmap] = useState(false);
    const [showLabels, setShowLabels] = useState(true);
    const [exaggeration, setExaggeration] = useState(1.5);
    const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);

    const [aiState, setAiState] = useState<AiResponse>({
        markdown: '',
        loading: false,
        isThinking: false
    });

    const handleAnalyze = async (poi: Poi) => {
        setAiState({ markdown: '', loading: true, isThinking: true });
        
        const prompt = `
        **TERRAIN & TOPOGRAPHY ANALYSIS: ${poi.name.toUpperCase()}**
        
        **Feature Data:**
        - Elevation: ${poi.elevation}
        - Classification: ${poi.desc}
        
        **Analysis Requirements:**
        1. **Geomorphology**: Describe the formation processes of this specific feature in the context of the Nanga Parbat Syntaxis.
        2. **Tactical Significance**: Analyze line-of-sight and accessibility for expedition logistics.
        3. **Climate Exposure**: Assess exposure to extreme adiabatic cooling and jet stream turbulence.
        4. **Risk Profile**: Highlight specific objective hazards (serac fall, rockfall, thermal destabilization).

        **Tone:** High-level Scientific Intelligence.
        `;

        try {
            const result = await generateDeepThinkingInsight(prompt);
            setAiState({ markdown: result, loading: false, isThinking: false });
        } catch (e) {
            setAiState({ markdown: "Unable to generate terrain analysis.", loading: false, isThinking: false });
        }
    };

    useEffect(() => {
        if (selectedPoi) {
            handleAnalyze(selectedPoi);
        } else {
            setAiState({ markdown: '', loading: false, isThinking: false });
        }
    }, [selectedPoi?.id]);

    const handleResetScale = () => {
        setExaggeration(1.0);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 h-full overflow-hidden">
            <div className="lg:col-span-2 relative h-[50vh] lg:h-full bg-sentinel-900">
                <Canvas camera={{ position: [0, -25, 20], fov: 40 }}>
                    <Suspense fallback={<Html center><span className="text-white text-xs font-mono animate-pulse uppercase tracking-widest">Compiling 3D Mesh...</span></Html>}>
                         <color attach="background" args={['#020617']} />
                         <fog attach="fog" args={['#020617', 15, 60]} />
                         <AtmosphericLights />
                         <TerrainMesh 
                            wireframe={wireframe} 
                            heatmap={heatmap} 
                            exaggeration={exaggeration}
                            showLabels={showLabels}
                            onSelectPoi={setSelectedPoi}
                         />
                         <OrbitControls 
                            enablePan={true} 
                            enableZoom={true} 
                            minPolarAngle={0} 
                            maxPolarAngle={Math.PI / 1.8}
                            minDistance={5}
                            maxDistance={50}
                            makeDefault
                         />
                    </Suspense>
                </Canvas>

                <div className="absolute top-6 left-6 pointer-events-none">
                    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center relative bg-sentinel-900/50 backdrop-blur-sm">
                        <div className="absolute top-1 text-[8px] font-bold text-sky-400">N</div>
                        <div className="absolute bottom-1 text-[8px] font-bold text-slate-600">S</div>
                        <div className="absolute left-1 text-[8px] font-bold text-slate-600">W</div>
                        <div className="absolute right-1 text-[8px] font-bold text-slate-600">E</div>
                        <div className="w-0.5 h-6 bg-sky-500 rounded-full shadow-[0_0_5px_rgba(14,165,233,0.5)]"></div>
                    </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-4 items-end pointer-events-none">
                     <div className="bg-sentinel-900/95 backdrop-blur-xl p-5 rounded-2xl border border-white/10 pointer-events-auto shadow-2xl flex flex-col gap-5 min-w-[280px]">
                         <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <IconLayers className="w-4 h-4 text-sky-400" />
                                Terrain Simulation Controls
                            </h4>
                         </div>
                         
                         <div className="grid grid-cols-3 gap-3">
                             <button 
                                onClick={() => setWireframe(!wireframe)}
                                className={`flex flex-col items-center gap-2 p-2 rounded-xl border transition-all ${wireframe ? 'bg-sky-500/20 border-sky-400 text-sky-400' : 'bg-sentinel-800 border-white/5 text-slate-500 hover:text-slate-300'}`}
                             >
                                <IconLayers className="w-4 h-4" />
                                <span className="text-[9px] font-bold uppercase">Wireframe</span>
                             </button>
                             <button 
                                onClick={() => setHeatmap(!heatmap)}
                                className={`flex flex-col items-center gap-2 p-2 rounded-xl border transition-all ${heatmap ? 'bg-red-500/20 border-red-400 text-red-400' : 'bg-sentinel-800 border-white/5 text-slate-500 hover:text-slate-300'}`}
                             >
                                <IconActivity className="w-4 h-4" />
                                <span className="text-[9px] font-bold uppercase">Thermal</span>
                             </button>
                             <button 
                                onClick={() => setShowLabels(!showLabels)}
                                className={`flex flex-col items-center gap-2 p-2 rounded-xl border transition-all ${showLabels ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400' : 'bg-sentinel-800 border-white/5 text-slate-500 hover:text-slate-300'}`}
                             >
                                <IconMap className="w-4 h-4" />
                                <span className="text-[9px] font-bold uppercase">Labels</span>
                             </button>
                         </div>

                         <div>
                             <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Vertical Exaggeration</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-sky-400 font-bold bg-sky-400/10 px-1.5 py-0.5 rounded border border-sky-400/20">x{exaggeration.toFixed(1)}</span>
                                    <button 
                                        onClick={handleResetScale}
                                        title="Reset to 1.0x"
                                        className="p-1 hover:bg-sentinel-700 rounded transition-colors text-slate-500 hover:text-white"
                                    >
                                        <IconHistory className="w-3 h-3" />
                                    </button>
                                </div>
                             </div>
                             <input 
                                type="range" min="0.1" max="4.0" step="0.1"
                                value={exaggeration} 
                                onChange={(e) => setExaggeration(Number(e.target.value))}
                                className="w-full h-1.5 bg-sentinel-800 rounded-lg appearance-none cursor-pointer accent-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.2)]"
                             />
                             <div className="flex justify-between mt-1.5">
                                <span className="text-[8px] text-slate-600 font-bold">FLAT</span>
                                <span className="text-[8px] text-slate-600 font-bold">MAX RELIEF</span>
                             </div>
                         </div>
                     </div>

                     <div className="bg-sentinel-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 pointer-events-auto ml-auto text-[10px] text-slate-500 font-mono tracking-tighter shadow-xl">
                        FPS: 60 | TRIS: 32.7k | SCALE: {exaggeration.toFixed(1)}x
                     </div>
                </div>
            </div>

            <div className="lg:col-span-1 h-[50vh] lg:h-full overflow-hidden border-l border-sentinel-800 bg-sentinel-900 flex flex-col">
                <div className="p-6 bg-sentinel-950/50 border-b border-sentinel-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <IconMap className="w-6 h-6 text-emerald-400" />
                            Topographic Intel
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-mono">Geographic Intelligence Unit</p>
                    </div>
                </div>
                
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                    {selectedPoi ? (
                        <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="bg-sentinel-800 p-5 rounded-2xl border border-white/10 mb-6 shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-sky-500 transition-all group-hover:w-2"></div>
                                <div className="flex justify-between items-start mb-3">
                                    <h2 className="text-2xl font-black text-white leading-none tracking-tight">{selectedPoi.name}</h2>
                                    <span className="bg-sky-500/20 text-sky-400 px-3 py-1 rounded-full text-[11px] border border-sky-500/30 font-black">
                                        {selectedPoi.elevation}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed mb-5 border-l-2 border-white/5 pl-4">{selectedPoi.desc}</p>
                                <div className="flex flex-wrap gap-4 text-[10px] uppercase font-black text-slate-500 font-mono">
                                    <span className="flex items-center gap-2 bg-sentinel-950/50 px-2 py-1 rounded border border-white/5"><IconMap className="w-3 h-3 text-sky-500" /> LAT: 35.23°N</span>
                                    <span className="flex items-center gap-2 bg-sentinel-950/50 px-2 py-1 rounded border border-white/5"><IconMap className="w-3 h-3 text-sky-500" /> LON: 74.58°E</span>
                                </div>
                            </div>

                            <div className="flex-1 min-h-[400px]">
                                <AnalysisPanel 
                                    title={`${selectedPoi.name} Profile`}
                                    markdown={aiState.markdown}
                                    loading={aiState.loading}
                                    isThinking={aiState.isThinking}
                                    onAnalyze={() => handleAnalyze(selectedPoi)}
                                    onExport={() => {}}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center border-2 border-dashed border-white/5 rounded-3xl">
                            <div className="w-20 h-20 bg-sentinel-800 rounded-3xl flex items-center justify-center mb-6 shadow-2xl border border-white/5">
                                <IconMountain className="w-10 h-10 opacity-30" />
                            </div>
                            <h4 className="text-white font-bold mb-3 text-lg">Awaiting Target Selection</h4>
                            <p className="text-sm leading-relaxed text-slate-400 max-w-[240px]">Interact with the 3D model and engage a point of interest marker to generate detailed topographic intelligence.</p>
                            
                            <div className="mt-8 flex flex-col items-start gap-3 w-full max-w-[200px]">
                                <div className="flex items-center gap-3 text-[10px] font-mono text-slate-600">
                                    <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                                    <span>ORBITAL RENDER ACTIVE</span>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-mono text-slate-600">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <span>POI LAYER CONNECTED</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TerrainView;
