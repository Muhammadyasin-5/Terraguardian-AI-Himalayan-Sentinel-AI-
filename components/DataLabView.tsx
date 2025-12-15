import React, { useState, useRef } from 'react';
import AnalysisPanel from './AnalysisPanel';
import { generateDeepThinkingInsight } from '../services/geminiService';
import { AiResponse } from '../types';
import { 
  IconUpload, IconFileText, IconTable, IconCheck, IconX, IconCpu, 
  IconLayers, IconBeaker, IconActivity, IconHammer, IconDiamond,
  IconSnowflake, IconAlertTriangle, IconLeaf, IconWind
} from './Icons';

type AnalysisContextType = 'general' | 'structural' | 'mineral' | 'geophysics' | 'glacier' | 'avalanche' | 'ecosystem' | 'weather';

const DataLabView: React.FC = () => {
  const [dataContent, setDataContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [analysisContext, setAnalysisContext] = useState<AnalysisContextType>('general');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [aiState, setAiState] = useState<AiResponse>({
    markdown: '',
    loading: false,
    isThinking: false
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    setFileType(file.type);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setDataContent(content);
    };
    reader.readAsText(file);
  };

  const loadSampleData = (type: AnalysisContextType) => {
      setAnalysisContext(type);
      if (type === 'geophysics') {
        setFileName("sample_seismic_log.csv");
        setFileType("text/csv");
        const sample = `Timestamp,Magnitude,Depth_km,Lat,Long,Region
2024-05-01T08:30:00Z,4.2,12.5,35.2,74.5,Nanga Parbat Massif
2024-05-01T09:15:00Z,3.8,10.2,35.3,74.6,Raikot Fault
2024-05-02T14:20:00Z,5.1,8.5,35.1,74.4,Diamir Flank
2024-05-03T02:10:00Z,2.9,15.0,35.4,74.7,Indus Gorge
2024-05-03T11:45:00Z,4.5,5.2,35.2,74.5,Rupal Face (Shallow)
2024-05-04T16:30:00Z,3.2,11.8,35.3,74.3,Astor Valley`;
        setDataContent(sample);
      } else if (type === 'structural') {
        setFileName("structural_fault_log.csv");
        setFileType("text/csv");
        const sample = `FaultID,Strike,Dip,Rake,Slip_Type,Displacement_m,Depth_km
F1,045,60,90,Reverse,150,2.5
F2,042,55,85,Reverse,120,2.5
F3,315,80,10,Strike-Slip,50,5.0
F4,050,30,90,Thrust,800,8.0
F5,060,25,90,Thrust,1200,9.2`;
        setDataContent(sample);
      } else if (type === 'mineral') {
        setFileName("assay_gold_geochem.csv");
        setFileType("text/csv");
        const sample = `SampleID,Northing,Easting,Au_ppm,Ag_ppm,As_ppm,Cu_ppm,Lithology,Alteration
S-101,3920100,540200,0.05,0.2,12,45,Gneiss,Propylitic
S-102,3920150,540250,1.20,0.8,450,120,Quartz Vein,Sericitic
S-103,3920200,540300,5.50,1.5,1200,85,Shear Zone,Silicic
S-104,3920250,540350,0.10,0.3,45,60,Gneiss,Propylitic
S-105,3920300,540400,0.85,0.5,320,90,Amphibolite,Argillic`;
        setDataContent(sample);
      } else if (type === 'glacier') {
        setFileName("glacier_mass_balance.csv");
        setFileType("text/csv");
        const sample = `Year,Terminus_Retreat_m,Mass_Balance_mwe,ELA_m,Accumulation_Area_Ratio,Mean_Temp_Summer_C
2015,12,-0.45,4800,0.55,8.2
2016,15,-0.60,4850,0.52,8.5
2017,10,-0.30,4820,0.54,8.1
2018,22,-0.95,4900,0.45,9.2
2019,18,-0.75,4880,0.48,8.8
2020,25,-1.10,4950,0.40,9.5
2021,20,-0.85,4920,0.44,9.0
2022,35,-1.45,5050,0.35,10.1`;
        setDataContent(sample);
      } else if (type === 'avalanche') {
        setFileName("snow_profile_log.csv");
        setFileType("text/csv");
        const sample = `Depth_cm,Hardness,Grain_Form,Grain_Size_mm,Temp_C,Layer_Comment
0-15,F,New Snow,0.5,-12,Storm Snow
15-30,4F,Decomposed,0.3,-10,Settled
30-32,F,Surface Hoar,4.0,-10,BURIED WEAK LAYER
32-60,1F,Rounds,0.5,-8,Slab
60-90,P,Melt-Freeze,2.0,-5,Crust
90-120,K,Basal Ice,n/a,-2,Ground Interface`;
        setDataContent(sample);
      } else if (type === 'ecosystem') {
        setFileName("bio_diversity_transect.csv");
        setFileType("text/csv");
        const sample = `Sector_ID,Elevation_m,Vegetation_Index_NDVI,Species_Richness,Key_Indicator_Sighting,Disturbance_Score
T1-Low,2500,0.65,24,Monal Pheasant,Low
T1-Mid,3200,0.45,15,Musk Deer,Moderate
T1-High,4000,0.15,5,Snow Leopard (Scat),Low
T2-Low,2500,0.55,18,None,High (Logging)
T2-Mid,3200,0.35,10,None,High (Grazing)
T2-High,4000,0.10,3,None,Low`;
        setDataContent(sample);
      } else if (type === 'weather') {
        setFileName("station_telemetry_raw.csv");
        setFileType("text/csv");
        const sample = `Timestamp,Temp_C,Wind_Speed_kmh,Wind_Dir,Pressure_hPa,Humidity_%,Precip_Rate_mmh
2024-05-12T00:00:00Z,-15.2,25,NW,480,45,0.0
2024-05-12T06:00:00Z,-14.8,30,NW,482,42,0.0
2024-05-12T12:00:00Z,-8.5,45,W,478,55,1.2
2024-05-12T18:00:00Z,-12.0,60,SW,475,85,4.5
2024-05-13T00:00:00Z,-18.5,85,SW,470,92,8.0
2024-05-13T06:00:00Z,-20.0,75,W,472,88,6.2`;
        setDataContent(sample);
      }
  };

  const clearData = () => {
    setDataContent('');
    setFileName('');
    setFileType('');
    setAiState({ markdown: '', loading: false, isThinking: false });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalysis = async () => {
    if (!dataContent) return;

    setAiState({ ...aiState, loading: true, isThinking: true });

    let contextPrompt = "";
    switch(analysisContext) {
        case 'structural':
            contextPrompt = `
            **CONTEXT: STRUCTURAL GEOLOGY & TECTONICS**
            **Role:** Structural Geologist.
            **Directives:**
            1. **Kinematic Analysis**: Determine dominant stress regimes (compression/extension) from strike/dip data.
            2. **Section Balancing**: Evaluate shortening/extension percentages if fault sequences are present.
            3. **Hazard**: Identify active fault reactivation potential.
            `;
            break;
        case 'mineral':
            contextPrompt = `
            **CONTEXT: MINERAL EXPLORATION**
            **Role:** Exploration Geochemist.
            **Directives:**
            1. **Assay Statistics**: Identify anomalous metal concentrations (>95th percentile).
            2. **Vectoring**: Use alteration/pathfinder ratios to vector towards the deposit core.
            3. **Deposit Model**: Classify likely deposit type (e.g., Orogenic Gold, Porphyry).
            `;
            break;
        case 'geophysics':
            contextPrompt = `
            **CONTEXT: GEOPHYSICS & SEISMOLOGY**
            **Role:** Geophysicist.
            **Directives:**
            1. **Signal Analysis**: Interpret velocity/density contrasts.
            2. **Anomaly Detection**: Highlight potential reservoirs or fault zones.
            3. **Seismic Hazard**: Evaluate magnitude recurrence intervals if applicable.
            `;
            break;
        case 'glacier':
            contextPrompt = `
            **CONTEXT: GLACIOLOGY & HYDROLOGY**
            **Role:** Senior Glaciologist.
            **Directives:**
            1. **Mass Balance**: Analyze the trend of ice loss (m.w.e). Is it accelerating?
            2. **ELA Shift**: Interpret the shift in the Equilibrium Line Altitude.
            3. **Hydrological Impact**: Estimate impact on downstream water yield.
            4. **Forecast**: Predict terminus retreat for the next 5 years based on the trend.
            `;
            break;
        case 'avalanche':
            contextPrompt = `
            **CONTEXT: SNOW SCIENCE & AVALANCHE FORECASTING**
            **Role:** Avalanche Forecaster.
            **Directives:**
            1. **Stratigraphy**: Analyze the snow profile. Identify critical weak layers (e.g., Surface Hoar, Facets).
            2. **Stability**: Interpret 'Hardness' gradients (slab over weak layer structure).
            3. **Risk Level**: Assign a danger rating (Low to Extreme) based on the profile.
            4. **Travel Advice**: Provide specific safety recommendations for travel in this terrain.
            `;
            break;
        case 'weather':
            contextPrompt = `
            **CONTEXT: MOUNTAIN METEOROLOGY**
            **Role:** Atmospheric Scientist.
            **Directives:**
            1. **Synoptic Overview**: Identify the pressure systems/fronts implied by the telemetry.
            2. **Objective Hazards**: Highlight wind chill, storm loading, or visibility issues.
            3. **Flight Window**: Assess feasibility for rotor-wing aviation.
            `;
            break;
        case 'ecosystem':
            contextPrompt = `
            **CONTEXT: ECOLOGY & BIOSPHERE**
            **Role:** Conservation Biologist.
            **Directives:**
            1. **Biodiversity**: Analyze species richness and abundance trends.
            2. **Trophic Health**: Evaluate the presence of key indicator species (predators/prey).
            3. **Disturbance**: Assess the impact of anthropogenic factors (logging/grazing).
            4. **Resilience**: Propose conservation strategies based on the indices.
            `;
            break;
        default:
            contextPrompt = `
            **CONTEXT: GENERAL SCIENTIFIC ANALYSIS**
            1. **Data Identification**: Detect structure and domain.
            2. **Statistical Summary**: Key descriptive stats.
            3. **Interpretation**: Scientific implications.
            `;
            break;
    }

    const prompt = `
      **CUSTOM DATASET ANALYSIS REQUEST**
      
      **Filename:** ${fileName}
      **Data Type:** ${fileType || 'Unknown Text/CSV'}
      
      **Data Content:**
      \`\`\`
      ${dataContent.slice(0, 15000)} 
      \`\`\`
      (Note: Data may be truncated if excessively large).

      ${contextPrompt}
      
      **Output Format:**
      - Markdown structure.
      - Use standard academic referencing for the specific domain selected.
    `;

    try {
      const result = await generateDeepThinkingInsight(prompt);
      setAiState({ markdown: result, loading: false, isThinking: false });
    } catch (error) {
      setAiState({ markdown: "Error processing custom data.", loading: false, isThinking: false });
    }
  };

  const handleExport = () => {
    const report = {
        type: "CUSTOM_DATA_ANALYSIS",
        context: analysisContext,
        timestamp: new Date().toISOString(),
        sourceFile: fileName,
        rawData: dataContent,
        analysis: aiState.markdown
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentinel_datalab_${analysisContext}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full p-6 overflow-hidden">
      {/* Input Column */}
      <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
        
        <div className="bg-sentinel-800 p-6 rounded-xl border border-sentinel-700 shadow-lg flex-shrink-0">
          <div className="mb-6">
             <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <IconCpu className="w-6 h-6 text-purple-400" />
                Data Lab
             </h3>
             <p className="text-slate-400 text-sm">Advanced processing for raw geological and telemetry datasets.</p>
          </div>

          {/* Context Selector */}
          <div className="mb-6">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Analysis Context</label>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                 <button 
                   onClick={() => setAnalysisContext('general')}
                   className={`p-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all ${analysisContext === 'general' ? 'bg-purple-500/20 border-purple-500 text-purple-200' : 'bg-sentinel-900 border-sentinel-700 text-slate-400 hover:bg-sentinel-700'}`}
                 >
                    <IconCpu className="w-4 h-4" /> General
                 </button>
                 <button 
                   onClick={() => setAnalysisContext('structural')}
                   className={`p-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all ${analysisContext === 'structural' ? 'bg-orange-500/20 border-orange-500 text-orange-200' : 'bg-sentinel-900 border-sentinel-700 text-slate-400 hover:bg-sentinel-700'}`}
                 >
                    <IconHammer className="w-4 h-4" /> Structural
                 </button>
                 <button 
                   onClick={() => setAnalysisContext('mineral')}
                   className={`p-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all ${analysisContext === 'mineral' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200' : 'bg-sentinel-900 border-sentinel-700 text-slate-400 hover:bg-sentinel-700'}`}
                 >
                    <IconDiamond className="w-4 h-4" /> Mineral
                 </button>
                 <button 
                   onClick={() => setAnalysisContext('geophysics')}
                   className={`p-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all ${analysisContext === 'geophysics' ? 'bg-sky-500/20 border-sky-500 text-sky-200' : 'bg-sentinel-900 border-sentinel-700 text-slate-400 hover:bg-sentinel-700'}`}
                 >
                    <IconActivity className="w-4 h-4" /> Geophysics
                 </button>
                 <button 
                   onClick={() => setAnalysisContext('glacier')}
                   className={`p-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all ${analysisContext === 'glacier' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200' : 'bg-sentinel-900 border-sentinel-700 text-slate-400 hover:bg-sentinel-700'}`}
                 >
                    <IconSnowflake className="w-4 h-4" /> Glacier
                 </button>
                 <button 
                   onClick={() => setAnalysisContext('avalanche')}
                   className={`p-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all ${analysisContext === 'avalanche' ? 'bg-red-500/20 border-red-500 text-red-200' : 'bg-sentinel-900 border-sentinel-700 text-slate-400 hover:bg-sentinel-700'}`}
                 >
                    <IconAlertTriangle className="w-4 h-4" /> Avalanche
                 </button>
                 <button 
                   onClick={() => setAnalysisContext('weather')}
                   className={`p-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all ${analysisContext === 'weather' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-200' : 'bg-sentinel-900 border-sentinel-700 text-slate-400 hover:bg-sentinel-700'}`}
                 >
                    <IconWind className="w-4 h-4" /> Weather
                 </button>
                 <button 
                   onClick={() => setAnalysisContext('ecosystem')}
                   className={`p-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all ${analysisContext === 'ecosystem' ? 'bg-lime-500/20 border-lime-500 text-lime-200' : 'bg-sentinel-900 border-sentinel-700 text-slate-400 hover:bg-sentinel-700'}`}
                 >
                    <IconLeaf className="w-4 h-4" /> Ecosystem
                 </button>
             </div>
          </div>

          {/* Dropzone */}
          <div 
             className={`border-2 border-dashed rounded-xl p-8 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer group
             ${isDragging 
                ? 'border-purple-500 bg-purple-500/10' 
                : dataContent 
                   ? 'border-emerald-500/50 bg-emerald-500/5'
                   : 'border-sentinel-600 hover:border-purple-400 hover:bg-sentinel-700/50'
             }`}
             onDragOver={handleDragOver}
             onDragLeave={handleDragLeave}
             onDrop={handleDrop}
             onClick={() => !dataContent && fileInputRef.current?.click()}
          >
             <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv,.json,.txt,.log" 
                onChange={handleFileInput}
             />
             
             {dataContent ? (
                 <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-3">
                        <IconCheck className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h4 className="text-white font-bold">{fileName}</h4>
                    <p className="text-xs text-slate-400 mt-1 mb-4">{(dataContent.length / 1024).toFixed(1)} KB loaded</p>
                    <button 
                        onClick={(e) => { e.stopPropagation(); clearData(); }}
                        className="px-4 py-2 bg-sentinel-700 hover:bg-sentinel-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                    >
                        <IconX className="w-3 h-3" /> CLEAR FILE
                    </button>
                 </div>
             ) : (
                 <>
                    <div className="w-12 h-12 bg-sentinel-700 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-500/20 transition-colors">
                        <IconUpload className="w-6 h-6 text-slate-400 group-hover:text-purple-400" />
                    </div>
                    <h4 className="text-slate-200 font-medium group-hover:text-white">Click or Drag File Here</h4>
                    <p className="text-xs text-slate-500 mt-2 max-w-xs">Supports CSV, JSON, TXT logs. Data is processed locally and sent to Gemini for analysis.</p>
                 </>
             )}
          </div>

          {!dataContent && (
             <div className="mt-6">
                 <p className="text-xs text-slate-500 text-center mb-2 uppercase tracking-wider font-bold">Load Sample Datasets</p>
                 <div className="flex flex-wrap justify-center gap-2">
                     <button 
                        onClick={() => loadSampleData('structural')}
                        className="px-3 py-1.5 bg-sentinel-900 border border-sentinel-700 hover:border-orange-400 text-orange-400 text-[10px] rounded-lg transition-colors font-mono"
                     >
                        STRUCTURAL.CSV
                     </button>
                     <button 
                        onClick={() => loadSampleData('mineral')}
                        className="px-3 py-1.5 bg-sentinel-900 border border-sentinel-700 hover:border-emerald-400 text-emerald-400 text-[10px] rounded-lg transition-colors font-mono"
                     >
                        ASSAY_GOLD.CSV
                     </button>
                     <button 
                        onClick={() => loadSampleData('glacier')}
                        className="px-3 py-1.5 bg-sentinel-900 border border-sentinel-700 hover:border-cyan-400 text-cyan-400 text-[10px] rounded-lg transition-colors font-mono"
                     >
                        MASS_BALANCE.CSV
                     </button>
                     <button 
                        onClick={() => loadSampleData('avalanche')}
                        className="px-3 py-1.5 bg-sentinel-900 border border-sentinel-700 hover:border-red-400 text-red-400 text-[10px] rounded-lg transition-colors font-mono"
                     >
                        SNOW_PROFILE.CSV
                     </button>
                     <button 
                        onClick={() => loadSampleData('weather')}
                        className="px-3 py-1.5 bg-sentinel-900 border border-sentinel-700 hover:border-indigo-400 text-indigo-400 text-[10px] rounded-lg transition-colors font-mono"
                     >
                        TELEMETRY.CSV
                     </button>
                      <button 
                        onClick={() => loadSampleData('ecosystem')}
                        className="px-3 py-1.5 bg-sentinel-900 border border-sentinel-700 hover:border-lime-400 text-lime-400 text-[10px] rounded-lg transition-colors font-mono"
                     >
                        ECO_SURVEY.CSV
                     </button>
                 </div>
             </div>
          )}
        </div>

        {/* Data Preview */}
        {dataContent && (
            <div className="bg-sentinel-800 p-6 rounded-xl border border-sentinel-700 shadow-lg flex-1 min-h-[300px] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-white font-bold flex items-center gap-2">
                        {fileName.endsWith('.csv') ? <IconTable className="w-4 h-4 text-emerald-400" /> : <IconFileText className="w-4 h-4 text-sky-400" />}
                        Data Preview
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500 bg-sentinel-900 px-2 py-1 rounded">
                        RAW TEXT
                    </span>
                </div>
                <div className="flex-1 bg-sentinel-900 rounded-lg p-4 overflow-auto border border-sentinel-700 font-mono text-xs text-slate-300 custom-scrollbar max-h-[500px]">
                    <pre className="whitespace-pre-wrap break-all">
                        {dataContent.slice(0, 5000)}
                        {dataContent.length > 5000 && <span className="text-slate-500 block mt-2 italic">... (Truncated for preview)</span>}
                    </pre>
                </div>
            </div>
        )}
      </div>

      {/* Analysis Column */}
      <div className="h-full min-h-[500px]">
        <AnalysisPanel 
          title="Computational Analysis Engine" 
          markdown={aiState.markdown} 
          loading={aiState.loading} 
          onAnalyze={handleAnalysis}
          onExport={handleExport}
          isThinking={aiState.isThinking}
        />
      </div>
    </div>
  );
};

export default DataLabView;